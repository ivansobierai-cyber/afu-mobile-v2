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
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  OPERACAO_STATUS_LABELS,
  filterOperacaoTransitionActionsByPermission,
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

  const historicoQ = trpc.coreData.operacoes.listStatusHistorico.useQuery(
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

  const actions = useMemo(() => {
    const ctx = {
      statusBeforeBlocked: (currentOperacao.statusBeforeBlocked ?? null) as OperacaoAgricolaStatus | null,
    };
    const all = listOperacaoTransitionActions(
      currentOperacao.status as OperacaoAgricolaStatus,
      ctx,
    );
    if (readOnly || !operacaoServerReady) return [];
    return filterOperacaoTransitionActionsByPermission(all, {
      canWrite: canWriteOperations,
      canApprove: canApproveOperations,
    });
  }, [
    currentOperacao.status,
    currentOperacao.statusBeforeBlocked,
    readOnly,
    operacaoServerReady,
    canWriteOperations,
    canApproveOperations,
  ]);

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
        expectedStatus: currentOperacao.status as OperacaoAgricolaStatus,
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
              {labelTipoOperacao(currentOperacao.tipoOperacao)} ·{" "}
              {OPERACAO_STATUS_LABELS[currentOperacao.status as OperacaoAgricolaStatus]}
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

            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
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
  },
  histRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
});
