/**
 * Etapa 35 — AFU GeoClima: zonas Köppen no MySQL
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "zonas", label: "Zonas" },
  { id: "aptidao", label: "Aptidão" },
];

export default function GeoclimaScreen() {
  const [tab, setTab] = useState("resumo");
  const { data: zonas = [], isLoading } = trpc.bancoAgronomico.geoclima.zonas.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    { ok: (stats?.totalZonas ?? 0) >= 9, label: "≥ 9 zonas Köppen em zonas_climaticas" },
    { ok: zonas.every((z) => (z.aptidaoCulturas?.length ?? 0) > 0), label: "Aptidão de culturas por zona" },
    { ok: (stats?.totalCulturas ?? 0) >= 17, label: "Catálogo 17 culturas disponível" },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#1565C0" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🗺️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU GeoClima</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Etapa 35 · Köppen · Zoneamento · seed:expansao
            </Text>
          </View>
          <View style={{ backgroundColor: "#81D4FA" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#0D47A1" }} className="text-xs font-bold">
              {stats?.totalZonas ?? "—"} zonas
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
        <AfuStackBanner note="Zonas climáticas nacionais (Köppen) em MySQL. Clima por cultura continua em clima_cultura (etapa 33)." />

        {isLoading ? (
          <ActivityIndicator color="#0D47A1" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View style={{ backgroundColor: "#E3F2FD", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              {criterios.map((c) => (
                <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                  {c.ok ? "✓" : "○"} {c.label}
                </Text>
              ))}
            </View>
            <Text className="text-xs text-muted">
              npm run seed:expansao · Open-Meteo (weather) complementar por GPS da propriedade
            </Text>
          </View>
        ) : tab === "zonas" ? (
          <View className="pb-8">
            {zonas.map((z) => (
              <View
                key={z.id}
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-bold text-foreground">{z.codigoKoppen} — {z.nome}</Text>
                </View>
                <Text className="text-xs text-muted mb-1">{z.regioesBrasil}</Text>
                <Text className="text-xs text-foreground" numberOfLines={2}>
                  {z.descricao}
                </Text>
                <Text className="text-xs text-muted mt-2">
                  Temp {z.tempMediaMin}–{z.tempMediaMax}°C · Chuva {z.precipitacaoAnualMin}–{z.precipitacaoAnualMax} mm
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="pb-8">
            {zonas.map((z) => (
              <View key={z.id} style={{ backgroundColor: "#E3F2FD", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <Text style={{ color: "#0D47A1", fontWeight: "700", fontSize: 12 }}>{z.codigoKoppen}</Text>
                <Text className="text-xs text-muted mt-1">
                  {(z.aptidaoCulturas || []).join(" · ") || "—"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
