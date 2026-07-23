import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

type Props = {
  title: string;
  message: string;
};

/** Placeholder de aba ainda não implementada (ondas seguintes do V2). */
export function CultivoTabPlaceholder({ title, message }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      accessibilityRole="summary"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20 },
});
