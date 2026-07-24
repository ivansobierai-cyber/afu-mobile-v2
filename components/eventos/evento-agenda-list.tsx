import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { ScreenState } from "@/components/screen-state";
import { EventoCard } from "@/components/eventos/evento-card";
import { STATUS_FILTERS, type StatusFilterId } from "@/lib/eventos/constants";
import type { EventoItem } from "@/lib/eventos/types";

type Props = {
  eventos: EventoItem[];
  filter: StatusFilterId;
  onFilterChange: (filter: StatusFilterId) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onToggleStatus: (item: EventoItem) => void;
  onDelete: (item: EventoItem) => void;
  onCreate: () => void;
  loading?: boolean;
};

function matchesFilter(item: EventoItem, filter: StatusFilterId): boolean {
  if (filter === "pendente") {
    return item.status === "pendente" || item.status === "em_andamento";
  }
  if (filter === "concluido") {
    return item.status === "concluido" || item.status === "cancelado";
  }
  return true;
}

/** Agenda clássica com filtros Todos / Pendentes / Concluídos. */
export function EventoAgendaList({
  eventos,
  filter,
  onFilterChange,
  refreshing,
  onRefresh,
  onToggleStatus,
  onDelete,
  onCreate,
  loading,
}: Props) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return eventos.filter((e) => {
      if (!matchesFilter(e, filter)) return false;
      if (!q) return true;
      return (
        e.titulo.toLowerCase().includes(q) ||
        (e.descricao ?? "").toLowerCase().includes(q) ||
        (e.tipoAtividade ?? "").toLowerCase().includes(q)
      );
    });
  }, [eventos, filter, query]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 12, paddingTop: 8, backgroundColor: colors.surface }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Pesquisar eventos…"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Pesquisar eventos"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 14,
            color: colors.foreground,
            marginBottom: 4,
          }}
        />
      </View>
      <View
        style={[
          styles.filterBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterTab,
                { borderBottomColor: active ? colors.primary : "transparent" },
              ]}
              onPress={() => onFilterChange(f.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: active ? colors.primary : colors.muted,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ScreenState status="loading" message="Carregando agenda…" />
      ) : filtered.length === 0 ? (
        <ScreenState
          status="empty"
          title="Nenhum evento encontrado"
          message='Toque em "Novo" para adicionar um evento ao calendário agrícola.'
          actionLabel="Criar evento"
          onAction={onCreate}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <EventoCard
              item={item}
              onToggleStatus={() => onToggleStatus(item)}
              onDelete={() => onDelete(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
  },
});
