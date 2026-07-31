import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MODULE_COLORS } from "@/constants/module-colors";

type Props = {
  onPress: () => void;
  label?: string;
};

/** FAB moderno — acesso em 1 toque para criar evento. */
export function EventoFab({ onPress, label = "Novo" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Criar novo evento"
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: MODULE_COLORS.eventos,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.inner}>
        <IconSymbol name="plus" size={20} color="#fff" />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    zIndex: 20,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
