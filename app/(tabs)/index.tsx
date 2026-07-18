import {
  ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { WeatherCard } from "@/components/weather-card";
import { DashboardStatCard, DashboardStatCell, DashboardStatGrid } from "@/components/dashboard-stat-card";
import { DashboardCardsModal } from "@/components/dashboard-cards-modal";
import { PlantaSaudavelHubCard } from "@/components/planta-saudavel-hub-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSession } from "@/hooks/use-session";
import { useCoreOfflineSync } from "@/hooks/use-core-offline-sync";
import { useDashboardCards, type DashboardCardId } from "@/hooks/use-dashboard-cards";
import { MODULE_COLORS } from "@/constants/module-colors";
import { hasValidCoordinates, parseCoordinate } from "@/lib/geo/coordinates";
import { trpc } from "@/lib/trpc";
import type { ComponentProps } from "react";

const STATUS_COLORS: Record<string, string> = {
  em_andamento: "#2E7D32", planejado: "#EF6C00", colhido: "#6B7C6E", perdido: "#C62828",
};
const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em andamento", planejado: "Planejado", colhido: "Colhido", perdido: "Perdido",
};

type IconName = ComponentProps<typeof IconSymbol>["name"];

type StatItem = {
  id: DashboardCardId;
  label: string;
  value: number | string;
  icon: IconName;
  color: string;
  route: string;
  accent?: boolean;
  hint?: string;
  badge?: number;
  badgeColor?: string;
};

