import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}

/**
 * AuthButton — Botão reutilizável para formulários de autenticação
 *
 * Variantes:
 * - primary: Botão principal (verde)
 * - secondary: Botão secundário (cinza)
 * - outline: Botão com borda (transparente)
 *
 * Tamanhos:
 * - small: Botão pequeno
 * - medium: Botão médio
 * - large: Botão grande (padrão)
 */
export function AuthButton({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
}: AuthButtonProps) {
  const colors = useColors();

  // Estilos por variante
  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-muted',
    outline: 'border border-primary bg-transparent',
  };

  // Estilos por tamanho
  const sizeStyles = {
    small: 'px-4 py-2',
    medium: 'px-6 py-3',
    large: 'px-8 py-4',
  };

  // Estilos de texto por variante
  const textColorStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-lg items-center justify-center flex-row gap-2 ${variantStyles[variant]} ${sizeStyles[size]} ${
        isDisabled ? 'opacity-50' : 'opacity-100'
      }`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : 'white'} />
      ) : (
        <>
          {icon && <Text className="text-lg">{icon}</Text>}
          <Text className={`font-semibold text-base ${textColorStyles[variant]}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
