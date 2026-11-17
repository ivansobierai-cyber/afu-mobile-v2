/**
 * WP-08 — Admin: consultar status MFA e resetar TOTP de outro usuário.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RouteGuard } from "@/components/route-guard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function AdminMfaContent() {
  const colors = useColors();
  const router = useRouter();
  const [userIdText, setUserIdText] = useState("");
  const [reason, setReason] = useState("");
  const userId = Number.parseInt(userIdText, 10);
  const validId = Number.isFinite(userId) && userId > 0;

  const statusQuery = trpc.auth.mfa.adminStatus.useQuery(
    { userId },
    { enabled: validId },
  );
  const resetMut = trpc.auth.mfa.adminReset.useMutation({
    onSuccess: () => {
      statusQuery.refetch();
      Alert.alert("MFA resetado", "O usuário precisará configurar o autenticador novamente.");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const handleReset = () => {
    if (!validId) {
      Alert.alert("Informe um userId válido");
      return;
    }
    Alert.alert(
      "Resetar MFA?",
      `Remove TOTP e códigos de recuperação do usuário ${userId}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resetar",
          style: "destructive",
          onPress: () =>
            resetMut.mutate({
              userId,
              reason: reason.trim() || "Reset administrativo WP-08",
            }),
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
            Admin — Reset MFA
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Desafio TOTP / recovery codes de outro usuário
          </Text>
        </View>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontWeight: "600", color: colors.foreground }}>User ID</Text>
        <TextInput
          value={userIdText}
          onChangeText={setUserIdText}
          keyboardType="number-pad"
          placeholder="ex.: 42"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            color: colors.foreground,
            backgroundColor: colors.surface,
          }}
        />
        <Text style={{ fontWeight: "600", color: colors.foreground }}>Motivo (opcional)</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Perda do autenticador / suporte"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            color: colors.foreground,
            backgroundColor: colors.surface,
          }}
        />

        {validId ? (
          statusQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : statusQuery.data ? (
            <View
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 4,
              }}
            >
              <Text style={{ color: colors.foreground }}>
                MFA: {statusQuery.data.enabled ? "Ativo" : "Inativo"}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Recovery restantes: {statusQuery.data.recoveryCodesRemaining}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Obrigatório no perfil: {statusQuery.data.requiredForRole ? "sim" : "não"}
              </Text>
            </View>
          ) : null
        ) : null}

        <TouchableOpacity
          onPress={handleReset}
          disabled={!validId || resetMut.isPending}
          style={{
            backgroundColor: "#B91C1C",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
            opacity: validId ? 1 : 0.5,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {resetMut.isPending ? "Resetando…" : "Resetar MFA do usuário"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

export default function AdminMfaScreen() {
  return (
    <RouteGuard requireAdmin>
      <AdminMfaContent />
    </RouteGuard>
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
