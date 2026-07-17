/**
 * Etapa 44 — Marketplace e Comercialização Agrícola
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "catalogo", label: "Catálogo" },
  { id: "categorias", label: "Categorias" },
];

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MarketplaceAgricolaScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("resumo");
  const { data: produtos = [], isLoading } = trpc.bancoAgronomico.marketplace.catalogo.useQuery();
  const { data: market } = trpc.bancoAgronomico.marketplace.stats.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    {
      ok: (market?.disponiveis ?? 0) >= 8,
      label: `≥ 8 produtos disponíveis (atual: ${market?.disponiveis ?? 0})`,
    },
    {
      ok: Object.keys(market?.categorias ?? {}).length >= 4,
      label: `Categorias ativas: ${Object.keys(market?.categorias ?? {}).length}`,
    },
    {
      ok: (market?.totalProdutos ?? 0) > 0,
      label: "Catálogo MySQL (produtos_marketplace)",
    },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🛒</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Marketplace</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Etapa 44 · Catálogo live · seed:marketplace
            </Text>
          </View>
          <View style={{ backgroundColor: "#A5D6A7" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">
              {stats?.produtosDisponiveis ?? market?.disponiveis ?? "—"} itens
            </Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{
                  backgroundColor: tab === t.id ? "#fff" : "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: tab === t.id ? "#1B5E20" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Leitura pública do catálogo. Pedidos/checkout via secondaryData.marketplace (área autenticada)." />

        {isLoading ? (
          <ActivityIndicator color="#1B5E20" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Produtos", v: market?.totalProdutos ?? 0, cor: "#1B5E20" },
                { k: "Disponíveis", v: market?.disponiveis ?? 0, cor: "#2E7D32" },
                { k: "Pedidos", v: market?.totalPedidos ?? 0, cor: "#1565C0" },
                { k: "Abertos", v: market?.pedidosAbertos ?? 0, cor: "#F57F17" },
              ].map((c) => (
                <View key={c.k} style={{ backgroundColor: c.cor + "15", width: "47%", borderRadius: 12, padding: 10 }}>
                  <Text style={{ color: c.cor, fontSize: 16, fontWeight: "700" }}>{c.v}</Text>
                  <Text style={{ color: c.cor, fontSize: 10 }}>{c.k}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: "#E8F5E9", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: "#1B5E20", fontSize: 11 }}>Valor de catálogo (estoque × preço, cap 100)</Text>
              <Text style={{ color: "#1B5E20", fontSize: 18, fontWeight: "700" }}>
                {formatBRL(market?.valorCatalogoEstimado ?? 0)}
              </Text>
            </View>
            {criterios.map((c) => (
              <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                {c.ok ? "✓" : "○"} {c.label}
              </Text>
            ))}
            <TouchableOpacity
              onPress={() => router.push("/mais/marketplace" as never)}
              style={{ backgroundColor: "#1B5E20", borderRadius: 12, padding: 14, marginTop: 12 }}
            >
              <Text className="text-white text-center text-sm font-bold">Abrir marketplace operacional</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "catalogo" ? (
          <View className="pb-8">
            {produtos.map((p) => (
              <View
                key={p.id}
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
              >
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-bold text-foreground flex-1 mr-2">{p.nomeProduto}</Text>
                  <Text style={{ color: "#1B5E20", fontSize: 13, fontWeight: "700" }}>
                    {formatBRL(Number(p.preco ?? 0))}
                  </Text>
                </View>
                <Text className="text-xs text-muted mb-1">
                  {p.categoria} · estoque {p.estoque ?? "—"} {p.unidade ?? ""}
                </Text>
                {p.descricao ? (
                  <Text className="text-xs text-muted" numberOfLines={2}>
                    {p.descricao}
                  </Text>
                ) : null}
              </View>
            ))}
            {produtos.length === 0 && (
              <Text className="text-sm text-muted">Catálogo vazio. Rode npm run seed:marketplace.</Text>
            )}
          </View>
        ) : (
          <View className="pb-8">
            {Object.entries(market?.categorias ?? {}).map(([cat, n]) => (
              <View
                key={cat}
                className="flex-row items-center justify-between mb-2"
                style={{ backgroundColor: "#E8F5E9", borderRadius: 12, padding: 12 }}
              >
                <Text style={{ color: "#1B5E20", fontSize: 13, fontWeight: "700" }}>{cat}</Text>
                <Text style={{ color: "#2E7D32", fontSize: 13, fontWeight: "700" }}>{n}</Text>
              </View>
            ))}
            {Object.keys(market?.categorias ?? {}).length === 0 && (
              <Text className="text-sm text-muted">Sem categorias ainda.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
