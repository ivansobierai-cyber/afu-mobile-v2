import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenState } from "@/components/screen-state";
import { PropertyMap } from "@/components/property-map";
import { WeatherCard } from "@/components/weather-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCoordinates, hasValidCoordinates, parseCoordinate } from "@/lib/geo/coordinates";
import { currentSafraLabel } from "@/lib/propriedades/safra-label";
import { PropriedadeOperacoesPanel } from "@/components/propriedade-operacoes-panel";
import { trpc } from "@/lib/trpc";

const STATUS_COLORS: Record<string, string> = {
  em_andamento: "#38A169",
  planejado: "#3B82F6",
  colhido: "#8B5CF6",
  perdido: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em Andamento",
  planejado: "Planejado",
  colhido: "Colhido",
  perdido: "Perdido",
};

const TIPO_LABELS: Record<string, string> = {
  graos: "Grãos",
  hortifruti: "Hortifruti",
  fruticultura: "Fruticultura",
  cana: "Cana",
  cafe: "Café",
  pecuaria: "Pecuária",
  misto: "Misto",
  outro: "Outro",
};

type PanelTab = "visao" | "mapa" | "operacoes" | "talhoes" | "cultivos" | "mais";

const MOBILE_TABS: { id: PanelTab; label: string; icon: string }[] = [
  { id: "visao", label: "Visão", icon: "house.fill" },
  { id: "mapa", label: "Mapa", icon: "map.fill" },
  { id: "operacoes", label: "Operações", icon: "checkmark.circle.fill" },
  { id: "talhoes", label: "Talhões", icon: "square.grid.2x2.fill" },
  { id: "cultivos", label: "Cultivos", icon: "leaf.fill" },
  { id: "mais", label: "Mais", icon: "ellipsis" },
];

