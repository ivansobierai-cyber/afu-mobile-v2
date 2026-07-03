import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "classes", label: "Classes" },
  { id: "fisico", label: "Físico" },
  { id: "fertilidade", label: "Fertilidade" },
  { id: "correcao", label: "Correção" },
  { id: "cultura", label: "Solo × Cultura" },
  { id: "iqs", label: "IQS" },
];

const CLASSES_SOLO = [
  { nome: "Latossolo", emoji: "🟤", cor: "#4E342E", bg: "#EFEBE9", desc: "Profundos, bem drenados, muito comuns no Brasil, boa mecanização", aptidao: ["Café", "Mandioca", "Tomate", "Batata-doce", "Morango", "Frutíferas"] },
  { nome: "Argissolo", emoji: "🟫", cor: "#6D4C41", bg: "#EFEBE9", desc: "Diferença entre camadas, média fertilidade, necessita manejo adequado", aptidao: ["Mandioca", "Batata-doce", "Frutíferas", "Pastagens"] },
  { nome: "Cambissolo", emoji: "🌿", cor: "#558B2F", bg: "#F1F8E9", desc: "Solos jovens em processo de formação, variável em fertilidade", aptidao: ["Hortaliças", "Pastagens", "Reflorestamento"] },
  { nome: "Neossolo", emoji: "🪨", cor: "#78909C", bg: "#ECEFF1", desc: "Jovens, pouco desenvolvidos, baixa profundidade", aptidao: ["Hortaliças específicas", "Fruticultura manejada"] },
  { nome: "Nitossolo", emoji: "🌱", cor: "#2E7D32", bg: "#E8F5E9", desc: "Alta fertilidade natural, boa estrutura, presença de argila 2:1", aptidao: ["Café", "Milho", "Soja", "Frutíferas"] },
  { nome: "Gleissolo", emoji: "💧", cor: "#1565C0", bg: "#E3F2FD", desc: "Hidromórficos, saturados com água, horizonte glei", aptidao: ["Arroz irrigado", "Pastagens", "Hortaliças com drenagem"] },
  { nome: "Planossolo", emoji: "🌾", cor: "#F57F17", bg: "#FFF8E1", desc: "Horizonte B plânico, drenagem impedida, típico do RS", aptidao: ["Arroz", "Pastagens"] },
  { nome: "Vertissolo", emoji: "🔄", cor: "#880E4F", bg: "#FCE4EC", desc: "Alta expansão e contração, fendas na seca, típico do NE", aptidao: ["Pastagens", "Algodão", "Sorgo"] },
  { nome: "Espodossolo", emoji: "⬜", cor: "#546E7A", bg: "#ECEFF1", desc: "Horizonte espódico, solos arenosos de baixa fertilidade", aptidao: ["Silvicultura", "Pastagens extensivas"] },
  { nome: "Organossolo", emoji: "🍂", cor: "#33691E", bg: "#F9FBE7", desc: "Ricos em matéria orgânica, solos turfosos, alta retenção de água", aptidao: ["Horticultura intensiva", "Flores"] },
  { nome: "Luvissolo", emoji: "🌻", cor: "#E65100", bg: "#FBE9E7", desc: "Alta saturação de bases, boa fertilidade, típico do Nordeste semiárido", aptidao: ["Feijão", "Milho", "Fruticultura"] },
  { nome: "Plintossolo", emoji: "🔴", cor: "#C62828", bg: "#FFEBEE", desc: "Presença de plintita (petroplintita), típico do Cerrado e Norte", aptidao: ["Pastagens", "Culturas anuais com manejo"] },
];

const TEXTURAS = [
  { nome: "Arenoso", areia: ">70%", silte: "<15%", argila: "<15%", cor: "#F57F17", desc: "Baixa retenção de água, boa drenagem" },
  { nome: "Franco Arenoso", areia: "50-70%", silte: "15-30%", argila: "10-20%", cor: "#FF8F00", desc: "Boa drenagem, moderada retenção" },
  { nome: "Franco", areia: "25-50%", silte: "25-50%", argila: "10-25%", cor: "#2E7D32", desc: "Equilíbrio ideal, boa estrutura" },
  { nome: "Franco Argiloso", areia: "20-45%", silte: "15-55%", argila: "25-40%", cor: "#1565C0", desc: "Boa fertilidade, retenção moderada" },
  { nome: "Argiloso", areia: "<45%", silte: "<40%", argila: "40-60%", cor: "#4E342E", desc: "Alta retenção, pode compactar" },
  { nome: "Muito Argiloso", areia: "<45%", silte: "<40%", argila: ">60%", cor: "#880E4F", desc: "Muito alta retenção, drenagem lenta" },
];

