/**
 * Etapa 45 — Centro de Comando NOC Agrícola
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "painel", label: "Painel" },
  { id: "alertas", label: "Alertas" },
  { id: "modulos", label: "Módulos" },
];

const SEV_COR: Record<string, string> = {
  info: "#1565C0",
  baixa: "#00838F",
  media: "#F57F17",
  alta: "#E65100",
  critica: "#C62828",
};

export default function NocAgricolaScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("painel");
  const { data: painel, isLoading } = trpc.bancoAgronomico.noc.painel.useQuery();
  const { data: alertas = [] } = trpc.bancoAgronomico.noc.alertas.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    { ok: (stats?.totalNocAlertas ?? 0) >= 8, label: `≥ 8 alertas NOC (atual: ${stats?.totalNocAlertas ?? 0})` },
    { ok: (painel?.saudeScore ?? 0) >= 50, label: `Score de saúde: ${painel?.saudeScore ?? 0}` },
    { ok: (painel?.sensores ?? 0) > 0, label: "Sensores IoT no painel" },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#1565C0" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🖥️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Centro de Comando</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Etapa 45 · NOC · seed:noc-arquitetura
            </Text>
          </View>
          <View style={{ backgroundColor: "#90CAF9" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#0D47A1" }} className="text-xs font-bold">
              saúde {painel?.saudeScore ?? "—"}
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
        <AfuStackBanner note="Painel agrega KPIs do ecossistema + noc_alertas. Monitoramento operacional MVP." />

        {isLoading ? (
          <ActivityIndicator color="#0D47A1" />
        ) : tab === "painel" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Produtores", v: painel?.produtores ?? 0, cor: "#0D47A1" },
                { k: "Propriedades", v: painel?.propriedades ?? 0, cor: "#2E7D32" },
                { k: "Sensores", v: painel?.sensoresAtivos ?? 0, cor: "#00695C" },
                { k: "Alertas abertos", v: painel?.noc?.abertos ?? 0, cor: "#C62828" },
                { k: "Marketplace", v: painel?.produtosMarketplace ?? 0, cor: "#1B5E20" },
                { k: "Diagnósticos IA", v: painel?.diagnosticosIa ?? 0, cor: "#6A1B9A" },
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
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => router.push("/mais/iot-automacao" as never)}
                style={{ flex: 1, backgroundColor: "#004D40", borderRadius: 12, padding: 12 }}
              >
                <Text className="text-white text-center text-xs font-bold">IoT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/mais/geointeligencia" as never)}
                style={{ flex: 1, backgroundColor: "#1A237E", borderRadius: 12, padding: 12 }}
              >
                <Text className="text-white text-center text-xs font-bold">GEO</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : tab === "alertas" ? (
          <View className="pb-8">
            {alertas.map((a) => {
              const cor = SEV_COR[a.severidade] ?? "#455A64";
              return (
                <View
                  key={a.id}
                  style={{
                    borderWidth: 1,
                    borderColor: a.status === "aberto" ? cor + "55" : "#E5E7EB",
                    borderRadius: 12,
                    marginBottom: 10,
                    overflow: "hidden",
                  }}
                >
                  <View style={{ backgroundColor: cor + "18" }} className="flex-row items-center justify-between p-3">
                    <Text className="text-sm font-bold text-foreground flex-1 mr-2">{a.titulo}</Text>
                    <View style={{ backgroundColor: cor }} className="rounded-full px-2 py-0.5">
                      <Text className="text-white text-xs font-bold">{a.severidade}</Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="text-xs text-muted mb-2" numberOfLines={3}>
                      {a.descricao}
                    </Text>
                    <Text className="text-xs text-muted">
                      {a.modulo} · {a.status} · {a.origem || "—"}
                    </Text>
                  </View>
                </View>
              );
            })}
            {alertas.length === 0 && (
              <Text className="text-sm text-muted">Nenhum alerta. Rode npm run seed:noc-arquitetura.</Text>
            )}
          </View>
        ) : (
          <View className="pb-8">
            <Text className="text-sm font-bold text-foreground mb-3">Cobertura do ecossistema</Text>
            {[
              { label: "Catálogo culturas", value: painel?.culturasCatalogo ?? 0, route: "/mais/banco-agronomico" },
              { label: "Camadas GEO", value: painel?.camadasGeo ?? 0, route: "/mais/geointeligencia" },
              { label: "Módulos Lab", value: painel?.labModulos ?? 0, route: "/mais/laboratorio-digital" },
              { label: "Zonas clima", value: painel?.zonasClima ?? 0, route: "/mais/geoclima" },
              { label: "Pedidos marketplace", value: painel?.pedidos ?? 0, route: "/mais/marketplace-agricola" },
              { label: "Tickets suporte abertos", value: painel?.ticketsAbertos ?? 0, route: "/mais/arquitetura-final" },
            ].map((m) => (
              <TouchableOpacity
                key={m.label}
                onPress={() => router.push(m.route as never)}
                className="flex-row items-center justify-between mb-2"
                style={{ backgroundColor: "#E3F2FD", borderRadius: 12, padding: 12 }}
              >
                <Text style={{ color: "#0D47A1", fontSize: 13, fontWeight: "600" }}>{m.label}</Text>
                <Text style={{ color: "#1565C0", fontSize: 14, fontWeight: "700" }}>{m.value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
