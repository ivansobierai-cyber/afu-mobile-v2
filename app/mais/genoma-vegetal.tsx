/**
 * Etapa 37 — Genoma / genética G1–G5 (genetica_cultura)
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "geracoes", label: "G1–G5" },
  { id: "culturas", label: "Por cultura" },
];

const GERACOES_META = [
  { g: "G1", desc: "Matriz genética original", pureza: "100%", cor: "#1B5E20" },
  { g: "G2", desc: "Primeira multiplicação (elite)", pureza: "99%", cor: "#2E7D32" },
  { g: "G3", desc: "Multiplicação controlada", pureza: "96%", cor: "#388E3C" },
  { g: "G4", desc: "Produção ampliada regional", pureza: "93%", cor: "#43A047" },
  { g: "G5", desc: "Produção comercial inicial", pureza: "90%", cor: "#66BB6A" },
];

export default function GenomaVegetalScreen() {
  const [tab, setTab] = useState("resumo");
  const { data: catalogo = [], isLoading } = trpc.bancoAgronomico.catalogo.list.useQuery({});
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();
  const sampleId = catalogo[0]?.id;
  const { data: genetica = [] } = trpc.bancoAgronomico.catalogo.genetica.useQuery(
    { culturaCatalogoId: sampleId! },
    { enabled: !!sampleId },
  );

  const criterios = [
    { ok: (stats?.totalGenetica ?? 0) >= 85, label: "≥ 85 linhas genetica_cultura (17×5)" },
    { ok: genetica.length === 5, label: "Amostra com G1–G5 completos" },
    { ok: (stats?.totalCulturas ?? 0) >= 17, label: "17 culturas com genética seed" },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🧬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Genoma Vegetal</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Etapa 37 · G1–G5 · genetica_cultura · seed:agronomico
            </Text>
          </View>
          <View style={{ backgroundColor: "#69F0AE" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">
              {stats?.totalGenetica ?? "—"} linhas
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
        <AfuStackBanner note="MVP entrega cadeia G1–G5 por cultura. Melhoramento molecular avançado fica para AFU 2.0+." />

        {isLoading ? (
          <ActivityIndicator color="#1B5E20" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            {criterios.map((c) => (
              <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                {c.ok ? "✓" : "○"} {c.label}
              </Text>
            ))}
          </View>
        ) : tab === "geracoes" ? (
          <View className="pb-8">
            {GERACOES_META.map((g) => (
              <View
                key={g.g}
                style={{ borderLeftWidth: 4, borderLeftColor: g.cor, backgroundColor: g.cor + "12", borderRadius: 8, padding: 12, marginBottom: 8 }}
              >
                <Text style={{ color: g.cor, fontWeight: "700", fontSize: 13 }}>
                  {g.g} · pureza {g.pureza}
                </Text>
                <Text className="text-xs text-muted mt-1">{g.desc}</Text>
              </View>
            ))}
            {genetica.length > 0 ? (
              <View className="mt-2">
                <Text className="text-xs font-bold text-foreground mb-1">
                  Amostra DB — {catalogo[0]?.nomePopular}
                </Text>
                {genetica.map((row) => (
                  <Text key={row.id} className="text-xs text-muted mb-1">
                    {row.geracao}: {row.descricao}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View className="pb-8">
            {catalogo.map((c) => (
              <View
                key={c.id}
                className="flex-row justify-between py-2"
                style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}
              >
                <Text className="text-xs text-foreground">{c.nomePopular}</Text>
                <Text className="text-xs text-muted">G1–G5</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
