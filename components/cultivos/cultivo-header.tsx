import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  CULTIVO_STATUS_COLORS,
  CULTIVO_STATUS_LABELS,
} from "@/lib/cultivos/cultivo-workspace";

type Props = {
  nomeCultura: string;
  variedade?: string | null;
  status?: string | null;
  faseAtual?: string | null;
  onBack: () => void;
};

/** Cabeçalho persistente do workspace do cultivo (Cultivos V2 Etapa 2). */
export function CultivoHeader({
  nomeCultura,
  variedade,
  status,
  faseAtual,
  onBack,
}: Props) {
  const statusKey = status ?? "em_andamento";
  const bg = CULTIVO_STATUS_COLORS[statusKey] ?? "#2F6B4F";

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {nomeCultura}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {[variedade, faseAtual ? `Fase: ${faseAtual.replace(/_/g, " ")}` : null]
            .filter(Boolean)
            .join(" · ") || "—"}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {CULTIVO_STATUS_LABELS[statusKey] ?? statusKey}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titles: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
});
