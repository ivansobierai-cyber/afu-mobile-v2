import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "pragas", label: "Pragas" },
  { id: "doencas", label: "Doenças" },
  { id: "rotacao", label: "Rotação" },
  { id: "genetica", label: "Genética" },
  { id: "multiplicacao", label: "Multiplicação" },
  { id: "ia", label: "IA" },
];

const NIVEL_COR: Record<string, { bg: string; text: string }> = {
  "Crítico": { bg: "#FFEBEE", text: "#C62828" },
  "Muito Alto": { bg: "#FBE9E7", text: "#BF360C" },
  "Alto": { bg: "#FFF8E1", text: "#E65100" },
  "Médio": { bg: "#E8F5E9", text: "#2E7D32" },
};

const PRAGAS = [
  {
    nome: "Pulgão",
    cientifico: "Aphididae spp.",
    grupo: "Inseto",
    nivel: "Alto",
    culturas: ["Alface", "Tomate", "Brócolis", "Couve-flor", "Repolho", "Salsa", "Coentro", "Morango"],
    sintomas: ["Enrolamento de folhas", "Melada", "Redução de crescimento"],
    biologico: "Joaninhas, vespas parasitoides",
    organico: "Extrato de alho, nim",
    quimico: "Imidacloprido, tiametoxam",
    cor: "#FF6F00",
    emoji: "🐛",
  },
  {
    nome: "Mosca-branca",
    cientifico: "Bemisia tabaci",
    grupo: "Inseto",
    nivel: "Muito Alto",
    culturas: ["Tomate", "Mandioca", "Batata-doce", "Morango"],
    sintomas: ["Folhas amarelas", "Fumagina", "Transmissão de vírus"],
    biologico: "Encarsia formosa, Eretmocerus",
    organico: "Armadilhas amarelas, nim",
    quimico: "Spiromesifen, buprofezin",
    cor: "#F9A825",
    emoji: "🦟",
  },
  {
    nome: "Lagarta-do-cartucho",
    cientifico: "Spodoptera frugiperda",
    grupo: "Lepidóptero",
    nivel: "Crítico",
    culturas: ["Milho", "Batata-doce", "Mandioca"],
    sintomas: ["Folhas perfuradas", "Cartucho destruído", "Excrementos"],
    biologico: "Bacillus thuringiensis, Trichogramma",
    organico: "Extrato de nim, armadilhas de feromônio",
    quimico: "Clorantraniliprole, spinosade",
    cor: "#C62828",
    emoji: "🐛",
  },
  {
    nome: "Traça-do-tomateiro",
    cientifico: "Tuta absoluta",
    grupo: "Lepidóptero",
    nivel: "Crítico",
    culturas: ["Tomate"],
    sintomas: ["Galerias nas folhas", "Frutos perfurados", "Mumificação"],
    biologico: "Trichogramma pretiosum, Nesidiocoris",
    organico: "Armadilhas de feromônio, nim",
    quimico: "Clorantraniliprole, indoxacarbe",
    cor: "#B71C1C",
    emoji: "🦋",
  },
  {
    nome: "Ácaros",
    cientifico: "Tetranychus spp.",
    grupo: "Ácaro",
    nivel: "Alto",
    culturas: ["Morango", "Tomate", "Amora", "Framboesa", "Café"],
    sintomas: ["Bronzeamento foliar", "Teia fina", "Queda de folhas"],
    biologico: "Phytoseiidae predadores",
    organico: "Enxofre molhável, extrato de alho",
    quimico: "Abamectina, bifenazate",
    cor: "#E65100",
    emoji: "🕷️",
  },
  {
    nome: "Broca-do-café",
    cientifico: "Hypothenemus hampei",
    grupo: "Coleóptero",
    nivel: "Crítico",
    culturas: ["Café Arábica"],
    sintomas: ["Frutos perfurados", "Grãos brocados", "Queda prematura"],
    biologico: "Beauveria bassiana, Cephalonomia",
    organico: "Coleta de frutos brocados, armadilhas",
    quimico: "Endossulfam (restrito), clorpirifós",
    cor: "#4E342E",
    emoji: "☕",
  },
];

