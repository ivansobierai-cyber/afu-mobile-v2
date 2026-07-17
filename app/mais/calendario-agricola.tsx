/**
 * Etapa 38 — Calendário agrícola inteligente (épocas de plantio do catálogo)
 */
import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "culturas", label: "Culturas" },
  { id: "atividades", label: "Atividades" },
];

const ATIVIDADES = [
  { a: "Plantio", emoji: "🌱", cor: "#2E7D32" },
  { a: "Irrigação", emoji: "💧", cor: "#0288D1" },
  { a: "Adubação", emoji: "🌿", cor: "#F57F17" },
  { a: "Pulverização", emoji: "💨", cor: "#880E4F" },
  { a: "Monitoramento", emoji: "🔎", cor: "#1565C0" },
  { a: "Colheita", emoji: "🧺", cor: "#E53935" },
];

export default function CalendarioAgricolaScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("resumo");
  const { data: plantio = [], isLoading } = trpc.bancoAgronomico.calendarioPlantio.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const comEpoca = useMemo(
    () => plantio.filter((c) => (c.epocasPlantio?.length ?? 0) > 0),
    [plantio],
  );

  const criterios = [
    { ok: (stats?.totalCulturasComEpoca ?? comEpoca.length) >= 17, label: "17 culturas com épocas de plantio" },
    { ok: plantio.every((c) => (c.cicloProdutivoMin ?? 0) > 0), label: "Ciclo produtivo preenchido" },
    { ok: true, label: "Eventos do produtor: core.calendario (app)" },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#00695C" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#00897B" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📅</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Calendário Agrícola</Text>
            <Text style={{ color: "#B2DFDB" }} className="text-xs">
              Etapa 38 · Épocas · Ciclos · Alertas de manejo
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
                <Text style={{ color: tab === t.id ? "#00695C" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Épocas de plantio vêm de culturas_catalogo. Agenda operacional do produtor usa calendario_cuidados (tabs Calendário)." />

        {isLoading ? (
          <ActivityIndicator color="#00695C" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Com época", v: comEpoca.length, cor: "#00695C" },
                { k: "Catálogo", v: plantio.length, cor: "#2E7D32" },
                { k: "Zonas clima", v: stats?.totalZonas ?? 0, cor: "#1565C0" },
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
            <TouchableOpacity
              onPress={() => router.push("/mais/calendario" as never)}
              style={{ backgroundColor: "#00695C", borderRadius: 12, padding: 14, marginTop: 12 }}
            >
              <Text className="text-white text-center text-sm font-bold">Abrir calendário do produtor</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "culturas" ? (
          <View className="pb-8">
            {plantio.map((c) => (
              <View
                key={c.id}
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm font-bold text-foreground">{c.nomePopular}</Text>
                  <Text className="text-xs text-muted">
                    {c.cicloProdutivoMin}–{c.cicloProdutivoMax}d
                  </Text>
                </View>
                {(c.epocasPlantio || []).map((e) => (
                  <Text key={e} className="text-xs text-muted">
                    • {e}
                  </Text>
                ))}
                {c.tipoSolo ? (
                  <Text className="text-xs text-foreground mt-2">Solo: {c.tipoSolo}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View className="pb-8">
            <Text className="text-xs text-muted mb-3">
              Tipos de atividade suportados em calendario_cuidados / app.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ATIVIDADES.map((a) => (
                <View
                  key={a.a}
                  style={{ backgroundColor: a.cor + "18", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, width: "47%" }}
                >
                  <Text className="text-base">{a.emoji}</Text>
                  <Text style={{ color: a.cor, fontWeight: "700", fontSize: 12 }}>{a.a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
