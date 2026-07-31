import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  SMART_EVENT_TEMPLATES,
  type SmartEventTemplate,
} from "@/lib/eventos/smart-templates";

type Props = {
  onSelect: (template: SmartEventTemplate) => void;
  compact?: boolean;
};

/** Atalhos de Eventos inteligentes (Etapa 3). */
export function EventoSmartTemplates({ onSelect, compact }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.wrap, compact && { paddingVertical: 6 }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Eventos inteligentes
      </Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Toque para criar com título, prioridade e recorrência sugeridos
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {SMART_EVENT_TEMPLATES.map((tpl) => (
          <TouchableOpacity
            key={tpl.id}
            onPress={() => onSelect(tpl)}
            accessibilityRole="button"
            accessibilityLabel={`Criar evento inteligente ${tpl.label}`}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${tpl.color}22` }]}>
              <IconSymbol name={tpl.icon as "leaf.fill"} size={16} color={tpl.color} />
            </View>
            <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
              {tpl.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    width: 92,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});
