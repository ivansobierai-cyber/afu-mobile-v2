import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ComponentProps } from "react";

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconName?: ComponentProps<typeof IconSymbol>["name"];
}

export function AuthButton({
  label,
  onPress,
  variant = "primary",
  size = "large",
  loading = false,
  disabled = false,
  icon,
  iconName,
}: AuthButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const isWeb = Platform.OS === "web";
  const iconColor =
    variant === "outline" ? colors.primary : "#FFFFFF";

  const variantStyles = {
    primary: "bg-primary",
    secondary: "bg-muted",
    outline: "border border-primary bg-transparent",
  };

  const sizeStyles = {
    small: "px-4 py-2",
    medium: "px-6 py-3",
    large: "px-8 py-4",
  };

  const textColorStyles = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-primary",
  };

  const webButtonStyle: ViewStyle | undefined = isWeb
    ? {
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: size === "small" ? 16 : size === "medium" ? 24 : 32,
        paddingVertical: size === "small" ? 8 : size === "medium" ? 12 : 16,
        opacity: isDisabled ? 0.5 : 1,
        ...(variant === "primary"
          ? { backgroundColor: colors.primary }
          : variant === "secondary"
            ? { backgroundColor: colors.muted }
            : {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: colors.primary,
              }),
      }
    : undefined;

  const webTextColor =
    variant === "outline" ? colors.primary : "#FFFFFF";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={
        isWeb
          ? undefined
          : `rounded-lg items-center justify-center flex-row gap-2 ${variantStyles[variant]} ${sizeStyles[size]} ${
              isDisabled ? "opacity-50" : "opacity-100"
            }`
      }
      style={webButtonStyle}
      activeOpacity={0.8}
      {...(isWeb
        ? ({
            // web: prefer native button semantics when Pressable maps to div
            role: "button",
          } as object)
        : {})}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.primary : "white"} />
      ) : (
        <>
          {iconName ? (
            <IconSymbol name={iconName} size={20} color={iconColor} />
          ) : icon ? (
            isWeb ? (
              <Text style={styles.webIcon}>{icon}</Text>
            ) : (
              <Text className="text-lg">{icon}</Text>
            )
          ) : null}
          {isWeb ? (
            <Text style={[styles.webLabel, { color: webTextColor }]}>{label}</Text>
          ) : (
            <Text className={`font-semibold text-base ${textColorStyles[variant]}`}>{label}</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  webIcon: {
    fontSize: 18,
  },
  webLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
