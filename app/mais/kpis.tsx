import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { etapas1a30ProgressPercent } from "@/constants/afu-etapas";
import { trpc } from "@/lib/trpc";

const TABS = ["MVP", "Produto", "Negócio", "Técnico"];

const STATUS_COLOR = {
  done: "#2E7D32",
  partial: "#F57F17",
  pending: "#9E9E9E",
};

export default function KpisScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  const { data: pilotoResumo } = trpc.piloto.metricas.resumo.useQuery();
  const { data: bancoStats } = trpc.bancoAgronomico.stats.useQuery();

  const progressoMvp = etapas1a30ProgressPercent();

  const KPIS_MVP = [
    { kpi: "Progresso etapas 1–30", meta: "≥ 75%", atual: `${progressoMvp}%`, status: progressoMvp >= 75 ? ("done" as const) : ("partial" as const) },
    { kpi: "Login staging 4G", meta: "100% sucesso", atual: "OK", status: "done" as const },
    { kpi: "Build web Vercel", meta: "CI verde", atual: "OK", status: "done" as const },
    { kpi: "Typecheck (tsc)", meta: "0 erros", atual: "0", status: "done" as const },
    { kpi: "Testes Vitest", meta: "270+ passando", atual: "270+", status: "done" as const },
    { kpi: "Catálogo agronômico (Etapa 30)", meta: "MySQL", atual: String(bancoStats?.totalCulturas ?? 0), status: (bancoStats?.totalCulturas ?? 0) > 0 ? ("done" as const) : ("partial" as const) },
    { kpi: "Piloto — participantes", meta: "Etapa 29", atual: String(pilotoResumo?.totalParticipantes ?? 0), status: (pilotoResumo?.totalParticipantes ?? 0) > 0 ? ("partial" as const) : ("pending" as const) },
    { kpi: "NPS piloto", meta: "≥ 4,5 / 5", atual: pilotoResumo?.mediaNps ? String(pilotoResumo.mediaNps) : "—", status: (pilotoResumo?.mediaNps ?? 0) >= 4.5 ? ("done" as const) : ("pending" as const) },
  ];

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
            <Text style={{ color: "#B0BEC5" }} className="text-xs">Etapa 18 · Governança · MVP 1.0 (live)</Text>
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
                <Text style={{ color: STATUS_COLOR[k.status], fontSize: 12, fontWeight: "700" }}>{k.atual}</Text>
              </View>
            ))}
          </View>
        )}
        {tab === 1 && (
          <Text className="text-xs text-muted">KPIs de produto: diagnóstico IA, CRUD, relatórios — ver skill afu-mvp-finalize.</Text>
        )}
        {tab === 2 && (
          <Text className="text-xs text-muted">KPIs de negócio: piloto 10–50 produtores, NPS ≥ 4,5.</Text>
        )}
        {tab === 3 && (
          <Text className="text-xs text-muted">Stack: Expo 54 · tRPC · MySQL · Railway · Vercel.</Text>
        )}
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