function isEventTodayOrTomorrow(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const eventDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(eventDate);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime();
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { isAuthenticated, perfil } = useSession();
  const { isOnline, pending } = useCoreOfflineSync();
  const { cards, moveCard, toggleVisible, resetCards } = useDashboardCards();
  const [refreshing, setRefreshing] = useState(false);
  const [cardsModalOpen, setCardsModalOpen] = useState(false);

  const { data: propriedades = [], isLoading: loadingProp } = trpc.coreData.propriedades.list.useQuery();
  const { data: cultivos = [], isLoading: loadingCult } = trpc.coreData.cultivos.list.useQuery();
  const { data: diagnosticos = [], isLoading: loadingDiag } = trpc.diagnostico.historico.useQuery();
  const { data: analises = [], isLoading: loadingAn } = trpc.secondaryData.analises.list.useQuery();
  const { data: relatorios = [], isLoading: loadingRel } = trpc.secondaryData.relatorios.list.useQuery();
  const { data: eventos = [], isLoading: loadingEv } = trpc.coreData.calendario.list.useQuery();
  const { data: produtosMarketplace = [] } = trpc.secondaryData.marketplace.list.useQuery(
    { status: "disponivel", limit: 100 },
    { enabled: isAuthenticated },
  );
  const { data: materiaisData, isLoading: loadingMat } = trpc.materiaisParceiros.materiais.list.useQuery({
    status: "ativo",
    limit: 1,
    offset: 0,
  });

  const cultivosAtivos = useMemo(
    () => cultivos.filter((c) => c.status === "em_andamento"),
    [cultivos],
  );

  const propriedadeComGps = useMemo(
    () => propriedades.find((p) =>
      hasValidCoordinates(parseCoordinate(p.latitude), parseCoordinate(p.longitude)),
    ),
    [propriedades],
  );

  const { data: weather } = trpc.weather.byPropriedade.useQuery(
    { propriedadeId: propriedadeComGps?.id ?? 0 },
    { enabled: !!propriedadeComGps, staleTime: 10 * 60 * 1000 },
  );

  const eventosPendentes = useMemo(
    () => eventos.filter((e) => e.status === "pendente" || e.status === "em_andamento").length,
    [eventos],
  );

  const eventosHojeAmanha = useMemo(
    () =>
      eventos.filter(
        (e) =>
          (e.status === "pendente" || e.status === "em_andamento") &&
          isEventTodayOrTomorrow(e.dataProgramada),
      ).length,
    [eventos],
  );

  const proximosEventos = useMemo(
    () =>
      eventos
        .filter((e) => e.status === "pendente" || e.status === "em_andamento")
        .sort((a, b) => {
          const da = a.dataProgramada ? new Date(a.dataProgramada).getTime() : Infinity;
          const db = b.dataProgramada ? new Date(b.dataProgramada).getTime() : Infinity;
          return da - db;
        })
        .slice(0, 3),
    [eventos],
  );

  const isInitialLoading = loadingProp && propriedades.length === 0;
  const labTotal = diagnosticos.length + analises.length + relatorios.length;
  const climaValue = propriedadeComGps
    ? weather?.current?.temperature != null
      ? `${Math.round(weather.current.temperature)}°C`
      : "…"
    : "—";
  const materiaisValue = loadingMat ? "…" : (materiaisData?.total ?? "—");

  const statItemsMap = useMemo<Record<DashboardCardId, StatItem>>(
    () => ({
      propriedades: {
        id: "propriedades",
        label: "Propriedades",
        value: propriedades.length,
        icon: "house.fill",
        color: MODULE_COLORS.propriedades,
        route: "/(tabs)/propriedades",
      },
      cultivos: {
        id: "cultivos",
        label: "Cultivos",
        value: cultivos.length,
        icon: "leaf.fill",
        color: MODULE_COLORS.cultivos,
        route: "/(tabs)/cultivos",
        hint: `${cultivosAtivos.length} ativos`,
      },
      diagnostico: {
        id: "diagnostico",
        label: "Diagnóstico",
        value: diagnosticos.length,
        icon: "camera.fill",
        color: MODULE_COLORS.diagnostico,
        route: "/(tabs)/diagnostico",
      },
      laboratorio: {
        id: "laboratorio",
        label: "Laboratório",
        value: labTotal,
        icon: "flask.fill",
        color: MODULE_COLORS.laboratorio,
        route: "/mais/laboratorio",
      },
      laudos: {
        id: "laudos",
        label: "Laudos",
        value: relatorios.length,
        icon: "doc.fill",
        color: MODULE_COLORS.laudos,
        route: "/mais/relatorios",
      },
      eventos: {
        id: "eventos",
        label: "Eventos",
        value: eventosPendentes,
        icon: "calendar",
        color: MODULE_COLORS.eventos,
        route: "/mais/calendario",
        hint: `${eventos.length} total`,
        badge: eventosHojeAmanha,
        badgeColor: MODULE_COLORS.eventos,
      },
      marketplace: {
        id: "marketplace",
        label: "Marketplace",
        value: isAuthenticated ? produtosMarketplace.length : "—",
        icon: "cart.fill",
        color: MODULE_COLORS.marketplace,
        route: "/mais/marketplace",
      },
      clima: {
        id: "clima",
        label: "Clima",
        value: climaValue,
        icon: "cloud.fill",
        color: MODULE_COLORS.clima,
        route: "/mais/tempo",
        hint: propriedadeComGps ? weather?.current?.weatherLabel : "sem GPS",
      },
      materiais: {
        id: "materiais",
        label: "Materiais",
        value: materiaisValue,
        icon: "books.vertical.fill",
        color: MODULE_COLORS.materiais,
        route: "/mais/materiais",
      },
    }),
    [
      propriedades.length,
      cultivos.length,
      cultivosAtivos.length,
      diagnosticos.length,
      labTotal,
      relatorios.length,
      eventosPendentes,
      eventos.length,
      eventosHojeAmanha,
      isAuthenticated,
      produtosMarketplace.length,
      climaValue,
      propriedadeComGps,
      weather?.current?.weatherLabel,
      materiaisValue,
    ],
  );

  const visibleStatItems = useMemo(
    () =>
      cards
        .filter((c) => c.visible)
        .map((c) => statItemsMap[c.id])
        .filter(Boolean),
    [cards, statItemsMap],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        utils.coreData.propriedades.list.invalidate(),
        utils.coreData.cultivos.list.invalidate(),
        utils.diagnostico.historico.invalidate(),
        utils.secondaryData.analises.list.invalidate(),
        utils.secondaryData.relatorios.list.invalidate(),
        utils.coreData.calendario.list.invalidate(),
        utils.secondaryData.marketplace.list.invalidate(),
        utils.materiaisParceiros.materiais.list.invalidate(),
        propriedadeComGps
          ? utils.weather.byPropriedade.invalidate({ propriedadeId: propriedadeComGps.id })
          : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [utils, propriedadeComGps]);

  const styles = StyleSheet.create({
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    summaryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 14,
    },
    summaryChip: {
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    offlineChip: {
      backgroundColor: "#C62828",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    pendingChip: {
      backgroundColor: "#EF6C00",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    panel: {
      paddingHorizontal: 16,
      marginTop: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
    sectionLink: { fontSize: 14, color: colors.primary, fontWeight: "600" },
    cultivoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    eventoCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingsBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const primeiroNome = perfil?.nome?.split(" ")[0];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>AFU Agro</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF", marginTop: 2 }}>
                Planta Saudável
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                {isAuthenticated && primeiroNome ? `Olá, ${primeiroNome}` : "MVP 1.0 · diagnóstico e manejo"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {!isAuthenticated && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                  }}
                  onPress={() => router.push("/auth/welcome" as any)}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>Entrar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => router.push(isAuthenticated ? "/mais/perfil" : "/auth/welcome" as any)}
              >
                <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryRow}>
            {!isOnline && (
              <View style={styles.offlineChip}>
                <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700" }}>Offline</Text>
              </View>
            )}
            {pending > 0 && (
              <View style={styles.pendingChip}>
                <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700" }}>
                  {pending} pendente{pending !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
            {isAuthenticated && propriedades.length > 0 && (
              <>
                <View style={styles.summaryChip}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                    {propriedades.length} propriedade{propriedades.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.summaryChip}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                    {cultivosAtivos.length} cultivo{cultivosAtivos.length !== 1 ? "s" : ""} ativo{cultivosAtivos.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                {eventosPendentes > 0 && (
                  <View style={styles.summaryChip}>
                    <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                      {eventosPendentes} evento{eventosPendentes !== 1 ? "s" : ""} pendente{eventosPendentes !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.panel}>
          <PlantaSaudavelHubCard
            diagnosticos={diagnosticos.length}
            analises={analises.length}
            laudos={relatorios.length}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Atalhos</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {(loadingProp || loadingCult || loadingDiag) && !refreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : null}
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => setCardsModalOpen(true)}
                accessibilityLabel="Personalizar atalhos"
              >
                <IconSymbol name="gear" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <DashboardStatGrid>
            {visibleStatItems.map((item) => (
              <DashboardStatCell key={item.id}>
                <DashboardStatCard
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  color={item.color}
                  variant={item.accent ? "accent" : "default"}
                  hint={item.hint}
                  badge={item.badge}
                  badgeColor={item.badgeColor}
                  onPress={() => router.push(item.route as any)}
                />
              </DashboardStatCell>
            ))}
          </DashboardStatGrid>

          {isAuthenticated && propriedadeComGps && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 4 }]}>
                <Text style={styles.sectionTitle}>Clima na Fazenda</Text>
                <TouchableOpacity onPress={() => router.push("/mais/tempo" as any)}>
                  <Text style={styles.sectionLink}>Ver tudo</Text>
                </TouchableOpacity>
              </View>
              <WeatherCard propriedadeId={propriedadeComGps.id} compact showForecast />
            </>
          )}

          {isAuthenticated && !propriedadeComGps && propriedades.length > 0 && (
            <TouchableOpacity
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
              onPress={() => router.push("/(tabs)/propriedades" as any)}
            >
              <View style={{ backgroundColor: MODULE_COLORS.clima + "18", borderRadius: 10, padding: 10 }}>
                <IconSymbol name="location.fill" size={20} color={MODULE_COLORS.clima} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>Ative o clima local</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  Cadastre GPS em uma propriedade para ver previsão na fazenda.
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}

          {cultivosAtivos.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>Cultivos em Andamento</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/cultivos" as any)}>
                  <Text style={styles.sectionLink}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              {cultivosAtivos.slice(0, 3).map((cultivo) => (
                <TouchableOpacity
                  key={cultivo.id}
                  style={styles.cultivoCard}
                  onPress={() => router.push(`/cultivos/${cultivo.id}` as any)}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                        {cultivo.nomeCultura}{cultivo.variedade ? ` — ${cultivo.variedade}` : ""}
                      </Text>
                      {cultivo.areaPlantada ? (
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                          {Number(cultivo.areaPlantada).toLocaleString("pt-BR")} ha
                          {cultivo.dataPlantio
                            ? ` · ${new Date(cultivo.dataPlantio).toLocaleDateString("pt-BR")}`
                            : ""}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={{
                        backgroundColor: STATUS_COLORS[cultivo.status ?? "em_andamento"] + "20",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: STATUS_COLORS[cultivo.status ?? "em_andamento"],
                        }}
                      >
                        {STATUS_LABELS[cultivo.status ?? "em_andamento"]}
                      </Text>
                    </View>
                  </View>
                  {cultivo.faseAtual ? (
                    <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <IconSymbol name="leaf.fill" size={13} color={colors.primary} />
                      <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "500" }}>
                        {cultivo.faseAtual.replace(/_/g, " ")}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </>
          )}

          {proximosEventos.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                <Text style={styles.sectionTitle}>Próximos Eventos</Text>
                <TouchableOpacity onPress={() => router.push("/mais/calendario" as any)}>
                  <Text style={styles.sectionLink}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              {proximosEventos.map((evento) => (
                <TouchableOpacity
                  key={evento.id}
                  style={styles.eventoCard}
                  onPress={() => router.push("/mais/calendario" as any)}
                  activeOpacity={0.75}
                >
                  <View
                    style={{
                      backgroundColor: MODULE_COLORS.eventos + "18",
                      borderRadius: 10,
                      padding: 8,
                      marginRight: 12,
                    }}
                  >
                    <IconSymbol name="calendar" size={18} color={MODULE_COLORS.eventos} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{evento.titulo}</Text>
                    {evento.dataProgramada ? (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {new Date(evento.dataProgramada).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    ) : null}
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {propriedades.length === 0 && !isInitialLoading && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: colors.primary + "12",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name="house.fill" size={36} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 16 }}>
                Bem-vindo ao AFU Agro
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  textAlign: "center",
                  marginTop: 8,
                  lineHeight: 20,
                  paddingHorizontal: 12,
                }}
              >
                Cadastre sua primeira propriedade para acompanhar cultivos, clima e diagnósticos.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  marginTop: 20,
                }}
                onPress={() => router.push("/(tabs)/propriedades" as any)}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Cadastrar Propriedade</Text>
              </TouchableOpacity>
            </View>
          )}

          {isInitialLoading && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 12 }}>Carregando painel...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <DashboardCardsModal
        visible={cardsModalOpen}
        cards={cards}
        onClose={() => setCardsModalOpen(false)}
        onMove={moveCard}
        onToggleVisible={toggleVisible}
        onReset={resetCards}
      />
    </ScreenContainer>
  );
}
