import { useCallback, useMemo, useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { ScreenState } from "@/components/screen-state";
import { EventoAgendaList } from "@/components/eventos/evento-agenda-list";
import { EventoCreateModal, type EventoFormState } from "@/components/eventos/evento-create-modal";
import { EventoFab } from "@/components/eventos/evento-fab";
import { EventoMonthCalendar } from "@/components/eventos/evento-month-calendar";
import { EventoTimeline } from "@/components/eventos/evento-timeline";
import { EventoViewTabs } from "@/components/eventos/evento-view-tabs";
import { MODULE_COLORS } from "@/constants/module-colors";
import { useRunCoreMutation } from "@/hooks/use-run-core-mutation";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";
import type { EventoViewId, StatusFilterId } from "@/lib/eventos/constants";
import { toDateKey } from "@/lib/eventos/date-utils";
import type { EventoItem } from "@/lib/eventos/types";
import { cancelEventReminder, scheduleEventReminder } from "@/lib/notifications";
import { trpc } from "@/lib/trpc";

/**
 * Centro de Eventos (Etapa 1) — Calendário mensal · Agenda · Timeline.
 * Preserva CRUD, filtros de status, lembretes e offline via useRunCoreMutation.
 */
export default function CalendarioScreen() {
  const { runMutation } = useRunCoreMutation();
  const { cacheInput, tenantReady } = useTenantQueryScope();
  const {
    data: eventos = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = trpc.coreData.calendario.list.useQuery(cacheInput, { enabled: tenantReady });

  const [view, setView] = useState<EventoViewId>("calendario");
  const [filter, setFilter] = useState<StatusFilterId>("todos");
  const [month, setMonth] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(() => toDateKey(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [formInitial, setFormInitial] = useState<Partial<EventoFormState> | undefined>();
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback((dateKey?: string) => {
    setFormInitial(dateKey ? { dataProgramada: dateKey } : undefined);
    setModalVisible(true);
  }, []);

  const handleSave = async (form: EventoFormState) => {
    if (!form.titulo.trim() || !form.dataProgramada.trim()) {
      Alert.alert("Atenção", "Preencha o título e a data do evento.");
      return;
    }
    setSaving(true);
    try {
      const result = await runMutation("evento", "create", {
        titulo: form.titulo.trim(),
        tipoAtividade: form.tipoAtividade as EventoItem["tipoAtividade"],
        prioridade: form.prioridade as NonNullable<EventoItem["prioridade"]>,
        dataProgramada: form.dataProgramada,
        descricao: form.descricao.trim() || undefined,
        status: "pendente",
        lembreteAtivo: form.lembreteAtivo,
      });
      if (!result.queued && form.lembreteAtivo && result.result) {
        const eventId = Number(result.result);
        const dataStr = form.dataProgramada.includes("T")
          ? form.dataProgramada
          : `${form.dataProgramada}T08:00:00`;
        await scheduleEventReminder({
          eventId,
          titulo: form.titulo.trim(),
          dataProgramada: dataStr,
          prioridade: form.prioridade,
        });
      }
      setModalVisible(false);
      setFormInitial(undefined);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível salvar o evento.";
      Alert.alert("Erro", message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: EventoItem) => {
    const currentStatus = item.status ?? "pendente";
    const newStatus = currentStatus === "concluido" ? "pendente" : "concluido";
    try {
      const result = await runMutation("evento", "update", {
        id: item.id,
        data: { status: newStatus as "pendente" | "concluido" },
      });
      if (result.queued) return;
      if (newStatus === "concluido") {
        await cancelEventReminder(item.id);
      } else if (item.dataProgramada) {
        const dataStr =
          item.dataProgramada instanceof Date
            ? item.dataProgramada.toISOString()
            : String(item.dataProgramada);
        await scheduleEventReminder({
          eventId: item.id,
          titulo: item.titulo,
          dataProgramada: dataStr,
        });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível atualizar.";
      Alert.alert("Erro", message);
    }
  };

  const handleDelete = (item: EventoItem) => {
    Alert.alert("Excluir evento?", `"${item.titulo}"`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await runMutation("evento", "delete", { id: item.id });
            if (!result.queued) await cancelEventReminder(item.id);
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Não foi possível excluir.";
            Alert.alert("Erro", message);
          }
        },
      },
    ]);
  };

  const sortedEventos = useMemo(() => {
    return [...eventos].sort((a, b) => {
      const da = a.dataProgramada ? new Date(a.dataProgramada).getTime() : 0;
      const db = b.dataProgramada ? new Date(b.dataProgramada).getTime() : 0;
      return da - db;
    });
  }, [eventos]);

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Eventos"
        subtitle="Centro de planejamento agrícola"
        accentColor={MODULE_COLORS.eventos}
      />

      <EventoViewTabs value={view} onChange={setView} />

      {isError ? (
        <ScreenState
          status="error"
          message={error?.message ?? "Falha ao carregar eventos."}
          onAction={() => refetch()}
        />
      ) : (
        <View style={styles.body}>
          {view === "calendario" ? (
            isLoading ? (
              <ScreenState status="loading" message="Carregando calendário…" />
            ) : (
              <EventoMonthCalendar
                eventos={sortedEventos}
                month={month}
                selectedKey={selectedKey}
                onMonthChange={setMonth}
                onSelectDay={setSelectedKey}
                onToggleStatus={toggleStatus}
                onDelete={handleDelete}
                onCreateForDay={(key) => openCreate(key)}
              />
            )
          ) : null}

          {view === "agenda" ? (
            <EventoAgendaList
              eventos={sortedEventos}
              filter={filter}
              onFilterChange={setFilter}
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              onToggleStatus={toggleStatus}
              onDelete={handleDelete}
              onCreate={() => openCreate()}
              loading={isLoading}
            />
          ) : null}

          {view === "timeline" ? (
            <EventoTimeline
              eventos={sortedEventos}
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              onToggleStatus={toggleStatus}
              onDelete={handleDelete}
              onCreate={() => openCreate()}
              loading={isLoading}
            />
          ) : null}
        </View>
      )}

      <EventoFab onPress={() => openCreate(selectedKey ?? undefined)} />

      <EventoCreateModal
        visible={modalVisible}
        initial={formInitial}
        saving={saving}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
