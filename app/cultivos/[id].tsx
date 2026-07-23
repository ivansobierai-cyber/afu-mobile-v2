import { useCallback, useEffect, useState } from "react";
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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CultivoHeader } from "@/components/cultivos/cultivo-header";
import { CultivoVisaoGeral } from "@/components/cultivos/cultivo-visao-geral";
import { CultivoTabPlaceholder } from "@/components/cultivos/cultivo-tab-placeholder";
import { CultivoDashboardCards } from "@/components/cultivos/cultivo-dashboard";
import { TimelineCultivo } from "@/components/cultivos/timeline-cultivo";
import {
  CultivoDiagnosticosTab,
  CultivoMonitoramentoTab,
} from "@/components/cultivos/cultivo-monitoramento-tab";
import { CultivoMapaTab } from "@/components/cultivos/cultivo-mapa-tab";
import { useColors } from "@/hooks/use-colors";
import { useRunCoreMutation } from "@/hooks/use-run-core-mutation";
import {
  buildPropertyReturnHref,
  parsePropertyReturnParams,
} from "@/lib/propriedades/registrar-flow";
import {
  CULTIVO_WORKSPACE_TABS,
  nextCultivoFase,
  resolveCultivoTab,
  type CultivoWorkspaceTab,
} from "@/lib/cultivos/cultivo-workspace";
import { trpc } from "@/lib/trpc";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";

export default function CultivoDetailScreen() {
  const { id, propriedadeId, returnTab, safraId, tab: tabParam } = useLocalSearchParams<{
    id: string;
    propriedadeId?: string;
    returnTab?: string;
    safraId?: string;
    tab?: string;
  }>();
  const cultivoId = parseInt(id ?? "0", 10);
  const colors = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { runMutation } = useRunCoreMutation();
  const [advancingFase, setAdvancingFase] = useState(false);
  const [tab, setTab] = useState<CultivoWorkspaceTab>(() => resolveCultivoTab(tabParam));

  const returnCtx = parsePropertyReturnParams({
    propriedadeId: propriedadeId ?? undefined,
    returnTab,
    safraId,
  });

  const goBack = () => {
    if (returnCtx) {
      router.replace(buildPropertyReturnHref(returnCtx) as any);
      return;
    }
    router.back();
  };

  useEffect(() => {
    setTab(resolveCultivoTab(tabParam));
  }, [tabParam]);

  const selectTab = useCallback(
    (next: CultivoWorkspaceTab) => {
      setTab(next);
      router.setParams({ tab: next });
    },
    [router],
  );

  const { cacheInput, tenantReady } = useTenantQueryScope();
  const { data: cultivos = [], isLoading, isError, refetch } = trpc.coreData.cultivos.list.useQuery(
    cacheInput,
    {
      enabled: tenantReady,
    },
  );
  const cultivo = cultivos.find((c) => c.id === cultivoId) ?? null;

  const { data: dashboard } = trpc.coreData.cultivos.dashboard.useQuery(
    { id: cultivoId },
    { enabled: tenantReady && Number.isFinite(cultivoId) && cultivoId > 0 },
  );
  const { data: timeline = [] } = trpc.coreData.cultivos.timeline.useQuery(
    { id: cultivoId },
    {
      enabled:
        tenantReady &&
        Number.isFinite(cultivoId) &&
        cultivoId > 0 &&
        (tab === "historico" || tab === "visao"),
    },
  );

  const { data: terrenosDaPropRaw = [] } = trpc.coreData.terrenos.listByPropriedade.useQuery(
    { propriedadeId: cultivo?.propriedadeId ?? 0 },
    {
      enabled:
        tenantReady &&
        !!cultivo?.propriedadeId &&
        (tab === "monitoramento" || tab === "mapa"),
    },
  );
  const terrenosDaProp = terrenosDaPropRaw.map((t) => ({ id: t.id, nome: t.nome }));

  const advanceFase = async () => {
    if (!cultivo) return;
    const nextFase = nextCultivoFase(cultivo.faseAtual);
    setAdvancingFase(true);
    try {
      await runMutation("cultivo", "update", {
        id: cultivo.id,
        data: { faseAtual: nextFase },
      });
    } catch {
      // erro tratado pelo mutation
    } finally {
      setAdvancingFase(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenState status="loading" message="Carregando cultivo…" />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <ScreenState status="error" onAction={() => void refetch()} />
      </ScreenContainer>
    );
  }

  if (!cultivo) {
    return (
      <ScreenContainer>
        <ScreenState
          status="empty"
          title="Cultivo não encontrado"
          message="Ele pode ter sido removido ou você não tem acesso."
          actionLabel="Voltar"
          onAction={goBack}
        />
      </ScreenContainer>
    );
  }

  const styles = StyleSheet.create({
    tabBar: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      maxHeight: 56,
    },
    tabBtn: {
      flex: isWide ? undefined : 1,
      minWidth: isWide ? 100 : undefined,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 8,
      gap: 4,
    },
  });

  return (
    <ScreenContainer>
      <CultivoHeader
        nomeCultura={cultivo.nomeCultura}
        variedade={cultivo.variedade}
        status={cultivo.status}
        faseAtual={cultivo.faseAtual}
        onBack={goBack}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
      >
        <View style={{ flexDirection: "row" }}>
          {CULTIVO_WORKSPACE_TABS.map((item) => {
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
                  name={item.icon as "leaf.fill"}
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

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "visao" && (
          <>
            {dashboard ? <CultivoDashboardCards data={dashboard} /> : null}
            <CultivoVisaoGeral
              cultivo={cultivo}
              advancingFase={advancingFase}
              onAdvanceFase={advanceFase}
            />
          </>
        )}
        {tab === "operacoes" && (
          <CultivoTabPlaceholder
            title="Operações"
            message="Tarefas e operações deste cultivo serão exibidas aqui (Etapa 8)."
          />
        )}
        {tab === "monitoramento" && (
          <CultivoMonitoramentoTab
            culturaId={cultivo.id}
            propriedadeId={cultivo.propriedadeId}
            terrenoId={cultivo.terrenoId}
            safraId={cultivo.safraId}
            terrenos={terrenosDaProp}
          />
        )}
        {tab === "mapa" && <CultivoMapaTab culturaId={cultivo.id} />}
        {tab === "diagnosticos" && (
          <CultivoDiagnosticosTab
            culturaId={cultivo.id}
            propriedadeId={cultivo.propriedadeId}
            nomeCultura={cultivo.nomeCultura}
          />
        )}
        {tab === "ia" && (
          <CultivoTabPlaceholder
            title="Inteligência Artificial"
            message="Resumo de saúde, risco e recomendações explicáveis (Etapa 7)."
          />
        )}
        {tab === "custos" && (
          <CultivoTabPlaceholder
            title="Custos e indicadores"
            message="KPIs e lançamentos financeiros do cultivo (Etapa 9)."
          />
        )}
        {tab === "historico" && <TimelineCultivo events={timeline} />}
        {tab === "arquivos" && (
          <CultivoTabPlaceholder
            title="Arquivos"
            message="Fotos e documentos vinculados ao cultivo aparecerão aqui."
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
