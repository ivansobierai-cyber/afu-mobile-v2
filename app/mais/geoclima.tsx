import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "estrutura", label: "Estrutura" },
  { id: "clima", label: "Clima" },
  { id: "altitude", label: "Altitude & Solo" },
  { id: "zoneamento", label: "Zoneamento" },
  { id: "indice", label: "Índice AFU" },
  { id: "calendario", label: "Calendário" },
];

const KOPPEN = [
  { codigo: "Af", desc: "Tropical chuvoso", regiao: "Amazônia, litoral NE", cor: "#1B5E20" },
  { codigo: "Am", desc: "Tropical monção", regiao: "Norte do Brasil", cor: "#2E7D32" },
  { codigo: "Aw", desc: "Tropical savânico", regiao: "Cerrado, Centro-Oeste", cor: "#388E3C" },
  { codigo: "Cfa", desc: "Subtropical úmido", regiao: "Sul do Brasil", cor: "#1565C0" },
  { codigo: "Cfb", desc: "Oceânico temperado", regiao: "Planalto Sul, Serra Gaúcha", cor: "#1976D2" },
  { codigo: "Cwa", desc: "Subtropical seco no inverno", regiao: "SP, MG, GO", cor: "#0288D1" },
  { codigo: "Cwb", desc: "Subtropical altitude", regiao: "Serra da Mantiqueira", cor: "#0097A7" },
  { codigo: "BSh", desc: "Semiárido quente", regiao: "Sertão Nordestino", cor: "#E65100" },
  { codigo: "BSk", desc: "Semiárido frio", regiao: "Campos Gerais PR", cor: "#BF360C" },
];

const BANCOS = [
  { nome: "RegiaoCli matica", campos: "regiao, estado, municipio, classificacao_climatica, altitude_media", emoji: "🗺️", cor: "#1565C0" },
  { nome: "Temperatura", campos: "temperatura_minima, temperatura_media, temperatura_maxima", emoji: "🌡️", cor: "#E53935" },
  { nome: "Chuvas", campos: "precipitacao_anual, mes_chuvoso, mes_seco", emoji: "🌧️", cor: "#1976D2" },
  { nome: "Geadas", campos: "ocorrencia, intensidade, periodo", emoji: "❄️", cor: "#0288D1" },
  { nome: "Estiagem", campos: "risco_estiagem, duracao_media", emoji: "☀️", cor: "#F57F17" },
  { nome: "Altitude", campos: "altitude_minima, altitude_media, altitude_maxima", emoji: "⛰️", cor: "#4E342E" },
  { nome: "RadiacaoSolar", campos: "radiacao_media, horas_sol_ano", emoji: "☀️", cor: "#FF8F00" },
  { nome: "Ventos", campos: "velocidade_media, direcao_predominante", emoji: "💨", cor: "#546E7A" },
];

const ZONEAMENTO_EXEMPLOS = [
  {
    cultura: "Café Arábica",
    emoji: "☕",
    cor: "#4E342E",
    regiao: "Região Serrana SC",
    aptidao: "Excelente",
    altitude: "800 a 1200 m",
    temp: "18°C a 23°C",
    risco: "Baixo",
    obs: "Temperatura amena favorece qualidade da bebida",
  },
  {
    cultura: "Morango",
    emoji: "🍓",
    cor: "#E53935",
    regiao: "Planalto Sul Catarinense",
    aptidao: "Excelente",
    altitude: "700 a 1000 m",
    temp: "15°C a 22°C",
    risco: "Baixo",
    obs: "Clima frio favorece frutificação e qualidade",
  },
  {
    cultura: "Mandioca/Aipim",
    emoji: "🌾",
    cor: "#F57F17",
    regiao: "Litoral Norte SC",
    aptidao: "Excelente",
    altitude: "0 a 200 m",
    temp: "20°C a 30°C",
    risco: "Médio",
    obs: "Tolerante à seca, adapta-se bem ao litoral",
  },
  {
    cultura: "Alface",
    emoji: "🥬",
    cor: "#2E7D32",
    regiao: "Vale do Itajaí SC",
    aptidao: "Boa",
    altitude: "10 a 300 m",
    temp: "15°C a 25°C",
    risco: "Baixo",
    obs: "Ciclo curto permite múltiplos cultivos anuais",
  },
];

