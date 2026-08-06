import { useEffect, useMemo, useState } from "react";
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
  useWindowDimensions,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenState } from "@/components/screen-state";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  TIPO_OPERACAO_AGRICOLA,
  OPERACAO_AGRICOLA_LABELS,
  assertOperacoesPropriedadeScope,
  canShowCreateOperacaoButton,
  filterOperacoesAgricolas,
  groupOperacoesByStatus,
  historicalSafraMessage,
  labelTipoOperacao,
  OPERACAO_ORIGEM_LABELS,
  OPERACAO_STATUS_LABELS,
  OPERACAO_STATUS_VALUES,
  type OperacaoListItem,
  type OperacaoStatusUi,
  type OperacoesClientFilters,
  type OperacoesViewMode,
  resolveDefaultOperacoesViewMode,
  resolveContextualOperacaoCulturaId,
  shouldShowOperacoesEmptyState,
} from "@/lib/operacoes";
import { OperacaoAgricolaDetailModal } from "@/components/operacao-agricola-detail-modal";

type Props = {
  propriedadeId: number;
  terrenos: { id: number; nome: string }[];
  cultivos: { id: number; nomeCultura: string; terrenoId: number | null }[];
  safraId?: number;
  readOnly?: boolean;
  canWriteOperations?: boolean;
  canApproveOperations?: boolean;
  prefillCulturaId?: number;
  prefillTerrenoId?: number;
  openCreateNonce?: number;
  onCreateOpened?: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  planejada: "#6B7C6E",
  liberada: "#5D4037",
  reaberta: "#EF6C00",
  em_execucao: "#1565C0",
  pausada: "#F9A825",
  concluida: "#2E7D32",
  aprovada: "#1B5E20",
  bloqueada: "#6A1B9A",
  cancelada: "#C62828",
};

