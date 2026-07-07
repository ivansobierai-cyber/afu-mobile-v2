import React, { useState } from 'react';
import { View, Text as RNText, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthCard } from '@/components/auth-card';
import { AuthTextInput } from '@/components/auth-text-input';
import { AuthButton } from '@/components/auth-button';
import { useAuthAPI } from '@/hooks/use-auth-api';

const PROFILE_TYPES = [
  { id: 'produtor', label: 'Produtor Rural', icon: '🚜', description: 'Gerencio propriedades e cultivos' },
  { id: 'tecnico', label: 'Técnico Agrícola', icon: '👨‍🔬', description: 'Faço diagnósticos e recomendações' },
  { id: 'administrador', label: 'Administrador', icon: '👨‍💼', description: 'Gerencio o sistema' },
];

export default function CadastroScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'profile' | 'form'>('profile');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signup: signupAPI, isLoading: apiLoading, error: apiError, clearError } = useAuthAPI();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nome deve ter no mínimo 3 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Telefone inválido (10 ou 11 dígitos)';
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
    }

    if (!agreeTerms) {
      newErrors.terms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!selectedProfile) {
      Alert.alert('Erro', 'Selecione um perfil para continuar');
      return;
    }
    setStep('form');
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    if (!selectedProfile) {
      Alert.alert('Erro', 'Selecione um perfil para continuar');
      return;
    }

    clearError();
    const result = await signupAPI({
      name,
      email,
      password,
      confirmPassword,
      profile: selectedProfile as 'produtor' | 'tecnico' | 'administrador',
    });

    if (result.success) {
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'Erro ao criar conta',
        result.error?.message || 'Falha ao criar conta. Tente novamente.',
      );
    }
  };

  if (step === 'profile') {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <AuthCard
            title="Qual é seu perfil?"
            subtitle="Escolha o tipo de usuário que melhor descreve você"
            icon="🎯"
          >
            <View className="gap-3">
              {PROFILE_TYPES.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  onPress={() => setSelectedProfile(profile.id)}
                  className={`p-4 rounded-lg border-2 flex-row gap-3 items-start ${
                    selectedProfile === profile.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface'
                  }`}
                >
                  <RNText className="text-3xl mt-1">{profile.icon}</RNText>
                  <View className="flex-1">
                    <RNText className="font-semibold text-foreground text-base">{profile.label}</RNText>
                    <RNText className="text-xs text-muted mt-1">{profile.description}</RNText>
                  </View>
                  {selectedProfile === profile.id && (
                    <RNText className="text-xl">✓</RNText>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View className="mt-8">
              <AuthButton label="Próximo" onPress={handleNextStep} size="large" icon="➜" />
            </View>

            <View className="flex-row justify-center gap-1 mt-6">
              <RNText className="text-muted">Já tem conta? </RNText>
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

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <AuthCard
            title="Crie sua conta"
            subtitle={`Perfil selecionado: ${PROFILE_TYPES.find((p) => p.id === selectedProfile)?.label}`}
            icon="✨"
          >
            <View className="gap-4 mb-6">
              <AuthTextInput
                label="Nome Completo"
                placeholder="Seu nome"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  const newErrors = { ...errors };
                  delete newErrors.name;
                  setErrors(newErrors);
                }}
                icon="👤"
                error={errors.name}
              />

              <AuthTextInput
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  const newErrors = { ...errors };
                  delete newErrors.email;
                  setErrors(newErrors);
                }}
                keyboardType="email-address"
                icon="✉️"
                error={errors.email}
              />

              <AuthTextInput
                label="Telefone"
                placeholder="(11) 99999-9999"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  const newErrors = { ...errors };
                  delete newErrors.phone;
                  setErrors(newErrors);
                }}
                keyboardType="phone-pad"
                icon="📱"
                error={errors.phone}
              />

              <AuthTextInput
                label="Senha"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  const newErrors = { ...errors };
                  delete newErrors.password;
                  setErrors(newErrors);
                }}
                secureTextEntry
                icon="🔐"
                error={errors.password}
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

            {apiError && (
              <RNText className="text-xs text-error mb-4">{apiError.message}</RNText>
            )}

            <TouchableOpacity
              onPress={() => setAgreeTerms(!agreeTerms)}
              className="flex-row items-center gap-2 mb-6 p-3 bg-surface rounded-lg"
            >
              <View className={`w-6 h-6 rounded border-2 items-center justify-center ${
                agreeTerms ? 'bg-primary border-primary' : 'border-border'
              }`}>
                {agreeTerms && <RNText className="text-white">✓</RNText>}
              </View>
              <RNText className="text-sm text-muted flex-1">
                Concordo com os termos de uso e política de privacidade
              </RNText>
            </TouchableOpacity>
            {errors.terms && <RNText className="text-xs text-error mb-4">{errors.terms}</RNText>}

            <View className="gap-3">
              <AuthButton
                label="Criar Conta"
                onPress={handleSignUp}
                loading={apiLoading}
                disabled={apiLoading}
                size="large"
                icon="✨"
              />

              <AuthButton
                label="Voltar"
                onPress={() => setStep('profile')}
                variant="outline"
                size="large"
              />
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
