import React, { useState, useEffect } from 'react';
import { View, Text as RNText, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthCard } from '@/components/auth-card';
import { AuthTextInput } from '@/components/auth-text-input';
import { AuthButton } from '@/components/auth-button';
import { useAuthAPI } from '@/hooks/use-auth-api';
import { useSession } from '@/hooks/use-session';
import { useColors } from '@/hooks/use-colors';
import { startOAuthLogin } from '@/constants/oauth';

const FORM_MAX_WIDTH = 520;

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useSession();
  const {
    login: loginAPI,
    verifyMfa: verifyMfaAPI,
    isLoading: apiLoading,
    error: apiError,
    clearError,
  } = useAuthAPI();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; mfa?: string }>({});

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading, router]);

  // Formulário público imediato — sessão resolve em background (sem bloquear a UI)

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async () => {
    if (!validateForm()) return;

    clearError();
    const result = await loginAPI({ email, password });

    if (result.mfaRequired && result.mfaToken) {
      setMfaToken(result.mfaToken);
      setMfaCode('');
      setErrors({});
      return;
    }

    if (result.success) {
      if (result.mfaSetupRequired) {
        router.replace('/mais/seguranca-mfa' as never);
      } else {
        router.replace('/(tabs)');
      }
    } else if (result.error) {
      setErrors({ email: result.error.message });
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaToken) return;
    const cleaned = mfaCode.trim();
    if (cleaned.length < 6) {
      setErrors({ mfa: 'Informe o código de 6 dígitos ou um código de recuperação' });
      return;
    }
    clearError();
    const result = await verifyMfaAPI({ mfaToken, code: cleaned });
    if (result.success) {
      router.replace('/(tabs)');
    } else if (result.error) {
      setErrors({ mfa: result.error.message });
    }
  };

  const handleOAuthLogin = async () => {
    try {
      await startOAuthLogin();
    } catch (err) {
      console.error('[LoginScreen] OAuth error:', err);
    }
  };

  const mfaStep = Boolean(mfaToken);

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
          <View
            style={{
              paddingHorizontal: 20,
              width: '100%',
              maxWidth: FORM_MAX_WIDTH,
              alignSelf: 'center',
            }}
          >
            <AuthCard
              title={mfaStep ? 'Verificação em duas etapas' : 'Bem-vindo de volta'}
              subtitle={
                mfaStep
                  ? 'Digite o código do autenticador ou um código de recuperação'
                  : 'Faça login para acessar sua conta'
              }
              icon={mfaStep ? '🛡️' : '🔐'}
            >
              <View style={{ gap: 16 }}>
                {!mfaStep ? (
                  <>
                    <AuthTextInput
                      label="E-mail"
                      placeholder="seu@email.com"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      error={errors.email}
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!apiLoading}
                    />

                    <AuthTextInput
                      label="Senha"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      error={errors.password}
                      secureTextEntry
                      autoComplete="current-password"
                      editable={!apiLoading}
                    />
                  </>
                ) : (
                  <AuthTextInput
                    label="Código MFA"
                    placeholder="000000 ou XXXXX-XXXXX"
                    value={mfaCode}
                    onChangeText={(text) => {
                      setMfaCode(text);
                      if (errors.mfa) setErrors({ ...errors, mfa: undefined });
                    }}
                    error={errors.mfa}
                    keyboardType="default"
                    autoComplete="off"
                    editable={!apiLoading}
                  />
                )}

                {apiError && (
                  <View style={{ backgroundColor: colors.error, padding: 12, borderRadius: 8 }}>
                    <RNText style={{ color: '#fff', fontSize: 13 }}>{apiError.message}</RNText>
                  </View>
                )}

                <AuthButton
                  label={
                    apiLoading
                      ? mfaStep
                        ? 'Verificando...'
                        : 'Entrando...'
                      : mfaStep
                        ? 'Confirmar código'
                        : 'Entrar'
                  }
                  onPress={mfaStep ? handleVerifyMfa : handleEmailLogin}
                  disabled={apiLoading}
                  variant="primary"
                />

                {mfaStep ? (
                  <AuthButton
                    label="Voltar ao login"
                    onPress={() => {
                      setMfaToken(null);
                      setMfaCode('');
                      setErrors({});
                      clearError();
                    }}
                    disabled={apiLoading}
                    variant="outline"
                  />
                ) : (
                  <>
                    <AuthButton
                      label="Criar usuário / Nova conta"
                      onPress={() => router.push('/auth/cadastro')}
                      disabled={apiLoading}
                      variant="outline"
                    />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                      <RNText style={{ marginHorizontal: 12, color: colors.muted, fontSize: 13 }}>OU</RNText>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                    </View>

                    <AuthButton
                      label="Entrar com OAuth"
                      onPress={handleOAuthLogin}
                      disabled={apiLoading}
                      variant="outline"
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Pressable
                        onPress={() => router.push('/auth/forgot-password')}
                        accessibilityRole="link"
                        accessibilityLabel="Esqueceu a senha?"
                      >
                        <RNText style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>Esqueceu a senha?</RNText>
                      </Pressable>
                      <Pressable
                        onPress={() => router.push('/auth/cadastro')}
                        accessibilityRole="link"
                        accessibilityLabel="Criar conta"
                      >
                        <RNText style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>Criar conta</RNText>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </AuthCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
