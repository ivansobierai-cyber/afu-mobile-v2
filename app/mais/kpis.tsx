import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = ["MVP", "Produto", "Negócio", "Técnico"];

/** KPIs alinhados ao MVP 1.0 Planta Saudável e etapa 29 (piloto) */
const KPIS_MVP = [
  { kpi: "Login staging 4G", meta: "100% sucesso", atual: "OK", status: "done" as const },
  { kpi: "Build web Vercel", meta: "CI verde", atual: "OK", status: "done" as const },
  { kpi: "Typecheck (tsc)", meta: "0 erros", atual: "0", status: "done" as const },
  { kpi: "Testes Vitest", meta: "220+ passando", atual: "220", status: "partial" as const },
  { kpi: "Diagnóstico IA (smoke)", meta: "Foto → laudo", atual: "OK", status: "done" as const },
  { kpi: "Mapa GPS (web)", meta: "Tiles OSM", atual: "OK", status: "done" as const },
  { kpi: "Piloto 50 produtores", meta: "Etapa 29", atual: "Pendente", status: "pending" as const },
  { kpi: "Satisfação NPS piloto", meta: "≥ 4,5 / 5", atual: "—", status: "pending" as const },
];

const STATUS_COLOR = {
  done: "#2E7D32",
  partial: "#F57F17",
  pending: "#9E9E9E",
};

export default function KpisScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  const doneCount = KPIS_MVP.filter((k) => k.status === "done").length;
  const pct = Math.round((doneCount / KPIS_MVP.length) * 100);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#37474F" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#455A64" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📈</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Indicadores (KPIs)</Text>
            <Text style={{ color: "#B0BEC5" }} className="text-xs">Etapa 18 · Governança · MVP 1.0</Text>
          </View>
        </View>
        <View style={{ backgroundColor: "rgba(255,255,255,0.12)" }} className="rounded-lg p-2 mb-2">
          <Text className="text-white text-xs">MVP staging: {doneCount}/{KPIS_MVP.length} KPIs críticos ({pct}%)</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {TABS.map((t, i) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(i)}
                style={{
                  backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: tab === i ? "#37474F" : "#fff" }} className="text-xs font-bold">
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-2">
            {KPIS_MVP.map((k) => (
              <View
                key={k.kpi}
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                className="rounded-xl p-3 flex-row items-center"
              >
                <View style={{ width: 8, height: 40, borderRadius: 4, backgroundColor: STATUS_COLOR[k.status], marginRight: 10 }} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{k.kpi}</Text>
                  <Text className="text-xs text-muted">Meta: {k.meta}</Text>
                </View>
                <Text style={{ color: STATUS_COLOR[k.status], fontWeight: "700", fontSize: 13 }}>{k.atual}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View className="gap-3">
            {[
              { kpi: "DAU / MAU piloto", meta: "≥ 40% retenção D7", cor: "#1565C0" },
              { kpi: "Diagnósticos / usuário", meta: "≥ 2 / mês", cor: "#2E7D32" },
              { kpi: "Tempo até 1º laudo", meta: "< 5 min", cor: "#6A1B9A" },
              { kpi: "Propriedades cadastradas", meta: "≥ 1 por produtor", cor: "#E65100" },
            ].map((k) => (
              <View key={k.kpi} style={{ borderLeftWidth: 4, borderLeftColor: k.cor, backgroundColor: k.cor + "10" }} className="rounded-r-xl p-3">
                <Text className="text-sm font-bold">{k.kpi}</Text>
                <Text className="text-xs text-muted mt-1">Meta piloto: {k.meta}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-3">
            {[
              { kpi: "MRR SaaS", meta: "R$ 49–129 / produtor", cor: "#1B5E20" },
              { kpi: "Take rate marketplace", meta: "5–10%", cor: "#F57F17" },
              { kpi: "CAC piloto", meta: "< R$ 120", cor: "#C62828" },
              { kpi: "Churn mensal", meta: "< 8%", cor: "#455A64" },
            ].map((k) => (
              <View key={k.kpi} className="rounded-xl p-3" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-sm font-bold">{k.kpi}</Text>
                <Text style={{ color: k.cor }} className="text-xs font-semibold mt-1">{k.meta}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-3">
            {[
              { kpi: "Uptime API staging", meta: "≥ 99%", atual: "Health OK" },
              { kpi: "P95 API / tRPC", meta: "< 800ms", atual: "Medir em prod" },
              { kpi: "Cobertura testes", meta: "220+ unit", atual: "2 suites auth pendentes" },
              { kpi: "Deploy lead time", meta: "< 15 min", atual: "CI ~4 min" },
            ].map((k) => (
              <View key={k.kpi} className="flex-row justify-between py-2 border-b border-gray-100">
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold">{k.kpi}</Text>
                  <Text className="text-xs text-muted">{k.meta}</Text>
                </View>
                <Text className="text-xs font-semibold" style={{ color: "#2E7D32" }}>{k.atual}</Text>
              </View>
            ))}
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
