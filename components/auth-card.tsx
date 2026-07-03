import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: string;
}

/**
 * AuthCard — Container para formulários de autenticação
 *
 * Características:
 * - Título e subtítulo
 * - Ícone opcional
 * - ScrollView para conteúdo longo
 * - Estilos responsivos
 */
export function AuthCard({ title, subtitle, children, icon }: AuthCardProps) {
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      className="flex-1 px-6 py-8"
    >
      {/* Ícone */}
      {icon && <Text className="text-6xl text-center mb-4">{icon}</Text>}

      {/* Título */}
      <Text className="text-3xl font-bold text-foreground text-center mb-2">{title}</Text>

      {/* Subtítulo */}
      {subtitle && (
        <Text className="text-base text-muted text-center mb-8">{subtitle}</Text>
      )}

      {/* Conteúdo */}
      <View className="flex-1">{children}</View>
    </ScrollView>
  );
}
