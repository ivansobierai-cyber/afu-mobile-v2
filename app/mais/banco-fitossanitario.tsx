/**
 * Etapa 34 — Pragas, doenças, rotação e genética G1–G5 (MySQL)
 */
import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "pragas", label: "Pragas" },
  { id: "doencas", label: "Doenças" },
  { id: "genetica", label: "Genética" },
  { id: "rotacao", label: "Rotação" },
];

const NIVEL_COR: Record<string, string> = {
  critico: "#C62828",
  alto: "#E65100",
  medio: "#F9A825",
  baixo: "#2E7D32",
};

const ROTACAO = [
  { cultura: "Soja", evita: "Soja contínua", recomenda: "Milho, milheto, braquiária", cor: "#81C784" },
  { cultura: "Milho", evita: "Milho safrinha sem vazio", recomenda: "Soja, feijão, crotalária", cor: "#F9A825" },
  { cultura: "Tomate", evita: "Solanáceas (batata, pimentão)", recomenda: "Gramíneas, leguminosas", cor: "#EF5350" },
  { cultura: "Café", evita: "— (perene)", recomenda: "Cobertura / adubos verdes nas entrelinhas", cor: "#6D4C41" },
  { cultura: "Feijão", evita: "Feijão seguido", recomenda: "Milho, sorgo, adubação verde", cor: "#7CB342" },
  { cultura: "Banana", evita: "Áreas com nematoides/sigatoka severa", recomenda: "Quebra de ciclo + mudas sadias", cor: "#FBC02D" },
];

