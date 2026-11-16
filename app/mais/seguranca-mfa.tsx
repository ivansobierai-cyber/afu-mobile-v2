/**
 * WP-08 — Configuração MFA (TOTP) do titular.
 * Conteúdo documental de autenticação permanece em outras telas;
 * esta é a UI operacional de enroll / recovery / disable.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function SegurancaMfaScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: status, isLoading } = trpc.auth.mfa.status.useQuery();
  const setupMut = trpc.auth.mfa.setup.useMutation();
  const confirmMut = trpc.auth.mfa.confirm.useMutation({
    onSuccess: () => utils.auth.mfa.status.invalidate(),
  });
  const disableMut = trpc.auth.mfa.disable.useMutation({
    onSuccess: () => utils.auth.mfa.status.invalidate(),
  });
  const regenMut = trpc.auth.mfa.regenerateRecoveryCodes.useMutation({
    onSuccess: () => utils.auth.mfa.status.invalidate(),
  });

  const [setup, setSetup] = useState<{
    secret: string;
    otpauthUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const startSetup = async () => {
    setBusy(true);
    try {
      const result = await setupMut.mutateAsync();
      setSetup(result);
      setRecoveryCodes(null);
      setCode("");
    } catch (e: unknown) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Falha ao iniciar MFA");
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async () => {
    if (code.trim().length < 6) {
      Alert.alert("Código", "Informe o código de 6 dígitos do autenticador");
      return;
    }
    setBusy(true);
    try {
      const result = await confirmMut.mutateAsync({ code: code.trim() });
      setRecoveryCodes(result.recoveryCodes);
      setSetup(null);
      setCode("");
      Alert.alert(
        "MFA ativo",
        "Guarde os códigos de recuperação em local seguro. Eles só são mostrados agora.",
      );
    } catch (e: unknown) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Código inválido");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (code.trim().length < 6) {
      Alert.alert("Informe o código TOTP ou de recuperação no campo abaixo");
      return;
    }
    setBusy(true);
    try {
      await disableMut.mutateAsync({ code: code.trim() });
      setRecoveryCodes(null);
      setSetup(null);
      setCode("");
      Alert.alert("MFA desativado");
    } catch (e: unknown) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Falha");
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    if (code.trim().length < 6) {
      Alert.alert("Informe um código TOTP válido no campo abaixo");
      return;
    }
    setBusy(true);
    try {
      const result = await regenMut.mutateAsync({ code: code.trim() });
      setRecoveryCodes(result.recoveryCodes);
      setCode("");
      Alert.alert("Novos códigos gerados", "Os códigos anteriores foram invalidados.");
    } catch (e: unknown) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Falha");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
            Segurança — MFA
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            TOTP (Google Authenticator / Authy). E-mail OTP virá depois.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "700", color: colors.foreground, fontSize: 16 }}>
              Status: {status?.enabled ? "Ativo" : "Inativo"}
            </Text>
            {status?.requiredForRole ? (
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                MFA é obrigatório para admin/técnico antes das APIs administrativas
                {status.setupRequired ? " — configure agora." : "."}
              </Text>
            ) : (
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                Opcional para o seu perfil. Recomendado para proteger a conta.
              </Text>
            )}
            {status?.enabled ? (
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Códigos de recuperação restantes: {status.recoveryCodesRemaining}
              </Text>
            ) : null}
          </View>
        )}

        {!status?.enabled && !setup ? (
          <TouchableOpacity
            onPress={startSetup}
            disabled={busy}
            style={{
              backgroundColor: colors.primary,
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {busy ? "Gerando…" : "Ativar autenticador (QR)"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {setup ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 12,
            }}
          >
            <Text style={{ fontWeight: "700", color: colors.foreground }}>
              Escaneie o QR no app autenticador
            </Text>
            <Image
              source={{ uri: setup.qrDataUrl }}
              style={{ width: 220, height: 220, alignSelf: "center" }}
              accessibilityLabel="QR code MFA"
            />
            <Text style={{ fontSize: 12, color: colors.muted }}>
              Ou digite a chave manualmente (guarde offline; não compartilhe):
            </Text>
            <Text
              selectable
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                color: colors.foreground,
                backgroundColor: colors.background,
                padding: 10,
                borderRadius: 8,
              }}
            >
              {setup.secret}
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Código de 6 dígitos"
              keyboardType="number-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
              }}
            />
            <TouchableOpacity
              onPress={confirmSetup}
              disabled={busy}
              style={{
                backgroundColor: colors.primary,
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Confirmar e ativar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {recoveryCodes ? (
          <View
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 12,
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "800", color: "#92400E" }}>
              Códigos de recuperação (copie agora)
            </Text>
            {recoveryCodes.map((c) => (
              <Text key={c} selectable style={{ fontFamily: "monospace", color: "#78350F" }}>
                {c}
              </Text>
            ))}
          </View>
        ) : null}

        {status?.enabled ? (
          <View style={{ gap: 12 }}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Código TOTP ou recuperação"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
            />
            <TouchableOpacity
              onPress={regenerate}
              disabled={busy}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontWeight: "700", color: colors.foreground }}>
                Regenerar códigos de recuperação
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={disable}
              disabled={busy}
              style={{
                backgroundColor: "#B91C1C",
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Desativar MFA</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
});
