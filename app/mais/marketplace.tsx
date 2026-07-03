import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ProdutoMarketplace, CategoriaProduto } from "@/shared/types";

const CATEGORIA_LABELS: Record<CategoriaProduto, string> = {
  insumo: "Insumo",
  servico: "Serviço",
  equipamento: "Equipamento",
  semente: "Semente",
  fertilizante: "Fertilizante",
  defensivo: "Defensivo",
  outro: "Outro",
};

const CATEGORIA_ICONS: Record<CategoriaProduto, string> = {
  insumo: "leaf.fill",
  servico: "person.fill",
  equipamento: "wrench.fill",
  semente: "circle.fill",
  fertilizante: "flask.fill",
  defensivo: "shield.fill",
  outro: "square.fill",
};

const CATEGORIA_COLORS: Record<CategoriaProduto, string> = {
  insumo: "#38A169",
  servico: "#3B82F6",
  equipamento: "#6B7280",
  semente: "#D97706",
  fertilizante: "#92400E",
  defensivo: "#E53E3E",
  outro: "#8B5CF6",
};

const DEMO_PRODUTOS: ProdutoMarketplace[] = [
  {
    id: "prod1",
    parceiroId: "p1",
    parceiroNome: "Laboratório Agroquímica Brasil",
    nome: "Análise de Solo Completa",
    descricao: "Análise completa de solo incluindo pH, macronutrientes, micronutrientes e matéria orgânica. Resultado em 5 dias úteis.",
    categoria: "servico",
    preco: 85.0,
    unidade: "por amostra",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod2",
    parceiroId: "p2",
    parceiroNome: "Cooperativa Agro Centro-Oeste",
    nome: "Semente de Soja TMG 7062 IPRO",
    descricao: "Semente de soja com tecnologia Intacta RR2 PRO, alta produtividade e resistência a insetos. Saco 40kg.",
    categoria: "semente",
    preco: 320.0,
    unidade: "saco 40kg",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod3",
    parceiroId: "p2",
    parceiroNome: "Cooperativa Agro Centro-Oeste",
    nome: "Fertilizante NPK 04-14-08",
    descricao: "Fertilizante granulado para plantio. Formulação balanceada para solos de cerrado. Saco 50kg.",
    categoria: "fertilizante",
    preco: 145.0,
    unidade: "saco 50kg",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod4",
    parceiroId: "p3",
    parceiroNome: "AgroTech Consultoria",
    nome: "Consultoria em MIP",
    descricao: "Visita técnica para diagnóstico e elaboração de plano de manejo integrado de pragas. Inclui laudo técnico.",
    categoria: "servico",
    preco: 450.0,
    unidade: "por visita",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod5",
    parceiroId: "p2",
    parceiroNome: "Cooperativa Agro Centro-Oeste",
    nome: "Fungicida Priori Xtra",
    descricao: "Fungicida sistêmico de amplo espectro para controle de doenças foliares em soja, milho e trigo.",
    categoria: "defensivo",
    preco: 89.0,
    unidade: "litro",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod6",
    parceiroId: "p1",
    parceiroNome: "Laboratório Agroquímica Brasil",
    nome: "Análise Foliar",
    descricao: "Diagnóstico nutricional via análise foliar. Identifica deficiências e excessos de nutrientes na planta.",
    categoria: "servico",
    preco: 110.0,
    unidade: "por amostra",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod7",
    parceiroId: "p2",
    parceiroNome: "Cooperativa Agro Centro-Oeste",
    nome: "Calcário Dolomítico PRNT 85%",
    descricao: "Calcário dolomítico de alta qualidade para correção de acidez do solo e fornecimento de Ca e Mg.",
    categoria: "insumo",
    preco: 62.0,
    unidade: "tonelada",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod8",
    parceiroId: "p3",
    parceiroNome: "AgroTech Consultoria",
    nome: "Laudo Fitossanitário",
    descricao: "Elaboração de laudo técnico fitossanitário para fins de certificação, exportação ou seguro agrícola.",
    categoria: "servico",
    preco: 280.0,
    unidade: "por laudo",
    disponivel: true,
    createdAt: new Date().toISOString(),
  },
];

