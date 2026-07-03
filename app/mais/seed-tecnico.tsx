import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "objetivo", label: "Objetivo" },
  { id: "culturas", label: "Culturas" },
  { id: "clima", label: "Clima" },
  { id: "irrigacao", label: "Irrigação" },
  { id: "fases", label: "Fases" },
  { id: "script", label: "Script" },
];

function CodeBlock({ code, color = "#A5D6A7" }: { code: string; color?: string }) {
  return (
    <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
      <Text style={{ color, fontFamily: "monospace", fontSize: 11, lineHeight: 18 }}>
        {code}
      </Text>
    </View>
  );
}

const CULTURAS_RESUMO = [
  { nome: "Café Arábica", temp: "18–23°C", ph: "5,5–6,5", colheita: "24–36 meses", nutrientes: "N,K,Ca,Mg,B,Zn", cor: "#4E342E" },
  { nome: "Couve-flor", temp: "15–22°C", ph: "6,0–6,8", colheita: "80–120 dias", nutrientes: "N,P,K,Ca,B,Mo", cor: "#7CB342" },
  { nome: "Brócolis", temp: "15–24°C", ph: "6,0–6,8", colheita: "70–100 dias", nutrientes: "N,K,Ca,B,Mo", cor: "#2E7D32" },
  { nome: "Alface", temp: "15–25°C", ph: "6,0–6,8", colheita: "30–70 dias", nutrientes: "N,K,Ca", cor: "#66BB6A" },
  { nome: "Tomate", temp: "20–27°C", ph: "5,5–6,8", colheita: "90–120 dias", nutrientes: "N,P,K,Ca,Mg,B", cor: "#EF5350" },
  { nome: "Repolho", temp: "15–24°C", ph: "6,0–6,8", colheita: "80–120 dias", nutrientes: "N,K,Ca,B,Mo", cor: "#558B2F" },
  { nome: "Salsa", temp: "10–24°C", ph: "5,8–6,8", colheita: "60–90 dias", nutrientes: "N,K,Ca", cor: "#43A047" },
  { nome: "Coentro", temp: "18–30°C", ph: "6,0–7,0", colheita: "30–60 dias", nutrientes: "N,P,K", cor: "#388E3C" },
  { nome: "Morango", temp: "13–26°C", ph: "5,5–6,5", colheita: "60–90 dias", nutrientes: "N,K,Ca,Mg,B", cor: "#E53935" },
  { nome: "Caqui", temp: "Subtropical", ph: "5,5–6,5", colheita: "36–60 meses", nutrientes: "N,K,Ca,Mg", cor: "#FF6F00" },
  { nome: "Amora-preta", temp: "Clima ameno", ph: "5,5–6,5", colheita: "12–24 meses", nutrientes: "N,K,Ca,Mg", cor: "#6A1B9A" },
  { nome: "Framboesa", temp: "Ameno/frio", ph: "5,5–6,5", colheita: "12–24 meses", nutrientes: "N,K,Ca,Mg", cor: "#AD1457" },
  { nome: "Figo", temp: "Subtropical", ph: "5,5–6,5", colheita: "12–24 meses", nutrientes: "N,K,Ca,Mg", cor: "#6D4C41" },
  { nome: "Pêra", temp: "Temperado", ph: "5,5–6,5", colheita: "36–60 meses", nutrientes: "N,K,Ca,B,Zn", cor: "#F9A825" },
  { nome: "Inhame", temp: "25–30°C", ph: "5,5–6,5", colheita: "210–300 dias", nutrientes: "N,P,K,Ca,Mg", cor: "#795548" },
  { nome: "Batata-doce", temp: "20–30°C", ph: "5,5–6,5", colheita: "90–150 dias", nutrientes: "K,N,P,Ca", cor: "#E65100" },
  { nome: "Mandioca/Aipim", temp: "20–30°C", ph: "5,5–6,5", colheita: "240–540 dias", nutrientes: "K,N,P,Ca,Mg", cor: "#F57F17" },
];

