import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Mercado", "Público", "Segmentos", "Concorrência", "Oportunidade"];

export default function AnaliseMercadoScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1565C0" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#1976D2" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📊</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Análise de Mercado e Público-Alvo</Text>
            <Text style={{ color: "#BBDEFB" }} className="text-xs">Etapa 2 · Estratégia e Negócio</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#1565C0" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1565C015", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-3">🌎 Tamanho do Mercado</Text>
              {[
                { k: "TAM — Mercado Total", v: "R$ 12 bilhões/ano", sub: "AgTech Brasil + assistência técnica rural" },
                { k: "SAM — Mercado Endereçável", v: "R$ 2,4 bilhões/ano", sub: "Produtores com smartphone e acesso à internet" },
                { k: "SOM — Mercado Obtível", v: "R$ 120 milhões/ano", sub: "Meta AFU 3.0 (10.000 produtores)" },
              ].map((r) => (
                <View key={r.k} style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <Text className="text-xs text-muted">{r.k}</Text>
                  <Text style={{ color: "#1565C0" }} className="text-lg font-bold">{r.v}</Text>
                  <Text className="text-xs text-muted">{r.sub}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-3">📈 Crescimento do Setor</Text>
              {[
                { k: "AgTech Brasil (CAGR)", v: "28% ao ano" },
                { k: "Investimentos AgTech 2023", v: "R$ 1,2 bilhão" },
                { k: "Startups AgTech ativas", v: "1.500+" },
                { k: "Produtores com smartphone", v: "68% (crescente)" },
                { k: "Adoção de IA no agro", v: "12% (potencial 60%)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { cor: "#1B5E20", emoji: "👨‍🌾", t: "Pequeno Produtor Rural", d: "1–50 ha · Agricultura familiar · Horticultura, fruticultura, café · Baixa renda · Alta dependência de assistência técnica", pct: "45%" },
              { cor: "#1565C0", emoji: "🧑‍💼", t: "Médio Produtor Rural", d: "50–500 ha · Soja, milho, café, frutas · Renda média-alta · Busca eficiência e tecnologia", pct: "30%" },
              { cor: "#7B1FA2", emoji: "👩‍🔬", t: "Técnico Agrícola / Agrônomo", d: "Profissional que presta assistência a múltiplos produtores · Busca ferramentas de diagnóstico rápido", pct: "15%" },
              { cor: "#C62828", emoji: "🏢", t: "Cooperativas e Associações", d: "Gestão de múltiplos produtores · Relatórios consolidados · Compra coletiva de insumos", pct: "10%" },
            ].map((p) => (
              <View key={p.t} style={{ backgroundColor: p.cor + "12", borderWidth: 1, borderColor: p.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">{p.emoji}</Text>
                  <Text style={{ color: p.cor }} className="text-sm font-bold flex-1">{p.t}</Text>
                  <View style={{ backgroundColor: p.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text className="text-white text-xs font-bold">{p.pct}</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted leading-relaxed">{p.d}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-3">🗺️ Segmentação Geográfica — Fase 1</Text>
              {[
                { r: "Santa Catarina", c: "Penha, Biguaçu, Florianópolis", foco: "Horticultura, fruticultura, café" },
                { r: "Paraná", c: "Curitiba, Londrina, Maringá", foco: "Soja, milho, café, hortifrúti" },
                { r: "Rio Grande do Sul", c: "Porto Alegre, Caxias, Pelotas", foco: "Soja, uva, arroz, fruticultura" },
              ].map((r) => (
                <View key={r.r} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{r.r}</Text>
                  <Text className="text-xs text-muted">{r.c}</Text>
                  <Text className="text-xs text-foreground mt-1">Foco: {r.foco}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#2E7D32" }} className="text-sm font-bold mb-3">🌱 Culturas Prioritárias MVP</Text>
              {["Alface", "Tomate", "Morango", "Café Arábica", "Mandioca", "Couve-flor", "Brócolis"].map((c) => (
                <View key={c} style={{ backgroundColor: "#2E7D3215", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 6 }}>
                  <Text style={{ color: "#2E7D32" }} className="text-xs font-medium">{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            {[
              { cor: "#B71C1C", nome: "Agronomic (EUA)", tipo: "Direto", pos: "IA para diagnóstico de culturas", fraq: "Sem banco agronômico regional, sem português" },
              { cor: "#E65100", nome: "Plantix (Alemanha)", tipo: "Direto", pos: "App de diagnóstico por foto", fraq: "Sem gestão integrada, sem dados regionais BR" },
              { cor: "#F57F17", nome: "Climate FieldView", tipo: "Indireto", pos: "Gestão de fazenda com dados de campo", fraq: "Foco em grandes produtores, custo alto" },
              { cor: "#1565C0", nome: "Embrapa Digital", tipo: "Indireto", pos: "Banco de dados agronômico público", fraq: "Sem app, sem IA, interface complexa" },
              { cor: "#4A148C", nome: "AgroSmart", tipo: "Indireto", pos: "IoT e sensores para irrigação", fraq: "Sem diagnóstico fitossanitário, sem IA" },
            ].map((c) => (
              <View key={c.nome} style={{ backgroundColor: c.cor + "10", borderWidth: 1, borderColor: c.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text style={{ color: c.cor }} className="text-sm font-bold flex-1">{c.nome}</Text>
                  <View style={{ backgroundColor: c.cor + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: c.cor }} className="text-xs">{c.tipo}</Text>
                  </View>
                </View>
                <Text className="text-xs text-foreground">✅ {c.pos}</Text>
                <Text className="text-xs text-muted mt-1">❌ {c.fraq}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">💡 Oportunidades Identificadas</Text>
              {[
                { emoji: "🤖", t: "IA em português para o agro", d: "Nenhum concorrente oferece IA especializada em fitotecnia em português com dados regionais brasileiros." },
                { emoji: "📱", t: "Mobile-first para o campo", d: "68% dos produtores têm smartphone, mas poucas soluções são realmente otimizadas para uso no campo." },
                { emoji: "🔗", t: "Ecossistema integrado", d: "Diagnóstico + gestão + marketplace + laboratório em uma única plataforma — nenhum concorrente oferece isso." },
                { emoji: "🌍", t: "Expansão para América Latina", d: "Brasil como porta de entrada para um mercado de 50M+ produtores rurais na América Latina." },
              ].map((o) => (
                <View key={o.t} className="flex-row gap-3 mb-3">
                  <Text className="text-xl">{o.emoji}</Text>
                  <View className="flex-1">
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{o.t}</Text>
                    <Text className="text-xs text-muted mt-1 leading-relaxed">{o.d}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/analise-mercado"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
