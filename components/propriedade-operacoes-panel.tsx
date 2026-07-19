import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenState } from "@/components/screen-state";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useCoreOfflineSync } from "@/hooks/use-core-offline-sync";
import {
  TAREFA_STATUS_LABELS,
  type TarefaStatus,
} from "@/lib/propriedades/tarefa-status";

const TIPOS = [
  { id: "plantio", label: "Plantio" },
  { id: "irrigacao", label: "Irrigação" },
  { id: "adubacao", label: "Adubação" },
  { id: "pulverizacao", label: "Pulverização" },
  { id: "monitoramento", label: "Monitoramento" },
  { id: "vistoria", label: "Vistoria" },
  { id: "colheita", label: "Colheita" },
  { id: "manutencao", label: "Manutenção" },
  { id: "outro", label: "Outro" },
] as const;

const PRIORIDADES = ["baixa", "normal", "alta", "critica"] as const;

const STATUS_COLOR: Record<string, string> = {
  planejada: "#6B7C6E",
  liberada: "#1565C0",
  em_execucao: "#2E7D32",
  pausada: "#EF6C00",
  concluida: "#558B2F",
  aprovada: "#1B5E20",
  cancelada: "#C62828",
  bloqueada: "#B71C1C",
};

type Props = {
  propriedadeId: number;
  terrenos: { id: number; nome: string }[];
  safraId?: number;
  readOnly?: boolean;
};

