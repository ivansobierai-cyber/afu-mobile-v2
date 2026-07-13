/**
 * catalogo-culturas.tsx — Catálogo Botânico AFU
 * Banco de conhecimento agronômico com dados fixos:
 *   - Família botânica, nome científico, categoria
 *   - Ciclo produtivo (dias), fases fenológicas
 *   - Exigências climáticas (temperatura, precipitação, luz)
 *   - Tipo de solo, épocas de plantio, produtividade média
 * Fonte: lib/mock-data.ts (CULTURAS)
 */
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CULTURAS } from "@/lib/mock-data";
import type { Cultura } from "@/shared/types";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { ActivityIndicator } from "react-native";

type CatalogoItem = Cultura & { dbId?: number };

function mapDbToCultura(row: {
  id: number;
  slug: string;
  nomePopular: string;
  nomeCientifico: string | null;
  familiaBotanica: string | null;
  categoria: string | null;
  descricao: string | null;
  cicloProdutivoMin: number | null;
  cicloProdutivoMax: number | null;
  fasesFenologicas: string[];
  tipoSolo: string | null;
  epocasPlantio: string[];
  produtividadeMedia: string | null;
}): CatalogoItem {
  return {
    id: row.slug,
    dbId: row.id,
    nomePopular: row.nomePopular,
    nomeCientifico: row.nomeCientifico ?? "",
    familiaBotanica: row.familiaBotanica ?? "",
    categoria: (row.categoria ?? "outros") as Cultura["categoria"],
    descricao: row.descricao ?? "",
    cicloProdutivoMin: row.cicloProdutivoMin ?? 0,
    cicloProdutivoMax: row.cicloProdutivoMax ?? 0,
    fasesFenologicas: row.fasesFenologicas ?? [],
    tipoSolo: row.tipoSolo ?? "",
    epocasPlantio: row.epocasPlantio ?? [],
    produtividadeMedia: row.produtividadeMedia ?? "",
    temperaturaMin: undefined,
    temperaturaMax: undefined,
  };
}

// ─── Mapeamento de categorias ─────────────────────────────────────────────────
const CATEGORIA_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  graos:       { label: "Grãos",       color: "#92400E", bg: "#FEF3C7", emoji: "🌾" },
  oleaginosas: { label: "Oleaginosas", color: "#166534", bg: "#D1FAE5", emoji: "🫘" },
  hortalicas:  { label: "Hortaliças",  color: "#065F46", bg: "#ECFDF5", emoji: "🥬" },
  frutas:      { label: "Frutas",      color: "#9D174D", bg: "#FCE7F3", emoji: "🍎" },
  fibrosas:    { label: "Fibrosas",    color: "#6B21A8", bg: "#F3E8FF", emoji: "🧵" },
  forrageiras: { label: "Forrageiras", color: "#1D4ED8", bg: "#DBEAFE", emoji: "🌿" },
  outros:      { label: "Outros",      color: "#374151", bg: "#F3F4F6", emoji: "🌱" },
};

const TODAS_CATEGORIAS = ["todas", ...Object.keys(CATEGORIA_CONFIG)] as const;

