import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
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

export default function PropriedadeDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const propriedadeId = parseInt(idParam ?? "0", 10);
  const colors = useColors();
  const router = useRouter();

  const { data: propriedade, isLoading: loadingProp } = trpc.coreData.propriedades.get.useQuery(
    { id: propriedadeId },
    { enabled: propriedadeId > 0 },
  );
  const { data: cultivos = [], isLoading: loadingCult } = trpc.coreData.cultivos.listByPropriedade.useQuery(
    { propriedadeId },
    { enabled: propriedadeId > 0 },
  );
  const { data: terrenos = [], isLoading: loadingTer } = trpc.coreData.terrenos.listByPropriedade.useQuery(
    { propriedadeId },
    { enabled: propriedadeId > 0 },
  );

  const isLoading = loadingProp || loadingCult || loadingTer;
  const areaTotal = Number(propriedade?.tamanhoArea ?? 0);
  const areaUsada = terrenos.reduce((sum, t) => sum + Number(t.area ?? 0), 0);

  const styles = StyleSheet.create({
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 10 },
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
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!propriedade) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Propriedade não encontrada.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const localizacao = [propriedade.cidade, propriedade.estado].filter(Boolean).join(", ");

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>{propriedade.nome}</Text>
          {localizacao ? (
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{localizacao}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          {[
            { icon: "scalemass.fill", value: areaTotal > 0 ? `${areaTotal} ha` : "—", label: "Área Total", color: colors.primary },
            { icon: "map.fill", value: String(terrenos.length), label: "Talhões", color: "#8B5CF6" },
            { icon: "leaf.fill", value: String(cultivos.filter((c) => c.status === "em_andamento").length), label: "Cultivos Ativos", color: colors.success },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: stat.color + "15", borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: stat.color + "30" }}>
              <IconSymbol name={stat.icon as any} size={20} color={stat.color} />
              <Text style={{ fontSize: 20, fontWeight: "700", color: stat.color, marginTop: 4 }}>{stat.value}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Informações da Propriedade</Text>
          {[
            { label: "Tipo de Produção", value: propriedade.tipoProducao?.replace(/_/g, " ") ?? "—" },
            { label: "Tipo de Solo", value: propriedade.tipoSolo ?? "—" },
            { label: "Irrigação", value: propriedade.sistemaIrrigacao ?? "—" },
            { label: "Cadastrado em", value: propriedade.createdAt ? new Date(propriedade.createdAt).toLocaleDateString("pt-BR") : "—" },
          ].map((item, idx, arr) => (
            <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>{item.label}</Text>
              <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600", textTransform: "capitalize" }}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Terrenos / Talhões ({terrenos.length})</Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 4 }}
            onPress={() => router.push(`/propriedades/terrenos?propriedadeId=${propriedade.id}` as any)}
          >
            <IconSymbol name="map.fill" size={14} color="#FFF" />
            <Text style={{ fontSize: 13, color: "#FFF", fontWeight: "600" }}>Gerenciar</Text>
          </TouchableOpacity>
        </View>

        {terrenos.length === 0 ? (
          <TouchableOpacity
            style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", marginBottom: 16 }}
            onPress={() => router.push(`/propriedades/terrenos?propriedadeId=${propriedade.id}` as any)}
          >
            <IconSymbol name="plus" size={24} color={colors.muted} />
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>Cadastrar terrenos/talhões</Text>
          </TouchableOpacity>
        ) : (
          <>
            {terrenos.slice(0, 3).map((t) => (
              <View key={t.id} style={styles.terrenoCard}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#8B5CF620", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="map.fill" size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{t.nome}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {t.area} ha{t.tipoSolo ? ` · Solo ${t.tipoSolo}` : ""}
                  </Text>
                </View>
              </View>
            ))}
            {areaTotal > 0 && (
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Área mapeada</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{areaUsada.toFixed(1)} / {areaTotal} ha</Text>
                </View>
                <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${Math.min(100, (areaUsada / areaTotal) * 100)}%`, backgroundColor: colors.success, borderRadius: 4 }} />
                </View>
              </View>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Cultivos ({cultivos.length})</Text>
        {cultivos.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 20 }}>Nenhum cultivo nesta propriedade.</Text>
        ) : (
          cultivos.map((cultivo) => (
            <TouchableOpacity key={cultivo.id} style={styles.cultivoCard} onPress={() => router.push(`/cultivos/${cultivo.id}` as any)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{cultivo.nomeCultura}</Text>
                  {cultivo.variedade && <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{cultivo.variedade}</Text>}
                </View>
                <View style={{ backgroundColor: (STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.muted) + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: STATUS_COLORS[cultivo.status ?? "em_andamento"] ?? colors.muted }}>
                    {STATUS_LABELS[cultivo.status ?? "em_andamento"] ?? cultivo.status}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                {cultivo.areaPlantada && <Text style={{ fontSize: 13, color: colors.tint, fontWeight: "600" }}>{cultivo.areaPlantada} ha</Text>}
                {cultivo.dataPlantio && (
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    Plantio: {new Date(cultivo.dataPlantio).toLocaleDateString("pt-BR")}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