export function PropriedadeOperacoesPanel({
  propriedadeId,
  terrenos,
  safraId,
  readOnly = false,
}: Props) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { queueMutation, isOnline, pending, isSyncing } = useCoreOfflineSync();
  const [filtro, setFiltro] = useState<"abertas" | "todas">("abertas");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [instrucoes, setInstrucoes] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["id"]>("monitoramento");
  const [prioridade, setPrioridade] = useState<(typeof PRIORIDADES)[number]>("normal");
  const [dataPrevista, setDataPrevista] = useState(() => new Date().toISOString().slice(0, 10));
  const [terrenoId, setTerrenoId] = useState<number | null>(null);

  const { data: tarefas = [], isLoading, isError, refetch } =
    trpc.coreData.tarefas.listByPropriedade.useQuery({
      propriedadeId,
      abertasOnly: filtro === "abertas",
      safraId,
    });

  const transition = trpc.coreData.tarefas.transition.useMutation({
    onSuccess: async () => {
      await utils.coreData.tarefas.listByPropriedade.invalidate({ propriedadeId });
      await utils.coreData.tarefas.resumoHoje.invalidate({ propriedadeId });
    },
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 8,
        },
        chip: {
          borderRadius: 10,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginRight: 6,
          marginBottom: 6,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          marginBottom: 10,
          minHeight: 44,
        },
        actionBtn: {
          minHeight: 40,
          paddingHorizontal: 12,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 6,
        },
      }),
    [colors],
  );

  const runTransition = (id: number, status: TarefaStatus, extra?: { motivoCancelamento?: string }) => {
    if (readOnly) {
      Alert.alert("Somente leitura", "Safra encerrada — dados disponíveis somente para consulta.");
      return;
    }
    transition.mutate(
      { id, status, ...extra },
      {
        onError: (e) => Alert.alert("Erro", e.message),
      },
    );
  };

  const handleCreate = async () => {
    if (!titulo.trim()) {
      Alert.alert("Atenção", "Informe o título da tarefa.");
      return;
    }
    setSaving(true);
    try {
      const clientMutationId = `tarefa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const result = await queueMutation("tarefa", "create", {
        propriedadeId,
        safraId,
        terrenoId: terrenoId ?? undefined,
        tipoOperacao: tipo,
        titulo: titulo.trim(),
        instrucoes: instrucoes.trim() || undefined,
        prioridade,
        dataPrevista: new Date(dataPrevista + "T12:00:00").toISOString(),
        clientMutationId,
      });
      setModalOpen(false);
      setTitulo("");
      setInstrucoes("");
      setTerrenoId(null);
      await utils.coreData.tarefas.listByPropriedade.invalidate({ propriedadeId });
      await utils.coreData.tarefas.resumoHoje.invalidate({ propriedadeId });
      if (result.queued) {
        Alert.alert("Fila offline", "Tarefa salva localmente e será sincronizada ao reconectar.");
      }
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível criar a tarefa.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <ScreenState status="loading" compact message="Carregando operações…" />;
  if (isError) {
    return <ScreenState status="error" compact onAction={() => void refetch()} />;
  }

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>Operações</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
            {isOnline ? (isSyncing ? "Sincronizando…" : "Online") : "Offline"}
            {pending > 0 ? ` · ${pending} pendente(s)` : ""}
          </Text>
        </View>
        {!readOnly ? (
          <TouchableOpacity
            onPress={() => setModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Nova tarefa"
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              minHeight: 40,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconSymbol name="plus" size={14} color="#FFF" />
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>Nova tarefa</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600", maxWidth: 140 }}>
            Somente leitura
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        {(
          [
            { id: "abertas" as const, label: "Abertas" },
            { id: "todas" as const, label: "Todas" },
          ] as const
        ).map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFiltro(f.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: filtro === f.id }}
            style={[
              styles.chip,
              {
                backgroundColor: filtro === f.id ? colors.primary : colors.surface,
                borderColor: filtro === f.id ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={{ color: filtro === f.id ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 12 }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {readOnly ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            fontWeight: "600",
            marginBottom: 10,
            lineHeight: 17,
          }}
        >
          Safra encerrada — dados disponíveis somente para consulta.
        </Text>
      ) : null}

      {tarefas.length === 0 ? (
        <ScreenState
          status="empty"
          compact
          title="Nenhuma operação"
          message={
            readOnly
              ? "Não há tarefas nesta safra histórica."
              : "Crie uma tarefa para plantio, vistoria, irrigação ou outras atividades."
          }
          actionLabel={readOnly ? undefined : "Nova tarefa"}
          onAction={readOnly ? undefined : () => setModalOpen(true)}
        />
      ) : (
        tarefas.map((t) => {
          const status = t.status as TarefaStatus;
          const color = STATUS_COLOR[status] ?? colors.muted;
          const terrenoNome = terrenos.find((x) => x.id === t.terrenoId)?.nome;
          const atrasada =
            STATUS_ABERTOS_LOCAL.includes(status) && new Date(t.dataPrevista) < startOfToday();
          return (
            <View key={t.id} style={styles.card} accessibilityLabel={`Tarefa ${t.titulo}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{t.titulo}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {TIPOS.find((x) => x.id === t.tipoOperacao)?.label ?? t.tipoOperacao}
                    {terrenoNome ? ` · ${terrenoNome}` : ""}
                    {" · "}
                    {new Date(t.dataPrevista).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
                <View style={{ backgroundColor: color + "22", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color }}>{TAREFA_STATUS_LABELS[status]}</Text>
                </View>
              </View>
              {atrasada ? (
                <Text style={{ fontSize: 12, color: "#C62828", fontWeight: "700", marginTop: 6 }}>Atrasada</Text>
              ) : null}
              {t.instrucoes ? (
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }} numberOfLines={2}>
                  {t.instrucoes}
                </Text>
              ) : null}

              {!readOnly ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                {status === "planejada" || status === "liberada" ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => runTransition(t.id, "em_execucao")}
                    accessibilityRole="button"
                    accessibilityLabel="Iniciar tarefa"
                  >
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Iniciar</Text>
                  </TouchableOpacity>
                ) : null}
                {status === "em_execucao" ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#EF6C00" }]}
                      onPress={() => runTransition(t.id, "pausada")}
                      accessibilityRole="button"
                      accessibilityLabel="Pausar tarefa"
                    >
                      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Pausar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.success }]}
                      onPress={() => runTransition(t.id, "concluida")}
                      accessibilityRole="button"
                      accessibilityLabel="Concluir tarefa"
                    >
                      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Concluir</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
                {status === "pausada" ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => runTransition(t.id, "em_execucao")}
                      accessibilityRole="button"
                      accessibilityLabel="Retomar tarefa"
                    >
                      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Retomar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.success }]}
                      onPress={() => runTransition(t.id, "concluida")}
                      accessibilityRole="button"
                      accessibilityLabel="Concluir tarefa"
                    >
                      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Concluir</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
                {status === "concluida" ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#1B5E20" }]}
                    onPress={() => runTransition(t.id, "aprovada")}
                    accessibilityRole="button"
                    accessibilityLabel="Aprovar tarefa"
                  >
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>Aprovar</Text>
                  </TouchableOpacity>
                ) : null}
                {STATUS_ABERTOS_LOCAL.includes(status) ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                    onPress={() =>
                      Alert.alert("Cancelar tarefa", "Informe o motivo no próximo passo.", [
                        { text: "Voltar", style: "cancel" },
                        {
                          text: "Cancelar",
                          style: "destructive",
                          onPress: () =>
                            runTransition(t.id, "cancelada", {
                              motivoCancelamento: "Cancelada pelo usuário",
                            }),
                        },
                      ])
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar tarefa"
                  >
                    <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 12 }}>Cancelar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              ) : null}
            </View>
          );
        })
      )}

      <Modal visible={modalOpen && !readOnly} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "90%",
              padding: 20,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Nova tarefa</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} accessibilityRole="button" accessibilityLabel="Fechar">
                <IconSymbol name="xmark" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Título</Text>
              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ex: Vistoria Talhão Norte"
                placeholderTextColor={colors.muted}
              />
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Tipo</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                {TIPOS.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setTipo(t.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: tipo === t.id ? colors.primary : colors.surface,
                        borderColor: tipo === t.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: tipo === t.id ? "#FFF" : colors.foreground, fontSize: 12 }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Prioridade</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                {PRIORIDADES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPrioridade(p)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: prioridade === p ? colors.primary : colors.surface,
                        borderColor: prioridade === p ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: prioridade === p ? "#FFF" : colors.foreground, fontSize: 12 }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {terrenos.length > 0 ? (
                <>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Talhão (opcional)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                    <TouchableOpacity
                      onPress={() => setTerrenoId(null)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: terrenoId === null ? colors.primary : colors.surface,
                          borderColor: terrenoId === null ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: terrenoId === null ? "#FFF" : colors.foreground, fontSize: 12 }}>Geral</Text>
                    </TouchableOpacity>
                    {terrenos.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setTerrenoId(t.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: terrenoId === t.id ? colors.primary : colors.surface,
                            borderColor: terrenoId === t.id ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: terrenoId === t.id ? "#FFF" : colors.foreground, fontSize: 12 }}>
                          {t.nome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Data prevista</Text>
              <TextInput
                style={styles.input}
                value={dataPrevista}
                onChangeText={setDataPrevista}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.muted}
              />
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Instruções</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                value={instrucoes}
                onChangeText={setInstrucoes}
                placeholder="Como executar…"
                placeholderTextColor={colors.muted}
                multiline
              />
              <TouchableOpacity
                onPress={handleCreate}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Salvar tarefa"
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: saving ? 0.6 : 1,
                  marginBottom: 20,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Salvar tarefa</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const STATUS_ABERTOS_LOCAL: TarefaStatus[] = [
  "planejada",
  "liberada",
  "em_execucao",
  "pausada",
  "bloqueada",
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
