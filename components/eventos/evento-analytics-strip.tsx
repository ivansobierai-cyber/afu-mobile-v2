import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";

type Stats = {
  total: number;
  pendentes: number;
  emAndamento?: number;
  concluidos: number;
  criticos: number;
  atrasados?: number;
  taxaConclusao?: number;
};

type Props = {
  stats?: Stats | null;
};

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ fontSize: 16, fontWeight: "800", color: accent ?? colors.foreground }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted }}>{label}</Text>
    </View>
  );
}

/** Etapa 9 — indicadores rápidos do módulo Eventos. */
export function EventoAnalyticsStrip({ stats }: Props) {
  if (!stats) return null;
  const taxa =
    stats.taxaConclusao != null
      ? `${Math.round(stats.taxaConclusao)}%`
      : stats.total > 0
        ? `${Math.round((stats.concluidos / stats.total) * 100)}%`
        : "—";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Metric label="Total" value={stats.total} />
      <Metric label="Pendentes" value={stats.pendentes} accent={MODULE_COLORS.eventos} />
      <Metric label="Concluídos" value={stats.concluidos} accent="#38A169" />
      <Metric label="Críticos" value={stats.criticos} accent="#E53E3E" />
      <Metric label="Atrasados" value={stats.atrasados ?? 0} accent="#D97706" />
      <Metric label="Conclusão" value={taxa} accent="#1565C0" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
    flexDirection: "row",
  },
  metric: {
    minWidth: 84,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 2,
  },
});