export function PropriedadeOperacoesAgricolasPanel({
  propriedadeId,
  terrenos,
  cultivos,
  safraId,
  readOnly = false,
  canWriteOperations = false,
  canApproveOperations = false,
  prefillCulturaId,
  prefillTerrenoId,
  openCreateNonce = 0,
  onCreateOpened,
}: Props) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isNarrow = width < 720;
  const utils = trpc.useUtils();

  const [viewMode, setViewMode] = useState<OperacoesViewMode>(() =>
    resolveDefaultOperacoesViewMode(isNarrow),
  );
  const [filters, setFilters] = useState<OperacoesClientFilters>({
    safraId: safraId ?? null,
    tipoOperacao: "todos",
    status: "todos",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [detailOperacao, setDetailOperacao] = useState<OperacaoListItem | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPO_OPERACAO_AGRICOLA)[number]>("monitoramento");
  const [dataPrevista, setDataPrevista] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSafraId, setFormSafraId] = useState<number | undefined>(safraId);
  const [terrenoId, setTerrenoId] = useState<number | undefined>();
  const [culturaId, setCulturaId] = useState<number | undefined>();
  const [tarefaId, setTarefaId] = useState<number | undefined>();

  useEffect(() => {
    setFilters((f) => ({ ...f, safraId: safraId ?? null }));
    setFormSafraId(safraId);
  }, [safraId]);

  const canCreate = canShowCreateOperacaoButton({ readOnly, canWriteOperations });

  const applyFormPrefill = () => {
    setTerrenoId(prefillTerrenoId);
    setCulturaId(prefillCulturaId);
  };

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setTipo("monitoramento");
    setDataPrevista(new Date().toISOString().slice(0, 10));
    setFormSafraId(safraId);
    setTarefaId(undefined);
    applyFormPrefill();
  };

  useEffect(() => {
    if (!openCreateNonce || !canCreate) return;
    applyFormPrefill();
    setModalOpen(true);
    onCreateOpened?.();
  }, [openCreateNonce, canCreate, onCreateOpened, prefillCulturaId, prefillTerrenoId]);

  const {
    data: rawOps = [],
    isLoading,
    isError,
    refetch,
  } = trpc.coreData.operacoes.listByPropriedade.useQuery({ propriedadeId });

  const { data: tarefas = [] } = trpc.coreData.tarefas.listByPropriedade.useQuery(
    { propriedadeId, safraId, abertasOnly: false },
    { enabled: modalOpen && canCreate },
  );

  const createMut = trpc.coreData.operacoes.create.useMutation({
    onSuccess: async (id) => {
      await utils.coreData.operacoes.listByPropriedade.invalidate({ propriedadeId });
      setHighlightId(id);
      setModalOpen(false);
      resetForm();
    },
  });

  const scoped = useMemo(
    () => assertOperacoesPropriedadeScope(rawOps as OperacaoListItem[], propriedadeId),
    [rawOps, propriedadeId],
  );

  const filtered = useMemo(
    () => filterOperacoesAgricolas(scoped, filters),
    [scoped, filters],
  );

  const byStatus = useMemo(() => groupOperacoesByStatus(filtered), [filtered]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          borderRadius: 10,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginRight: 6,
          marginBottom: 6,
          minHeight: 36,
          justifyContent: "center",
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
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 8,
        },
        kanbanCol: {
          flex: 1,
          minWidth: isNarrow ? "100%" : 160,
          marginBottom: isNarrow ? 12 : 0,
          marginRight: isNarrow ? 0 : 8,
        },
      }),
    [colors, isNarrow],
  );

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!titulo.trim()) {
      Alert.alert("Atenção", "Informe o título da operação.");
      return;
    }
    setSaving(true);
    try {
      const culturaPayload = resolveContextualOperacaoCulturaId({
        prefillCulturaId,
        selectedCulturaId: culturaId,
      });
      const id = await createMut.mutateAsync({
        propriedadeId,
        safraId: formSafraId,
        terrenoId,
        culturaId: culturaPayload,
        tarefaId,
        tipoOperacao: tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        dataPrevista: new Date(dataPrevista + "T12:00:00").toISOString(),
      });
      setHighlightId(id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível criar a operação.";
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
    }
  };

  const terrenoNome = (id: number | null | undefined) =>
    id ? terrenos.find((t) => t.id === id)?.nome : undefined;
  const cultivoNome = (id: number | null | undefined) =>
    id ? cultivos.find((c) => c.id === id)?.nomeCultura : undefined;

  const renderCard = (op: OperacaoListItem) => {
    const statusColor = STATUS_COLORS[op.status] ?? colors.muted;
    const highlighted = highlightId === op.id;
    return (
      <TouchableOpacity
        key={op.id}
        activeOpacity={0.85}
        onPress={() => setDetailOperacao(op)}
        accessibilityRole="button"
        accessibilityLabel={`Abrir operação ${op.titulo}`}
      >
      <View
        style={[
          styles.card,
          highlighted ? { borderColor: colors.primary, borderWidth: 2 } : null,
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{op.titulo}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {labelTipoOperacao(op.tipoOperacao)}
              {terrenoNome(op.terrenoId) ? ` · ${terrenoNome(op.terrenoId)}` : ""}
              {cultivoNome(op.culturaId) ? ` · ${cultivoNome(op.culturaId)}` : ""}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {new Date(op.dataPrevista).toLocaleDateString("pt-BR")}
              {" · "}
              {OPERACAO_ORIGEM_LABELS[op.origem]}
              {op.tarefaId ? ` · Tarefa #${op.tarefaId}` : ""}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: statusColor + "22",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor }}>
              {OPERACAO_STATUS_LABELS[op.status]}
            </Text>
          </View>
        </View>
        {op.descricao ? (
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }} numberOfLines={2}>
            {op.descricao}
          </Text>
        ) : null}
      </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <ScreenState status="loading" compact message="Carregando operações agrícolas…" />;
  }
  if (isError) {
    return <ScreenState status="error" compact onAction={() => void refetch()} />;
  }

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
            Operações agrícolas
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 16 }}>
            Atividades registradas (distintas de tarefas, eventos e apontamentos).
          </Text>
        </View>
        {canCreate ? (
          <TouchableOpacity
            onPress={() => setModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Nova operação"
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              minHeight: 44,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconSymbol name="plus" size={14} color="#FFF" />
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>Nova operação</Text>
          </TouchableOpacity>
        ) : readOnly ? (
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600", maxWidth: 160, textAlign: "right" }}>
            {historicalSafraMessage()}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", marginBottom: 10, flexWrap: "wrap" }}>
        {(
          [
            { id: "lista" as const, label: "Lista" },
            { id: "kanban" as const, label: "Kanban" },
          ] as const
        ).map((v) => (
          <TouchableOpacity
            key={v.id}
            onPress={() => setViewMode(v.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === v.id }}
            style={[
              styles.chip,
              {
                backgroundColor: viewMode === v.id ? colors.primary : colors.surface,
                borderColor: viewMode === v.id ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={{ color: viewMode === v.id ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 12 }}>
              {v.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 4 }}>Filtros</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => setFilters((f) => ({ ...f, status: "todos" }))}
          style={[styles.chip, filters.status === "todos" ? { borderColor: colors.primary } : {}]}
        >
          <Text style={{ fontSize: 12, color: colors.foreground }}>Status: todos</Text>
        </TouchableOpacity>
        {OPERACAO_STATUS_VALUES.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setFilters((f) => ({ ...f, status: s }))}
            accessibilityState={{ selected: filters.status === s }}
            style={[
              styles.chip,
              {
                backgroundColor: filters.status === s ? colors.primary + "18" : colors.surface,
                borderColor: filters.status === s ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 12, color: colors.foreground }}>{OPERACAO_STATUS_LABELS[s]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {terrenos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setFilters((f) => ({ ...f, terrenoId: null }))}
            style={styles.chip}
          >
            <Text style={{ fontSize: 12 }}>Talhão: todos</Text>
          </TouchableOpacity>
          {terrenos.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setFilters((f) => ({ ...f, terrenoId: t.id }))}
              style={[
                styles.chip,
                filters.terrenoId === t.id ? { borderColor: colors.primary, backgroundColor: colors.primary + "14" } : {},
              ]}
            >
              <Text style={{ fontSize: 12 }}>{t.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {cultivos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setFilters((f) => ({ ...f, culturaId: null }))}
            style={styles.chip}
          >
            <Text style={{ fontSize: 12 }}>Cultivo: todos</Text>
          </TouchableOpacity>
          {cultivos.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setFilters((f) => ({ ...f, culturaId: c.id }))}
              style={[
                styles.chip,
                filters.culturaId === c.id ? { borderColor: colors.primary, backgroundColor: colors.primary + "14" } : {},
              ]}
            >
              <Text style={{ fontSize: 12 }}>{c.nomeCultura}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setFilters((f) => ({ ...f, tipoOperacao: "todos" }))}
          style={styles.chip}
        >
          <Text style={{ fontSize: 12 }}>Tipo: todos</Text>
        </TouchableOpacity>
        {TIPO_OPERACAO_AGRICOLA.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setFilters((f) => ({ ...f, tipoOperacao: t }))}
            style={[
              styles.chip,
              filters.tipoOperacao === t ? { borderColor: colors.primary, backgroundColor: colors.primary + "14" } : {},
            ]}
          >
            <Text style={{ fontSize: 12 }}>{OPERACAO_AGRICOLA_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <ScreenState
          status="empty"
          compact
          title="Nenhuma operação agrícola"
          message={
            readOnly
              ? "Não há operações nesta safra para consulta."
              : "Registre uma operação ou promova um evento da agenda."
          }
          actionLabel={canCreate ? "Nova operação" : undefined}
          onAction={canCreate ? () => setModalOpen(true) : undefined}
        />
      ) : viewMode === "lista" ? (
        filtered.map(renderCard)
      ) : (
        <ScrollView horizontal={!isNarrow} showsHorizontalScrollIndicator={!isNarrow}>
          <View style={{ flexDirection: isNarrow ? "column" : "row", alignItems: "flex-start" }}>
            {OPERACAO_STATUS_VALUES.map((status) => (
              <View key={status} style={styles.kanbanCol}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: colors.foreground, marginBottom: 8 }}>
                  {OPERACAO_STATUS_LABELS[status]} ({byStatus[status].length})
                </Text>
                {byStatus[status].length === 0 ? (
                  <Text style={{ fontSize: 12, color: colors.muted }}>—</Text>
                ) : (
                  byStatus[status].map(renderCard)
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal visible={modalOpen && canCreate} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "92%",
              padding: 20,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Nova operação</Text>
              <TouchableOpacity onPress={closeModal} accessibilityRole="button" accessibilityLabel="Fechar">
                <IconSymbol name="xmark" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Título</Text>
              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ex: Pulverização talhão norte"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Título da operação"
              />
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Tipo</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                {TIPO_OPERACAO_AGRICOLA.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTipo(t)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: tipo === t ? colors.primary : colors.surface,
                        borderColor: tipo === t ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: tipo === t ? "#FFF" : colors.foreground, fontSize: 12 }}>
                      {OPERACAO_AGRICOLA_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {terrenos.length > 0 ? (
                <>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Talhão (opcional)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                    <TouchableOpacity onPress={() => setTerrenoId(undefined)} style={styles.chip}>
                      <Text style={{ fontSize: 12 }}>Nenhum</Text>
                    </TouchableOpacity>
                    {terrenos.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setTerrenoId(t.id)}
                        style={[
                          styles.chip,
                          terrenoId === t.id ? { borderColor: colors.primary, backgroundColor: colors.primary + "14" } : {},
                        ]}
                      >
                        <Text style={{ fontSize: 12 }}>{t.nome}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}
              {cultivos.length > 0 ? (
                <>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Cultivo (opcional)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                    <TouchableOpacity onPress={() => setCulturaId(undefined)} style={styles.chip}>
                      <Text style={{ fontSize: 12 }}>Nenhum</Text>
                    </TouchableOpacity>
                    {cultivos.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setCulturaId(c.id)}
                        style={[
                          styles.chip,
                          culturaId === c.id ? { borderColor: colors.primary, backgroundColor: colors.primary + "14" } : {},
                        ]}
                      >
                        <Text style={{ fontSize: 12 }}>{c.nomeCultura}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}
              {tarefas.length > 0 ? (
                <>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Tarefa (opcional)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                    <TouchableOpacity onPress={() => setTarefaId(undefined)} style={styles.chip}>
                      <Text style={{ fontSize: 12 }}>Nenhuma</Text>
                    </TouchableOpacity>
                    {tarefas.slice(0, 20).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setTarefaId(t.id)}
                        style={[
                          styles.chip,
                          tarefaId === t.id ? { borderColor: colors.primary, backgroundColor: colors.primary + "14" } : {},
                        ]}
                      >
                        <Text style={{ fontSize: 12 }} numberOfLines={1}>
                          {t.titulo}
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
                accessibilityLabel="Data prevista"
              />
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Detalhes da atividade…"
                placeholderTextColor={colors.muted}
                multiline
                accessibilityLabel="Descrição"
              />
              <TouchableOpacity
                onPress={() => void handleCreate()}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Salvar operação"
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: saving ? 0.6 : 1,
                  marginBottom: 24,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Salvar operação</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {detailOperacao ? (
        <OperacaoAgricolaDetailModal
          operacao={detailOperacao}
          visible
          onClose={() => setDetailOperacao(null)}
          propriedadeId={propriedadeId}
          readOnly={readOnly}
          canWriteOperations={canWriteOperations}
          canApproveOperations={canApproveOperations}
          onOperacaoUpdated={setDetailOperacao}
        />
      ) : null}
    </View>
  );
}