const PH_CLASSES = [
  { classe: "Muito ácido", faixa: "< 4,5", cor: "#C62828", bg: "#FFEBEE" },
  { classe: "Ácido", faixa: "4,5 – 5,5", cor: "#E65100", bg: "#FBE9E7" },
  { classe: "Levemente ácido", faixa: "5,5 – 6,5", cor: "#F57F17", bg: "#FFF8E1" },
  { classe: "Neutro", faixa: "6,5 – 7,0", cor: "#2E7D32", bg: "#E8F5E9" },
  { classe: "Alcalino", faixa: "7,0 – 8,5", cor: "#1565C0", bg: "#E3F2FD" },
  { classe: "Muito alcalino", faixa: "> 8,5", cor: "#880E4F", bg: "#FCE4EC" },
];

const MACRONUTRIENTES = [
  { simbolo: "N", nome: "Nitrogênio", funcao: "Crescimento vegetativo, clorofila", cor: "#2E7D32" },
  { simbolo: "P", nome: "Fósforo", funcao: "Raízes, floração, frutificação", cor: "#E65100" },
  { simbolo: "K", nome: "Potássio", funcao: "Resistência, qualidade dos frutos", cor: "#1565C0" },
  { simbolo: "Ca", nome: "Cálcio", funcao: "Estrutura celular, pH do solo", cor: "#F57F17" },
  { simbolo: "Mg", nome: "Magnésio", funcao: "Clorofila, fotossíntese", cor: "#4E342E" },
  { simbolo: "S", nome: "Enxofre", funcao: "Proteínas, enzimas, sabor", cor: "#880E4F" },
];

const MICRONUTRIENTES = [
  { simbolo: "B", nome: "Boro", cor: "#1B5E20" },
  { simbolo: "Zn", nome: "Zinco", cor: "#0D47A1" },
  { simbolo: "Fe", nome: "Ferro", cor: "#BF360C" },
  { simbolo: "Mn", nome: "Manganês", cor: "#4A148C" },
  { simbolo: "Cu", nome: "Cobre", cor: "#E65100" },
  { simbolo: "Mo", nome: "Molibdênio", cor: "#006064" },
];

const SOLO_CULTURA = [
  { cultura: "☕ Café Arábica", solo: "Latossolo / Nitossolo", ph: "5,5 – 6,5", textura: "Franco Argiloso", drenagem: "Boa", mo: "Alta", cor: "#4E342E" },
  { cultura: "🍓 Morango", solo: "Franco Arenoso", ph: "5,5 – 6,5", textura: "Franco Arenoso", drenagem: "Boa", mo: "Média-Alta", cor: "#E53935" },
  { cultura: "🥬 Alface", solo: "Franco", ph: "6,0 – 7,0", textura: "Franco", drenagem: "Moderada", mo: "Alta", cor: "#2E7D32" },
  { cultura: "🍅 Tomate", solo: "Franco Argiloso", ph: "5,5 – 6,8", textura: "Franco Argiloso", drenagem: "Boa", mo: "Média", cor: "#E53935" },
  { cultura: "🌾 Mandioca", solo: "Arenoso / Franco Arenoso", ph: "5,0 – 6,5", textura: "Arenoso", drenagem: "Boa", mo: "Baixa-Média", cor: "#F57F17" },
];

