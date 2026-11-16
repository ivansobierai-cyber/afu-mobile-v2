/**
 * WP-06 — Detalhe do produtor: propriedades, atividade, soft-deactivate, plano/role.
 */
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RouteGuard } from "@/components/route-guard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso",
};
const PLANO_LABELS: Record<string, string> = {
  free: "Free",
  produtor: "Produtor",
  pro: "Pro",
  enterprise: "Enterprise",
};
const PLANO_CORES: Record<string, string> = {
  free: "#6B7280",
  produtor: "#16A34A",
  pro: "#2563EB",
  enterprise: "#7C3AED",
};

function AdminProdutorDetalheContent() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    produtorId?: string;
    userId?: string;
  }>();

  const produtorId = params.produtorId ? Number(params.produtorId) : undefined;
  const userId = params.userId
    ? Number(params.userId)
    : params.id
      ? Number(params.id)
      : undefined;

  const { data, isLoading, error, refetch } = trpc.adminProdutores.detalhe.useQuery(
    produtorId
      ? { produtorId }
      : { userId: userId! },
    { enabled: produtorId != null || (userId != null && !Number.isNaN(userId)) },
  );

  const utils = trpc.useUtils();
  const invalidate = () => {
    refetch();
    utils.adminProdutores.listar.invalidate();
    utils.adminProdutores.stats.invalidate();
  };

  const desativar = trpc.adminProdutores.desativar.useMutation({
    onSuccess: () => {
      invalidate();
      Alert.alert("Desativado", "Conta suspensa e cadastro marcado inativo (soft).");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });
  const reativar = trpc.adminProdutores.reativar.useMutation({
    onSuccess: () => {
      invalidate();
      Alert.alert("Reativado", "Produtor ativo novamente.");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });
  const setPlano = trpc.adminProdutores.setPlano.useMutation({
    onSuccess: () => {
      invalidate();
      Alert.alert("Plano atualizado");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });
  const setRole = trpc.adminProdutores.setRole.useMutation({
    onSuccess: () => {
      invalidate();
      Alert.alert("Role atualizado");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });
  const setTipo = trpc.adminProdutores.setTipo.useMutation({
    onSuccess: () => {
      invalidate();
      Alert.alert("Tipo atualizado");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btn: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
    },
  });

  return (
    <ScreenContainer>
      <View
        style={{
          backgroundColor: "#1B5E20",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
            {data?.nome ?? "Detalhe do produtor"}
          </Text>
          <Text style={{ color: "#A5D6A7", fontSize: 12, marginTop: 2 }}>
            {data?.email ?? "—"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ color: colors.error }}>{error.message}</Text>
        ) : !data ? (
          <Text style={{ color: colors.muted }}>Produtor não encontrado</Text>
        ) : (
          <>
            <View style={styles.card}>
              {[
                { label: "User ID", value: String(data.userId) },
                { label: "Produtor ID", value: data.produtorId != null ? String(data.produtorId) : "—" },
                { label: "Status", value: STATUS_LABELS[data.status] ?? data.status },
                { label: "Role", value: data.role },
                { label: "Tipo AFU", value: data.tipoUsuario },
                {
                  label: "Plano",
                  value: data.plano ? PLANO_LABELS[data.plano] ?? data.plano : "—",
                },
                {
                  label: "Local",
                  value: [data.cidade, data.estado, data.regiao].filter(Boolean).join(" · ") || "—",
                },
                {
                  label: "Cadastro ativo",
                  value: data.cadastroAtivo == null ? "—" : data.cadastroAtivo ? "Sim" : "Não",
                },
                {
                  label: "Org",
                  value: data.organizationId != null ? String(data.organizationId) : "—",
                },
              ].map((row) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 6,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.muted }}>{row.label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                Contagens
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                Propriedades ativas: {data.contagens.propriedadesAtivas} · arquivadas:{" "}
                {data.contagens.propriedadesArquivadas}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                Diagnósticos: {data.contagens.diagnosticos} · Análises: {data.contagens.analises}
              </Text>
            </View>

            <Text style={{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Propriedades
            </Text>
            {data.propriedades.length === 0 ? (
              <Text style={{ color: colors.muted, marginBottom: 12 }}>Nenhuma propriedade</Text>
            ) : (
              data.propriedades.map((p) => (
                <View key={p.id} style={styles.card}>
                  <Text style={{ fontWeight: "700", color: colors.foreground }}>{p.nome}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {[p.cidade, p.estado].filter(Boolean).join(" · ") || "Sem local"}
                    {p.tamanhoArea ? ` · ${p.tamanhoArea} ${p.unidadeArea ?? "ha"}` : ""}
                    {p.archivedAt ? " · arquivada" : ""}
                  </Text>
                </View>
              ))
            )}

            <Text style={{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Atividade recente
            </Text>
            {data.atividadeRecente.length === 0 ? (
              <Text style={{ color: colors.muted, marginBottom: 12 }}>Sem atividade</Text>
            ) : (
              data.atividadeRecente.slice(0, 15).map((a) => (
                <View key={`${a.tipo}-${a.id}`} style={styles.card}>
                  <Text style={{ fontWeight: "600", color: colors.foreground }}>
                    {a.tipo === "diagnostico" ? "Diagnóstico" : "Análise"} · {a.titulo}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {a.gravidadeOuTipo ?? "—"} · {new Date(a.createdAt).toLocaleString("pt-BR")}
                  </Text>
                </View>
              ))
            )}

            <Text style={{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Alterar plano
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
              {(["free", "produtor", "pro", "enterprise"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  disabled={data.produtorId == null}
                  style={[
                    styles.btn,
                    {
                      borderColor: PLANO_CORES[p],
                      backgroundColor: PLANO_CORES[p] + "15",
                      opacity: data.produtorId == null ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (data.produtorId == null) return;
                    setPlano.mutate({ produtorId: data.produtorId, plano: p });
                  }}
                >
                  <Text style={{ color: PLANO_CORES[p], fontWeight: "700", fontSize: 12 }}>
                    {PLANO_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Role / tipo
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.btn, { borderColor: "#7C3AED", backgroundColor: "#7C3AED15" }]}
                onPress={() =>
                  setRole.mutate({
                    userId: data.userId,
                    role: data.role === "admin" ? "user" : "admin",
                  })
                }
              >
                <Text style={{ color: "#7C3AED", fontWeight: "700", fontSize: 12 }}>
                  {data.role === "admin" ? "Remover admin" : "Promover admin"}
                </Text>
              </TouchableOpacity>
              {(["produtor", "tecnico", "parceiro", "comprador", "administrador"] as const).map(
                (t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={() =>
                      setTipo.mutate({ perfilId: data.usuarioAfuId, tipoUsuario: t })
                    }
                  >
                    <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <Text style={{ fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Conta (soft — nunca hard delete)
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24 }}>
              <TouchableOpacity
                style={[styles.btn, { borderColor: "#DC2626", backgroundColor: "#DC262615" }]}
                onPress={() =>
                  Alert.alert(
                    "Desativar produtor",
                    "Suspende o perfil e marca cadastroAtivo=false. Dados e propriedades permanecem.",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Desativar",
                        style: "destructive",
                        onPress: () =>
                          desativar.mutate({
                            produtorId: data.produtorId ?? undefined,
                            userId: data.userId,
                            modo: "suspenso",
                          }),
                      },
                    ],
                  )
                }
              >
                <Text style={{ color: "#DC2626", fontWeight: "700", fontSize: 12 }}>Desativar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { borderColor: "#16A34A", backgroundColor: "#16A34A15" }]}
                onPress={() =>
                  reativar.mutate({
                    produtorId: data.produtorId ?? undefined,
                    userId: data.userId,
                  })
                }
              >
                <Text style={{ color: "#16A34A", fontWeight: "700", fontSize: 12 }}>Reativar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

export default function AdminProdutorDetalheScreen() {
  return (
    <RouteGuard requireAuth requireAdmin>
      <AdminProdutorDetalheContent />
    </RouteGuard>
  );
}
