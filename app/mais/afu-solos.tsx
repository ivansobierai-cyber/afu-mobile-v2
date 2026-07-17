/**
 * Etapa 36 — AFU Solos: classes de solo no MySQL
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "classes", label: "Classes" },
  { id: "aptidao", label: "Solo × Cultura" },
];

export default function AfuSolosScreen() {
  const [tab, setTab] = useState("resumo");
  const { data: solos = [], isLoading } = trpc.bancoAgronomico.solos.list.useQuery();
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    { ok: (stats?.totalSolos ?? 0) >= 8, label: "≥ 8 tipos em tipos_solo" },
    { ok: solos.every((s) => !!s.phMin && !!s.phMax), label: "Faixa de pH por classe" },
    { ok: solos.every((s) => (s.aptidaoCulturas?.length ?? 0) > 0), label: "Aptidão de culturas por solo" },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#4E342E" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#6D4C41" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🟤</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Solos</Text>
            <Text style={{ color: "#D7CCC8" }} className="text-xs">
              Etapa 36 · Classes · pH · Manejo · seed:expansao
            </Text>
          </View>
          <View style={{ backgroundColor: "#A1887F" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#3E2723" }} className="text-xs font-bold">
              {stats?.totalSolos ?? "—"} classes
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
                <Text style={{ color: tab === t.id ? "#4E342E" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Catálogo nacional de solos (SiBCS resumido). tipoSolo por cultura já existe em culturas_catalogo." />

        {isLoading ? (
          <ActivityIndicator color="#4E342E" />
        ) : tab === "resumo" ? (
          <View className="pb-8">
            {criterios.map((c) => (
              <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                {c.ok ? "✓" : "○"} {c.label}
              </Text>
            ))}
          </View>
        ) : tab === "classes" ? (
          <View className="pb-8">
            {solos.map((s) => (
              <View
                key={s.id}
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
              >
                <Text className="text-sm font-bold text-foreground">{s.nome}</Text>
                <Text className="text-xs text-muted mt-1" numberOfLines={2}>
                  {s.descricao}
                </Text>
                <Text className="text-xs text-foreground mt-2">
                  pH {s.phMin}–{s.phMax} · {s.textura} · Drenagem: {s.drenagem}
                </Text>
                <Text className="text-xs text-muted mt-1">Fertilidade: {s.fertilidade}</Text>
                {s.manejo ? <Text className="text-xs text-muted mt-1">Manejo: {s.manejo}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <View className="pb-8">
            {solos.map((s) => (
              <View key={s.id} style={{ backgroundColor: "#EFEBE9", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <Text style={{ color: "#4E342E", fontWeight: "700", fontSize: 12 }}>{s.nome}</Text>
                <Text className="text-xs text-muted mt-1">
                  {(s.aptidaoCulturas || []).join(" · ") || "—"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
