/**
 * WP-06 — Gestão administrativa de produtores (lista / busca / filtro / convite).
 * Tela nova — não substitui admin-usuarios nem painel-admin.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
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
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso",
};
const STATUS_CORES: Record<string, string> = {
  ativo: "#16A34A",
  inativo: "#6B7280",
  suspenso: "#DC2626",
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

type ProdutorItem = {
  produtorId: number | null;
  usuarioAfuId: number;
  userId: number;
  nome: string;
  email: string | null;
  status: "ativo" | "inativo" | "suspenso";
  plano: string | null;
  cidade: string | null;
  estado: string | null;
  regiao: string | null;
  cadastroAtivo: boolean | null;
  propriedadesCount: number;
  diagnosticosCount: number;
};

function AdminProdutoresContent() {
  const colors = useColors();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"ativo" | "inativo" | "suspenso" | undefined>();
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroRegiao, setFiltroRegiao] = useState("");
  const [filtroPlano, setFiltroPlano] = useState<"free" | "produtor" | "pro" | "enterprise" | undefined>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteNome, setInviteNome] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteEstado, setInviteEstado] = useState("");
  const [inviteCidade, setInviteCidade] = useState("");
  const [inviteRegiao, setInviteRegiao] = useState("");
  const [invitePlano, setInvitePlano] = useState<"free" | "produtor" | "pro" | "enterprise">("free");

  const { data, isLoading, error, refetch } = trpc.adminProdutores.listar.useQuery({
    busca: busca || undefined,
    status: filtroStatus,
    estado: filtroEstado || undefined,
    regiao: filtroRegiao || undefined,
    plano: filtroPlano,
    limit: 100,
    offset: 0,
  });
  const statsQuery = trpc.adminProdutores.stats.useQuery();

  const convidarMutation = trpc.adminProdutores.convidar.useMutation({
    onSuccess: (res) => {
      refetch();
      statsQuery.refetch();
      setInviteOpen(false);
      setInviteNome("");
      setInviteEmail("");
      const extra = res.temporaryPassword
        ? `\nSenha temporária (só ambiente não-prod / flag): ${res.temporaryPassword}\nTroca obrigatória no próximo login.`
        : res.emailEnviado
          ? "\nE-mail de definição de senha enviado. Troca obrigatória no próximo login."
          : "\nE-mail não enviado. Use 'esqueci a senha' ou configure SendGrid / ADMIN_INVITE_RETURN_TEMP_PASSWORD=1.";
      Alert.alert("Convite criado", `Produtor #${res.produtorId} · user ${res.userId}${extra}`);
    },
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const produtores = (data?.produtores ?? []) as ProdutorItem[];
  const stats = statsQuery.data;

  const styles = StyleSheet.create({
    searchInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.foreground,
      flex: 1,
    },
    filterBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  function openDetalhe(item: ProdutorItem) {
    const q =
      item.produtorId != null
        ? `produtorId=${item.produtorId}`
        : `userId=${item.userId}`;
    router.push(`/mais/admin-produtor/${item.userId}?${q}` as any);
  }

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
            Gestão de Produtores
          </Text>
          <Text style={{ color: "#A5D6A7", fontSize: 12, marginTop: 2 }}>
            {data?.total ?? 0} produtores · WP-06
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setInviteOpen(true)}
          style={{
            backgroundColor: "#FFFFFF22",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>+ Convidar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => refetch()} style={{ padding: 6 }}>
          <Text style={{ color: "#A5D6A7", fontSize: 20 }}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {[
              { label: "Total", value: stats.totalPerfisProdutor, cor: "#1565C0" },
              { label: "Ativos", value: stats.ativos, cor: "#16A34A" },
              { label: "Suspensos", value: stats.suspensos, cor: "#DC2626" },
              { label: "Cad. off", value: stats.cadastroInativo, cor: "#D97706" },
            ].map((s) => (
              <View
                key={s.label}
                style={{
                  backgroundColor: s.cor + "15",
                  borderRadius: 10,
                  padding: 12,
                  marginRight: 10,
                  minWidth: 80,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: s.cor + "40",
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "800", color: s.cor }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar nome, e-mail, cidade..."
            placeholderTextColor={colors.muted}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <TextInput
            style={[styles.searchInput, { flex: 1 }]}
            placeholder="UF / estado"
            placeholderTextColor={colors.muted}
            value={filtroEstado}
            onChangeText={setFiltroEstado}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.searchInput, { flex: 1 }]}
            placeholder="Região"
            placeholderTextColor={colors.muted}
            value={filtroRegiao}
            onChangeText={setFiltroRegiao}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {([undefined, "ativo", "suspenso", "inativo"] as const).map((s) => (
            <TouchableOpacity
              key={s ?? "todos-status"}
              style={[styles.filterBtn, filtroStatus === s && styles.filterBtnActive]}
              onPress={() => setFiltroStatus(s)}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: filtroStatus === s ? "#FFFFFF" : colors.muted,
                  fontWeight: "600",
                }}
              >
                {s === undefined ? "Todos status" : STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {([undefined, "free", "produtor", "pro", "enterprise"] as const).map((p) => (
            <TouchableOpacity
              key={p ?? "todos-plano"}
              style={[styles.filterBtn, filtroPlano === p && styles.filterBtnActive]}
              onPress={() => setFiltroPlano(p)}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: filtroPlano === p ? "#FFFFFF" : colors.muted,
                  fontWeight: "600",
                }}
              >
                {p === undefined ? "Todos planos" : PLANO_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>Carregando produtores...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: colors.error, textAlign: "center" }}>{error.message}</Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                marginTop: 12,
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : produtores.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: colors.muted }}>Nenhum produtor encontrado</Text>
          </View>
        ) : (
          <FlatList
            data={produtores}
            keyExtractor={(item) => String(item.userId)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => openDetalhe(item)}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                      {item.nome}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {item.email ?? "Sem e-mail"}
                    </Text>
                  </View>
                  {item.plano && (
                    <View
                      style={{
                        backgroundColor: (PLANO_CORES[item.plano] ?? "#6B7280") + "20",
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: PLANO_CORES[item.plano] ?? "#6B7280",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {PLANO_LABELS[item.plano] ?? item.plano}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <View
                    style={{
                      backgroundColor: (STATUS_CORES[item.status] ?? "#6B7280") + "20",
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: STATUS_CORES[item.status] ?? "#6B7280",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {STATUS_LABELS[item.status] ?? item.status}
                    </Text>
                  </View>
                  {(item.cidade || item.estado || item.regiao) && (
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {[item.cidade, item.estado, item.regiao].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: colors.muted, marginLeft: "auto" }}>
                    {item.propriedadesCount} prop. · {item.diagnosticosCount} diag.
                  </Text>
                </View>
                {item.cadastroAtivo === false && (
                  <Text style={{ marginTop: 6, fontSize: 11, color: "#D97706", fontWeight: "600" }}>
                    Cadastro desativado (soft)
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>

      <Modal visible={inviteOpen} animationType="slide" transparent onRequestClose={() => setInviteOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "90%",
            }}
          >
            <ScrollView>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                  Convidar produtor
                </Text>
                <TouchableOpacity onPress={() => setInviteOpen(false)}>
                  <Text style={{ fontSize: 20, color: colors.muted }}>✕</Text>
                </TouchableOpacity>
              </View>
              {[
                { label: "Nome", value: inviteNome, set: setInviteNome, placeholder: "Nome completo" },
                { label: "E-mail", value: inviteEmail, set: setInviteEmail, placeholder: "email@fazenda.com" },
                { label: "Cidade", value: inviteCidade, set: setInviteCidade, placeholder: "Cidade" },
                { label: "Estado (UF)", value: inviteEstado, set: setInviteEstado, placeholder: "PR" },
                { label: "Região", value: inviteRegiao, set: setInviteRegiao, placeholder: "Sul" },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 4 }}>
                    {f.label}
                  </Text>
                  <TextInput
                    style={[styles.searchInput, { flex: undefined }]}
                    value={f.value}
                    onChangeText={f.set}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.muted}
                    autoCapitalize={f.label === "E-mail" ? "none" : "sentences"}
                    keyboardType={f.label === "E-mail" ? "email-address" : "default"}
                  />
                </View>
              ))}
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                Plano inicial
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {(["free", "produtor", "pro", "enterprise"] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setInvitePlano(p)}
                    style={{
                      backgroundColor: (PLANO_CORES[p] ?? "#6B7280") + "15",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: invitePlano === p ? PLANO_CORES[p] : colors.border,
                    }}
                  >
                    <Text style={{ color: PLANO_CORES[p], fontWeight: "600", fontSize: 12 }}>
                      {PLANO_LABELS[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                disabled={convidarMutation.isPending || !inviteNome.trim() || !inviteEmail.trim()}
                onPress={() =>
                  convidarMutation.mutate({
                    nome: inviteNome.trim(),
                    email: inviteEmail.trim(),
                    cidade: inviteCidade || undefined,
                    estado: inviteEstado || undefined,
                    regiao: inviteRegiao || undefined,
                    plano: invitePlano,
                  })
                }
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: convidarMutation.isPending ? 0.6 : 1,
                }}
              >
                {convidarMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Criar convite</Text>
                )}
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 10, textAlign: "center" }}>
                Soft create — sem exclusão. Reset de senha por e-mail quando SendGrid estiver configurado.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

export default function AdminProdutoresScreen() {
  return (
    <RouteGuard requireAuth requireAdmin>
      <AdminProdutoresContent />
    </RouteGuard>
  );
}
