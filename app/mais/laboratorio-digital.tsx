import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "modulos", label: "Módulos" },
  { id: "analises", label: "Análises" },
  { id: "microbio", label: "Microbiologia" },
  { id: "laudos", label: "Laudos" },
  { id: "ia", label: "IA" },
  { id: "dashboard", label: "Dashboard" },
];

const MODULOS = [
  { m: "Solo", emoji: "🪨", cor: "#4E342E" },
  { m: "Foliar", emoji: "🌿", cor: "#2E7D32" },
  { m: "Água", emoji: "💧", cor: "#0288D1" },
  { m: "Sementes", emoji: "🌱", cor: "#F57F17" },
  { m: "Microbiologia", emoji: "🔬", cor: "#7B1FA2" },
  { m: "Compostagem", emoji: "♻️", cor: "#558B2F" },
  { m: "Substratos", emoji: "🪴", cor: "#6D4C41" },
];

const FLUXO = ["Coleta", "Cadastro", "Análise", "Interpretação", "Laudo", "Recomendação", "Histórico"];

const SOLO_PARAMS = ["pH", "Matéria Orgânica", "P", "K", "Ca", "Mg", "S", "Al", "H+Al", "CTC", "V%", "Argila", "Areia", "Silte"];
const FOLIAR_PARAMS = ["N", "P", "K", "Ca", "Mg", "S", "B", "Zn", "Cu", "Fe", "Mn", "Mo"];
const AGUA_PARAMS = ["pH", "Condutividade", "Sódio", "Cloro", "Cálcio", "Magnésio", "Dureza", "Salinidade"];

const ANALISE_TABS = ["Solo", "Foliar", "Água", "Sementes"];