const CLIMA_DETALHADO = [
  {
    nome: "Café Arábica",
    cor: "#4E342E",
    emoji: "☕",
    tempMin: 18, tempIdeal: 21, tempMax: 23,
    umidade: 70, precipitacao: 1400,
    luminosidade: "Alta, boa distribuição de luz",
    geada: true, seca: true,
  },
  {
    nome: "Alface",
    cor: "#66BB6A",
    emoji: "🥬",
    tempMin: 15, tempIdeal: 20, tempMax: 25,
    umidade: 70, precipitacao: 800,
    luminosidade: "Boa luminosidade, evitar calor extremo",
    geada: false, seca: true,
  },
  {
    nome: "Tomate",
    cor: "#EF5350",
    emoji: "🍅",
    tempMin: 20, tempIdeal: 24, tempMax: 27,
    umidade: 65, precipitacao: 1000,
    luminosidade: "Alta",
    geada: true, seca: true,
  },
  {
    nome: "Mandioca/Aipim",
    cor: "#F57F17",
    emoji: "🌾",
    tempMin: 20, tempIdeal: 25, tempMax: 30,
    umidade: 65, precipitacao: 1000,
    luminosidade: "Alta",
    geada: true, seca: false,
  },
];

const IRRIGACAO_DETALHADA = [
  {
    nome: "Café Arábica", cor: "#4E342E", emoji: "☕",
    fase: "Implantação e produção",
    mmDia: 4,
    frequencia: "2 a 3 vezes por semana em períodos secos",
    tipo: "Gotejamento ou aspersão controlada",
    riscoExcesso: "Podridão radicular",
    riscoFalta: "Abortamento floral e queda de produtividade",
  },
  {
    nome: "Alface", cor: "#66BB6A", emoji: "🥬",
    fase: "Todo ciclo",
    mmDia: 3,
    frequencia: "Diária ou conforme umidade do solo",
    tipo: "Gotejamento, microaspersão ou hidroponia",
    riscoExcesso: "Podridões e doenças foliares",
    riscoFalta: "Murcha e folhas amargas",
  },
  {
    nome: "Tomate", cor: "#EF5350", emoji: "🍅",
    fase: "Floração e frutificação",
    mmDia: 5,
    frequencia: "Diária ou em dias alternados",
    tipo: "Gotejamento",
    riscoExcesso: "Requeima, rachadura de frutos e podridão",
    riscoFalta: "Abortamento floral e frutos pequenos",
  },
  {
    nome: "Mandioca/Aipim", cor: "#F57F17", emoji: "🌾",
    fase: "Pegamento das manivas e formação de raízes",
    mmDia: 3,
    frequencia: "Semanal em períodos secos",
    tipo: "Aspersão ou gotejamento",
    riscoExcesso: "Podridão radicular",
    riscoFalta: "Baixo pegamento e redução da produção",
  },
];

const FASES_CULTURAS = [
  {
    nome: "Café Arábica", cor: "#4E342E", emoji: "☕",
    fases: [
      { fase: "Muda", inicio: 0, fim: 180, cor: "#81C784" },
      { fase: "Formação", inicio: 180, fim: 720, cor: "#64B5F6" },
      { fase: "Produção", inicio: 720, fim: 1080, cor: "#FFB74D" },
    ],
    total: 1080,
  },
  {
    nome: "Alface", cor: "#66BB6A", emoji: "🥬",
    fases: [
      { fase: "Germinação", inicio: 0, fim: 7, cor: "#81C784" },
      { fase: "Muda", inicio: 7, fim: 25, cor: "#64B5F6" },
      { fase: "Crescimento vegetativo", inicio: 25, fim: 55, cor: "#FFB74D" },
      { fase: "Colheita", inicio: 30, fim: 70, cor: "#EF9A9A" },
    ],
    total: 70,
  },
  {
    nome: "Tomate", cor: "#EF5350", emoji: "🍅",
    fases: [
      { fase: "Muda", inicio: 0, fim: 30, cor: "#81C784" },
      { fase: "Crescimento vegetativo", inicio: 30, fim: 60, cor: "#64B5F6" },
      { fase: "Floração", inicio: 45, fim: 75, cor: "#FFB74D" },
      { fase: "Frutificação", inicio: 60, fim: 110, cor: "#CE93D8" },
      { fase: "Colheita", inicio: 90, fim: 120, cor: "#EF9A9A" },
    ],
    total: 120,
  },
  {
    nome: "Mandioca/Aipim", cor: "#F57F17", emoji: "🌾",
    fases: [
      { fase: "Pegamento", inicio: 0, fim: 30, cor: "#81C784" },
      { fase: "Crescimento vegetativo", inicio: 30, fim: 120, cor: "#64B5F6" },
      { fase: "Formação de raízes", inicio: 90, fim: 240, cor: "#FFB74D" },
      { fase: "Colheita", inicio: 240, fim: 540, cor: "#EF9A9A" },
    ],
    total: 540,
  },
];

