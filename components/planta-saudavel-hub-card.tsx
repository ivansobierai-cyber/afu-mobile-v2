import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MODULE_COLORS } from "@/constants/module-colors";
import type { ComponentProps } from "react";

type HubIcon = ComponentProps<typeof IconSymbol>["name"];

export type PlantaSaudavelAction = {
  id: string;
  label: string;
  icon: HubIcon;
  route: string;
  color?: string;
};

/** Atalhos Planta Saudável — caminhos canônicos do MVP */
export const PLANTA_SAUDAVEL_ACTIONS: PlantaSaudavelAction[] = [
  { id: "diagnostico", label: "Diagnóstico", icon: "camera.fill", route: "/(tabs)/diagnostico" },
  { id: "propriedades", label: "Propriedades", icon: "map.fill", route: "/(tabs)/propriedades" },
  { id: "calendario", label: "Calendário", icon: "calendar", route: "/mais/calendario" },
  { id: "laudos", label: "Laudos", icon: "doc.fill", route: "/mais/relatorios" },
];

type PlantaSaudavelHubCardProps = {
  diagnosticos?: number;
  analises?: number;
  laudos?: number;
};

export function PlantaSaudavelHubCard({
  diagnosticos = 0,
  analises = 0,
  laudos = 0,
}: PlantaSaudavelHubCardProps) {
  const router = useRouter();
  const brand = MODULE_COLORS.diagnostico;

  const badgeFor = (id: string) => {
    if (id === "diagnostico") return diagnosticos;
    if (id === "laudos") return laudos;
    return 0;
  };

  return (
    <View style={[styles.card, { backgroundColor: brand }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push("/mais/laboratorio" as any)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Planta Saudável — abrir laboratório"
      >
        <View style={styles.headerIcon}>
          <IconSymbol name="camera.fill" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Planta Saudável</Text>
          <Text style={styles.subtitle}>Diagnóstico · propriedades · laudos</Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        {PLANTA_SAUDAVEL_ACTIONS.map((action) => {
          const badge = badgeFor(action.id);
          return (
            <TouchableOpacity
              key={action.id}
              style={styles.actionChip}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
                </View>
              ) : null}
              <IconSymbol name={action.icon} size={16} color="#FFFFFF" />
              <Text style={styles.actionLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionChip: {
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    position: "relative",
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
    marginTop: 4,
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