const DOENCAS = [
  {
    nome: "Ferrugem do Café",
    agente: "Hemileia vastatrix",
    tipo: "Fúngica",
    nivel: "Crítico",
    culturas: ["Café Arábica"],
    sintomas: ["Manchas amarelas na face superior", "Pó alaranjado na face inferior", "Desfolha precoce"],
    condicoes: "Alta umidade, temperaturas entre 22–25°C, período chuvoso",
    controle: "Fungicidas cúpricos, triazóis; variedades resistentes; poda sanitária",
    cor: "#4E342E",
    emoji: "☕",
  },
  {
    nome: "Requeima",
    agente: "Phytophthora infestans",
    tipo: "Fúngica/Oomiceto",
    nivel: "Crítico",
    culturas: ["Tomate"],
    sintomas: ["Manchas aquosas nas folhas", "Lesões escuras nos frutos", "Odor desagradável"],
    condicoes: "Temperatura 10–25°C, alta umidade relativa, noites frias",
    controle: "Fungicidas preventivos (mancozebe, clorotalonil); evitar molhar folhagem",
    cor: "#EF5350",
    emoji: "🍅",
  },
  {
    nome: "Míldio",
    agente: "Bremia lactucae",
    tipo: "Fúngica/Oomiceto",
    nivel: "Alto",
    culturas: ["Alface"],
    sintomas: ["Manchas amarelas na face superior", "Mofo branco na face inferior", "Necrose foliar"],
    condicoes: "Alta umidade, temperaturas amenas 10–20°C",
    controle: "Variedades resistentes; fungicidas cúpricos; ventilação adequada",
    cor: "#66BB6A",
    emoji: "🥬",
  },
  {
    nome: "Podridão Negra",
    agente: "Xanthomonas campestris",
    tipo: "Bacteriana",
    nivel: "Alto",
    culturas: ["Brócolis", "Couve-flor", "Repolho"],
    sintomas: ["Lesões em V nas margens das folhas", "Escurecimento das nervuras", "Podridão do caule"],
    condicoes: "Alta temperatura e umidade, ferimentos nas plantas",
    controle: "Sementes certificadas; rotação de culturas; bactericidas cúpricos",
    cor: "#2E7D32",
    emoji: "🥦",
  },
  {
    nome: "Antracnose",
    agente: "Colletotrichum spp.",
    tipo: "Fúngica",
    nivel: "Alto",
    culturas: ["Morango", "Amora", "Framboesa", "Figo"],
    sintomas: ["Manchas escuras nos frutos", "Lesões deprimidas", "Mumificação"],
    condicoes: "Alta umidade, temperaturas 20–30°C, ferimentos",
    controle: "Fungicidas (azoxistrobina, tebuconazol); colheita frequente; evitar excesso de água",
    cor: "#E53935",
    emoji: "🍓",
  },
  {
    nome: "Bacteriose da Mandioca",
    agente: "Xanthomonas phaseoli pv. manihotis",
    tipo: "Bacteriana",
    nivel: "Crítico",
    culturas: ["Mandioca/Aipim"],
    sintomas: ["Murcha das folhas", "Exsudação gomosa", "Morte descendente dos ramos"],
    condicoes: "Alta temperatura, ferimentos, manivas infectadas",
    controle: "Manivas sadias certificadas; rotação de culturas; eliminação de plantas doentes",
    cor: "#F57F17",
    emoji: "🌾",
  },
];

