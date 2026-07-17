import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { usePermission } from "@/components/route-guard";
import {
  AFU_FASES,
  AFU_ETAPAS_31_46,
  AFU_STACK_REAL,
  etapaProgressPercent,
  etapas1a30ProgressPercent,
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

/** Etapas 31–46 — expansão banco (todas entregues) */
const BANCO_FASE_EXT: IndiceFase = {
  id: "banco_ext",
  label: "Banco Agronômico — Expansão",
  emoji: "🌿",
  color: "#004D40",
  etapas: AFU_ETAPAS_31_46 as IndiceEtapa[],
};

const FASES: IndiceFase[] = [
  ...AFU_FASES.map((f) => ({
    id: f.id,
    label: f.label,
    emoji: f.emoji,
    color: f.color,
    etapas: f.etapas as IndiceEtapa[],
  })),
  BANCO_FASE_EXT,
];

const MVP_ETAPAS = FASES.flatMap((f) => f.etapas).filter((e) => e.num <= 30);

export default function IndiceGeralScreen() {
  const colors = useColors();
  const router = useRouter();
  const { canAccess: isAdmin } = usePermission({ requireAdmin: true });
  const [expandedFase, setExpandedFase] = useState<string | null>("estrategia");

  const fasesVisiveis = FASES.map((f) => ({
    ...f,
    etapas: f.etapas.filter((e) => !e.requireAdmin || isAdmin),
  }));

  const progressoMvp = etapas1a30ProgressPercent();
  const entreguesMvp = etapasDoneOrPartialCount(MVP_ETAPAS);

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
              MVP 1.0 · Etapas 1–30 · Planta Saudável
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: "rgba(255,255,255,0.12)" }} className="rounded-xl p-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-xs font-bold">Progresso MVP (1–30)</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold">
              {entreguesMvp}/30 · {progressoMvp}%
            </Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", height: 8, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ backgroundColor: "#69F0AE", width: `${progressoMvp}%` as `${number}%`, height: 8, borderRadius: 4 }} />
          </View>
          <View className="flex-row justify-between mt-2 flex-wrap">
            {AFU_FASES.map((f) => {
              const pct = etapaProgressPercent(f.etapas);
              return (
                <View key={f.id} className="items-center m-1" style={{ minWidth: 48 }}>
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
          {fasesVisiveis.map((f) => {
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
                  <Text style={{ color: "rgba(255,255,255,0.9)" }} className="text-xs">{pct}%</Text>
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
                >
                  {fase.etapas.map((etapa, idx) => {
                    const statusMeta = STATUS_META[etapa.status];
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
                          style={{ backgroundColor: statusMeta.color, width: 28, height: 28, borderRadius: 14 }}
                          className="items-center justify-center mr-3"
                        >
                          <Text className="text-white text-xs font-bold">{etapa.num}</Text>
                        </View>
                        <Text className="text-xs flex-1 text-foreground">{etapa.title}</Text>
                        <View style={{ backgroundColor: statusMeta.color + "20", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: statusMeta.color, fontSize: 10, fontWeight: "700" }}>{statusMeta.label}</Text>
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
          <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-2">Stack implementada</Text>
          <Text style={{ color: "#2E7D32" }} className="text-xs leading-relaxed">
            {AFU_STACK_REAL.frontend}{"\n"}
            {AFU_STACK_REAL.backend} · {AFU_STACK_REAL.database}{"\n"}
            {AFU_STACK_REAL.deploy}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
