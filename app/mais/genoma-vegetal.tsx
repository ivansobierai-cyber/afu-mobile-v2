import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "estrutura", label: "Estrutura" },
  { id: "materiais", label: "Materiais" },
  { id: "geracoes", label: "Gerações" },
  { id: "resistencia", label: "Resistência" },
  { id: "produtividade", label: "Produtividade" },
  { id: "iga", label: "IGA" },
];

const TIPOS_VARIEDADE = [
  { tipo: "Tradicional", cor: "#4E342E", desc: "Cultivada há gerações, adaptada localmente" },
  { tipo: "Crioula", cor: "#2E7D32", desc: "Selecionada por agricultores, patrimônio genético" },
  { tipo: "Comercial", cor: "#1565C0", desc: "Desenvolvida para mercado, alto rendimento" },
  { tipo: "Melhorada", cor: "#F57F17", desc: "Melhoramento científico, características superiores" },
  { tipo: "Híbrida", cor: "#880E4F", desc: "Cruzamento controlado, vigor híbrido (F1)" },
  { tipo: "Experimental", cor: "#546E7A", desc: "Em fase de pesquisa e validação" },
];

const CULTIVARES = [
  { cultura: "☕ Café Arábica", cor: "#4E342E", cultivares: ["Catuaí", "Mundo Novo", "Bourbon", "Arara", "Acauã"] },
  { cultura: "🍓 Morango", cor: "#E53935", cultivares: ["Albion", "San Andreas", "Monterey", "Camarosa"] },
  { cultura: "🌾 Mandioca", cor: "#F57F17", cultivares: ["BRS Formosa", "BRS Kiriris", "BRS Dourada"] },
  { cultura: "🍐 Pêra", cor: "#2E7D32", cultivares: ["Williams", "Packham", "Rocha"] },
  { cultura: "🍠 Batata-doce", cor: "#E65100", cultivares: ["Beauregard", "Canadense", "BRS Amélia"] },
];

const GERACOES = [
  { g: "G1", desc: "Matriz genética original", detalhe: "Pureza genética máxima", pureza: 100, cor: "#1B5E20", risco: "Nenhum" },
  { g: "G2", desc: "Primeira multiplicação", detalhe: "Material de elite", pureza: 99, cor: "#2E7D32", risco: "Muito baixo" },
  { g: "G3", desc: "Multiplicação controlada", detalhe: "Viveiro certificado", pureza: 96, cor: "#388E3C", risco: "Baixo" },
  { g: "G4", desc: "Produção ampliada", detalhe: "Distribuição regional", pureza: 93, cor: "#43A047", risco: "Baixo" },
  { g: "G5", desc: "Produção comercial inicial", detalhe: "Uso produtivo", pureza: 90, cor: "#66BB6A", risco: "Baixo" },
  { g: "G6", desc: "Produção comercial estabilizada", detalhe: "Rendimento pleno", pureza: 87, cor: "#F57F17", risco: "Moderado" },
  { g: "G7", desc: "Monitoramento de degeneração", detalhe: "Atenção requerida", pureza: 84, cor: "#E65100", risco: "Moderado" },
  { g: "G8", desc: "Risco moderado de perda genética", detalhe: "Avaliar renovação", pureza: 80, cor: "#BF360C", risco: "Alto" },
  { g: "G9", desc: "Necessita renovação genética", detalhe: "Planejar substituição", pureza: 75, cor: "#C62828", risco: "Alto" },
  { g: "G10", desc: "Limite recomendado", detalhe: "Substituir material genético", pureza: 70, cor: "#B71C1C", risco: "Crítico" },
];

const RESISTENCIAS = [
  { cat: "Pragas", emoji: "🐛", cor: "#E65100" },
  { cat: "Doenças", emoji: "🦠", cor: "#880E4F" },
  { cat: "Seca", emoji: "☀️", cor: "#F57F17" },
  { cat: "Calor", emoji: "🌡️", cor: "#C62828" },
  { cat: "Frio", emoji: "❄️", cor: "#0288D1" },
  { cat: "Geada", emoji: "🌨️", cor: "#1565C0" },
  { cat: "Salinidade", emoji: "🧂", cor: "#546E7A" },
];

