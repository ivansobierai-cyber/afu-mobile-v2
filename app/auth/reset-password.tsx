import React, { useState, useEffect } from 'react';
import { View, Text as RNText, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthCard } from '@/components/auth-card';
import { AuthTextInput } from '@/components/auth-text-input';
import { AuthButton } from '@/components/auth-button';
import { trpc } from '@/lib/trpc';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const validateQuery = trpc.auth.validateResetToken.useQuery(
    { token: token ?? '' },
    { enabled: !!token, retry: false },
  );
  const resetMutation = trpc.auth.resetPassword.useMutation();

  const validating = validateQuery.isLoading;
  const tokenValid = validateQuery.data?.valid === true;

  useEffect(() => {
    if (!token) setError('Token de reset não fornecido');
  }, [token]);

  useEffect(() => {
    if (validateQuery.error) {
      setError(validateQuery.error.message || 'Erro ao validar token');
    } else if (validateQuery.data && !validateQuery.data.valid) {
      setError(validateQuery.data.message || 'Token inválido ou expirado');
    }
  }, [validateQuery.data, validateQuery.error]);

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

  const handleResetPassword = async () => {
    if (!validateForm() || !token) return;
    setError(null);

    try {
      const result = await resetMutation.mutateAsync({
        token,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        Alert.alert(
          'Sucesso',
          'Sua senha foi redefinida com sucesso! Redirecionando para login...',
          [{ text: 'OK', onPress: () => router.replace('/auth/login-new') }],
        );
      } else {
        setError((result as any).message || 'Erro ao redefinir senha');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao redefinir senha');
    }
  };

  if (validating) {
    return (
      <ScreenContainer className="items-center justify-center">
        <RNText className="text-lg text-muted">Validando link de recuperação...</RNText>
      </ScreenContainer>
    );
  }

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
                onPress={() => router.push('/auth/login-new')}
                variant="outline"
                size="small"
              />
            </View>
          </AuthCard>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <AuthCard title="Redefinir Senha" subtitle="Digite sua nova senha" icon="🔐">
            {error && (
              <View className="mb-6 p-4 bg-error/10 rounded-lg border border-error">
                <RNText className="text-error text-sm font-semibold">{error}</RNText>
              </View>
            )}

            <View className="gap-4 mb-6">
              <AuthTextInput
                label="Nova Senha"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrors((prev) => { const { newPassword: _, ...rest } = prev; return rest; });
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
                  setErrors((prev) => { const { confirmPassword: _, ...rest } = prev; return rest; });
                }}
                secureTextEntry
                icon="🔐"
                error={errors.confirmPassword}
              />
            </View>

            <View className="mb-6 p-4 bg-surface rounded-lg">
              <RNText className="text-xs text-muted leading-relaxed">
                Sua senha deve ter no mínimo 6 caracteres e conter números e letras para maior segurança.
              </RNText>
            </View>

            <AuthButton
              label="Redefinir Senha"
              onPress={handleResetPassword}
              loading={resetMutation.isPending}
              disabled={resetMutation.isPending}
              size="large"
              icon="✓"
            />

            <View className="flex-row justify-center gap-1 mt-6">
              <RNText className="text-muted">Lembrou da senha? </RNText>
              <AuthButton
                label="Faça login"
                onPress={() => router.push('/auth/login-new')}
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
