/**
 * Etapa 39 — Laboratório Digital
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "modulos", label: "Módulos" },
  { id: "fluxo", label: "Fluxo" },
];

const FLUXO = ["Coleta", "Cadastro", "Análise", "Interpretação", "Laudo", "Recomendação", "Histórico"];

export default function LaboratorioDigitalScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("resumo");
  const { data: modulos = [], isLoading } = trpc.bancoAgronomico.laboratorio.modulos.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    { ok: (stats?.totalLabModulos ?? 0) >= 7, label: "≥ 7 módulos em lab_modulos" },
    { ok: modulos.every((m) => (m.parametros?.length ?? 0) > 0), label: "Parâmetros por módulo" },
    { ok: (stats?.totalAnalises ?? 0) >= 0, label: `Análises fitotécnicas no sistema: ${stats?.totalAnalises ?? 0}` },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1A237E" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#283593" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🔬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Laboratório Digital</Text>
            <Text style={{ color: "#C5CAE9" }} className="text-xs">
              Etapa 39 · Módulos · Laudos · seed:lab-economia
            </Text>
          </View>
          <View style={{ backgroundColor: "#9FA8DA" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#1A237E" }} className="text-xs font-bold">
              {stats?.totalLabModulos ?? "—"} módulos
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
                <Text style={{ color: tab === t.id ? "#1A237E" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Módulos lab em MySQL. Resultados reais em analises_fitotecnicas (CRUD via secondaryData.analises)." />

        {isLoading ? (
          <ActivityIndicator color="#1A237E" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Módulos", v: stats?.totalLabModulos ?? 0, cor: "#1A237E" },
                { k: "Análises", v: stats?.totalAnalises ?? 0, cor: "#2E7D32" },
                { k: "Diagnósticos", v: stats?.totalDiagnosticos ?? 0, cor: "#E65100" },
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
              onPress={() => router.push("/mais/analises-lab" as never)}
              style={{ backgroundColor: "#1A237E", borderRadius: 12, padding: 14, marginTop: 12 }}
            >
              <Text className="text-white text-center text-sm font-bold">Abrir análises do produtor</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "modulos" ? (
          <View className="pb-8">
            {modulos.map((m) => (
              <View
                key={m.id}
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}
              >
                <View style={{ backgroundColor: (m.cor || "#1A237E") + "18" }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{m.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{m.nome}</Text>
                    <Text className="text-xs text-muted" numberOfLines={2}>
                      {m.descricao}
                    </Text>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-1 p-3">
                  {(m.parametros || []).map((p) => (
                    <View key={p} style={{ backgroundColor: "#ECEFF1", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text className="text-xs text-foreground">{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="pb-8">
            {FLUXO.map((step, i) => (
              <View key={step} className="flex-row items-center mb-2">
                <View style={{ backgroundColor: "#1A237E", width: 28, height: 28, borderRadius: 14 }} className="items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">{i + 1}</Text>
                </View>
                <Text className="text-sm text-foreground">{step}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
