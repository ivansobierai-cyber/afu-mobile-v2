import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "visao", label: "Visão Geral" },
  { id: "paineis", label: "Painéis" },
  { id: "geo", label: "GEO & Produção" },
  { id: "lab", label: "Lab & Economia" },
  { id: "ia", label: "IA & Segurança" },
  { id: "estrategico", label: "Estratégico" },
];

export default function NocAgricolaScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("visao");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#1565C0" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🖥️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Centro de Comando</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              NOC Agrícola · Monitoramento 24h · Controle Total
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 45</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#0D47A1" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 12 }}>
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
            <Text className="text-base font-bold text-foreground mb-1">Centro de Operações Inteligentes</Text>
            <Text className="text-xs text-muted mb-4">Agricultural Network Operations Center · 8 módulos NOC · 24h/dia</Text>

            {/* Missão */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">🎯 Missão do NOC</Text>
              <Text style={{ color: "#BBDEFB" }} className="text-xs mb-3">Monitorar todo o ecossistema AFU em tempo real, 24 horas por dia.</Text>
              <View className="flex-row flex-wrap gap-1">
                {["Produtores", "Propriedades", "Culturas", "Sensores", "Estações Meteo.", "Drones", "Satélites", "Laboratórios", "Marketplace", "Financeiro", "IA"].map((m) => (
                  <View key={m} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text className="text-white text-xs">{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 8 Módulos NOC */}
            <Text className="text-sm font-bold text-foreground mb-2">🏗️ Módulos do NOC</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { m: "NOC Operacional", emoji: "⚙️", cor: "#1565C0" },
                { m: "NOC Agronômico", emoji: "🌱", cor: "#2E7D32" },
                { m: "NOC Climático", emoji: "🌦️", cor: "#0288D1" },
                { m: "NOC IoT", emoji: "📡", cor: "#00695C" },
                { m: "NOC Comercial", emoji: "🛒", cor: "#F57F17" },
                { m: "NOC Financeiro", emoji: "💰", cor: "#7B1FA2" },
                { m: "NOC IA", emoji: "🤖", cor: "#C62828" },
                { m: "NOC Segurança", emoji: "🔒", cor: "#455A64" },
              ].map((mod) => (
                <View key={mod.m} style={{ backgroundColor: mod.cor + "15", borderWidth: 1, borderColor: mod.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                  <Text className="text-xl">{mod.emoji}</Text>
                  <Text style={{ color: mod.cor }} className="text-xs font-bold">{mod.m}</Text>
                </View>
              ))}
            </View>

            {/* KPIs Executivos */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#0D47A130" }}>
              <View style={{ backgroundColor: "#0D47A1" }} className="p-3">
                <Text className="text-white text-sm font-bold">📊 Dashboard Executivo — KPIs Globais</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { k: "Produtores ativos", emoji: "👨‍🌾", cor: "#2E7D32" },
                  { k: "Áreas monitoradas", emoji: "🗺️", cor: "#0288D1" },
                  { k: "Sensores online", emoji: "📡", cor: "#00695C" },
                  { k: "Diagnósticos", emoji: "🔬", cor: "#7B1FA2" },
                  { k: "Laudos emitidos", emoji: "📋", cor: "#F57F17" },
                  { k: "Pedidos", emoji: "📦", cor: "#1565C0" },
                  { k: "Receita movimentada", emoji: "💰", cor: "#C62828" },
                ].map((k) => (
                  <View key={k.k} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-2 flex-row items-center gap-2">
                    <Text className="text-lg">{k.emoji}</Text>
                    <Text style={{ color: k.cor }} className="text-xs font-bold">{k.k}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── PAINÉIS ─── */}
        {activeTab === "paineis" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Painéis de Monitoramento</Text>
            <Text className="text-xs text-muted mb-4">Agronômico · Climático · IoT · Irrigação · Alertas</Text>

            {/* Agronômico */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌱 Painel Agronômico</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { i: "Culturas implantadas", cor: "#2E7D32" },
                  { i: "Culturas em colheita", cor: "#F57F17" },
                  { i: "Culturas em risco", cor: "#C62828" },
                  { i: "Pragas detectadas", cor: "#7B1FA2" },
                  { i: "Doenças detectadas", cor: "#C62828" },
                ].map((item) => (
                  <View key={item.i} style={{ backgroundColor: item.cor + "15", borderWidth: 1, borderColor: item.cor + "30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: item.cor }} className="text-xs font-bold">{item.i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Climático */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌦️ Painel Climático</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["Temperatura", "Umidade", "Precipitação", "Geadas", "Granizo", "Secas"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#0288D1" }} className="text-xs">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">⚠️ Alertas Automáticos</Text>
                <View className="flex-row flex-wrap gap-1">
                  {[
                    { a: "Risco de geada", cor: "#1565C0" },
                    { a: "Risco de estiagem", cor: "#F57F17" },
                    { a: "Risco de enchente", cor: "#0288D1" },
                    { a: "Onda de calor", cor: "#C62828" },
                  ].map((al) => (
                    <View key={al.a} style={{ backgroundColor: al.cor + "15", borderWidth: 1, borderColor: al.cor + "30" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: al.cor }} className="text-xs font-bold">🔔 {al.a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* IoT */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#00695C30" }}>
              <View style={{ backgroundColor: "#00695C" }} className="p-3">
                <Text className="text-white text-sm font-bold">📡 Painel IoT</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Sensores online", "Sensores offline", "Bombas", "Válvulas", "Reservatórios"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#E0F2F1", borderWidth: 1, borderColor: "#00695C30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Irrigação */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">💧 Painel de Irrigação</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Água utilizada", "Água economizada", "Talhões irrigados", "Falhas detectadas"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sistema de Alertas */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
              <View style={{ backgroundColor: "#C62828" }} className="p-3">
                <Text className="text-white text-sm font-bold">🚨 Sistema de Alertas — 5 Níveis</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-1">
                {[
                  { n: "Info", cor: "#0288D1" },
                  { n: "Atenção", cor: "#F57F17" },
                  { n: "Alto", cor: "#E65100" },
                  { n: "Crítico", cor: "#C62828" },
                  { n: "Emergencial", cor: "#B71C1C" },
                ].map((nivel) => (
                  <View key={nivel.n} style={{ backgroundColor: nivel.cor, flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text className="text-white text-xs font-bold text-center">{nivel.n}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── GEO & PRODUÇÃO ─── */}
        {activeTab === "geo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Geointeligência e Produção</Text>
            <Text className="text-xs text-muted mb-4">Mapas · Camadas · Produção · Pragas · Doenças · Hídrico</Text>

            {/* Painel Geointeligência */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1A237E30" }}>
              <View style={{ backgroundColor: "#1A237E" }} className="p-3">
                <Text className="text-white text-sm font-bold">🛰️ Painel de Geointeligência</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Visualizações</Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["Mapa nacional", "Mapa estadual", "Mapa municipal", "Mapa da propriedade"].map((m) => (
                    <View key={m} style={{ backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#1A237E30", width: "47%" }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: "#1A237E" }} className="text-xs font-bold">{m}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Camadas</Text>
                <View className="flex-row flex-wrap gap-1">
                  {[
                    { c: "NDVI", cor: "#2E7D32" },
                    { c: "Solo", cor: "#795548" },
                    { c: "Clima", cor: "#0288D1" },
                    { c: "Produção", cor: "#F57F17" },
                    { c: "Pragas", cor: "#7B1FA2" },
                    { c: "Doenças", cor: "#C62828" },
                  ].map((cam) => (
                    <View key={cam.c} style={{ backgroundColor: cam.cor + "15", borderWidth: 1, borderColor: cam.cor + "30" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: cam.cor }} className="text-xs font-bold">{cam.c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Produção */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌾 Monitoramento de Produção</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Área plantada", "Área colhida", "Produção estimada", "Produção realizada"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#F57F17" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Pragas */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
              <View style={{ backgroundColor: "#7B1FA2" }} className="p-3">
                <Text className="text-white text-sm font-bold">🐛 Monitoramento de Pragas</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Mapa de Calor</Text>
                <View className="flex-row gap-2 mb-3">
                  {["Município", "Região", "Estado"].map((n) => (
                    <View key={n} style={{ backgroundColor: "#F3E5F5", borderWidth: 1, borderColor: "#7B1FA230", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: "#7B1FA2" }} className="text-xs font-bold">{n}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Detectar</Text>
                <View className="flex-row gap-2">
                  {["Surtos", "Infestações", "Tendências"].map((d) => (
                    <View key={d} style={{ backgroundColor: "#C62828", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text className="text-white text-xs font-bold">{d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Doenças */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
              <View style={{ backgroundColor: "#C62828" }} className="p-3">
                <Text className="text-white text-sm font-bold">🦠 Monitoramento de Doenças</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["Incidência", "Severidade", "Dispersão"].map((m) => (
                  <View key={m} style={{ backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#C6282830", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#C62828" }} className="text-xs font-bold">{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Hídrico */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">💧 Recursos Hídricos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Reservatórios", "Poços", "Captação", "Consumo"].map((r) => (
                  <View key={r} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130", width: "47%" }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#0288D1" }} className="text-xs font-bold">{r}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── LAB & ECONOMIA ─── */}
        {activeTab === "lab" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Laboratório e Economia</Text>
            <Text className="text-xs text-muted mb-4">Amostras · Laudos · Receita · ROI · Comercial · Comunicação</Text>

            {/* Laboratorial */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#00695C30" }}>
              <View style={{ backgroundColor: "#00695C" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔬 Painel Laboratorial</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Amostras recebidas", "Análises em andamento", "Laudos emitidos", "Pendências"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#E0F2F1", borderWidth: 1, borderColor: "#00695C30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Econômico */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">💰 Painel Econômico</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Receita total", "Custos totais", "Lucro estimado", "ROI médio"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#F57F17" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Comercial */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🛒 Painel Comercial</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Pedidos", "Produtos vendidos", "Ticket médio", "Clientes ativos"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#1B5E2030", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Comunicação */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📢 Central de Comunicação</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { c: "Aplicativo", emoji: "📱", cor: "#1565C0" },
                  { c: "SMS", emoji: "💬", cor: "#2E7D32" },
                  { c: "WhatsApp", emoji: "📲", cor: "#00695C" },
                  { c: "E-mail", emoji: "📧", cor: "#7B1FA2" },
                  { c: "Painel Web", emoji: "🖥️", cor: "#455A64" },
                ].map((ch) => (
                  <View key={ch.c} style={{ backgroundColor: ch.cor + "15", borderWidth: 1, borderColor: ch.cor + "30", width: "47%" }} className="rounded-xl p-2 flex-row items-center gap-2">
                    <Text className="text-base">{ch.emoji}</Text>
                    <Text style={{ color: ch.cor }} className="text-xs font-bold">{ch.c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Relatórios */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#455A6430" }}>
              <View style={{ backgroundColor: "#455A64" }} className="p-3">
                <Text className="text-white text-sm font-bold">📊 Relatórios Automáticos</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["Diário", "Semanal", "Mensal", "Anual"].map((p) => (
                  <View key={p} style={{ backgroundColor: "#ECEFF1", borderWidth: 1, borderColor: "#455A6430", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#455A64" }} className="text-xs font-bold">{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── IA & SEGURANÇA ─── */}
        {activeTab === "ia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">IA e Segurança</Text>
            <Text className="text-xs text-muted mb-4">Consultas · Precisão · Alertas · Logs · Auditoria · Eventos</Text>

            {/* IA */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0D47A130" }}>
              <View style={{ backgroundColor: "#0D47A1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🤖 Painel de IA</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Consultas realizadas", "Diagnósticos emitidos", "Precisão da IA", "Alertas gerados"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#0D47A130", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#0D47A1" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Segurança */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#455A6430" }}>
              <View style={{ backgroundColor: "#455A64" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔒 Painel de Segurança</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Tentativas de acesso", "Logs", "Falhas", "Dispositivos conectados"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#ECEFF1", borderWidth: 1, borderColor: "#455A6430", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#455A64" }} className="text-xs font-bold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Banco de Auditoria */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
              <View style={{ backgroundColor: "#C62828" }} className="p-3">
                <Text className="text-white text-sm font-bold">🗄️ Banco de Auditoria</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-1">
                {["Usuário", "Ação", "Data", "IP", "Resultado"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#C6282830" }} className="rounded-full px-2 py-0.5">
                    <Text style={{ color: "#C62828" }} className="text-xs font-mono">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Central de Eventos */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
              <View style={{ backgroundColor: "#7B1FA2" }} className="p-3">
                <Text className="text-white text-sm font-bold">📋 Central de Eventos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { e: "Climáticos", cor: "#0288D1" },
                  { e: "Agronômicos", cor: "#2E7D32" },
                  { e: "Financeiros", cor: "#F57F17" },
                  { e: "Operacionais", cor: "#455A64" },
                  { e: "Tecnológicos", cor: "#7B1FA2" },
                ].map((ev) => (
                  <View key={ev.e} style={{ backgroundColor: ev.cor + "15", borderWidth: 1, borderColor: ev.cor + "30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: ev.cor }} className="text-xs font-bold">{ev.e}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── ESTRATÉGICO ─── */}
        {activeTab === "estrategico" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Indicadores Estratégicos</Text>
            <Text className="text-xs text-muted mb-4">6 KPIs · Preditiva · Escalabilidade · 9 integrações · 15 módulos</Text>

            {/* 6 KPIs */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0D47A130" }}>
              <View style={{ backgroundColor: "#0D47A1" }} className="p-3">
                <Text className="text-white text-sm font-bold">📈 KPIs Estratégicos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { k: "Disponibilidade do sistema", emoji: "⚡", cor: "#2E7D32" },
                  { k: "Precisão da IA", emoji: "🎯", cor: "#0D47A1" },
                  { k: "Tempo médio de resposta", emoji: "⏱️", cor: "#F57F17" },
                  { k: "Economia de água", emoji: "💧", cor: "#0288D1" },
                  { k: "Produtividade média", emoji: "🌾", cor: "#388E3C" },
                  { k: "ROI médio", emoji: "💰", cor: "#7B1FA2" },
                ].map((k) => (
                  <View key={k.k} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text className="text-xl mb-1">{k.emoji}</Text>
                    <Text style={{ color: k.cor }} className="text-xs font-bold">{k.k}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Inteligência Preditiva */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔮 Inteligência Preditiva</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Pragas", "Doenças", "Safras", "Mercado", "Clima"].map((p) => (
                  <View key={p} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#1B5E2030", width: "47%" }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Escalabilidade */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">📡 Escalabilidade — Sem Alteração Estrutural</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-1">
                {[
                  { n: "1K", label: "1.000\nprodutores", cor: "#2E7D32" },
                  { n: "10K", label: "10.000\nprodutores", cor: "#F57F17" },
                  { n: "100K", label: "100.000\nprodutores", cor: "#0288D1" },
                  { n: "1M", label: "1.000.000\nprodutores", cor: "#7B1FA2" },
                ].map((e) => (
                  <View key={e.n} style={{ backgroundColor: e.cor, flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text className="text-white text-base font-bold">{e.n}</Text>
                    <Text className="text-white text-xs text-center">{e.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Integrações */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔗 Integração Total — 9 Módulos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-1">
                {["AFU Agronomia", "AFU Clima", "AFU Solos", "AFU Laboratório", "AFU Economia", "AFU IA", "AFU GEO", "AFU IoT", "AFU Marketplace"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-2 py-0.5">
                    <Text style={{ color: "#0288D1" }} className="text-xs font-semibold">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Status 15 módulos */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">✅ STATUS AFU — 15 Módulos Concluídos</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["Banco Agronômico", "Banco Climático", "Banco de Solos", "Banco Genético", "Banco de Irrigação", "Banco de Nutrientes", "Pragas e Doenças", "Calendário Inteligente", "Laboratório Digital", "Economia Agrícola", "IA Agrônomo Virtual", "Geointeligência", "IoT e Automação", "Marketplace", "Centro de Comando NOC"].map((m) => (
                    <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-0.5 flex-row items-center gap-1">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">✅</Text>
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{m}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#0D47A115", borderWidth: 1, borderColor: "#0D47A130" }} className="rounded-xl p-3">
                  <Text style={{ color: "#0D47A1" }} className="text-xs font-bold">Próxima: Etapa 46</Text>
                  <Text style={{ color: "#0D47A1" }} className="text-xs">Arquitetura Final de Software e Infraestrutura — APK Android, iOS, Portal Web, Backend, API, Banco de Dados, Cloud, IA, Segurança, Escalabilidade, Backup e DevOps</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
