import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface AuthTextInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: string;
  error?: string;
  editable?: boolean;
  autoComplete?: 'off' | 'email' | 'password';
}

/**
 * AuthTextInput — Componente de input reutilizável para formulários de autenticação
 *
 * Características:
 * - Label acima do input
 * - Ícone opcional à esquerda
 * - Toggle para mostrar/ocultar senha
 * - Mensagem de erro abaixo
 * - Estilos responsivos
 */
export function AuthTextInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
  error,
  editable = true,
  autoComplete = 'off',
}: AuthTextInputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  return (
    <View className="mb-4">
      {/* Label */}
      <Text className="text-sm font-semibold text-foreground mb-2">{label}</Text>

      {/* Input Container */}
      <View
        className={`flex-row items-center border rounded-lg px-3 py-3 ${
          error ? 'border-error bg-error/5' : 'border-border bg-background'
        }`}
      >
        {/* Ícone */}
        {icon && <Text className="text-lg mr-2">{icon}</Text>}

        {/* TextInput */}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          editable={editable}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete={autoComplete}
          textContentType="none"
          importantForAutofill="no"
          className="flex-1 text-foreground text-base"
          style={{ color: colors.foreground }}
        />

        {/* Toggle Senha */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2"
          >
            <Text className="text-lg">{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mensagem de Erro */}
      {error && <Text className="text-xs text-error mt-1">{error}</Text>}
    </View>
  );
}
