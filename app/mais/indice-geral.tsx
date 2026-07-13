import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { usePermission } from "@/components/route-guard";
import {
  AFU_FASES,
  AFU_STACK_REAL,
  etapaProgressPercent,
  etapas1a29ProgressPercent,
  etapasDoneOrPartialCount,
  type AfuEtapa,
  type EtapaStatus,
} from "@/constants/afu-etapas";

type IndiceEtapa = AfuEtapa & { route: string };

type IndiceFase = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  etapas: IndiceEtapa[];
};

const STATUS_META: Record<EtapaStatus, { label: string; color: string }> = {
  done: { label: "Entregue", color: "#2E7D32" },
  partial: { label: "Parcial", color: "#F57F17" },
  doc: { label: "Doc", color: "#1565C0" },
  pending: { label: "Pendente", color: "#9E9E9E" },
};

/** Etapas 30–46 — banco agronômico avançado (documentação + rotas) */
const BANCO_FASE: IndiceFase = {
  id: "banco",
  label: "Banco de Dados Agronômico",
  emoji: "🌱",
  color: "#00695C",
  etapas: [
    { num: 30, title: "Banco de Dados Agronômico Avançado", route: "/mais/banco-agronomico", faseId: "implementacao", status: "partial" },
    { num: 31, title: "Culturas Iniciais — 17 Fichas Técnicas", route: "/mais/culturas-iniciais", faseId: "implementacao", status: "partial" },
    { num: 32, title: "Seed Inicial das Culturas", route: "/mais/seed-culturas", faseId: "implementacao", status: "partial" },
    { num: 33, title: "Seed de Clima, Irrigação e Nutrientes", route: "/mais/seed-tecnico", faseId: "implementacao", status: "partial" },
    { num: 34, title: "Pragas, Doenças, Rotação e Genética G1–G5", route: "/mais/banco-fitossanitario", faseId: "implementacao", status: "partial" },
    { num: 35, title: "AFU GeoClima — Banco Climático Nacional", route: "/mais/geoclima", faseId: "implementacao", status: "doc" },
    { num: 36, title: "AFU Solos — Banco Nacional de Solos", route: "/mais/afu-solos", faseId: "implementacao", status: "doc" },
    { num: 37, title: "AFU Genoma Vegetal e Melhoramento Genético", route: "/mais/genoma-vegetal", faseId: "implementacao", status: "doc" },
    { num: 38, title: "Calendário Agrícola Inteligente", route: "/mais/calendario-agricola", faseId: "implementacao", status: "partial" },
    { num: 39, title: "AFU Laboratório Digital", route: "/mais/laboratorio-digital", faseId: "implementacao", status: "doc" },
    { num: 40, title: "Economia Agrícola e Previsão de Produção", route: "/mais/economia-agricola", faseId: "implementacao", status: "doc" },
    { num: 41, title: "IA Agrônomo Virtual (AFU AI CORE)", route: "/mais/ia-agronomo", faseId: "implementacao", status: "partial" },
    { num: 42, title: "Satélite, Drones e Geointeligência", route: "/mais/geointeligencia", faseId: "implementacao", status: "doc" },
    { num: 43, title: "Rede de Sensores IoT e Automação Rural", route: "/mais/iot-automacao", faseId: "implementacao", status: "doc" },
    { num: 44, title: "Marketplace e Comercialização Agrícola", route: "/mais/marketplace-agricola", faseId: "implementacao", status: "partial" },
    { num: 45, title: "Centro de Comando NOC Agrícola", route: "/mais/noc-agricola", faseId: "implementacao", status: "doc" },
    { num: 46, title: "Arquitetura Final de Software e Infra", route: "/mais/arquitetura-final", faseId: "implementacao", status: "doc" },
  ],
};

const FASES: IndiceFase[] = [
  ...AFU_FASES.map((f) => ({
    id: f.id,
    label: f.label,
    emoji: f.emoji,
    color: f.color,
    etapas: f.etapas as IndiceEtapa[],
  })),
  BANCO_FASE,
];

const ALL_ETAPAS = FASES.flatMap((f) => f.etapas);