export default function LaboratorioDigitalScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("modulos");
  const [analiseTab, setAnaliseTab] = useState("Solo");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1A237E" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#283593" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🔬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Laboratório Digital</Text>
            <Text style={{ color: "#9FA8DA" }} className="text-xs">
              7 Módulos · Laudos Automáticos · QR Code · IA
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 39</Text>
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

        {/* ─── MÓDULOS ─── */}
        {activeTab === "modulos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Módulos do Laboratório</Text>
            <Text className="text-xs text-muted mb-4">7 módulos · fluxo operacional · cadastro de amostras</Text>

            {/* 7 Módulos */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {MODULOS.map((m) => (
                <View key={m.m} style={{ backgroundColor: m.cor + "15", borderWidth: 1, borderColor: m.cor + "30", width: "30%" }} className="rounded-xl p-3 items-center">
                  <Text className="text-2xl mb-1">{m.emoji}</Text>
                  <Text style={{ color: m.cor }} className="text-xs font-bold text-center">{m.m}</Text>
                </View>
              ))}
            </View>

            {/* Fluxo Operacional */}
            <View style={{ backgroundColor: "#1A237E" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">⚙️ Fluxo Operacional</Text>
              {FLUXO.map((f, i) => (
                <View key={f} className="flex-row items-center mb-1">
                  <View style={{ backgroundColor: "rgba(255,255,255,0.2)", width: 24, height: 24, borderRadius: 12 }} className="items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{i + 1}</Text>
                  </View>
                  <Text style={{ color: "#E8EAF6" }} className="text-xs font-semibold">{f}</Text>
                  {i < FLUXO.length - 1 && (
                    <Text style={{ color: "#9FA8DA", marginLeft: 8 }} className="text-xs">↓</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Tabela Amostras */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#283593" }} className="p-3">
                <Text className="text-white text-sm font-bold">📋 Tabela: amostras</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {["id", "codigo_amostra", "propriedade_id", "cultura_id", "tipo_amostra", "data_coleta", "responsavel", "status"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#3949AB30" }} className="rounded-full px-2 py-1">
                      <Text style={{ color: "#1A237E" }} className="text-xs">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Tipos de amostra</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { t: "Solo", cor: "#4E342E" },
                    { t: "Folha", cor: "#2E7D32" },
                    { t: "Água", cor: "#0288D1" },
                    { t: "Semente", cor: "#F57F17" },
                    { t: "Composto", cor: "#558B2F" },
                    { t: "Substrato", cor: "#6D4C41" },
                  ].map((t) => (
                    <View key={t.t} style={{ backgroundColor: t.cor + "15", borderWidth: 1, borderColor: t.cor + "30" }} className="rounded-full px-3 py-1">
                      <Text style={{ color: t.cor }} className="text-xs font-semibold">{t.t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── ANÁLISES ─── */}
        {activeTab === "analises" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Análises Laboratoriais</Text>
            <Text className="text-xs text-muted mb-3">Solo · Foliar · Água · Sementes</Text>

            {/* Sub-tabs */}
            <View className="flex-row gap-1 mb-4">
              {ANALISE_TABS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setAnaliseTab(t)}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: analiseTab === t ? "#1A237E" : colors.surface, borderWidth: 1, borderColor: analiseTab === t ? "#1A237E" : colors.border }}
                >
                  <Text style={{ color: analiseTab === t ? "white" : colors.muted, fontSize: 11, fontWeight: analiseTab === t ? "700" : "400" }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Solo */}
            {analiseTab === "Solo" && (
              <View>
                <View style={{ backgroundColor: "#4E342E" }} className="rounded-xl p-4 mb-4">
                  <Text className="text-white text-sm font-bold mb-2">🪨 Parâmetros de Solo (14)</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {SOLO_PARAMS.map((p) => (
                      <View key={p} style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-full px-2 py-1">
                        <Text className="text-white text-xs">{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Classificações automáticas</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    { c: "Muito Baixo", cor: "#C62828" },
                    { c: "Baixo", cor: "#E65100" },
                    { c: "Médio", cor: "#F57F17" },
                    { c: "Alto", cor: "#2E7D32" },
                    { c: "Muito Alto", cor: "#1565C0" },
                  ].map((cl) => (
                    <View key={cl.c} style={{ backgroundColor: cl.cor, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text className="text-white text-xs font-bold">{cl.c}</Text>
                    </View>
                  ))}
                </View>
                <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#4E342E30" }}>
                  <View style={{ backgroundColor: "#4E342E15" }} className="p-3">
                    <Text className="text-sm font-bold text-foreground">💡 Exemplo de Diagnóstico</Text>
                  </View>
                  <View className="p-4 bg-surface">
                    <Text className="text-xs font-bold text-muted mb-2">Entrada</Text>
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {["pH 4,9", "Potássio baixo", "MO 1,8%"].map((e) => (
                        <View key={e} style={{ backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#C6282830" }} className="rounded-full px-2 py-1">
                          <Text style={{ color: "#C62828" }} className="text-xs">{e}</Text>
                        </View>
                      ))}
                    </View>
                    <Text className="text-xs font-bold text-muted mb-2">Saída</Text>
                    {["Solo ácido → Necessita calagem", "Baixo teor de potássio → Fertilizante potássico", "Adicionar matéria orgânica"].map((s) => (
                      <View key={s} className="flex-row items-center mb-1">
                        <View style={{ backgroundColor: "#2E7D32", width: 6, height: 6, borderRadius: 3, marginRight: 6 }} />
                        <Text className="text-xs text-foreground">{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Foliar */}
            {analiseTab === "Foliar" && (
              <View>
                <View style={{ backgroundColor: "#2E7D32" }} className="rounded-xl p-4 mb-4">
                  <Text className="text-white text-sm font-bold mb-2">🌿 Parâmetros Foliares (12)</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {FOLIAR_PARAMS.map((p) => (
                      <View key={p} style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="rounded-full px-2 py-1">
                        <Text className="text-white text-xs font-bold">{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {[
                    { d: "Deficiência", emoji: "⬇️", cor: "#C62828", bg: "#FFEBEE" },
                    { d: "Adequado", emoji: "✅", cor: "#2E7D32", bg: "#E8F5E9" },
                    { d: "Excesso", emoji: "⬆️", cor: "#1565C0", bg: "#E3F2FD" },
                  ].map((d) => (
                    <View key={d.d} style={{ backgroundColor: d.bg, borderWidth: 1, borderColor: d.cor + "30", flex: 1 }} className="rounded-xl p-3 items-center">
                      <Text className="text-2xl mb-1">{d.emoji}</Text>
                      <Text style={{ color: d.cor }} className="text-xs font-bold">{d.d}</Text>
                    </View>
                  ))}
                </View>
                <View className="mt-4 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
                  <View style={{ backgroundColor: "#2E7D3215" }} className="p-3">
                    <Text className="text-sm font-bold text-foreground">📊 Banco de Faixas de Referência</Text>
                    <Text className="text-xs text-muted">Exemplo: Alface — Nitrogênio</Text>
                  </View>
                  <View className="p-4 bg-surface flex-row gap-2">
                    {[{ l: "Mínimo", v: "2,5%", cor: "#C62828" }, { l: "Ideal", v: "3,5%", cor: "#2E7D32" }, { l: "Máximo", v: "5,0%", cor: "#1565C0" }].map((f) => (
                      <View key={f.l} style={{ backgroundColor: f.cor + "15", borderWidth: 1, borderColor: f.cor + "30", flex: 1 }} className="rounded-xl p-2 items-center">
                        <Text style={{ color: f.cor }} className="text-xs text-muted">{f.l}</Text>
                        <Text style={{ color: f.cor }} className="text-base font-bold">{f.v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Água */}
            {analiseTab === "Água" && (
              <View>
                <View style={{ backgroundColor: "#0288D1" }} className="rounded-xl p-4 mb-4">
                  <Text className="text-white text-sm font-bold mb-2">💧 Parâmetros de Água (8)</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {AGUA_PARAMS.map((p) => (
                      <View key={p} style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="rounded-full px-2 py-1">
                        <Text className="text-white text-xs">{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Classificação da qualidade</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { c: "Excelente", cor: "#1565C0", emoji: "💎" },
                    { c: "Boa", cor: "#2E7D32", emoji: "✅" },
                    { c: "Restrita", cor: "#F57F17", emoji: "⚠️" },
                    { c: "Inadequada", cor: "#C62828", emoji: "❌" },
                  ].map((cl) => (
                    <View key={cl.c} style={{ backgroundColor: cl.cor + "15", borderWidth: 1, borderColor: cl.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                      <Text className="text-lg">{cl.emoji}</Text>
                      <Text style={{ color: cl.cor }} className="text-xs font-bold">{cl.c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Sementes */}
            {analiseTab === "Sementes" && (
              <View>
                <View style={{ backgroundColor: "#F57F17" }} className="rounded-xl p-4 mb-4">
                  <Text className="text-white text-sm font-bold mb-2">🌱 Análise de Sementes</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["Lote", "Cultivar", "Geração", "Pureza", "Germinação", "Vigor", "Umidade"].map((c) => (
                      <View key={c} style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="rounded-full px-2 py-1">
                        <Text className="text-white text-xs">{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {[
                    { r: "Aprovado", emoji: "✅", cor: "#2E7D32", bg: "#E8F5E9" },
                    { r: "Condicional", emoji: "⚠️", cor: "#F57F17", bg: "#FFF8E1" },
                    { r: "Reprovado", emoji: "❌", cor: "#C62828", bg: "#FFEBEE" },
                  ].map((r) => (
                    <View key={r.r} style={{ backgroundColor: r.bg, borderWidth: 1, borderColor: r.cor + "30", flex: 1 }} className="rounded-xl p-3 items-center">
                      <Text className="text-2xl mb-1">{r.emoji}</Text>
                      <Text style={{ color: r.cor }} className="text-xs font-bold">{r.r}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── MICROBIOLOGIA ─── */}
        {activeTab === "microbio" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Microbiologia e Bioinsumos</Text>
            <Text className="text-xs text-muted mb-4">4 avaliações · 6 bioinsumos · fertilizantes</Text>

            {/* Avaliações */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
              <View style={{ backgroundColor: "#7B1FA2" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔬 Análise Microbiológica</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { a: "Bactérias benéficas", emoji: "🦠", cor: "#2E7D32" },
                  { a: "Fungos benéficos", emoji: "🍄", cor: "#7B1FA2" },
                  { a: "Patógenos", emoji: "⚠️", cor: "#C62828" },
                  { a: "Atividade biológica", emoji: "⚡", cor: "#F57F17" },
                ].map((a) => (
                  <View key={a.a} style={{ backgroundColor: a.cor + "15", borderWidth: 1, borderColor: a.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text className="text-xl mb-1">{a.emoji}</Text>
                    <Text style={{ color: a.cor }} className="text-xs font-bold">{a.a}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bioinsumos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌿 Banco de Bioinsumos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Azospirillum", "Rhizobium", "Trichoderma", "Bacillus subtilis", "Metarhizium", "Beauveria"].map((b) => (
                  <View key={b} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold italic">{b}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fertilizantes */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#F57F1715" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🧪 Banco de Fertilizantes</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { cat: "Orgânicos", items: ["Composto Orgânico", "Húmus", "Bokashi"], cor: "#558B2F" },
                  { cat: "Minerais", items: ["Ureia", "MAP", "DAP", "KCl"], cor: "#1565C0" },
                  { cat: "Organominerais", items: ["Organomineral NPK"], cor: "#7B1FA2" },
                  { cat: "Biológicos", items: ["Azospirillum", "Rhizobium"], cor: "#2E7D32" },
                ].map((f) => (
                  <View key={f.cat} className="mb-3">
                    <View style={{ backgroundColor: f.cor, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 6 }}>
                      <Text className="text-white text-xs font-bold">{f.cat}</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-1">
                      {f.items.map((i) => (
                        <View key={i} style={{ backgroundColor: f.cor + "15", borderWidth: 1, borderColor: f.cor + "30" }} className="rounded-full px-2 py-0.5">
                          <Text style={{ color: f.cor }} className="text-xs">{i}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── LAUDOS ─── */}
        {activeTab === "laudos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Laudos e Certificados</Text>
            <Text className="text-xs text-muted mb-4">Laudo automático · PDF/HTML/JSON · QR Code · Certificado</Text>

            {/* Laudo Automático */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1A237E30" }}>
              <View style={{ backgroundColor: "#1A237E" }} className="p-3">
                <Text className="text-white text-sm font-bold">📄 Laudo Automático</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { s: "Identificação", emoji: "🪪", cor: "#1565C0" },
                  { s: "Resultados", emoji: "📊", cor: "#2E7D32" },
                  { s: "Interpretação", emoji: "🔍", cor: "#F57F17" },
                  { s: "Diagnóstico", emoji: "🩺", cor: "#7B1FA2" },
                  { s: "Recomendações", emoji: "💡", cor: "#E65100" },
                  { s: "Assinatura Digital", emoji: "✍️", cor: "#1A237E" },
                ].map((s, i) => (
                  <View key={s.s} className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: s.cor, width: 24, height: 24, borderRadius: 12 }} className="items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{i + 1}</Text>
                    </View>
                    <Text className="text-lg mr-2">{s.emoji}</Text>
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Formatos */}
            <View className="flex-row gap-2 mb-4">
              {[
                { f: "PDF", emoji: "📕", cor: "#C62828", bg: "#FFEBEE" },
                { f: "HTML", emoji: "🌐", cor: "#1565C0", bg: "#E3F2FD" },
                { f: "JSON", emoji: "⚙️", cor: "#2E7D32", bg: "#E8F5E9" },
              ].map((fmt) => (
                <View key={fmt.f} style={{ backgroundColor: fmt.bg, borderWidth: 1, borderColor: fmt.cor + "30", flex: 1 }} className="rounded-xl p-3 items-center">
                  <Text className="text-2xl mb-1">{fmt.emoji}</Text>
                  <Text style={{ color: fmt.cor }} className="text-sm font-bold">{fmt.f}</Text>
                </View>
              ))}
            </View>

            {/* QR Code */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1A237E30" }}>
              <View style={{ backgroundColor: "#1A237E15" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">📱 QR Code por Laudo</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["Código único", "Validação online", "Rastreabilidade"].map((q) => (
                  <View key={q} style={{ backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#3949AB30", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#1A237E" }} className="text-xs font-bold text-center">{q}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Certificado Digital */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🏅 Certificado Digital</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Número", "Data", "Validade", "Assinatura"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#F57F17" }} className="text-xs font-semibold">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── IA ─── */}
        {activeTab === "ia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Integração com IA</Text>
            <Text className="text-xs text-muted mb-4">6 perguntas · integração completa com banco AFU</Text>

            {/* Perguntas IA */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🤖 Perguntas respondidas pela IA</Text>
              {[
                { q: "O solo está adequado?", emoji: "🪨" },
                { q: "Qual corretivo aplicar?", emoji: "🧪" },
                { q: "Qual adubo utilizar?", emoji: "🌿" },
                { q: "Existe deficiência nutricional?", emoji: "⚠️" },
                { q: "A água é adequada para irrigação?", emoji: "💧" },
                { q: "As sementes são viáveis?", emoji: "🌱" },
              ].map((p) => (
                <View key={p.q} className="flex-row items-center mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Text className="text-base mr-2">{p.emoji}</Text>
                  <Text style={{ color: "#E3F2FD" }} className="text-xs">{p.q}</Text>
                </View>
              ))}
            </View>

            {/* Recomendação de Correção */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#4E342E30" }}>
              <View style={{ backgroundColor: "#4E342E15" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🔧 Recomendação de Correção</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { t: "Calagem", items: ["Dose estimada", "Tipo de calcário", "PRNT"], cor: "#4E342E" },
                  { t: "Gessagem", items: ["Necessidade", "Dose"], cor: "#795548" },
                  { t: "Adubação", items: ["N", "P", "K", "Micronutrientes"], cor: "#2E7D32" },
                ].map((r) => (
                  <View key={r.t} className="mb-3">
                    <View style={{ backgroundColor: r.cor, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 4 }}>
                      <Text className="text-white text-xs font-bold">{r.t}</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-1">
                      {r.items.map((i) => (
                        <View key={i} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "30" }} className="rounded-full px-2 py-0.5">
                          <Text style={{ color: r.cor }} className="text-xs">{i}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Integração */}
            <View style={{ backgroundColor: "#1A237E" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">🔗 Integração com Banco AFU</Text>
              <View className="items-center">
                {["🔬 Laboratório", "+", "🪨 Solo", "+", "🌍 Clima", "+", "🌱 Cultura", "+", "🧬 Genética", "+", "📅 Calendário"].map((e, i) => (
                  <Text key={i} style={{ color: e === "+" ? "#9FA8DA" : "white" }} className={e === "+" ? "text-base" : "text-xs font-bold py-0.5"}>{e}</Text>
                ))}
                <View style={{ backgroundColor: "rgba(255,255,255,0.15)" }} className="rounded-lg px-4 py-2 mt-2">
                  <Text className="text-white text-xs font-bold text-center">→ Diagnóstico e laudo automatizados</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dashboard Laboratorial</Text>
            <Text className="text-xs text-muted mb-4">4 KPIs · 3 indicadores técnicos · resultado</Text>

            {/* KPIs */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { ind: "Amostras recebidas", n: "—", emoji: "📥", cor: "#1565C0" },
                { ind: "Em análise", n: "—", emoji: "🔬", cor: "#F57F17" },
                { ind: "Laudos emitidos", n: "—", emoji: "📄", cor: "#2E7D32" },
                { ind: "Pendências", n: "—", emoji: "⏳", cor: "#C62828" },
              ].map((k) => (
                <View key={k.ind} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-2xl mb-1">{k.emoji}</Text>
                  <Text style={{ color: k.cor }} className="text-xl font-bold">{k.n}</Text>
                  <Text className="text-xs text-muted">{k.ind}</Text>
                </View>
              ))}
            </View>

            {/* Indicadores Técnicos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1A237E30" }}>
              <View style={{ backgroundColor: "#1A237E" }} className="p-3">
                <Text className="text-white text-sm font-bold">🎯 Indicadores Técnicos — Metas</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { m: "Precisão", meta: "> 98%", cor: "#2E7D32" },
                  { m: "Tempo de emissão", meta: "< 5 min", cor: "#1565C0" },
                  { m: "Disponibilidade", meta: "> 99%", cor: "#7B1FA2" },
                ].map((t) => (
                  <View key={t.m} className="flex-row items-center justify-between mb-2 rounded-lg p-2" style={{ backgroundColor: t.cor + "10" }}>
                    <Text style={{ color: t.cor }} className="text-xs font-bold">{t.m}</Text>
                    <View style={{ backgroundColor: t.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{t.meta}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Resultado */}
            <View style={{ backgroundColor: "#1A237E" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">✅ Resultado</Text>
              <Text style={{ color: "#C5CAE9" }} className="text-xs mb-3">
                O AFU passa a possuir um laboratório digital completo capaz de gerar diagnósticos e laudos técnicos automatizados, integrados ao sistema agronômico.
              </Text>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)" }} className="rounded-lg p-3">
                <Text style={{ color: "#9FA8DA" }} className="text-xs font-bold">Próxima: Etapa 40</Text>
                <Text className="text-white text-xs">AFU Economia Agrícola e Previsão de Produção — custos, rentabilidade, fluxo de caixa, previsão de safra, análise de mercado</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
