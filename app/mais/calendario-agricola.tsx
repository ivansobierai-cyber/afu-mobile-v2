import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "funcoes", label: "Funções" },
  { id: "culturas", label: "Culturas" },
  { id: "regional", label: "Regional" },
  { id: "manejo", label: "Manejo" },
  { id: "pos-colheita", label: "Pós-Colheita" },
  { id: "ia-alertas", label: "IA & Alertas" },
];

const ATIVIDADES = [
  { a: "Plantio", emoji: "🌱", cor: "#2E7D32" },
  { a: "Transplante", emoji: "🪴", cor: "#388E3C" },
  { a: "Irrigação", emoji: "💧", cor: "#0288D1" },
  { a: "Adubação", emoji: "🌿", cor: "#F57F17" },
  { a: "Pulverização", emoji: "💨", cor: "#880E4F" },
  { a: "Capina", emoji: "🌾", cor: "#795548" },
  { a: "Poda", emoji: "✂️", cor: "#546E7A" },
  { a: "Tutoramento", emoji: "🪵", cor: "#6D4C41" },
  { a: "Polinização", emoji: "🐝", cor: "#F9A825" },
  { a: "Colheita", emoji: "🧺", cor: "#E53935" },
  { a: "Pós-colheita", emoji: "📦", cor: "#1565C0" },
  { a: "Replantio", emoji: "🔄", cor: "#00838F" },
  { a: "Rotação", emoji: "🔃", cor: "#4527A0" },
];

const PRIORIDADES = [
  { p: "Crítica", cor: "#C62828", bg: "#FFEBEE", exemplos: ["Controle de praga severa", "Geada prevista", "Falta de irrigação"] },
  { p: "Alta", cor: "#E65100", bg: "#FBE9E7", exemplos: ["Adubação", "Plantio", "Transplante"] },
  { p: "Média", cor: "#F57F17", bg: "#FFF8E1", exemplos: ["Monitoramento", "Poda de formação"] },
  { p: "Baixa", cor: "#2E7D32", bg: "#E8F5E9", exemplos: ["Capina preventiva", "Registro de dados"] },
];

const CALENDARIOS_CULTURA = [
  {
    cultura: "🥬 Alface",
    cor: "#2E7D32",
    dias: [
      { dia: "Dia 0", atividade: "Plantio", tipo: "plantio" },
      { dia: "Dia 7", atividade: "Emergência", tipo: "monitoramento" },
      { dia: "Dia 15", atividade: "Adubação cobertura", tipo: "adubacao" },
      { dia: "Dia 25", atividade: "Monitoramento", tipo: "monitoramento" },
      { dia: "Dia 40", atividade: "Pré-colheita", tipo: "pre-colheita" },
      { dia: "Dia 50", atividade: "Colheita", tipo: "colheita" },
    ],
  },
  {
    cultura: "🍅 Tomate",
    cor: "#E53935",
    dias: [
      { dia: "Dia 0", atividade: "Semeadura", tipo: "plantio" },
      { dia: "Dia 25", atividade: "Transplante", tipo: "transplante" },
      { dia: "Dia 40", atividade: "Tutoramento", tipo: "manejo" },
      { dia: "Dia 50", atividade: "Adubação", tipo: "adubacao" },
      { dia: "Dia 60", atividade: "Floração", tipo: "florada" },
      { dia: "Dia 90", atividade: "Frutificação", tipo: "frutificacao" },
      { dia: "Dia 110", atividade: "Colheita", tipo: "colheita" },
    ],
  },
  {
    cultura: "🍓 Morango",
    cor: "#AD1457",
    dias: [
      { dia: "Dia 0", atividade: "Transplante", tipo: "transplante" },
      { dia: "Dia 15", atividade: "Primeira adubação", tipo: "adubacao" },
      { dia: "Dia 45", atividade: "Floração", tipo: "florada" },
      { dia: "Dia 70", atividade: "Frutificação", tipo: "frutificacao" },
      { dia: "Dia 90", atividade: "Primeira colheita", tipo: "colheita" },
    ],
  },
];

const TIPO_COR: Record<string, string> = {
  plantio: "#2E7D32",
  transplante: "#388E3C",
  adubacao: "#F57F17",
  monitoramento: "#1565C0",
  manejo: "#546E7A",
  florada: "#F48FB1",
  frutificacao: "#E65100",
  colheita: "#C62828",
  "pre-colheita": "#880E4F",
};

