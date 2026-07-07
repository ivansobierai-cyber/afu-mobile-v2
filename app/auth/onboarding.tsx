/**
 * onboarding.tsx — Criação de Perfil AFU (Pós-Login)
 */
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TIPOS = [
  { id: "produtor", label: "Produtor Rural", emoji: "🌾", desc: "Proprietário ou gestor de propriedade agrícola" },
  { id: "tecnico", label: "Técnico / Agrônomo", emoji: "🔬", desc: "Profissional habilitado em ciências agrárias" },
  { id: "parceiro", label: "Parceiro Comercial", emoji: "🤝", desc: "Revendedor, laboratório ou cooperativa" },
  { id: "comprador", label: "Comprador", emoji: "🛒", desc: "Interessado em produtos e serviços agrícolas" },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("produtor");
  const [cargo, setCargo] = useState("");
  const [registroProfissional, setRegistroProfissional] = useState("");

  const upsertMutation = trpc.auth.perfil.upsert.useMutation({
    onSuccess: () => {
      Alert.alert("✅ Perfil criado!", "Bem-vindo ao AFU Agro!", [
        { text: "Começar", onPress: () => router.replace("/(tabs)" as any) },
      ]);
    },
    onError: (err: { message: string }) => Alert.alert("Erro ao criar perfil", err.message),
  });

  const handleSalvar = () => {
    if (!nome.trim()) { Alert.alert("Preencha seu nome completo."); return; }
    upsertMutation.mutate({
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      tipoUsuario: tipoUsuario as any,
      cargo: cargo.trim() || undefined,
      registroProfissional: registroProfissional.trim() || undefined,
    });
  };

  const styles = StyleSheet.create({
    label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 },
    input: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
      fontSize: 15, color: colors.foreground, marginBottom: 16,
    },
  });

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🌿</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
              Bem-vindo ao AFU Agro
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              Complete seu perfil para personalizar sua experiência.
            </Text>
          </View>

          <Text style={styles.label}>Qual é o seu perfil?</Text>
          <View style={{ gap: 10, marginBottom: 20 }}>
            {TIPOS.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTipoUsuario(t.id)}
                style={{
                  backgroundColor: tipoUsuario === t.id ? colors.primary + "15" : colors.surface,
                  borderRadius: 12, padding: 14, borderWidth: 2,
                  borderColor: tipoUsuario === t.id ? colors.primary : colors.border,
                  flexDirection: "row", alignItems: "center", gap: 12,
                }}
              >
                <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: tipoUsuario === t.id ? colors.primary : colors.foreground }}>
                    {t.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{t.desc}</Text>
                </View>
                {tipoUsuario === t.id && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nome completo *</Text>
          <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor={colors.muted} value={nome} onChangeText={setNome} autoCapitalize="words" />

          <Text style={styles.label}>Telefone / WhatsApp</Text>
          <TextInput style={styles.input} placeholder="(00) 00000-0000" placeholderTextColor={colors.muted} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

          {(tipoUsuario === "tecnico" || tipoUsuario === "parceiro") && (
            <>
              <Text style={styles.label}>Cargo / Função</Text>
              <TextInput style={styles.input} placeholder="Ex: Engenheiro Agrônomo..." placeholderTextColor={colors.muted} value={cargo} onChangeText={setCargo} />
              <Text style={styles.label}>Registro Profissional (CREA/CRBio)</Text>
              <TextInput style={styles.input} placeholder="Ex: CREA-SP 123456" placeholderTextColor={colors.muted} value={registroProfissional} onChangeText={setRegistroProfissional} />
            </>
          )}

          <TouchableOpacity
            onPress={handleSalvar}
            disabled={upsertMutation.isPending}
            style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8, opacity: upsertMutation.isPending ? 0.7 : 1 }}
          >
            {upsertMutation.isPending
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Criar Perfil e Entrar</Text>
            }
          </TouchableOpacity>

          <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 12, lineHeight: 16 }}>
            Você poderá editar essas informações a qualquer momento no seu perfil.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
