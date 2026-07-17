/**
 * Etapa 42 — Satélite, Drones e Geointeligência
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "camadas", label: "Camadas" },
  { id: "campo", label: "Campo" },
];

const TIPO_COR: Record<string, string> = {
  ndvi: "#2E7D32",
  chuva: "#1565C0",
  solo: "#6D4C41",
  risco: "#C62828",
  clima: "#00838F",
  drone: "#4527A0",
  outro: "#455A64",
};

export default function GeointeligenciaScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("resumo");
  const { data: camadas = [], isLoading } = trpc.bancoAgronomico.geo.camadas.useQuery();
  const { data: geo } = trpc.bancoAgronomico.geo.stats.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    { ok: (geo?.totalCamadas ?? 0) >= 6, label: `≥ 6 camadas_geo (atual: ${geo?.totalCamadas ?? 0})` },
    {
      ok: (geo?.propriedadesComGps ?? 0) >= 1,
      label: `Propriedades com GPS: ${geo?.propriedadesComGps ?? 0}`,
    },
    {
      ok: (geo?.areaHaTotal ?? 0) > 0,
      label: `Área cadastrada: ${geo?.areaHaTotal ?? 0} ha`,
    },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1A237E" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#283593" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🛰️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU GEO</Text>
            <Text style={{ color: "#C5CAE9" }} className="text-xs">
              Etapa 42 · Camadas · GPS · seed:geo-iot
            </Text>
          </View>
          <View style={{ backgroundColor: "#9FA8DA" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#1A237E" }} className="text-xs font-bold">
              {stats?.totalCamadasGeo ?? geo?.totalCamadas ?? "—"} camadas
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
        <AfuStackBanner note="Camadas satélite/drone em MySQL (camadas_geo). GPS real em propriedades/terrenos." />

        {isLoading ? (
          <ActivityIndicator color="#1A237E" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Camadas", v: geo?.totalCamadas ?? 0, cor: "#1A237E" },
                { k: "GPS", v: geo?.propriedadesComGps ?? 0, cor: "#2E7D32" },
                { k: "Área ha", v: geo?.areaHaTotal ?? 0, cor: "#E65100" },
                { k: "Terrenos", v: geo?.totalTerrenos ?? 0, cor: "#6A1B9A" },
              ].map((c) => (
                <View key={c.k} style={{ backgroundColor: c.cor + "15", width: "47%", borderRadius: 12, padding: 10 }}>
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
              onPress={() => router.push("/mais/geoclima" as never)}
              style={{ backgroundColor: "#1A237E", borderRadius: 12, padding: 14, marginTop: 12 }}
            >
              <Text className="text-white text-center text-sm font-bold">Abrir GeoClima (zonas)</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "camadas" ? (
          <View className="pb-8">
            {camadas.map((c) => {
              const cor = TIPO_COR[c.tipo] ?? "#455A64";
              return (
                <View
                  key={c.id}
                  style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}
                >
                  <View style={{ backgroundColor: cor + "18" }} className="p-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-bold text-foreground flex-1">{c.nome}</Text>
                      <View style={{ backgroundColor: cor }} className="rounded-full px-2 py-0.5">
                        <Text className="text-white text-xs font-bold">{c.tipo}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted" numberOfLines={2}>
                      {c.descricao}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2 p-3">
                    <Text className="text-xs text-muted">Fonte: {c.fonte || "—"}</Text>
                    <Text className="text-xs text-muted">·</Text>
                    <Text className="text-xs text-muted">
                      {c.resolucaoM ? `${c.resolucaoM} m` : "—"} · {c.coberturaKm2 ?? "0"} km²
                    </Text>
                  </View>
                </View>
              );
            })}
            {camadas.length === 0 && (
              <Text className="text-sm text-muted">Nenhuma camada. Rode npm run seed:geo-iot.</Text>
            )}
          </View>
        ) : (
          <View className="pb-8">
            <Text className="text-sm font-bold text-foreground mb-2">Cadastro geográfico</Text>
            <Text className="text-xs text-muted mb-3">
              Propriedades com lat/lng alimentam o mapa operacional. NDVI e risco usam as camadas
              catalogadas acima (fundação MVP — integração raster em etapas futuras).
            </Text>
            <View style={{ backgroundColor: "#E8EAF6", borderRadius: 12, padding: 12 }}>
              <Text style={{ color: "#1A237E", fontSize: 12, fontWeight: "700" }}>Cobertura catalogada</Text>
              <Text style={{ color: "#1A237E", fontSize: 20, fontWeight: "700" }}>
                {geo?.coberturaKm2 ?? 0} km²
              </Text>
              <Text style={{ color: "#3949AB", fontSize: 11 }}>
                Soma das camadas · {geo?.camadasAtivas ?? 0} ativas
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
