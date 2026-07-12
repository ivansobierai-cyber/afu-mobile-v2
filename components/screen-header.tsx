import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type IconName = ComponentProps<typeof IconSymbol>["name"];

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  accentColor?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  accentColor,
  onBack,
  showBack = true,
  right,
}: ScreenHeaderProps) {
  const colors = useColors();
  const router = useRouter();
  const bg = accentColor ?? colors.primary;

  return (
    <View style={[styles.wrapper, { backgroundColor: bg }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack ?? (() => router.back())}
            style={styles.iconBtn}
            accessibilityLabel="Voltar"
            activeOpacity={0.8}
          >
            <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ?? <View style={styles.spacer} />}
      </View>
    </View>
  );
}

type ScreenHeaderIconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function ScreenHeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  style,
}: ScreenHeaderIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.iconBtn, style]}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.8}
    >
      <IconSymbol name={icon} size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    width: 40,
    height: 40,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    lineHeight: 16,
  },
});
