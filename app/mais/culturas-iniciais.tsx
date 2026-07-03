import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "hortalicas", label: "Hortaliças" },
  { id: "frutiferas", label: "Frutíferas" },
  { id: "raizes", label: "Raízes" },
  { id: "cafe", label: "Café Arábica" },
  { id: "classificacao", label: "Classificação" },
];

interface Cultura {
  nome: string;
  cientifico: string;
  tipo: string;
  ciclo: string;
  temp: string;
  ph: string;
  colheita: string;
  nutrientes: string;
  pragas: string;
  doencas: string;
  multiplicacao: string;
  rotacao: string;
  cor: string;
  emoji: string;
}

function CulturaCard({ cultura }: { cultura: Cultura }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={{ backgroundColor: cultura.cor + "15" }}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{cultura.emoji}</Text>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">{cultura.nome}</Text>
            <Text className="text-xs text-muted italic">{cultura.cientifico}</Text>
          </View>
          <View style={{ backgroundColor: cultura.cor + "20" }} className="rounded-full px-2 py-0.5 mr-2">
            <Text style={{ color: cultura.cor }} className="text-xs font-semibold">{cultura.ciclo}</Text>
          </View>
        </View>
        <Text style={{ color: cultura.cor }} className="text-base font-bold">
          {open ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>
      {open && (
        <View className="p-4 bg-surface">
          <View className="flex-row flex-wrap gap-2 mb-3">
            {[
              { k: "Tipo", v: cultura.tipo, cor: cultura.cor },
              { k: "Temp. ideal", v: cultura.temp, cor: "#64B5F6" },
              { k: "pH ideal", v: cultura.ph, cor: "#FFB74D" },
              { k: "Colheita", v: cultura.colheita, cor: "#81C784" },
            ].map((item) => (
              <View key={item.k} style={{ backgroundColor: item.cor + "15", borderWidth: 1, borderColor: item.cor + "30", width: "47%" }} className="rounded-xl p-2">
                <Text style={{ color: item.cor }} className="text-xs font-bold">{item.k}</Text>
                <Text className="text-xs text-foreground mt-0.5">{item.v}</Text>
              </View>
            ))}
          </View>
          {[
            { label: "Nutrientes principais", value: cultura.nutrientes, cor: "#81C784" },
            { label: "Pragas comuns", value: cultura.pragas, cor: "#EF9A9A" },
            { label: "Doenças comuns", value: cultura.doencas, cor: "#CE93D8" },
            { label: "Multiplicação", value: cultura.multiplicacao, cor: "#64B5F6" },
            { label: "Rotação recomendada", value: cultura.rotacao, cor: "#FFB74D" },
          ].map((row) => (
            <View key={row.label} className="flex-row items-start py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
              <View style={{ backgroundColor: row.cor + "20", minWidth: 110 }} className="rounded px-2 py-0.5 mr-2">
                <Text style={{ color: row.cor }} className="text-xs font-bold">{row.label}</Text>
              </View>
              <Text className="text-xs text-muted flex-1">{row.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const HORTALICAS: Cultura[] = [
  {
    nome: "Couve-flor", cientifico: "Brassica oleracea var. botrytis",
    tipo: "Hortaliça", ciclo: "Anual", temp: "15°C a 22°C", ph: "6,0 a 6,8",
    colheita: "80 a 120 dias", nutrientes: "N, P, K, Ca, B, Mo",
    pragas: "Pulgões, lagartas, traça-das-crucíferas",
    doencas: "Hérnia-das-crucíferas, míldio, podridão negra",
    multiplicacao: "Semente ou muda", rotacao: "Leguminosas, gramíneas e adubos verdes",
    cor: "#81C784", emoji: "🥦",
  },
  {
    nome: "Brócolis", cientifico: "Brassica oleracea var. italica",
    tipo: "Hortaliça", ciclo: "Anual", temp: "15°C a 24°C", ph: "6,0 a 6,8",
    colheita: "70 a 100 dias", nutrientes: "N, K, Ca, B, Mo",
    pragas: "Pulgões, lagartas, traça-das-crucíferas",
    doencas: "Míldio, alternária, podridão negra",
    multiplicacao: "Semente ou muda", rotacao: "Evitar repetir brássicas no mesmo terreno",
    cor: "#2E7D32", emoji: "🥦",
  },
  {
    nome: "Alface", cientifico: "Lactuca sativa",
    tipo: "Hortaliça folhosa", ciclo: "Anual", temp: "15°C a 25°C", ph: "6,0 a 6,8",
    colheita: "30 a 70 dias", nutrientes: "N, K, Ca",
    pragas: "Pulgões, lesmas, lagartas",
    doencas: "Míldio, queima-das-bordas, podridões",
    multiplicacao: "Semente ou muda", rotacao: "Cenoura, beterraba, leguminosas e gramíneas",
    cor: "#66BB6A", emoji: "🥬",
  },
  {
    nome: "Tomate", cientifico: "Solanum lycopersicum",
    tipo: "Hortaliça-fruto", ciclo: "Anual", temp: "20°C a 27°C", ph: "5,5 a 6,8",
    colheita: "90 a 120 dias", nutrientes: "N, P, K, Ca, Mg, B",
    pragas: "Mosca-branca, traça-do-tomateiro, ácaros",
    doencas: "Requeima, pinta-preta, murcha bacteriana",
    multiplicacao: "Semente ou muda", rotacao: "Evitar solanáceas; alternar com gramíneas e leguminosas",
    cor: "#EF5350", emoji: "🍅",
  },
  {
    nome: "Repolho", cientifico: "Brassica oleracea var. capitata",
    tipo: "Hortaliça", ciclo: "Anual", temp: "15°C a 24°C", ph: "6,0 a 6,8",
    colheita: "80 a 120 dias", nutrientes: "N, K, Ca, B, Mo",
    pragas: "Pulgões, lagartas, traça-das-crucíferas",
    doencas: "Podridão negra, míldio, hérnia-das-crucíferas",
    multiplicacao: "Semente ou muda", rotacao: "Leguminosas, milho, adubação verde",
    cor: "#7CB342", emoji: "🥬",
  },
  {
    nome: "Salsa", cientifico: "Petroselinum crispum",
    tipo: "Erva aromática", ciclo: "Bienal", temp: "10°C a 24°C", ph: "5,8 a 6,8",
    colheita: "60 a 90 dias", nutrientes: "N, K, Ca",
    pragas: "Pulgões, lagartas, ácaros",
    doencas: "Manchas foliares e podridões",
    multiplicacao: "Semente", rotacao: "Hortaliças folhosas e leguminosas",
    cor: "#43A047", emoji: "🌿",
  },
  {
    nome: "Coentro", cientifico: "Coriandrum sativum",
    tipo: "Erva aromática", ciclo: "Anual", temp: "18°C a 30°C", ph: "6,0 a 7,0",
    colheita: "30 a 60 dias", nutrientes: "N, P, K",
    pragas: "Pulgões e lagartas",
    doencas: "Manchas foliares e tombamento",
    multiplicacao: "Semente", rotacao: "Alface, cenoura, leguminosas",
    cor: "#558B2F", emoji: "🌿",
  },
];

const FRUTIFERAS: Cultura[] = [
  {
    nome: "Morango", cientifico: "Fragaria × ananassa",
    tipo: "Frutífera herbácea", ciclo: "Perene/Anual", temp: "13°C a 26°C", ph: "5,5 a 6,5",
    colheita: "60 a 90 dias após transplantio", nutrientes: "N, K, Ca, Mg, B",
    pragas: "Ácaros, pulgões, tripes",
    doencas: "Mofo-cinzento, antracnose, oídio",
    multiplicacao: "Mudas ou estolões", rotacao: "Evitar áreas com solanáceas e morango recente",
    cor: "#E53935", emoji: "🍓",
  },
  {
    nome: "Caqui", cientifico: "Diospyros kaki",
    tipo: "Frutífera perene", ciclo: "Perene", temp: "Subtropical a temperado", ph: "5,5 a 6,5",
    colheita: "3 a 5 anos após plantio", nutrientes: "N, K, Ca, Mg",
    pragas: "Mosca-das-frutas, cochonilhas, ácaros",
    doencas: "Antracnose, cercosporiose",
    multiplicacao: "Enxertia", rotacao: "Manejo de cobertura vegetal",
    cor: "#FF6F00", emoji: "🍊",
  },
  {
    nome: "Amora-preta", cientifico: "Rubus spp.",
    tipo: "Pequena fruta", ciclo: "Perene", temp: "Subtropical/temperado", ph: "5,5 a 6,5",
    colheita: "1 a 2 anos após plantio", nutrientes: "N, K, Ca, Mg",
    pragas: "Ácaros, pulgões, brocas",
    doencas: "Ferrugem, antracnose, podridões",
    multiplicacao: "Estaquia, mudas ou rebentos", rotacao: "Cobertura vegetal e manejo de solo",
    cor: "#6A1B9A", emoji: "🫐",
  },
  {
    nome: "Framboesa", cientifico: "Rubus idaeus",
    tipo: "Pequena fruta", ciclo: "Perene", temp: "Clima ameno/frio", ph: "5,5 a 6,5",
    colheita: "1 a 2 anos após plantio", nutrientes: "N, K, Ca, Mg",
    pragas: "Ácaros, pulgões, brocas",
    doencas: "Antracnose, ferrugem, podridões radiculares",
    multiplicacao: "Mudas ou rebentos", rotacao: "Evitar áreas com histórico de doenças de solo",
    cor: "#AD1457", emoji: "🍇",
  },
  {
    nome: "Figo", cientifico: "Ficus carica",
    tipo: "Frutífera perene", ciclo: "Perene", temp: "Subtropical/temperado", ph: "5,5 a 6,5",
    colheita: "1 a 2 anos após plantio", nutrientes: "N, K, Ca, Mg",
    pragas: "Brocas, cochonilhas, ácaros",
    doencas: "Ferrugem, podridões, nematoides",
    multiplicacao: "Estaquia", rotacao: "Cobertura vegetal e manejo do solo",
    cor: "#6D4C41", emoji: "🫐",
  },
  {
    nome: "Pêra", cientifico: "Pyrus communis",
    tipo: "Frutífera perene", ciclo: "Perene", temp: "Clima temperado", ph: "5,5 a 6,5",
    colheita: "3 a 5 anos após plantio", nutrientes: "N, K, Ca, B, Zn",
    pragas: "Mosca-das-frutas, pulgões, ácaros",
    doencas: "Sarna, fogo-bacteriano, podridões",
    multiplicacao: "Enxertia", rotacao: "Manejo de cobertura vegetal",
    cor: "#F9A825", emoji: "🍐",
  },
];

const RAIZES: Cultura[] = [
  {
    nome: "Inhame", cientifico: "Dioscorea spp.",
    tipo: "Tubérculo", ciclo: "Anual/semi-perene", temp: "25°C a 30°C", ph: "5,5 a 6,5",
    colheita: "7 a 10 meses", nutrientes: "N, P, K, Ca, Mg",
    pragas: "Nematoides, brocas, formigas",
    doencas: "Antracnose, podridões",
    multiplicacao: "Túberas ou pedaços de túbera", rotacao: "Gramíneas, leguminosas e adubos verdes",
    cor: "#795548", emoji: "🥔",
  },
  {
    nome: "Batata-doce", cientifico: "Ipomoea batatas",
    tipo: "Raiz tuberosa", ciclo: "Anual", temp: "20°C a 30°C", ph: "5,5 a 6,5",
    colheita: "90 a 150 dias", nutrientes: "K, N, P, Ca",
    pragas: "Broca-da-raiz, vaquinhas, nematoides",
    doencas: "Podridões, viroses, manchas foliares",
    multiplicacao: "Ramas ou mudas", rotacao: "Milho, feijão, adubos verdes",
    cor: "#E65100", emoji: "🍠",
  },
  {
    nome: "Mandioca / Aipim", cientifico: "Manihot esculenta",
    tipo: "Raiz tuberosa", ciclo: "Anual/semi-perene", temp: "20°C a 30°C", ph: "5,5 a 6,5",
    colheita: "8 a 18 meses", nutrientes: "K, N, P, Ca, Mg",
    pragas: "Mandarová, ácaros, cochonilhas",
    doencas: "Bacteriose, podridão radicular, mosaico",
    multiplicacao: "Manivas", rotacao: "Milho, feijão, amendoim, adubos verdes",
    cor: "#F57F17", emoji: "🌾",
  },
];

const CAFE: Cultura = {
  nome: "Café Arábica", cientifico: "Coffea arabica",
  tipo: "Cultura perene", ciclo: "Perene", temp: "18°C a 23°C", ph: "5,5 a 6,5",
  colheita: "2 a 3 anos após plantio inicial", nutrientes: "N, K, Ca, Mg, B, Zn",
  pragas: "Bicho-mineiro, broca-do-café, cochonilhas",
  doencas: "Ferrugem, cercosporiose",
  multiplicacao: "Semente ou muda",
  rotacao: "Difícil por ser perene; usar cobertura vegetal e manejo de solo",
  cor: "#4E342E", emoji: "☕",
};

export default function CulturasIniciaisScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("hortalicas");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#2E7D32" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#388E3C" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌱</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Culturas Iniciais do Banco AFU</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              17 culturas · 4 grupos · Fichas técnicas completas
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 31</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#2E7D32" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#2E7D32", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── HORTALIÇAS ─── */}
        {activeTab === "hortalicas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Hortaliças</Text>
            <Text className="text-xs text-muted mb-4">7 culturas · Toque para ver a ficha técnica completa</Text>
            {HORTALICAS.map((c) => <CulturaCard key={c.nome} cultura={c} />)}
          </View>
        )}

        {/* ─── FRUTÍFERAS ─── */}
        {activeTab === "frutiferas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Frutíferas</Text>
            <Text className="text-xs text-muted mb-4">6 culturas · Toque para ver a ficha técnica completa</Text>
            {FRUTIFERAS.map((c) => <CulturaCard key={c.nome} cultura={c} />)}
          </View>
        )}

        {/* ─── RAÍZES ─── */}
        {activeTab === "raizes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Raízes, Tubérculos e Amiláceas</Text>
            <Text className="text-xs text-muted mb-4">3 culturas · Toque para ver a ficha técnica completa</Text>
            {RAIZES.map((c) => <CulturaCard key={c.nome} cultura={c} />)}
          </View>
        )}

        {/* ─── CAFÉ ARÁBICA ─── */}
        {activeTab === "cafe" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Café Arábica</Text>
            <Text className="text-xs text-muted mb-4">Cultura perene · Ficha técnica completa</Text>

            {/* Card destaque */}
            <View style={{ backgroundColor: "#4E342E15", borderWidth: 2, borderColor: "#4E342E40" }} className="rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <Text className="text-4xl mr-3">☕</Text>
                <View>
                  <Text className="text-lg font-bold text-foreground">{CAFE.nome}</Text>
                  <Text className="text-xs text-muted italic">{CAFE.cientifico}</Text>
                  <View style={{ backgroundColor: "#4E342E20" }} className="rounded-full px-2 py-0.5 mt-1 self-start">
                    <Text style={{ color: "#4E342E" }} className="text-xs font-bold">Cultura Perene</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2 mb-3">
                {[
                  { k: "Temperatura", v: CAFE.temp, cor: "#64B5F6" },
                  { k: "pH ideal", v: CAFE.ph, cor: "#FFB74D" },
                  { k: "Colheita", v: CAFE.colheita, cor: "#81C784" },
                  { k: "Tipo", v: CAFE.tipo, cor: "#4E342E" },
                ].map((item) => (
                  <View key={item.k} style={{ backgroundColor: item.cor + "15", borderWidth: 1, borderColor: item.cor + "30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: item.cor }} className="text-xs font-bold">{item.k}</Text>
                    <Text className="text-xs text-foreground mt-0.5">{item.v}</Text>
                  </View>
                ))}
              </View>

              {[
                { label: "Nutrientes principais", value: CAFE.nutrientes, cor: "#81C784" },
                { label: "Pragas comuns", value: CAFE.pragas, cor: "#EF9A9A" },
                { label: "Doenças comuns", value: CAFE.doencas, cor: "#CE93D8" },
                { label: "Multiplicação", value: CAFE.multiplicacao, cor: "#64B5F6" },
                { label: "Rotação", value: CAFE.rotacao, cor: "#FFB74D" },
              ].map((row) => (
                <View key={row.label} className="flex-row items-start py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: row.cor + "20", minWidth: 110 }} className="rounded px-2 py-0.5 mr-2">
                    <Text style={{ color: row.cor }} className="text-xs font-bold">{row.label}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{row.value}</Text>
                </View>
              ))}
            </View>

            {/* Nota sobre perenes */}
            <View style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#FFB74D" }} className="rounded-xl p-3">
              <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-1">Nota sobre culturas perenes:</Text>
              <Text style={{ color: "#888" }} className="text-xs">
                Culturas perenes como o Café Arábica não seguem o ciclo tradicional de rotação. O manejo adequado inclui cobertura vegetal entre as linhas, adubação verde e controle integrado de pragas ao longo dos anos.
              </Text>
            </View>
          </View>
        )}

        {/* ─── CLASSIFICAÇÃO ─── */}
        {activeTab === "classificacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Classificação por Ciclo</Text>
            <Text className="text-xs text-muted mb-4">4 grupos · 17 culturas · Próxima ampliação</Text>

            {/* Resumo visual */}
            <View className="flex-row gap-2 mb-4">
              {[
                { label: "Ciclo Curto", count: "3", cor: "#81C784" },
                { label: "Ciclo Médio", count: "6", cor: "#64B5F6" },
                { label: "Ciclo Longo", count: "2", cor: "#FFB74D" },
                { label: "Perenes", count: "6", cor: "#CE93D8" },
              ].map((g) => (
                <View key={g.label} style={{ backgroundColor: g.cor + "15", borderWidth: 1, borderColor: g.cor + "40" }} className="flex-1 rounded-xl p-2 items-center">
                  <Text style={{ color: g.cor }} className="text-xl font-bold">{g.count}</Text>
                  <Text style={{ color: g.cor, fontSize: 9 }} className="font-semibold text-center mt-0.5">{g.label}</Text>
                </View>
              ))}
            </View>

            {[
              {
                grupo: "Ciclo Curto",
                desc: "30 a 90 dias",
                culturas: ["Alface (30-70d)", "Coentro (30-60d)", "Salsa (60-90d)"],
                cor: "#81C784",
                emoji: "⚡",
              },
              {
                grupo: "Ciclo Médio",
                desc: "70 a 150 dias",
                culturas: ["Brócolis (70-100d)", "Couve-flor (80-120d)", "Repolho (80-120d)", "Tomate (90-120d)", "Morango (60-90d)", "Batata-doce (90-150d)"],
                cor: "#64B5F6",
                emoji: "🌱",
              },
              {
                grupo: "Ciclo Longo",
                desc: "7 a 18 meses",
                culturas: ["Inhame (7-10 meses)", "Mandioca/Aipim (8-18 meses)"],
                cor: "#FFB74D",
                emoji: "⏳",
              },
              {
                grupo: "Perenes",
                desc: "1 a 5 anos para primeira colheita",
                culturas: ["Café Arábica (2-3 anos)", "Caqui (3-5 anos)", "Amora-preta (1-2 anos)", "Framboesa (1-2 anos)", "Figo (1-2 anos)", "Pêra (3-5 anos)"],
                cor: "#CE93D8",
                emoji: "🌳",
              },
            ].map((grupo) => (
              <View key={grupo.grupo} className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
                <View style={{ backgroundColor: grupo.cor + "15" }} className="flex-row items-center p-4">
                  <Text className="text-xl mr-2">{grupo.emoji}</Text>
                  <View>
                    <Text className="text-sm font-bold text-foreground">{grupo.grupo}</Text>
                    <Text className="text-xs text-muted">{grupo.desc}</Text>
                  </View>
                </View>
                <View className="p-4 bg-surface">
                  {grupo.culturas.map((c) => (
                    <View key={c} className="flex-row items-center py-1" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                      <View style={{ backgroundColor: grupo.cor + "30", width: 8, height: 8 }} className="rounded-full mr-3" />
                      <Text className="text-xs text-foreground">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Próxima ampliação */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mt-2">
              <Text className="text-white text-sm font-bold mb-2">Próxima Ampliação do Banco</Text>
              <Text style={{ color: "#A5D6A7" }} className="text-xs mb-2">Para cada cultura, o AFU cadastrará:</Text>
              <View className="flex-row flex-wrap gap-1">
                {["Clima ideal", "Solo ideal", "Época de plantio", "Genética G1-G5", "Nutrientes por fase", "Irrigação por fase", "Pragas por fase", "Doenças por fase", "Rotação recomendada", "Tempo de colheita", "Replantio", "Multiplicação"].map((item) => (
                  <View key={item} style={{ backgroundColor: "#388E3C" }} className="rounded-full px-2 py-0.5">
                    <Text style={{ color: "#E8F5E9" }} className="text-xs">{item}</Text>
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
