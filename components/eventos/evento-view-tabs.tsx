import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { EVENTO_VIEWS, type EventoViewId } from "@/lib/eventos/constants";
import { MODULE_COLORS } from "@/constants/module-colors";

type Props = {
  value: EventoViewId;
  onChange: (view: EventoViewId) => void;
};

export function EventoViewTabs({ value, onChange }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {EVENTO_VIEWS.map((view) => {
          const active = value === view.id;
          return (
            <TouchableOpacity
              key={view.id}
              onPress={() => onChange(view.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Visualização ${view.label}`}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? `${MODULE_COLORS.eventos}18` : "transparent",
                  borderColor: active ? MODULE_COLORS.eventos : colors.border,
                },
              ]}
            >
              <IconSymbol
                name={view.icon as "calendar"}
                size={14}
                color={active ? MODULE_COLORS.eventos : colors.muted}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: active ? MODULE_COLORS.eventos : colors.muted,
                }}
              >
                {view.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});
