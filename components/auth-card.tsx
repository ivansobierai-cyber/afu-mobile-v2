import React from "react";
import { Platform, View, Text } from "react-native";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: string;
}

/**
 * AuthCard — container de formulário de autenticação.
 * Título é h1 / header para leitores de tela e SEO web.
 */
export function AuthCard({ title, subtitle, children, icon }: AuthCardProps) {
  return (
    <View className="px-6 py-8">
      {icon && (
        <Text className="text-6xl text-center mb-4" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {icon}
        </Text>
      )}

      <Text
        accessibilityRole="header"
        className="text-3xl font-bold text-foreground text-center mb-2"
        {...(Platform.OS === "web"
          ? ({
              accessibilityLevel: 1,
              // @ts-expect-error RN web heading
              role: "heading",
              "aria-level": 1,
            } as object)
          : {})}
      >
        {title}
      </Text>

      {subtitle && (
        <Text className="text-base text-muted text-center mb-8">{subtitle}</Text>
      )}

      <View>{children}</View>
    </View>
  );
}
