import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "custos", label: "Custos" },
  { id: "receitas", label: "Receitas" },
  { id: "indices", label: "Índices" },
  { id: "mercado", label: "Mercado" },
  { id: "simulador", label: "Simulador" },
  { id: "dashboard", label: "Dashboard" },
];

const CUSTOS_VAR = [
  "Sementes", "Mudas", "Fertilizantes", "Calcário", "Gesso",
  "Bioinsumos", "Defensivos", "Irrigação", "Energia", "Combustível",
  "Mão de obra", "Máquinas", "Frete", "Embalagens",
];

const CUSTOS_FIX = ["Terra", "Impostos", "Seguro", "Internet", "Equipamentos", "Infraestrutura"];

const PRODUTIVIDADE = [
  { cultura: "Alface", min: "20.000", med: "35.000", max: "50.000", unid: "plantas/ha", cor: "#2E7D32", emoji: "🥬" },
  { cultura: "Morango", min: "20", med: "35", max: "60", unid: "t/ha", cor: "#C62828", emoji: "🍓" },
  { cultura: "Café Arábica", min: "15", med: "35", max: "70", unid: "sacas/ha", cor: "#4E342E", emoji: "☕" },
  { cultura: "Mandioca", min: "15", med: "30", max: "50", unid: "t/ha", cor: "#F57F17", emoji: "🌿" },
];

