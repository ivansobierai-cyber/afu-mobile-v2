/**
 * Etapa 33 — Seed técnico: clima, irrigação, nutrientes
 */
import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "clima", label: "Clima" },
  { id: "irrigacao", label: "Irrigação" },
  { id: "nutrientes", label: "Nutrientes" },
];

export default function SeedTecnicoScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("resumo");
  const { data: stats, isLoading } = trpc.bancoAgronomico.stats.useQuery();
  const { data: catalogo = [] } = trpc.bancoAgronomico.catalogo.list.useQuery({});
  const firstId = catalogo[0]?.id;

  const { data: clima } = trpc.bancoAgronomico.catalogo.clima.useQuery(
    { culturaCatalogoId: firstId! },
    { enabled: !!firstId },
  );
  const { data: irrigacao } = trpc.bancoAgronomico.catalogo.irrigacao.useQuery(
    { culturaCatalogoId: firstId! },
    { enabled: !!firstId },
  );
  const { data: nutrientes = [] } = trpc.bancoAgronomico.catalogo.nutrientes.useQuery(
    { culturaCatalogoId: firstId! },
    { enabled: !!firstId },
  );

  const criterios = useMemo(
    () => [
      { ok: (stats?.totalClima ?? 0) >= 17, label: "17 registros clima_cultura" },
      { ok: (stats?.totalIrrigacao ?? 0) >= 17, label: "17 registros irrigacao_cultura" },
      { ok: (stats?.totalNutrientes ?? 0) >= 204, label: "≥ 204 nutrientes (12×17)" },
      { ok: nutrientes.length >= 12, label: "Amostra: 12 nutrientes na 1ª cultura" },
    ],
    [stats, nutrientes.length],
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#1565C0" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌡️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Seed Técnico</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Etapa 33 · Clima · Irrigação · Nutrientes
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
                <Text style={{ color: tab === t.id ? "#0D47A1" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Dados técnicos gerados por seed:agronomico a partir de TODAS_CULTURAS (temp, precipitação → clima/irrigação)." />

        {isLoading ? (
          <ActivityIndicator color="#0D47A1" />
        ) : (
          <>
            {tab === "resumo" && (
              <View className="pb-8">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {[
                    { k: "Clima", v: stats?.totalClima ?? 0, cor: "#1565C0" },
                    { k: "Irrigação", v: stats?.totalIrrigacao ?? 0, cor: "#00838F" },
                    { k: "Nutrientes", v: stats?.totalNutrientes ?? 0, cor: "#2E7D32" },
                    { k: "Culturas", v: stats?.totalCulturas ?? 0, cor: "#6A1B9A" },
                  ].map((c) => (
                    <View
                      key={c.k}
                      style={{ backgroundColor: c.cor + "15", width: "47%", borderRadius: 12, padding: 12 }}
                    >
                      <Text style={{ color: c.cor, fontSize: 18, fontWeight: "700" }}>{c.v}</Text>
                      <Text style={{ color: c.cor, fontSize: 11 }}>{c.k}</Text>
                    </View>
                  ))}
                </View>
                {criterios.map((c) => (
                  <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                    {c.ok ? "✓" : "○"} {c.label}
                  </Text>
                ))}
              </View>
            )}

            {tab === "clima" && (
              <View className="pb-8">
                <Text className="text-sm font-bold mb-2">
                  Amostra — {catalogo[0]?.nomePopular ?? "—"}
                </Text>
                {clima ? (
                  <View style={{ backgroundColor: "#E3F2FD", borderRadius: 12, padding: 12 }}>
                    <Text className="text-xs text-foreground">
                      Temp: {clima.temperaturaMin}–{clima.temperaturaMax}°C
                    </Text>
                    <Text className="text-xs text-foreground mt-1">
                      Precipitação: {clima.precipitacaoMin}–{clima.precipitacaoMax} mm
                    </Text>
                    <Text className="text-xs text-muted mt-2">{clima.necessidadeLuz}</Text>
                  </View>
                ) : (
                  <Text className="text-xs text-muted">Sem clima — rode npm run seed:agronomico</Text>
                )}
                <Text className="text-xs text-muted mt-3">
                  Total clima_cultura: {stats?.totalClima ?? 0}
                </Text>
              </View>
            )}

            {tab === "irrigacao" && (
              <View className="pb-8">
                <Text className="text-sm font-bold mb-2">
                  Amostra — {catalogo[0]?.nomePopular ?? "—"}
                </Text>
                {irrigacao ? (
                  <View style={{ backgroundColor: "#E0F7FA", borderRadius: 12, padding: 12 }}>
                    <Text className="text-xs font-bold text-foreground">{irrigacao.metodoRecomendado}</Text>
                    <Text className="text-xs text-muted mt-1">{irrigacao.laminaAgua}</Text>
                    <Text className="text-xs text-muted mt-1">{irrigacao.frequencia}</Text>
                  </View>
                ) : (
                  <Text className="text-xs text-muted">Sem irrigação cadastrada</Text>
                )}
                <Text className="text-xs text-muted mt-3">
                  Total irrigacao_cultura: {stats?.totalIrrigacao ?? 0}
                </Text>
              </View>
            )}

            {tab === "nutrientes" && (
              <View className="pb-8">
                <Text className="text-sm font-bold mb-2">
                  12 nutrientes — {catalogo[0]?.nomePopular ?? "amostra"}
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {nutrientes.map((n) => (
                    <View
                      key={n.id}
                      style={{
                        backgroundColor: n.tipo === "macro" ? "#E8F5E9" : "#FFF3E0",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#333" }}>
                        {n.nutriente} · {n.exigencia}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs text-muted">Total no banco: {stats?.totalNutrientes ?? 0}</Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          onPress={() => router.push(("/mais/cultura-catalogo/" + (firstId ?? 1)) as never)}
          style={{ backgroundColor: "#0D47A1", borderRadius: 12, padding: 14, marginBottom: 20 }}
        >
          <Text className="text-white text-center text-sm font-bold">Ver ficha técnica completa</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
