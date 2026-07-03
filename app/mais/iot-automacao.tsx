import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "arquitetura", label: "Arquitetura" },
  { id: "sensores-solo", label: "Solo" },
  { id: "sensores-clima", label: "Clima" },
  { id: "automacao", label: "Automação" },
  { id: "alertas", label: "Alertas" },
  { id: "dashboard", label: "Dashboard" },
];

export default function IotAutomacaoScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("arquitetura");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#004D40" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#00695C" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📡</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU IoT</Text>
            <Text style={{ color: "#80CBC4" }} className="text-xs">
              Sensores · Automação · Irrigação · Fazenda Inteligente
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 43</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#004D40" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#004D40", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── ARQUITETURA ─── */}
        {activeTab === "arquitetura" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Arquitetura IoT AFU</Text>
            <Text className="text-xs text-muted mb-4">6 camadas · Banco de dispositivos · 4 status</Text>

            {/* Camadas */}
            <View style={{ backgroundColor: "#004D40" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🏗️ Camadas da Arquitetura</Text>
              {[
                { c: "Sensores", emoji: "🌡️", desc: "Solo, clima, reservatórios" },
                { c: "Gateway IoT", emoji: "📡", desc: "Wi-Fi, LoRaWAN, 4G/5G" },
                { c: "Internet", emoji: "🌐", desc: "Transmissão segura" },
                { c: "AFU Cloud", emoji: "☁️", desc: "Armazenamento e processamento" },
                { c: "IA AFU", emoji: "🤖", desc: "Análise e decisão" },
                { c: "Aplicativo", emoji: "📱", desc: "Controle e alertas" },
              ].map((layer, i) => (
                <View key={layer.c} className="flex-row items-center mb-1">
                  <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 6, marginRight: 8, minWidth: 32 }} className="items-center">
                    <Text className="text-base">{layer.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-xs font-bold">{layer.c}</Text>
                    <Text style={{ color: "#80CBC4" }} className="text-xs">{layer.desc}</Text>
                  </View>
                  {i < 5 && <Text style={{ color: "#80CBC4" }} className="text-xs ml-2">↓</Text>}
                </View>
              ))}
            </View>

            {/* Banco de Dispositivos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#004D4030" }}>
              <View style={{ backgroundColor: "#004D40" }} className="p-3">
                <Text className="text-white text-sm font-bold">🗄️ Tabela: dispositivos_iot</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["id", "codigo", "nome", "tipo", "fabricante", "modelo", "status", "ultima_leitura", "propriedade_id"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E0F2F1", borderWidth: 1, borderColor: "#004D4030" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#004D40" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Status do Dispositivo</Text>
                <View className="flex-row gap-2">
                  {[
                    { s: "Online", cor: "#2E7D32" },
                    { s: "Offline", cor: "#757575" },
                    { s: "Manutenção", cor: "#F57F17" },
                    { s: "Falha", cor: "#C62828" },
                  ].map((st) => (
                    <View key={st.s} style={{ backgroundColor: st.cor + "15", borderWidth: 1, borderColor: st.cor + "30", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: st.cor }} className="text-xs font-bold text-center">{st.s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Banco de Leituras */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">📊 Tabela: leituras_iot</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1">
                  {["id", "sensor_id", "data_hora", "valor", "unidade"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#0288D1" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── SENSORES SOLO ─── */}
        {activeTab === "sensores-solo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Sensores de Solo</Text>
            <Text className="text-xs text-muted mb-4">Umidade · pH · Temperatura · CE · Salinidade</Text>

            {/* 5 Monitoramentos */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { m: "Umidade", emoji: "💧", cor: "#0288D1" },
                { m: "Temperatura", emoji: "🌡️", cor: "#C62828" },
                { m: "pH", emoji: "⚗️", cor: "#7B1FA2" },
                { m: "Condutividade elétrica", emoji: "⚡", cor: "#F57F17" },
                { m: "Salinidade", emoji: "🧂", cor: "#00695C" },
              ].map((s) => (
                <View key={s.m} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                  <Text className="text-xl">{s.emoji}</Text>
                  <Text style={{ color: s.cor }} className="text-xs font-bold">{s.m}</Text>
                </View>
              ))}
            </View>

            {/* Faixas Umidade */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">💧 Sensor de Umidade — Faixas</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { faixa: "0 – 20%", label: "Crítico", cor: "#C62828", bg: "#FFEBEE" },
                  { faixa: "21 – 40%", label: "Baixo", cor: "#F57F17", bg: "#FFF8E1" },
                  { faixa: "41 – 70%", label: "Ideal", cor: "#2E7D32", bg: "#E8F5E9" },
                  { faixa: "71 – 100%", label: "Excesso", cor: "#0288D1", bg: "#E1F5FE" },
                ].map((f) => (
                  <View key={f.label} className="flex-row items-center justify-between mb-2 rounded-lg px-3 py-2" style={{ backgroundColor: f.bg, borderWidth: 1, borderColor: f.cor + "30" }}>
                    <Text style={{ color: f.cor }} className="text-xs font-mono font-bold">{f.faixa}</Text>
                    <View style={{ backgroundColor: f.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{f.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Faixas pH */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
              <View style={{ backgroundColor: "#7B1FA2" }} className="p-3">
                <Text className="text-white text-sm font-bold">⚗️ Sensor de pH — Faixas</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { faixa: "< 5,5", label: "Ácido", cor: "#C62828", bg: "#FFEBEE" },
                  { faixa: "5,5 – 6,8", label: "Ideal", cor: "#2E7D32", bg: "#E8F5E9" },
                  { faixa: "> 7,0", label: "Alcalino", cor: "#0288D1", bg: "#E1F5FE" },
                ].map((f) => (
                  <View key={f.label} className="flex-row items-center justify-between mb-2 rounded-lg px-3 py-2" style={{ backgroundColor: f.bg, borderWidth: 1, borderColor: f.cor + "30" }}>
                    <Text style={{ color: f.cor }} className="text-xs font-mono font-bold">{f.faixa}</Text>
                    <View style={{ backgroundColor: f.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{f.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── SENSORES CLIMA ─── */}
        {activeTab === "sensores-clima" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Sensores Climáticos</Text>
            <Text className="text-xs text-muted mb-4">6 variáveis · Estação meteorológica · Gateway IoT</Text>

            {/* 6 Variáveis */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { v: "Temperatura", emoji: "🌡️", cor: "#C62828" },
                { v: "Umidade do ar", emoji: "💨", cor: "#0288D1" },
                { v: "Velocidade do vento", emoji: "🌬️", cor: "#546E7A" },
                { v: "Direção do vento", emoji: "🧭", cor: "#455A64" },
                { v: "Radiação solar", emoji: "☀️", cor: "#F57F17" },
                { v: "Pressão atmosférica", emoji: "🌀", cor: "#7B1FA2" },
              ].map((v) => (
                <View key={v.v} style={{ backgroundColor: v.cor + "15", borderWidth: 1, borderColor: v.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                  <Text className="text-xl">{v.emoji}</Text>
                  <Text style={{ color: v.cor }} className="text-xs font-bold">{v.v}</Text>
                </View>
              ))}
            </View>

            {/* Estação Meteorológica */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#00695C30" }}>
              <View style={{ backgroundColor: "#00695C" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌤️ Estação Meteorológica AFU</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { c: "Pluviômetro", emoji: "🌧️" },
                  { c: "Termômetro", emoji: "🌡️" },
                  { c: "Anemômetro", emoji: "🌬️" },
                  { c: "Higrômetro", emoji: "💧" },
                  { c: "Piranômetro", emoji: "☀️" },
                ].map((comp) => (
                  <View key={comp.c} style={{ backgroundColor: "#E0F2F1", borderWidth: 1, borderColor: "#00695C30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                    <Text className="text-xl">{comp.emoji}</Text>
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">{comp.c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Frequência de Coleta */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">⏱️ Frequência de Coleta</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["1 min", "5 min", "15 min", "30 min", "60 min"].map((f) => (
                  <View key={f} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#F57F17" }} className="text-xs font-bold text-center">{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Gateway */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📡 Gateway IoT — Tecnologias</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { t: "Wi-Fi", emoji: "📶", cor: "#1565C0" },
                  { t: "LoRaWAN", emoji: "📡", cor: "#7B1FA2" },
                  { t: "4G", emoji: "📱", cor: "#2E7D32" },
                  { t: "5G", emoji: "🚀", cor: "#C62828" },
                  { t: "Ethernet", emoji: "🔌", cor: "#455A64" },
                ].map((gw) => (
                  <View key={gw.t} style={{ backgroundColor: gw.cor + "15", borderWidth: 1, borderColor: gw.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                    <Text className="text-xl">{gw.emoji}</Text>
                    <Text style={{ color: gw.cor }} className="text-xs font-bold">{gw.t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── AUTOMAÇÃO ─── */}
        {activeTab === "automacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Automação Rural</Text>
            <Text className="text-xs text-muted mb-4">Irrigação · Fertirrigação · Estufas · Reservatórios</Text>

            {/* Irrigação */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">💧 Automação de Irrigação</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  {["Válvulas", "Bombas", "Controladores"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: "#0288D1" }} className="text-xs font-bold text-center">{c}</Text>
                    </View>
                  ))}
                </View>
                {/* Regra Inteligente */}
                <View style={{ backgroundColor: "#1A237E" }} className="rounded-xl p-3">
                  <Text className="text-white text-xs font-bold mb-2">🤖 Regra Inteligente</Text>
                  {[
                    { t: "Se umidade < 35%", emoji: "⚠️" },
                    { t: "↓ Iniciar irrigação", emoji: "▶️" },
                    { t: "↓ Parar em 65%", emoji: "⏹️" },
                  ].map((r) => (
                    <View key={r.t} className="flex-row items-center mb-1">
                      <Text className="text-base mr-2">{r.emoji}</Text>
                      <Text style={{ color: "#E3F2FD" }} className="text-xs font-semibold">{r.t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Fertirrigação */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">🧪 Fertirrigação</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-3">
                  {["Água", "Fertilizantes", "Bioinsumos"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-bold text-center">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Modos de Aplicação</Text>
                <View className="flex-row gap-2">
                  {["Automática", "Programada", "Manual"].map((m) => (
                    <View key={m} style={{ backgroundColor: "#2E7D32", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text className="text-white text-xs font-bold">{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Reservatórios */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🏊 Monitoramento de Reservatórios</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["Nível de água", "Temperatura", "Qualidade da água"].map((s) => (
                  <View key={s} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#0288D1" }} className="text-xs font-bold text-center">{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Estufas */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🏡 Monitoramento de Estufas</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["Temperatura", "Umidade", "CO₂", "Luminosidade"].map((v) => (
                    <View key={v} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730", width: "47%" }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: "#F57F17" }} className="text-xs font-bold">{v}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Atuadores</Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Ventilação", "Nebulização", "Aquecimento", "Sombrite"].map((a) => (
                    <View key={a} style={{ backgroundColor: "#F57F17", width: "47%" }} className="rounded-xl p-2 items-center">
                      <Text className="text-white text-xs font-bold">{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── ALERTAS ─── */}
        {activeTab === "alertas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Alertas IoT</Text>
            <Text className="text-xs text-muted mb-4">4 alertas · Consumo hídrico · Eficiência · GEO</Text>

            {/* Alertas */}
            <View style={{ backgroundColor: "#004D40" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🔔 Alertas Inteligentes</Text>
              {[
                { a: "Umidade baixa", emoji: "💧", cor: "#0288D1" },
                { a: "Temperatura elevada", emoji: "🌡️", cor: "#C62828" },
                { a: "Falha de bomba", emoji: "⚙️", cor: "#F57F17" },
                { a: "Reservatório vazio", emoji: "🏊", cor: "#7B1FA2" },
              ].map((al) => (
                <View key={al.a} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Text className="text-base mr-2">{al.emoji}</Text>
                  <Text style={{ color: "#E0F2F1" }} className="text-xs font-semibold flex-1">{al.a}</Text>
                  <View style={{ backgroundColor: al.cor, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text className="text-white text-xs">Alerta</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Consumo Hídrico */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">💧 Consumo Hídrico</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["Litros/dia", "Litros/hectare", "Litros/planta"].map((m) => (
                  <View key={m} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130", flex: 1 }} className="rounded-xl p-3 items-center">
                    <Text style={{ color: "#0288D1" }} className="text-xs font-bold text-center">{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Eficiência */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">📊 Eficiência de Irrigação (0–100)</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {[
                  { l: "Ruim", cor: "#C62828" },
                  { l: "Regular", cor: "#F57F17" },
                  { l: "Boa", cor: "#2E7D32" },
                  { l: "Excelente", cor: "#1B5E20" },
                ].map((e) => (
                  <View key={e.l} style={{ backgroundColor: e.cor + "15", borderWidth: 1, borderColor: e.cor + "30", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: e.cor }} className="text-xs font-bold text-center">{e.l}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Integração GEO */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1A237E30" }}>
              <View style={{ backgroundColor: "#1A237E" }} className="p-3">
                <Text className="text-white text-sm font-bold">🛰️ Integração com Geointeligência</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["NDVI", "Clima", "Solo", "Sensores"].map((v) => (
                    <View key={v} style={{ backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#1A237E30" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#1A237E" }} className="text-xs font-semibold">{v}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#1A237E15", borderWidth: 1, borderColor: "#1A237E30" }} className="rounded-xl p-3">
                  <Text style={{ color: "#1A237E" }} className="text-xs font-bold text-center">🗺️ Resultado: Mapa hídrico inteligente</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dashboard IoT</Text>
            <Text className="text-xs text-muted mb-4">5 KPIs · 5 perguntas IA · 4 ações · Segurança</Text>

            {/* KPIs */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { k: "Sensores online", emoji: "🟢", cor: "#2E7D32" },
                { k: "Sensores offline", emoji: "🔴", cor: "#C62828" },
                { k: "Consumo de água", emoji: "💧", cor: "#0288D1" },
                { k: "Irrigações executadas", emoji: "✅", cor: "#1B5E20" },
                { k: "Alertas ativos", emoji: "🔔", cor: "#F57F17" },
              ].map((k) => (
                <View key={k.k} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-2xl mb-1">{k.emoji}</Text>
                  <Text style={{ color: k.cor }} className="text-xs font-bold">{k.k}</Text>
                </View>
              ))}
            </View>

            {/* Perguntas IA */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#004D4030" }}>
              <View style={{ backgroundColor: "#004D40" }} className="p-3">
                <Text className="text-white text-sm font-bold">🤖 Perguntas respondidas pela IA</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  "Preciso irrigar?",
                  "Quanto irrigar?",
                  "Há risco de estresse hídrico?",
                  "Qual sensor apresenta falha?",
                  "Como economizar água?",
                ].map((q, i) => (
                  <View key={i} className="flex-row items-start mb-2">
                    <View style={{ backgroundColor: "#004D40", width: 18, height: 18, borderRadius: 9, marginRight: 8, marginTop: 1 }} className="items-center justify-center">
                      <Text className="text-white text-xs font-bold">{i + 1}</Text>
                    </View>
                    <Text className="text-xs text-foreground flex-1">{q}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Ações no App */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📱 Ações no Aplicativo</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Visualizar sensores", "Receber alertas", "Acionar irrigação", "Programar horários"].map((a) => (
                  <View key={a} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", width: "47%" }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold text-center">{a}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Segurança + Status */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">✅ Status AFU — 13 Módulos Concluídos</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["Banco Agronômico", "Clima", "Solos", "Genética", "Nutrição", "Irrigação", "Pragas e Doenças", "Calendário", "Laboratório", "Economia", "IA Agrônomo", "Geointeligência", "IoT e Automação"].map((m) => (
                    <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-0.5 flex-row items-center gap-1">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">✅</Text>
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{m}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#004D4015", borderWidth: 1, borderColor: "#004D4030" }} className="rounded-xl p-3 mb-2">
                  <Text style={{ color: "#004D40" }} className="text-xs font-bold">🔒 Segurança IoT</Text>
                  <View className="flex-row flex-wrap gap-1 mt-1">
                    {["Criptografia", "Autenticação", "Logs", "Auditoria"].map((s) => (
                      <View key={s} style={{ backgroundColor: "#E0F2F1", borderWidth: 1, borderColor: "#004D4030" }} className="rounded-full px-2 py-0.5">
                        <Text style={{ color: "#004D40" }} className="text-xs">{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ backgroundColor: "#0D47A115", borderWidth: 1, borderColor: "#0D47A130" }} className="rounded-xl p-3">
                  <Text style={{ color: "#0D47A1" }} className="text-xs font-bold">Próxima: Etapa 44</Text>
                  <Text style={{ color: "#0D47A1" }} className="text-xs">AFU Marketplace e Comercialização Agrícola — venda de produtos, mudas, sementes, insumos, rastreabilidade, certificações, logística e integração financeira</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