const scriptInsercao = `async function main() {
  for (const item of dadosTecnicos) {
    const cultura = await prisma.culturaAvancada
      .findUnique({
        where: { nomePopular: item.nomePopular }
      });

    if (!cultura) continue;

    await prisma.climaCultura.create({
      data: {
        culturaId: cultura.id,
        ...item.clima
      }
    });

    await prisma.irrigacaoCultura.create({
      data: {
        culturaId: cultura.id,
        ...item.irrigacao
      }
    });

    for (const fase of item.crescimento) {
      await prisma.crescimentoColheita.create({
        data: {
          culturaId: cultura.id,
          ...fase
        }
      });
    }

    for (const nutriente of item.nutrientes) {
      await prisma.nutrienteCultura.create({
        data: {
          culturaId: cultura.id,
          nutriente,
          faseCultura: "Geral"
        }
      });
    }
  }
  console.log("Dados técnicos inseridos.");
}`;

export default function SeedTecnicoScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("objetivo");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1565C0" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#1976D2" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌡️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Seed Técnico — Clima, Irrigação e Fases</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              17 culturas · 4 blocos de dados · Prisma create
            </Text>
          </View>
          <View style={{ backgroundColor: "#0D47A1" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 33</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className="mr-1 py-3 px-3"
            >
              <Text style={{ color: activeTab === tab.id ? "#1565C0" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#1565C0", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── OBJETIVO ─── */}
        {activeTab === "objetivo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Objetivo do Seed Técnico</Text>
            <Text className="text-xs text-muted mb-4">Adicionar dados técnicos detalhados para cada cultura</Text>

            <View style={{ backgroundColor: "#1565C0" }} className="rounded-2xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">O que este seed adiciona?</Text>
              <Text style={{ color: "#90CAF9" }} className="text-xs leading-5">
                Para cada uma das 17 culturas cadastradas, este seed insere dados técnicos detalhados em 4 tabelas relacionadas, permitindo ao AFU gerar recomendações automáticas de plantio, manejo, irrigação e previsão de colheita.
              </Text>
            </View>

            {/* 4 blocos */}
            <Text className="text-sm font-bold text-foreground mb-3">4 Blocos de Dados por Cultura</Text>
            {[
              { tabela: "ClimaCultura", desc: "Temperatura, umidade, precipitação, luminosidade, sensibilidade a geada e seca", cor: "#64B5F6", emoji: "🌡️" },
              { tabela: "IrrigacaoCultura", desc: "Necessidade mm/dia, frequência, tipo recomendado, riscos de excesso e falta", cor: "#81C784", emoji: "💧" },
              { tabela: "CrescimentoColheita", desc: "Fases do ciclo com dias de início e fim (Muda, Vegetativo, Floração, Colheita...)", cor: "#FFB74D", emoji: "📅" },
              { tabela: "NutrienteCultura", desc: "Lista de nutrientes principais por fase (N, P, K, Ca, Mg, B, Zn...)", cor: "#CE93D8", emoji: "🌿" },
            ].map((b) => (
              <View key={b.tabela} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: b.cor + "40" }}>
                <View style={{ backgroundColor: b.cor + "15" }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{b.emoji}</Text>
                  <Text style={{ color: b.cor }} className="text-sm font-bold">{b.tabela}</Text>
                </View>
                <View className="p-3 bg-surface">
                  <Text className="text-xs text-muted">{b.desc}</Text>
                </View>
              </View>
            ))}

            {/* Resultado */}
            <View className="rounded-xl overflow-hidden mt-2" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1565C015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Resultado: Recomendações automáticas para</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap">
                {["Plantio", "Manejo", "Irrigação", "Previsão de colheita", "Nutrição", "Clima ideal", "Fase atual"].map((r) => (
                  <View key={r} style={{ backgroundColor: "#E3F2FD" }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">{r}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── CULTURAS ─── */}
        {activeTab === "culturas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dados Resumidos por Cultura</Text>
            <Text className="text-xs text-muted mb-4">17 culturas · Temperatura · pH · Colheita · Nutrientes</Text>

            {CULTURAS_RESUMO.map((c, i) => (
              <View key={c.nome} className="mb-2 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: c.cor + "30" }}>
                <View style={{ backgroundColor: c.cor + "15" }} className="flex-row items-center px-3 py-2">
                  <View style={{ backgroundColor: c.cor, width: 24, height: 24 }} className="rounded-full items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{i + 1}</Text>
                  </View>
                  <Text style={{ color: c.cor }} className="text-sm font-bold flex-1">{c.nome}</Text>
                </View>
                <View className="px-3 py-2 bg-surface">
                  <View className="flex-row flex-wrap gap-1">
                    <View style={{ backgroundColor: "#FFEBEE" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: "#C62828" }} className="text-xs">🌡️ {c.temp}</Text>
                    </View>
                    <View style={{ backgroundColor: "#E8F5E9" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">pH {c.ph}</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFF8E1" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: "#E65100" }} className="text-xs">🌾 {c.colheita}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted mt-1">Nutrientes: <Text className="font-semibold text-foreground">{c.nutrientes}</Text></Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── CLIMA ─── */}
        {activeTab === "clima" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dados de Clima</Text>
            <Text className="text-xs text-muted mb-4">4 exemplos detalhados · Temperatura · Umidade · Precipitação</Text>

            <View style={{ backgroundColor: "#1565C015", borderWidth: 1, borderColor: "#1565C040" }} className="rounded-xl p-3 mb-4">
              <Text style={{ color: "#1565C0" }} className="text-xs font-bold mb-1">Modelo ClimaCultura</Text>
              <Text className="text-xs text-muted">temperaturaMinima · temperaturaIdeal · temperaturaMaxima · umidadeIdeal · precipitacaoIdeal · luminosidade · sensibilidadeGeada · sensibilidadeSeca</Text>
            </View>

            {CLIMA_DETALHADO.map((c) => (
              <View key={c.nome} className="mb-4 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: c.cor + "40" }}>
                <View style={{ backgroundColor: c.cor }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{c.emoji}</Text>
                  <Text className="text-white text-sm font-bold">{c.nome}</Text>
                </View>
                <View className="p-4 bg-surface">
                  {/* Temperatura */}
                  <Text className="text-xs font-bold text-foreground mb-2">Temperatura</Text>
                  <View className="flex-row gap-2 mb-3">
                    <View style={{ backgroundColor: "#E3F2FD", flex: 1 }} className="rounded-lg p-2 items-center">
                      <Text style={{ color: "#1565C0" }} className="text-xs text-muted">Mínima</Text>
                      <Text style={{ color: "#1565C0" }} className="text-base font-bold">{c.tempMin}°C</Text>
                    </View>
                    <View style={{ backgroundColor: "#E8F5E9", flex: 1 }} className="rounded-lg p-2 items-center">
                      <Text style={{ color: "#2E7D32" }} className="text-xs text-muted">Ideal</Text>
                      <Text style={{ color: "#2E7D32" }} className="text-base font-bold">{c.tempIdeal}°C</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFEBEE", flex: 1 }} className="rounded-lg p-2 items-center">
                      <Text style={{ color: "#C62828" }} className="text-xs text-muted">Máxima</Text>
                      <Text style={{ color: "#C62828" }} className="text-base font-bold">{c.tempMax}°C</Text>
                    </View>
                  </View>
                  {/* Outros dados */}
                  {[
                    { label: "Umidade ideal", value: `${c.umidade}%`, cor: "#64B5F6" },
                    { label: "Precipitação ideal", value: `${c.precipitacao} mm/ano`, cor: "#81C784" },
                    { label: "Luminosidade", value: c.luminosidade, cor: "#FFB74D" },
                  ].map((d) => (
                    <View key={d.label} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                      <View style={{ backgroundColor: d.cor + "20", minWidth: 120 }} className="rounded px-2 py-0.5 mr-2">
                        <Text style={{ color: d.cor }} className="text-xs">{d.label}</Text>
                      </View>
                      <Text className="text-xs text-foreground flex-1">{d.value}</Text>
                    </View>
                  ))}
                  {/* Sensibilidades */}
                  <View className="flex-row gap-2 mt-2">
                    <View style={{ backgroundColor: c.geada ? "#FFEBEE" : "#E8F5E9" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: c.geada ? "#C62828" : "#2E7D32" }} className="text-xs font-semibold">
                        {c.geada ? "⚠️ Sensível a geada" : "✓ Tolerante a geada"}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: c.seca ? "#FFEBEE" : "#E8F5E9" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: c.seca ? "#C62828" : "#2E7D32" }} className="text-xs font-semibold">
                        {c.seca ? "⚠️ Sensível a seca" : "✓ Tolerante a seca"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── IRRIGAÇÃO ─── */}
        {activeTab === "irrigacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dados de Irrigação</Text>
            <Text className="text-xs text-muted mb-4">4 exemplos · mm/dia · Frequência · Riscos</Text>

            <View style={{ backgroundColor: "#1565C015", borderWidth: 1, borderColor: "#1565C040" }} className="rounded-xl p-3 mb-4">
              <Text style={{ color: "#1565C0" }} className="text-xs font-bold mb-1">Modelo IrrigacaoCultura</Text>
              <Text className="text-xs text-muted">faseCultura · necessidadeAguaMmDia · frequenciaIrrigacao · tipoIrrigacaoRecomendada · riscoExcessoAgua · riscoFaltaAgua</Text>
            </View>

            {IRRIGACAO_DETALHADA.map((c) => (
              <View key={c.nome} className="mb-4 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: c.cor + "40" }}>
                <View style={{ backgroundColor: c.cor }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{c.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-bold">{c.nome}</Text>
                    <Text style={{ color: "rgba(255,255,255,0.8)" }} className="text-xs">{c.fase}</Text>
                  </View>
                  <View style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="rounded-full px-3 py-1">
                    <Text className="text-white text-sm font-bold">{c.mmDia} mm/dia</Text>
                  </View>
                </View>
                <View className="p-4 bg-surface">
                  {[
                    { label: "Frequência", value: c.frequencia, cor: "#64B5F6" },
                    { label: "Tipo recomendado", value: c.tipo, cor: "#81C784" },
                  ].map((d) => (
                    <View key={d.label} className="flex-row items-start py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                      <View style={{ backgroundColor: d.cor + "20", minWidth: 120 }} className="rounded px-2 py-0.5 mr-2">
                        <Text style={{ color: d.cor }} className="text-xs">{d.label}</Text>
                      </View>
                      <Text className="text-xs text-foreground flex-1">{d.value}</Text>
                    </View>
                  ))}
                  <View className="flex-row gap-2 mt-3">
                    <View style={{ backgroundColor: "#FFEBEE", flex: 1 }} className="rounded-lg p-2">
                      <Text style={{ color: "#C62828" }} className="text-xs font-bold mb-1">⚠️ Excesso de água</Text>
                      <Text style={{ color: "#888" }} className="text-xs">{c.riscoExcesso}</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFF8E1", flex: 1 }} className="rounded-lg p-2">
                      <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-1">⚠️ Falta de água</Text>
                      <Text style={{ color: "#888" }} className="text-xs">{c.riscoFalta}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── FASES ─── */}
        {activeTab === "fases" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Fases de Crescimento</Text>
            <Text className="text-xs text-muted mb-4">4 exemplos · Timeline visual · Dias por fase</Text>

            <View style={{ backgroundColor: "#1565C015", borderWidth: 1, borderColor: "#1565C040" }} className="rounded-xl p-3 mb-4">
              <Text style={{ color: "#1565C0" }} className="text-xs font-bold mb-1">Modelo CrescimentoColheita</Text>
              <Text className="text-xs text-muted">culturaId · fase · diasInicio · diasFim</Text>
            </View>

            {FASES_CULTURAS.map((c) => (
              <View key={c.nome} className="mb-4 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: c.cor + "40" }}>
                <View style={{ backgroundColor: c.cor + "15" }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{c.emoji}</Text>
                  <View className="flex-1">
                    <Text style={{ color: c.cor }} className="text-sm font-bold">{c.nome}</Text>
                    <Text className="text-xs text-muted">Ciclo total: {c.total} dias</Text>
                  </View>
                </View>
                <View className="p-4 bg-surface">
                  {c.fases.map((f) => {
                    const largura = ((f.fim - f.inicio) / c.total) * 100;
                    const offset = (f.inicio / c.total) * 100;
                    return (
                      <View key={f.fase} className="mb-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-xs font-semibold text-foreground">{f.fase}</Text>
                          <Text className="text-xs text-muted">Dias {f.inicio}–{f.fim}</Text>
                        </View>
                        <View style={{ backgroundColor: "#F0F0F0", height: 12, borderRadius: 6, overflow: "hidden" }}>
                          <View style={{ backgroundColor: f.cor, height: 12, borderRadius: 6, width: `${Math.min(largura, 100)}%`, marginLeft: `${Math.min(offset, 80)}%` }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Expansão */}
            <View style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#FFB74D" }} className="rounded-xl p-3">
              <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-2">Próxima expansão — 13 culturas restantes</Text>
              <View className="flex-row flex-wrap">
                {["Couve-flor", "Brócolis", "Repolho", "Salsa", "Coentro", "Morango", "Caqui", "Amora-preta", "Framboesa", "Figo", "Pêra", "Inhame", "Batata-doce"].map((nome) => (
                  <View key={nome} style={{ backgroundColor: "#FFB74D20" }} className="rounded-full px-2 py-0.5 mr-1 mb-1">
                    <Text style={{ color: "#E65100" }} className="text-xs">{nome}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── SCRIPT ─── */}
        {activeTab === "script" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Script de Inserção</Text>
            <Text className="text-xs text-muted mb-4">Prisma create · 4 tabelas · Loop por cultura</Text>

            {/* Diferença do seed anterior */}
            <View style={{ backgroundColor: "#1565C0" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-1">Diferença do Seed 32 (culturas)</Text>
              <Text style={{ color: "#90CAF9" }} className="text-xs leading-5">
                O Seed 32 usou <Text style={{ color: "#FFB74D" }}>upsert</Text> para as culturas base. Este seed usa <Text style={{ color: "#FFB74D" }}>create</Text> para os dados técnicos relacionados, pois cada cultura pode ter múltiplas fases e nutrientes. Primeiro busca a cultura pelo nome, depois insere os dados nas 4 tabelas filhas.
              </Text>
            </View>

            {/* Script */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1A1A2E" }} className="flex-row items-center justify-between p-3">
                <Text style={{ color: "#64B5F6" }} className="text-xs font-bold">seed-dados-tecnicos.ts</Text>
                <View style={{ backgroundColor: "#1565C0" }} className="rounded px-2 py-0.5">
                  <Text className="text-white text-xs">TypeScript</Text>
                </View>
              </View>
              <View style={{ backgroundColor: "#1A1A2E" }} className="p-4">
                <Text style={{ color: "#A5D6A7", fontFamily: "monospace", fontSize: 11, lineHeight: 18 }}>
                  {scriptInsercao}
                </Text>
              </View>
            </View>

            {/* Fluxo */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1565C015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Fluxo de Inserção</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { step: "1", desc: "Busca a cultura pelo nomePopular", cor: "#64B5F6" },
                  { step: "2", desc: "Se não encontrar, pula (continue)", cor: "#EF9A9A" },
                  { step: "3", desc: "Cria registro em ClimaCultura", cor: "#81C784" },
                  { step: "4", desc: "Cria registro em IrrigacaoCultura", cor: "#64B5F6" },
                  { step: "5", desc: "Loop: cria cada fase em CrescimentoColheita", cor: "#FFB74D" },
                  { step: "6", desc: "Loop: cria cada nutriente em NutrienteCultura", cor: "#CE93D8" },
                ].map((s) => (
                  <View key={s.step} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: s.cor, width: 24, height: 24 }} className="rounded-full items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{s.step}</Text>
                    </View>
                    <Text className="text-xs text-foreground flex-1">{s.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
