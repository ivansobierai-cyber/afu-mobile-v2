import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  CULTIVO_FASES,
  CULTIVO_STATUS_COLORS,
  cultivoFaseProgress,
} from "@/lib/cultivos/cultivo-workspace";

type CultivoLike = {
  status?: string | null;
  faseAtual?: string | null;
  dataPlantio?: Date | string | null;
  previsaoColheita?: Date | string | null;
  areaPlantada?: string | number | null;
  observacoes?: string | null;
};

type Props = {
  cultivo: CultivoLike;
  advancingFase: boolean;
  onAdvanceFase: () => void;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

/** Conteúdo da aba Visão Geral — preserva o detalhe pré-V2. */
export function CultivoVisaoGeral({ cultivo, advancingFase, onAdvanceFase }: Props) {
  const colors = useColors();
  const { index: currentFaseIdx, progress, label: faseAtual } = cultivoFaseProgress(
    cultivo.faseAtual,
  );
  const statusColor =
    CULTIVO_STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.primary;

  const styles = StyleSheet.create({
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
  });

  return (
    <View>
      <View style={styles.infoCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
            Fase Atual: {faseAtual.replace(/_/g, " ")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {currentFaseIdx + 1}/{CULTIVO_FASES.length}
          </Text>
        </View>
        <View
          style={{
            height: 8,
            backgroundColor: colors.border,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              backgroundColor: statusColor,
              borderRadius: 4,
            }}
          />
        </View>
        {cultivo.status === "em_andamento" && currentFaseIdx < CULTIVO_FASES.length - 1 && (
          <TouchableOpacity
            style={{
              marginTop: 12,
              backgroundColor: colors.primary + "15",
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.primary + "40",
            }}
            onPress={onAdvanceFase}
            disabled={advancingFase}
            accessibilityRole="button"
            accessibilityLabel="Avançar fase fenológica"
          >
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
              Avançar para: {CULTIVO_FASES[currentFaseIdx + 1].replace(/_/g, " ")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
          Dados do Cultivo
        </Text>
        {[
          { label: "Data de Plantio", value: formatDate(cultivo.dataPlantio) },
          { label: "Colheita Prevista", value: formatDate(cultivo.previsaoColheita) },
          {
            label: "Área Plantada",
            value: cultivo.areaPlantada ? `${Number(cultivo.areaPlantada)} ha` : "—",
          },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>{item.label}</Text>
            <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600" }}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
          Ciclo Fenológico
        </Text>
        {CULTIVO_FASES.map((fase, idx) => (
          <View
            key={fase}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor:
                  idx < currentFaseIdx
                    ? colors.success
                    : idx === currentFaseIdx
                      ? colors.primary
                      : colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {idx < currentFaseIdx ? (
                <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>{idx + 1}</Text>
              )}
            </View>
            <Text
              style={{
                fontSize: 14,
                color: idx <= currentFaseIdx ? colors.foreground : colors.muted,
                fontWeight: idx === currentFaseIdx ? "700" : "400",
              }}
            >
              {fase.replace(/_/g, " ")}
            </Text>
            {idx === currentFaseIdx && (
              <View
                style={{
                  backgroundColor: colors.primary + "20",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700" }}>Atual</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {cultivo.observacoes ? (
        <View style={styles.infoCard}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Observações
          </Text>
          <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
            {cultivo.observacoes}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
