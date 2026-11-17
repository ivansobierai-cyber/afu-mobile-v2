/**
 * WP-04 — fila de diagnósticos pendentes de revisão técnica.
 * Tela nova; não substitui o histórico em Diagnóstico IA.
 */
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";
import { roleHasPermission, type OrgRole } from "@/lib/security/org-roles";
import { mapDbDiagnostico } from "@/lib/diagnostico-utils";
import { RevisaoTecnicaCard } from "@/components/diagnostico/revisao-tecnica-card";

export default function RevisaoDiagnosticosScreen() {
  const colors = useColors();
  const router = useRouter();
  const { cacheInput, tenantReady } = useTenantQueryScope();
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const activeRole = (session?.activeRole ?? null) as OrgRole | null;
  const canReview =
    activeRole != null && roleHasPermission(activeRole, "diagnostics.review");

  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const pendentesQuery = trpc.diagnostico.listarPendentesRevisao.useQuery(
    { ...cacheInput, limit: 50 },
    { enabled: tenantReady && canReview },
  );

  const revisarMutation = trpc.diagnostico.revisar.useMutation({
    onSuccess: () => {
      utils.diagnostico.listarPendentesRevisao.invalidate();
      utils.diagnostico.historico.invalidate(cacheInput);
      setSelectedId(null);
    },
  });

  const pendentes = (pendentesQuery.data ?? []).map(mapDbDiagnostico);
  const selected = pendentes.find((d) => d.id === selectedId) ?? null;

  if (!canReview) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revisão técnica</Text>
        </View>
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={{ color: colors.muted, textAlign: "center" }}>
            Seu papel na organização não possui permissão diagnostics.review.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Revisão técnica</Text>
          <Text style={styles.headerSub}>
            {pendentes.length} pendente{pendentes.length === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={pendentesQuery.isFetching}
            onRefresh={() => void pendentesQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {pendentesQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : pendentes.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <IconSymbol name="checkmark.shield.fill" size={40} color={colors.border} />
            <Text style={{ marginTop: 12, color: colors.muted }}>
              Nenhum diagnóstico aguardando revisão
            </Text>
          </View>
        ) : (
          pendentes.map((diag) => (
            <TouchableOpacity
              key={diag.id}
              style={[
                styles.item,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    selectedId === diag.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() =>
                setSelectedId((cur) => (cur === diag.id ? null : diag.id))
              }
            >
              <Text style={{ fontWeight: "700", color: colors.foreground }}>
                #{diag.id} — {diag.resultado.problema}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                {diag.culturaNome} · {diag.resultado.severidade} ·{" "}
                {new Date(diag.createdAt).toLocaleString("pt-BR")}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={2}>
                {diag.resultado.recomendacoes.join("; ")}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {selected ? (
          <View style={{ marginTop: 8 }}>
            <RevisaoTecnicaCard
              diagnosticoId={selected.id}
              statusRevisao={selected.statusRevisao}
              parecerTecnico={selected.parecerTecnico}
              recomendacaoCorrigida={selected.recomendacaoCorrigida}
              recomendacaoOriginal={selected.recomendacaoOriginal}
              revisadoEm={selected.revisadoEm}
              canReview
              reviewing={revisarMutation.isPending}
              onRevisar={async (input) => {
                try {
                  await revisarMutation.mutateAsync({
                    diagnosticoId: selected.id,
                    ...input,
                  });
                  Alert.alert("Revisão registrada", "Status atualizado na fila.");
                } catch (e: unknown) {
                  Alert.alert(
                    "Erro",
                    e instanceof Error ? e.message : "Falha ao revisar",
                  );
                }
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
});