export default function PropriedadeDetailScreen() {
  const { id, tab: tabParam } = useLocalSearchParams<{ id: string; tab?: string }>();
  const propId = parseInt(id ?? "0", 10);
  const colors = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const initialTab = (MOBILE_TABS.some((t) => t.id === tabParam) ? tabParam : "visao") as PanelTab;
  const [tab, setTab] = useState<PanelTab>(initialTab);
  const [safraLabel] = useState(currentSafraLabel);

  const {
    data: propriedade,
    isLoading: loadingProp,
    isError: errorProp,
    refetch: refetchProp,
  } = trpc.coreData.propriedades.get.useQuery({ id: propId }, { enabled: propId > 0 });
  const {
    data: cultivos = [],
    isLoading: loadingCult,
    isError: errorCult,
    refetch: refetchCult,
  } = trpc.coreData.cultivos.listByPropriedade.useQuery(
    { propriedadeId: propId },
    { enabled: propId > 0 },
  );
  const {
    data: terrenos = [],
    isLoading: loadingTer,
    isError: errorTer,
    refetch: refetchTer,
  } = trpc.coreData.terrenos.listByPropriedade.useQuery(
    { propriedadeId: propId },
    { enabled: propId > 0 },
  );
  const { data: resumoHoje } = trpc.coreData.tarefas.resumoHoje.useQuery(
    { propriedadeId: propId },
    { enabled: propId > 0 },
  );

  const selectTab = useCallback(
    (next: PanelTab) => {
      setTab(next);
      router.setParams({ tab: next } as any);
    },
    [router],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          backgroundColor: colors.primary,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
        },
        tabBar: {
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: isWide ? 8 : 0,
        },
        tabBtn: {
          flex: isWide ? undefined : 1,
          minWidth: isWide ? 110 : undefined,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 10,
          paddingVertical: 8,
          gap: 2,
        },
        infoCard: {
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.foreground,
          marginBottom: 10,
        },
        cultivoCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 8,
        },
        terrenoCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        chip: {
          backgroundColor: "rgba(255,255,255,0.16)",
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
      }),
    [colors, isWide],
  );

  if (loadingProp || loadingCult || loadingTer) {
    return (
      <ScreenContainer>
        <ScreenState status="loading" message="Carregando propriedade…" />
      </ScreenContainer>
    );
  }

  if (errorProp || errorCult || errorTer) {
    return (
      <ScreenContainer>
        <ScreenState
          status="error"
          onAction={() => {
            void refetchProp();
            void refetchCult();
            void refetchTer();
          }}
        />
      </ScreenContainer>
    );
  }

  if (!propriedade) {
    return (
      <ScreenContainer>
        <ScreenState
          status="empty"
          title="Propriedade não encontrada"
          message="Ela pode ter sido removida ou você não tem acesso."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  const areaTotal = Number(propriedade.tamanhoArea ?? 0);
  const areaUsada = terrenos.reduce((sum, t) => sum + (Number(t.area) || 0), 0);
  const localizacao = [propriedade.cidade, propriedade.estado].filter(Boolean).join(", ");
  const latitude = parseCoordinate(propriedade.latitude);
  const longitude = parseCoordinate(propriedade.longitude);
  const hasGps = hasValidCoordinates(latitude, longitude);
  const cultivosAtivos = cultivos.filter((c) => c.status === "em_andamento").length;
  const updatedAt = propriedade.updatedAt
    ? new Date(propriedade.updatedAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const overviewShortcuts = [
    {
      label: "Operações",
      value: String(resumoHoje?.abertas ?? 0),
      color: "#EF6C00",
      onPress: () => selectTab("operacoes"),
    },
    {
      label: "Talhões",
      value: String(terrenos.length),
      color: "#8B5CF6",
      onPress: () => selectTab("talhoes"),
    },
    {
      label: "Cultivos",
      value: String(cultivosAtivos),
      color: colors.success,
      onPress: () => selectTab("cultivos"),
    },
  ];

  return (
    <ScreenContainer>
      {/* Cabeçalho persistente */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
          >
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }} numberOfLines={1}>
              {propriedade.nome}
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }} numberOfLines={1}>
              {localizacao || "Localização não informada"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/propriedades" as any)}
            accessibilityRole="button"
            accessibilityLabel="Trocar propriedade"
            style={[styles.chip, { minHeight: 36, justifyContent: "center" }]}
          >
            <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>Trocar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginLeft: 56 }}>
          <View style={styles.chip} accessibilityLabel={`Safra ${safraLabel}`}>
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>{safraLabel}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>
              {cultivosAtivos > 0 ? "Operando" : "Sem cultivo ativo"}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 11 }}>Atualizado {updatedAt}</Text>
          </View>
        </View>
      </View>

      {/* Abas */}
      <ScrollView horizontal={!isWide ? false : true} showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        <View style={{ flexDirection: "row", width: isWide ? undefined : "100%" }}>
          {MOBILE_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.tabBtn,
                  active && { borderBottomWidth: 2, borderBottomColor: colors.primary },
                ]}
                onPress={() => selectTab(item.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <IconSymbol
                  name={item.icon as "house.fill"}
                  size={18}
                  color={active ? colors.primary : colors.muted}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: active ? "700" : "500",
                    color: active ? colors.primary : colors.muted,
                  }}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {tab === "visao" && (
          <>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              {[
                { icon: "scalemass.fill", value: `${areaTotal || "—"} ha`, label: "Área Total", color: colors.primary },
                { icon: "map.fill", value: String(terrenos.length), label: "Talhões", color: "#8B5CF6" },
                { icon: "leaf.fill", value: String(cultivosAtivos), label: "Cultivos Ativos", color: colors.success },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{
                    flex: 1,
                    backgroundColor: stat.color + "15",
                    borderRadius: 14,
                    padding: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: stat.color + "30",
                    minHeight: 88,
                  }}
                >
                  <IconSymbol name={stat.icon as "scalemass.fill"} size={20} color={stat.color} />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: stat.color, marginTop: 4 }}>{stat.value}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Atalhos</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {overviewShortcuts.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  onPress={s.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${s.label}`}
                  style={{
                    flex: 1,
                    minHeight: 56,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: s.color + "40",
                    backgroundColor: s.color + "12",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "700", color: s.color }}>{s.value}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {hasGps && (
              <View style={{ marginBottom: 12 }}>
                <WeatherCard propriedadeId={propriedade.id} compact />
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                Resumo cadastral
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                {TIPO_LABELS[propriedade.tipoProducao ?? "outro"] ?? "—"}
                {propriedade.tipoSolo ? ` · Solo ${propriedade.tipoSolo}` : ""}
                {propriedade.sistemaIrrigacao ? ` · ${propriedade.sistemaIrrigacao}` : ""}
              </Text>
              <TouchableOpacity
                onPress={() => selectTab("mais")}
                accessibilityRole="button"
                accessibilityLabel="Ver configurações e dados completos"
                style={{ marginTop: 10 }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                  Ver detalhes e configurações →
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
                Hoje na fazenda
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                {resumoHoje
                  ? `${resumoHoje.hoje} tarefa(s) para hoje · ${resumoHoje.emExecucao} em execução · ${cultivosAtivos} cultivo(s) ativo(s).`
                  : cultivosAtivos > 0
                    ? `${cultivosAtivos} cultivo(s) em andamento · ${terrenos.length} talhão(ões).`
                    : "Nenhum cultivo ativo nesta safra. Cadastre um cultivo para começar."}
              </Text>
              {(resumoHoje?.itensHoje?.length ?? 0) > 0 ? (
                <View style={{ marginTop: 8, gap: 6 }}>
                  {resumoHoje!.itensHoje.slice(0, 3).map((t) => (
                    <Text key={t.id} style={{ fontSize: 13, color: colors.foreground }}>
                      · {t.titulo}
                    </Text>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity
                onPress={() => selectTab("operacoes")}
                accessibilityRole="button"
                accessibilityLabel="Abrir operações"
                style={{ marginTop: 10 }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                  Ver operações →
                </Text>
              </TouchableOpacity>
            </View>

            {(resumoHoje?.atrasadas ?? 0) > 0 || (resumoHoje?.criticas ?? 0) > 0 ? (
              <View
                style={[
                  styles.infoCard,
                  { borderColor: "#EF6C00" + "80", backgroundColor: "#EF6C00" + "10" },
                ]}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#EF6C00", marginBottom: 6 }}>
                  Atenção necessária
                </Text>
                <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
                  {resumoHoje!.atrasadas > 0
                    ? `${resumoHoje!.atrasadas} tarefa(s) atrasada(s). `
                    : ""}
                  {resumoHoje!.criticas > 0
                    ? `${resumoHoje!.criticas} com prioridade alta/crítica.`
                    : ""}
                </Text>
                {(resumoHoje?.itensAtrasados?.length ?? 0) > 0 ? (
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {resumoHoje!.itensAtrasados.slice(0, 3).map((t) => (
                      <Text key={t.id} style={{ fontSize: 13, color: colors.foreground }}>
                        · {t.titulo} — {new Date(t.dataPrevista).toLocaleDateString("pt-BR")}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={() => selectTab("operacoes")}
                  accessibilityRole="button"
                  accessibilityLabel="Resolver tarefas atrasadas"
                  style={{ marginTop: 10 }}
                >
                  <Text style={{ color: "#EF6C00", fontWeight: "700", fontSize: 13 }}>
                    Resolver agora →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}

        {tab === "operacoes" && (
          <PropriedadeOperacoesPanel
            propriedadeId={propriedade.id}
            terrenos={terrenos.map((t) => ({ id: t.id, nome: t.nome }))}
          />
        )}

        {tab === "mapa" && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Mapa da propriedade</Text>
            {hasGps ? (
              <>
                <PropertyMap
                  markers={[
                    {
                      id: propriedade.id,
                      latitude: latitude!,
                      longitude: longitude!,
                      title: propriedade.nome,
                      description: localizacao || undefined,
                    },
                  ]}
                  height={isWide ? 360 : 260}
                />
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
                  GPS: {formatCoordinates(latitude!, longitude!)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 }}>
                  Polígonos de perímetro e talhões entram na Etapa 5. Hoje o mapa mostra a localização cadastral.
                </Text>
              </>
            ) : (
              <ScreenState
                status="empty"
                compact
                title="Sem coordenadas GPS"
                message="Edite o cadastro na lista de propriedades para adicionar latitude e longitude."
                actionLabel="Ir para lista"
                onAction={() => router.push("/(tabs)/propriedades" as any)}
              />
            )}
          </View>
        )}

        {tab === "talhoes" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Talhões ({terrenos.length})</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  minHeight: 40,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
                onPress={() => router.push(`/propriedades/terrenos?propriedadeId=${propriedade.id}`)}
                accessibilityRole="button"
                accessibilityLabel="Gerenciar talhões"
              >
                <IconSymbol name="plus" size={14} color="#FFF" />
                <Text style={{ fontSize: 13, color: "#FFF", fontWeight: "600" }}>Gerenciar</Text>
              </TouchableOpacity>
            </View>

            {terrenos.length === 0 ? (
              <ScreenState
                status="empty"
                compact
                title="Nenhum talhão"
                message="Cadastre talhões para organizar área e cultivos."
                actionLabel="Cadastrar talhão"
                onAction={() => router.push(`/propriedades/terrenos?propriedadeId=${propriedade.id}`)}
              />
            ) : (
              <>
                {terrenos.map((t) => (
                  <View key={t.id} style={styles.terrenoCard}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: "#8B5CF620",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSymbol name="map.fill" size={20} color="#8B5CF6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{t.nome}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {Number(t.area)} ha{t.tipoSolo ? ` · Solo ${t.tipoSolo}` : ""}
                      </Text>
                    </View>
                  </View>
                ))}
                {areaTotal > 0 && (
                  <View style={styles.infoCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: colors.muted }}>Área mapeada</Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        {areaUsada.toFixed(1)} / {areaTotal} ha
                      </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
                      <View
                        style={{
                          height: "100%",
                          width: `${Math.min(100, (areaUsada / areaTotal) * 100)}%`,
                          backgroundColor: colors.success,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {tab === "cultivos" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Cultivos e safras</Text>
              <View
                style={{
                  backgroundColor: colors.primary + "18",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>{safraLabel}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
              Visualizando {safraLabel}. Entidade de safras históricas será expandida sem misturar ciclos.
            </Text>
            {cultivos.length === 0 ? (
              <ScreenState
                status="empty"
                compact
                title="Nenhum cultivo"
                message="Cadastre um cultivo vinculado a um talhão."
                actionLabel="Ir para Cultivos"
                onAction={() => router.push("/(tabs)/cultivos" as any)}
              />
            ) : (
              cultivos.map((cultivo) => {
                const terrenoNome = terrenos.find((t) => t.id === cultivo.terrenoId)?.nome;
                return (
                  <TouchableOpacity
                    key={cultivo.id}
                    style={styles.cultivoCard}
                    onPress={() => router.push(`/cultivos/${cultivo.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Cultivo ${cultivo.nomeCultura}`}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                          {cultivo.nomeCultura}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{cultivo.variedade}</Text>
                        {terrenoNome ? (
                          <Text style={{ fontSize: 12, color: "#8B5CF6", marginTop: 2 }}>Talhão: {terrenoNome}</Text>
                        ) : null}
                      </View>
                      <View
                        style={{
                          backgroundColor: (STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.muted) + "20",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.muted,
                          }}
                        >
                          {STATUS_LABELS[cultivo.status ?? "em_andamento"] ?? cultivo.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {tab === "mais" && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Configurações e cadastro</Text>
              {[
                { label: "Tipo de Produção", value: TIPO_LABELS[propriedade.tipoProducao ?? "outro"] ?? "—" },
                { label: "Tipo de Solo", value: propriedade.tipoSolo || "—" },
                { label: "Irrigação", value: propriedade.sistemaIrrigacao || "—" },
                { label: "Fonte de água", value: propriedade.fonteAgua || "—" },
                { label: "Localização", value: localizacao || "—" },
                {
                  label: "Cadastrado em",
                  value: propriedade.createdAt
                    ? new Date(propriedade.createdAt).toLocaleDateString("pt-BR")
                    : "—",
                },
              ].map((item, idx, arr) => (
                <View
                  key={item.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.muted }}>{item.label}</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.foreground,
                      fontWeight: "600",
                      textTransform: "capitalize",
                      flexShrink: 1,
                      textAlign: "right",
                    }}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.infoCard, { flexDirection: "row", alignItems: "center", gap: 12 }]}
              onPress={() => router.push("/(tabs)/propriedades" as any)}
              accessibilityRole="button"
              accessibilityLabel="Editar propriedade na lista"
            >
              <IconSymbol name="pencil" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>Editar cadastro</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Nome, GPS, área e dados técnicos</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
