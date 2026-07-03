import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "visao", label: "Visão Geral" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "planejamento", label: "Planejamento" },
  { id: "alertas", label: "Alertas" },
  { id: "integracoes", label: "Integrações" },
  { id: "painel", label: "Painel" },
];

const ESPECIALIDADES = [
  { e: "Agrônomo Virtual", emoji: "👨‍🌾", cor: "#1B5E20" },
  { e: "Consultor Técnico", emoji: "📋", cor: "#1565C0" },
  { e: "Esp. Solos", emoji: "🪨", cor: "#4E342E" },
  { e: "Esp. Irrigação", emoji: "💧", cor: "#0288D1" },
  { e: "Esp. Pragas", emoji: "🐛", cor: "#C62828" },
  { e: "Esp. Nutrição", emoji: "🌿", cor: "#2E7D32" },
  { e: "Esp. Produção", emoji: "📦", cor: "#F57F17" },
  { e: "Esp. Mercado", emoji: "📊", cor: "#7B1FA2" },
];

const FONTES = [
  "Banco de Culturas", "Banco Climático", "Banco de Solos", "Banco Genético",
  "Banco de Irrigação", "Banco de Nutrientes", "Banco de Pragas", "Banco de Doenças",
  "Banco Econômico", "Banco Laboratorial", "Calendário Agrícola",
];

const DIAG_TABS = ["Imagem", "Solo", "Fitossanitário"];