// ─── Card de cultura na lista ─────────────────────────────────────────────────
function CulturaCard({ cultura, onPress }: { cultura: Cultura; onPress: () => void }) {
  const cat = CATEGORIA_CONFIG[cultura.categoria] ?? CATEGORIA_CONFIG.outros;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Emoji + nome */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ backgroundColor: cat.bg, borderRadius: 14, width: 52, height: 52, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 26 }}>{cat.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{cultura.nomePopular}</Text>
          <Text style={styles.cardSci}>{cultura.nomeCientifico}</Text>
          <Text style={styles.cardFamily}>{cultura.familiaBotanica}</Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
      </View>

      {/* Badges */}
      <View style={{ flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <View style={{ backgroundColor: cat.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, color: cat.color, fontWeight: "700" }}>{cat.label}</Text>
        </View>
        <View style={{ backgroundColor: "#F0FDF4", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, color: "#166534", fontWeight: "600" }}>
            {cultura.cicloProdutivoMin}–{cultura.cicloProdutivoMax} dias
          </Text>
        </View>
        {cultura.temperaturaMin !== undefined && (
          <View style={{ backgroundColor: "#FFF7ED", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, color: "#C2410C", fontWeight: "600" }}>
              {cultura.temperaturaMin}–{cultura.temperaturaMax}°C
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Linha de detalhe ─────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, color = "#374151" }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <IconSymbol name={icon as any} size={14} color={color} />
        <Text style={{ fontSize: 11, fontWeight: "700", color, textTransform: "uppercase" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 14, color: "#111827", lineHeight: 20 }}>{value}</Text>
    </View>
  );
}

// ─── Modal de detalhe ─────────────────────────────────────────────────────────
function CulturaDetailModal({ cultura, onClose }: { cultura: Cultura; onClose: () => void }) {
  const cat = CATEGORIA_CONFIG[cultura.categoria] ?? CATEGORIA_CONFIG.outros;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <View style={{ backgroundColor: cat.color, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 8 }}>
              <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: "#FFFFFF", fontWeight: "700" }}>{cat.label}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 32, marginBottom: 4 }}>{cat.emoji}</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#FFFFFF" }}>{cultura.nomePopular}</Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 2 }}>
            {cultura.nomeCientifico}
          </Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            Família: {cultura.familiaBotanica}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={{ fontSize: 14, color: "#374151", lineHeight: 22 }}>{cultura.descricao}</Text>
          </View>

          {/* Ciclo e Fenologia */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ciclo Produtivo e Fenologia</Text>
            <View style={{ backgroundColor: "#F0FDF4", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: "#166534", fontWeight: "700", marginBottom: 4 }}>
                Duração: {cultura.cicloProdutivoMin} a {cultura.cicloProdutivoMax} dias
              </Text>
              <Text style={{ fontSize: 12, color: "#4B5563" }}>
                {cultura.cicloProdutivoMax <= 120 ? "Ciclo curto" :
                 cultura.cicloProdutivoMax <= 200 ? "Ciclo médio" :
                 cultura.cicloProdutivoMax <= 400 ? "Ciclo longo" : "Cultura perene"}
              </Text>
            </View>

            {/* Fases fenológicas como timeline */}
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>
              Fases Fenológicas
            </Text>
            <View style={{ gap: 6 }}>
              {cultura.fasesFenologicas.map((fase, idx) => (
                <View key={fase} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: cat.bg, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: cat.color }}>{idx + 1}</Text>
                  </View>
                  {idx < cultura.fasesFenologicas.length - 1 && (
                    <View style={{ position: "absolute", left: 11, top: 24, width: 2, height: 10, backgroundColor: cat.color + "40" }} />
                  )}
                  <Text style={{ fontSize: 13, color: "#111827", flex: 1 }}>{fase}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Exigências Climáticas */}
          {(cultura.temperaturaMin !== undefined || cultura.precipitacaoMin !== undefined || cultura.necessidadeLuz) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exigências Climáticas</Text>
              {cultura.temperaturaMin !== undefined && (
                <DetailRow
                  icon="thermometer"
                  label="Temperatura"
                  value={`${cultura.temperaturaMin}°C a ${cultura.temperaturaMax}°C`}
                  color="#C2410C"
                />
              )}
              {cultura.precipitacaoMin !== undefined && (
                <DetailRow
                  icon="drop.fill"
                  label="Precipitação"
                  value={`${cultura.precipitacaoMin} a ${cultura.precipitacaoMax} mm/ano`}
                  color="#1D4ED8"
                />
              )}
              {cultura.necessidadeLuz && (
                <DetailRow
                  icon="sun.max.fill"
                  label="Luminosidade"
                  value={cultura.necessidadeLuz}
                  color="#D97706"
                />
              )}
            </View>
          )}

          {/* Solo */}
          {cultura.tipoSolo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exigências de Solo</Text>
              <DetailRow icon="leaf.fill" label="Tipo de Solo" value={cultura.tipoSolo} color="#166534" />
            </View>
          )}

          {/* Épocas de Plantio */}
          {cultura.epocasPlantio && cultura.epocasPlantio.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Épocas de Plantio</Text>
              <View style={{ gap: 6 }}>
                {cultura.epocasPlantio.map((epoca) => (
                  <View key={epoca} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cat.color, marginTop: 7 }} />
                    <Text style={{ fontSize: 13, color: "#374151", flex: 1, lineHeight: 20 }}>{epoca}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Produtividade */}
          {cultura.produtividadeMedia && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Produtividade Média</Text>
              <View style={{ backgroundColor: "#FFF7ED", borderRadius: 10, padding: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#C2410C" }}>
                  📊 {cultura.produtividadeMedia}
                </Text>
              </View>
            </View>
          )}

          {/* Formas de multiplicação */}
          {cultura.formasMultiplicacao && cultura.formasMultiplicacao.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Formas de Multiplicação</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {cultura.formasMultiplicacao.map((forma) => (
                  <View key={forma} style={{ backgroundColor: cat.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 12, color: cat.color, fontWeight: "600" }}>{forma}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function CatalogoCulturasScreen() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [culturaSelecionada, setCulturaSelecionada] = useState<CatalogoItem | null>(null);

  const { data: catalogoDb = [], isLoading } = trpc.bancoAgronomico.catalogo.list.useQuery(
    { busca: busca || undefined },
    { retry: 1 },
  );

  const culturasBase: CatalogoItem[] = useMemo(() => {
    if (catalogoDb.length > 0) {
      return catalogoDb.map(mapDbToCultura);
    }
    return CULTURAS;
  }, [catalogoDb]);

  const culturasFiltradas = useMemo(() => {
    return culturasBase.filter((c) => {
      const matchBusca =
        !busca ||
        c.nomePopular.toLowerCase().includes(busca.toLowerCase()) ||
        c.nomeCientifico.toLowerCase().includes(busca.toLowerCase()) ||
        c.familiaBotanica.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoriaFiltro === "todas" || c.categoria === categoriaFiltro;
      return matchBusca && matchCategoria;
    });
  }, [culturasBase, busca, categoriaFiltro]);

  const categoriasCom = useMemo(() => {
    const counts: Record<string, number> = { todas: culturasBase.length };
    culturasBase.forEach((c) => {
      counts[c.categoria] = (counts[c.categoria] ?? 0) + 1;
    });
    return counts;
  }, [culturasBase]);

  const handlePress = (item: CatalogoItem) => {
    if (item.dbId != null) {
      router.push(`/mais/cultura-catalogo/${item.dbId}` as any);
      return;
    }
    setCulturaSelecionada(item);
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B4332", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#FFFFFF" }}>Catálogo Botânico</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
              {culturasBase.length} culturas · {catalogoDb.length > 0 ? "MySQL (Etapa 30)" : "fallback local"}
            </Text>
          </View>
        </View>

        {/* Busca */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 }}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por nome, família botânica..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: "#FFFFFF" }}
            returnKeyType="search"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca("")}>
              <IconSymbol name="xmark.circle.fill" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de categoria */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {TODAS_CATEGORIAS.map((cat) => {
          const isSelected = categoriaFiltro === cat;
          const config = cat === "todas" ? { label: "Todas", color: "#1B4332", bg: "#D1FAE5", emoji: "🌿" } : CATEGORIA_CONFIG[cat];
          const count = categoriasCom[cat] ?? 0;
          if (cat !== "todas" && count === 0) return null;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoriaFiltro(cat)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: isSelected ? config.color : "#F3F4F6",
                borderWidth: isSelected ? 0 : 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ fontSize: 14 }}>{config.emoji}</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : "#374151" }}>
                {config.label}
              </Text>
              <View style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "#E5E7EB", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: isSelected ? "#FFFFFF" : "#6B7280" }}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contador de resultados */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>
          {culturasFiltradas.length} cultura{culturasFiltradas.length !== 1 ? "s" : ""} encontrada{culturasFiltradas.length !== 1 ? "s" : ""}
          {busca ? ` para "${busca}"` : ""}
        </Text>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#1B4332" />
        </View>
      ) : (
      <FlatList
        data={culturasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CulturaCard cultura={item} onPress={() => handlePress(item)} />
        )}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🌾</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 6 }}>
              Nenhuma cultura encontrada
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>
              Tente ajustar os filtros ou a busca.
            </Text>
          </View>
        }
      />
      )}

      {/* Modal de detalhe (fallback mock) */}
      {culturaSelecionada && (
        <CulturaDetailModal
          cultura={culturaSelecionada}
          onClose={() => setCulturaSelecionada(null)}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardSci: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 1,
  },
  cardFamily: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
});
