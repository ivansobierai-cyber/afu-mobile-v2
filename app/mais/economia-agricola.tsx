/**
 * Etapa 40 — Economia Agrícola e previsão de produção
 */
import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "culturas", label: "Culturas" },
  { id: "simulador", label: "Simulador" },
];

export default function EconomiaAgricolaScreen() {
  const [tab, setTab] = useState("resumo");
  const [area, setArea] = useState("10");
  const { data: lista = [], isLoading } = trpc.bancoAgronomico.economia.list.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();
  const selectedId = lista[0]?.culturaCatalogoId;
  const areaHa = Math.max(0.1, Number(area) || 10);

  const { data: sim } = trpc.bancoAgronomico.economia.simular.useQuery(
    { culturaCatalogoId: selectedId!, areaHa },
    { enabled: !!selectedId },
  );

  const criterios = useMemo(
    () => [
      { ok: (stats?.totalEconomia ?? 0) >= 17, label: "≥ 17 fichas economia_cultura" },
      { ok: lista.every((e) => Number(e.custoHaEstimado) > 0), label: "Custo/ha estimado por cultura" },
      { ok: !!sim && sim.lucroEstimado !== undefined, label: "Simulador receita × custo operacional" },
    ],
    [stats, lista, sim],
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">💰</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Economia Agrícola</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Etapa 40 · Custos · Produtividade · Simulador
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
        <AfuStackBanner note="Estimativas MVP (BRL) derivadas do catálogo. Não substituem consultoria financeira." />

        {isLoading ? (
          <ActivityIndicator color="#1B5E20" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Fichas", v: stats?.totalEconomia ?? 0, cor: "#1B5E20" },
                { k: "Culturas", v: stats?.totalCulturas ?? 0, cor: "#1565C0" },
                { k: "Margem ex.", v: sim ? `${sim.margemPercent}%` : "—", cor: "#E65100" },
              ].map((c) => (
                <View key={c.k} style={{ backgroundColor: c.cor + "15", width: "30%", borderRadius: 12, padding: 10 }}>
                  <Text style={{ color: c.cor, fontSize: 16, fontWeight: "700" }}>{c.v}</Text>
                  <Text style={{ color: c.cor, fontSize: 10 }}>{c.k}</Text>
                </View>
              ))}
            </View>
            {criterios.map((c) => (
              <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                {c.ok ? "✓" : "○"} {c.label}
              </Text>
            ))}
          </View>
        ) : tab === "culturas" ? (
          <View className="pb-8">
            {lista.map((e) => (
              <View
                key={e.id}
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
              >
                <Text className="text-sm font-bold text-foreground">{e.nomePopular}</Text>
                <Text className="text-xs text-muted mt-1">
                  Prod.: {e.produtividadeMin}–{e.produtividadeMax} {e.unidadeProdutividade} (méd {e.produtividadeMed})
                </Text>
                <Text className="text-xs text-foreground mt-1">
                  Custo/ha: R$ {Number(e.custoHaEstimado).toLocaleString("pt-BR")} · Preço und: R${" "}
                  {Number(e.precoUnidade).toLocaleString("pt-BR")}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="pb-8">
            <Text className="text-sm font-bold mb-2">
              Simulador — {lista[0]?.nomePopular ?? "—"}
            </Text>
            <Text className="text-xs text-muted mb-1">Área (ha)</Text>
            <TextInput
              value={area}
              onChangeText={setArea}
              keyboardType="decimal-pad"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 10,
                marginBottom: 12,
                fontSize: 14,
              }}
            />
            {sim ? (
              <View style={{ backgroundColor: "#E8F5E9", borderRadius: 12, padding: 14 }}>
                <Text className="text-xs text-muted">
                  Produtividade: {sim.produtividadeUsada} {sim.unidade}
                </Text>
                <Text className="text-sm font-bold text-foreground mt-2">
                  Receita: R$ {sim.receitaTotal.toLocaleString("pt-BR")}
                </Text>
                <Text className="text-sm text-foreground">
                  Custo: R$ {sim.custoTotal.toLocaleString("pt-BR")}
                </Text>
                <Text style={{ color: sim.lucroEstimado >= 0 ? "#1B5E20" : "#C62828" }} className="text-base font-bold mt-2">
                  Lucro: R$ {sim.lucroEstimado.toLocaleString("pt-BR")} ({sim.margemPercent}%)
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-muted">Sem dados — rode npm run seed:lab-economia</Text>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
