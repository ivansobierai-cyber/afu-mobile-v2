import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenState } from "@/components/screen-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRunCoreMutation } from "@/hooks/use-run-core-mutation";
import {
  buildPropertyReturnHref,
  parsePropertyReturnParams,
} from "@/lib/propriedades/registrar-flow";
import { trpc } from "@/lib/trpc";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";

const STATUS_COLORS: Record<string, string> = {
  em_andamento: "#38A169",
  planejado: "#D97706",
  colhido: "#6B7C6E",
  perdido: "#E53E3E",
};

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em andamento",
  planejado: "Planejado",
  colhido: "Colhido",
  perdido: "Perdido",
};

const FASES = [
  "planejamento",
  "plantio",
  "germinacao",
  "muda",
  "crescimento_vegetativo",
  "floracao",
  "frutificacao",
  "maturacao",
  "colheita",
];

export default function CultivoDetailScreen() {
  const { id, propriedadeId, returnTab, safraId } = useLocalSearchParams<{
    id: string;
    propriedadeId?: string;
    returnTab?: string;
    safraId?: string;
  }>();
  const cultivoId = parseInt(id ?? "0", 10);
  const colors = useColors();
  const router = useRouter();
  const { runMutation } = useRunCoreMutation();
  const [advancingFase, setAdvancingFase] = useState(false);

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

  const { cacheInput, activeOrganizationId, tenantReady } = useTenantQueryScope();
  const { data: cultivos = [], isLoading, isError, refetch } = trpc.coreData.cultivos.list.useQuery(
    cacheInput,
    {
      enabled: tenantReady,
    },
  );
  const cultivo = cultivos.find((c) => c.id === cultivoId) ?? null;

  const advanceFase = async () => {
    if (!cultivo) return;
    const faseAtual = cultivo.faseAtual ?? "plantio";
    const currentIdx = FASES.indexOf(faseAtual);
    const nextFase = currentIdx < FASES.length - 1 ? FASES[currentIdx + 1] : faseAtual;
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

  const faseAtual = cultivo.faseAtual ?? "plantio";
  const currentFaseIdx = FASES.indexOf(faseAtual);
  const progress = FASES.length > 0 ? (currentFaseIdx + 1) / FASES.length : 0;

  const styles = StyleSheet.create({
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
  });

  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("pt-BR");
  };

  return (
    <ScreenContainer>
      <View
        style={{
          backgroundColor: STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.primary,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={goBack} accessibilityRole="button" accessibilityLabel="Voltar">
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>{cultivo.nomeCultura}</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{cultivo.variedade}</Text>
        </View>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.25)",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
            {STATUS_LABELS[cultivo.status ?? "em_andamento"]}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.infoCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              Fase Atual: {faseAtual.replace(/_/g, " ")}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {currentFaseIdx + 1}/{FASES.length}
            </Text>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: colors.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                backgroundColor: STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.primary,
                borderRadius: 4,
              }}
            />
          </View>
          {cultivo.status === "em_andamento" && currentFaseIdx < FASES.length - 1 && (
            <TouchableOpacity
              style={{
                marginTop: 12,
                backgroundColor: colors.primary + "15",
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.primary + "40",
              }}
              onPress={advanceFase}
              disabled={advancingFase}
            >
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                Avançar para: {FASES[currentFaseIdx + 1].replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Dados do Cultivo
          </Text>
          {[
            { label: "Data de Plantio", value: formatDate(cultivo.dataPlantio) },
            { label: "Colheita Prevista", value: formatDate(cultivo.previsaoColheita) },
            {
              label: "Área Plantada",
              value: cultivo.areaPlantada ? `${Number(cultivo.areaPlantada)} ha` : "—",
            },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.muted }}>{item.label}</Text>
              <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600" }}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Ciclo Fenológico
          </Text>
          {FASES.map((fase, idx) => (
            <View
              key={fase}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor:
                    idx < currentFaseIdx
                      ? colors.success
                      : idx === currentFaseIdx
                        ? colors.primary
                        : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {idx < currentFaseIdx ? (
                  <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>{idx + 1}</Text>
                )}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: idx <= currentFaseIdx ? colors.foreground : colors.muted,
                  fontWeight: idx === currentFaseIdx ? "700" : "400",
                }}
              >
                {fase.replace(/_/g, " ")}
              </Text>
              {idx === currentFaseIdx && (
                <View
                  style={{
                    backgroundColor: colors.primary + "20",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700" }}>Atual</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {cultivo.observacoes && (
          <View style={styles.infoCard}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Observações
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{cultivo.observacoes}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