const ROTACOES = [
  {
    cultura: "Tomate",
    cor: "#EF5350",
    emoji: "🍅",
    apos: ["Feijão", "Milheto", "Crotalária", "Aveia"],
    beneficios: ["Quebra de ciclo de doenças", "Redução de nematoides", "Recuperação do solo"],
    intervalo: "Mínimo 2 anos sem Solanáceas",
  },
  {
    cultura: "Alface",
    cor: "#66BB6A",
    emoji: "🥬",
    apos: ["Cenoura", "Beterraba", "Feijão"],
    beneficios: ["Diversificação da microbiota", "Redução de patógenos foliares"],
    intervalo: "1 ciclo de intervalo",
  },
  {
    cultura: "Mandioca/Aipim",
    cor: "#F57F17",
    emoji: "🌾",
    apos: ["Feijão", "Amendoim", "Milho", "Crotalária"],
    beneficios: ["Fixação de nitrogênio", "Melhoria da estrutura do solo", "Controle de pragas"],
    intervalo: "1–2 anos após colheita",
  },
  {
    cultura: "Batata-doce",
    cor: "#E65100",
    emoji: "🍠",
    apos: ["Feijão", "Milho", "Mucuna"],
    beneficios: ["Cobertura do solo", "Fixação de nitrogênio", "Controle de ervas daninhas"],
    intervalo: "1 ciclo de intervalo",
  },
  {
    cultura: "Café Arábica",
    cor: "#4E342E",
    emoji: "☕",
    apos: ["Braquiária", "Amendoim forrageiro", "Crotalária"],
    beneficios: ["Cobertura entre linhas", "Fixação de nitrogênio", "Controle de erosão"],
    intervalo: "Cultivo simultâneo entre linhas",
  },
];

const GERACOES = [
  { g: "G1", pureza: 100, uso: "Pesquisa · Banco genético", cor: "#1565C0", desc: "Matriz genética original" },
  { g: "G2", pureza: 98, uso: "Seleção · Multiplicação inicial", cor: "#1976D2", desc: "Primeira multiplicação" },
  { g: "G3", pureza: 95, uso: "Produção de mudas certificadas", cor: "#1E88E5", desc: "Segunda multiplicação" },
  { g: "G4", pureza: 90, uso: "Produção ampliada", cor: "#42A5F5", desc: "Produção ampliada" },
  { g: "G5", pureza: 85, uso: "Produção comercial", cor: "#90CAF9", desc: "Produção comercial" },
];

const EXEMPLOS_GENETICA = [
  {
    cultura: "Café Arábica", emoji: "☕", cor: "#4E342E",
    g1: { prod: "100%", resist: "Máxima", uso: "Banco genético AFU" },
    g5: { prod: "85%", resist: "Reduzida", uso: "Produção comercial" },
    obs: "Renovar a cada 3–5 anos",
  },
  {
    cultura: "Morango", emoji: "🍓", cor: "#E53935",
    g1: { prod: "100%", resist: "Máxima", uso: "Matriz certificada" },
    g5: { prod: "85%", resist: "Reduzida", uso: "Necessário renovação genética" },
    obs: "Renovar a cada 2–3 anos via estolões",
  },
  {
    cultura: "Mandioca/Aipim", emoji: "🌾", cor: "#F57F17",
    g1: { prod: "100%", resist: "Máxima", uso: "Maniva matriz" },
    g5: { prod: "85%", resist: "Reduzida", uso: "Avaliar degeneração genética" },
    obs: "Renovar a cada 4–6 ciclos",
  },
];

const MULTIPLICACAO = [
  { metodo: "Sementes", culturas: "Alface, Tomate, Coentro, Salsa", emoji: "🌱" },
  { metodo: "Mudas", culturas: "Brócolis, Couve-flor, Repolho, Tomate", emoji: "🌿" },
  { metodo: "Estacas", culturas: "Mandioca, Figo, Amora-preta", emoji: "🌾" },
  { metodo: "Enxertia", culturas: "Caqui, Pêra, Café Arábica", emoji: "🌳" },
  { metodo: "Bulbos", culturas: "Inhame", emoji: "🥔" },
  { metodo: "Tubérculos", culturas: "Batata-doce, Inhame", emoji: "🍠" },
  { metodo: "Rizomas", culturas: "Inhame, Gengibre", emoji: "🌱" },
  { metodo: "Manivas", culturas: "Mandioca/Aipim", emoji: "🌾" },
  { metodo: "Estolões", culturas: "Morango, Framboesa", emoji: "🍓" },
];

