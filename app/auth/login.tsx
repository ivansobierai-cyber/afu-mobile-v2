import React, { useState, useEffect } from 'react';
import { View, Text as RNText, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthCard } from '@/components/auth-card';
import { AuthTextInput } from '@/components/auth-text-input';
import { AuthButton } from '@/components/auth-button';
import { useAuthAPI } from '@/hooks/use-auth-api';
import { useSession } from '@/hooks/use-session';
import { useColors } from '@/hooks/use-colors';
import { startOAuthLogin } from '@/constants/oauth';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useSession();
  const { login: loginAPI, isLoading: apiLoading, error: apiError, clearError } = useAuthAPI();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <RNText className="text-lg text-muted">Verificando autenticação...</RNText>
      </ScreenContainer>
    );
  }

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

    if (result.success) {
      router.replace('/(tabs)');
    } else if (result.error) {
      setErrors({ email: result.error.message });
    }
  };

  const handleOAuthLogin = async () => {
    try {
      await startOAuthLogin();
    } catch (err) {
      console.error('[LoginScreen] OAuth error:', err);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <AuthCard
              title="Bem-vindo de Volta"
              subtitle="Faça login para acessar sua conta"
              icon="🔐"
            >
              <View style={{ gap: 16 }}>
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
                  editable={!apiLoading}
                />

                {apiError && (
                  <View style={{ backgroundColor: colors.error, padding: 12, borderRadius: 8 }}>
                    <RNText style={{ color: '#fff', fontSize: 13 }}>{apiError.message}</RNText>
                  </View>
                )}

                <AuthButton
                  label={apiLoading ? 'Entrando...' : 'Entrar'}
                  onPress={handleEmailLogin}
                  disabled={apiLoading}
                  variant="primary"
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
                  <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                    <RNText style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>Esqueceu a senha?</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/auth/cadastro')}>
                    <RNText style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>Criar conta</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            </AuthCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
