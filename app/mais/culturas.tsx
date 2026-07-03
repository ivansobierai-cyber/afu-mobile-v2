/**
 * culturas.tsx — Tela pública de Culturas (Cultivos Ativos)
 * Conectada ao banco real via tRPC: culturasPragas.culturas.list
 *
 * A tabela `culturas` registra cultivos ativos por propriedade.
 * Esta tela exibe o panorama geral de cultivos cadastrados no sistema.
 */
import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type StatusCultura = "planejado" | "em_andamento" | "colhido" | "perdido";

const STATUS_CONFIG: Record<StatusCultura, { label: string; color: string; bg: string; icon: string }> = {
  planejado:    { label: "Planejado",    color: "#2563EB", bg: "#DBEAFE", icon: "calendar" },
  em_andamento: { label: "Em andamento", color: "#16A34A", bg: "#D1FAE5", icon: "leaf.fill" },
  colhido:      { label: "Colhido",      color: "#D97706", bg: "#FEF3C7", icon: "checkmark.circle.fill" },
  perdido:      { label: "Perdido",      color: "#EF4444", bg: "#FEE2E2", icon: "xmark.circle.fill" },
};

export default function CulturasScreen() {
  const colors = useColors();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusCultura | undefined>();
  const [detalhe, setDetalhe] = useState<any | null>(null);

  const { data, isLoading, isError, refetch } = trpc.culturasPragas.culturas.list.useQuery({
    busca: busca.trim() || undefined,
    status: filtroStatus,
    limit: 200,
    offset: 0,
  });

  const culturas = data?.items ?? [];
  const total = data?.total ?? 0;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      flex: 1,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
  });

  // ── Tela de detalhe ────────────────────────────────────────────────────────
  if (detalhe) {
    const statusCfg = STATUS_CONFIG[detalhe.status as StatusCultura] ?? STATUS_CONFIG.em_andamento;

    const infoRows = [
      { label: "Variedade",          value: detalhe.variedade ?? "—" },
      { label: "Data de Plantio",    value: detalhe.dataPlantio ? new Date(detalhe.dataPlantio).toLocaleDateString("pt-BR") : "—" },
      { label: "Previsão de Colheita", value: detalhe.previsaoColheita ? new Date(detalhe.previsaoColheita).toLocaleDateString("pt-BR") : "—" },
      { label: "Área Plantada",      value: detalhe.areaPlantada ? `${detalhe.areaPlantada} ha` : "—" },
      { label: "Produção Estimada",  value: detalhe.producaoEstimada ? `${detalhe.producaoEstimada} ${detalhe.unidadeProducao ?? ""}`.trim() : "—" },
      { label: "Fase Atual",         value: detalhe.faseAtual ?? "—" },
      { label: "Status",             value: statusCfg.label },
    ];

    return (
      <ScreenContainer>
        <View style={{ backgroundColor: statusCfg.color, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => setDetalhe(null)}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>{detalhe.nomeCultura}</Text>
            {detalhe.variedade && (
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2, fontStyle: "italic" }}>{detalhe.variedade}</Text>
            )}
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{statusCfg.label}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {/* Cards de métricas */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[styles.infoCard, { flex: 1, alignItems: "center" }]}>
              <IconSymbol name="calendar" size={22} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginTop: 6, textAlign: "center" }}>
                {detalhe.dataPlantio ? new Date(detalhe.dataPlantio).toLocaleDateString("pt-BR") : "—"}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Plantio</Text>
            </View>
            <View style={[styles.infoCard, { flex: 1, alignItems: "center" }]}>
              <IconSymbol name="leaf.fill" size={22} color="#16A34A" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#16A34A", marginTop: 6, textAlign: "center" }}>
                {detalhe.areaPlantada ? `${detalhe.areaPlantada} ha` : "—"}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Área</Text>
            </View>
            <View style={[styles.infoCard, { flex: 1, alignItems: "center" }]}>
              <IconSymbol name="chart.bar.fill" size={22} color="#D97706" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#D97706", marginTop: 6, textAlign: "center" }}>
                {detalhe.producaoEstimada ? `${detalhe.producaoEstimada}` : "—"}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{detalhe.unidadeProducao ?? "Produção"}</Text>
            </View>
          </View>

          {/* Informações detalhadas */}
          <View style={styles.infoCard}>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 10 }}>Informações do Cultivo</Text>
            {infoRows.map((row) => (
              <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>{row.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, flex: 1, textAlign: "right" }}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Fase atual em destaque */}
          {detalhe.faseAtual && (
            <View style={[styles.infoCard, { backgroundColor: statusCfg.bg }]}>
              <Text style={{ fontSize: 12, color: statusCfg.color, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 }}>Fase Atual</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: statusCfg.color }}>🌱 {detalhe.faseAtual}</Text>
            </View>
          )}

          {/* Observações */}
          {detalhe.observacoes && (
            <View style={styles.infoCard}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>Observações</Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{detalhe.observacoes}</Text>
            </View>
          )}

          {/* Data de cadastro */}
          <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 4 }}>
            Cadastrado em {new Date(detalhe.createdAt).toLocaleDateString("pt-BR")}
          </Text>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Lista principal ────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Banco de Culturas</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
            {isLoading ? "Carregando..." : `${total} cultivo${total !== 1 ? "s" : ""} cadastrado${total !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      {/* Busca */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <TextInput
          style={styles.searchInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="🔍 Buscar por nome, variedade ou fase..."
          placeholderTextColor={colors.muted}
          returnKeyType="search"
        />
      </View>

      {/* Filtros por status */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: !filtroStatus ? colors.primary : colors.surface, borderColor: !filtroStatus ? colors.primary : colors.border }]}
          onPress={() => setFiltroStatus(undefined)}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: !filtroStatus ? "#FFF" : colors.foreground }}>Todos</Text>
        </TouchableOpacity>
        {(Object.keys(STATUS_CONFIG) as StatusCultura[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const ativo = filtroStatus === s;
          return (
            <TouchableOpacity key={s}
              style={[styles.chip, { backgroundColor: ativo ? cfg.color : colors.surface, borderColor: ativo ? cfg.color : colors.border }]}
              onPress={() => setFiltroStatus(ativo ? undefined : s)}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: ativo ? "#FFF" : colors.foreground }}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Estado de carregamento */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>Carregando culturas...</Text>
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center", fontSize: 14 }}>
            Não foi possível carregar as culturas.{"\n"}Verifique sua conexão.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={culturas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const statusCfg = STATUS_CONFIG[item.status as StatusCultura] ?? STATUS_CONFIG.em_andamento;
            return (
              <TouchableOpacity style={styles.card} onPress={() => setDetalhe(item)}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>{item.nomeCultura}</Text>
                    {item.variedade && (
                      <Text style={{ fontSize: 13, color: colors.muted, fontStyle: "italic", marginTop: 2 }}>{item.variedade}</Text>
                    )}
                  </View>
                  <View style={{ backgroundColor: statusCfg.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: statusCfg.color }}>{statusCfg.label}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                  {item.faseAtual && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <IconSymbol name="leaf.fill" size={13} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>{item.faseAtual}</Text>
                    </View>
                  )}
                  {item.areaPlantada && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <IconSymbol name="chart.bar.fill" size={13} color={colors.muted} />
                      <Text style={{ fontSize: 13, color: colors.muted }}>{item.areaPlantada} ha</Text>
                    </View>
                  )}
                  {item.dataPlantio && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <IconSymbol name="calendar" size={13} color={colors.muted} />
                      <Text style={{ fontSize: 13, color: colors.muted }}>
                        {new Date(item.dataPlantio).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 40 }}>🌱</Text>
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
                {busca || filtroStatus
                  ? "Nenhuma cultura encontrada com esses filtros."
                  : "Nenhum cultivo cadastrado ainda.\nOs produtores podem adicionar cultivos nas suas propriedades."}
              </Text>
              {(busca || filtroStatus) && (
                <TouchableOpacity onPress={() => { setBusca(""); setFiltroStatus(undefined); }}
                  style={{ marginTop: 12, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
