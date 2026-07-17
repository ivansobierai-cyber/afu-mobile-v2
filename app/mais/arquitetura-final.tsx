/**
 * Etapa 46 — Arquitetura Final de Software e Infra
 */
import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { AFU_STACK_REAL } from "@/constants/afu-etapas";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "componentes", label: "Componentes" },
  { id: "stack", label: "Stack real" },
];

const CAMADA_COR: Record<string, string> = {
  frontend: "#1565C0",
  backend: "#2E7D32",
  dados: "#6D4C41",
  ia: "#6A1B9A",
  infra: "#455A64",
  seguranca: "#C62828",
  devops: "#00838F",
  integracao: "#E65100",
};

const STATUS_COR: Record<string, string> = {
  operacional: "#2E7D32",
  parcial: "#F57F17",
  planejado: "#757575",
  deprecado: "#9E9E9E",
};

export default function ArquiteturaFinalScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("resumo");
  const { data: componentes = [], isLoading } = trpc.bancoAgronomico.arquitetura.componentes.useQuery();
  const { data: arch } = trpc.bancoAgronomico.arquitetura.stats.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = useMemo(
    () => [
      {
        ok: (arch?.totalComponentes ?? 0) >= 12,
        label: `≥ 12 componentes (atual: ${arch?.totalComponentes ?? 0})`,
      },
      {
        ok: (arch?.operacionais ?? 0) >= 8,
        label: `Operacionais: ${arch?.operacionais ?? 0}`,
      },
      {
        ok: Object.keys(arch?.porCamada ?? {}).length >= 6,
        label: `Camadas cobertas: ${Object.keys(arch?.porCamada ?? {}).length}`,
      },
    ],
    [arch],
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#212121" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#424242" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🏗️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Arquitetura Final AFU</Text>
            <Text style={{ color: "#BDBDBD" }} className="text-xs">
              Etapa 46 · Stack real · seed:noc-arquitetura
            </Text>
          </View>
          <View style={{ backgroundColor: "#BDBDBD" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#212121" }} className="text-xs font-bold">
              {stats?.arquiteturaOperacionais ?? arch?.operacionais ?? "—"} ok
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
                <Text style={{ color: tab === t.id ? "#212121" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Inventário vivo da stack implementada (não NestJS/Prisma). Fonte: arquitetura_componentes." />

        {isLoading ? (
          <ActivityIndicator color="#212121" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            <View className="flex-row flex-wrap gap-2 mb-3">
              {[
                { k: "Componentes", v: arch?.totalComponentes ?? 0, cor: "#212121" },
                { k: "Operacionais", v: arch?.operacionais ?? 0, cor: "#2E7D32" },
                { k: "Parciais", v: arch?.parciais ?? 0, cor: "#F57F17" },
                { k: "Planejados", v: arch?.planejados ?? 0, cor: "#757575" },
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
              {Object.entries(arch?.porCamada ?? {}).map(([camada, n]) => (
                <View
                  key={camada}
                  style={{
                    backgroundColor: (CAMADA_COR[camada] ?? "#455A64") + "18",
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: CAMADA_COR[camada] ?? "#455A64", fontSize: 11, fontWeight: "600" }}>
                    {camada}: {n}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => router.push("/mais/noc-agricola" as never)}
              style={{ backgroundColor: "#0D47A1", borderRadius: 12, padding: 14, marginTop: 14 }}
            >
              <Text className="text-white text-center text-sm font-bold">Abrir Centro de Comando</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "componentes" ? (
          <View className="pb-8">
            {componentes.map((c) => {
              const cor = CAMADA_COR[c.camada] ?? "#455A64";
              const st = STATUS_COR[c.status] ?? "#757575";
              return (
                <View
                  key={c.id}
                  style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}
                >
                  <View style={{ backgroundColor: cor + "15" }} className="flex-row items-center justify-between p-3">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-bold text-foreground">{c.nome}</Text>
                      <Text className="text-xs text-muted">{c.camada}</Text>
                    </View>
                    <View style={{ backgroundColor: st }} className="rounded-full px-2 py-0.5">
                      <Text className="text-white text-xs font-bold">{c.status}</Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="text-xs text-muted mb-1" numberOfLines={2}>
                      {c.descricao}
                    </Text>
                    <Text style={{ color: cor, fontSize: 11, fontWeight: "600" }}>{c.tecnologia}</Text>
                  </View>
                </View>
              );
            })}
            {componentes.length === 0 && (
              <Text className="text-sm text-muted">Sem componentes. Rode npm run seed:noc-arquitetura.</Text>
            )}
          </View>
        ) : (
          <View className="pb-8">
            {(
              [
                ["Frontend", AFU_STACK_REAL.frontend],
                ["Backend", AFU_STACK_REAL.backend],
                ["Database", AFU_STACK_REAL.database],
                ["Auth", AFU_STACK_REAL.auth],
                ["Deploy", AFU_STACK_REAL.deploy],
              ] as const
            ).map(([k, v]) => (
              <View key={k} style={{ backgroundColor: "#F5F5F5", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <Text style={{ color: "#212121", fontSize: 11, fontWeight: "700" }}>{k}</Text>
                <Text style={{ color: "#424242", fontSize: 13 }}>{v}</Text>
              </View>
            ))}
            <Text className="text-xs text-muted mt-2">
              Expansão 31–46 concluída no catálogo de etapas. Etapa 29 (piloto) permanece parcial até campo real.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
