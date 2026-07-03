/**
 * pragas-doencas.tsx — Tela pública de Pragas e Doenças
 * Conectada ao banco real via tRPC: culturasPragas.pragas.list
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

type TipoPraga = "praga" | "doenca" | "deficiencia";
type NivelRisco = "baixo" | "medio" | "alto" | "critico";

const TIPO_CONFIG: Record<TipoPraga, { label: string; color: string; bg: string; icon: string }> = {
  praga:       { label: "Praga",       color: "#EF4444", bg: "#FEE2E2", icon: "ant.fill" },
  doenca:      { label: "Doença",      color: "#8B5CF6", bg: "#EDE9FE", icon: "cross.circle.fill" },
  deficiencia: { label: "Deficiência", color: "#D97706", bg: "#FEF3C7", icon: "exclamationmark.triangle.fill" },
};

const RISCO_CONFIG: Record<NivelRisco, { label: string; color: string; bg: string }> = {
  baixo:   { label: "Baixo",   color: "#16A34A", bg: "#D1FAE5" },
  medio:   { label: "Médio",   color: "#D97706", bg: "#FEF3C7" },
  alto:    { label: "Alto",    color: "#EF4444", bg: "#FEE2E2" },
  critico: { label: "Crítico", color: "#9B1C1C", bg: "#FEE2E2" },
};

export default function PragasDoencasScreen() {
  const colors = useColors();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoPraga | undefined>();
  const [filtroRisco, setFiltroRisco] = useState<NivelRisco | undefined>();
  const [detalhe, setDetalhe] = useState<any | null>(null);

  const { data, isLoading, isError, refetch } = trpc.culturasPragas.pragas.list.useQuery({
    busca: busca.trim() || undefined,
    tipo: filtroTipo,
    nivelRisco: filtroRisco,
    limit: 200,
    offset: 0,
  });

  const itens = data?.items ?? [];
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
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
  });

  // ── Tela de detalhe ────────────────────────────────────────────────────────
  if (detalhe) {
    const tipoCfg = TIPO_CONFIG[detalhe.tipo as TipoPraga] ?? TIPO_CONFIG.praga;
    const riscoCfg = RISCO_CONFIG[detalhe.nivelRisco as NivelRisco] ?? RISCO_CONFIG.medio;

    const secoes = [
      { titulo: "Sintomas",    conteudo: detalhe.sintomas,   emoji: "🔍" },
      { titulo: "Causas",      conteudo: detalhe.causas,     emoji: "🧬" },
      { titulo: "Tratamento",  conteudo: detalhe.tratamento, emoji: "💊" },
      { titulo: "Prevenção",   conteudo: detalhe.prevencao,  emoji: "🛡️" },
    ].filter((s) => s.conteudo);

    return (
      <ScreenContainer>
        <View style={{ backgroundColor: tipoCfg.color, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => setDetalhe(null)}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }} numberOfLines={2}>{detalhe.nome}</Text>
            {detalhe.nomecientifico && (
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 2 }}>{detalhe.nomecientifico}</Text>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {/* Badges */}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View style={{ backgroundColor: tipoCfg.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: tipoCfg.color, fontWeight: "700", fontSize: 12 }}>{tipoCfg.label}</Text>
            </View>
            <View style={{ backgroundColor: riscoCfg.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: riscoCfg.color, fontWeight: "700", fontSize: 12 }}>⚠️ Risco {riscoCfg.label}</Text>
            </View>
            {detalhe.culturaAfetada && (
              <View style={{ backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: "#166534", fontWeight: "700", fontSize: 12 }}>🌿 {detalhe.culturaAfetada}</Text>
              </View>
            )}
          </View>

          {/* Seções de conteúdo */}
          {secoes.length > 0 ? secoes.map((secao) => (
            <View key={secao.titulo} style={styles.infoCard}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", marginBottom: 8 }}>
                {secao.emoji} {secao.titulo}
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{secao.conteudo}</Text>
            </View>
          )) : (
            <View style={[styles.infoCard, { alignItems: "center", padding: 24 }]}>
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center", fontSize: 13 }}>
                Detalhes técnicos ainda não foram cadastrados para este item.
              </Text>
            </View>
          )}

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
      <View style={{ backgroundColor: "#7C3AED", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Pragas e Doenças</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
            {isLoading ? "Carregando..." : `${total} registro${total !== 1 ? "s" : ""} no banco fitossanitário`}
          </Text>
        </View>
      </View>

      {/* Busca */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="🔍 Buscar por nome, cultura ou sintomas..."
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface, borderRadius: 10, padding: 12,
            color: colors.foreground, borderWidth: 1, borderColor: colors.border, fontSize: 14,
          }}
          returnKeyType="search"
        />
      </View>

      {/* Filtros por tipo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: !filtroTipo ? "#7C3AED" : colors.surface, borderColor: !filtroTipo ? "#7C3AED" : colors.border }]}
          onPress={() => setFiltroTipo(undefined)}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: !filtroTipo ? "#FFF" : colors.foreground }}>Todos</Text>
        </TouchableOpacity>
        {(Object.keys(TIPO_CONFIG) as TipoPraga[]).map((t) => {
          const cfg = TIPO_CONFIG[t];
          const ativo = filtroTipo === t;
          return (
            <TouchableOpacity key={t}
              style={[styles.chip, { backgroundColor: ativo ? cfg.color : colors.surface, borderColor: ativo ? cfg.color : colors.border }]}
              onPress={() => setFiltroTipo(ativo ? undefined : t)}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: ativo ? "#FFF" : colors.foreground }}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Separador visual */}
        <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 8, height: 28, alignSelf: "center" }} />
        {/* Filtros por risco */}
        {(Object.keys(RISCO_CONFIG) as NivelRisco[]).map((r) => {
          const cfg = RISCO_CONFIG[r];
          const ativo = filtroRisco === r;
          return (
            <TouchableOpacity key={r}
              style={[styles.chip, { backgroundColor: ativo ? cfg.color : colors.surface, borderColor: ativo ? cfg.color : colors.border }]}
              onPress={() => setFiltroRisco(ativo ? undefined : r)}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: ativo ? "#FFF" : colors.foreground }}>⚠️ {cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Estado de carregamento */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>Carregando banco fitossanitário...</Text>
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center", fontSize: 14 }}>
            Não foi possível carregar os dados.{"\n"}Verifique sua conexão.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: "#7C3AED", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const tipoCfg = TIPO_CONFIG[item.tipo as TipoPraga] ?? TIPO_CONFIG.praga;
            const riscoCfg = RISCO_CONFIG[item.nivelRisco as NivelRisco] ?? RISCO_CONFIG.medio;
            return (
              <TouchableOpacity style={styles.card} onPress={() => setDetalhe(item)}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                  <View style={{ backgroundColor: tipoCfg.bg, borderRadius: 12, padding: 10 }}>
                    <IconSymbol name={tipoCfg.icon as any} size={22} color={tipoCfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <View style={{ backgroundColor: tipoCfg.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: tipoCfg.color }}>{tipoCfg.label}</Text>
                      </View>
                      <View style={{ backgroundColor: riscoCfg.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: riscoCfg.color }}>⚠️ {riscoCfg.label}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.nome}</Text>
                    {item.nomecientifico && (
                      <Text style={{ fontSize: 12, color: colors.muted, fontStyle: "italic", marginTop: 2 }}>{item.nomecientifico}</Text>
                    )}
                    {item.culturaAfetada && (
                      <Text style={{ fontSize: 12, color: "#16A34A", marginTop: 4, fontWeight: "600" }}>🌿 {item.culturaAfetada}</Text>
                    )}
                    {item.sintomas && (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }} numberOfLines={2}>{item.sintomas}</Text>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 40 }}>🔬</Text>
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
                {busca || filtroTipo || filtroRisco
                  ? "Nenhum registro encontrado com esses filtros."
                  : "Banco fitossanitário vazio.\nO administrador pode cadastrar pragas e doenças no Painel Admin."}
              </Text>
              {(busca || filtroTipo || filtroRisco) && (
                <TouchableOpacity onPress={() => { setBusca(""); setFiltroTipo(undefined); setFiltroRisco(undefined); }}
                  style={{ marginTop: 12, backgroundColor: "#7C3AED", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
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
