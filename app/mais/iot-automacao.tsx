/**
 * Etapa 43 — Rede de Sensores IoT e Automação Rural
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "sensores", label: "Sensores" },
  { id: "leituras", label: "Leituras" },
];

const STATUS_COR: Record<string, string> = {
  ativo: "#2E7D32",
  inativo: "#757575",
  manutencao: "#F57F17",
  falha: "#C62828",
};

export default function IotAutomacaoScreen() {
  const [tab, setTab] = useState("resumo");
  const { data: sensores = [], isLoading } = trpc.bancoAgronomico.iot.sensores.useQuery();
  const { data: leituras = [] } = trpc.bancoAgronomico.iot.leituras.useQuery({ limit: 20 });
  const { data: iot } = trpc.bancoAgronomico.iot.stats.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    { ok: (iot?.totalSensores ?? 0) >= 6, label: `≥ 6 sensores demo (atual: ${iot?.totalSensores ?? 0})` },
    { ok: (iot?.totalLeituras ?? 0) >= 6, label: `Leituras registradas: ${iot?.totalLeituras ?? 0}` },
    { ok: (iot?.sensoresAtivos ?? 0) >= 1, label: `Sensores ativos: ${iot?.sensoresAtivos ?? 0}` },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#004D40" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#00695C" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📡</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU IoT</Text>
            <Text style={{ color: "#80CBC4" }} className="text-xs">
              Etapa 43 · Sensores · Leituras · seed:geo-iot
            </Text>
          </View>
          <View style={{ backgroundColor: "#80CBC4" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#004D40" }} className="text-xs font-bold">
              {stats?.totalSensores ?? iot?.totalSensores ?? "—"} sensores
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
                <Text style={{ color: tab === t.id ? "#004D40" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Dispositivos em sensores + leituras_sensores. Alertas gerados no seed demo (ex.: umidade baixa)." />

        {isLoading ? (
          <ActivityIndicator color="#004D40" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Sensores", v: iot?.totalSensores ?? 0, cor: "#004D40" },
                { k: "Ativos", v: iot?.sensoresAtivos ?? 0, cor: "#2E7D32" },
                { k: "Leituras", v: iot?.totalLeituras ?? 0, cor: "#1565C0" },
                { k: "Alertas", v: iot?.alertas ?? 0, cor: "#C62828" },
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
            <View className="flex-row flex-wrap gap-1 mt-3">
              {Object.entries(iot?.porTipo ?? {}).map(([tipo, n]) => (
                <View key={tipo} style={{ backgroundColor: "#E0F2F1", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#004D40", fontSize: 11, fontWeight: "600" }}>
                    {tipo}: {n}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : tab === "sensores" ? (
          <View className="pb-8">
            {sensores.map((s) => {
              const cor = STATUS_COR[s.status ?? "ativo"] ?? "#757575";
              return (
                <View
                  key={s.id}
                  style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-foreground">{s.codigoSensor || `Sensor #${s.id}`}</Text>
                    <View style={{ backgroundColor: cor }} className="rounded-full px-2 py-0.5">
                      <Text className="text-white text-xs font-bold">{s.status}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted mb-1">
                    {s.tipoSensor} · {s.localInstalacao || "—"}
                  </Text>
                  <Text style={{ color: "#004D40", fontSize: 16, fontWeight: "700" }}>
                    {s.ultimaLeitura ?? "—"} {s.unidadeLeitura ?? ""}
                  </Text>
                </View>
              );
            })}
            {sensores.length === 0 && (
              <Text className="text-sm text-muted">Nenhum sensor. Rode npm run seed:geo-iot.</Text>
            )}
          </View>
        ) : (
          <View className="pb-8">
            {leituras.map((l) => (
              <View
                key={l.id}
                style={{
                  borderWidth: 1,
                  borderColor: l.alertaGerado ? "#FFCDD2" : "#E5E7EB",
                  backgroundColor: l.alertaGerado ? "#FFEBEE" : "#fff",
                  borderRadius: 12,
                  marginBottom: 8,
                  padding: 12,
                }}
              >
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs font-bold text-foreground">
                    {l.codigoSensor || `Sensor #${l.sensorId}`} · {l.tipoSensor}
                  </Text>
                  <Text className="text-xs text-muted">
                    {l.dataLeitura ? new Date(l.dataLeitura).toLocaleString("pt-BR") : "—"}
                  </Text>
                </View>
                <Text style={{ color: "#004D40", fontSize: 15, fontWeight: "700" }}>
                  {l.valor} {l.unidade ?? ""}
                </Text>
                {l.alertaGerado && l.alertaMensagem ? (
                  <Text style={{ color: "#C62828", fontSize: 11, marginTop: 4 }}>{l.alertaMensagem}</Text>
                ) : null}
              </View>
            ))}
            {leituras.length === 0 && (
              <Text className="text-sm text-muted">Sem leituras ainda.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