export default function GenomaVegetalScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("estrutura");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🧬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Genoma Vegetal</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Melhoramento Genético · G1–G10 · IGA 0–100
            </Text>
          </View>
          <View style={{ backgroundColor: "#0D47A1" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 37</Text>
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

        {/* ─── ESTRUTURA ─── */}
        {activeTab === "estrutura" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Estrutura do Banco Genético</Text>
            <Text className="text-xs text-muted mb-4">Espécies · Variedades · Cultivares</Text>

            {/* Tabelas */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-2xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">Tabelas Principais</Text>
              {[
                { tabela: "especies", campos: "id · nome_popular · nome_cientifico · familia_botanica · origem · descricao", emoji: "🌱" },
                { tabela: "variedades", campos: "id · especie_id · nome_variedade · tipo · origem · registro · descricao", emoji: "🧬" },
                { tabela: "cultivares", campos: "id · variedade_id · nome_cultivar · empresa · ano_lancamento · adaptacao_climatica · produtividade_media", emoji: "🌾" },
              ].map((t) => (
                <View key={t.tabela} style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-lg p-3 mb-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text>{t.emoji}</Text>
                    <Text className="text-white text-xs font-bold">{t.tabela}</Text>
                  </View>
                  <Text style={{ color: "#A5D6A7" }} className="text-xs">{t.campos}</Text>
                </View>
              ))}
            </View>

            {/* Tipos de Variedade */}
            <Text className="text-sm font-bold text-foreground mb-3">Tipos de Variedade</Text>
            <View className="gap-2 mb-4">
              {TIPOS_VARIEDADE.map((v) => (
                <View key={v.tipo} style={{ backgroundColor: v.cor + "15", borderWidth: 1, borderColor: v.cor + "30" }} className="rounded-xl p-3 flex-row items-center">
                  <View style={{ backgroundColor: v.cor, minWidth: 90 }} className="rounded-full px-2 py-1 mr-3">
                    <Text className="text-white text-xs font-bold text-center">{v.tipo}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{v.desc}</Text>
                </View>
              ))}
            </View>

            {/* Cultivares */}
            <Text className="text-sm font-bold text-foreground mb-3">Cultivares por Cultura</Text>
            {CULTIVARES.map((c) => (
              <View key={c.cultura} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: c.cor + "40" }}>
                <View style={{ backgroundColor: c.cor }} className="px-3 py-2">
                  <Text className="text-white text-sm font-bold">{c.cultura}</Text>
                </View>
                <View className="p-3 bg-surface flex-row flex-wrap gap-2">
                  {c.cultivares.map((cv) => (
                    <View key={cv} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "30" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: c.cor }} className="text-xs font-semibold">{cv}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── MATERIAIS ─── */}
        {activeTab === "materiais" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Materiais Genéticos</Text>
            <Text className="text-xs text-muted mb-4">Híbridos · Clones · Porta-enxertos · Matrizes</Text>

            {/* Híbridos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#880E4F30" }}>
              <View style={{ backgroundColor: "#880E4F" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔬 Banco de Híbridos</Text>
                <Text style={{ color: "#F8BBD0" }} className="text-xs">Campos: cultivar_pai · cultivar_mae · codigo_hibrido · objetivo</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Objetivos dos Híbridos</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { obj: "Maior produção", emoji: "📈", cor: "#2E7D32" },
                    { obj: "Maior resistência", emoji: "🛡️", cor: "#1565C0" },
                    { obj: "Maior adaptação", emoji: "🌍", cor: "#F57F17" },
                    { obj: "Melhor qualidade", emoji: "⭐", cor: "#880E4F" },
                  ].map((o) => (
                    <View key={o.obj} style={{ backgroundColor: o.cor + "15", borderWidth: 1, borderColor: o.cor + "30", width: "47%" }} className="rounded-xl p-3">
                      <Text className="text-lg mb-1">{o.emoji}</Text>
                      <Text style={{ color: o.cor }} className="text-xs font-bold">{o.obj}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Clones */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌿 Banco de Clones</Text>
                <Text style={{ color: "#BBDEFB" }} className="text-xs">Campos: codigo_clone · origem · data_selecao · caracteristicas</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Culturas com clonagem</Text>
                <View className="flex-row flex-wrap gap-2">
                  {["☕ Café", "🌾 Mandioca", "🍑 Figo", "🫐 Amora", "🍇 Framboesa"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Porta-Enxertos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌳 Banco de Porta-Enxertos</Text>
                <Text style={{ color: "#FFF8E1" }} className="text-xs">Campos: especie · porta_enxerto · vigor · resistencia · compatibilidade</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Aplicações</Text>
                <View className="flex-row flex-wrap gap-2">
                  {["🍐 Pêra", "🍑 Caqui", "🍑 Figo", "🌳 Frutíferas em geral"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: "#F57F17" }} className="text-xs font-semibold">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Matrizes */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#4E342E30" }}>
              <View style={{ backgroundColor: "#4E342E" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌱 Banco de Matrizes</Text>
                <Text style={{ color: "#BCAAA4" }} className="text-xs">Campos: codigo_matriz · variedade_id · origem · localizacao · status</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { s: "Ativa", cor: "#2E7D32", bg: "#E8F5E9" },
                  { s: "Conservação", cor: "#1565C0", bg: "#E3F2FD" },
                  { s: "Pesquisa", cor: "#F57F17", bg: "#FFF8E1" },
                  { s: "Multiplicação", cor: "#880E4F", bg: "#FCE4EC" },
                ].map((s) => (
                  <View key={s.s} style={{ backgroundColor: s.bg, borderWidth: 1, borderColor: s.cor + "30" }} className="rounded-full px-3 py-1.5">
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── GERAÇÕES ─── */}
        {activeTab === "geracoes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Sistema G1 → G10</Text>
            <Text className="text-xs text-muted mb-4">Pureza genética · Risco de degeneração</Text>

            {GERACOES.map((g) => (
              <View key={g.g} className="mb-2 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: g.cor + "30" }}>
                <View className="flex-row items-center p-3" style={{ backgroundColor: g.cor + "10" }}>
                  <View style={{ backgroundColor: g.cor, width: 40, height: 40 }} className="rounded-xl items-center justify-center mr-3">
                    <Text className="text-white text-sm font-bold">{g.g}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: g.cor }} className="text-xs font-bold">{g.desc}</Text>
                    <Text className="text-xs text-muted">{g.detalhe}</Text>
                  </View>
                  <View>
                    <Text style={{ color: g.cor }} className="text-sm font-bold">{g.pureza}%</Text>
                    <Text className="text-xs text-muted text-right">{g.risco}</Text>
                  </View>
                </View>
                <View className="px-3 pb-2 bg-surface">
                  <View style={{ backgroundColor: "#F0F0F0", height: 6, borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
                    <View style={{ backgroundColor: g.cor, height: 6, borderRadius: 3, width: `${g.pureza}%` as any }} />
                  </View>
                </View>
              </View>
            ))}

            {/* Índice de Pureza */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mt-2">
              <Text className="text-white text-sm font-bold mb-2">Índice de Pureza Genética</Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { g: "G1", p: "100%" }, { g: "G3", p: "96%" }, { g: "G5", p: "90%" },
                  { g: "G7", p: "84%" }, { g: "G10", p: "70%" },
                ].map((i) => (
                  <View key={i.g} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-lg px-3 py-2 items-center">
                    <Text className="text-white text-sm font-bold">{i.p}</Text>
                    <Text style={{ color: "#A5D6A7" }} className="text-xs">{i.g}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── RESISTÊNCIA ─── */}
        {activeTab === "resistencia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Resistência e Compatibilidade</Text>
            <Text className="text-xs text-muted mb-4">7 categorias · Escala 5 níveis · Compatibilidade</Text>

            {/* Categorias de Resistência */}
            <Text className="text-sm font-bold text-foreground mb-3">Categorias de Resistência Genética</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {RESISTENCIAS.map((r) => (
                <View key={r.cat} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-2xl mb-1">{r.emoji}</Text>
                  <Text style={{ color: r.cor }} className="text-xs font-bold">{r.cat}</Text>
                </View>
              ))}
            </View>

            {/* Escala de Resistência */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Escala de Resistência</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { nivel: "Muito baixa", cor: "#C62828", bg: "#FFEBEE", w: "20%" },
                  { nivel: "Baixa", cor: "#E65100", bg: "#FBE9E7", w: "40%" },
                  { nivel: "Média", cor: "#F57F17", bg: "#FFF8E1", w: "60%" },
                  { nivel: "Alta", cor: "#2E7D32", bg: "#E8F5E9", w: "80%" },
                  { nivel: "Muito alta", cor: "#1B5E20", bg: "#E8F5E9", w: "100%" },
                ].map((n) => (
                  <View key={n.nivel} className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <View style={{ backgroundColor: n.bg }} className="rounded-full px-2 py-0.5">
                        <Text style={{ color: n.cor }} className="text-xs font-bold">{n.nivel}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: "#F0F0F0", height: 8, borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ backgroundColor: n.cor, height: 8, borderRadius: 4, width: n.w as any }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Compatibilidade */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D115" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🔗 Banco de Compatibilidade</Text>
                <Text className="text-xs text-muted">Campos: material_a · material_b · compatibilidade</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { c: "Incompatível", cor: "#C62828", bg: "#FFEBEE" },
                  { c: "Baixa", cor: "#E65100", bg: "#FBE9E7" },
                  { c: "Média", cor: "#F57F17", bg: "#FFF8E1" },
                  { c: "Alta", cor: "#2E7D32", bg: "#E8F5E9" },
                  { c: "Excelente", cor: "#1B5E20", bg: "#C8E6C9" },
                ].map((c) => (
                  <View key={c.c} style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.cor + "30" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── PRODUTIVIDADE ─── */}
        {activeTab === "produtividade" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Produtividade e Rastreabilidade</Text>
            <Text className="text-xs text-muted mb-4">Fenótipo · Produtividade · Rastreabilidade · Multiplicação</Text>

            {/* Fenótipo */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🌿 Banco de Características Fenotípicas</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["altura", "porte", "folhagem", "cor_flor", "cor_fruto", "peso_medio"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Produtividade */}
            <Text className="text-sm font-bold text-foreground mb-3">Banco de Produtividade</Text>
            {[
              { cultura: "☕ Café Arábica", min: "15 sc/ha", media: "35 sc/ha", max: "70 sc/ha", cor: "#4E342E" },
              { cultura: "🍓 Morango", min: "20 t/ha", media: "35 t/ha", max: "60 t/ha", cor: "#E53935" },
            ].map((p) => (
              <View key={p.cultura} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: p.cor + "40" }}>
                <View style={{ backgroundColor: p.cor }} className="px-3 py-2">
                  <Text className="text-white text-sm font-bold">{p.cultura}</Text>
                </View>
                <View className="p-3 bg-surface flex-row gap-2">
                  {[
                    { label: "Mínima", valor: p.min, cor: "#C62828" },
                    { label: "Média", valor: p.media, cor: "#F57F17" },
                    { label: "Máxima", valor: p.max, cor: "#2E7D32" },
                  ].map((v) => (
                    <View key={v.label} style={{ backgroundColor: v.cor + "15", flex: 1 }} className="rounded-lg p-2 items-center">
                      <Text style={{ color: v.cor }} className="text-sm font-bold">{v.valor}</Text>
                      <Text className="text-xs text-muted">{v.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Rastreabilidade */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔍 Banco de Rastreabilidade</Text>
                <Text style={{ color: "#BBDEFB" }} className="text-xs">Campos: codigo_lote · geracao · origem · data · responsavel</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="items-center">
                  {["🌱 Matriz", "⬇️", "🔬 Multiplicação", "⬇️", "🌿 Viveiro", "⬇️", "🌾 Plantio", "⬇️", "🍀 Colheita"].map((e, i) => (
                    <View key={i} style={e === "⬇️" ? {} : { backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", width: "80%" }} className={e === "⬇️" ? "py-0.5" : "rounded-lg py-2 px-4 mb-0.5 items-center"}>
                      <Text style={{ color: e === "⬇️" ? "#90CAF9" : "#1565C0" }} className={e === "⬇️" ? "text-base" : "text-xs font-bold"}>{e}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Multiplicação */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D3215" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🌱 9 Métodos de Multiplicação</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Sementes", "Mudas", "Estacas", "Enxertia", "Estolões", "Manivas", "Rizomas", "Tubérculos", "Micropropagação"].map((m) => (
                  <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── IGA ─── */}
        {activeTab === "iga" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Índice Genético AFU (IGA)</Text>
            <Text className="text-xs text-muted mb-4">Escala 0–100 · 5 componentes · 6 perguntas IA</Text>

            {/* Componentes IGA */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Componentes do IGA</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { c: "Pureza", emoji: "💎", cor: "#1B5E20" },
                  { c: "Vigor", emoji: "💪", cor: "#2E7D32" },
                  { c: "Resistência", emoji: "🛡️", cor: "#1565C0" },
                  { c: "Produtividade", emoji: "📈", cor: "#F57F17" },
                  { c: "Adaptação", emoji: "🌍", cor: "#880E4F" },
                ].map((c) => (
                  <View key={c.c} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text className="text-xl mb-1">{c.emoji}</Text>
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Escala IGA */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Escala IGA 0–100</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { faixa: "81–100", classe: "Excelente", cor: "#1B5E20", bg: "#E8F5E9", w: "100%" },
                  { faixa: "61–80", classe: "Bom", cor: "#2E7D32", bg: "#E8F5E9", w: "80%" },
                  { faixa: "41–60", classe: "Regular", cor: "#F57F17", bg: "#FFF8E1", w: "60%" },
                  { faixa: "21–40", classe: "Baixo", cor: "#E65100", bg: "#FBE9E7", w: "40%" },
                  { faixa: "0–20", classe: "Crítico", cor: "#C62828", bg: "#FFEBEE", w: "20%" },
                ].map((e) => (
                  <View key={e.faixa} className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <View style={{ backgroundColor: e.bg }} className="rounded-full px-2 py-0.5">
                        <Text style={{ color: e.cor }} className="text-xs font-bold">{e.classe}</Text>
                      </View>
                      <Text className="text-xs text-muted">{e.faixa}</Text>
                    </View>
                    <View style={{ backgroundColor: "#F0F0F0", height: 8, borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ backgroundColor: e.cor, height: 8, borderRadius: 4, width: e.w as any }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Perguntas IA */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">🤖 Perguntas respondidas pela IA</Text>
              {["Qual cultivar é melhor para minha região?", "Qual geração genética usar?", "Qual o risco de degeneração?", "Qual material é mais resistente?", "Quando renovar as mudas?", "Qual produtividade posso esperar?"].map((q) => (
                <View key={q} className="flex-row items-center mb-1">
                  <View style={{ backgroundColor: "#1565C0", width: 6, height: 6 }} className="rounded-full mr-2" />
                  <Text style={{ color: "#E3F2FD" }} className="text-xs">{q}</Text>
                </View>
              ))}
            </View>

            {/* Status Banco Agronômico */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-3">✅ Status do Banco Agronômico AFU</Text>
              <View className="flex-row flex-wrap gap-1">
                {["Culturas", "Clima", "Irrigação", "Nutrientes", "Solos", "Pragas", "Doenças", "Rotação", "Multiplicação", "Genética G1–G10"].map((item) => (
                  <View key={item} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-full px-2 py-1 flex-row items-center gap-1">
                    <Text className="text-green-300 text-xs">✅</Text>
                    <Text style={{ color: "#E8F5E9" }} className="text-xs">{item}</Text>
                  </View>
                ))}
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-lg p-3 mt-3">
                <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold">Próxima: Etapa 38</Text>
                <Text className="text-white text-xs">AFU Calendário Agrícola Inteligente — plantio, poda, adubação, irrigação, colheita, alertas automáticos</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
