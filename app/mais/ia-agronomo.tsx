/**
 * Etapa 41 — IA Agrônomo Virtual (AFU AI CORE)
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "fontes", label: "Fontes" },
  { id: "consulta", label: "Consulta" },
];

export default function IaAgronomoScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("resumo");
  const { data: resumo, isLoading } = trpc.bancoAgronomico.ia.resumo.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();
  const { data: catalogo = [] } = trpc.bancoAgronomico.catalogo.list.useQuery({});
  const sampleId = catalogo[0]?.id;
  const { data: consulta } = trpc.bancoAgronomico.consulta.useQuery(
    { culturaCatalogoId: sampleId! },
    { enabled: !!sampleId },
  );

  const criterios = [
    { ok: (resumo?.fontes.length ?? 0) >= 8, label: "≥ 8 fontes do banco conectadas" },
    { ok: (stats?.totalCulturas ?? 0) >= 17, label: "Catálogo 17 culturas para consulta composta" },
    { ok: !!consulta?.resumo?.length, label: "Consulta agronômica composta operacional" },
    { ok: true, label: `Diagnósticos IA registrados: ${resumo?.totalDiagnosticos ?? 0}` },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#4A148C" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#6A1B9A" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🤖</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">IA Agrônomo Virtual</Text>
            <Text style={{ color: "#E1BEE7" }} className="text-xs">
              Etapa 41 · AFU AI CORE · Diagnóstico + Banco
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
                <Text style={{ color: tab === t.id ? "#4A148C" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Diagnóstico por foto: trpc.diagnostico. Consulta composta: bancoAgronomico.consulta (clima + nutrientes + pragas)." />

        {isLoading ? (
          <ActivityIndicator color="#4A148C" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Diagnósticos", v: resumo?.totalDiagnosticos ?? 0, cor: "#6A1B9A" },
                { k: "Confiança méd.", v: `${resumo?.mediaConfianca ?? 0}%`, cor: "#1565C0" },
                { k: "Fontes", v: resumo?.fontes.length ?? 0, cor: "#2E7D32" },
              ].map((c) => (
                <View key={c.k} style={{ backgroundColor: c.cor + "15", width: "30%", borderRadius: 12, padding: 10 }}>
                  <Text style={{ color: c.cor, fontSize: 16, fontWeight: "700" }}>{c.v}</Text>
                  <Text style={{ color: c.cor, fontSize: 10 }}>{c.k}</Text>
                </View>
              ))}
            </View>
            {Object.keys(resumo?.porGravidade || {}).length > 0 ? (
              <View style={{ backgroundColor: "#F3E5F5", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text className="text-xs font-bold text-foreground mb-1">Por gravidade</Text>
                {Object.entries(resumo!.porGravidade).map(([k, v]) => (
                  <Text key={k} className="text-xs text-muted">
                    {k}: {v}
                  </Text>
                ))}
              </View>
            ) : null}
            {criterios.map((c) => (
              <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                {c.ok ? "✓" : "○"} {c.label}
              </Text>
            ))}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/diagnostico" as never)}
              style={{ backgroundColor: "#6A1B9A", borderRadius: 12, padding: 14, marginTop: 12 }}
            >
              <Text className="text-white text-center text-sm font-bold">Abrir Diagnóstico IA</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "fontes" ? (
          <View className="pb-8">
            {(resumo?.fontes || []).map((f) => (
              <View
                key={f}
                className="flex-row items-center py-2"
                style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}
              >
                <View style={{ backgroundColor: "#6A1B9A", width: 8, height: 8, borderRadius: 4 }} className="mr-3" />
                <Text className="text-xs font-mono text-foreground">{f}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="pb-8">
            <Text className="text-sm font-bold mb-2">
              Consulta composta — {catalogo[0]?.nomePopular ?? "—"}
            </Text>
            {consulta ? (
              <View style={{ backgroundColor: "#F3E5F5", borderRadius: 12, padding: 12 }}>
                {(consulta.resumo || []).map((line) => (
                  <Text key={String(line)} className="text-xs text-foreground mb-1">
                    • {line}
                  </Text>
                ))}
                <Text className="text-xs text-muted mt-2">
                  Nutrientes: {consulta.nutrientes?.length ?? 0} · Pragas: {consulta.pragas?.length ?? 0} · Doenças:{" "}
                  {consulta.doencas?.length ?? 0}
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-muted">Sem consulta — seed catálogo primeiro</Text>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