export default function MarketplaceScreen() {
  const colors = useColors();
  const router = useRouter();
  const [produtos] = useState<ProdutoMarketplace[]>(DEMO_PRODUTOS);
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [detailProduto, setDetailProduto] = useState<ProdutoMarketplace | null>(null);

  const filtered = produtos.filter((p) => {
    const matchCategoria = filterCategoria === "todos" || p.categoria === filterCategoria;
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca && p.disponivel;
  });

  const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  });

  // Detail
  if (detailProduto) {
    const catColor = CATEGORIA_COLORS[detailProduto.categoria];
    return (
      <ScreenContainer>
        <View style={{ backgroundColor: catColor, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => setDetailProduto(null)}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }} numberOfLines={2}>{detailProduto.nome}</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{CATEGORIA_LABELS[detailProduto.categoria]}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Preço */}
          {detailProduto.preco && (
            <View style={{ backgroundColor: catColor + "15", borderRadius: 12, padding: 16, marginBottom: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Valor</Text>
              <Text style={{ fontSize: 32, fontWeight: "800", color: catColor }}>
                R$ {detailProduto.preco.toFixed(2).replace(".", ",")}
              </Text>
              {detailProduto.unidade && (
                <Text style={{ fontSize: 13, color: colors.muted }}>por {detailProduto.unidade}</Text>
              )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, marginBottom: 8, textTransform: "uppercase" }}>Descrição</Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{detailProduto.descricao}</Text>
          </View>

          <View style={styles.card}>
            {[
              { label: "Categoria", value: CATEGORIA_LABELS[detailProduto.categoria] },
              { label: "Parceiro", value: detailProduto.parceiroNome ?? "—" },
              { label: "Disponibilidade", value: detailProduto.disponivel ? "Disponível" : "Indisponível" },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>{item.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{item.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={{ backgroundColor: catColor, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
            onPress={() => Alert.alert("Interesse registrado!", `Seu interesse em "${detailProduto.nome}" foi registrado. O parceiro ${detailProduto.parceiroNome} entrará em contato.`)}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Tenho Interesse</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#D97706", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Marketplace</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
            Insumos, serviços e equipamentos
          </Text>
        </View>
      </View>

      {/* Busca */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 }}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            style={{ flex: 1, paddingVertical: 10, fontSize: 15, color: colors.foreground }}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar produtos e serviços..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca("")}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de categoria */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        {["todos", ...Object.keys(CATEGORIA_LABELS)].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, {
              backgroundColor: filterCategoria === cat ? (cat === "todos" ? "#D97706" : CATEGORIA_COLORS[cat as CategoriaProduto]) : colors.surface,
              borderColor: filterCategoria === cat ? (cat === "todos" ? "#D97706" : CATEGORIA_COLORS[cat as CategoriaProduto]) : colors.border,
            }]}
            onPress={() => setFilterCategoria(cat)}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: filterCategoria === cat ? "#FFF" : colors.foreground }}>
              {cat === "todos" ? "Todos" : CATEGORIA_LABELS[cat as CategoriaProduto]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const catColor = CATEGORIA_COLORS[item.categoria];
          return (
            <TouchableOpacity style={styles.card} onPress={() => setDetailProduto(item)}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <View style={{ backgroundColor: catColor + "20", borderRadius: 12, padding: 10 }}>
                  <IconSymbol name={CATEGORIA_ICONS[item.categoria] as any} size={22} color={catColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.nome}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }} numberOfLines={2}>{item.descricao}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{item.parceiroNome}</Text>
                    {item.preco && (
                      <Text style={{ fontSize: 15, fontWeight: "800", color: catColor }}>
                        R$ {item.preco.toFixed(2).replace(".", ",")}
                        {item.unidade ? <Text style={{ fontSize: 11, fontWeight: "400", color: colors.muted }}> /{item.unidade}</Text> : null}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: 32 }}>
            <IconSymbol name="magnifyingglass" size={40} color={colors.muted} />
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>Nenhum produto encontrado.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