export default function EconomiaAgricolaScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("custos");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">💰</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Economia Agrícola</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              7 Módulos · Previsão de Produção · ROI · Simulador
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 40</Text>
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

        {/* ─── CUSTOS ─── */}
        {activeTab === "custos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Cadastro de Custos</Text>
            <Text className="text-xs text-muted mb-4">14 categorias variáveis · 6 fixos · tabela custos_producao</Text>

            {/* Tabela */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">📋 Tabela: custos_producao</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["id", "cultivo_id", "categoria", "descricao", "valor", "data"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-1">
                    <Text style={{ color: "#1B5E20" }} className="text-xs">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Custos Variáveis */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E65100" + "30" }}>
              <View style={{ backgroundColor: "#E65100" }} className="p-3">
                <Text className="text-white text-sm font-bold">📊 Custos Variáveis (14)</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {CUSTOS_VAR.map((c) => (
                  <View key={c} style={{ backgroundColor: "#FFF3E0", borderWidth: 1, borderColor: "#E6510030" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#E65100" }} className="text-xs font-semibold">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Custos Fixos */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">🏗️ Custos Fixos (6)</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {CUSTOS_FIX.map((c) => (
                  <View key={c} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── RECEITAS ─── */}
        {activeTab === "receitas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Receitas e Produtividade</Text>
            <Text className="text-xs text-muted mb-4">Tabela receitas · 4 exemplos · fórmula de previsão</Text>

            {/* Tabela receitas */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">📋 Tabela: receitas</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["id", "cultivo_id", "produto", "quantidade", "preco_unitario", "valor_total", "data_venda"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-1">
                    <Text style={{ color: "#2E7D32" }} className="text-xs">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Produtividade */}
            <Text className="text-sm font-bold text-foreground mb-3">📈 Banco de Produtividade</Text>
            {PRODUTIVIDADE.map((p) => (
              <View key={p.cultura} className="rounded-xl overflow-hidden mb-3" style={{ borderWidth: 1, borderColor: p.cor + "30" }}>
                <View style={{ backgroundColor: p.cor }} className="p-3 flex-row items-center gap-2">
                  <Text className="text-xl">{p.emoji}</Text>
                  <Text className="text-white text-sm font-bold">{p.cultura}</Text>
                  <View style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="rounded-full px-2 py-0.5 ml-auto">
                    <Text className="text-white text-xs">{p.unid}</Text>
                  </View>
                </View>
                <View className="p-3 bg-surface flex-row gap-2">
                  {[{ l: "Mínimo", v: p.min }, { l: "Médio", v: p.med }, { l: "Máximo", v: p.max }].map((f) => (
                    <View key={f.l} style={{ backgroundColor: p.cor + "15", borderWidth: 1, borderColor: p.cor + "30", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: p.cor }} className="text-xs text-muted">{f.l}</Text>
                      <Text style={{ color: p.cor }} className="text-sm font-bold">{f.v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Fórmula de Previsão */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-3">🔮 Fórmula de Previsão AFU</Text>
              <View className="items-center">
                {["Produtividade Potencial", "×", "Índice de Aptidão", "×", "Índice Genético", "×", "Índice Climático"].map((e, i) => (
                  <Text key={i} style={{ color: e === "×" ? "#A5D6A7" : "white", fontWeight: e === "×" ? "400" : "700" }} className={e === "×" ? "text-xl" : "text-xs py-0.5"}>{e}</Text>
                ))}
                <View style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-lg px-4 py-2 mt-2">
                  <Text className="text-white text-xs font-bold text-center">= Produção Estimada</Text>
                </View>
              </View>
              <Text style={{ color: "#A5D6A7" }} className="text-xs mt-3">Variáveis: Solo · Clima · Genética · Irrigação · Nutrição · Histórico</Text>
            </View>
          </View>
        )}

        {/* ─── ÍNDICES ─── */}
        {activeTab === "indices" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Índices e Fórmulas</Text>
            <Text className="text-xs text-muted mb-4">Climático · Econômico · Fluxo de Caixa · Margens · ROI</Text>

            {/* Índice Climático */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌤️ Índice Climático (0–100)</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Temperatura", "Chuva", "Geada", "Seca", "Radiação"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#0288D1" }} className="text-xs font-semibold">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Índice Econômico */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">💹 Índice Econômico (0–100)</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Mercado", "Produtividade", "Custos", "Preço de venda"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#F57F17" }} className="text-xs font-semibold">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fluxo de Caixa */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">💵 Fluxo de Caixa</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#2E7D32" }} className="text-xs font-bold mb-2">Entradas ↑</Text>
                  {["Vendas", "Financiamentos", "Subsídios"].map((e) => (
                    <View key={e} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-1 mb-1">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">{e}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#C62828" }} className="text-xs font-bold mb-2">Saídas ↓</Text>
                  {["Custos", "Salários", "Insumos", "Investimentos"].map((s) => (
                    <View key={s} style={{ backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#C6282830" }} className="rounded-full px-2 py-1 mb-1">
                      <Text style={{ color: "#C62828" }} className="text-xs">{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3 mx-4 mb-3 rounded-xl">
                <Text style={{ color: "#1B5E20" }} className="text-xs font-bold text-center">= Saldo Projetado</Text>
              </View>
            </View>

            {/* Fórmulas */}
            <Text className="text-sm font-bold text-foreground mb-3">📐 Fórmulas Econômicas</Text>
            {[
              { t: "Margem Bruta", f: "Receita Total − Custos Variáveis", cor: "#2E7D32" },
              { t: "Margem Líquida", f: "Receita Total − Custos Totais", cor: "#1565C0" },
              { t: "ROI", f: "(Lucro Líquido ÷ Investimento Total) × 100", cor: "#F57F17" },
            ].map((fm) => (
              <View key={fm.t} className="rounded-xl overflow-hidden mb-3" style={{ borderWidth: 1, borderColor: fm.cor + "30" }}>
                <View style={{ backgroundColor: fm.cor + "15" }} className="p-3 flex-row items-center gap-2">
                  <View style={{ backgroundColor: fm.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text className="text-white text-xs font-bold">{fm.t}</Text>
                  </View>
                </View>
                <View className="p-3 bg-surface">
                  <Text style={{ color: fm.cor }} className="text-sm font-bold text-center">{fm.f}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── MERCADO ─── */}
        {activeTab === "mercado" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Mercado e Riscos</Text>
            <Text className="text-xs text-muted mb-4">Banco de preços · Score de risco · Inteligência de mercado</Text>

            {/* Banco de Preços */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📊 Banco de Preços</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["produto", "municipio", "estado", "preco_min", "preco_medio", "preco_max", "data"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-2 py-1">
                      <Text style={{ color: "#1565C0" }} className="text-xs">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Produtos monitorados</Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Café", "Morango", "Tomate", "Alface", "Mandioca", "Batata-doce", "Brócolis", "Couve-flor"].map((p) => (
                    <View key={p} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Score de Risco */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
              <View style={{ backgroundColor: "#C62828" }} className="p-3">
                <Text className="text-white text-sm font-bold">⚠️ Score de Risco (0–100)</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {[
                    { cat: "Climático", emoji: "🌧️", cor: "#0288D1" },
                    { cat: "Fitossanitário", emoji: "🦠", cor: "#7B1FA2" },
                    { cat: "Mercado", emoji: "📉", cor: "#C62828" },
                    { cat: "Logístico", emoji: "🚛", cor: "#E65100" },
                    { cat: "Financeiro", emoji: "💸", cor: "#F57F17" },
                  ].map((r) => (
                    <View key={r.cat} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "30", width: "30%" }} className="rounded-xl p-2 items-center">
                      <Text className="text-lg">{r.emoji}</Text>
                      <Text style={{ color: r.cor }} className="text-xs font-bold text-center">{r.cat}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Classificação</Text>
                <View className="flex-row flex-wrap gap-1">
                  {[
                    { c: "0-20 Muito Baixo", cor: "#2E7D32" },
                    { c: "21-40 Baixo", cor: "#558B2F" },
                    { c: "41-60 Médio", cor: "#F57F17" },
                    { c: "61-80 Alto", cor: "#E65100" },
                    { c: "81-100 Crítico", cor: "#C62828" },
                  ].map((cl) => (
                    <View key={cl.c} style={{ backgroundColor: cl.cor, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text className="text-white text-xs font-bold">{cl.c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Inteligência de Mercado */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔍 Inteligência de Mercado</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Oferta", "Demanda", "Preços", "Tendências", "Exportação", "Importação"].map((m) => (
                  <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-semibold">{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── SIMULADOR ─── */}
        {activeTab === "simulador" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Simulador Econômico</Text>
            <Text className="text-xs text-muted mb-4">Entrada: Área/Cultura/Investimento/Região → Saída: ROI estimado</Text>

            {/* Entrada */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">📥 Entrada do Simulador</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { c: "Área (ha)", emoji: "📐" },
                  { c: "Cultura", emoji: "🌱" },
                  { c: "Investimento (R$)", emoji: "💰" },
                  { c: "Região", emoji: "📍" },
                ].map((e) => (
                  <View key={e.c} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                    <Text className="text-lg">{e.emoji}</Text>
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{e.c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Saída */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">📤 Saída do Simulador</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { c: "Produção estimada", emoji: "📦", cor: "#2E7D32" },
                  { c: "Receita estimada", emoji: "💵", cor: "#1565C0" },
                  { c: "Custos estimados", emoji: "📊", cor: "#E65100" },
                  { c: "Lucro estimado", emoji: "✅", cor: "#2E7D32" },
                  { c: "ROI (%)", emoji: "📈", cor: "#F57F17" },
                ].map((s) => (
                  <View key={s.c} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text className="text-lg mb-1">{s.emoji}</Text>
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Exemplo Penha-SC */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-1">📍 Exemplo: Penha — SC · 2 hectares</Text>
              <Text style={{ color: "#A5D6A7" }} className="text-xs mb-3">Solo franco arenoso · Recomendação da IA</Text>
              {[
                { cultura: "Morango", roi: "38%", emoji: "🍓", cor: "#C62828" },
                { cultura: "Tomate protegido", roi: "32%", emoji: "🍅", cor: "#E65100" },
                { cultura: "Alface", roi: "24%", emoji: "🥬", cor: "#2E7D32" },
                { cultura: "Mandioca", roi: "18%", emoji: "🌿", cor: "#F57F17" },
              ].map((r) => (
                <View key={r.cultura} className="flex-row items-center justify-between mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">{r.emoji}</Text>
                    <Text className="text-white text-xs font-semibold">{r.cultura}</Text>
                  </View>
                  <View style={{ backgroundColor: r.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text className="text-white text-xs font-bold">ROI {r.roi}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dashboard Econômico</Text>
            <Text className="text-xs text-muted mb-4">5 KPIs · 6 perguntas IA · integração completa</Text>

            {/* KPIs */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { ind: "Receita mensal", emoji: "💵", cor: "#2E7D32" },
                { ind: "Custos mensais", emoji: "📊", cor: "#C62828" },
                { ind: "Lucro", emoji: "✅", cor: "#1565C0" },
                { ind: "ROI", emoji: "📈", cor: "#F57F17" },
                { ind: "Fluxo de caixa", emoji: "💰", cor: "#7B1FA2" },
              ].map((k) => (
                <View key={k.ind} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-2xl mb-1">{k.emoji}</Text>
                  <Text style={{ color: k.cor }} className="text-xs font-bold">{k.ind}</Text>
                </View>
              ))}
            </View>

            {/* Perguntas IA */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🤖 Perguntas respondidas pela IA</Text>
              {[
                { q: "Qual cultura gera mais lucro?", emoji: "💰" },
                { q: "Quanto vou colher?", emoji: "📦" },
                { q: "Qual meu custo por hectare?", emoji: "📊" },
                { q: "Qual meu lucro esperado?", emoji: "✅" },
                { q: "Vale investir nesta cultura?", emoji: "🤔" },
                { q: "Qual o risco financeiro?", emoji: "⚠️" },
              ].map((p) => (
                <View key={p.q} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Text className="text-base mr-2">{p.emoji}</Text>
                  <Text style={{ color: "#E3F2FD" }} className="text-xs">{p.q}</Text>
                </View>
              ))}
            </View>

            {/* Integração */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔗 Integração com AFU</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="items-center">
                  {["🪨 Solo", "+", "🌤️ Clima", "+", "🧬 Genética", "+", "🔬 Laboratório", "+", "📅 Calendário", "+", "📊 Mercado"].map((e, i) => (
                    <Text key={i} style={{ color: e === "+" ? colors.muted : colors.foreground, fontWeight: e === "+" ? "400" : "700" }} className={e === "+" ? "text-base" : "text-xs py-0.5"}>{e}</Text>
                  ))}
                  <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-lg px-4 py-2 mt-2">
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-bold text-center">→ Decisões financeiras automatizadas</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Status */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">✅ STATUS — Módulos Concluídos</Text>
              <View className="flex-row flex-wrap gap-1 mb-3">
                {["Banco Agronômico", "Clima", "Solos", "Genética", "Irrigação", "Nutrição", "Pragas", "Doenças", "Calendário", "Laboratório", "Economia"].map((m) => (
                  <View key={m} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs">✅ {m}</Text>
                  </View>
                ))}
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-lg p-3">
                <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold">Próxima: Etapa 41</Text>
                <Text className="text-white text-xs">AFU IA Agrônomo Virtual — assistente conversacional, diagnóstico multimodal, recomendação agronômica, suporte 24h</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