export default function AfuSolosScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("classes");
  const [expandedSolo, setExpandedSolo] = useState<string | null>(null);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#4E342E" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#6D4C41" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌍</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Solos</Text>
            <Text style={{ color: "#BCAAA4" }} className="text-xs">
              Banco Nacional de Solos · 12 Classes · IQS 0–100
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 36</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#4E342E" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#4E342E", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── CLASSES ─── */}
        {activeTab === "classes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Classes de Solos Brasileiros</Text>
            <Text className="text-xs text-muted mb-4">Sistema Brasileiro de Classificação de Solos · 12 grupos</Text>

            {CLASSES_SOLO.map((s) => (
              <TouchableOpacity
                key={s.nome}
                onPress={() => setExpandedSolo(expandedSolo === s.nome ? null : s.nome)}
                className="mb-3 rounded-xl overflow-hidden"
                style={{ borderWidth: 1, borderColor: s.cor + "40" }}
              >
                <View style={{ backgroundColor: s.bg }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-3">{s.emoji}</Text>
                  <View className="flex-1">
                    <Text style={{ color: s.cor }} className="text-sm font-bold">{s.nome}</Text>
                    <Text className="text-xs text-muted">{s.desc}</Text>
                  </View>
                  <Text style={{ color: s.cor }} className="text-lg">{expandedSolo === s.nome ? "▲" : "▼"}</Text>
                </View>
                {expandedSolo === s.nome && (
                  <View style={{ backgroundColor: colors.surface }} className="p-3">
                    <Text className="text-xs font-bold text-foreground mb-2">Culturas com aptidão:</Text>
                    <View className="flex-row flex-wrap gap-1">
                      {s.aptidao.map((a) => (
                        <View key={a} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30" }} className="rounded-full px-2 py-0.5">
                          <Text style={{ color: s.cor }} className="text-xs">{a}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── FÍSICO ─── */}
        {activeTab === "fisico" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Propriedades Físicas do Solo</Text>
            <Text className="text-xs text-muted mb-4">Textura · pH · Drenagem · Compactação · Retenção Hídrica</Text>

            {/* Textura */}
            <Text className="text-sm font-bold text-foreground mb-3">Banco de Textura</Text>
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View className="p-4 bg-surface">
                {TEXTURAS.map((t) => (
                  <View key={t.nome} className="py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View className="flex-row items-center mb-1">
                      <View style={{ backgroundColor: t.cor, minWidth: 110 }} className="rounded-full px-2 py-0.5 mr-3">
                        <Text className="text-white text-xs font-bold text-center">{t.nome}</Text>
                      </View>
                      <Text className="text-xs text-muted flex-1">{t.desc}</Text>
                    </View>
                    <View className="flex-row gap-2 ml-1">
                      <Text className="text-xs text-muted">Areia: <Text className="font-bold text-foreground">{t.areia}</Text></Text>
                      <Text className="text-xs text-muted">Silte: <Text className="font-bold text-foreground">{t.silte}</Text></Text>
                      <Text className="text-xs text-muted">Argila: <Text className="font-bold text-foreground">{t.argila}</Text></Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* pH */}
            <Text className="text-sm font-bold text-foreground mb-3">Banco de pH</Text>
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View className="p-4 bg-surface">
                {PH_CLASSES.map((p) => (
                  <View key={p.classe} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: p.bg, width: 120 }} className="rounded-lg py-1 px-2 mr-3">
                      <Text style={{ color: p.cor }} className="text-xs font-bold">{p.classe}</Text>
                    </View>
                    <Text className="text-xs text-muted">{p.faixa}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Drenagem */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">💧 Banco de Drenagem</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { d: "Excessiva", cor: "#C62828" },
                  { d: "Boa", cor: "#2E7D32" },
                  { d: "Moderada", cor: "#1565C0" },
                  { d: "Imperfeita", cor: "#F57F17" },
                  { d: "Ruim", cor: "#E65100" },
                  { d: "Muito ruim", cor: "#880E4F" },
                ].map((d) => (
                  <View key={d.d} style={{ backgroundColor: d.cor + "15", borderWidth: 1, borderColor: d.cor + "30" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: d.cor }} className="text-xs font-semibold">{d.d}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Compactação */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#4E342E30" }}>
              <View style={{ backgroundColor: "#4E342E15" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🔩 Banco de Compactação</Text>
                <Text className="text-xs text-muted">Campos: grau_compactacao · profundidade · solo_id</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { g: "Baixa", cor: "#2E7D32" },
                  { g: "Moderada", cor: "#F57F17" },
                  { g: "Alta", cor: "#E65100" },
                  { g: "Crítica", cor: "#C62828" },
                ].map((g) => (
                  <View key={g.g} style={{ backgroundColor: g.cor + "15", borderWidth: 1, borderColor: g.cor + "30" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: g.cor }} className="text-xs font-semibold">{g.g}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Retenção Hídrica */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D115" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">💦 Banco de Retenção Hídrica</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2 mb-2">
                  {[
                    { campo: "capacidade_campo", desc: "Máx. água retida", cor: "#1565C0" },
                    { campo: "ponto_murcha", desc: "Mín. disponível", cor: "#E65100" },
                    { campo: "agua_disponivel", desc: "Campo – Murcha", cor: "#2E7D32" },
                  ].map((c) => (
                    <View key={c.campo} style={{ backgroundColor: c.cor + "15", flex: 1 }} className="rounded-lg p-2">
                      <Text style={{ color: c.cor }} className="text-xs font-bold">{c.campo}</Text>
                      <Text className="text-xs text-muted">{c.desc}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-2">
                  {["Baixa", "Média", "Alta"].map((r, i) => (
                    <View key={r} style={{ backgroundColor: ["#FBE9E7", "#FFF8E1", "#E8F5E9"][i], flex: 1 }} className="rounded-full py-1 items-center">
                      <Text style={{ color: ["#E65100", "#F57F17", "#2E7D32"][i] }} className="text-xs font-bold">{r}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── FERTILIDADE ─── */}
        {activeTab === "fertilidade" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Fertilidade e Nutrientes</Text>
            <Text className="text-xs text-muted mb-4">6 macronutrientes · 6 micronutrientes · Matéria orgânica</Text>

            {/* Macronutrientes */}
            <Text className="text-sm font-bold text-foreground mb-3">Macronutrientes</Text>
            <View className="gap-2 mb-4">
              {MACRONUTRIENTES.map((n) => (
                <View key={n.simbolo} style={{ backgroundColor: n.cor + "15", borderWidth: 1, borderColor: n.cor + "30" }} className="rounded-xl p-3 flex-row items-center">
                  <View style={{ backgroundColor: n.cor, width: 40, height: 40 }} className="rounded-xl items-center justify-center mr-3">
                    <Text className="text-white text-base font-bold">{n.simbolo}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: n.cor }} className="text-sm font-bold">{n.nome}</Text>
                    <Text className="text-xs text-muted">{n.funcao}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Micronutrientes */}
            <Text className="text-sm font-bold text-foreground mb-3">Micronutrientes</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {MICRONUTRIENTES.map((m) => (
                <View key={m.simbolo} style={{ backgroundColor: m.cor + "15", borderWidth: 1, borderColor: m.cor + "30", width: "30%" }} className="rounded-xl p-3 items-center">
                  <View style={{ backgroundColor: m.cor, width: 36, height: 36 }} className="rounded-lg items-center justify-center mb-1">
                    <Text className="text-white text-sm font-bold">{m.simbolo}</Text>
                  </View>
                  <Text style={{ color: m.cor }} className="text-xs font-bold">{m.nome}</Text>
                </View>
              ))}
            </View>

            {/* Fertilidade */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">📊 Banco de Fertilidade</Text>
                <Text className="text-xs text-muted">Campos: fertilidade · capacidade_troca_cations · saturacao_bases</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { f: "Muito baixa", cor: "#C62828", bg: "#FFEBEE", w: "20%" },
                  { f: "Baixa", cor: "#E65100", bg: "#FBE9E7", w: "40%" },
                  { f: "Média", cor: "#F57F17", bg: "#FFF8E1", w: "60%" },
                  { f: "Alta", cor: "#2E7D32", bg: "#E8F5E9", w: "80%" },
                  { f: "Muito alta", cor: "#1B5E20", bg: "#E8F5E9", w: "100%" },
                ].map((f) => (
                  <View key={f.f} className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <View style={{ backgroundColor: f.bg }} className="rounded-full px-2 py-0.5">
                        <Text style={{ color: f.cor }} className="text-xs font-bold">{f.f}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: "#F0F0F0", height: 8, borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ backgroundColor: f.cor, height: 8, borderRadius: 4, width: f.w as any }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Matéria Orgânica */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#33691E30" }}>
              <View style={{ backgroundColor: "#33691E" }} className="p-3">
                <Text className="text-white text-sm font-bold">🍂 Banco de Matéria Orgânica</Text>
                <Text style={{ color: "#DCEDC8" }} className="text-xs">Campos: percentual · classificacao · solo_id</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Muito baixa (< 1%)", "Baixa (1–2%)", "Média (2–4%)", "Alta (4–6%)", "Muito alta (> 6%)"].map((m, i) => (
                  <View key={m} style={{ backgroundColor: ["#FFEBEE", "#FBE9E7", "#FFF8E1", "#E8F5E9", "#C8E6C9"][i] }} className="rounded-full px-3 py-1">
                    <Text style={{ color: ["#C62828", "#E65100", "#F57F17", "#2E7D32", "#1B5E20"][i] }} className="text-xs font-semibold">{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── CORREÇÃO ─── */}
        {activeTab === "correcao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Banco de Correção e Microbiologia</Text>
            <Text className="text-xs text-muted mb-4">Calcário · Gesso · Matéria Orgânica · 5 microrganismos</Text>

            {/* Calcário */}
            <View className="rounded-xl overflow-hidden mb-3" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🪨 Calcário</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2">
                  {["Elevar pH do solo", "Reduzir alumínio tóxico", "Fornecer Ca e Mg"].map((u) => (
                    <View key={u} style={{ backgroundColor: "#FFF8E1", flex: 1 }} className="rounded-lg p-2 items-center">
                      <Text className="text-xs text-center" style={{ color: "#F57F17" }}>{u}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Gesso Agrícola */}
            <View className="rounded-xl overflow-hidden mb-3" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">⬜ Gesso Agrícola</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2">
                  {["Correção em profundidade", "Fornecimento de Ca e S", "Reduz Al subsolado"].map((u) => (
                    <View key={u} style={{ backgroundColor: "#E3F2FD", flex: 1 }} className="rounded-lg p-2 items-center">
                      <Text className="text-xs text-center" style={{ color: "#1565C0" }}>{u}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Matéria Orgânica */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#33691E30" }}>
              <View style={{ backgroundColor: "#33691E" }} className="p-3">
                <Text className="text-white text-sm font-bold">🍂 Matéria Orgânica</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row gap-2">
                  {["Aumentar fertilidade", "Melhorar retenção de água", "Melhorar microbiologia"].map((u) => (
                    <View key={u} style={{ backgroundColor: "#F9FBE7", flex: 1 }} className="rounded-lg p-2 items-center">
                      <Text className="text-xs text-center" style={{ color: "#33691E" }}>{u}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Microbiologia */}
            <Text className="text-sm font-bold text-foreground mb-3">Banco de Microbiologia do Solo</Text>
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D3215" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">🦠 Microrganismos Benéficos</Text>
                <Text className="text-xs text-muted">Campos: atividade_microbiana · fungos_beneficos · bacterias_beneficas</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { nome: "Micorrizas", tipo: "Fungo", funcao: "Absorção de fósforo e água", cor: "#2E7D32" },
                  { nome: "Rhizobium", tipo: "Bactéria", funcao: "Fixação biológica de nitrogênio", cor: "#1565C0" },
                  { nome: "Azospirillum", tipo: "Bactéria", funcao: "Fixação de N + hormônios de crescimento", cor: "#0288D1" },
                  { nome: "Trichoderma", tipo: "Fungo", funcao: "Controle biológico de patógenos", cor: "#E65100" },
                  { nome: "Bacillus", tipo: "Bactéria", funcao: "Solubilização de fósforo + biocontrole", cor: "#880E4F" },
                ].map((m) => (
                  <View key={m.nome} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: m.cor, width: 36, height: 36 }} className="rounded-full items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{m.tipo[0]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: m.cor }} className="text-xs font-bold">{m.nome}</Text>
                      <Text className="text-xs text-muted">{m.tipo} · {m.funcao}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── SOLO × CULTURA ─── */}
        {activeTab === "cultura" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Relação Solo × Cultura</Text>
            <Text className="text-xs text-muted mb-4">5 culturas com preferências de solo, pH e textura</Text>

            {SOLO_CULTURA.map((s) => (
              <View key={s.cultura} className="mb-4 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: s.cor + "40" }}>
                <View style={{ backgroundColor: s.cor }} className="p-3">
                  <Text className="text-white text-sm font-bold">{s.cultura}</Text>
                </View>
                <View className="p-4 bg-surface">
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { label: "Solo", valor: s.solo },
                      { label: "pH", valor: s.ph },
                      { label: "Textura", valor: s.textura },
                      { label: "Drenagem", valor: s.drenagem },
                      { label: "Mat. Orgânica", valor: s.mo },
                    ].map((i) => (
                      <View key={i.label} style={{ backgroundColor: s.cor + "10", width: "47%" }} className="rounded-lg p-2">
                        <Text className="text-xs text-muted">{i.label}</Text>
                        <Text style={{ color: s.cor }} className="text-xs font-bold">{i.valor}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}

            {/* Integração */}
            <View style={{ backgroundColor: "#4E342E" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">Integração AFU Solos + GeoClima</Text>
              <View className="flex-row flex-wrap gap-1">
                {["Solo", "+", "Clima", "+", "Cultura", "+", "Nutrientes", "+", "Irrigação", "+", "Genética", "=", "Recomendação Avançada"].map((item, i) => (
                  <View key={i} style={{ backgroundColor: item === "=" || item === "+" ? "transparent" : "#6D4C41" }} className="rounded-full px-2 py-1">
                    <Text style={{ color: item === "=" || item === "+" ? "#BCAAA4" : "#EFEBE9" }} className="text-xs font-bold">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── IQS ─── */}
        {activeTab === "iqs" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Índice de Qualidade do Solo (IQS)</Text>
            <Text className="text-xs text-muted mb-4">Escala 0–100 · 6 componentes · Exemplo diagnóstico</Text>

            {/* Componentes */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#4E342E15" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Componentes do IQS</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { c: "pH", emoji: "⚗️", cor: "#F57F17" },
                  { c: "Matéria orgânica", emoji: "🍂", cor: "#33691E" },
                  { c: "Fertilidade", emoji: "🌱", cor: "#2E7D32" },
                  { c: "Microbiologia", emoji: "🦠", cor: "#1565C0" },
                  { c: "Compactação", emoji: "🔩", cor: "#4E342E" },
                  { c: "Drenagem", emoji: "💧", cor: "#0288D1" },
                ].map((c) => (
                  <View key={c.c} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text className="text-lg mb-1">{c.emoji}</Text>
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Escala IQS */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#4E342E15" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Escala IQS 0–100</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { faixa: "81–100", classe: "Excelente", cor: "#1B5E20", bg: "#E8F5E9", w: "100%" },
                  { faixa: "61–80", classe: "Bom", cor: "#2E7D32", bg: "#E8F5E9", w: "80%" },
                  { faixa: "41–60", classe: "Regular", cor: "#F57F17", bg: "#FFF8E1", w: "60%" },
                  { faixa: "21–40", classe: "Ruim", cor: "#E65100", bg: "#FBE9E7", w: "40%" },
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

            {/* Exemplo Diagnóstico */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#4E342E30" }}>
              <View style={{ backgroundColor: "#4E342E" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔬 Exemplo de Diagnóstico</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs font-bold text-foreground mb-2">Entrada:</Text>
                <View className="flex-row gap-2 mb-3">
                  {[
                    { label: "Solo", valor: "Latossolo", cor: "#4E342E" },
                    { label: "pH", valor: "4,8 (Ácido)", cor: "#E65100" },
                    { label: "Mat. Org.", valor: "2%", cor: "#33691E" },
                    { label: "Potássio", valor: "Baixo", cor: "#C62828" },
                  ].map((i) => (
                    <View key={i.label} style={{ backgroundColor: i.cor + "15", flex: 1 }} className="rounded-lg p-2">
                      <Text className="text-xs text-muted">{i.label}</Text>
                      <Text style={{ color: i.cor }} className="text-xs font-bold">{i.valor}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730" }} className="rounded-xl p-3 mb-3">
                  <Text style={{ color: "#F57F17" }} className="text-sm font-bold">IQS: 58 — Regular</Text>
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Saída da IA:</Text>
                {[
                  { label: "Correção", valor: "Aplicar calcário (pH 4,8 → 6,0)", emoji: "🪨", cor: "#F57F17" },
                  { label: "Melhoria", valor: "Adicionar composto orgânico", emoji: "🍂", cor: "#33691E" },
                  { label: "Adubação", valor: "Potássio recomendado (K baixo)", emoji: "🌱", cor: "#1565C0" },
                  { label: "Culturas", valor: "Mandioca · Batata-doce · Café após correção", emoji: "✅", cor: "#2E7D32" },
                ].map((r) => (
                  <View key={r.label} className="flex-row items-start mb-2">
                    <Text className="text-base mr-2">{r.emoji}</Text>
                    <View className="flex-1">
                      <Text style={{ color: r.cor }} className="text-xs font-bold">{r.label}</Text>
                      <Text className="text-xs text-muted">{r.valor}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Perguntas IA */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">🤖 Perguntas respondidas pela IA</Text>
              {["Meu solo é adequado para esta cultura?", "Preciso corrigir o pH?", "Qual adubo usar?", "Qual cultura produz melhor?", "Qual produtividade posso esperar?", "Quanto irrigar?"].map((q) => (
                <View key={q} className="flex-row items-center mb-1">
                  <View style={{ backgroundColor: "#1565C0", width: 6, height: 6 }} className="rounded-full mr-2" />
                  <Text style={{ color: "#E3F2FD" }} className="text-xs">{q}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
