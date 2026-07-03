import {
  ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSession } from "@/hooks/use-session";
import { trpc } from "@/lib/trpc";
import { mapDiagnosticoFromDb } from "@/lib/diagnostico-mapper";

const STATUS_COLORS: Record<string, string> = {
  em_andamento: "#38A169", planejado: "#D97706", colhido: "#6B7C6E", perdido: "#E53E3E",
};
const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em andamento", planejado: "Planejado", colhido: "Colhido", perdido: "Perdido",
};

const QUICK_ACTIONS = [
  { label: "Analisar Planta", icon: "camera.fill", color: "#2D6A4F", route: "/(tabs)/diagnostico" },
  { label: "Propriedades", icon: "house.fill", color: "#38A169", route: "/(tabs)/propriedades" },
  { label: "Histórico", icon: "clock.fill", color: "#8B5CF6", route: "/(tabs)/diagnostico?historico=1" },
  { label: "Calendário", icon: "calendar", color: "#D97706", route: "/mais/calendario" },
  { label: "Materiais", icon: "book.fill", color: "#2563EB", route: "/mais/materiais" },
  { label: "Suporte", icon: "message.fill", color: "#0891B2", route: "/mais/suporte" },
  { label: "Análise Solo", icon: "leaf.fill", color: "#92400E", route: "/mais/analise-fitotecnica" },
  { label: "Relatórios", icon: "doc.fill", color: "#2D6A4F", route: "/mais/relatorios" },
] as const;

