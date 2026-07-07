import React, { useState, useEffect } from 'react';
import { View, Text as RNText, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthCard } from '@/components/auth-card';
import { AuthTextInput } from '@/components/auth-text-input';
import { AuthButton } from '@/components/auth-button';
import { apiCall } from '@/lib/_core/api';
import { useAuth } from '@/hooks/use-auth';

/**
 * Tela de Redefinição de Senha
 *
 * Oferece:
 * - Validação de token de reset
 * - Campos para nova senha e confirmação
 * - Redefinição de senha
 * - Link para voltar ao login
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { refresh: refreshAuth } = useAuth({ autoFetch: false });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  // Validar token ao carregar
  useEffect(() => {
    if (!token) {
      setError('Token de reset não fornecido');
      setValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  // Validar token
  const validateToken = async () => {
    if (!token) return;

    try {
      const result = await apiCall<{ valid: boolean; userId?: number; message: string }>(
        `/api/trpc/auth.validateResetToken?input=${JSON.stringify({ token })}`,
        { method: 'GET' }
      );

      if (result.valid) {
        setTokenValid(true);
        setError(null);
      } else {
        setError(result.message || 'Token inválido ou expirado');
        setTokenValid(false);
      }
    } catch (err: any) {
      console.error('[ResetPasswordScreen] Erro ao validar token:', err);
      setError(err?.message || 'Erro ao validar token');
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Senha é obrigatória';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Redefinir senha
  const handleResetPassword = async () => {
    if (!validateForm() || !token) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall<{ success: boolean; message: string }>(
        '/api/trpc/auth.resetPassword',
        {
          method: 'POST',
          body: JSON.stringify({
            token,
            newPassword,
            confirmPassword,
          }),
        }
      );

      if (result.success) {
        Alert.alert(
          'Sucesso',
          'Sua senha foi redefinida com sucesso! Redirecionando para login...',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/auth/login');
              },
            },
          ]
        );
      } else {
        setError(result.message || 'Erro ao redefinir senha');
      }
    } catch (err: any) {
      console.error('[ResetPasswordScreen] Erro:', err);
      setError(err?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  // Validando token
  if (validating) {
    return (
      <ScreenContainer className="items-center justify-center">
        <RNText className="text-lg text-muted">Validando link de recuperação...</RNText>
      </ScreenContainer>
    );
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <AuthCard title="Link Expirado" subtitle="O link de recuperação não é mais válido" icon="⚠️">
            <View className="mb-6 p-4 bg-error/10 rounded-lg border border-error">
              <RNText className="text-error text-sm font-semibold">{error}</RNText>
            </View>

            <View className="mb-6 p-4 bg-surface rounded-lg">
              <RNText className="text-xs text-muted leading-relaxed">
                Links de recuperação expiram após 1 hora. Solicite um novo link de recuperação.
              </RNText>
            </View>

            <AuthButton
              label="Solicitar Novo Link"
              onPress={() => router.push('/auth/forgot-password')}
              size="large"
              icon="🔑"
            />

            <View className="flex-row justify-center gap-1 mt-6">
              <RNText className="text-muted">Lembrou da senha? </RNText>
              <AuthButton
                label="Faça login"
                onPress={() => router.push('/auth/login')}
                variant="outline"
                size="small"
              />
            </View>
          </AuthCard>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Formulário de reset
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <AuthCard
            title="Redefinir Senha"
            subtitle="Digite sua nova senha"
            icon="🔐"
          >
            {/* Mensagem de erro */}
            {error && (
              <View className="mb-6 p-4 bg-error/10 rounded-lg border border-error">
                <RNText className="text-error text-sm font-semibold">{error}</RNText>
              </View>
            )}

            {/* Inputs */}
            <View className="gap-4 mb-6">
              <AuthTextInput
                label="Nova Senha"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  const newErrors = { ...errors };
                  delete newErrors.newPassword;
                  setErrors(newErrors);
                }}
                secureTextEntry
                icon="🔐"
                error={errors.newPassword}
              />

              <AuthTextInput
                label="Confirmar Senha"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  const newErrors = { ...errors };
                  delete newErrors.confirmPassword;
                  setErrors(newErrors);
                }}
                secureTextEntry
                icon="🔐"
                error={errors.confirmPassword}
              />
            </View>

            {/* Informação */}
            <View className="mb-6 p-4 bg-surface rounded-lg">
              <RNText className="text-xs text-muted leading-relaxed">
                Sua senha deve ter no mínimo 6 caracteres e conter números e letras para maior segurança.
              </RNText>
            </View>

            {/* Botão Redefinir */}
            <AuthButton
              label="Redefinir Senha"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              size="large"
              icon="✓"
            />

            {/* Link Voltar */}
            <View className="flex-row justify-center gap-1 mt-6">
              <RNText className="text-muted">Lembrou da senha? </RNText>
              <AuthButton
                label="Faça login"
                onPress={() => router.push('/auth/login')}
                variant="outline"
                size="small"
              />
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
