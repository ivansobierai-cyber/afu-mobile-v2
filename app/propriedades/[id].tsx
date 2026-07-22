import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
  Share,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenState } from "@/components/screen-state";
import { PropertyMap } from "@/components/property-map";
import { WeatherCard } from "@/components/weather-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCoordinates, hasValidCoordinates, parseCoordinate } from "@/lib/geo/coordinates";
import { resolveCultivosShortcutValue } from "@/lib/propriedades/overview-counts";
import {
  PropertyWorkspaceProvider,
  resolveCanRegister,
  resolveSafraBannerKind,
  resolveWorkspaceMode,
  resolveWorkspaceSafra,
  type PanelTab,
  type WorkspaceSafra,
} from "@/lib/propriedades/property-workspace";
import { roleHasPermission, type OrgRole } from "@/lib/security/org-roles";
import { PropriedadeOperacoesPanel } from "@/components/propriedade-operacoes-panel";
import { PropriedadePanelMenus } from "@/components/propriedade-panel-menus";
import { PropriedadeCultivoCreateModal } from "@/components/propriedade-cultivo-create-modal";
import { ConfirmNameModal } from "@/components/confirm-name-modal";
import {
  PropriedadeAlertasFeed,
  PropriedadeMonitoramentoPanel,
  PropriedadeEstoquePanel,
  PropriedadeCustosPanel,
  PropriedadeMetricasPanel,
} from "@/components/propriedade-expansao-panels";
import {
  extractPolygonRings,
  squarePolygonAround,
  approxAreaHaFromGeoJson,
  validatePolygonGeoJson,
  polygonRingToVertices,
  verticesToPolygonGeoJson,
  type LatLng,
} from "@/lib/propriedades/geojson-helpers";
import type { MapPolygon } from "@/components/property-map-types";
import {
  buildCultivoDetailHref,
  buildPropertyEditHref,
  buildTerrenosManageHref,
  resolveRegistrarTarget,
  type RegistrarAction,
} from "@/lib/propriedades/registrar-flow";
import { useCoreOfflineSync } from "@/hooks/use-core-offline-sync";
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

type MaisSection = "menu" | "monitoramento" | "estoque" | "custos" | "indicadores";
type VertexDraft = { latitude: string; longitude: string };
type VertexEditorState = {
  terrenoId: number | null;
  title: string;
  vertices: VertexDraft[];
};

const MOBILE_TABS: { id: PanelTab; label: string; icon: string }[] = [
  { id: "visao", label: "Visão", icon: "house.fill" },
  { id: "mapa", label: "Mapa", icon: "map.fill" },
  { id: "operacoes", label: "Operações", icon: "checkmark.circle.fill" },
  { id: "talhoes", label: "Talhões", icon: "square.grid.2x2.fill" },
  { id: "cultivos", label: "Cultivos", icon: "leaf.fill" },
  { id: "mais", label: "Mais", icon: "ellipsis" },
];