const EXEMPLOS_MULT = [
  { cultura: "Morango", emoji: "🍓", cor: "#E53935", metodo: "Estolões", taxa: "1 → 15 mudas", mult: "Alta" },
  { cultura: "Mandioca", emoji: "🌾", cor: "#F57F17", metodo: "Manivas", taxa: "1 → 10 plantas", mult: "Média" },
  { cultura: "Batata-doce", emoji: "🍠", cor: "#E65100", metodo: "Ramas", taxa: "1 → 20 mudas", mult: "Muito Alta" },
];

export default function BancoFitossanitarioScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("pragas");
  const [expandedPraga, setExpandedPraga] = useState<string | null>(null);
  const [expandedDoenca, setExpandedDoenca] = useState<string | null>(null);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#880E4F" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#AD1457" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🔬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Banco Fitossanitário e Genético</Text>
            <Text style={{ color: "#F48FB1" }} className="text-xs">
              6 Pragas · 6 Doenças · Rotação · G1–G5 · Multiplicação
            </Text>
          </View>
          <View style={{ backgroundColor: "#6A1B9A" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 34</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#880E4F" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#880E4F", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── PRAGAS ─── */}
        {activeTab === "pragas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Banco de Pragas</Text>
            <Text className="text-xs text-muted mb-4">6 pragas iniciais · Nível de risco · Controle integrado</Text>

            {PRAGAS.map((p) => {
              const isExpanded = expandedPraga === p.nome;
              const nivelCor = NIVEL_COR[p.nivel] ?? { bg: "#F5F5F5", text: "#888" };
              return (
                <View key={p.nome} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: p.cor + "40" }}>
                  <TouchableOpacity
                    onPress={() => setExpandedPraga(isExpanded ? null : p.nome)}
                    style={{ backgroundColor: p.cor + "15" }}
                    className="flex-row items-center p-3"
                  >
                    <Text className="text-xl mr-2">{p.emoji}</Text>
                    <View className="flex-1">
                      <Text style={{ color: p.cor }} className="text-sm font-bold">{p.nome}</Text>
                      <Text className="text-xs text-muted italic">{p.cientifico}</Text>
                    </View>
                    <View style={{ backgroundColor: nivelCor.bg }} className="rounded-full px-2 py-0.5 mr-2">
                      <Text style={{ color: nivelCor.text }} className="text-xs font-bold">{p.nivel}</Text>
                    </View>
                    <Text style={{ color: p.cor }} className="text-xs">{isExpanded ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="p-4 bg-surface">
                      {/* Culturas */}
                      <Text className="text-xs font-bold text-foreground mb-1">Culturas afetadas</Text>
                      <View className="flex-row flex-wrap mb-3">
                        {p.culturas.map((c) => (
                          <View key={c} style={{ backgroundColor: p.cor + "15" }} className="rounded-full px-2 py-0.5 mr-1 mb-1">
                            <Text style={{ color: p.cor }} className="text-xs">{c}</Text>
                          </View>
                        ))}
                      </View>
                      {/* Sintomas */}
                      <Text className="text-xs font-bold text-foreground mb-1">Sintomas</Text>
                      {p.sintomas.map((s) => (
                        <Text key={s} className="text-xs text-muted mb-0.5">• {s}</Text>
                      ))}
                      {/* Controle */}
                      <View className="mt-3 gap-2">
                        {[
                          { label: "Biológico", value: p.biologico, cor: "#2E7D32", bg: "#E8F5E9" },
                          { label: "Orgânico", value: p.organico, cor: "#E65100", bg: "#FFF8E1" },
                          { label: "Químico", value: p.quimico, cor: "#1565C0", bg: "#E3F2FD" },
                        ].map((ctrl) => (
                          <View key={ctrl.label} style={{ backgroundColor: ctrl.bg }} className="rounded-lg p-2">
                            <Text style={{ color: ctrl.cor }} className="text-xs font-bold mb-0.5">{ctrl.label}</Text>
                            <Text className="text-xs text-muted">{ctrl.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ─── DOENÇAS ─── */}
        {activeTab === "doencas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Banco de Doenças</Text>
            <Text className="text-xs text-muted mb-4">6 doenças iniciais · Agente causal · Controle</Text>

            {DOENCAS.map((d) => {
              const isExpanded = expandedDoenca === d.nome;
              const nivelCor = NIVEL_COR[d.nivel] ?? { bg: "#F5F5F5", text: "#888" };
              const tipoCor = d.tipo.includes("Bacteriana") ? "#1565C0" : "#880E4F";
              return (
                <View key={d.nome} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: d.cor + "40" }}>
                  <TouchableOpacity
                    onPress={() => setExpandedDoenca(isExpanded ? null : d.nome)}
                    style={{ backgroundColor: d.cor + "15" }}
                    className="flex-row items-center p-3"
                  >
                    <Text className="text-xl mr-2">{d.emoji}</Text>
                    <View className="flex-1">
                      <Text style={{ color: d.cor }} className="text-sm font-bold">{d.nome}</Text>
                      <Text className="text-xs text-muted italic">{d.agente}</Text>
                    </View>
                    <View style={{ backgroundColor: nivelCor.bg }} className="rounded-full px-2 py-0.5 mr-1">
                      <Text style={{ color: nivelCor.text }} className="text-xs font-bold">{d.nivel}</Text>
                    </View>
                    <Text style={{ color: d.cor }} className="text-xs">{isExpanded ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="p-4 bg-surface">
                      <View className="flex-row items-center gap-2 mb-3">
                        <View style={{ backgroundColor: tipoCor + "20" }} className="rounded-full px-2 py-0.5">
                          <Text style={{ color: tipoCor }} className="text-xs font-bold">{d.tipo}</Text>
                        </View>
                        {d.culturas.map((c) => (
                          <View key={c} style={{ backgroundColor: d.cor + "15" }} className="rounded-full px-2 py-0.5">
                            <Text style={{ color: d.cor }} className="text-xs">{c}</Text>
                          </View>
                        ))}
                      </View>
                      <Text className="text-xs font-bold text-foreground mb-1">Sintomas</Text>
                      {d.sintomas.map((s) => (
                        <Text key={s} className="text-xs text-muted mb-0.5">• {s}</Text>
                      ))}
                      <View style={{ backgroundColor: "#FFF8E1" }} className="rounded-lg p-2 mt-2">
                        <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-0.5">⚠️ Condições favoráveis</Text>
                        <Text className="text-xs text-muted">{d.condicoes}</Text>
                      </View>
                      <View style={{ backgroundColor: "#E8F5E9" }} className="rounded-lg p-2 mt-2">
                        <Text style={{ color: "#2E7D32" }} className="text-xs font-bold mb-0.5">✓ Controle</Text>
                        <Text className="text-xs text-muted">{d.controle}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ─── ROTAÇÃO ─── */}
        {activeTab === "rotacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Rotação de Culturas</Text>
            <Text className="text-xs text-muted mb-4">5 culturas · Rotações recomendadas · Benefícios</Text>

            {ROTACOES.map((r) => (
              <View key={r.cultura} className="mb-4 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: r.cor + "40" }}>
                <View style={{ backgroundColor: r.cor }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{r.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-bold">{r.cultura}</Text>
                    <Text style={{ color: "rgba(255,255,255,0.8)" }} className="text-xs">{r.intervalo}</Text>
                  </View>
                </View>
                <View className="p-4 bg-surface">
                  <Text className="text-xs font-bold text-foreground mb-2">Culturas após colheita</Text>
                  <View className="flex-row flex-wrap mb-3">
                    {r.apos.map((c) => (
                      <View key={c} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "30" }} className="rounded-full px-3 py-1 mr-2 mb-1">
                        <Text style={{ color: r.cor }} className="text-xs font-semibold">{c}</Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-xs font-bold text-foreground mb-1">Benefícios</Text>
                  {r.beneficios.map((b) => (
                    <View key={b} className="flex-row items-center mb-0.5">
                      <View style={{ backgroundColor: "#2E7D32", width: 6, height: 6 }} className="rounded-full mr-2" />
                      <Text className="text-xs text-muted">{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── GENÉTICA ─── */}
        {activeTab === "genetica" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Genética G1–G5</Text>
            <Text className="text-xs text-muted mb-4">5 gerações · Pureza · Uso · 3 exemplos</Text>

            {/* Gerações */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1565C015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Definição das Gerações</Text>
              </View>
              <View className="p-4 bg-surface">
                {GERACOES.map((g) => (
                  <View key={g.g} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: g.cor, width: 36, height: 36 }} className="rounded-xl items-center justify-center mr-3">
                      <Text className="text-white text-sm font-bold">{g.g}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-foreground">{g.desc}</Text>
                      <Text className="text-xs text-muted">{g.uso}</Text>
                    </View>
                    <View style={{ backgroundColor: g.cor + "20" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: g.cor }} className="text-sm font-bold">{g.pureza}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Barra de pureza visual */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1565C015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Degradação da Pureza Genética</Text>
              </View>
              <View className="p-4 bg-surface">
                {GERACOES.map((g) => (
                  <View key={g.g} className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text style={{ color: g.cor }} className="text-xs font-bold">{g.g} — {g.desc}</Text>
                      <Text className="text-xs text-muted">{g.pureza}%</Text>
                    </View>
                    <View style={{ backgroundColor: "#F0F0F0", height: 10, borderRadius: 5, overflow: "hidden" }}>
                      <View style={{ backgroundColor: g.cor, height: 10, borderRadius: 5, width: `${g.pureza}%` }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Exemplos */}
            <Text className="text-sm font-bold text-foreground mb-3">Exemplos por Cultura</Text>
            {EXEMPLOS_GENETICA.map((e) => (
              <View key={e.cultura} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: e.cor + "40" }}>
                <View style={{ backgroundColor: e.cor + "15" }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{e.emoji}</Text>
                  <Text style={{ color: e.cor }} className="text-sm font-bold flex-1">{e.cultura}</Text>
                  <Text className="text-xs text-muted">{e.obs}</Text>
                </View>
                <View className="p-4 bg-surface flex-row gap-2">
                  <View style={{ backgroundColor: "#1565C015", flex: 1 }} className="rounded-lg p-3">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold mb-1">G1 — Matriz</Text>
                    <Text className="text-xs text-muted">Prod: {e.g1.prod}</Text>
                    <Text className="text-xs text-muted">Resist: {e.g1.resist}</Text>
                    <Text className="text-xs text-muted">{e.g1.uso}</Text>
                  </View>
                  <View style={{ backgroundColor: "#90CAF920", flex: 1 }} className="rounded-lg p-3">
                    <Text style={{ color: "#1976D2" }} className="text-xs font-bold mb-1">G5 — Comercial</Text>
                    <Text className="text-xs text-muted">Prod: {e.g5.prod}</Text>
                    <Text className="text-xs text-muted">Resist: {e.g5.resist}</Text>
                    <Text className="text-xs text-muted">{e.g5.uso}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── MULTIPLICAÇÃO ─── */}
        {activeTab === "multiplicacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Banco de Multiplicação</Text>
            <Text className="text-xs text-muted mb-4">9 métodos · Taxas de multiplicação · Exemplos</Text>

            {/* Métodos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#880E4F15" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Métodos de Multiplicação</Text>
              </View>
              <View className="p-4 bg-surface">
                {MULTIPLICACAO.map((m) => (
                  <View key={m.metodo} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <Text className="text-lg mr-3">{m.emoji}</Text>
                    <View style={{ minWidth: 90 }}>
                      <Text className="text-xs font-bold text-foreground">{m.metodo}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{m.culturas}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Exemplos com taxas */}
            <Text className="text-sm font-bold text-foreground mb-3">Exemplos com Taxas</Text>
            {EXEMPLOS_MULT.map((e) => (
              <View key={e.cultura} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: e.cor + "40" }}>
                <View style={{ backgroundColor: e.cor }} className="flex-row items-center p-3">
                  <Text className="text-xl mr-2">{e.emoji}</Text>
                  <Text className="text-white text-sm font-bold flex-1">{e.cultura}</Text>
                  <View style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="rounded-full px-3 py-1">
                    <Text className="text-white text-xs font-bold">{e.mult}</Text>
                  </View>
                </View>
                <View className="p-4 bg-surface flex-row items-center">
                  <View style={{ backgroundColor: e.cor + "15", flex: 1 }} className="rounded-lg p-3 mr-2">
                    <Text style={{ color: e.cor }} className="text-xs font-bold">Método</Text>
                    <Text className="text-sm font-bold text-foreground">{e.metodo}</Text>
                  </View>
                  <View style={{ backgroundColor: "#E8F5E9", flex: 1 }} className="rounded-lg p-3">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">Taxa</Text>
                    <Text className="text-sm font-bold text-foreground">{e.taxa}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── IA ─── */}
        {activeTab === "ia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Integração com IA</Text>
            <Text className="text-xs text-muted mb-4">6 perguntas respondidas · Base fitossanitária completa</Text>

            <View style={{ backgroundColor: "#880E4F" }} className="rounded-2xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">O que a IA poderá responder?</Text>
              <Text style={{ color: "#F48FB1" }} className="text-xs leading-5">
                Com o banco fitossanitário e genético completo, a IA do AFU poderá cruzar dados de imagem, cultura, região e histórico para gerar diagnósticos precisos e recomendações de manejo personalizadas.
              </Text>
            </View>

            {[
              { pergunta: "Qual a principal praga desta cultura?", resposta: "Cruza cultura selecionada com banco de pragas por nível de risco", emoji: "🐛", cor: "#C62828" },
              { pergunta: "Qual doença é mais provável?", resposta: "Analisa imagem + condições climáticas + histórico da propriedade", emoji: "🔬", cor: "#880E4F" },
              { pergunta: "Qual rotação devo fazer?", resposta: "Consulta banco de rotação pela cultura atual + histórico do talhão", emoji: "🔄", cor: "#1565C0" },
              { pergunta: "Posso reutilizar sementes?", resposta: "Verifica geração genética atual + pureza + recomendação de renovação", emoji: "🌱", cor: "#2E7D32" },
              { pergunta: "Qual geração genética é recomendada?", resposta: "Consulta banco G1–G5 pela cultura + objetivo (pesquisa ou comercial)", emoji: "🧬", cor: "#6A1B9A" },
              { pergunta: "Quando renovar material genético?", resposta: "Calcula ciclos realizados + pureza atual + limiar de degeneração", emoji: "⏰", cor: "#E65100" },
            ].map((item) => (
              <View key={item.pergunta} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: item.cor + "30" }}>
                <View style={{ backgroundColor: item.cor + "10" }} className="flex-row items-start p-3">
                  <Text className="text-xl mr-2 mt-0.5">{item.emoji}</Text>
                  <View className="flex-1">
                    <Text style={{ color: item.cor }} className="text-xs font-bold mb-1">{item.pergunta}</Text>
                    <Text className="text-xs text-muted">{item.resposta}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Resultado */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mt-2">
              <Text className="text-white text-sm font-bold mb-2">Resultado: Base completa para</Text>
              <View className="flex-row flex-wrap">
                {["Diagnóstico", "Manejo", "Controle de pragas", "Controle de doenças", "Genética G1–G5", "Rotação de culturas", "Multiplicação", "Replantio"].map((r) => (
                  <View key={r} style={{ backgroundColor: "#388E3C" }} className="rounded-full px-2 py-1 mr-2 mb-2">
                    <Text style={{ color: "#E8F5E9" }} className="text-xs">{r}</Text>
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
