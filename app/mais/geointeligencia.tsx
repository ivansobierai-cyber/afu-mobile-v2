import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "arquitetura", label: "Arquitetura" },
  { id: "satelites", label: "Satélites" },
  { id: "mapas", label: "Mapas" },
  { id: "drones", label: "Drones" },
  { id: "precisao", label: "Precisão" },
  { id: "dashboard", label: "Dashboard" },
];

const NDVI_CLASSES = [
  { faixa: "0,70 – 1,00", label: "Excelente", cor: "#1B5E20", bg: "#E8F5E9" },
  { faixa: "0,50 – 0,69", label: "Boa", cor: "#2E7D32", bg: "#C8E6C9" },
  { faixa: "0,30 – 0,49", label: "Atenção", cor: "#F57F17", bg: "#FFF8E1" },
  { faixa: "0,00 – 0,29", label: "Crítica", cor: "#C62828", bg: "#FFEBEE" },
];

export default function GeointeligenciaScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("arquitetura");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1A237E" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#283593" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🛰️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU GEO</Text>
            <Text style={{ color: "#9FA8DA" }} className="text-xs">
              Satélite · Drones · Geointeligência · Agricultura de Precisão
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 42</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#1A237E" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#1A237E", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── ARQUITETURA ─── */}
        {activeTab === "arquitetura" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Arquitetura GEO AFU</Text>
            <Text className="text-xs text-muted mb-4">6 módulos · Cadastro geográfico · Banco de talhões</Text>

            {/* 6 Módulos */}
            <Text className="text-sm font-bold text-foreground mb-3">🏗️ Módulos GEO</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { m: "Satélites", emoji: "🛰️", cor: "#1A237E" },
                { m: "Drones", emoji: "🚁", cor: "#1565C0" },
                { m: "Mapas", emoji: "🗺️", cor: "#2E7D32" },
                { m: "Sensores", emoji: "📡", cor: "#F57F17" },
                { m: "Clima", emoji: "🌤️", cor: "#0288D1" },
                { m: "IA Geoespacial", emoji: "🤖", cor: "#7B1FA2" },
              ].map((mod) => (
                <View key={mod.m} style={{ backgroundColor: mod.cor + "15", borderWidth: 1, borderColor: mod.cor + "30", width: "30%" }} className="rounded-xl p-3 items-center">
                  <Text className="text-2xl mb-1">{mod.emoji}</Text>
                  <Text style={{ color: mod.cor }} className="text-xs font-bold text-center">{mod.m}</Text>
                </View>
              ))}
            </View>

            {/* Cadastro Geográfico */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1A237E30" }}>
              <View style={{ backgroundColor: "#1A237E" }} className="p-3">
                <Text className="text-white text-sm font-bold">📍 Tabela: propriedades_geo</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["id", "propriedade_id", "nome_area", "latitude", "longitude", "altitude", "area_hectares", "perimetro", "geometria"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#1A237E30" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#1A237E" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Formatos suportados</Text>
                <View className="flex-row gap-2">
                  {["GeoJSON", "WKT", "KML"].map((f) => (
                    <View key={f} style={{ backgroundColor: "#1A237E", borderRadius: 20, flex: 1 }} className="py-2 items-center">
                      <Text className="text-white text-xs font-bold">{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Banco de Talhões */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌾 Banco de Talhões</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1">
                  {["id", "propriedade_geo_id", "nome_talhao", "area", "cultura", "data_plantio", "status"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── SATÉLITES ─── */}
        {activeTab === "satelites" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Integração com Satélites</Text>
            <Text className="text-xs text-muted mb-4">Sentinel-2 · Landsat · Copernicus · NDVI · NDRE · EVI</Text>

            {/* Fontes */}
            <View style={{ backgroundColor: "#1A237E" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🛰️ Fontes de Dados</Text>
              <View className="flex-row gap-2">
                {["Sentinel-2", "Landsat", "Copernicus"].map((f) => (
                  <View key={f} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-xl p-3 flex-1 items-center">
                    <Text className="text-white text-xs font-bold text-center">{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Dados Coletados */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">📊 Dados Coletados</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { d: "NDVI", emoji: "🌿", cor: "#2E7D32" },
                  { d: "NDRE", emoji: "🍃", cor: "#558B2F" },
                  { d: "EVI", emoji: "🌱", cor: "#1B5E20" },
                  { d: "Temperatura", emoji: "🌡️", cor: "#C62828" },
                  { d: "Umidade estimada", emoji: "💧", cor: "#0288D1" },
                  { d: "Cobertura vegetal", emoji: "🌾", cor: "#F57F17" },
                ].map((d) => (
                  <View key={d.d} style={{ backgroundColor: d.cor + "15", borderWidth: 1, borderColor: d.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                    <Text className="text-xl">{d.emoji}</Text>
                    <Text style={{ color: d.cor }} className="text-xs font-bold">{d.d}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* NDVI */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌿 Índice NDVI (Escala -1 a +1)</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs text-muted mb-2">Saúde da vegetação · Biomassa · Vigor vegetativo</Text>
                {NDVI_CLASSES.map((n) => (
                  <View key={n.label} className="flex-row items-center justify-between mb-2 rounded-lg px-3 py-2" style={{ backgroundColor: n.bg, borderWidth: 1, borderColor: n.cor + "30" }}>
                    <Text style={{ color: n.cor }} className="text-xs font-mono font-bold">{n.faixa}</Text>
                    <View style={{ backgroundColor: n.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{n.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* NDRE e EVI */}
            <View className="flex-row gap-2">
              <View className="rounded-xl overflow-hidden flex-1" style={{ borderWidth: 1, borderColor: "#558B2F30" }}>
                <View style={{ backgroundColor: "#558B2F" }} className="p-2">
                  <Text className="text-white text-xs font-bold">🍃 NDRE</Text>
                </View>
                <View className="p-3 bg-surface">
                  <Text className="text-xs text-foreground mb-1">Nitrogênio · Estresse nutricional</Text>
                  <Text style={{ color: "#558B2F" }} className="text-xs font-semibold">Tomate · Café · Morango · Brócolis</Text>
                </View>
              </View>
              <View className="rounded-xl overflow-hidden flex-1" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
                <View style={{ backgroundColor: "#1B5E20" }} className="p-2">
                  <Text className="text-white text-xs font-bold">🌱 EVI</Text>
                </View>
                <View className="p-3 bg-surface">
                  <Text className="text-xs text-foreground mb-1">Vegetação densa</Text>
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-semibold">Alta precisão</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── MAPAS ─── */}
        {activeTab === "mapas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Mapas AFU</Text>
            <Text className="text-xs text-muted mb-4">7 tipos de mapa · Banco de imagens temporais</Text>

            {/* 7 Tipos de Mapa */}
            <Text className="text-sm font-bold text-foreground mb-3">🗺️ Tipos de Mapa</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { t: "Vigor", emoji: "💪", cor: "#2E7D32" },
                { t: "Produtividade", emoji: "📦", cor: "#F57F17" },
                { t: "Nutricional", emoji: "🧪", cor: "#7B1FA2" },
                { t: "Hídrico", emoji: "💧", cor: "#0288D1" },
                { t: "Pragas", emoji: "🐛", cor: "#C62828" },
                { t: "Doenças", emoji: "🦠", cor: "#E65100" },
                { t: "Solo", emoji: "🪨", cor: "#4E342E" },
              ].map((m) => (
                <View key={m.t} style={{ backgroundColor: m.cor + "15", borderWidth: 1, borderColor: m.cor + "30", width: "30%" }} className="rounded-xl p-3 items-center">
                  <Text className="text-2xl mb-1">{m.emoji}</Text>
                  <Text style={{ color: m.cor }} className="text-xs font-bold text-center">Mapa de {m.t}</Text>
                </View>
              ))}
            </View>

            {/* Banco de Imagens Temporais */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1A237E30" }}>
              <View style={{ backgroundColor: "#1A237E" }} className="p-3">
                <Text className="text-white text-sm font-bold">📸 Banco de Imagens Temporais</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["id", "talhao_id", "data", "imagem", "indice", "valor"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#1A237E30" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#1A237E" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#1A237E30" }} className="rounded-xl p-3">
                  <Text style={{ color: "#1A237E" }} className="text-xs font-bold text-center">📊 Permite comparação histórica</Text>
                </View>
              </View>
            </View>

            {/* Mapa de Irrigação */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">💧 Mapa de Irrigação</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["Umidade", "Clima", "Evapotranspiração"].map((v) => (
                    <View key={v} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#0288D1" }} className="text-xs font-semibold">{v}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-2">
                  {[
                    { a: "Áreas secas", cor: "#C62828" },
                    { a: "Adequadas", cor: "#2E7D32" },
                    { a: "Encharcadas", cor: "#0288D1" },
                  ].map((a) => (
                    <View key={a.a} style={{ backgroundColor: a.cor + "15", borderWidth: 1, borderColor: a.cor + "30", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: a.cor }} className="text-xs font-bold text-center">{a.a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── DRONES ─── */}
        {activeTab === "drones" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Monitoramento por Drone</Text>
            <Text className="text-xs text-muted mb-4">3 equipamentos · 5 missões · Detecção IA</Text>

            {/* Equipamentos */}
            <View style={{ backgroundColor: "#1565C0" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🚁 Equipamentos</Text>
              <View className="flex-row gap-2">
                {[
                  { e: "RGB", emoji: "📷", desc: "Imagem colorida" },
                  { e: "Multiespectral", emoji: "🌈", desc: "NDVI/NDRE" },
                  { e: "Termal", emoji: "🌡️", desc: "Temperatura" },
                ].map((eq) => (
                  <View key={eq.e} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-xl p-3 flex-1 items-center">
                    <Text className="text-2xl mb-1">{eq.emoji}</Text>
                    <Text className="text-white text-xs font-bold">{eq.e}</Text>
                    <Text style={{ color: "#90CAF9" }} className="text-xs text-center">{eq.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Missões */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">🎯 Tipos de Missão</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { m: "Monitoramento", emoji: "👁️", cor: "#1565C0" },
                  { m: "Contagem", emoji: "🔢", cor: "#2E7D32" },
                  { m: "Mapeamento", emoji: "🗺️", cor: "#F57F17" },
                  { m: "Pulverização", emoji: "💦", cor: "#0288D1" },
                  { m: "Inspeção", emoji: "🔍", cor: "#7B1FA2" },
                ].map((ms) => (
                  <View key={ms.m} style={{ backgroundColor: ms.cor + "15", borderWidth: 1, borderColor: ms.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                    <Text className="text-xl">{ms.emoji}</Text>
                    <Text style={{ color: ms.cor }} className="text-xs font-bold">{ms.m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Banco de Missões */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">📋 Banco de Missões</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1">
                  {["id", "drone", "data", "piloto", "area", "objetivo", "resultado"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#F57F17" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Detecção IA */}
            <View className="flex-row gap-2">
              <View className="rounded-xl overflow-hidden flex-1" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
                <View style={{ backgroundColor: "#C62828" }} className="p-2">
                  <Text className="text-white text-xs font-bold">🐛 Detecção de Pragas</Text>
                </View>
                <View className="p-3 bg-surface">
                  {["Manchas", "Desfolha", "Falhas", "Alterações de cor", "Áreas afetadas"].map((d) => (
                    <Text key={d} className="text-xs text-foreground mb-0.5">• {d}</Text>
                  ))}
                  <View style={{ backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#C6282830" }} className="rounded-lg p-2 mt-2">
                    <Text style={{ color: "#C62828" }} className="text-xs font-bold text-center">Mapa de infestação</Text>
                  </View>
                </View>
              </View>
              <View className="rounded-xl overflow-hidden flex-1" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
                <View style={{ backgroundColor: "#7B1FA2" }} className="p-2">
                  <Text className="text-white text-xs font-bold">🦠 Detecção de Doenças</Text>
                </View>
                <View className="p-3 bg-surface">
                  {["Padrões visuais", "Histórico", "Clima", "Imagens"].map((d) => (
                    <Text key={d} className="text-xs text-foreground mb-0.5">• {d}</Text>
                  ))}
                  <View style={{ backgroundColor: "#F3E5F5", borderWidth: 1, borderColor: "#7B1FA230" }} className="rounded-lg p-2 mt-2">
                    <Text style={{ color: "#7B1FA2" }} className="text-xs font-bold text-center">Mapa de risco fitossanitário</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── PRECISÃO ─── */}
        {activeTab === "precisao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Agricultura de Precisão</Text>
            <Text className="text-xs text-muted mb-4">Aplicações localizadas · Zoneamento · Mapas de produtividade</Text>

            {/* Aplicações */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🎯 Aplicações Localizadas</Text>
              <View className="flex-row gap-2 mb-3">
                {[
                  { a: "Adubação", emoji: "🧪" },
                  { a: "Irrigação", emoji: "💧" },
                  { a: "Pulverização", emoji: "💦" },
                ].map((ap) => (
                  <View key={ap.a} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-xl p-3 flex-1 items-center">
                    <Text className="text-2xl mb-1">{ap.emoji}</Text>
                    <Text className="text-white text-xs font-bold text-center">{ap.a} localizada</Text>
                  </View>
                ))}
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-xl p-3">
                <Text style={{ color: "#A5D6A7" }} className="text-xs text-center">💰 Economias esperadas: <Text className="text-white font-bold">10% a 40%</Text></Text>
              </View>
            </View>

            {/* Zoneamento */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🗺️ Zoneamento Automático</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs text-muted mb-2">Baseado em: Solo · Clima · Produtividade · NDVI</Text>
                <View className="flex-row gap-2 mb-3">
                  {["Zona A", "Zona B", "Zona C", "Zona D"].map((z, i) => {
                    const cores = ["#2E7D32", "#F57F17", "#C62828", "#7B1FA2"];
                    return (
                      <View key={z} style={{ backgroundColor: cores[i] + "15", borderWidth: 1, borderColor: cores[i] + "30", flex: 1 }} className="rounded-xl p-2 items-center">
                        <Text style={{ color: cores[i] }} className="text-xs font-bold">{z}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Mapa de Produtividade */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📦 Mapa de Produtividade</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["Colheita", "Clima", "Solo", "Genética"].map((v) => (
                    <View key={v} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">{v}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-2">
                  {["Toneladas/hectare", "Sacas/hectare"].map((s) => (
                    <View key={s} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: "#1565C0" }} className="text-xs font-bold text-center">{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dashboard GEO</Text>
            <Text className="text-xs text-muted mb-4">5 KPIs · 4 perguntas IA · 4 alertas · 13 módulos concluídos</Text>

            {/* KPIs */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { k: "Área monitorada", emoji: "📐", cor: "#1A237E" },
                { k: "NDVI médio", emoji: "🌿", cor: "#2E7D32" },
                { k: "Áreas críticas", emoji: "⚠️", cor: "#C62828" },
                { k: "Produtividade estimada", emoji: "📦", cor: "#F57F17" },
                { k: "Alertas ativos", emoji: "🔔", cor: "#7B1FA2" },
              ].map((k) => (
                <View key={k.k} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-2xl mb-1">{k.emoji}</Text>
                  <Text style={{ color: k.cor }} className="text-xs font-bold">{k.k}</Text>
                </View>
              ))}
            </View>

            {/* Perguntas IA */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0D47A130" }}>
              <View style={{ backgroundColor: "#0D47A1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🤖 Perguntas respondidas pela IA</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  "Onde está a área mais produtiva?",
                  "Onde há estresse hídrico?",
                  "Onde há risco de doença?",
                  "Qual talhão precisa de atenção?",
                ].map((q, i) => (
                  <View key={i} className="flex-row items-start mb-2">
                    <View style={{ backgroundColor: "#0D47A1", width: 18, height: 18, borderRadius: 9, marginRight: 8, marginTop: 1 }} className="items-center justify-center">
                      <Text className="text-white text-xs font-bold">{i + 1}</Text>
                    </View>
                    <Text className="text-xs text-foreground flex-1">{q}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Alertas */}
            <View style={{ backgroundColor: "#1A237E" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🔔 Alertas Inteligentes</Text>
              {[
                { a: "Redução de vigor detectada.", emoji: "📉" },
                { a: "Possível deficiência nutricional.", emoji: "⚠️" },
                { a: "Área com baixa umidade.", emoji: "💧" },
                { a: "Risco elevado de ferrugem.", emoji: "🦠" },
              ].map((al) => (
                <View key={al.a} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Text className="text-base mr-2">{al.emoji}</Text>
                  <Text style={{ color: "#E3F2FD" }} className="text-xs font-semibold">{al.a}</Text>
                </View>
              ))}
            </View>

            {/* Status 13 módulos */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">✅ Status AFU — 13 Módulos Concluídos</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["Agronomia", "Solos", "Clima", "Genética", "Irrigação", "Nutrição", "Pragas", "Doenças", "Calendário", "Laboratório", "Economia", "IA Agrônomo", "Geointeligência"].map((m) => (
                    <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-0.5 flex-row items-center gap-1">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">✅</Text>
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{m}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#0D47A115", borderWidth: 1, borderColor: "#0D47A130" }} className="rounded-xl p-3">
                  <Text style={{ color: "#0D47A1" }} className="text-xs font-bold">Próxima: Etapa 43</Text>
                  <Text style={{ color: "#0D47A1" }} className="text-xs">AFU Rede de Sensores IoT e Automação Rural — sensores de solo, estações meteorológicas, automação de irrigação e fertirrigação, fazenda inteligente</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
