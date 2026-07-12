import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import type { ComponentProps } from "react";

type LabIcon = ComponentProps<typeof IconSymbol>["name"];

export const LAB_COLORS = {
  brand: MODULE_COLORS.laboratorio,
  brandLight: "#2D6A4F",
  brandSoft: "#40916C",
  accent: MODULE_COLORS.laudos,
  warning: "#EF6C00",
  critical: "#C62828",
  muted: "#6B7C6E",
  purple: MODULE_COLORS.materiais,
  olive: "#558B2F",
  chip: "rgba(255,255,255,0.14)",
} as const;

export type LabMenuItem = {
  label: string;
  subtitle: string;
  icon: LabIcon;
  color: string;
  route: string;
  badge?: number | string;
};

type LabCounts = {
  diagnosticos: number;
  analises: number;
  laudos: number;
};

const LAB_ITEMS: LabMenuItem[] = [
  {
    label: "Novo Diagnóstico",
    subtitle: "Foto + IA",
    icon: "camera.fill",
    color: LAB_COLORS.brandLight,
    route: "/(tabs)/diagnostico",
  },
  {
    label: "Histórico IA",
    subtitle: "Anteriores",
    icon: "clock.fill",
    color: LAB_COLORS.muted,
    route: "/(tabs)/diagnostico?historico=1",
  },
  {
    label: "Análises",
    subtitle: "Solo · foliar · água",
    icon: "flask.fill",
    color: LAB_COLORS.warning,
    route: "/mais/analise-fitotecnica",
  },
  {
    label: "Laudos",
    subtitle: "PDFs técnicos",
    icon: "doc.fill",
    color: LAB_COLORS.accent,
    route: "/mais/relatorios",
  },
  {
    label: "Catálogo",
    subtitle: "Tipos e índices",
    icon: "cross.case.fill",
    color: LAB_COLORS.purple,
    route: "/mais/analises-lab",
  },
  {
    label: "Lab Digital",
    subtitle: "7 módulos",
    icon: "waveform.path.ecg",
    color: LAB_COLORS.brand,
    route: "/mais/laboratorio-digital",
  },
  {
    label: "Testes Campo",
    subtitle: "Piloto",
    icon: "ant.fill",
    color: LAB_COLORS.critical,
    route: "/mais/testes-campo",
  },
  {
    label: "Parceiros",
    subtitle: "Labs credenciados",
    icon: "building.2.fill",
    color: LAB_COLORS.olive,
    route: "/mais/parceiros",
  },
];

function withBadges(items: LabMenuItem[], counts: LabCounts): LabMenuItem[] {
  return items.map((item) => {
    if (item.route.includes("historico=1")) return { ...item, badge: counts.diagnosticos };
    if (item.route === "/mais/analise-fitotecnica") return { ...item, badge: counts.analises };
    if (item.route === "/mais/relatorios") return { ...item, badge: counts.laudos };
    return item;
  });
}

/** Card compacto no dashboard */
export function HomeLabCard({ diagnosticos, analises, laudos }: LabCounts) {
  const router = useRouter();
  const total = diagnosticos + analises + laudos;

  return (
    <TouchableOpacity
      style={{
        width: "31%",
        backgroundColor: LAB_COLORS.brand,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: LAB_COLORS.brandLight,
        minHeight: 100,
        shadowColor: LAB_COLORS.brand,
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
      }}
      onPress={() => router.push("/mais/laboratorio" as any)}
      activeOpacity={0.85}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.15)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 2,
        }}
      >
        <IconSymbol name="flask.fill" size={18} color="#FFFFFF" />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#FFFFFF" }}>{total}</Text>
      <Text
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.9)",
          marginTop: 4,
          textAlign: "center",
          fontWeight: "600",
        }}
        numberOfLines={1}
      >
        Laboratório
      </Text>
    </TouchableOpacity>
  );
}

/** Painel da página /mais/laboratorio */
export function LaboratorioPanel({ diagnosticos, analises, laudos }: LabCounts) {
  const colors = useColors();
  const router = useRouter();
  const items = withBadges(LAB_ITEMS, { diagnosticos, analises, laudos });

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: LAB_COLORS.brandSoft + "40",
      overflow: "hidden",
    },
    summaryChip: {
      flex: 1,
      backgroundColor: LAB_COLORS.chip,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    gridItem: {
      width: "50%",
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    gridBtn: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 86,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    badge: {
      position: "absolute",
      top: 8,
      right: 8,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: LAB_COLORS.brandLight,
    },
  });

  return (
    <View style={styles.card}>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: LAB_COLORS.brandLight,
        }}
      >
        {[
          { label: "Diagnósticos", value: diagnosticos },
          { label: "Análises", value: analises },
          { label: "Laudos", value: laudos },
        ].map((stat) => (
          <View key={stat.label} style={styles.summaryChip}>
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700" }}>{stat.value}</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, marginTop: 2 }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          paddingHorizontal: 10,
          paddingVertical: 10,
          backgroundColor: colors.primary + "0A",
        }}
      >
        {items.map((item) => (
          <View key={item.route} style={styles.gridItem}>
            <TouchableOpacity
              style={styles.gridBtn}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              {item.badge !== undefined && Number(item.badge) > 0 ? (
                <View style={styles.badge}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFFFFF" }}>{item.badge}</Text>
                </View>
              ) : null}
              <View style={[styles.iconWrap, { backgroundColor: item.color + "1A" }]}>
                <IconSymbol name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

/** @deprecated use LaboratorioPanel */
export const AfuLabPanel = LaboratorioPanel;

/** @deprecated use LAB_COLORS */
export const AFU_LAB = LAB_COLORS;
