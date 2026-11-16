/**
 * WP-04 — card de revisão técnica (status para produtor + ações para técnico).
 * Aditivo: não substitui o laudo IA nem os botões existentes.
 */
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  STATUS_REVISAO_LABELS,
  type DiagnosticoStatusRevisao,
} from "@/lib/diagnostico-revisao";

const STATUS_COLORS: Record<DiagnosticoStatusRevisao, string> = {
  pendente: "#D97706",
  revisado: "#2563EB",
  confirmado: "#16A34A",
  descartado: "#DC2626",
};

export type TarefaImpactoUi = {
  tarefaId: number;
  updated: boolean;
  flaggedNeedsReview: boolean;
  status: string;
  statusChanged?: boolean;
};

export type RevisaoTecnicaCardProps = {
  diagnosticoId: number;
  statusRevisao: DiagnosticoStatusRevisao;
  parecerTecnico?: string | null;
  recomendacaoCorrigida?: string | null;
  recomendacaoOriginal?: string | null;
  revisadoEm?: string | null;
  /** Impacto na tarefa WP-03 já vinculada (após revisão). */
  tarefaImpacto?: TarefaImpactoUi | null;
  canReview: boolean;
  reviewing?: boolean;
  onRevisar: (input: {
    acao: "confirmar" | "corrigir" | "descartar";
    parecerTecnico?: string;
    recomendacaoCorrigida?: string;
  }) => Promise<void> | void;
};

export function RevisaoTecnicaCard({
  diagnosticoId,
  statusRevisao,
  parecerTecnico,
  recomendacaoCorrigida,
  recomendacaoOriginal,
  revisadoEm,
  tarefaImpacto,
  canReview,
  reviewing = false,
  onRevisar,
}: RevisaoTecnicaCardProps) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[statusRevisao] ?? colors.muted;
  const [parecer, setParecer] = useState("");
  const [correcao, setCorrecao] = useState(
    recomendacaoCorrigida ?? recomendacaoOriginal ?? "",
  );
  const [mode, setMode] = useState<"idle" | "corrigir" | "descartar">("idle");

  const isPendente = statusRevisao === "pendente";

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: statusColor + "55",
          backgroundColor: statusColor + "12",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <IconSymbol name="checkmark.shield.fill" size={18} color={statusColor} />
        <Text style={[styles.title, { color: statusColor }]}>Revisão técnica</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_REVISAO_LABELS[statusRevisao]}
          </Text>
        </View>
      </View>

      <Text style={[styles.meta, { color: colors.muted }]}>
        Diagnóstico #{diagnosticoId}
        {revisadoEm
          ? ` · revisado em ${new Date(revisadoEm).toLocaleString("pt-BR")}`
          : ""}
      </Text>

      {parecerTecnico ? (
        <Text style={[styles.body, { color: colors.foreground }]}>
          Parecer: {parecerTecnico}
        </Text>
      ) : null}

      {recomendacaoCorrigida ? (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.subLabel, { color: colors.muted }]}>
            Recomendação corrigida
          </Text>
          <Text style={[styles.body, { color: colors.foreground }]}>
            {recomendacaoCorrigida}
          </Text>
          {recomendacaoOriginal ? (
            <Text style={[styles.original, { color: colors.muted }]}>
              Original (IA): {recomendacaoOriginal}
            </Text>
          ) : null}
        </View>
      ) : null}

      {tarefaImpacto?.updated ? (
        <View
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 8,
            backgroundColor: tarefaImpacto.flaggedNeedsReview
              ? "#DC262618"
              : colors.primary + "12",
            borderWidth: 1,
            borderColor: tarefaImpacto.flaggedNeedsReview
              ? "#DC262655"
              : colors.primary + "40",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: tarefaImpacto.flaggedNeedsReview ? "#DC2626" : colors.primary,
            }}
          >
            {tarefaImpacto.flaggedNeedsReview
              ? `Tarefa #${tarefaImpacto.tarefaId} sinalizada para revisão`
              : `Tarefa #${tarefaImpacto.tarefaId} atualizada com a revisão`}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
            Status: {tarefaImpacto.status}
            {tarefaImpacto.statusChanged ? " (alterado)" : ""}
            {" · "}instruções preservadas + nota técnica anexada
          </Text>
        </View>
      ) : null}

      {canReview && isPendente ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          {mode === "idle" ? (
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#16A34A" }]}
                disabled={reviewing}
                onPress={() =>
                  void onRevisar({
                    acao: "confirmar",
                    parecerTecnico: parecer.trim() || undefined,
                  })
                }
              >
                {reviewing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionText}>Aprovar laudo</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: "#2563EB",
                  },
                ]}
                disabled={reviewing}
                onPress={() => setMode("corrigir")}
              >
                <Text style={{ color: "#2563EB", fontWeight: "700" }}>Corrigir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: "#DC2626",
                  },
                ]}
                disabled={reviewing}
                onPress={() => setMode("descartar")}
              >
                <Text style={{ color: "#DC2626", fontWeight: "700" }}>Rejeitar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {mode === "corrigir" ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.subLabel, { color: colors.foreground }]}>
                Parecer técnico (obrigatório)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                  },
                ]}
                value={parecer}
                onChangeText={setParecer}
                placeholder="Explique a correção..."
                placeholderTextColor={colors.muted}
                multiline
              />
              <Text style={[styles.subLabel, { color: colors.foreground }]}>
                Recomendação corrigida (obrigatória)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    minHeight: 80,
                  },
                ]}
                value={correcao}
                onChangeText={setCorrecao}
                placeholder="Nova recomendação para o produtor..."
                placeholderTextColor={colors.muted}
                multiline
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.actionBtn, { flex: 1, backgroundColor: colors.muted }]}
                  onPress={() => setMode("idle")}
                  disabled={reviewing}
                >
                  <Text style={styles.actionText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { flex: 1, backgroundColor: "#2563EB" }]}
                  disabled={reviewing}
                  onPress={() =>
                    void onRevisar({
                      acao: "corrigir",
                      parecerTecnico: parecer,
                      recomendacaoCorrigida: correcao,
                    })
                  }
                >
                  {reviewing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionText}>Salvar correção</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {mode === "descartar" ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.subLabel, { color: colors.foreground }]}>
                Motivo da rejeição (obrigatório)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                  },
                ]}
                value={parecer}
                onChangeText={setParecer}
                placeholder="Ex.: imagem sem qualidade / falso positivo..."
                placeholderTextColor={colors.muted}
                multiline
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.actionBtn, { flex: 1, backgroundColor: colors.muted }]}
                  onPress={() => setMode("idle")}
                  disabled={reviewing}
                >
                  <Text style={styles.actionText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { flex: 1, backgroundColor: "#DC2626" }]}
                  disabled={reviewing}
                  onPress={() =>
                    void onRevisar({
                      acao: "descartar",
                      parecerTecnico: parecer,
                    })
                  }
                >
                  {reviewing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionText}>Confirmar rejeição</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  original: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 56,
    textAlignVertical: "top",
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
