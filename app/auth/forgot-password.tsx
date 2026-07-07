import React, { useState } from 'react';
import { View, Text as RNText, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthCard } from '@/components/auth-card';
import { AuthTextInput } from '@/components/auth-text-input';
import { AuthButton } from '@/components/auth-button';
import { apiCall } from '@/lib/_core/api';
import { useResendEmail, formatCooldownTime, getCooldownMessage } from '@/hooks/use-resend-email';

/**
 * Tela de Recuperação de Senha — Solicitar Reset
 *
 * Oferece:
 * - Campo para inserir e-mail
 * - Validação de e-mail
 * - Envio de solicitação de reset
 * - Link para voltar ao login
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const resendEmail = useResendEmail(email, { cooldownDuration: 60, maxAttempts: 5 });

  // Validar e-mail
  const validateEmail = () => {
    if (!email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('E-mail inválido');
      return false;
    }
    return true;
  };

  // Solicitar reset de senha
  const handleRequestReset = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall<{ success: boolean; message: string; token?: string }>(
        '/api/trpc/auth.forgotPassword',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      );

      if (result.success) {
        setSuccess(true);
        Alert.alert(
          'E-mail enviado',
          'Se o e-mail existe em nossa base de dados, você receberá um link de recuperação em breve.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirecionar para tela de reset de senha se houver token (desenvolvimento)
                if (result.token) {
                  router.push({
                    pathname: '/auth/reset-password',
                    params: { token: result.token },
                  });
                } else {
                  // Em produção, usuário clicará no link do e-mail
                  router.push('/auth/login');
                }
              },
            },
          ]
        );
      } else {
        setError(result.message || 'Erro ao solicitar reset de senha');
      }
    } catch (err: any) {
      console.error('[ForgotPasswordScreen] Erro:', err);
      setError(err?.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 20 }}>
          <AuthCard
            title="Recuperar Senha"
            subtitle="Digite seu e-mail para receber um link de recuperação"
            icon="🔑"
          >
            {/* Mensagem de sucesso */}
            {success && (
              <View className="mb-6 p-4 bg-success/10 rounded-lg border border-success">
                <RNText className="text-success text-sm font-semibold">
                  ✓ Solicitação enviada com sucesso!
                </RNText>
              </View>
            )}

            {/* Mensagem de erro */}
            {error && !success && (
              <View className="mb-6 p-4 bg-error/10 rounded-lg border border-error">
                <RNText className="text-error text-sm font-semibold">{error}</RNText>
              </View>
            )}

            {/* Input de e-mail */}
            <View className="gap-4 mb-6">
              <AuthTextInput
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                keyboardType="email-address"
                autoComplete="email"
                icon="✉️"
                editable={!loading && !success}
              />
            </View>

            {/* Informação */}
            <View className="mb-6 p-4 bg-surface rounded-lg">
              <RNText className="text-xs text-muted leading-relaxed">
                Você receberá um e-mail com um link para redefinir sua senha. O link é válido por 1 hora.
              </RNText>
            </View>

            {/* Botão Enviar */}
            <AuthButton
              label={success ? 'E-mail enviado' : 'Enviar Link de Recuperação'}
              onPress={handleRequestReset}
              loading={loading}
              disabled={loading || success}
              size="large"
              icon={success ? '✓' : '➜'}
            />

            {/* Botão Reenviar com Cooldown */}
            {success && (
              <View className="mt-4 gap-2">
                <AuthButton
                  label={getCooldownMessage(resendEmail.cooldownSeconds)}
                  onPress={resendEmail.resendEmail}
                  loading={resendEmail.loading}
                  disabled={!resendEmail.canResend || resendEmail.loading}
                  variant="secondary"
                  size="medium"
                  icon={resendEmail.canResend ? '🔄' : '⏳'}
                />
                {resendEmail.error && (
                  <RNText className="text-error text-xs text-center">
                    {resendEmail.error}
                  </RNText>
                )}
                {resendEmail.success && (
                  <RNText className="text-success text-xs text-center">
                    ✓ E-mail reenviado com sucesso!
                  </RNText>
                )}
              </View>
            )}

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
