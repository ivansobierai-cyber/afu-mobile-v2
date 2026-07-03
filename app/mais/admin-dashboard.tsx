/**
 * admin-dashboard.tsx — Painel de Dashboard do Administrador
 * Exibe contadores em tempo real via tRPC:
 *   - auth.admin.stats.usuarios
 *   - culturasPragas.culturas.stats
 *   - culturasPragas.pragas.stats
 *   - materiaisParceiros.materiais.stats
 *   - materiaisParceiros.parceiros.stats
 */
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useCallback, useState } from "react";

// ─── Componente de card de métrica ────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  color,
  bg,
  icon,
  loading,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  bg: string;
  icon: string;
  loading?: boolean;
}) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ backgroundColor: bg, borderRadius: 10, padding: 8 }}>
          <IconSymbol name={icon as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600", textTransform: "uppercase" }}>
            {label}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={color} style={{ marginTop: 4, alignSelf: "flex-start" }} />
          ) : (
            <Text style={{ fontSize: 28, fontWeight: "800", color }}>{value}</Text>
          )}
          {sub && !loading && (
            <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{sub}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Componente de linha de breakdown ────────────────────────────────────────
function BreakdownRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500" }}>{label}</Text>
        <Text style={{ fontSize: 13, color, fontWeight: "700" }}>{value} ({pct}%)</Text>
      </View>
      <View style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <View style={{ height: 6, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

// ─── Componente de seção ─────────────────────────────────────────────────────
function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <View style={{ backgroundColor: color + "20", borderRadius: 8, padding: 6 }}>
          <IconSymbol name={icon as any} size={16} color={color} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function AdminDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const utils = trpc.useUtils();

  // Queries de stats
  const { data: statsUsuarios, isLoading: loadingUsuarios, refetch: refetchUsuarios } =
    trpc.auth.admin.stats.usuarios.useQuery(undefined, { refetchInterval: 30_000 });

  const { data: statsCulturas, isLoading: loadingCulturas, refetch: refetchCulturas } =
    trpc.culturasPragas.culturas.stats.useQuery(undefined, { refetchInterval: 30_000 });

  const { data: statsPragas, isLoading: loadingPragas, refetch: refetchPragas } =
    trpc.culturasPragas.pragas.stats.useQuery(undefined, { refetchInterval: 30_000 });

  const { data: statsMateriais, isLoading: loadingMateriais, refetch: refetchMateriais } =
    trpc.materiaisParceiros.materiais.stats.useQuery(undefined, { refetchInterval: 30_000 });

  const { data: statsParceiros, isLoading: loadingParceiros, refetch: refetchParceiros } =
    trpc.materiaisParceiros.parceiros.stats.useQuery(undefined, { refetchInterval: 30_000 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchUsuarios(),
      refetchCulturas(),
      refetchPragas(),
      refetchMateriais(),
      refetchParceiros(),
    ]);
    setRefreshing(false);
  }, [refetchUsuarios, refetchCulturas, refetchPragas, refetchMateriais, refetchParceiros]);

  // Hora da última atualização
  const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1E3A5F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#FFFFFF" }}>Dashboard Admin</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
              Atualizado às {agora} · Auto-refresh a cada 30s
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 8 }}
          >
            <IconSymbol name="arrow.clockwise" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Cards de totais no header */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          {[
            { label: "Usuários",  value: statsUsuarios?.totalUsuarios ?? 0,  color: "#60A5FA", loading: loadingUsuarios },
            { label: "Cultivos",  value: statsCulturas?.total ?? 0,           color: "#34D399", loading: loadingCulturas },
            { label: "Pragas",    value: statsPragas?.total ?? 0,             color: "#F87171", loading: loadingPragas },
            { label: "Materiais", value: statsMateriais?.total ?? 0,          color: "#FBBF24", loading: loadingMateriais },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 10, alignItems: "center" }}>
              {item.loading ? (
                <ActivityIndicator size="small" color={item.color} />
              ) : (
                <Text style={{ fontSize: 22, fontWeight: "800", color: item.color }}>{item.value}</Text>
              )}
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3A5F" />}
      >
        {/* ── Usuários ─────────────────────────────────────────────────────── */}
        <Section title="Usuários do Sistema" icon="person.2.fill" color="#7C3AED">
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <MetricCard
              label="Total de usuários"
              value={statsUsuarios?.totalUsuarios ?? 0}
              sub={`${statsUsuarios?.totalAdmins ?? 0} admin(s)`}
              color="#7C3AED"
              bg="#EDE9FE"
              icon="person.fill"
              loading={loadingUsuarios}
            />
            <MetricCard
              label="Sem perfil AFU"
              value={statsUsuarios?.totalSemPerfil ?? 0}
              sub="Onboarding pendente"
              color="#EF4444"
              bg="#FEE2E2"
              icon="exclamationmark.triangle.fill"
              loading={loadingUsuarios}
            />
          </View>
          {statsUsuarios && statsUsuarios.totalUsuarios > 0 && (
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownTitle}>Status dos perfis</Text>
              <BreakdownRow label="Ativos"    value={statsUsuarios.totalAtivos}    total={statsUsuarios.totalUsuarios} color="#16A34A" />
              <BreakdownRow label="Suspensos" value={statsUsuarios.totalSuspensos} total={statsUsuarios.totalUsuarios} color="#EF4444" />
              {Object.entries(statsUsuarios.porTipo ?? {}).map(([tipo, qtd]) => (
                <BreakdownRow key={tipo} label={tipo.charAt(0).toUpperCase() + tipo.slice(1)} value={qtd as number} total={statsUsuarios.totalUsuarios} color="#7C3AED" />
              ))}
            </View>
          )}
          <TouchableOpacity style={[styles.actionBtn, { borderColor: "#7C3AED" }]} onPress={() => router.push("/mais/admin-usuarios" as any)}>
            <Text style={{ color: "#7C3AED", fontWeight: "700", fontSize: 13 }}>Gerenciar Usuários →</Text>
          </TouchableOpacity>
        </Section>

        {/* ── Cultivos ─────────────────────────────────────────────────────── */}
        <Section title="Cultivos Cadastrados" icon="leaf.fill" color="#16A34A">
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <MetricCard
              label="Total de cultivos"
              value={statsCulturas?.total ?? 0}
              sub={`${statsCulturas?.emAndamento ?? 0} em andamento`}
              color="#16A34A"
              bg="#D1FAE5"
              icon="leaf.fill"
              loading={loadingCulturas}
            />
            <MetricCard
              label="Colhidos"
              value={statsCulturas?.colhidas ?? 0}
              sub={`${statsCulturas?.perdidas ?? 0} perdidos`}
              color="#D97706"
              bg="#FEF3C7"
              icon="checkmark.circle.fill"
              loading={loadingCulturas}
            />
          </View>
          {statsCulturas && statsCulturas.total > 0 && (
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownTitle}>Por status</Text>
              <BreakdownRow label="Em andamento" value={statsCulturas.emAndamento} total={statsCulturas.total} color="#16A34A" />
              <BreakdownRow label="Planejados"   value={statsCulturas.planejadas}  total={statsCulturas.total} color="#2563EB" />
              <BreakdownRow label="Colhidos"     value={statsCulturas.colhidas}    total={statsCulturas.total} color="#D97706" />
              <BreakdownRow label="Perdidos"     value={statsCulturas.perdidas}    total={statsCulturas.total} color="#EF4444" />
            </View>
          )}
          <TouchableOpacity style={[styles.actionBtn, { borderColor: "#16A34A" }]} onPress={() => router.push("/mais/admin-culturas" as any)}>
            <Text style={{ color: "#16A34A", fontWeight: "700", fontSize: 13 }}>Gerenciar Culturas →</Text>
          </TouchableOpacity>
        </Section>

        {/* ── Pragas e Doenças ─────────────────────────────────────────────── */}
        <Section title="Banco Fitossanitário" icon="cross.circle.fill" color="#EF4444">
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <MetricCard
              label="Total de registros"
              value={statsPragas?.total ?? 0}
              sub={`${statsPragas?.criticas ?? 0} de risco crítico`}
              color="#EF4444"
              bg="#FEE2E2"
              icon="cross.circle.fill"
              loading={loadingPragas}
            />
            <MetricCard
              label="Doenças"
              value={statsPragas?.doencas ?? 0}
              sub={`${statsPragas?.deficiencias ?? 0} deficiências`}
              color="#8B5CF6"
              bg="#EDE9FE"
              icon="exclamationmark.triangle.fill"
              loading={loadingPragas}
            />
          </View>
          {statsPragas && statsPragas.total > 0 && (
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownTitle}>Por tipo</Text>
              <BreakdownRow label="Pragas"       value={statsPragas.pragas}       total={statsPragas.total} color="#EF4444" />
              <BreakdownRow label="Doenças"      value={statsPragas.doencas}      total={statsPragas.total} color="#8B5CF6" />
              <BreakdownRow label="Deficiências" value={statsPragas.deficiencias} total={statsPragas.total} color="#D97706" />
            </View>
          )}
          <TouchableOpacity style={[styles.actionBtn, { borderColor: "#EF4444" }]} onPress={() => router.push("/mais/admin-pragas" as any)}>
            <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>Gerenciar Pragas →</Text>
          </TouchableOpacity>
        </Section>

        {/* ── Materiais Didáticos ───────────────────────────────────────────── */}
        <Section title="Materiais Didáticos" icon="books.vertical.fill" color="#1565C0">
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <MetricCard
              label="Total de materiais"
              value={statsMateriais?.total ?? 0}
              sub={`${statsMateriais?.ativos ?? 0} publicados`}
              color="#1565C0"
              bg="#DBEAFE"
              icon="books.vertical.fill"
              loading={loadingMateriais}
            />
            <MetricCard
              label="Rascunhos"
              value={statsMateriais?.rascunhos ?? 0}
              sub={`${statsMateriais?.videos ?? 0} vídeos`}
              color="#D97706"
              bg="#FEF3C7"
              icon="doc.text.fill"
              loading={loadingMateriais}
            />
          </View>
          {statsMateriais && statsMateriais.total > 0 && (
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownTitle}>Por status</Text>
              <BreakdownRow label="Publicados" value={statsMateriais.ativos}    total={statsMateriais.total} color="#16A34A" />
              <BreakdownRow label="Rascunhos"  value={statsMateriais.rascunhos} total={statsMateriais.total} color="#D97706" />
              <BreakdownRow label="Inativos"   value={statsMateriais.inativos}  total={statsMateriais.total} color="#9CA3AF" />
            </View>
          )}
          <TouchableOpacity style={[styles.actionBtn, { borderColor: "#1565C0" }]} onPress={() => router.push("/mais/admin-materiais" as any)}>
            <Text style={{ color: "#1565C0", fontWeight: "700", fontSize: 13 }}>Gerenciar Materiais →</Text>
          </TouchableOpacity>
        </Section>

        {/* ── Parceiros ─────────────────────────────────────────────────────── */}
        <Section title="Rede de Parceiros" icon="person.2.fill" color="#0891B2">
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <MetricCard
              label="Total de parceiros"
              value={statsParceiros?.total ?? 0}
              sub={`${statsParceiros?.ativos ?? 0} ativos`}
              color="#0891B2"
              bg="#CFFAFE"
              icon="person.2.fill"
              loading={loadingParceiros}
            />
            <MetricCard
              label="Laboratórios"
              value={statsParceiros?.laboratorios ?? 0}
              sub={`${statsParceiros?.cooperativas ?? 0} cooperativas`}
              color="#16A34A"
              bg="#D1FAE5"
              icon="building.2.fill"
              loading={loadingParceiros}
            />
          </View>
          {statsParceiros && statsParceiros.total > 0 && (
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownTitle}>Por tipo</Text>
              <BreakdownRow label="Laboratórios"  value={statsParceiros.laboratorios}  total={statsParceiros.total} color="#0891B2" />
              <BreakdownRow label="Cooperativas"  value={statsParceiros.cooperativas}  total={statsParceiros.total} color="#16A34A" />
              <BreakdownRow label="Consultorias"  value={statsParceiros.consultorias}  total={statsParceiros.total} color="#7C3AED" />
            </View>
          )}
          <TouchableOpacity style={[styles.actionBtn, { borderColor: "#0891B2" }]} onPress={() => router.push("/mais/admin-parceiros" as any)}>
            <Text style={{ color: "#0891B2", fontWeight: "700", fontSize: 13 }}>Gerenciar Parceiros →</Text>
          </TouchableOpacity>
        </Section>

        {/* Rodapé */}
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
            AFU Admin · Dados atualizados automaticamente a cada 30 segundos
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  breakdownBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  actionBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
});
