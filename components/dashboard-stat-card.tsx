import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ComponentProps, ReactNode } from "react";

type IconName = ComponentProps<typeof IconSymbol>["name"];

export const DASHBOARD_LAYOUT = {
  columns: 3,
  gap: 8,
  cardMinHeight: 96,
  iconSize: 20,
  valueSize: 22,
  labelSize: 11,
} as const;

type DashboardStatCardProps = {
  label: string;
  value: number | string;
  icon: IconName;
  color: string;
  onPress: () => void;
  variant?: "default" | "accent";
  hint?: string;
};

export function DashboardStatCard({
  label,
  value,
  icon,
  color,
  onPress,
  variant = "default",
  hint,
}: DashboardStatCardProps) {
  const colors = useColors();
  const isAccent = variant === "accent";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          minHeight: DASHBOARD_LAYOUT.cardMinHeight,
          backgroundColor: isAccent ? color : colors.surface,
          borderColor: isAccent ? color : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ""}`}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isAccent ? "rgba(255,255,255,0.15)" : color + "18" },
        ]}
      >
        <IconSymbol name={icon} size={DASHBOARD_LAYOUT.iconSize} color={isAccent ? "#FFFFFF" : color} />
      </View>
      <Text
        style={[
          styles.value,
          { color: isAccent ? "#FFFFFF" : color, fontSize: DASHBOARD_LAYOUT.valueSize },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: isAccent ? "rgba(255,255,255,0.9)" : colors.muted,
            fontSize: DASHBOARD_LAYOUT.labelSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type DashboardStatGridProps = {
  children: ReactNode;
};

export function DashboardStatGrid({ children }: DashboardStatGridProps) {
  return <View style={styles.grid}>{children}</View>;
}

export function DashboardStatCell({ children }: { children: ReactNode }) {
  return <View style={styles.cell}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -DASHBOARD_LAYOUT.gap / 2,
    marginBottom: 20,
  },
  cell: {
    width: `${100 / DASHBOARD_LAYOUT.columns}%`,
    paddingHorizontal: DASHBOARD_LAYOUT.gap / 2,
    paddingBottom: DASHBOARD_LAYOUT.gap,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontWeight: "700",
    textAlign: "center",
  },
  label: {
    marginTop: 2,
    textAlign: "center",
    fontWeight: "600",
  },
});
