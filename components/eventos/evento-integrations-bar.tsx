import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";

/** Etapa 6 — atalhos de integração com o ecossistema AFU. */
export function EventoIntegrationsBar() {
  const colors = useColors();
  const router = useRouter();

  const links = [
    { label: "Clima", href: "/mais/tempo", color: MODULE_COLORS.clima },
    { label: "Diagnóstico", href: "/(tabs)/diagnostico", color: MODULE_COLORS.diagnostico },
    { label: "Cultivos", href: "/(tabs)/cultivos", color: MODULE_COLORS.cultivos },
    { label: "Propriedades", href: "/(tabs)/propriedades", color: MODULE_COLORS.propriedades },
    { label: "Marketplace", href: "/(tabs)/marketplace", color: MODULE_COLORS.marketplace },
  ] as const;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {links.map((link) => (
        <TouchableOpacity
          key={link.href}
          onPress={() => router.push(link.href as any)}
          accessibilityRole="link"
          accessibilityLabel={`Abrir ${link.label}`}
          style={[
            styles.chip,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: link.color }}>{link.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 6,
    flexDirection: "row",
  },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