export default function CalendarioAgricolaScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("funcoes");
  const [expandedCultura, setExpandedCultura] = useState<string | null>("🥬 Alface");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📅</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Calendário Agrícola Inteligente</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              13 Atividades · Regional · IA · Alertas
            </Text>
          </View>
          <View style={{ backgroundColor: "#0D47A1" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 38</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#1B5E20" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#1B5E20", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── FUNÇÕES ─── */}
        {activeTab === "funcoes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Funções do Calendário</Text>
            <Text className="text-xs text-muted mb-4">13 atividades · 4 prioridades · estrutura de dados</Text>

            {/* 13 Atividades */}
            <Text className="text-sm font-bold text-foreground mb-3">Atividades Programadas</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ATIVIDADES.map((a) => (
                <View key={a.a} style={{ backgroundColor: a.cor + "15", borderWidth: 1, borderColor: a.cor + "30" }} className="rounded-xl px-3 py-2 flex-row items-center gap-1">
                  <Text className="text-sm">{a.emoji}</Text>
                  <Text style={{ color: a.cor }} className="text-xs font-semibold">{a.a}</Text>
                </View>
              ))}
            </View>

            {/* Tabela */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">📋 Tabela: calendario_agricola</Text>
              <View className="flex-row flex-wrap gap-2">
                {["id", "cultura_id", "estado", "municipio", "atividade", "fase", "data_inicio", "data_fim", "prioridade", "observacoes"].map((c) => (
                  <View key={c} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-full px-2 py-1">
                    <Text style={{ color: "#E8F5E9" }} className="text-xs">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Prioridades */}
            <Text className="text-sm font-bold text-foreground mb-3">Classificação de Prioridade</Text>
            {PRIORIDADES.map((p) => (
              <View key={p.p} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: p.cor + "30" }}>
                <View style={{ backgroundColor: p.cor }} className="px-3 py-2 flex-row items-center">
                  <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                    <Text className="text-white text-xs font-bold">{p.p}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: p.bg }} className="p-3 flex-row flex-wrap gap-2">
                  {p.exemplos.map((e) => (
                    <View key={e} style={{ backgroundColor: "white", borderWidth: 1, borderColor: p.cor + "30" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: p.cor }} className="text-xs">{e}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── CULTURAS ─── */}
        {activeTab === "culturas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Calendário por Cultura</Text>
            <Text className="text-xs text-muted mb-4">Timelines dia a dia: Alface · Tomate · Morango</Text>

            {CALENDARIOS_CULTURA.map((c) => (
              <View key={c.cultura} className="mb-4 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: c.cor + "40" }}>
                <TouchableOpacity
                  onPress={() => setExpandedCultura(expandedCultura === c.cultura ? null : c.cultura)}
                  style={{ backgroundColor: c.cor }}
                  className="px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className="text-white text-sm font-bold">{c.cultura}</Text>
                  <Text className="text-white text-xs">{expandedCultura === c.cultura ? "▲" : "▼"}</Text>
                </TouchableOpacity>
                {expandedCultura === c.cultura && (
                  <View className="p-4 bg-surface">
                    {c.dias.map((d, idx) => (
                      <View key={idx} className="flex-row items-start mb-3">
                        <View style={{ alignItems: "center", width: 56 }}>
                          <View style={{ backgroundColor: TIPO_COR[d.tipo] || c.cor, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text className="text-white text-xs font-bold">{d.dia}</Text>
                          </View>
                          {idx < c.dias.length - 1 && (
                            <View style={{ width: 2, height: 20, backgroundColor: c.cor + "40", marginTop: 2 }} />
                          )}
                        </View>
                        <View style={{ backgroundColor: (TIPO_COR[d.tipo] || c.cor) + "15", borderWidth: 1, borderColor: (TIPO_COR[d.tipo] || c.cor) + "30", flex: 1, marginLeft: 8 }} className="rounded-lg px-3 py-2">
                          <Text style={{ color: TIPO_COR[d.tipo] || c.cor }} className="text-xs font-bold">{d.atividade}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── REGIONAL ─── */}
        {activeTab === "regional" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Calendário Regional</Text>
            <Text className="text-xs text-muted mb-4">Por município · GeoClima · 5 variáveis climáticas</Text>

            {/* Integração GeoClima */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">🌍 Integração AFU GeoClima</Text>
              <Text style={{ color: "#BBDEFB" }} className="text-xs mb-3">O sistema ajustará automaticamente datas e recomendações por município</Text>
              <View className="flex-row flex-wrap gap-2">
                {["🌡️ Temperatura", "🌧️ Chuvas", "💧 Umidade", "❄️ Geadas", "💨 Ventos"].map((v) => (
                  <View key={v} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#E3F2FD" }} className="text-xs">{v}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Exemplo Penha SC */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D3215" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">📍 Exemplo: Penha (SC)</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="mb-3">
                  <Text className="text-xs font-bold text-foreground mb-1">🥬 Plantio de Alface</Text>
                  <View className="flex-row gap-2">
                    <View style={{ backgroundColor: "#E8F5E9", flex: 1 }} className="rounded-lg p-2">
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">Ano inteiro</Text>
                      <Text className="text-xs text-muted">Possível plantar</Text>
                    </View>
                    <View style={{ backgroundColor: "#C8E6C9", flex: 1 }} className="rounded-lg p-2">
                      <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">Mar–Set</Text>
                      <Text className="text-xs text-muted">Melhor período</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { estado: "SC", culturas: "Alface, Morango, Café, Figo" },
                    { estado: "SP", culturas: "Tomate, Alface, Batata-doce" },
                    { estado: "MG", culturas: "Café, Mandioca, Inhame" },
                    { estado: "RS", culturas: "Morango, Pêra, Amora" },
                  ].map((r) => (
                    <View key={r.estado} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", width: "47%" }} className="rounded-xl p-3">
                      <Text style={{ color: "#1565C0" }} className="text-sm font-bold">{r.estado}</Text>
                      <Text className="text-xs text-muted mt-1">{r.culturas}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Sensores IoT */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F1715" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">📡 Integração com Sensores IoT</Text>
                <Text className="text-xs text-muted">Ajuste automático do calendário</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { s: "Umidade do solo", emoji: "💧", cor: "#0288D1" },
                  { s: "Temperatura", emoji: "🌡️", cor: "#E53935" },
                  { s: "pH", emoji: "⚗️", cor: "#7B1FA2" },
                  { s: "Condutividade elétrica", emoji: "⚡", cor: "#F57F17" },
                ].map((s) => (
                  <View key={s.s} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text className="text-xl mb-1">{s.emoji}</Text>
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── MANEJO ─── */}
        {activeTab === "manejo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Bancos de Manejo</Text>
            <Text className="text-xs text-muted mb-4">Irrigação · Adubação · Pulverizações · Podas · Florada</Text>

            {/* Irrigação */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">💧 Banco de Irrigação</Text>
                <Text style={{ color: "#B3E5FC" }} className="text-xs">Campos: cultura · fase · litros_m2 · frequencia</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { c: "🥬 Alface", litros: "3–5 L/m²/dia", cor: "#2E7D32" },
                  { c: "🍅 Tomate", litros: "4–8 L/m²/dia", cor: "#E53935" },
                  { c: "🍓 Morango", litros: "2–5 L/m²/dia", cor: "#AD1457" },
                ].map((i) => (
                  <View key={i.c} className="flex-row items-center justify-between mb-2 rounded-lg p-2" style={{ backgroundColor: i.cor + "10" }}>
                    <Text style={{ color: i.cor }} className="text-xs font-bold">{i.c}</Text>
                    <View style={{ backgroundColor: i.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{i.litros}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Adubação */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌿 Banco de Adubação — Tomate</Text>
                <Text style={{ color: "#FFF8E1" }} className="text-xs">Campos: cultura · fase · nutriente · dose · frequencia</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { fase: "Vegetativo", nutriente: "Nitrogênio (N)", emoji: "🟢", cor: "#2E7D32" },
                  { fase: "Floração", nutriente: "Fósforo (P)", emoji: "🟡", cor: "#F57F17" },
                  { fase: "Frutificação", nutriente: "Potássio (K)", emoji: "🔴", cor: "#C62828" },
                ].map((a) => (
                  <View key={a.fase} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: a.cor + "10" }}>
                    <Text className="text-lg mr-2">{a.emoji}</Text>
                    <View className="flex-1">
                      <Text style={{ color: a.cor }} className="text-xs font-bold">{a.fase}</Text>
                      <Text className="text-xs text-muted">{a.nutriente}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Pulverizações */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#880E4F30" }}>
              <View style={{ backgroundColor: "#880E4F15" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">💨 Banco de Pulverizações</Text>
                <Text className="text-xs text-muted">Campos: cultura · praga · doenca · epoca_monitoramento · acao_recomendada</Text>
              </View>
            </View>

            {/* Podas */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#54687A30" }}>
              <View style={{ backgroundColor: "#546E7A" }} className="p-3">
                <Text className="text-white text-sm font-bold">✂️ Banco de Podas</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Culturas com poda</Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["☕ Café", "🍑 Figo", "🍐 Pêra", "🫐 Amora", "🍇 Framboesa", "🍑 Caqui"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#ECEFF1", borderWidth: 1, borderColor: "#546E7A30" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#546E7A" }} className="text-xs font-semibold">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Tipos de poda</Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Formação", "Limpeza", "Produção", "Renovação"].map((t) => (
                    <View key={t} style={{ backgroundColor: "#546E7A15", borderWidth: 1, borderColor: "#546E7A30" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#546E7A" }} className="text-xs font-semibold">{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Florada & Frutificação */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#F48FB130" }}>
                <View style={{ backgroundColor: "#F48FB1" }} className="p-2">
                  <Text className="text-white text-xs font-bold">🌸 Florada</Text>
                </View>
                <View className="p-3 bg-surface">
                  <Text className="text-xs text-muted">cultura · epoca · duracao · fatores_climaticos</Text>
                </View>
              </View>
              <View className="flex-1 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E6510030" }}>
                <View style={{ backgroundColor: "#E65100" }} className="p-2">
                  <Text className="text-white text-xs font-bold">🍊 Frutificação</Text>
                </View>
                <View className="p-3 bg-surface">
                  <Text className="text-xs text-muted">cultura · inicio · fim · graus_dia</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── PÓS-COLHEITA ─── */}
        {activeTab === "pos-colheita" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Colheita e Pós-Colheita</Text>
            <Text className="text-xs text-muted mb-4">Indicadores · Armazenamento · Vida útil</Text>

            {/* Indicadores de Colheita */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
              <View style={{ backgroundColor: "#C62828" }} className="p-3">
                <Text className="text-white text-sm font-bold">🧺 Banco de Colheita</Text>
                <Text style={{ color: "#FFCDD2" }} className="text-xs">Campos: cultura · inicio · fim · indicadores</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Indicadores de ponto de colheita</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { i: "Cor", emoji: "🎨", cor: "#7B1FA2" },
                    { i: "Peso", emoji: "⚖️", cor: "#1565C0" },
                    { i: "Tamanho", emoji: "📏", cor: "#2E7D32" },
                    { i: "Brix", emoji: "🍬", cor: "#F57F17" },
                    { i: "Umidade", emoji: "💧", cor: "#0288D1" },
                  ].map((ind) => (
                    <View key={ind.i} style={{ backgroundColor: ind.cor + "15", borderWidth: 1, borderColor: ind.cor + "30", width: "30%" }} className="rounded-xl p-3 items-center">
                      <Text className="text-2xl mb-1">{ind.emoji}</Text>
                      <Text style={{ color: ind.cor }} className="text-xs font-bold">{ind.i}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Pós-Colheita */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📦 Banco Pós-Colheita</Text>
                <Text style={{ color: "#BBDEFB" }} className="text-xs">Campos: cultura · armazenamento · temperatura · umidade · vida_util</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { c: "🍓 Morango", temp: "0°C a 2°C", umidade: "90–95%", vida: "5–10 dias", cor: "#AD1457" },
                  { c: "🥬 Alface", temp: "0°C a 4°C", umidade: "95–100%", vida: "7–14 dias", cor: "#2E7D32" },
                  { c: "🍅 Tomate", temp: "12°C a 18°C", umidade: "85–90%", vida: "7–21 dias", cor: "#E53935" },
                  { c: "☕ Café (cereja)", temp: "Ambiente", umidade: "11–12%", vida: "12 meses", cor: "#4E342E" },
                ].map((p) => (
                  <View key={p.c} className="mb-3 rounded-xl p-3" style={{ backgroundColor: p.cor + "10", borderWidth: 1, borderColor: p.cor + "20" }}>
                    <Text style={{ color: p.cor }} className="text-xs font-bold mb-2">{p.c}</Text>
                    <View className="flex-row gap-2">
                      <View style={{ backgroundColor: "white", flex: 1 }} className="rounded-lg p-2">
                        <Text className="text-xs text-muted">Temperatura</Text>
                        <Text style={{ color: p.cor }} className="text-xs font-bold">{p.temp}</Text>
                      </View>
                      <View style={{ backgroundColor: "white", flex: 1 }} className="rounded-lg p-2">
                        <Text className="text-xs text-muted">Umidade</Text>
                        <Text style={{ color: p.cor }} className="text-xs font-bold">{p.umidade}</Text>
                      </View>
                      <View style={{ backgroundColor: "white", flex: 1 }} className="rounded-lg p-2">
                        <Text className="text-xs text-muted">Vida útil</Text>
                        <Text style={{ color: p.cor }} className="text-xs font-bold">{p.vida}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── IA & ALERTAS ─── */}
        {activeTab === "ia-alertas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">IA, Alertas e Dashboard</Text>
            <Text className="text-xs text-muted mb-4">6 perguntas IA · 4 alertas · Dashboard · Integração</Text>

            {/* Perguntas IA */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">🤖 Perguntas respondidas pela IA</Text>
              {["O que devo fazer hoje?", "Quando irrigar?", "Quando colher?", "Quando adubar?", "Quando podar?", "Há risco climático?"].map((q) => (
                <View key={q} className="flex-row items-center mb-1.5">
                  <View style={{ backgroundColor: "#1565C0", width: 6, height: 6 }} className="rounded-full mr-2" />
                  <Text style={{ color: "#E3F2FD" }} className="text-xs">{q}</Text>
                </View>
              ))}
            </View>

            {/* Alertas */}
            <Text className="text-sm font-bold text-foreground mb-3">Alertas Inteligentes</Text>
            {[
              { tipo: "Plantio", msg: "Condições ideais para plantio.", emoji: "🌱", cor: "#2E7D32", bg: "#E8F5E9" },
              { tipo: "Irrigação", msg: "Solo abaixo da umidade ideal.", emoji: "💧", cor: "#0288D1", bg: "#E1F5FE" },
              { tipo: "Nutrição", msg: "Momento ideal para adubação.", emoji: "🌿", cor: "#F57F17", bg: "#FFF8E1" },
              { tipo: "Colheita", msg: "Janela ideal de colheita iniciada.", emoji: "🧺", cor: "#C62828", bg: "#FFEBEE" },
            ].map((a) => (
              <View key={a.tipo} className="mb-2 rounded-xl p-3 flex-row items-center" style={{ backgroundColor: a.bg, borderWidth: 1, borderColor: a.cor + "30" }}>
                <Text className="text-2xl mr-3">{a.emoji}</Text>
                <View className="flex-1">
                  <Text style={{ color: a.cor }} className="text-xs font-bold">{a.tipo}</Text>
                  <Text className="text-xs text-muted">{a.msg}</Text>
                </View>
              </View>
            ))}

            {/* Notificações */}
            <View className="rounded-xl overflow-hidden mb-4 mt-2" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🔔 Notificações do Aplicativo</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  "📅 Adubação programada para amanhã.",
                  "❄️ Risco de geada em 48 horas.",
                  "🐛 Iniciar monitoramento de pulgões.",
                  "🧺 Colheita recomendada em 5 dias.",
                ].map((n) => (
                  <View key={n} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: "#F5F5F5" }}>
                    <Text className="text-xs text-foreground">{n}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Dashboard */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">📊 Dashboard Calendário</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { ind: "Atividades hoje", n: "3", cor: "#1B5E20" },
                  { ind: "Da semana", n: "12", cor: "#1565C0" },
                  { ind: "Atrasadas", n: "1", cor: "#C62828" },
                  { ind: "Concluídas", n: "28", cor: "#2E7D32" },
                ].map((d) => (
                  <View key={d.ind} style={{ backgroundColor: d.cor + "15", borderWidth: 1, borderColor: d.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: d.cor }} className="text-2xl font-bold">{d.n}</Text>
                    <Text className="text-xs text-muted">{d.ind}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Integração Final */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">🔗 Integração Completa</Text>
              <View className="items-center">
                {["🌱 Cultura", "+", "🌍 Clima", "+", "🪨 Solo", "+", "💧 Irrigação", "+", "🧬 Genética", "+", "📡 Sensores"].map((e, i) => (
                  <Text key={i} style={{ color: e === "+" ? "#A5D6A7" : "white" }} className={e === "+" ? "text-base" : "text-xs font-bold py-0.5"}>{e}</Text>
                ))}
                <View style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-lg px-4 py-2 mt-2">
                  <Text className="text-white text-xs font-bold text-center">→ Orientação diária ao produtor</Text>
                </View>
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-lg p-3 mt-3">
                <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold">Próxima: Etapa 39</Text>
                <Text className="text-white text-xs">AFU Laboratório Digital — análises de solo, foliar, água, sementes, laudos automáticos, QR Code</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
