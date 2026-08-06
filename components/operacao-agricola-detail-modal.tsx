import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  OPERACAO_STATUS_LABELS,
  canCreateApontamentoForStatus,
  canEditApontamentoForStatus,
  filterOperacaoTransitionActionsByPermission,
  isApontamentoReadOnlyStatus,
  listOperacaoTransitionActions,
  operacaoTransitionRequiresMotivo,
  labelTipoOperacao,
  type OperacaoListItem,
  type OperacaoAgricolaStatus,
} from "@/lib/operacoes";

type Props = {
  operacao: OperacaoListItem;
  visible: boolean;
  onClose: () => void;
  propriedadeId: number;
  readOnly?: boolean;
  canWriteOperations?: boolean;
  canApproveOperations?: boolean;
  onOperacaoUpdated?: (op: OperacaoListItem) => void;
};

function toListItem(base: OperacaoListItem, row: {
  status: string;
  statusRevision?: number | null;
  statusBeforeBlocked?: string | null;
}): OperacaoListItem {
  return {
    ...base,
    status: row.status as OperacaoListItem["status"],
    statusRevision: row.statusRevision ?? 0,
    statusBeforeBlocked: (row.statusBeforeBlocked ?? null) as OperacaoAgricolaStatus | null,
  };
}

function formatDt(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OperacaoAgricolaDetailModal({
  operacao,
  visible,
  onClose,
  propriedadeId,
  readOnly = false,
  canWriteOperations = false,
  canApproveOperations = false,
  onOperacaoUpdated,
}: Props) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [pendingTo, setPendingTo] = useState<OperacaoAgricolaStatus | null>(null);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const pendingMutationId = useRef<string | null>(null);

  const [showApontForm, setShowApontForm] = useState(false);
  const [editingApontId, setEditingApontId] = useState<number | null>(null);
  const [editingRevision, setEditingRevision] = useState(0);
  const [inicioReal, setInicioReal] = useState(toLocalInputValue(new Date()));
  const [fimReal, setFimReal] = useState("");
  const [areaExecutada, setAreaExecutada] = useState("");
  const [equipeTexto, setEquipeTexto] = useState("");
  const [implementoTexto, setImplementoTexto] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [problemas, setProblemas] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [insumoDesc, setInsumoDesc] = useState("");
  const [insumoQtd, setInsumoQtd] = useState("");
  const [insumoUnidade, setInsumoUnidade] = useState("kg");
  const [evidenciaNome, setEvidenciaNome] = useState("");
  const [evidenciaUrl, setEvidenciaUrl] = useState("");
  const [savingApont, setSavingApont] = useState(false);
  const apontMutationId = useRef<string | null>(null);

  const operacaoQ = trpc.coreData.operacoes.get.useQuery(
    { id: operacao.id },
    { enabled: visible },
  );

  const currentOperacao = useMemo(() => {
    if (operacaoQ.data) {
      return toListItem(operacao, operacaoQ.data);
    }
    return operacao;
  }, [operacao, operacaoQ.data]);

  const operacaoServerReady = operacaoQ.isSuccess && operacaoQ.data != null;
  const status = currentOperacao.status as OperacaoAgricolaStatus;

  const historicoQ = trpc.coreData.operacoes.listStatusHistorico.useQuery(
    { operacaoId: operacao.id },
    { enabled: visible },
  );

  const apontamentosQ = trpc.coreData.operacoes.listApontamentos.useQuery(
    { operacaoId: operacao.id },
    { enabled: visible },
  );

  const resumoQ = trpc.coreData.operacoes.planejadoRealizado.useQuery(
    { operacaoId: operacao.id },
    { enabled: visible },
  );

  const transitionMut = trpc.coreData.operacoes.transitionStatus.useMutation({
    onSuccess: async () => {
      await utils.coreData.operacoes.listByPropriedade.invalidate({ propriedadeId });
      const fresh = await utils.coreData.operacoes.get.fetch({ id: operacao.id });
      const updated = toListItem(operacao, fresh);
      onOperacaoUpdated?.(updated);
      await utils.coreData.operacoes.get.setData({ id: operacao.id }, fresh);
      await utils.coreData.operacoes.listStatusHistorico.invalidate({
        operacaoId: operacao.id,
      });
      setPendingTo(null);
      setMotivo("");
      pendingMutationId.current = null;
    },
  });

  const createApontMut = trpc.coreData.operacoes.createApontamento.useMutation();
  const updateApontMut = trpc.coreData.operacoes.updateApontamento.useMutation();
  const addEvidMut = trpc.coreData.operacoes.addApontamentoEvidencia.useMutation();

  const actions = useMemo(() => {
    const ctx = {
      statusBeforeBlocked: (currentOperacao.statusBeforeBlocked ?? null) as OperacaoAgricolaStatus | null,
    };
    const all = listOperacaoTransitionActions(status, ctx);
    if (readOnly || !operacaoServerReady) return [];
    return filterOperacaoTransitionActionsByPermission(all, {
      canWrite: canWriteOperations,
      canApprove: canApproveOperations,
    });
  }, [
    status,
    currentOperacao.statusBeforeBlocked,
    readOnly,
    operacaoServerReady,
    canWriteOperations,
    canApproveOperations,
  ]);

  const canRegisterExec =
    !readOnly &&
    canWriteOperations &&
    operacaoServerReady &&
    canCreateApontamentoForStatus(status);

  const canEditExec =
    !readOnly &&
    canWriteOperations &&
    operacaoServerReady &&
    canEditApontamentoForStatus(status);

  const execReadOnly =
    readOnly ||
    !canWriteOperations ||
    isApontamentoReadOnlyStatus(status) ||
    status === "planejada" ||
    status === "liberada";

  const resetApontForm = () => {
    setShowApontForm(false);
    setEditingApontId(null);
    setEditingRevision(0);
    setInicioReal(toLocalInputValue(new Date()));
    setFimReal("");
    setAreaExecutada("");
    setEquipeTexto("");
    setImplementoTexto("");
    setCondicoes("");
    setProblemas("");
    setObservacoes("");
    setInsumoDesc("");
    setInsumoQtd("");
    setInsumoUnidade("kg");
    setEvidenciaNome("");
    setEvidenciaUrl("");
    apontMutationId.current = null;
  };

  const openCreateForm = () => {
    resetApontForm();
    setShowApontForm(true);
    setInicioReal(toLocalInputValue(new Date()));
  };

  const openEditForm = (a: NonNullable<typeof apontamentosQ.data>[number]) => {
    setEditingApontId(a.id);
    setEditingRevision(a.revision ?? 0);
    setInicioReal(toLocalInputValue(new Date(a.inicioReal)));
    setFimReal(a.fimReal ? toLocalInputValue(new Date(a.fimReal)) : "");
    setAreaExecutada(a.areaExecutada != null ? String(a.areaExecutada) : "");
    setEquipeTexto(a.equipeTexto ?? "");
    setImplementoTexto(a.implementoTexto ?? "");
    setCondicoes(a.condicoesObservadas ?? "");
    setProblemas(a.problemasPausas ?? "");
    setObservacoes(a.observacoes ?? "");
    const firstInsumo = a.insumos?.[0];
    setInsumoDesc(firstInsumo?.descricao ?? "");
    setInsumoQtd(firstInsumo?.quantidade != null ? String(firstInsumo.quantidade) : "");
    setInsumoUnidade(firstInsumo?.unidade ?? "kg");
    setShowApontForm(true);
    apontMutationId.current = null;
  };

  const refreshApontamentos = async () => {
    await utils.coreData.operacoes.listApontamentos.invalidate({ operacaoId: operacao.id });
    await utils.coreData.operacoes.planejadoRealizado.invalidate({ operacaoId: operacao.id });
  };

  const saveApontamento = async () => {
    if (!inicioReal.trim()) {
      Alert.alert("Atenção", "Informe o início real da execução.");
      return;
    }
    const inicio = new Date(inicioReal);
    if (Number.isNaN(inicio.getTime())) {
      Alert.alert("Atenção", "Início real inválido.");
      return;
    }
    const fim = fimReal.trim() ? new Date(fimReal) : null;
    if (fim && Number.isNaN(fim.getTime())) {
      Alert.alert("Atenção", "Fim real inválido.");
      return;
    }
    if (fim && inicio.getTime() > fim.getTime()) {
      Alert.alert("Atenção", "O início deve ser anterior ou igual ao fim.");
      return;
    }

    const areaNum = areaExecutada.trim() ? Number(areaExecutada.replace(",", ".")) : null;
    if (areaNum != null && (Number.isNaN(areaNum) || areaNum < 0)) {
      Alert.alert("Atenção", "Área executada inválida.");
      return;
    }

    const insumos =
      insumoDesc.trim() && insumoQtd.trim()
        ? [
            {
              descricao: insumoDesc.trim(),
              quantidade: Number(insumoQtd.replace(",", ".")),
              unidade: insumoUnidade.trim() || "kg",
            },
          ]
        : undefined;
    if (insumos && (!(insumos[0].quantidade > 0) || Number.isNaN(insumos[0].quantidade))) {
      Alert.alert("Atenção", "Quantidade de insumo deve ser maior que zero.");
      return;
    }

    setSavingApont(true);
    try {
      if (editingApontId != null) {
        await updateApontMut.mutateAsync({
          apontamentoId: editingApontId,
          expectedRevision: editingRevision,
          inicioReal: inicio.toISOString(),
          fimReal: fim ? fim.toISOString() : null,
          areaExecutada: areaNum,
          areaUnidade: "ha",
          equipeTexto: equipeTexto.trim() || null,
          implementoTexto: implementoTexto.trim() || null,
          condicoesObservadas: condicoes.trim() || null,
          problemasPausas: problemas.trim() || null,
          observacoes: observacoes.trim() || null,
          insumos,
        });
      } else {
        if (!apontMutationId.current) {
          apontMutationId.current = `apt-${operacao.id}-${crypto.randomUUID?.() ?? Date.now()}`;
        }
        const created = await createApontMut.mutateAsync({
          operacaoId: operacao.id,
          inicioReal: inicio.toISOString(),
          fimReal: fim ? fim.toISOString() : null,
          areaExecutada: areaNum,
          areaUnidade: "ha",
          equipeTexto: equipeTexto.trim() || null,
          implementoTexto: implementoTexto.trim() || null,
          condicoesObservadas: condicoes.trim() || null,
          problemasPausas: problemas.trim() || null,
          observacoes: observacoes.trim() || null,
          insumos,
          clientMutationId: apontMutationId.current,
        });
        if (evidenciaNome.trim() && evidenciaUrl.trim()) {
          await addEvidMut.mutateAsync({
            apontamentoId: created.apontamentoId,
            nome: evidenciaNome.trim(),
            url: evidenciaUrl.trim(),
          });
        }
      }
      await refreshApontamentos();
      resetApontForm();
    } catch (e: unknown) {
      apontMutationId.current = null;
      const msg = e instanceof Error ? e.message : "Não foi possível salvar o apontamento.";
      Alert.alert("Erro", msg);
    } finally {
      setSavingApont(false);
    }
  };

  const runTransition = async (to: OperacaoAgricolaStatus, motivoText?: string) => {
    if (!operacaoServerReady) {
      Alert.alert("Aguarde", "Carregando dados atualizados da operação…");
      return;
    }
    if (!pendingMutationId.current) {
      pendingMutationId.current = `ui-${operacao.id}-${to}-${crypto.randomUUID?.() ?? Date.now()}`;
    }
    setSaving(true);
    try {
      await transitionMut.mutateAsync({
        operacaoId: operacao.id,
        toStatus: to,
        motivo: motivoText,
        expectedStatus: status,
        expectedRevision: currentOperacao.statusRevision ?? 0,
        clientMutationId: pendingMutationId.current,
      });
    } catch (e: unknown) {
      pendingMutationId.current = null;
      const msg = e instanceof Error ? e.message : "Não foi possível alterar o status.";
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
    }
  };

  const onActionPress = (to: OperacaoAgricolaStatus, destructive?: boolean) => {
    pendingMutationId.current = null;
    if (operacaoTransitionRequiresMotivo(to)) {
      setPendingTo(to);
      setMotivo("");
      return;
    }
    const label = OPERACAO_STATUS_LABELS[to];
    const go = () => void runTransition(to);
    if (destructive) {
      Alert.alert("Confirmar", `Deseja realmente alterar para "${label}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", style: "destructive", onPress: go },
      ]);
      return;
    }
    go();
  };

  const confirmMotivo = () => {
    if (!pendingTo) return;
    if (!motivo.trim()) {
      Alert.alert("Atenção", "Informe o motivo.");
      return;
    }
    void runTransition(pendingTo, motivo.trim());
  };

  if (!visible) return null;

  const resumo = resumoQ.data;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
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
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, flex: 1 }}>
              {currentOperacao.titulo}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar">
              <IconSymbol name="xmark" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
              {labelTipoOperacao(currentOperacao.tipoOperacao)} · {OPERACAO_STATUS_LABELS[status]}
            </Text>
            {currentOperacao.descricao ? (
              <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 12 }}>
                {currentOperacao.descricao}
              </Text>
            ) : null}

            {operacaoQ.isLoading && !operacaoServerReady ? (
              <ActivityIndicator style={{ marginBottom: 12 }} />
            ) : null}

            {actions.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                  Ações
                </Text>
                {actions.map((a) => (
                  <TouchableOpacity
                    key={a.toStatus}
                    disabled={saving || !operacaoServerReady}
                    onPress={() => onActionPress(a.toStatus, a.destructive)}
                    style={[
                      styles.actionBtn,
                      {
                        borderColor: a.destructive ? "#C62828" : colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: a.destructive ? "#C62828" : colors.foreground,
                      }}
                    >
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {pendingTo ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Motivo</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  value={motivo}
                  onChangeText={setMotivo}
                  placeholder="Descreva o motivo…"
                  placeholderTextColor={colors.muted}
                  multiline
                />
                <TouchableOpacity
                  onPress={confirmMotivo}
                  disabled={saving}
                  style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 12, marginTop: 8 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={{ color: "#FFF", fontWeight: "700", textAlign: "center" }}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ─── FASE 2H — Execução real ─── */}
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Execução real
            </Text>

            {execReadOnly && isApontamentoReadOnlyStatus(status) ? (
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
                {status === "aprovada"
                  ? "Operação aprovada — execução imutável."
                  : "Somente leitura neste status."}
              </Text>
            ) : null}

            {resumoQ.isLoading ? (
              <ActivityIndicator style={{ marginBottom: 8 }} />
            ) : resumo ? (
              <View style={[styles.resumoBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
                  Planejado × Realizado
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Período: {formatDt(resumo.planejado.dataPrevista)} →{" "}
                  {formatDt(resumo.realizado.inicioRealMin)}
                  {resumo.realizado.fimRealMax ? ` – ${formatDt(resumo.realizado.fimRealMax)}` : ""}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  Área:{" "}
                  {resumo.planejado.areaHa != null ? `${resumo.planejado.areaHa} ha (talhão)` : "—"} ×{" "}
                  {resumo.realizado.areaExecutadaTotal != null
                    ? `${resumo.realizado.areaExecutadaTotal} ${resumo.realizado.areaUnidade ?? "ha"}`
                    : "—"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  Sessões: {resumo.realizado.apontamentosCount}
                  {resumo.realizado.insumos.length
                    ? ` · Insumos apontados: ${resumo.realizado.insumos.length} (sem baixa de estoque)`
                    : ""}
                </Text>
              </View>
            ) : null}

            {canRegisterExec && !showApontForm ? (
              <TouchableOpacity
                onPress={openCreateForm}
                style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
              >
                <Text style={{ fontWeight: "700", color: colors.primary }}>Registrar execução</Text>
              </TouchableOpacity>
            ) : null}

            {showApontForm ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  {editingApontId ? "Editar apontamento" : "Novo apontamento"}
                </Text>
                <Text style={styles.fieldLabel}>Início real *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                  value={inicioReal}
                  onChangeText={setInicioReal}
                  placeholder="AAAA-MM-DDTHH:mm"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                />
                <Text style={styles.fieldLabel}>Fim real</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                  value={fimReal}
                  onChangeText={setFimReal}
                  placeholder="AAAA-MM-DDTHH:mm"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                />
                <Text style={styles.fieldLabel}>Área executada (ha)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                  value={areaExecutada}
                  onChangeText={setAreaExecutada}
                  keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.fieldLabel}>Equipe / operador</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                  value={equipeTexto}
                  onChangeText={setEquipeTexto}
                  placeholder="Nome da equipe"
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.fieldLabel}>Máquina / implemento</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                  value={implementoTexto}
                  onChangeText={setImplementoTexto}
                  placeholder="Ex.: trator + pulverizador"
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.fieldLabel}>Condições observadas</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  value={condicoes}
                  onChangeText={setCondicoes}
                  multiline
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.fieldLabel}>Pausas / problemas</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  value={problemas}
                  onChangeText={setProblemas}
                  multiline
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.fieldLabel}>Insumo realizado (sem baixar estoque)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                  value={insumoDesc}
                  onChangeText={setInsumoDesc}
                  placeholder="Produto"
                  placeholderTextColor={colors.muted}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.foreground, minHeight: 44, flex: 1 },
                    ]}
                    value={insumoQtd}
                    onChangeText={setInsumoQtd}
                    keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                    placeholder="Qtd"
                    placeholderTextColor={colors.muted}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.foreground, minHeight: 44, width: 72 },
                    ]}
                    value={insumoUnidade}
                    onChangeText={setInsumoUnidade}
                    placeholder="un"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                {!editingApontId ? (
                  <>
                    <Text style={styles.fieldLabel}>Evidência (link)</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                      value={evidenciaNome}
                      onChangeText={setEvidenciaNome}
                      placeholder="Nome"
                      placeholderTextColor={colors.muted}
                    />
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
                      value={evidenciaUrl}
                      onChangeText={setEvidenciaUrl}
                      placeholder="https://…"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                    />
                  </>
                ) : null}
                <Text style={styles.fieldLabel}>Observações</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  value={observacoes}
                  onChangeText={setObservacoes}
                  multiline
                  placeholderTextColor={colors.muted}
                />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={resetApontForm}
                    disabled={savingApont}
                    style={[styles.actionBtn, { borderColor: colors.border, flex: 1, marginBottom: 0 }]}
                  >
                    <Text style={{ textAlign: "center", color: colors.muted }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void saveApontamento()}
                    disabled={savingApont}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      padding: 12,
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    {savingApont ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={{ color: "#FFF", fontWeight: "700", textAlign: "center" }}>Salvar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {apontamentosQ.isLoading ? (
              <ActivityIndicator style={{ marginBottom: 12 }} />
            ) : apontamentosQ.data?.length ? (
              apontamentosQ.data.map((a) => (
                <View key={a.id} style={[styles.histRow, { borderColor: colors.border }]}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                    {formatDt(a.inicioReal)}
                    {a.fimReal ? ` → ${formatDt(a.fimReal)}` : ""}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    Área: {a.areaExecutada != null ? `${a.areaExecutada} ${a.areaUnidade ?? "ha"}` : "—"}
                    {a.equipeTexto ? ` · ${a.equipeTexto}` : ""}
                    {a.insumos?.length ? ` · ${a.insumos.length} insumo(s)` : ""}
                    {a.evidencias?.length ? ` · ${a.evidencias.length} evidência(s)` : ""}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    Registrado em {formatDt(a.createdAt)}
                  </Text>
                  {canEditExec ? (
                    <TouchableOpacity onPress={() => openEditForm(a)} style={{ marginTop: 6 }}>
                      <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
                        Editar / completar
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
                Nenhum apontamento de execução registrado.
              </Text>
            )}

            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.foreground,
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              Histórico de status
            </Text>
            {historicoQ.isLoading ? (
              <ActivityIndicator />
            ) : historicoQ.data?.length ? (
              historicoQ.data.map((h) => (
                <View key={h.id} style={[styles.histRow, { borderColor: colors.border }]}>
                  <Text style={{ fontSize: 12, color: colors.foreground }}>
                    {OPERACAO_STATUS_LABELS[h.fromStatus as OperacaoAgricolaStatus]} →{" "}
                    {OPERACAO_STATUS_LABELS[h.toStatus as OperacaoAgricolaStatus]}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    {new Date(h.createdAt).toLocaleString("pt-BR")}
                    {h.motivo ? ` · ${h.motivo}` : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 12, color: colors.muted }}>Nenhuma transição registrada ainda.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    marginBottom: 4,
    opacity: 0.7,
  },
  histRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  resumoBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
});
