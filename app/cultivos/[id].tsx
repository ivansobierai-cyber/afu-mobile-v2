import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

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
  "planejamento", "plantio", "germinacao", "muda", "crescimento_vegetativo",
  "floracao", "frutificacao", "maturacao", "colheita",
];

export default function CultivoDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const cultivoId = parseInt(idParam ?? "0", 10);
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: cultivos = [], isLoading } = trpc.coreData.cultivos.list.useQuery();
  const cultivo = cultivos.find((c) => c.id === cultivoId);

  const updateMutation = trpc.coreData.cultivos.update.useMutation({
    onSuccess: () => utils.coreData.cultivos.list.invalidate(),
  });

  const advanceFase = async () => {
    if (!cultivo?.faseAtual) return;
    const currentIdx = FASES.indexOf(cultivo.faseAtual);
    if (currentIdx < 0 || currentIdx >= FASES.length - 1) return;
    const nextFase = FASES[currentIdx + 1];
    try {
      await updateMutation.mutateAsync({ id: cultivo.id, data: { faseAtual: nextFase } });
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível avançar a fase.");
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!cultivo) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Cultivo não encontrado.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const faseAtual = cultivo.faseAtual ?? "plantio";
  const currentFaseIdx = FASES.indexOf(faseAtual);
  const progress = currentFaseIdx >= 0 ? (currentFaseIdx + 1) / FASES.length : 0;

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

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>{cultivo.nomeCultura}</Text>
          {cultivo.variedade && <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{cultivo.variedade}</Text>}
        </View>
        <View style={{ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
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
            <Text style={{ fontSize: 13, color: colors.muted }}>{currentFaseIdx + 1}/{FASES.length}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${progress * 100}%`, backgroundColor: STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.primary, borderRadius: 4 }} />
          </View>
          {cultivo.status === "em_andamento" && currentFaseIdx >= 0 && currentFaseIdx < FASES.length - 1 && (
            <TouchableOpacity
              style={{ marginTop: 12, backgroundColor: colors.primary + "15", borderRadius: 8, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: colors.primary + "40" }}
              onPress={advanceFase}
              disabled={updateMutation.isPending}
            >
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                Avançar para: {FASES[currentFaseIdx + 1].replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Dados do Cultivo</Text>
          {[
            { label: "Data de Plantio", value: cultivo.dataPlantio ? new Date(cultivo.dataPlantio).toLocaleDateString("pt-BR") : "—" },
            { label: "Colheita Prevista", value: cultivo.previsaoColheita ? new Date(cultivo.previsaoColheita).toLocaleDateString("pt-BR") : "—" },
            { label: "Área Plantada", value: cultivo.areaPlantada ? `${cultivo.areaPlantada} ha` : "—" },
            { label: "Terreno ID", value: cultivo.terrenoId ? String(cultivo.terrenoId) : "—" },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>{item.label}</Text>
              <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600" }}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Ciclo Fenológico</Text>
          {FASES.map((fase, idx) => (
            <View key={fase} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: idx < currentFaseIdx ? colors.success : idx === currentFaseIdx ? colors.primary : colors.border, alignItems: "center", justifyContent: "center" }}>
                {idx < currentFaseIdx ? (
                  <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>{idx + 1}</Text>
                )}
              </View>
              <Text style={{ fontSize: 14, color: idx <= currentFaseIdx ? colors.foreground : colors.muted, fontWeight: idx === currentFaseIdx ? "700" : "400" }}>
                {fase.replace(/_/g, " ")}
              </Text>
              {idx === currentFaseIdx && (
                <View style={{ backgroundColor: colors.primary + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700" }}>Atual</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {cultivo.observacoes && (
          <View style={styles.infoCard}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Observações</Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{cultivo.observacoes}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