const APTIDAO_CORES: Record<string, { bg: string; text: string }> = {
  "Excelente": { bg: "#E8F5E9", text: "#1B5E20" },
  "Boa": { bg: "#E3F2FD", text: "#1565C0" },
  "Moderada": { bg: "#FFF8E1", text: "#E65100" },
  "Limitada": { bg: "#FBE9E7", text: "#BF360C" },
  "Inadequada": { bg: "#FFEBEE", text: "#C62828" },
};

export default function GeoClimaScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("estrutura");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#1565C0" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌍</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU GeoClima</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Banco Climático Nacional · 5.570 municípios · Köppen
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 35</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#0D47A1" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#0D47A1", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── ESTRUTURA ─── */}
        {activeTab === "estrutura" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Estrutura Territorial</Text>
            <Text className="text-xs text-muted mb-4">4 níveis · 5 regiões · 26 estados · 5.570 municípios</Text>

            {/* Pirâmide territorial */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0D47A115" }}>
              <View style={{ backgroundColor: "#0D47A1" }} className="p-3">
                <Text className="text-white text-sm font-bold">Hierarquia Territorial</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { nivel: "N1", nome: "País", exemplo: "Brasil", cor: "#0D47A1", largura: "100%" },
                  { nivel: "N2", nome: "Regiões", exemplo: "Norte · Nordeste · Centro-Oeste · Sudeste · Sul", cor: "#1565C0", largura: "90%" },
                  { nivel: "N3", nome: "Estados", exemplo: "SC · PR · RS · SP · MG · BA · GO...", cor: "#1976D2", largura: "75%" },
                  { nivel: "N4", nome: "Municípios", exemplo: "Meta: 5.570 municípios brasileiros", cor: "#42A5F5", largura: "60%" },
                ].map((n) => (
                  <View key={n.nivel} className="mb-2">
                    <View style={{ backgroundColor: n.cor + "15", borderLeftWidth: 3, borderLeftColor: n.cor }} className="rounded-r-lg p-3">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <View style={{ backgroundColor: n.cor }} className="rounded-full w-6 h-6 items-center justify-center">
                          <Text className="text-white text-xs font-bold">{n.nivel}</Text>
                        </View>
                        <Text style={{ color: n.cor }} className="text-sm font-bold">{n.nome}</Text>
                      </View>
                      <Text className="text-xs text-muted">{n.exemplo}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Köppen */}
            <Text className="text-sm font-bold text-foreground mb-3">Classificação Climática Köppen</Text>
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View className="p-4 bg-surface">
                {KOPPEN.map((k) => (
                  <View key={k.codigo} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: k.cor, minWidth: 40 }} className="rounded-lg h-8 items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{k.codigo}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-foreground">{k.desc}</Text>
                      <Text className="text-xs text-muted">{k.regiao}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Bancos */}
            <Text className="text-sm font-bold text-foreground mb-3">8 Bancos de Dados Climáticos</Text>
            <View className="flex-row flex-wrap gap-2">
              {BANCOS.map((b) => (
                <View key={b.nome} style={{ backgroundColor: b.cor + "15", borderWidth: 1, borderColor: b.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-lg mb-1">{b.emoji}</Text>
                  <Text style={{ color: b.cor }} className="text-xs font-bold mb-1">{b.nome}</Text>
                  <Text className="text-xs text-muted">{b.campos}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── CLIMA ─── */}
        {activeTab === "clima" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Temperatura, Chuvas e Riscos</Text>
            <Text className="text-xs text-muted mb-4">Exemplo Penha-SC · Geadas · Estiagem</Text>

            {/* Exemplo Penha */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-2xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">📍 Penha — SC (Exemplo de Referência)</Text>
              <View className="flex-row gap-2">
                {[
                  { label: "Mínima", valor: "15°C", emoji: "🌡️", bg: "#1565C0" },
                  { label: "Média", valor: "21°C", emoji: "🌤️", bg: "#1976D2" },
                  { label: "Máxima", valor: "30°C", emoji: "🔆", bg: "#E65100" },
                ].map((t) => (
                  <View key={t.label} style={{ backgroundColor: t.bg, flex: 1 }} className="rounded-xl p-3 items-center">
                    <Text className="text-xl mb-1">{t.emoji}</Text>
                    <Text className="text-white text-lg font-bold">{t.valor}</Text>
                    <Text style={{ color: "rgba(255,255,255,0.8)" }} className="text-xs">{t.label}</Text>
                  </View>
                ))}
              </View>
              <View className="mt-3 flex-row gap-2">
                {[
                  { label: "Precipitação", valor: "1.400 mm/ano", emoji: "🌧️" },
                  { label: "Köppen", valor: "Cfa", emoji: "🗺️" },
                  { label: "Altitude", valor: "5 m", emoji: "⛰️" },
                ].map((i) => (
                  <View key={i.label} style={{ backgroundColor: "rgba(255,255,255,0.15)", flex: 1 }} className="rounded-lg p-2 items-center">
                    <Text className="text-sm">{i.emoji}</Text>
                    <Text className="text-white text-xs font-bold">{i.valor}</Text>
                    <Text style={{ color: "rgba(255,255,255,0.7)" }} className="text-xs">{i.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Classificação de chuvas */}
            <Text className="text-sm font-bold text-foreground mb-3">Classificação de Precipitação</Text>
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View className="p-4 bg-surface">
                {[
                  { classe: "Muito baixa", faixa: "< 500 mm/ano", cor: "#C62828", bg: "#FFEBEE" },
                  { classe: "Baixa", faixa: "500–800 mm/ano", cor: "#E65100", bg: "#FBE9E7" },
                  { classe: "Média", faixa: "800–1.200 mm/ano", cor: "#F57F17", bg: "#FFF8E1" },
                  { classe: "Alta", faixa: "1.200–1.800 mm/ano", cor: "#2E7D32", bg: "#E8F5E9" },
                  { classe: "Muito alta", faixa: "> 1.800 mm/ano", cor: "#1565C0", bg: "#E3F2FD" },
                ].map((c) => (
                  <View key={c.classe} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: c.bg, width: 80 }} className="rounded-lg py-1 px-2 mr-3">
                      <Text style={{ color: c.cor }} className="text-xs font-bold text-center">{c.classe}</Text>
                    </View>
                    <Text className="text-xs text-muted">{c.faixa}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Geadas */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D115" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">❄️ Banco de Geadas</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { nivel: "Nula", cor: "#2E7D32", bg: "#E8F5E9" },
                  { nivel: "Baixa", cor: "#1565C0", bg: "#E3F2FD" },
                  { nivel: "Moderada", cor: "#E65100", bg: "#FFF8E1" },
                  { nivel: "Alta", cor: "#C62828", bg: "#FFEBEE" },
                ].map((g) => (
                  <View key={g.nivel} style={{ backgroundColor: g.bg, borderWidth: 1, borderColor: g.cor + "30" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: g.cor }} className="text-xs font-bold">{g.nivel}</Text>
                  </View>
                ))}
                <Text className="text-xs text-muted w-full mt-2">Campos: ocorrencia · intensidade · periodo · municipio</Text>
              </View>
            </View>

            {/* Estiagem */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F1715" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">☀️ Banco de Estiagem</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { nivel: "Muito baixo", cor: "#2E7D32", bg: "#E8F5E9" },
                  { nivel: "Baixo", cor: "#1565C0", bg: "#E3F2FD" },
                  { nivel: "Médio", cor: "#F57F17", bg: "#FFF8E1" },
                  { nivel: "Alto", cor: "#E65100", bg: "#FBE9E7" },
                  { nivel: "Crítico", cor: "#C62828", bg: "#FFEBEE" },
                ].map((e) => (
                  <View key={e.nivel} style={{ backgroundColor: e.bg, borderWidth: 1, borderColor: e.cor + "30" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: e.cor }} className="text-xs font-bold">{e.nivel}</Text>
                  </View>
                ))}
                <Text className="text-xs text-muted w-full mt-2">Campos: risco_estiagem · duracao_media · municipio</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── ALTITUDE & SOLO ─── */}
        {activeTab === "altitude" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Altitude, Radiação e Ventos</Text>
            <Text className="text-xs text-muted mb-4">3 bancos · Aplicações agronômicas</Text>

            {/* Altitude */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#4E342E30" }}>
              <View style={{ backgroundColor: "#4E342E" }} className="p-3">
                <Text className="text-white text-sm font-bold">⛰️ Banco de Altitude</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  {[
                    { label: "Mínima", campo: "altitude_minima", cor: "#4E342E" },
                    { label: "Média", campo: "altitude_media", cor: "#6D4C41" },
                    { label: "Máxima", campo: "altitude_maxima", cor: "#8D6E63" },
                  ].map((a) => (
                    <View key={a.label} style={{ backgroundColor: a.cor + "15", flex: 1 }} className="rounded-lg p-3 items-center">
                      <Text style={{ color: a.cor }} className="text-xs font-bold">{a.label}</Text>
                      <Text className="text-xs text-muted mt-1">{a.campo}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Aplicações</Text>
                {["Café Arábica (800–1200 m)", "Frutíferas temperadas (400–900 m)", "Hortaliças de clima ameno (300–700 m)"].map((a) => (
                  <View key={a} className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: "#4E342E", width: 6, height: 6 }} className="rounded-full mr-2" />
                    <Text className="text-xs text-muted">{a}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Radiação Solar */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#FF8F0030" }}>
              <View style={{ backgroundColor: "#FF8F00" }} className="p-3">
                <Text className="text-white text-sm font-bold">☀️ Banco de Radiação Solar</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  <View style={{ backgroundColor: "#FF8F0015", flex: 1 }} className="rounded-lg p-3">
                    <Text style={{ color: "#FF8F00" }} className="text-xs font-bold">radiacao_media</Text>
                    <Text className="text-xs text-muted">MJ/m²/dia</Text>
                  </View>
                  <View style={{ backgroundColor: "#FF8F0015", flex: 1 }} className="rounded-lg p-3">
                    <Text style={{ color: "#FF8F00" }} className="text-xs font-bold">horas_sol_ano</Text>
                    <Text className="text-xs text-muted">horas/ano</Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Aplicações</Text>
                {["Fotossíntese e produtividade", "Produção de energia solar", "Cálculo de evapotranspiração"].map((a) => (
                  <View key={a} className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: "#FF8F00", width: 6, height: 6 }} className="rounded-full mr-2" />
                    <Text className="text-xs text-muted">{a}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Ventos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#546E7A30" }}>
              <View style={{ backgroundColor: "#546E7A" }} className="p-3">
                <Text className="text-white text-sm font-bold">💨 Banco de Ventos</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  <View style={{ backgroundColor: "#546E7A15", flex: 1 }} className="rounded-lg p-3">
                    <Text style={{ color: "#546E7A" }} className="text-xs font-bold">velocidade_media</Text>
                    <Text className="text-xs text-muted">km/h</Text>
                  </View>
                  <View style={{ backgroundColor: "#546E7A15", flex: 1 }} className="rounded-lg p-3">
                    <Text style={{ color: "#546E7A" }} className="text-xs font-bold">direcao_predominante</Text>
                    <Text className="text-xs text-muted">N/NE/E/SE/S...</Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Aplicações</Text>
                {["Pulverização fitossanitária", "Polinização de culturas", "Avaliação de risco climático"].map((a) => (
                  <View key={a} className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: "#546E7A", width: 6, height: 6 }} className="rounded-full mr-2" />
                    <Text className="text-xs text-muted">{a}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fórmula de integração */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">Integração Cultura × Clima</Text>
              <View className="flex-row flex-wrap gap-1">
                {["Cultura", "+", "Solo", "+", "Clima", "+", "Altitude", "+", "Chuva", "+", "Temperatura", "=", "Índice de Aptidão"].map((item, i) => (
                  <View key={i} style={{ backgroundColor: item === "=" || item === "+" ? "transparent" : "#388E3C" }} className="rounded-full px-2 py-1">
                    <Text style={{ color: item === "=" || item === "+" ? "#A5D6A7" : "#E8F5E9" }} className="text-xs font-bold">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── ZONEAMENTO ─── */}
        {activeTab === "zoneamento" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Zoneamento Agrícola AFU</Text>
            <Text className="text-xs text-muted mb-4">5 níveis de aptidão · 4 exemplos regionais</Text>

            {/* Níveis de aptidão */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#0D47A115" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Escala de Aptidão Agrícola</Text>
              </View>
              <View className="p-4 bg-surface">
                {Object.entries(APTIDAO_CORES).map(([apt, cor]) => (
                  <View key={apt} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: cor.bg, width: 90 }} className="rounded-lg py-1 px-2 mr-3">
                      <Text style={{ color: cor.text }} className="text-xs font-bold text-center">{apt}</Text>
                    </View>
                    <View style={{ backgroundColor: cor.bg, flex: 1, height: 8, borderRadius: 4, overflow: "hidden" }}>
                      <View style={{
                        backgroundColor: cor.text,
                        height: 8,
                        borderRadius: 4,
                        width: apt === "Excelente" ? "100%" : apt === "Boa" ? "80%" : apt === "Moderada" ? "60%" : apt === "Limitada" ? "40%" : "20%"
                      }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Exemplos */}
            <Text className="text-sm font-bold text-foreground mb-3">Exemplos de Zoneamento</Text>
            {ZONEAMENTO_EXEMPLOS.map((z) => {
              const aptCor = APTIDAO_CORES[z.aptidao] ?? { bg: "#F5F5F5", text: "#888" };
              return (
                <View key={z.cultura} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: z.cor + "40" }}>
                  <View style={{ backgroundColor: z.cor }} className="flex-row items-center p-3">
                    <Text className="text-xl mr-2">{z.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-bold">{z.cultura}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)" }} className="text-xs">📍 {z.regiao}</Text>
                    </View>
                    <View style={{ backgroundColor: aptCor.bg }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: aptCor.text }} className="text-xs font-bold">{z.aptidao}</Text>
                    </View>
                  </View>
                  <View className="p-4 bg-surface">
                    <View className="flex-row gap-2 mb-2">
                      <View style={{ backgroundColor: "#4E342E15", flex: 1 }} className="rounded-lg p-2">
                        <Text className="text-xs text-muted">Altitude</Text>
                        <Text className="text-xs font-bold text-foreground">{z.altitude}</Text>
                      </View>
                      <View style={{ backgroundColor: "#E5350015", flex: 1 }} className="rounded-lg p-2">
                        <Text className="text-xs text-muted">Temperatura</Text>
                        <Text className="text-xs font-bold text-foreground">{z.temp}</Text>
                      </View>
                      <View style={{ backgroundColor: "#1565C015", flex: 1 }} className="rounded-lg p-2">
                        <Text className="text-xs text-muted">Risco</Text>
                        <Text className="text-xs font-bold text-foreground">{z.risco}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted italic">{z.obs}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ─── ÍNDICE AFU ─── */}
        {activeTab === "indice" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Índice de Aptidão AFU</Text>
            <Text className="text-xs text-muted mb-4">Escala 0–100 · 6 variáveis · Exemplo IA</Text>

            {/* Fórmula */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-2xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">Fórmula do Índice de Aptidão</Text>
              <View className="gap-1">
                {[
                  { var: "Cultura", peso: "Compatibilidade com o clima local", emoji: "🌱" },
                  { var: "Solo", peso: "Textura, pH, matéria orgânica", emoji: "🌍" },
                  { var: "Clima", peso: "Köppen, temperatura, umidade", emoji: "🌤️" },
                  { var: "Altitude", peso: "Faixa ideal para a cultura", emoji: "⛰️" },
                  { var: "Chuva", peso: "Precipitação anual e distribuição", emoji: "🌧️" },
                  { var: "Temperatura", peso: "Min/média/max vs. exigência", emoji: "🌡️" },
                ].map((v) => (
                  <View key={v.var} style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-lg p-2 flex-row items-center">
                    <Text className="text-base mr-2">{v.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-white text-xs font-bold">{v.var}</Text>
                      <Text style={{ color: "#90CAF9" }} className="text-xs">{v.peso}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Escala */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#0D47A115" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Escala 0–100</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { faixa: "81–100", classe: "Excelente", cor: "#1B5E20", bg: "#E8F5E9", w: "100%" },
                  { faixa: "61–80", classe: "Bom", cor: "#1565C0", bg: "#E3F2FD", w: "80%" },
                  { faixa: "41–60", classe: "Regular", cor: "#F57F17", bg: "#FFF8E1", w: "60%" },
                  { faixa: "21–40", classe: "Baixo", cor: "#E65100", bg: "#FBE9E7", w: "40%" },
                  { faixa: "0–20", classe: "Inadequado", cor: "#C62828", bg: "#FFEBEE", w: "20%" },
                ].map((e) => (
                  <View key={e.faixa} className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center gap-2">
                        <View style={{ backgroundColor: e.bg, borderWidth: 1, borderColor: e.cor + "30" }} className="rounded-full px-2 py-0.5">
                          <Text style={{ color: e.cor }} className="text-xs font-bold">{e.classe}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted">{e.faixa}</Text>
                    </View>
                    <View style={{ backgroundColor: "#F0F0F0", height: 10, borderRadius: 5, overflow: "hidden" }}>
                      <View style={{ backgroundColor: e.cor, height: 10, borderRadius: 5, width: e.w as any }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Exemplo IA */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🤖 Exemplo IA — Penha, SC</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  <View style={{ backgroundColor: "#0D47A115", flex: 1 }} className="rounded-lg p-2">
                    <Text className="text-xs text-muted">Município</Text>
                    <Text className="text-xs font-bold text-foreground">Penha - SC</Text>
                  </View>
                  <View style={{ backgroundColor: "#4E342E15", flex: 1 }} className="rounded-lg p-2">
                    <Text className="text-xs text-muted">Solo</Text>
                    <Text className="text-xs font-bold text-foreground">Franco Arenoso</Text>
                  </View>
                  <View style={{ backgroundColor: "#2E7D3215", flex: 1 }} className="rounded-lg p-2">
                    <Text className="text-xs text-muted">Área</Text>
                    <Text className="text-xs font-bold text-foreground">2 hectares</Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Culturas recomendadas (Índice 85+)</Text>
                <View className="flex-row flex-wrap gap-2">
                  {["🥬 Alface", "🍓 Morango", "🌾 Mandioca", "🍠 Batata-doce", "🌿 Coentro", "🍅 Tomate protegido"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#1B5E20" }} className="text-xs font-semibold">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── CALENDÁRIO ─── */}
        {activeTab === "calendario" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Calendário Agrícola e Eventos</Text>
            <Text className="text-xs text-muted mb-4">Plantio/colheita por estado · 6 eventos · 4 fontes</Text>

            {/* Calendário */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">📅 Banco de Calendário Agrícola</Text>
                <Text className="text-xs text-muted">Campos: cultura · estado · mes_plantio · mes_colheita · risco</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { cultura: "🥬 Alface", plantio: "Ano todo", melhor: "Março a Setembro", colheita: "30–45 dias", cor: "#2E7D32" },
                  { cultura: "🍅 Tomate", plantio: "Ago–Out (Sul)", melhor: "Set–Nov", colheita: "90–120 dias", cor: "#E53935" },
                  { cultura: "🍓 Morango", plantio: "Abr–Jun", melhor: "Maio (Sul)", colheita: "90–120 dias", cor: "#E53935" },
                  { cultura: "☕ Café", plantio: "Out–Dez", melhor: "Nov (MG/SP)", colheita: "Maio–Set", cor: "#4E342E" },
                  { cultura: "🌾 Mandioca", plantio: "Ago–Out", melhor: "Set–Nov", colheita: "12–18 meses", cor: "#F57F17" },
                ].map((c) => (
                  <View key={c.cultura} className="py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <Text style={{ color: c.cor }} className="text-xs font-bold mb-1">{c.cultura}</Text>
                    <View className="flex-row gap-2">
                      <View style={{ backgroundColor: c.cor + "15", flex: 1 }} className="rounded-lg p-1.5">
                        <Text className="text-xs text-muted">Plantio</Text>
                        <Text className="text-xs font-semibold text-foreground">{c.plantio}</Text>
                      </View>
                      <View style={{ backgroundColor: "#1565C015", flex: 1 }} className="rounded-lg p-1.5">
                        <Text className="text-xs text-muted">Melhor época</Text>
                        <Text className="text-xs font-semibold text-foreground">{c.melhor}</Text>
                      </View>
                      <View style={{ backgroundColor: "#E8F5E9", flex: 1 }} className="rounded-lg p-1.5">
                        <Text className="text-xs text-muted">Colheita</Text>
                        <Text className="text-xs font-semibold text-foreground">{c.colheita}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Eventos climáticos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
              <View style={{ backgroundColor: "#C6282815" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">⚠️ Banco de Eventos Climáticos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { evento: "❄️ Geadas", cor: "#0288D1" },
                  { evento: "☀️ Secas", cor: "#F57F17" },
                  { evento: "🌊 Enchentes", cor: "#1565C0" },
                  { evento: "🌨️ Granizo", cor: "#546E7A" },
                  { evento: "⛈️ Tempestades", cor: "#880E4F" },
                  { evento: "🔆 Ondas de calor", cor: "#C62828" },
                ].map((e) => (
                  <View key={e.evento} style={{ backgroundColor: e.cor + "15", borderWidth: 1, borderColor: e.cor + "30" }} className="rounded-full px-3 py-1.5">
                    <Text style={{ color: e.cor }} className="text-xs font-semibold">{e.evento}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fontes técnicas */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#0D47A115" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">📚 Fontes Técnicas</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { fonte: "Embrapa", desc: "Pesquisa agropecuária", cor: "#1B5E20" },
                  { fonte: "INMET", desc: "Meteorologia nacional", cor: "#1565C0" },
                  { fonte: "Epagri", desc: "Pesquisa SC", cor: "#0288D1" },
                  { fonte: "MAPA", desc: "Zoneamento agrícola", cor: "#E65100" },
                ].map((f) => (
                  <View key={f.fonte} style={{ backgroundColor: f.cor + "15", borderWidth: 1, borderColor: f.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: f.cor }} className="text-sm font-bold">{f.fonte}</Text>
                    <Text className="text-xs text-muted">{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Resultado */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">O AFU GeoClima recomendará:</Text>
              <View className="flex-row flex-wrap gap-1">
                {["O que plantar", "Quando plantar", "Como plantar", "Quando irrigar", "Quando colher", "Qual o risco climático", "Qual a produtividade esperada"].map((r) => (
                  <View key={r} style={{ backgroundColor: "#1565C0" }} className="rounded-full px-2 py-1">
                    <Text style={{ color: "#E3F2FD" }} className="text-xs">{r}</Text>
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
