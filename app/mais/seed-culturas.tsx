/**
 * Etapa 32 — Seed inicial das culturas (scripts/seed-agronomico.ts)
 */
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";
import { TODAS_CULTURAS } from "@/lib/mock-data";

const TABS = [
  { id: "status", label: "Status" },
  { id: "dados", label: "Dados" },
  { id: "script", label: "Script" },
  { id: "execucao", label: "Execução" },
];

export default function SeedCulturasScreen() {
  const [tab, setTab] = useState("status");
  const { data: stats, isLoading } = trpc.bancoAgronomico.stats.useQuery();
  const { data: catalogo = [] } = trpc.bancoAgronomico.catalogo.list.useQuery({});

  const ok = (stats?.totalCulturas ?? 0) >= 17;

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#004D40" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#00695C" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🧬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Seed Inicial das Culturas</Text>
            <Text style={{ color: "#80CBC4" }} className="text-xs">
              Etapa 32 · npm run seed:agronomico · Drizzle/MySQL
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
        <AfuStackBanner note="Seed real: scripts/seed-agronomico.ts (TODAS_CULTURAS). Prisma upsert era o plano original." />

        {tab === "status" && (
          <View className="pb-8">
            {isLoading ? (
              <ActivityIndicator color="#004D40" />
            ) : (
              <>
                <View
                  style={{
                    backgroundColor: ok ? "#E8F5E9" : "#FFF8E1",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: ok ? "#2E7D3240" : "#F57F1740",
                  }}
                >
                  <Text style={{ color: ok ? "#1B5E20" : "#E65100", fontWeight: "700", fontSize: 13 }}>
                    {ok ? "✓ Seed aplicado" : "○ Seed pendente"}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    {stats?.totalCulturas ?? 0} culturas no MySQL · fonte {TODAS_CULTURAS.length} fichas
                  </Text>
                </View>
                {[
                  { k: "culturas_catalogo", v: stats?.totalCulturas ?? 0 },
                  { k: "clima_cultura", v: stats?.totalClima ?? 0 },
                  { k: "irrigacao_cultura", v: stats?.totalIrrigacao ?? 0 },
                  { k: "nutrientes_cultura", v: stats?.totalNutrientes ?? 0 },
                  { k: "genetica_cultura", v: stats?.totalGenetica ?? 0 },
                ].map((row) => (
                  <View
                    key={row.k}
                    className="flex-row justify-between py-2"
                    style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
                  >
                    <Text className="text-xs font-mono text-foreground">{row.k}</Text>
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">
                      {row.v}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {tab === "dados" && (
          <View className="pb-8">
            <Text className="text-sm font-bold text-foreground mb-2">Culturas no banco</Text>
            {catalogo.map((c) => (
              <View
                key={c.id}
                className="flex-row items-center py-2"
                style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}
              >
                <Text className="text-xs font-mono text-muted w-24">{c.slug}</Text>
                <Text className="text-xs text-foreground flex-1">{c.nomePopular}</Text>
                <Text className="text-xs text-muted">{c.categoria}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === "script" && (
          <View className="pb-8">
            <Text className="text-sm font-bold text-foreground mb-2">scripts/seed-agronomico.ts</Text>
            <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
              <Text style={{ color: "#A5D6A7", fontFamily: "monospace", fontSize: 11, lineHeight: 18 }}>
                {`import { TODAS_CULTURAS } from "../lib/mock-data";
// upsert por slug em culturas_catalogo
// + clima_cultura, irrigacao_cultura
// + 12 nutrientes, G1–G5 genética
// + pragas/doenças + N:N controle

npm run db:push
npm run seed:agronomico`}
              </Text>
            </View>
            <Text className="text-xs text-muted">
              Idempotente: reexecutar atualiza nomes/clima e não duplica nutrientes/genética.
            </Text>
          </View>
        )}

        {tab === "execucao" && (
          <View className="pb-8">
            <Text className="text-sm font-bold text-foreground mb-2">Checklist</Text>
            {[
              { ok: (stats?.totalCulturas ?? 0) >= 17, t: "17 culturas inseridas" },
              { ok: catalogo.every((c) => !!c.slug), t: "Slug único por ficha" },
              { ok: (stats?.totalGenetica ?? 0) >= 17 * 5, t: "Genética G1–G5 por cultura" },
            ].map((item) => (
              <Text key={item.t} style={{ color: item.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 6 }}>
                {item.ok ? "✓" : "○"} {item.t}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
