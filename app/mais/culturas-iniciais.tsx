/**
 * Etapa 31 — Culturas Iniciais: 17 fichas técnicas (MySQL / culturas_catalogo)
 */
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const CAT_META: Record<string, { label: string; color: string; emoji: string }> = {
  graos: { label: "Grãos", color: "#F9A825", emoji: "🌾" },
  oleaginosas: { label: "Oleaginosas", color: "#EF6C00", emoji: "🫘" },
  hortalicas: { label: "Hortaliças", color: "#2E7D32", emoji: "🥬" },
  frutas: { label: "Frutas", color: "#C2185B", emoji: "🍎" },
  fibrosas: { label: "Fibrosas", color: "#5D4037", emoji: "🧵" },
  outros: { label: "Outros", color: "#455A64", emoji: "🌱" },
};

export default function CulturasIniciaisScreen() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<string>("todas");
  const { data: catalogo = [], isLoading } = trpc.bancoAgronomico.catalogo.list.useQuery({});
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const categorias = useMemo(() => {
    const set = new Set(catalogo.map((c) => c.categoria || "outros"));
    return ["todas", ...Array.from(set)];
  }, [catalogo]);

  const filtradas = useMemo(() => {
    if (filtro === "todas") return catalogo;
    return catalogo.filter((c) => (c.categoria || "outros") === filtro);
  }, [catalogo, filtro]);

  const criterios = [
    { ok: (stats?.totalCulturas ?? 0) >= 17, label: "≥ 17 fichas em culturas_catalogo" },
    { ok: (stats?.totalClima ?? 0) >= 17, label: "Clima por cultura preenchido" },
    { ok: (stats?.totalIrrigacao ?? 0) >= 17, label: "Irrigação por cultura" },
    { ok: (stats?.totalNutrientes ?? 0) >= 12 * 17, label: "12 nutrientes × 17 culturas" },
  ];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌱</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Culturas Iniciais</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Etapa 31 · 17 fichas · MySQL · seed:agronomico
            </Text>
          </View>
          <View style={{ backgroundColor: "#69F0AE" }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">
              {stats?.totalCulturas ?? "—"}/17
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Fichas técnicas live via bancoAgronomico.catalogo.list — não mock local." />

        <View style={{ backgroundColor: "#E8F5E9", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: "#1B5E20", fontWeight: "700", fontSize: 12, marginBottom: 6 }}>
            Critérios de aceitação
          </Text>
          {criterios.map((c) => (
            <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 11, marginBottom: 2 }}>
              {c.ok ? "✓" : "○"} {c.label}
            </Text>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {categorias.map((cat) => {
              const meta = cat === "todas" ? { label: "Todas", color: "#1B5E20" } : CAT_META[cat] || { label: cat, color: "#455A64" };
              const active = filtro === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setFiltro(cat)}
                  style={{
                    backgroundColor: active ? meta.color : meta.color + "18",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: active ? "#fff" : meta.color, fontSize: 11, fontWeight: "700" }}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color="#1B5E20" />
        ) : (
          filtradas.map((c) => {
            const meta = CAT_META[c.categoria || "outros"] || CAT_META.outros;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => router.push(`/mais/cultura-catalogo/${c.id}` as never)}
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  marginBottom: 10,
                  overflow: "hidden",
                }}
              >
                <View style={{ backgroundColor: meta.color + "15" }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{meta.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{c.nomePopular}</Text>
                    <Text className="text-xs text-muted italic">{c.nomeCientifico}</Text>
                  </View>
                  <View style={{ backgroundColor: meta.color + "22" }} className="rounded-full px-2 py-0.5">
                    <Text style={{ color: meta.color, fontSize: 10, fontWeight: "700" }}>
                      {c.cicloProdutivoMin}–{c.cicloProdutivoMax}d
                    </Text>
                  </View>
                </View>
                <View className="px-3 py-2 bg-surface">
                  <Text className="text-xs text-muted" numberOfLines={2}>
                    {c.familiaBotanica} · {meta.label} · {c.produtividadeMedia || "produtividade sob revisão"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          onPress={() => router.push("/mais/catalogo-culturas" as never)}
          style={{ backgroundColor: "#1B5E20", borderRadius: 12, padding: 14, marginVertical: 12 }}
        >
          <Text className="text-white text-sm font-bold text-center">Abrir Catálogo Botânico completo</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