export default function PropriedadeDetailScreen() {
  const { id, tab: tabParam, safraId: safraIdParam } = useLocalSearchParams<{
    id: string;
    tab?: string;
    safraId?: string;
  }>();
  const propId = parseInt(id ?? "0", 10);
  const urlSafraId = safraIdParam ? parseInt(safraIdParam, 10) : NaN;
  const parsedUrlSafraId = Number.isFinite(urlSafraId) && urlSafraId > 0 ? urlSafraId : null;
  const colors = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const initialTab = (MOBILE_TABS.some((t) => t.id === tabParam) ? tabParam : "visao") as PanelTab;
  const [tab, setTab] = useState<PanelTab>(initialTab);
  const [maisSection, setMaisSection] = useState<MaisSection>("menu");
  const [menu, setMenu] = useState<"safra" | "registrar" | "admin" | null>(null);
  const [openTarefaNonce, setOpenTarefaNonce] = useState(0);
  const [openOcorrenciaNonce, setOpenOcorrenciaNonce] = useState(0);
  const [cultivoModalOpen, setCultivoModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [geoImportOpen, setGeoImportOpen] = useState(false);
  const [geoImportText, setGeoImportText] = useState("");
  const [geoImportTerrenoId, setGeoImportTerrenoId] = useState<number | null>(null);
  const [vertexEditor, setVertexEditor] = useState<VertexEditorState | null>(null);
  const utils = trpc.useUtils();
  const { isOnline, pending: offlinePending } = useCoreOfflineSync();

  // Deep link / retorno preserva aba (?tab=)
  useEffect(() => {
    if (tabParam && MOBILE_TABS.some((t) => t.id === tabParam) && tabParam !== tab) {
      setTab(tabParam as PanelTab);
    }
  }, [tabParam]);

  const { data: sessionProp } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const orgScope = sessionProp?.activeOrganizationId ?? undefined;
  /** Features de safra/expansão exigem API com organizações */
  const safraApiReady = orgScope != null && orgScope > 0;

  const { data: safrasRaw = [] } = trpc.coreData.expansao.safras.list.useQuery(
    { propriedadeId: propId },
    { enabled: propId > 0 && safraApiReady },
  );
  // Safra padrão é garantida no servidor (safras.list / overview) — sem write-on-read no cliente

  const workspaceSafras: WorkspaceSafra[] = useMemo(
    () =>
      safrasRaw.map((s) => ({
        id: s.id,
        nome: s.nome,
        status: s.status as WorkspaceSafra["status"],
        isDefault: Boolean(s.isDefault),
      })),
    [safrasRaw],
  );

  const { safra: resolvedSafra, invalidUrl } = resolveWorkspaceSafra({
    safras: workspaceSafras,
    urlSafraId: parsedUrlSafraId,
  });
  const activeSafraId = resolvedSafra?.id ?? null;
  const safraLabel = resolvedSafra?.nome ?? "Safra";

  // Persist safra padrão na URL quando ausente (deep link canônico)
  useEffect(() => {
    if (activeSafraId == null || parsedUrlSafraId === activeSafraId) return;
    if (invalidUrl) return;
    if (parsedUrlSafraId == null) {
      router.setParams({ safraId: String(activeSafraId), tab } as any);
    }
  }, [activeSafraId, parsedUrlSafraId, invalidUrl, tab, router]);

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
    { propriedadeId: propId, safraId: activeSafraId ?? undefined },
    { enabled: propId > 0 && (activeSafraId != null || !safraApiReady) },
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
    { propriedadeId: propId, safraId: activeSafraId ?? undefined },
    { enabled: propId > 0 && (activeSafraId != null || !safraApiReady) },
  );
  const { data: overview } = trpc.coreData.expansao.overview.useQuery(
    {
      propriedadeId: propId,
      safraId: activeSafraId ?? undefined,
      cacheScope: orgScope,
    },
    { enabled: propId > 0 && safraApiReady && activeSafraId != null },
  );
  const archiveProp = trpc.coreData.propriedades.archive.useMutation({
    onSuccess: async () => {
      await utils.coreData.propriedades.list.invalidate();
      await utils.coreData.propriedades.listArchived.invalidate();
      router.replace("/(tabs)/propriedades" as any);
    },
  });
  const deleteProp = trpc.coreData.propriedades.delete.useMutation({
    onSuccess: async () => {
      await utils.coreData.propriedades.list.invalidate();
      setDeleteConfirmOpen(false);
      router.replace("/(tabs)/propriedades" as any);
    },
  });
  const exportResumo = trpc.coreData.propriedades.exportResumo.useMutation();
  const closeSafraMut = trpc.coreData.expansao.safras.close.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.safras.list.invalidate({ propriedadeId: propId });
      await utils.coreData.expansao.overview.invalidate();
    },
  });
  const reopenSafraMut = trpc.coreData.expansao.safras.reopen.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.safras.list.invalidate({ propriedadeId: propId });
      await utils.coreData.expansao.overview.invalidate();
    },
  });

  const setGeometria = trpc.coreData.expansao.setGeometriaPropriedade.useMutation({
    onSuccess: async () => {
      await utils.coreData.propriedades.get.invalidate({ id: propId });
      await utils.coreData.expansao.overview.invalidate({
        propriedadeId: propId,
        safraId: activeSafraId ?? undefined,
        cacheScope: orgScope,
      });
      await utils.coreData.expansao.alertas.invalidate({
        propriedadeId: propId,
        cacheScope: orgScope,
      });
    },
  });
  const setGeometriaTerreno = trpc.coreData.expansao.setGeometriaTerreno.useMutation({
    onSuccess: async () => {
      await utils.coreData.terrenos.listByPropriedade.invalidate({ propriedadeId: propId });
      await utils.coreData.expansao.overview.invalidate({
        propriedadeId: propId,
        safraId: activeSafraId ?? undefined,
        cacheScope: orgScope,
      });
      await utils.coreData.expansao.alertas.invalidate({
        propriedadeId: propId,
        cacheScope: orgScope,
      });
    },
  });

  const selectTab = useCallback(
    (next: PanelTab) => {
      setTab(next);
      if (next !== "mais") setMaisSection("menu");
      const params: Record<string, string> = { tab: next };
      if (activeSafraId != null) params.safraId = String(activeSafraId);
      router.setParams(params as any);
    },
    [router, activeSafraId],
  );

  const selectSafraId = useCallback(
    (id: number) => {
      router.setParams({ tab, safraId: String(id) } as any);
    },
    [router, tab],
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

  // Visão usa overview agregado; listas detalhadas carregam em paralelo sem bloquear o shell
  if (loadingProp) {
    return (
      <ScreenContainer>
        <ScreenState status="loading" message="Carregando propriedade…" />
      </ScreenContainer>
    );
  }

  if (errorProp) {
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
  const talhoesCount = overview?.contagens.talhoes ?? terrenos.length;
  const cultivosCount = overview?.contagens.cultivos ?? cultivos.length;
  const tarefasAbertas = overview?.contagens.tarefasAbertas ?? resumoHoje?.abertas ?? 0;
  const goTalhoesManage = (opts?: { openCreate?: boolean }) =>
    router.push(
      buildTerrenosManageHref({
        propriedadeId: propriedade.id,
        safraId: activeSafraId,
        returnTab: "talhoes",
        openCreate: opts?.openCreate,
      }) as any,
    );

  const mapPolygons: MapPolygon[] = [];
  const propGeo = propriedade.geometriaGeoJson ?? overview?.geometrias?.propriedade ?? null;
  const propRings = extractPolygonRings(propGeo);
  propRings.forEach((ring, idx) => {
    mapPolygons.push({
      id: `prop-${idx}`,
      coordinates: ring,
      title: `Perímetro · ${propriedade.nome}`,
      color: "rgba(21,101,192,0.22)",
      strokeColor: "#1565C0",
    });
  });
  for (const t of terrenos) {
    const rings = extractPolygonRings(t.geometriaGeoJson);
    rings.forEach((ring, idx) => {
      mapPolygons.push({
        id: `talhao-${t.id}-${idx}`,
        coordinates: ring,
        title: t.nome,
        color: "rgba(46,125,50,0.25)",
        strokeColor: "#2E7D32",
      });
    });
  }
  const terrenosSemGeometria = terrenos.filter((t) => extractPolygonRings(t.geometriaGeoJson).length === 0);
  const terrenosComGeometria = terrenos.filter((t) => extractPolygonRings(t.geometriaGeoJson).length > 0);
  const toVertexDrafts = (vertices: LatLng[]): VertexDraft[] =>
    vertices.map((p) => ({
      latitude: String(p.latitude),
      longitude: String(p.longitude),
    }));
  const openVertexEditor = (target: { terrenoId: number | null; title: string; geojson: string | null | undefined }) => {
    const vertices = polygonRingToVertices(target.geojson);
    if (vertices.length < 3) {
      Alert.alert("Geometria inválida", "O polígono precisa de pelo menos 3 vértices editáveis.");
      return;
    }
    setVertexEditor({
      terrenoId: target.terrenoId,
      title: target.title,
      vertices: toVertexDrafts(vertices),
    });
  };
  const updateVertexDraft = (index: number, field: keyof VertexDraft, value: string) => {
    setVertexEditor((current) => {
      if (!current) return current;
      return {
        ...current,
        vertices: current.vertices.map((vertex, i) =>
          i === index ? { ...vertex, [field]: value } : vertex,
        ),
      };
    });
  };
  const addVertexDraft = () => {
    setVertexEditor((current) => {
      if (!current) return current;
      const last = current.vertices.at(-1) ?? { latitude: "", longitude: "" };
      return { ...current, vertices: [...current.vertices, { ...last }] };
    });
  };
  const removeVertexDraft = (index: number) => {
    setVertexEditor((current) => {
      if (!current || current.vertices.length <= 3) return current;
      return { ...current, vertices: current.vertices.filter((_, i) => i !== index) };
    });
  };
  const saveVertexEditor = async () => {
    if (!vertexEditor) return;
    const vertices = vertexEditor.vertices.map((p) => ({
      latitude: Number(p.latitude.replace(",", ".")),
      longitude: Number(p.longitude.replace(",", ".")),
    }));
    if (vertices.some((p) => !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude))) {
      Alert.alert("Coordenadas inválidas", "Informe latitude e longitude numéricas para todos os vértices.");
      return;
    }
    const valid = verticesToPolygonGeoJson(vertices);
    if (!valid.ok) {
      Alert.alert("Polígono inválido", valid.error);
      return;
    }
    try {
      if (vertexEditor.terrenoId) {
        await setGeometriaTerreno.mutateAsync({
          propriedadeId: propriedade.id,
          terrenoId: vertexEditor.terrenoId,
          geometriaGeoJson: valid.normalized,
          areaGeometricaHa: valid.areaHa ?? undefined,
          origem: "desenhada",
        });
      } else {
        await setGeometria.mutateAsync({
          propriedadeId: propriedade.id,
          geometriaGeoJson: valid.normalized,
          areaGeometricaHa: valid.areaHa ?? undefined,
          origem: "desenhada",
        });
      }
      setVertexEditor(null);
      Alert.alert("Vértices salvos", "Geometria atualizada com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao salvar vértices.");
    }
  };
  const openGeoImport = (terrenoId: number | null = null) => {
    setGeoImportTerrenoId(terrenoId);
    setGeoImportText("");
    setGeoImportOpen(true);
  };
  const saveGeoImport = async () => {
    const valid = validatePolygonGeoJson(geoImportText);
    if (!valid.ok) {
      Alert.alert("GeoJSON inválido", valid.error);
      return;
    }
    try {
      if (geoImportTerrenoId) {
        await setGeometriaTerreno.mutateAsync({
          propriedadeId: propriedade.id,
          terrenoId: geoImportTerrenoId,
          geometriaGeoJson: valid.normalized,
          areaGeometricaHa: valid.areaHa ?? undefined,
          origem: "importada",
        });
      } else {
        await setGeometria.mutateAsync({
          propriedadeId: propriedade.id,
          geometriaGeoJson: valid.normalized,
          areaGeometricaHa: valid.areaHa ?? undefined,
          origem: "importada",
        });
      }
      setGeoImportOpen(false);
      setGeoImportText("");
      setGeoImportTerrenoId(null);
      Alert.alert("GeoJSON importado", "Geometria salva com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao salvar geometria");
    }
  };
  const gerarGeometriaTerrenoGps = async (terrenoId: number) => {
    if (!hasGps) {
      Alert.alert("Sem GPS", "Cadastre latitude e longitude da propriedade antes de gerar.");
      return;
    }
    const geo = squarePolygonAround(latitude!, longitude!, 0.004);
    const area = approxAreaHaFromGeoJson(geo);
    try {
      await setGeometriaTerreno.mutateAsync({
        propriedadeId: propriedade.id,
        terrenoId,
        geometriaGeoJson: geo,
        areaGeometricaHa: area ?? undefined,
        origem: "gps",
      });
      Alert.alert("Talhão atualizado", "Geometria aproximada registrada.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao salvar geometria do talhão");
    }
  };
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
      value: String(tarefasAbertas),
      color: "#EF6C00",
      onPress: () => selectTab("operacoes"),
    },
    {
      label: "Talhões",
      value: String(talhoesCount),
      color: "#8B5CF6",
      onPress: () => selectTab("talhoes"),
    },
    {
      label: "Cultivos",
      value: String(
        resolveCultivosShortcutValue({
          label: "Cultivos",
          cultivosAtivos,
          cultivosCount,
        }),
      ),
      color: colors.success,
      onPress: () => selectTab("cultivos"),
    },
  ];

  const activeRole = (sessionProp?.activeRole ?? null) as OrgRole | null;
  const canWriteProperty = activeRole ? roleHasPermission(activeRole, "property.write") : false;
  const canExport = activeRole ? roleHasPermission(activeRole, "reports.export") : false;
  const canArchiveProperty = activeRole
    ? roleHasPermission(activeRole, "property.archive")
    : false;
  const canDeleteProperty = activeRole
    ? roleHasPermission(activeRole, "property.delete")
    : false;
  const canCloseSafra = activeRole ? roleHasPermission(activeRole, "safra.close") : false;
  const canReopenSafra = activeRole ? roleHasPermission(activeRole, "safra.reopen") : false;
  const filterComplete = overview?.completeness?.status === "complete";
  /** Só liberar “Modo histórico” quando filtragem for completa (regra central do plano) */
  const historicalModeReady = filterComplete;
  const workspaceMode = resolveWorkspaceMode({
    safraStatus: resolvedSafra?.status ?? null,
    filterComplete,
  });
  const isHistorical = workspaceMode === "historical";
  const canRegister = resolveCanRegister({
    mode: workspaceMode,
    canWriteProperty,
    canWriteOperations: activeRole
      ? roleHasPermission(activeRole, "operations.write")
      : false,
  });
  const bannerKind = resolveSafraBannerKind({
    safraStatus: resolvedSafra?.status ?? null,
    filterComplete,
  });
  const periodFilterActive = bannerKind === "partial_period";
  const handleRegistrar = (action: RegistrarAction) => {
    if (!canRegister) {
      Alert.alert(
        "Somente leitura",
        "Safra histórica — volte para a safra atual para registrar.",
      );
      return;
    }
    const target = resolveRegistrarTarget(action);
    if (target.externalRoute === "terrenos") {
      goTalhoesManage({ openCreate: true });
      return;
    }
    if (target.tab) selectTab(target.tab);
    if (target.maisSection) setMaisSection(target.maisSection);
    if (action === "tarefa") setOpenTarefaNonce((n) => n + 1);
    else if (action === "ocorrencia") setOpenOcorrenciaNonce((n) => n + 1);
    else if (action === "cultivo") setCultivoModalOpen(true);
  };

  if (invalidUrl && parsedUrlSafraId != null) {
    return (
      <ScreenContainer>
        <ScreenState
          status="error"
          title="Safra inválida"
          message="Esta safra não pertence à propriedade ou não está disponível."
          actionLabel="Ir para safra atual"
          onAction={() => {
            const def =
              workspaceSafras.find((s) => s.isDefault) ??
              workspaceSafras.find((s) => s.status === "ativa");
            if (def) router.setParams({ safraId: String(def.id), tab } as any);
            else router.back();
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <PropertyWorkspaceProvider
      organizationId={orgScope ?? 0}
      propriedadeId={propriedade.id}
      tab={tab}
      safras={workspaceSafras}
      urlSafraId={activeSafraId}
      filterComplete={filterComplete}
      activeRole={activeRole}
      onSetTab={selectTab}
      onSetSafraId={selectSafraId}
    >
    <ScreenContainer>
      <PropriedadePanelMenus
        visible={menu}
        onClose={() => setMenu(null)}
        safras={workspaceSafras}
        selectedSafraId={activeSafraId}
        onSelectSafraId={selectSafraId}
        propriedadeNome={propriedade.nome}
        canWriteProperty={canWriteProperty}
        canExport={canExport}
        canArchiveProperty={canArchiveProperty}
        canDeleteProperty={canDeleteProperty}
        canCloseSafra={canCloseSafra}
        canReopenSafra={canReopenSafra}
        historicalModeReady={historicalModeReady}
        canRegister={canRegister}
        isHistoricalSafra={isHistorical}
        onSafraAction={(action) => {
          if (action === "goCurrent") {
            const def =
              workspaceSafras.find((s) => s.isDefault && s.status === "ativa") ??
              workspaceSafras.find((s) => s.status === "ativa");
            if (def) selectSafraId(def.id);
            else Alert.alert("Sem safra atual", "Nenhuma safra ativa encontrada.");
            return;
          }
          if (action === "close" && activeSafraId != null) {
            const alternatives = workspaceSafras.filter(
              (s) =>
                s.id !== activeSafraId &&
                (s.status === "ativa" || s.status === "planejada"),
            );
            const nextId = alternatives[0]?.id;
            const closingDefault = Boolean(resolvedSafra?.isDefault);
            Alert.alert(
              "Encerrar safra?",
              closingDefault
                ? nextId
                  ? `${safraLabel} passará a histórico. Próxima corrente: ${alternatives[0]!.nome}.`
                  : `${safraLabel} é a safra padrão e não há outra ativa/planejada. Encerrar deixará a propriedade sem corrente.`
                : `${safraLabel} passará a modo histórico (somente leitura).`,
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Encerrar",
                  style: "destructive",
                  onPress: () =>
                    void closeSafraMut
                      .mutateAsync({
                        propriedadeId: propriedade.id,
                        safraId: activeSafraId,
                        ...(closingDefault
                          ? nextId
                            ? { nextDefaultSafraId: nextId }
                            : { allowNoDefault: true }
                          : {}),
                      })
                      .then((res) => {
                        const next = (res as { newDefault?: { id: number } | null })
                          ?.newDefault;
                        if (next?.id) selectSafraId(next.id);
                      })
                      .catch((e) => Alert.alert("Erro", e?.message ?? "Falha ao encerrar")),
                },
              ],
            );
            return;
          }
          if (action === "reopen" && activeSafraId != null) {
            Alert.alert(
              "Reabrir safra?",
              `Confirma reabertura de ${safraLabel}? A ação será auditada.`,
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Reabrir",
                  onPress: () =>
                    void reopenSafraMut
                      .mutateAsync({
                        propriedadeId: propriedade.id,
                        safraId: activeSafraId,
                        makeDefault: true,
                      })
                      .catch((e) => Alert.alert("Erro", e?.message ?? "Falha ao reabrir")),
                },
              ],
            );
          }
        }}
        onRegistrar={handleRegistrar}
        onAdmin={(action) => {
          if (action === "editar") {
            router.push(
              buildPropertyEditHref({
                propriedadeId: propriedade.id,
                tab,
                safraId: activeSafraId,
              }) as any,
            );
          } else if (action === "exportar") {
            if (!canExport) {
              Alert.alert("Sem permissão", "Seu papel não inclui exportação de relatórios.");
              return;
            }
            void exportResumo
              .mutateAsync({
                id: propriedade.id,
                safraId: activeSafraId ?? undefined,
                safraLabel,
              })
              .then((res) =>
                Share.share({ message: res.text, title: res.title }).catch(() => {
                  Alert.alert(res.title, res.text);
                }),
              )
              .catch((e) => Alert.alert("Erro", e?.message ?? "Falha ao exportar"));
          } else if (action === "arquivar") {
            if (!canArchiveProperty) {
              Alert.alert("Sem permissão", "Seu papel não pode arquivar propriedades.");
              return;
            }
            void archiveProp
              .mutateAsync({
                id: propriedade.id,
                motivo: "Arquivada pelo painel da propriedade",
              })
              .catch((e) => Alert.alert("Erro", e?.message ?? "Não foi possível arquivar"));
          } else if (action === "excluir") {
            if (!canDeleteProperty) {
              Alert.alert("Sem permissão", "Exclusão definitiva exige property.delete.");
              return;
            }
            setDeleteConfirmOpen(true);
          }
        }}
      />

      <ConfirmNameModal
        visible={deleteConfirmOpen}
        expectedName={propriedade.nome}
        loading={deleteProp.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={(confirmNome) => {
          void deleteProp
            .mutateAsync({ id: propriedade.id, confirmNome })
            .catch((e) => Alert.alert("Erro", e?.message ?? "Não foi possível excluir"));
        }}
      />

      {/* Cabeçalho persistente */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
            onPress={() => {
              if (!canRegister) {
                Alert.alert(
                  "Somente leitura",
                  isHistorical
                    ? "Modo histórico — esta safra não aceita novos registros."
                    : "Sem permissão para registrar nesta propriedade.",
                );
                return;
              }
              setMenu("registrar");
            }}
            accessibilityRole="button"
            accessibilityLabel="Registrar"
            accessibilityState={{ disabled: !canRegister }}
            style={[
              styles.chip,
              {
                minHeight: 36,
                justifyContent: "center",
                paddingHorizontal: 12,
                opacity: canRegister ? 1 : 0.45,
              },
            ]}
          >
            <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "800" }}>+ Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMenu("admin")}
            accessibilityRole="button"
            accessibilityLabel="Menu administrativo"
            style={{ minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center" }}
          >
            <IconSymbol name="ellipsis" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginLeft: 52 }}>
          <TouchableOpacity
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel={`Safra ${safraLabel}. Toque para alterar`}
            onPress={() => setMenu("safra")}
          >
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>
              {safraLabel}
              {isHistorical ? " · Histórico" : periodFilterActive ? " · Filtro fin." : ""}
              {" ▾"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/propriedades" as any)}
            accessibilityRole="button"
            accessibilityLabel="Trocar propriedade"
            style={styles.chip}
          >
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>Trocar</Text>
          </TouchableOpacity>
          <View style={styles.chip}>
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>
              {cultivosAtivos > 0 ? "Operando" : "Sem cultivo ativo"}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 11 }}>Atualizado {updatedAt}</Text>
          </View>
        </View>
        {periodFilterActive ? (
          <Text
            style={{
              marginTop: 8,
              marginLeft: 52,
              color: "rgba(255,255,255,0.9)",
              fontSize: 11,
              fontWeight: "600",
              lineHeight: 15,
            }}
          >
            Filtro financeiro por período — filtragem de ciclo ainda parcial
            {overview?.completeness?.missing?.length
              ? ` (pendente: ${overview.completeness.missing.join(", ")})`
              : ""}.
          </Text>
        ) : null}
        {!isOnline ? (
          <Text
            style={{
              marginTop: 8,
              marginLeft: 52,
              color: "#FFF",
              fontSize: 11,
              fontWeight: "700",
              lineHeight: 15,
              backgroundColor: "rgba(183,28,28,0.55)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              overflow: "hidden",
              alignSelf: "flex-start",
            }}
            accessibilityRole="text"
            accessibilityLabel="Sem conexão"
          >
            Offline
            {offlinePending > 0 ? ` · ${offlinePending} pendente(s)` : " · dados em cache"}
          </Text>
        ) : null}
        {isHistorical ? (
          <Text
            style={{
              marginTop: 8,
              marginLeft: 52,
              color: "#FFF",
              fontSize: 12,
              fontWeight: "800",
              lineHeight: 16,
              backgroundColor: "rgba(0,0,0,0.25)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              overflow: "hidden",
              alignSelf: "flex-start",
            }}
          >
            Modo histórico — {safraLabel} ({resolvedSafra?.status}). Somente leitura.
          </Text>
        ) : null}
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
                { icon: "map.fill", value: String(talhoesCount), label: "Talhões", color: "#8B5CF6" },
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

            <PropriedadeAlertasFeed
              propriedadeId={propriedade.id}
              onOpenOperacoes={() => selectTab("operacoes")}
            />
          </>
        )}

        {tab === "operacoes" && (
          <PropriedadeOperacoesPanel
            propriedadeId={propriedade.id}
            terrenos={terrenos.map((t) => ({ id: t.id, nome: t.nome }))}
            safraId={activeSafraId ?? undefined}
            readOnly={isHistorical}
            openCreateNonce={openTarefaNonce}
          />
        )}

        {tab === "mapa" && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Mapa da propriedade</Text>
            {hasGps || mapPolygons.length > 0 ? (
              <>
                <PropertyMap
                  markers={
                    hasGps
                      ? [
                          {
                            id: propriedade.id,
                            latitude: latitude!,
                            longitude: longitude!,
                            title: propriedade.nome,
                            description: localizacao || undefined,
                          },
                        ]
                      : []
                  }
                  polygons={mapPolygons}
                  height={isWide ? 360 : 260}
                />
                {hasGps ? (
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
                    GPS: {formatCoordinates(latitude!, longitude!)}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 }}>
                  {propGeo
                    ? `Perímetro cadastrado${propriedade.areaGeometricaHa ? ` · ${propriedade.areaGeometricaHa} ha geom.` : ""}.`
                    : "Sem perímetro GeoJSON. Gere um retângulo aproximado a partir do GPS ou importe depois."}
                  {" "}
                  {mapPolygons.filter((p) => String(p.id).startsWith("talhao-")).length} talhão(ões) com geometria.
                </Text>
                {hasGps && !propGeo ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Gerar perímetro aproximado"
                    style={{
                      marginTop: 12,
                      minHeight: 44,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 12,
                    }}
                    onPress={() => {
                      const geo = squarePolygonAround(latitude!, longitude!);
                      const area = approxAreaHaFromGeoJson(geo);
                      void setGeometria
                        .mutateAsync({
                          propriedadeId: propriedade.id,
                          geometriaGeoJson: geo,
                          areaGeometricaHa: area ?? undefined,
                          origem: "desenhada",
                        })
                        .then(() => Alert.alert("Perímetro salvo", "Geometria aproximada registrada."))
                        .catch((e) => Alert.alert("Erro", e?.message ?? "Falha ao salvar geometria"));
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Gerar perímetro aproximado (GPS)
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <ScreenState
                status="empty"
                compact
                title="Sem coordenadas GPS"
                message="Edite o cadastro na lista de propriedades para adicionar latitude e longitude."
                actionLabel="Editar GPS"
                onAction={() =>
                  router.push(
                    buildPropertyEditHref({
                      propriedadeId: propriedade.id,
                      tab: "mapa",
                      safraId: activeSafraId,
                    }) as any,
                  )
                }
              />
            )}
            {canWriteProperty && !isHistorical ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                {propGeo ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Editar vértices da propriedade"
                    style={{
                      minHeight: 44,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 12,
                    }}
                    onPress={() =>
                      openVertexEditor({
                        terrenoId: null,
                        title: "Editar vértices da propriedade",
                        geojson: propGeo,
                      })
                    }
                  >
                    <Text style={{ color: "#FFF", fontWeight: "700" }}>Editar vértices</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Importar GeoJSON"
                  style={{
                    minHeight: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 12,
                  }}
                  onPress={() => openGeoImport(null)}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>
                    Importar GeoJSON
                  </Text>
                </TouchableOpacity>
                {terrenosComGeometria.length > 0 ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 12,
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
                      Talhões com geometria
                    </Text>
                    {terrenosComGeometria.slice(0, 6).map((t) => (
                      <View
                        key={t.id}
                        style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                      >
                        <Text style={{ flex: 1, minWidth: 120, color: colors.foreground, fontSize: 12 }}>
                          {t.nome}
                        </Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Editar vértices de ${t.nome}`}
                          onPress={() =>
                            openVertexEditor({
                              terrenoId: t.id,
                              title: `Editar vértices · ${t.nome}`,
                              geojson: t.geometriaGeoJson,
                            })
                          }
                        >
                          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                            Editar vértices
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}
                {terrenosSemGeometria.length > 0 ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 12,
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
                      Talhões sem geometria
                    </Text>
                    {terrenosSemGeometria.slice(0, 6).map((t) => (
                      <View
                        key={t.id}
                        style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                      >
                        <Text style={{ flex: 1, minWidth: 120, color: colors.foreground, fontSize: 12 }}>
                          {t.nome}
                        </Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Gerar geometria GPS para ${t.nome}`}
                          onPress={() => void gerarGeometriaTerrenoGps(t.id)}
                        >
                          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                            Gerar GPS
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Importar GeoJSON para ${t.nome}`}
                          onPress={() => openGeoImport(t.id)}
                        >
                          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                            Importar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        )}

        {tab === "talhoes" && (
          <>
            {loadingTer ? (
              <ScreenState status="loading" compact message="Carregando talhões…" />
            ) : errorTer ? (
              <ScreenState status="error" compact onAction={() => void refetchTer()} />
            ) : !isOnline && terrenos.length === 0 ? (
              <ScreenState status="offline" compact onAction={() => void refetchTer()} />
            ) : (
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
                onPress={() => goTalhoesManage()}
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
                onAction={() => goTalhoesManage({ openCreate: true })}
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
          </>
        )}

        {tab === "cultivos" && (
          <>
            {loadingCult ? (
              <ScreenState status="loading" compact message="Carregando cultivos…" />
            ) : errorCult ? (
              <ScreenState status="error" compact onAction={() => void refetchCult()} />
            ) : (
              <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Cultivos e safras</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
                {!isHistorical ? (
                  <TouchableOpacity
                    onPress={() => setCultivoModalOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Novo cultivo"
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      minHeight: 40,
                      paddingHorizontal: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <IconSymbol name="plus" size={14} color="#FFF" />
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>Novo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
              Cultivos da {safraLabel}
              {activeSafraId != null ? ` (#${activeSafraId})` : ""}. Talhões e área total são da
              propriedade (permanentes).
            </Text>
            {cultivos.length === 0 ? (
              <ScreenState
                status="empty"
                compact
                title="Nenhum cultivo"
                message={
                  isHistorical
                    ? "Não há cultivos nesta safra histórica."
                    : "Cadastre um cultivo vinculado a um talhão."
                }
                actionLabel={isHistorical ? undefined : "Novo cultivo"}
                onAction={isHistorical ? undefined : () => setCultivoModalOpen(true)}
              />
            ) : (
              cultivos.map((cultivo) => {
                const terrenoNome = terrenos.find((t) => t.id === cultivo.terrenoId)?.nome;
                return (
                  <TouchableOpacity
                    key={cultivo.id}
                    style={styles.cultivoCard}
                    onPress={() =>
                      router.push(
                        buildCultivoDetailHref({
                          cultivoId: cultivo.id,
                          propriedadeId: propriedade.id,
                          tab: "cultivos",
                          safraId: activeSafraId,
                        }) as any,
                      )
                    }
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
            <PropriedadeCultivoCreateModal
              visible={cultivoModalOpen && !isHistorical}
              onClose={() => setCultivoModalOpen(false)}
              propriedadeId={propriedade.id}
              safraId={activeSafraId ?? undefined}
              safraLabel={safraLabel}
              terrenos={terrenos.map((t) => ({ id: t.id, nome: t.nome, area: t.area }))}
            />
              </>
            )}
          </>
        )}

        {tab === "mais" && (
          <>
            {maisSection !== "menu" ? (
              <TouchableOpacity
                onPress={() => setMaisSection("menu")}
                accessibilityRole="button"
                accessibilityLabel="Voltar ao menu Mais"
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, minHeight: 44 }}
              >
                <IconSymbol name="chevron.left" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Mais</Text>
              </TouchableOpacity>
            ) : null}

            {maisSection === "menu" && (
              <>
                {(
                  [
                    {
                      id: "monitoramento" as const,
                      title: "Monitoramento",
                      subtitle: "Ocorrências → diagnóstico → tarefa",
                      icon: "eye.fill" as const,
                    },
                    {
                      id: "estoque" as const,
                      title: "Recursos e estoque",
                      subtitle: "Insumos agrícolas da fazenda",
                      icon: "tray" as const,
                    },
                    {
                      id: "custos" as const,
                      title: "Custos e resultados",
                      subtitle: "Orçamento da safra e lançamentos",
                      icon: "chart.bar.fill" as const,
                    },
                    {
                      id: "indicadores" as const,
                      title: "Indicadores",
                      subtitle: "Métricas com fórmula e fonte",
                      icon: "chart.line.uptrend.xyaxis" as const,
                    },
                  ] as const
                ).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.infoCard, { flexDirection: "row", alignItems: "center", gap: 12 }]}
                    onPress={() => setMaisSection(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                  >
                    <IconSymbol name={item.icon as "eye.fill"} size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>{item.subtitle}</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                  </TouchableOpacity>
                ))}

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
                  onPress={() =>
                    router.push(
                      buildPropertyEditHref({
                        propriedadeId: propriedade.id,
                        tab: "mais",
                        safraId: activeSafraId,
                      }) as any,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Editar propriedade na lista"
                >
                  <IconSymbol name="pencil" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                      Editar cadastro
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      Nome, GPS, área e dados técnicos
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </TouchableOpacity>
              </>
            )}

            {maisSection === "monitoramento" && (
              <PropriedadeMonitoramentoPanel
                propriedadeId={propriedade.id}
                terrenos={terrenos.map((t) => ({ id: t.id, nome: t.nome }))}
                safraId={activeSafraId ?? undefined}
                readOnly={isHistorical}
                openCreateNonce={openOcorrenciaNonce}
              />
            )}
            {maisSection === "estoque" && (
              <PropriedadeEstoquePanel propriedadeId={propriedade.id} />
            )}
            {maisSection === "custos" && (
              <PropriedadeCustosPanel
                propriedadeId={propriedade.id}
                safraLabel={safraLabel}
                safraId={activeSafraId ?? undefined}
              />
            )}
            {maisSection === "indicadores" && (
              <PropriedadeMetricasPanel
                propriedadeId={propriedade.id}
                nomeSafra={safraLabel}
                safraId={activeSafraId ?? undefined}
              />
            )}
          </>
        )}
      </ScrollView>
      <Modal
        visible={geoImportOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setGeoImportOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "85%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
              {geoImportTerrenoId ? "Importar GeoJSON do talhão" : "Importar GeoJSON da propriedade"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>
              Cole um Polygon, Feature ou FeatureCollection com anel fechado.
            </Text>
            <TextInput
              value={geoImportText}
              onChangeText={setGeoImportText}
              placeholder='{"type":"Polygon","coordinates":[...]}'
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 180,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                color: colors.foreground,
                marginBottom: 12,
              }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setGeoImportOpen(false)}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void saveGeoImport()}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={vertexEditor != null}
        animationType="slide"
        transparent
        onRequestClose={() => setVertexEditor(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "88%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
              {vertexEditor?.title ?? "Editar vértices"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 18 }}>
              Ajuste os vértices do anel. O fechamento do polígono é feito automaticamente ao salvar.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {vertexEditor?.vertices.map((vertex, index) => (
                <View
                  key={index}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>
                      Vértice {index + 1}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Remover vértice ${index + 1}`}
                      disabled={(vertexEditor?.vertices.length ?? 0) <= 3}
                      onPress={() => removeVertexDraft(index)}
                    >
                      <Text
                        style={{
                          color: (vertexEditor?.vertices.length ?? 0) <= 3 ? colors.muted : "#C62828",
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        Remover
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: isWide ? "row" : "column", gap: 8, marginTop: 8 }}>
                    <TextInput
                      value={vertex.latitude}
                      onChangeText={(value) => updateVertexDraft(index, "latitude", value)}
                      placeholder="Latitude"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
                      style={{
                        flex: 1,
                        minHeight: 44,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        color: colors.foreground,
                      }}
                    />
                    <TextInput
                      value={vertex.longitude}
                      onChangeText={(value) => updateVertexDraft(index, "longitude", value)}
                      placeholder="Longitude"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
                      style={{
                        flex: 1,
                        minHeight: 44,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        color: colors.foreground,
                      }}
                    />
                  </View>
                </View>
              ))}
              <TouchableOpacity
                onPress={addVertexDraft}
                accessibilityRole="button"
                accessibilityLabel="Adicionar vértice"
                style={{
                  minHeight: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Adicionar vértice</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setVertexEditor(null)}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void saveVertexEditor()}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Salvar vértices</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
    </PropertyWorkspaceProvider>
  );
}