const STAT_CARDS = [
  { key: "propriedades", label: "Propriedades", icon: "house.fill", colorKey: "primary", route: "/(tabs)/propriedades" },
  { key: "cultivosAtivos", label: "Cultivos Ativos", icon: "leaf.fill", color: "#38A169", route: "/(tabs)/cultivos" },
  { key: "diagnosticos", label: "Diagnósticos", icon: "camera.fill", colorKey: "primary", route: "/(tabs)/diagnostico?historico=1" },
  { key: "analises", label: "Análises Solo", icon: "scalemass.fill", color: "#92400E", route: "/mais/analise-fitotecnica" },
  { key: "relatorios", label: "Laudos", icon: "doc.fill", color: "#2D6A4F", route: "/mais/relatorios" },
  { key: "eventos", label: "Eventos", icon: "calendar", color: "#D97706", route: "/mais/calendario" },
] as const;

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { isAuthenticated, user, perfil, loading: sessionLoading } = useSession();

  const { data: propriedades = [], isLoading: loadingProp } = trpc.coreData.propriedades.list.useQuery();
  const { data: cultivos = [], isLoading: loadingCult } = trpc.coreData.cultivos.list.useQuery();
  const { data: eventos = [], isLoading: loadingEv } = trpc.coreData.calendario.list.useQuery();
  const { data: relatorios = [], isLoading: loadingRel } = trpc.secondaryData.relatorios.list.useQuery();
  const { data: analises = [], isLoading: loadingAn } = trpc.secondaryData.analises.list.useQuery();
  const { data: diagnosticos = [], isLoading: loadingDiag } = trpc.diagnostico.historico.useQuery();

  const isLoading = loadingProp || loadingCult || loadingEv || loadingRel || loadingAn || loadingDiag;

  const refresh = async () => {
    await Promise.all([
      utils.coreData.propriedades.list.invalidate(),
      utils.coreData.cultivos.list.invalidate(),
      utils.coreData.calendario.list.invalidate(),
      utils.secondaryData.relatorios.list.invalidate(),
      utils.secondaryData.analises.list.invalidate(),
      utils.diagnostico.historico.invalidate(),
    ]);
  };

  const cultivosAtivos = cultivos.filter((c) => c.status === "em_andamento");
  const proximosEventos = eventos
    .filter((e) => e.status === "pendente" || e.status === "em_andamento")
    .slice(0, 3);

  const ultimosDiagnosticos = diagnosticos
    .slice(0, 3)
    .map((row) => mapDiagnosticoFromDb(row as any));

  const statValues: Record<string, number> = {
    propriedades: propriedades.length,
    cultivosAtivos: cultivosAtivos.length,
    diagnosticos: diagnosticos.length,
    analises: analises.length,
    relatorios: relatorios.length,
    eventos: proximosEventos.length,
  };

  const styles = StyleSheet.create({
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    statNumber: { fontSize: 28, fontWeight: "700", color: colors.primary },
    statLabel: { fontSize: 12, color: colors.muted, marginTop: 4, textAlign: "center" },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
    cultivoCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    eventoCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border },
    quickActionBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  });

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>AFU Agro</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                {isAuthenticated
                  ? `Olá, ${perfil?.nome ?? user?.name ?? "produtor"} · MVP 1.0`
                  : "Planta Saudável · MVP 1.0"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              {!isAuthenticated && !sessionLoading && (
                <TouchableOpacity
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}
                  onPress={() => router.push("/auth/welcome" as any)}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>Entrar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 24, padding: 10 }}
                onPress={() => router.push("/mais/perfil" as any)}
              >
                <IconSymbol name="person.fill" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -16 }}>
          {/* Stats */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            {STAT_CARDS.map((card) => {
              const color =
                "color" in card
                  ? card.color
                  : colors[card.colorKey as keyof typeof colors] ?? colors.primary;
              return (
                <TouchableOpacity
                  key={card.key}
                  style={[styles.statCard, { width: "31%", minWidth: 100 }]}
                  onPress={() => router.push(card.route as any)}
                >
                  <IconSymbol name={card.icon as any} size={22} color={color as string} />
                  <Text style={[styles.statNumber, { color: color as string }]}>{statValues[card.key]}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ações Rápidas */}
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={{ gap: 10, marginBottom: 24 }}>
            {[0, 1].map((row) => (
              <View key={row} style={{ flexDirection: "row", gap: 10 }}>
                {QUICK_ACTIONS.slice(row * 4, row * 4 + 4).map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={[styles.quickActionBtn, { flex: 1 }]}
                    onPress={() => router.push(action.route as any)}
                  >
                    <IconSymbol name={action.icon as any} size={26} color={action.color} />
                    <Text style={{ fontSize: 11, color: colors.foreground, marginTop: 8, fontWeight: "600", textAlign: "center" }}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Últimos Diagnósticos */}
          {ultimosDiagnosticos.length > 0 && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Últimos Diagnósticos</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/diagnostico?historico=1" as any)}>
                  <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>Ver histórico</Text>
                </TouchableOpacity>
              </View>
              {ultimosDiagnosticos.map((diag) => (
                <TouchableOpacity
                  key={diag.id}
                  style={styles.cultivoCard}
                  onPress={() => router.push("/(tabs)/diagnostico?historico=1" as any)}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{diag.resultado.problema}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                    {diag.culturaNome} · {new Date(diag.createdAt).toLocaleDateString("pt-BR")}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Cultivos Ativos */}
          {cultivosAtivos.length > 0 && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Cultivos em Andamento</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/cultivos" as any)}>
                  <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              {cultivosAtivos.slice(0, 3).map((cultivo) => (
                <TouchableOpacity
                  key={cultivo.id}
                  style={styles.cultivoCard}
                  onPress={() => router.push(`/cultivos/${cultivo.id}` as any)}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                        {cultivo.nomeCultura}{cultivo.variedade ? ` — ${cultivo.variedade}` : ""}
                      </Text>
                      {cultivo.areaPlantada && (
                        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                          {Number(cultivo.areaPlantada).toLocaleString("pt-BR")} ha
                          {cultivo.dataPlantio ? ` • Plantio: ${new Date(cultivo.dataPlantio).toLocaleDateString("pt-BR")}` : ""}
                        </Text>
                      )}
                    </View>
                    <View style={{ backgroundColor: STATUS_COLORS[cultivo.status ?? "em_andamento"] + "20", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: STATUS_COLORS[cultivo.status ?? "em_andamento"] }}>
                        {STATUS_LABELS[cultivo.status ?? "em_andamento"]}
                      </Text>
                    </View>
                  </View>
                  {cultivo.faseAtual && (
                    <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <IconSymbol name="leaf.fill" size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "500" }}>
                        {cultivo.faseAtual.replace(/_/g, " ")}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Próximos Eventos */}
          {proximosEventos.length > 0 && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 }}>
                <Text style={styles.sectionTitle}>Próximos Eventos</Text>
                <TouchableOpacity onPress={() => router.push("/mais/calendario" as any)}>
                  <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              {proximosEventos.map((evento) => (
                <View key={evento.id} style={styles.eventoCard}>
                  <View style={{ backgroundColor: colors.primary + "15", borderRadius: 10, padding: 8, marginRight: 12 }}>
                    <IconSymbol name="calendar" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{evento.titulo}</Text>
                    {evento.dataProgramada && (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {new Date(evento.dataProgramada).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                </View>
              ))}
            </>
          )}

          {/* Empty State */}
          {propriedades.length === 0 && !isLoading && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <IconSymbol name="leaf.fill" size={64} color={colors.border} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 16 }}>Bem-vindo ao AFU Agro!</Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                Comece cadastrando sua primeira propriedade rural para acompanhar seus cultivos.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 20 }}
                onPress={() => router.push("/(tabs)/propriedades" as any)}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Cadastrar Propriedade</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && propriedades.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 12 }}>Carregando dados...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