export default function IndiceGeralScreen() {
  const colors = useColors();
  const router = useRouter();
  const { canAccess: isAdmin } = usePermission({ requireAdmin: true });
  const [expandedFase, setExpandedFase] = useState<string | null>("estrategia");

  const fasesVisiveis = FASES.map((f) => ({
    ...f,
    etapas: f.etapas.filter((e) => !e.requireAdmin || isAdmin),
  }));

  const totalEtapas = ALL_ETAPAS.length;
  const progressoMvp = etapas1a29ProgressPercent();
  const progressoGeral = etapaProgressPercent(ALL_ETAPAS);
  const entreguesMvp = etapasDoneOrPartialCount(
    ALL_ETAPAS.filter((e) => e.num <= 29),
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-3">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📋</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Índice Geral AFU</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              46 Etapas · 6 Fases · MVP Planta Saudável
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: "rgba(255,255,255,0.12)" }} className="rounded-xl p-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-xs font-bold">Progresso MVP (1–29)</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold">
              {entreguesMvp}/29 · {progressoMvp}%
            </Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", height: 8, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ backgroundColor: "#69F0AE", width: `${progressoMvp}%` as `${number}%`, height: 8, borderRadius: 4 }} />
          </View>
          <View className="flex-row justify-between items-center mt-3 mb-2">
            <Text className="text-white text-xs font-bold">Progresso Geral (1–46)</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold">
              {totalEtapas} etapas · {progressoGeral}%
            </Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", height: 6, borderRadius: 3, overflow: "hidden" }}>
            <View style={{ backgroundColor: "#81C784", width: `${progressoGeral}%` as `${number}%`, height: 6, borderRadius: 3 }} />
          </View>
          <View className="flex-row justify-between mt-2">
            {FASES.map((f) => {
              const pct = etapaProgressPercent(f.etapas);
              return (
                <View key={f.id} className="items-center" style={{ flex: 1 }}>
                  <Text className="text-white text-xs">{f.emoji}</Text>
                  <Text style={{ color: "#A5D6A7" }} className="text-xs">{pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row flex-wrap gap-2 mb-4">
          {FASES.map((f) => {
            const pct = etapaProgressPercent(f.etapas);
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setExpandedFase(expandedFase === f.id ? null : f.id)}
                style={{ backgroundColor: f.color + "15", borderWidth: 1, borderColor: f.color + "40", width: "47%" }}
                className="rounded-xl p-3"
              >
                <Text className="text-xl mb-1">{f.emoji}</Text>
                <Text style={{ color: f.color }} className="text-xs font-bold leading-tight">{f.label}</Text>
                <Text className="text-xs text-muted mt-1">{f.etapas.length} etapas · {pct}%</Text>
                <View style={{ backgroundColor: f.color + "30", height: 4, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                  <View style={{ backgroundColor: f.color, width: `${pct}%` as `${number}%`, height: 4, borderRadius: 2 }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {fasesVisiveis.map((fase) => {
          const isOpen = expandedFase === fase.id;
          const pct = etapaProgressPercent(fase.etapas);

          return (
            <View key={fase.id} className="mb-3">
              <TouchableOpacity
                onPress={() => setExpandedFase(isOpen ? null : fase.id)}
                style={{ backgroundColor: fase.color, borderRadius: 12 }}
                className="p-3 flex-row items-center"
              >
                <Text className="text-white text-lg mr-2">{fase.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-white text-sm font-bold">{fase.label}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View style={{ backgroundColor: "rgba(255,255,255,0.25)", height: 4, borderRadius: 2, flex: 1, overflow: "hidden" }}>
                      <View style={{ backgroundColor: "#fff", width: `${pct}%` as `${number}%`, height: 4, borderRadius: 2 }} />
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.9)" }} className="text-xs">{pct}%</Text>
                  </View>
                </View>
                <Text className="text-white text-base ml-2">{isOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: fase.color + "30",
                    borderTopWidth: 0,
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                  }}
                  className="overflow-hidden"
                >
                  {fase.etapas.map((etapa, idx) => {
                    const statusMeta = STATUS_META[etapa.status];
                    const isAdminItem = etapa.requireAdmin === true;
                    return (
                      <TouchableOpacity
                        key={etapa.num}
                        onPress={() => router.push(etapa.route as any)}
                        style={{
                          borderTopWidth: idx > 0 ? 1 : 0,
                          borderTopColor: colors.border,
                        }}
                        className="flex-row items-center px-3 py-3"
                      >
                        <View
                          style={{
                            backgroundColor: statusMeta.color,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                          }}
                          className="items-center justify-center mr-3 flex-shrink-0"
                        >
                          <Text className="text-white text-xs font-bold">{etapa.num}</Text>
                        </View>

                        <Text style={{ color: colors.foreground }} className="text-xs flex-1 leading-relaxed">
                          {etapa.title}
                        </Text>

                        {isAdminItem && isAdmin && (
                          <View style={{ backgroundColor: "#7C3AED20", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, marginLeft: 4 }}>
                            <Text style={{ color: "#7C3AED", fontSize: 9, fontWeight: "800" }}>ADMIN</Text>
                          </View>
                        )}

                        <View
                          style={{
                            backgroundColor: statusMeta.color + "20",
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            marginLeft: 6,
                          }}
                        >
                          <Text style={{ color: statusMeta.color }} className="text-xs font-bold">
                            {statusMeta.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-4 mb-8">
          <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">📊 Estatísticas do Projeto (jul/2026)</Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              { k: "46", v: "Etapas totais", cor: "#1B5E20" },
              { k: "6", v: "Fases temáticas", cor: "#1565C0" },
              { k: "29", v: "Etapas MVP 1.0", cor: "#2E7D32" },
              { k: "MySQL", v: "Banco de dados", cor: "#C62828" },
              { k: "tRPC", v: "API backend", cor: "#7B1FA2" },
              { k: "Expo 54", v: "App + Web", cor: "#F57F17" },
              { k: "3", v: "Ambientes deploy", cor: "#0288D1" },
              { k: "17+", v: "Culturas no banco", cor: "#00695C" },
            ].map((s) => (
              <View
                key={s.v}
                style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "22%" }}
                className="rounded-xl p-2 items-center"
              >
                <Text style={{ color: s.cor }} className="text-lg font-bold">{s.k}</Text>
                <Text className="text-xs text-muted text-center leading-tight">{s.v}</Text>
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: "#1B5E2015", borderRadius: 8, padding: 10, marginTop: 12 }}>
            <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">⚙️ Stack implementada</Text>
            <Text style={{ color: "#2E7D32" }} className="text-xs mt-1 leading-relaxed">
              {AFU_STACK_REAL.frontend}{"\n"}
              {AFU_STACK_REAL.backend} · {AFU_STACK_REAL.database}{"\n"}
              {AFU_STACK_REAL.auth} · {AFU_STACK_REAL.deploy}
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E2015", borderRadius: 8, padding: 10, marginTop: 8 }}>
            <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">🎯 Missão AFU</Text>
            <Text style={{ color: "#2E7D32" }} className="text-xs mt-1 leading-relaxed">
              Democratizar o acesso à tecnologia agronômica de ponta para pequenos e médios produtores rurais do Brasil, oferecendo diagnóstico fitotécnico por IA, banco de dados agronômico completo e ferramentas de gestão integradas.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
