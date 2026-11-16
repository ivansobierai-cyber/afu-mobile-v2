import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RouteGuard } from "@/components/route-guard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  scheduled: "Agendada",
  cancelled: "Cancelada",
  anonymized: "Anonimizada",
  rejected: "Rejeitada",
};

function AdminLgpdContent() {
  const colors = useColors();
  const router = useRouter();
  const [filtro, setFiltro] = useState<
    "scheduled" | "pending" | "cancelled" | "anonymized" | "rejected" | undefined
  >("scheduled");

  const { data, isLoading, refetch } = trpc.auth.lgpd.adminListEraseRequests.useQuery({
    status: filtro,
    limit: 100,
    offset: 0,
  });

  const cancelMut = trpc.auth.lgpd.adminCancelErase.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert("OK", "Solicitação cancelada; perfil pode ser reativado.");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const anonMut = trpc.auth.lgpd.adminAnonymize.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert("Anonimizado", "Dados pessoais substituídos. Sem hard-delete.");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const requests = data?.requests ?? [];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
            LGPD — Exclusões
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Solicitações com graça; nunca exclusão imediata
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
        {([undefined, "scheduled", "anonymized", "cancelled"] as const).map((s) => (
          <TouchableOpacity
            key={String(s)}
            onPress={() => setFiltro(s)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: filtro === s ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: filtro === s ? "#fff" : colors.foreground,
              }}
            >
              {s ? STATUS_LABELS[s] : "Todas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 24 }}>
              Nenhuma solicitação neste filtro.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontWeight: "800", color: colors.foreground }}>
                #{item.id} · userId {item.userId}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                Status: {STATUS_LABELS[item.status] ?? item.status}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                Solicitado: {new Date(item.requestedAt).toLocaleString("pt-BR")}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Anonimizar em: {new Date(item.scheduledAnonymizeAt).toLocaleString("pt-BR")}
              </Text>
              {item.reason ? (
                <Text style={{ color: colors.foreground, fontSize: 13, marginTop: 8 }}>
                  Motivo: {item.reason}
                </Text>
              ) : null}

              {item.status === "scheduled" || item.status === "pending" ? (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                    }}
                    onPress={() =>
                      Alert.alert("Cancelar solicitação?", "O usuário poderá voltar a usar a conta.", [
                        { text: "Não", style: "cancel" },
                        {
                          text: "Cancelar",
                          onPress: () =>
                            cancelMut.mutate({ requestId: item.id, userId: item.userId }),
                        },
                      ])
                    }
                  >
                    <Text style={{ fontWeight: "700", color: colors.foreground }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: colors.error,
                      alignItems: "center",
                    }}
                    onPress={() =>
                      Alert.alert(
                        "Anonimizar agora?",
                        "Substitui dados pessoais. Não apaga linhas operacionais (sem hard-delete). Force ignora graça restante.",
                        [
                          { text: "Não", style: "cancel" },
                          {
                            text: "Anonimizar",
                            style: "destructive",
                            onPress: () =>
                              anonMut.mutate({
                                requestId: item.id,
                                force: true,
                                adminNotes: "Processado via admin-lgpd",
                              }),
                          },
                        ],
                      )
                    }
                  >
                    <Text style={{ fontWeight: "700", color: "#fff" }}>Anonimizar</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

export default function AdminLgpdScreen() {
  return (
    <RouteGuard requireAdmin>
      <AdminLgpdContent />
    </RouteGuard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
});