export default function IaAgronomoScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("visao");
  const [diagTab, setDiagTab] = useState("Imagem");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#1565C0" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🤖</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU AI CORE</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Agrônomo Virtual · 8 Especialidades · 24h
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 41</Text>
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

        {/* ─── VISÃO GERAL ─── */}
        {activeTab === "visao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">AFU AI CORE — Agrônomo Virtual</Text>
            <Text className="text-xs text-muted mb-4">8 especialidades · 11 fontes · 3 modos · disponível 24h</Text>

            {/* Especialidades */}
            <Text className="text-sm font-bold text-foreground mb-3">👨‍🌾 Especialidades</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ESPECIALIDADES.map((e) => (
                <View key={e.e} style={{ backgroundColor: e.cor + "15", borderWidth: 1, borderColor: e.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                  <Text className="text-xl">{e.emoji}</Text>
                  <Text style={{ color: e.cor }} className="text-xs font-bold flex-1">{e.e}</Text>
                </View>
              ))}
            </View>

            {/* Fontes de Conhecimento */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0D47A130" }}>
              <View style={{ backgroundColor: "#0D47A1" }} className="p-3">
                <Text className="text-white text-sm font-bold">📚 Fontes de Conhecimento (11)</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {FONTES.map((f) => (
                  <View key={f} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#0D47A1" }} className="text-xs font-semibold">{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 3 Modos */}
            <Text className="text-sm font-bold text-foreground mb-3">⚙️ Modos de Operação</Text>
            {[
              {
                modo: "Consulta",
                emoji: "💬",
                cor: "#2E7D32",
                entrada: "Qual a melhor época para plantar morango?",
                saida: ["Clima ideal", "Solo ideal", "Calendário recomendado"],
              },
              {
                modo: "Diagnóstico",
                emoji: "🔬",
                cor: "#C62828",
                entrada: "Foto da planta",
                saida: ["Doença provável", "Praga provável", "Deficiência nutricional", "Tratamento recomendado"],
              },
              {
                modo: "Planejamento",
                emoji: "📋",
                cor: "#F57F17",
                entrada: "Área · Solo · Cidade · Cultura",
                saida: ["Plano completo de produção"],
              },
            ].map((m) => (
              <View key={m.modo} className="rounded-xl overflow-hidden mb-3" style={{ borderWidth: 1, borderColor: m.cor + "30" }}>
                <View style={{ backgroundColor: m.cor }} className="p-3 flex-row items-center gap-2">
                  <Text className="text-xl">{m.emoji}</Text>
                  <Text className="text-white text-sm font-bold">Modo {m.modo}</Text>
                </View>
                <View className="p-4 bg-surface">
                  <View className="flex-row items-start gap-3">
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: m.cor }} className="text-xs font-bold mb-1">Entrada</Text>
                      <View style={{ backgroundColor: m.cor + "15", borderWidth: 1, borderColor: m.cor + "30" }} className="rounded-lg px-3 py-2">
                        <Text style={{ color: m.cor }} className="text-xs">{m.entrada}</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.muted }} className="text-lg mt-4">→</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: m.cor }} className="text-xs font-bold mb-1">Saída</Text>
                      {m.saida.map((s) => (
                        <View key={s} className="flex-row items-center mb-1">
                          <View style={{ backgroundColor: m.cor, width: 5, height: 5, borderRadius: 3, marginRight: 5 }} />
                          <Text className="text-xs text-foreground">{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── DIAGNÓSTICO ─── */}
        {activeTab === "diagnostico" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Diagnóstico Inteligente</Text>
            <Text className="text-xs text-muted mb-3">Imagem · Solo · Fitossanitário</Text>

            {/* Sub-tabs */}
            <View className="flex-row gap-1 mb-4">
              {DIAG_TABS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setDiagTab(t)}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: diagTab === t ? "#0D47A1" : colors.surface, borderWidth: 1, borderColor: diagTab === t ? "#0D47A1" : colors.border }}
                >
                  <Text style={{ color: diagTab === t ? "white" : colors.muted, fontSize: 11, fontWeight: diagTab === t ? "700" : "400" }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Imagem */}
            {diagTab === "Imagem" && (
              <View>
                <View style={{ backgroundColor: "#7B1FA2" }} className="rounded-xl p-4 mb-4">
                  <Text className="text-white text-sm font-bold mb-3">📸 Partes Analisadas</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { p: "Folha", emoji: "🍃" },
                      { p: "Raiz", emoji: "🌱" },
                      { p: "Caule", emoji: "🌿" },
                      { p: "Flor", emoji: "🌸" },
                      { p: "Fruto", emoji: "🍅" },
                      { p: "Semente", emoji: "🌰" },
                    ].map((pt) => (
                      <View key={pt.p} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-xl px-3 py-2 flex-row items-center gap-1">
                        <Text className="text-sm">{pt.emoji}</Text>
                        <Text className="text-white text-xs font-semibold">{pt.p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text className="text-sm font-bold text-foreground mb-2">🔍 O que a IA detecta</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { d: "Pragas", emoji: "🐛", cor: "#C62828" },
                    { d: "Doenças", emoji: "🦠", cor: "#7B1FA2" },
                    { d: "Deficiências", emoji: "⚠️", cor: "#F57F17" },
                    { d: "Estresse hídrico", emoji: "💧", cor: "#0288D1" },
                    { d: "Fitotoxicidade", emoji: "☠️", cor: "#E65100" },
                  ].map((d) => (
                    <View key={d.d} style={{ backgroundColor: d.cor + "15", borderWidth: 1, borderColor: d.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                      <Text className="text-xl">{d.emoji}</Text>
                      <Text style={{ color: d.cor }} className="text-xs font-bold">{d.d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Solo */}
            {diagTab === "Solo" && (
              <View>
                <View style={{ backgroundColor: "#4E342E" }} className="rounded-xl p-4 mb-4">
                  <Text className="text-white text-sm font-bold mb-2">🪨 Diagnóstico de Solo</Text>
                  <View className="flex-row items-center gap-3">
                    <View style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-xl p-3 flex-1 items-center">
                      <Text className="text-white text-xs font-bold mb-1">Entrada</Text>
                      <Text style={{ color: "#FFCCBC" }} className="text-xs text-center">Laudo laboratorial</Text>
                    </View>
                    <Text className="text-white text-xl">→</Text>
                    <View style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-xl p-3 flex-1">
                      {["Correção", "Adubação", "Potencial produtivo"].map((s) => (
                        <View key={s} className="flex-row items-center mb-1">
                          <View style={{ backgroundColor: "#FF8A65", width: 5, height: 5, borderRadius: 3, marginRight: 5 }} />
                          <Text className="text-white text-xs">{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
                <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#4E342E30" }}>
                  <View style={{ backgroundColor: "#4E342E15" }} className="p-3">
                    <Text className="text-sm font-bold text-foreground">🔧 Irrigação Inteligente</Text>
                  </View>
                  <View className="p-4 bg-surface">
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {["Clima", "Solo", "Cultura", "Fase", "Sensores"].map((v) => (
                        <View key={v} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-3 py-1">
                          <Text style={{ color: "#0288D1" }} className="text-xs font-semibold">{v}</Text>
                        </View>
                      ))}
                    </View>
                    <View className="flex-row gap-2">
                      {["Quando irrigar", "Quanto irrigar", "Qual método"].map((r) => (
                        <View key={r} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", flex: 1 }} className="rounded-xl p-2 items-center">
                          <Text style={{ color: "#1565C0" }} className="text-xs font-bold text-center">{r}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Fitossanitário */}
            {diagTab === "Fitossanitário" && (
              <View>
                <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
                  <View style={{ backgroundColor: "#C62828" }} className="p-3">
                    <Text className="text-white text-sm font-bold">🦠 Diagnóstico Fitossanitário</Text>
                  </View>
                  <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                    {["Pragas", "Doenças", "Nematóides", "Deficiências"].map((d) => (
                      <View key={d} style={{ backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#C6282830" }} className="rounded-full px-3 py-1">
                        <Text style={{ color: "#C62828" }} className="text-xs font-semibold">{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text className="text-sm font-bold text-foreground mb-2">🛡️ Métodos de Controle</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { m: "Biológico", emoji: "🐝", cor: "#2E7D32" },
                    { m: "Orgânico", emoji: "🌿", cor: "#558B2F" },
                    { m: "Convencional", emoji: "🧪", cor: "#1565C0" },
                    { m: "Integrado", emoji: "⚙️", cor: "#F57F17" },
                  ].map((c) => (
                    <View key={c.m} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                      <Text className="text-xl">{c.emoji}</Text>
                      <Text style={{ color: c.cor }} className="text-xs font-bold">{c.m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── PLANEJAMENTO ─── */}
        {activeTab === "planejamento" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Planejamento e Previsões</Text>
            <Text className="text-xs text-muted mb-4">Safra · Produção · Econômica</Text>

            {/* Planejamento de Safra */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">📅 Planejamento de Safra</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  {["Município", "Área", "Cultura"].map((e) => (
                    <View key={e} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{e}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: colors.muted }} className="text-xs text-center mb-2">↓ Gera plano completo</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { s: "Plantio", emoji: "🌱", cor: "#2E7D32" },
                    { s: "Irrigação", emoji: "💧", cor: "#0288D1" },
                    { s: "Adubação", emoji: "🧪", cor: "#F57F17" },
                    { s: "Pulverização", emoji: "🌿", cor: "#7B1FA2" },
                    { s: "Colheita", emoji: "🌾", cor: "#C62828" },
                  ].map((s) => (
                    <View key={s.s} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "30%" }} className="rounded-xl p-2 items-center">
                      <Text className="text-lg">{s.emoji}</Text>
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Previsão de Produção */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📦 Previsão de Produção</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["Solo", "Clima", "Genética", "Histórico"].map((v) => (
                    <View key={v} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">{v}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-2">
                  {[
                    { l: "Mínima", cor: "#C62828" },
                    { l: "Média", cor: "#F57F17" },
                    { l: "Máxima", cor: "#2E7D32" },
                  ].map((p) => (
                    <View key={p.l} style={{ backgroundColor: p.cor + "15", borderWidth: 1, borderColor: p.cor + "30", flex: 1 }} className="rounded-xl p-3 items-center">
                      <Text style={{ color: p.cor }} className="text-xs font-bold">{p.l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Previsão Econômica */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">💰 Previsão Econômica</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { r: "Receita", emoji: "💵", cor: "#2E7D32" },
                  { r: "Custos", emoji: "📊", cor: "#C62828" },
                  { r: "Lucro", emoji: "✅", cor: "#1565C0" },
                  { r: "ROI", emoji: "📈", cor: "#F57F17" },
                  { r: "Riscos", emoji: "⚠️", cor: "#7B1FA2" },
                ].map((r) => (
                  <View key={r.r} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "30", width: "30%" }} className="rounded-xl p-2 items-center">
                    <Text className="text-xl">{r.emoji}</Text>
                    <Text style={{ color: r.cor }} className="text-xs font-bold">{r.r}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── ALERTAS ─── */}
        {activeTab === "alertas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Alertas e Previsão Climática</Text>
            <Text className="text-xs text-muted mb-4">Previsão 24h–30d · Alertas inteligentes · Sensores IoT</Text>

            {/* Previsão Climática */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌤️ Previsão Climática</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["Chuva", "Seca", "Geada", "Granizo", "Ondas de calor"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#0288D1" }} className="text-xs font-semibold">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Horizontes de previsão</Text>
                <View className="flex-row gap-2">
                  {["24h", "72h", "7 dias", "30 dias"].map((h) => (
                    <View key={h} style={{ backgroundColor: "#0288D1", borderRadius: 20, flex: 1 }} className="py-2 items-center">
                      <Text className="text-white text-xs font-bold">{h}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Alertas Inteligentes */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🔔 Alertas Inteligentes</Text>
              {[
                { a: "Risco de geada.", emoji: "❄️", cor: "#90CAF9" },
                { a: "Momento ideal para adubação.", emoji: "🧪", cor: "#A5D6A7" },
                { a: "Alta probabilidade de ferrugem.", emoji: "⚠️", cor: "#FFCC80" },
                { a: "Colheita recomendada.", emoji: "🌾", cor: "#FFAB91" },
              ].map((al) => (
                <View key={al.a} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Text className="text-base mr-2">{al.emoji}</Text>
                  <Text style={{ color: al.cor }} className="text-xs font-semibold">{al.a}</Text>
                </View>
              ))}
            </View>

            {/* Sensores IoT */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">📡 Integração com Sensores IoT</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {[
                    { s: "Umidade", emoji: "💧", cor: "#0288D1" },
                    { s: "Temperatura", emoji: "🌡️", cor: "#C62828" },
                    { s: "pH", emoji: "⚗️", cor: "#7B1FA2" },
                    { s: "Condutividade", emoji: "⚡", cor: "#F57F17" },
                  ].map((s) => (
                    <View key={s.s} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                      <Text className="text-xl">{s.emoji}</Text>
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.s}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-3">
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-bold text-center">→ Gera alertas automáticos</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── INTEGRAÇÕES ─── */}
        {activeTab === "integracoes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Integrações e Aprendizado</Text>
            <Text className="text-xs text-muted mb-4">Voz · WhatsApp · Inteligência evolutiva</Text>

            {/* Assistente por Voz */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
              <View style={{ backgroundColor: "#7B1FA2" }} className="p-3">
                <Text className="text-white text-sm font-bold">🎙️ Assistente por Voz</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  {[
                    { f: "Perguntas faladas", emoji: "🗣️" },
                    { f: "Respostas faladas", emoji: "🔊" },
                  ].map((f) => (
                    <View key={f.f} style={{ backgroundColor: "#F3E5F5", borderWidth: 1, borderColor: "#7B1FA230", flex: 1 }} className="rounded-xl p-3 items-center">
                      <Text className="text-2xl mb-1">{f.emoji}</Text>
                      <Text style={{ color: "#7B1FA2" }} className="text-xs font-bold text-center">{f.f}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Idiomas</Text>
                <View className="flex-row gap-2">
                  {[
                    { i: "Português", flag: "🇧🇷" },
                    { i: "Espanhol", flag: "🇪🇸" },
                    { i: "Inglês", flag: "🇺🇸" },
                  ].map((id) => (
                    <View key={id.i} style={{ backgroundColor: "#F3E5F5", borderWidth: 1, borderColor: "#7B1FA230", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text className="text-xl">{id.flag}</Text>
                      <Text style={{ color: "#7B1FA2" }} className="text-xs font-bold">{id.i}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* WhatsApp */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">💬 Integração WhatsApp</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="items-center">
                  {["Enviar foto", "↓", "Receber diagnóstico", "↓", "Receber recomendações"].map((e, i) => (
                    <View key={i} className={e === "↓" ? "" : "rounded-xl px-4 py-2 mb-1"} style={e === "↓" ? {} : { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }}>
                      <Text style={{ color: e === "↓" ? colors.muted : "#2E7D32" }} className={e === "↓" ? "text-xl py-1" : "text-xs font-bold"}>{e}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Inteligência Evolutiva */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-3">🧠 Inteligência Evolutiva</Text>
              <Text style={{ color: "#90CAF9" }} className="text-xs mb-3">A IA aprenderá continuamente com:</Text>
              {[
                { a: "Diagnósticos validados", emoji: "✅" },
                { a: "Resultados laboratoriais", emoji: "🔬" },
                { a: "Dados de produção", emoji: "📦" },
              ].map((a) => (
                <View key={a.a} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Text className="text-base mr-2">{a.emoji}</Text>
                  <Text style={{ color: "#E3F2FD" }} className="text-xs font-semibold">{a.a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── PAINEL ─── */}
        {activeTab === "painel" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Painel da IA</Text>
            <Text className="text-xs text-muted mb-4">4 KPIs · 3 metas de precisão · resultado</Text>

            {/* KPIs */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { ind: "Consultas realizadas", emoji: "💬", cor: "#1565C0" },
                { ind: "Diagnósticos emitidos", emoji: "🔬", cor: "#7B1FA2" },
                { ind: "Precisão", emoji: "🎯", cor: "#2E7D32" },
                { ind: "Alertas gerados", emoji: "🔔", cor: "#F57F17" },
              ].map((k) => (
                <View key={k.ind} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-2xl mb-1">{k.emoji}</Text>
                  <Text style={{ color: k.cor }} className="text-xs font-bold">{k.ind}</Text>
                </View>
              ))}
            </View>

            {/* Metas de Precisão */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🎯 Metas de Precisão</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { t: "Diagnóstico visual", meta: "90%+", cor: "#7B1FA2" },
                  { t: "Diagnóstico laboratorial", meta: "98%+", cor: "#2E7D32" },
                  { t: "Recomendações", meta: "95%+", cor: "#1565C0" },
                ].map((m) => (
                  <View key={m.t} className="flex-row items-center justify-between mb-2 rounded-lg p-2" style={{ backgroundColor: m.cor + "10" }}>
                    <Text style={{ color: m.cor }} className="text-xs font-bold">{m.t}</Text>
                    <View style={{ backgroundColor: m.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{m.meta}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Resultado */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">✅ Resultado</Text>
              <Text style={{ color: "#90CAF9" }} className="text-xs mb-3">
                O AFU deixa de ser apenas um software agrícola e passa a funcionar como um{" "}
                <Text className="text-white font-bold">Sistema Especialista Agrícola Inteligente</Text>{" "}
                capaz de orientar produtores, técnicos e cooperativas em praticamente todas as decisões agronômicas.
              </Text>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-lg p-3">
                <Text style={{ color: "#90CAF9" }} className="text-xs font-bold">Próxima: Etapa 42</Text>
                <Text className="text-white text-xs">AFU Satélite, Drones e Geointeligência — imagens de satélite, NDVI, mapas de vigor, drones, mapeamento de pragas, agricultura de precisão</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