export default function BancoFitossanitarioScreen() {
  const [tab, setTab] = useState("resumo");
  const { data: stats, isLoading: loadingStats } = trpc.bancoAgronomico.stats.useQuery();
  const { data: pragas = [], isLoading: loadingP } = trpc.bancoAgronomico.fitossanitario.pragas.useQuery();
  const { data: doencas = [], isLoading: loadingD } = trpc.bancoAgronomico.fitossanitario.doencas.useQuery();
  const { data: catalogo = [] } = trpc.bancoAgronomico.catalogo.list.useQuery({});
  const sampleId = catalogo[0]?.id;
  const { data: genetica = [] } = trpc.bancoAgronomico.catalogo.genetica.useQuery(
    { culturaCatalogoId: sampleId! },
    { enabled: !!sampleId },
  );

  const criterios = useMemo(
    () => [
      { ok: (stats?.totalPragas ?? 0) >= 8, label: "≥ 8 pragas no catálogo" },
      { ok: (stats?.totalDoencas ?? 0) >= 8, label: "≥ 8 doenças no catálogo" },
      { ok: (stats?.totalControles ?? 0) >= 10, label: "Ligações N:N cultura↔praga/doença" },
      { ok: (stats?.totalGenetica ?? 0) >= 85, label: "Genética G1–G5 (≥ 85 linhas)" },
    ],
    [stats],
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#880E4F" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#AD1457" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🪲</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Banco Fitossanitário</Text>
            <Text style={{ color: "#F8BBD0" }} className="text-xs">
              Etapa 34 · Pragas · Doenças · Genética G1–G5
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
                <Text style={{ color: tab === t.id ? "#880E4F" : "#fff", fontSize: 11, fontWeight: "700" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Pragas/doenças/genética via seed:agronomico → tabelas pragas_catalogo, doencas_catalogo, genetica_cultura, controle_pragas_cultura." />

        {tab === "resumo" && (
          <View className="pb-8">
            {loadingStats ? (
              <ActivityIndicator color="#880E4F" />
            ) : (
              <>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {[
                    { k: "Pragas", v: stats?.totalPragas ?? 0, cor: "#E65100" },
                    { k: "Doenças", v: stats?.totalDoencas ?? 0, cor: "#6A1B9A" },
                    { k: "Ligações", v: stats?.totalControles ?? 0, cor: "#1565C0" },
                    { k: "Genética", v: stats?.totalGenetica ?? 0, cor: "#2E7D32" },
                  ].map((c) => (
                    <View
                      key={c.k}
                      style={{ backgroundColor: c.cor + "15", width: "47%", borderRadius: 12, padding: 12 }}
                    >
                      <Text style={{ color: c.cor, fontSize: 18, fontWeight: "700" }}>{c.v}</Text>
                      <Text style={{ color: c.cor, fontSize: 11 }}>{c.k}</Text>
                    </View>
                  ))}
                </View>
                {criterios.map((c) => (
                  <Text key={c.label} style={{ color: c.ok ? "#2E7D32" : "#F57F17", fontSize: 12, marginBottom: 4 }}>
                    {c.ok ? "✓" : "○"} {c.label}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {tab === "pragas" && (
          <View className="pb-8">
            {loadingP ? (
              <ActivityIndicator color="#E65100" />
            ) : (
              pragas.map((p) => {
                const nivel = (p.nivelRisco || "medio").toLowerCase();
                const cor = NIVEL_COR[nivel] || "#455A64";
                return (
                  <View
                    key={p.id}
                    style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-bold text-foreground flex-1">{p.nome}</Text>
                      <View style={{ backgroundColor: cor + "22" }} className="rounded-full px-2 py-0.5">
                        <Text style={{ color: cor, fontSize: 10, fontWeight: "700" }}>{nivel}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted italic mb-1">{p.nomeCientifico}</Text>
                    <Text className="text-xs text-foreground" numberOfLines={3}>
                      {p.sintomas}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === "doencas" && (
          <View className="pb-8">
            {loadingD ? (
              <ActivityIndicator color="#6A1B9A" />
            ) : (
              doencas.map((d) => {
                const nivel = (d.nivelRisco || "medio").toLowerCase();
                const cor = NIVEL_COR[nivel] || "#455A64";
                return (
                  <View
                    key={d.id}
                    style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginBottom: 10, padding: 12 }}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-bold text-foreground flex-1">{d.nome}</Text>
                      <View style={{ backgroundColor: cor + "22" }} className="rounded-full px-2 py-0.5">
                        <Text style={{ color: cor, fontSize: 10, fontWeight: "700" }}>{nivel}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted italic mb-1">{d.nomeCientifico}</Text>
                    <Text className="text-xs text-foreground" numberOfLines={3}>
                      {d.sintomas}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === "genetica" && (
          <View className="pb-8">
            <Text className="text-sm font-bold mb-2">
              G1–G5 — amostra {catalogo[0]?.nomePopular ?? ""}
            </Text>
            {genetica.length === 0 ? (
              <Text className="text-xs text-muted">Sem genética — rode seed:agronomico</Text>
            ) : (
              genetica.map((g) => (
                <View
                  key={g.id}
                  style={{ backgroundColor: "#E8F5E9", borderRadius: 10, padding: 10, marginBottom: 8 }}
                >
                  <Text style={{ color: "#1B5E20", fontWeight: "700", fontSize: 12 }}>{g.geracao}</Text>
                  <Text className="text-xs text-muted">{g.descricao}</Text>
                </View>
              ))
            )}
            <Text className="text-xs text-muted mt-2">
              Total genetica_cultura: {stats?.totalGenetica ?? 0} (meta 85 = 17×5)
            </Text>
          </View>
        )}

        {tab === "rotacao" && (
          <View className="pb-8">
            <Text className="text-xs text-muted mb-3">
              Guia de rotação (conteúdo de domínio — sem tabela dedicada no MVP).
            </Text>
            {ROTACAO.map((r) => (
              <View
                key={r.cultura}
                style={{ borderLeftWidth: 4, borderLeftColor: r.cor, backgroundColor: r.cor + "12", borderRadius: 8, padding: 12, marginBottom: 8 }}
              >
                <Text style={{ color: r.cor, fontWeight: "700", fontSize: 12 }}>{r.cultura}</Text>
                <Text className="text-xs text-muted mt-1">Evitar: {r.evita}</Text>
                <Text className="text-xs text-foreground mt-0.5">Recomenda: {r.recomenda}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
