import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TABS = ["Geral", "Clima", "Nutrientes", "Pragas"];

export default function CulturaCatalogoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const [tab, setTab] = useState(0);
  const culturaId = Number(id);

  const { data: cultura, isLoading } = trpc.bancoAgronomico.catalogo.getById.useQuery(
    { id: culturaId },
    { enabled: Number.isFinite(culturaId) && culturaId > 0 },
  );
  const { data: clima } = trpc.bancoAgronomico.catalogo.clima.useQuery(
    { culturaCatalogoId: culturaId },
    { enabled: culturaId > 0 },
  );
  const { data: nutrientes = [] } = trpc.bancoAgronomico.catalogo.nutrientes.useQuery(
    { culturaCatalogoId: culturaId },
    { enabled: culturaId > 0 },
  );
  const { data: fitossanitario } = trpc.bancoAgronomico.catalogo.pragas.useQuery(
    { culturaCatalogoId: culturaId },
    { enabled: culturaId > 0 },
  );
  const { data: consulta } = trpc.bancoAgronomico.consulta.useQuery(
    { culturaCatalogoId: culturaId },
    { enabled: culturaId > 0 },
  );

  if (isLoading || !cultura) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#00695C" }} className="px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-white text-sm">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">{cultura.nomePopular}</Text>
        <Text style={{ color: "#80CBC4" }} className="text-xs italic">{cultura.nomeCientifico}</Text>
        <Text style={{ color: "#B2DFDB" }} className="text-xs mt-1">Etapa 30 · Banco Agronômico</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
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
                <Text style={{ color: tab === i ? "#00695C" : "#fff", fontSize: 12, fontWeight: "700" }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-3">
            <Text className="text-sm text-foreground">{cultura.descricao}</Text>
            <Text className="text-xs text-muted">Família: {cultura.familiaBotanica}</Text>
            <Text className="text-xs text-muted">Ciclo: {cultura.cicloProdutivoMin}–{cultura.cicloProdutivoMax} dias</Text>
            {consulta?.resumo && consulta.resumo.length > 0 && (
              <View style={{ backgroundColor: "#00695C15", borderRadius: 12, padding: 12 }}>
                <Text style={{ color: "#00695C", fontWeight: "700", fontSize: 12 }}>Consulta IA (dados cruzados)</Text>
                {consulta.resumo.map((r) => (
                  <Text key={r} className="text-xs text-foreground mt-1">• {r}</Text>
                ))}
              </View>
            )}
          </View>
        )}
        {tab === 1 && clima && (
          <View className="gap-2">
            <Text className="text-xs">Temperatura: {clima.temperaturaMin}–{clima.temperaturaMax}°C</Text>
            <Text className="text-xs">Precipitação: {clima.precipitacaoMin}–{clima.precipitacaoMax} mm</Text>
            <Text className="text-xs">{clima.necessidadeLuz}</Text>
          </View>
        )}
        {tab === 2 && (
          <View className="flex-row flex-wrap gap-2">
            {nutrientes.map((n) => (
              <View key={n.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-lg px-3 py-2">
                <Text className="text-sm font-bold">{n.nutriente}</Text>
                <Text className="text-xs text-muted">{n.tipo} · {n.exigencia}</Text>
              </View>
            ))}
          </View>
        )}
        {tab === 3 && fitossanitario && (
          <View className="gap-3">
            {fitossanitario.pragas.map((p) => (
              <View key={p.id} className="rounded-xl p-3" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-sm font-bold">🐛 {p.nome}</Text>
                <Text className="text-xs text-muted mt-1">{p.sintomas}</Text>
              </View>
            ))}
            {fitossanitario.doencas.map((d) => (
              <View key={d.id} className="rounded-xl p-3" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-sm font-bold">🦠 {d.nome}</Text>
                <Text className="text-xs text-muted mt-1">{d.sintomas}</Text>
              </View>
            ))}
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
