import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Pitch", "Rodadas", "Investidores", "Valuation", "Uso dos Recursos"];

export default function CaptacaoInvestimentoScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#00695C" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#00796B" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">💰</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Captação e Investimento</Text>
            <Text style={{ color: "#B2DFDB" }} className="text-xs">Etapa 6 · Estratégia e Negócio</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#00695C" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#00695C15", borderWidth: 1, borderColor: "#00695C30" }} className="rounded-xl p-4">
              <Text style={{ color: "#00695C" }} className="text-sm font-bold mb-3">🎤 Pitch Deck — Estrutura</Text>
              {[
                { n: "1", t: "O Problema", d: "5M+ produtores sem assistência técnica. R$ 60B em perdas anuais." },
                { n: "2", t: "A Solução", d: "AFU — diagnóstico por IA + banco agronômico + gestão integrada." },
                { n: "3", t: "Mercado", d: "TAM R$ 12B · SAM R$ 2,4B · SOM R$ 120M (meta 3 anos)." },
                { n: "4", t: "Produto", d: "App mobile + portal web + WhatsApp + API. 17 culturas. 10 módulos." },
                { n: "5", t: "Tração", d: "100 produtores piloto · NPS 72 · 85% precisão IA." },
                { n: "6", t: "Modelo de Negócio", d: "SaaS R$ 49–129/mês + marketplace 5–10% + API B2B." },
                { n: "7", t: "Equipe", d: "Fundadores com experiência em AgTech, IA e desenvolvimento rural." },
                { n: "8", t: "Financeiro", d: "Projeção R$ 5,88M ARR em 3 anos. Break-even mês 18." },
                { n: "9", t: "Captação", d: "Seed R$ 1,5M para 18 meses de runway + expansão." },
              ].map((s) => (
                <View key={s.n} className="flex-row gap-3 mb-3">
                  <View style={{ backgroundColor: "#00695C", width: 24, height: 24, borderRadius: 12 }} className="items-center justify-center flex-shrink-0">
                    <Text className="text-white text-xs font-bold">{s.n}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">{s.t}</Text>
                    <Text className="text-xs text-muted mt-1">{s.d}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { rodada: "Pre-Seed", valor: "R$ 300K", periodo: "Concluído", cor: "#9E9E9E", desc: "Bootstrapping + FFF (Friends, Family, Fools). Desenvolvimento do MVP e piloto com 100 produtores.", equity: "15%" },
              { rodada: "Seed", valor: "R$ 1,5M", periodo: "Aberta", cor: "#1B5E20", desc: "Expansão para SC/PR/RS. 1.000 produtores. Equipe de 8 pessoas. 18 meses de runway.", equity: "20%" },
              { rodada: "Série A", valor: "R$ 8M", periodo: "Ano 2", cor: "#1565C0", desc: "Expansão nacional. 10.000 produtores. Geointeligência e IoT. Equipe de 25.", equity: "18%" },
              { rodada: "Série B", valor: "R$ 40M", periodo: "Ano 3–4", cor: "#7B1FA2", desc: "América Latina. 100.000 produtores. Parcerias estratégicas. IPO prep.", equity: "15%" },
            ].map((r) => (
              <View key={r.rodada} style={{ backgroundColor: r.cor + "12", borderWidth: 1, borderColor: r.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <View style={{ backgroundColor: r.cor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text className="text-white text-xs font-bold">{r.rodada}</Text>
                  </View>
                  <Text style={{ color: r.cor }} className="text-base font-bold flex-1">{r.valor}</Text>
                  <Text className="text-xs text-muted">{r.periodo}</Text>
                </View>
                <Text className="text-xs text-muted leading-relaxed mb-2">{r.desc}</Text>
                <Text style={{ color: r.cor }} className="text-xs font-bold">Equity: {r.equity}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            {[
              { cor: "#1B5E20", tipo: "Venture Capital AgTech", exemplos: ["Barn Investimentos", "Acre Venture Partners", "SP Ventures", "Canary"], foco: "AgTech, AgroIA, Sustentabilidade" },
              { cor: "#1565C0", tipo: "Aceleradoras", exemplos: ["Startup Farm", "Liga Ventures", "Oxigênio (Porto Digital)", "INOVATIVA Brasil"], foco: "Startups early-stage, AgTech" },
              { cor: "#7B1FA2", tipo: "Fundos Governamentais", exemplos: ["FINEP (RHAE)", "BNDES Garagem", "SEBRAE Inovação", "Embrapa Ventures"], foco: "Inovação agropecuária, tecnologia rural" },
              { cor: "#C62828", tipo: "Investidores Anjo", exemplos: ["Anjos do Brasil", "Gávea Angels", "Executivos do agronegócio", "Ex-fundadores AgTech"], foco: "Pre-Seed, Seed, mentoria estratégica" },
            ].map((g) => (
              <View key={g.tipo} style={{ backgroundColor: g.cor + "12", borderWidth: 1, borderColor: g.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: g.cor }} className="text-sm font-bold mb-1">{g.tipo}</Text>
                <Text className="text-xs text-muted mb-2">Foco: {g.foco}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {g.exemplos.map((e) => (
                    <View key={e} style={{ backgroundColor: g.cor + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: g.cor }} className="text-xs">{e}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#00695C" }} className="text-sm font-bold mb-3">📈 Metodologias de Valuation</Text>
              {[
                { met: "Múltiplo de Receita (SaaS)", val: "8–12x ARR", obs: "Referência para SaaS AgTech early-stage" },
                { met: "DCF (Fluxo de Caixa Descontado)", val: "R$ 6–9M", obs: "Projeção 5 anos, WACC 25%" },
                { met: "Comparáveis de Mercado", val: "R$ 5–8M", obs: "Baseado em rodadas similares no Brasil" },
                { met: "Valuation Seed (consenso)", val: "R$ 7,5M pre-money", obs: "Para captação de R$ 1,5M (20% equity)" },
              ].map((r) => (
                <View key={r.met} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <Text className="text-xs font-bold text-foreground">{r.met}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">{r.val}</Text>
                    <Text className="text-xs text-muted flex-1">· {r.obs}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#00695C15", borderWidth: 1, borderColor: "#00695C30" }} className="rounded-xl p-4">
              <Text style={{ color: "#00695C" }} className="text-sm font-bold mb-3">💸 Uso dos Recursos — Seed R$ 1,5M</Text>
              {[
                { cat: "Equipe Técnica (4 devs + 1 PM)", pct: "45%", val: "R$ 675K", desc: "Salários por 18 meses" },
                { cat: "Infraestrutura e Cloud", pct: "15%", val: "R$ 225K", desc: "AWS, OpenAI API, ferramentas" },
                { cat: "Marketing e Aquisição", pct: "20%", val: "R$ 300K", desc: "Campanha digital + feiras" },
                { cat: "Operações e Suporte", pct: "10%", val: "R$ 150K", desc: "Atendimento, treinamento" },
                { cat: "Jurídico e Compliance", pct: "5%", val: "R$ 75K", desc: "LGPD, contratos, IP" },
                { cat: "Reserva Estratégica", pct: "5%", val: "R$ 75K", desc: "Imprevistos e oportunidades" },
              ].map((r) => (
                <View key={r.cat} style={{ borderBottomWidth: 1, borderBottomColor: "#00695C20" }} className="py-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-xs font-bold text-foreground flex-1">{r.cat}</Text>
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">{r.pct}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text style={{ color: "#00695C" }} className="text-xs">{r.val}</Text>
                    <Text className="text-xs text-muted">· {r.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        <AfuMvpFooter etapaNum={6} />
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/captacao-investimento"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
