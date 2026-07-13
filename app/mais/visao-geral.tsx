import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Missão", "Visão", "Valores", "Problema", "Solução", "Diferenciais", "Impacto"];

function StatusBadge({ status }: { status: "mvp" | "roadmap" }) {
  const isMvp = status === "mvp";
  return (
    <View
      style={{
        backgroundColor: isMvp ? "#2E7D3220" : "#1565C020",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 6,
      }}
    >
      <Text style={{ color: isMvp ? "#2E7D32" : "#1565C0", fontSize: 10, fontWeight: "700" }}>
        {isMvp ? "MVP 1.0" : "Roadmap"}
      </Text>
    </View>
  );
}

export default function VisaoGeralScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌱</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Visão Geral e Proposta de Valor</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">Etapa 1 · Estratégia e Negócio</Text>
          </View>
        </View>
        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
              >
                <Text style={{ color: tab === i ? "#1B5E20" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* ── Missão ── */}
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-2">🎯 Missão do AFU</Text>
              <Text className="text-sm text-foreground leading-relaxed">
                O <Text className="font-bold">AFU — Analisador Fitotécnico Universal</Text> tem como missão democratizar o acesso à tecnologia agronômica de ponta para pequenos e médios produtores rurais do Brasil, oferecendo diagnóstico fitotécnico por Inteligência Artificial, banco de dados agronômico completo e ferramentas de gestão integradas.
              </Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">🌿 Nome e Identidade</Text>
              {[
                { k: "Nome completo", v: "Analisador Fitotécnico Universal" },
                { k: "Sigla", v: "AFU" },
                { k: "Produto principal", v: "Planta Saudável" },
                { k: "Slogan", v: "\"Tecnologia agronômica ao alcance de todos\"" },
                { k: "Segmento", v: "AgTech · AgroIA · Fitotecnia Digital" },
                { k: "Público-alvo", v: "Pequenos e médios produtores rurais do Brasil" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted w-36">{r.k}</Text>
                  <Text className="text-xs text-foreground flex-1 font-medium">{r.v}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: "#E8F5E915", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-xl p-4">
              <Text style={{ color: "#2E7D32" }} className="text-sm font-bold mb-2">📍 Contexto</Text>
              <Text className="text-sm text-foreground leading-relaxed">
                O Brasil é o maior exportador de produtos agrícolas do mundo, mas a maioria dos produtores rurais ainda não tem acesso a ferramentas digitais de diagnóstico e gestão. O AFU surge para preencher essa lacuna, trazendo IA, banco de dados agronômico e automação para o campo.
              </Text>
            </View>
          </View>
        )}

        {/* ── Visão ── */}
        {tab === 1 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1565C015", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-2">🔭 Visão de Futuro</Text>
              <Text className="text-sm text-foreground leading-relaxed">
                Ser a principal plataforma de inteligência fitotécnica da América Latina, conectando produtores rurais a tecnologia agronômica de ponta — tornando o diagnóstico precoce, a gestão integrada e o conhecimento técnico acessíveis a qualquer produtor com um smartphone.
              </Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-3">🗺️ Horizonte Estratégico</Text>
              {[
                { k: "Curto prazo (AFU 1.0)", v: "MVP funcional com diagnóstico IA, gestão de propriedades e laudos PDF para 100 produtores piloto" },
                { k: "Médio prazo (AFU 2.0–3.0)", v: "Expansão regional, marketplace rural e assistente IA conversacional" },
                { k: "Longo prazo (AFU 4.0–5.0)", v: "Geointeligência, IoT, América Latina e escala global" },
              ].map((r) => (
                <View key={r.k} className="py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs font-bold text-foreground mb-1">{r.k}</Text>
                  <Text className="text-xs text-muted leading-relaxed">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Valores ── */}
        {tab === 2 && (
          <View className="gap-4">
            {[
              { cor: "#1B5E20", emoji: "🌱", t: "Acessibilidade", d: "Tecnologia agronômica ao alcance de todos os produtores, independentemente do porte ou localização." },
              { cor: "#1565C0", emoji: "🔬", t: "Rigor Técnico", d: "Diagnósticos baseados em ciência fitotécnica, com transparência sobre limites da IA e orientação para confirmação profissional." },
              { cor: "#7B1FA2", emoji: "🤝", t: "Proximidade com o Campo", d: "Produto pensado para a realidade do produtor rural brasileiro — simples, offline-first e em português." },
              { cor: "#E65100", emoji: "🌍", t: "Sustentabilidade", d: "Reduzir perdas e uso excessivo de agroquímicos por meio de diagnóstico precoce e manejo baseado em dados." },
              { cor: "#00695C", emoji: "📖", t: "Conhecimento Aberto", d: "Sistematizar e democratizar o conhecimento agronômico regional para preservá-lo e ampliá-lo." },
              { cor: "#C62828", emoji: "🔒", t: "Privacidade e LGPD", d: "Dados do produtor tratados com segurança, transparência e conformidade legal." },
            ].map((v) => (
              <View key={v.t} style={{ backgroundColor: v.cor + "12", borderWidth: 1, borderColor: v.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">{v.emoji}</Text>
                  <Text style={{ color: v.cor }} className="text-sm font-bold flex-1">{v.t}</Text>
                </View>
                <Text className="text-xs text-muted leading-relaxed">{v.d}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Problema ── */}
        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#B71C1C15", borderWidth: 1, borderColor: "#B71C1C30" }} className="rounded-xl p-4">
              <Text style={{ color: "#B71C1C" }} className="text-sm font-bold mb-3">❌ Problemas Identificados</Text>
              {[
                { num: "1", t: "Diagnóstico tardio", d: "Produtores identificam pragas e doenças tarde demais, causando perdas de 20–40% da produção." },
                { num: "2", t: "Falta de acesso técnico", d: "Apenas 15% dos produtores têm acesso regular a um agrônomo. O custo de uma visita técnica é proibitivo." },
                { num: "3", t: "Dados fragmentados", d: "Informações de solo, clima, culturas e pragas estão espalhadas em diferentes fontes, sem integração." },
                { num: "4", t: "Baixa adoção digital", d: "Ferramentas existentes são complexas e não adaptadas à realidade do produtor rural brasileiro." },
                { num: "5", t: "Perda de conhecimento", d: "Conhecimento agronômico regional não é sistematizado nem acessível de forma prática." },
              ].map((p) => (
                <View key={p.num} className="flex-row gap-3 mb-3">
                  <View style={{ backgroundColor: "#B71C1C", width: 24, height: 24, borderRadius: 12 }} className="items-center justify-center flex-shrink-0">
                    <Text className="text-white text-xs font-bold">{p.num}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: "#B71C1C" }} className="text-xs font-bold">{p.t}</Text>
                    <Text className="text-xs text-muted mt-1 leading-relaxed">{p.d}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#F57F17" }} className="text-sm font-bold mb-2">📊 Dados do Mercado</Text>
              {[
                { k: "Produtores rurais no Brasil", v: "5,07 milhões (IBGE 2017)" },
                { k: "Pequenos produtores (<50 ha)", v: "77% do total" },
                { k: "Com acesso a assistência técnica", v: "apenas 22%" },
                { k: "Perdas por pragas e doenças", v: "R$ 60 bilhões/ano" },
                { k: "Produtores com smartphone", v: "68% (crescente)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#F57F17" }} className="text-xs font-bold">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Solução ── */}
        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1565C015", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-3">✅ A Solução AFU</Text>
              <Text className="text-sm text-foreground leading-relaxed mb-3">
                O AFU oferece um ecossistema digital integrado por IA, com diagnóstico por foto, banco de dados agronômico e ferramentas de gestão acessíveis via smartphone.
              </Text>
              {([
                { emoji: "📸", t: "Diagnóstico por Foto", d: "Tire uma foto da planta e receba diagnóstico em segundos via IA multimodal (GPT-4o Vision).", status: "mvp" as const },
                { emoji: "🧠", t: "IA Agrônomo Virtual", d: "Assistente conversacional especializado em fitotecnia, disponível 24h pelo app e WhatsApp.", status: "roadmap" as const },
                { emoji: "🗃️", t: "Banco Agronômico", d: "15+ culturas com dados de clima, solo, nutrientes, pragas, doenças e calendário.", status: "mvp" as const },
                { emoji: "📊", t: "Gestão Integrada", d: "Propriedades, cultivos, análises laboratoriais, relatórios e laudos PDF em um só lugar.", status: "mvp" as const },
                { emoji: "🛰️", t: "Geointeligência", d: "Imagens de satélite, NDVI, drones e sensores IoT para agricultura de precisão.", status: "roadmap" as const },
              ]).map((s) => (
                <View key={s.t} className="flex-row gap-3 mb-3">
                  <Text className="text-2xl">{s.emoji}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap">
                      <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{s.t}</Text>
                      <StatusBadge status={s.status} />
                    </View>
                    <Text className="text-xs text-muted mt-1 leading-relaxed">{s.d}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-2">🏗️ Plataformas</Text>
              {([
                { p: "App Mobile (Android/iOS)", t: "Expo SDK 54 · React Native · EAS Build", status: "mvp" as const },
                { p: "API Backend", t: "Express · tRPC · MySQL · Drizzle ORM", status: "mvp" as const },
                { p: "Portal Web do Produtor", t: "Next.js 15 · Vercel", status: "roadmap" as const },
                { p: "Painel Administrativo", t: "React · Dashboard", status: "roadmap" as const },
                { p: "Integração WhatsApp", t: "Meta Business API", status: "roadmap" as const },
              ]).map((r) => (
                <View key={r.p} className="flex-row py-2 items-center" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-foreground flex-1 font-medium">{r.p}</Text>
                  <Text className="text-xs text-muted mr-2">{r.t}</Text>
                  <StatusBadge status={r.status} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Diferenciais ── */}
        {tab === 5 && (
          <View className="gap-4">
            {([
              { cor: "#1B5E20", emoji: "🤖", t: "IA Especializada em Fitotecnia", d: "Integra GPT-4o Vision com banco de conhecimento proprietário para diagnóstico por imagem.", status: "mvp" as const },
              { cor: "#1565C0", emoji: "🗃️", t: "Banco Agronômico Proprietário", d: "Módulos de culturas, clima, solo, pragas, doenças e calendário. Dados regionalizados para o Brasil.", status: "mvp" as const },
              { cor: "#7B1FA2", emoji: "📱", t: "Mobile-First para o Campo", d: "App com sync offline parcial, interface simples para produtores com baixa familiaridade digital.", status: "mvp" as const },
              { cor: "#C62828", emoji: "🔬", t: "Laboratório Digital Integrado", d: "Análises de solo, foliar e água com laudos automáticos em PDF.", status: "mvp" as const },
              { cor: "#E65100", emoji: "🛒", t: "Marketplace Agronômico", d: "Venda de mudas, sementes e bioinsumos com rastreabilidade e certificações.", status: "roadmap" as const },
              { cor: "#00695C", emoji: "🛰️", t: "Geointeligência Avançada", d: "Integração com Sentinel-2, Landsat e drones para NDVI e agricultura de precisão.", status: "roadmap" as const },
            ]).map((d) => (
              <View key={d.t} style={{ backgroundColor: d.cor + "12", borderWidth: 1, borderColor: d.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">{d.emoji}</Text>
                  <Text style={{ color: d.cor }} className="text-sm font-bold flex-1">{d.t}</Text>
                  <StatusBadge status={d.status} />
                </View>
                <Text className="text-xs text-muted leading-relaxed">{d.d}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Impacto ── */}
        {tab === 6 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">🌍 Impacto Esperado</Text>
              {[
                { k: "Redução de perdas", v: "20–40% menos perdas por diagnóstico precoce" },
                { k: "Acesso técnico", v: "5M+ produtores sem assistência técnica atendidos" },
                { k: "Produtividade", v: "+15–25% com manejo baseado em dados" },
                { k: "Sustentabilidade", v: "Redução de 30% no uso de agroquímicos" },
                { k: "Renda do produtor", v: "Aumento médio de 18% com gestão integrada" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2 gap-3" style={{ borderBottomWidth: 1, borderBottomColor: "#1B5E2020" }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-bold text-right flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-3">🎯 Metas AFU 1.0 → 5.0</Text>
              {[
                { v: "AFU 1.0", t: "MVP · 100 produtores piloto · SC/PR/RS" },
                { v: "AFU 2.0", t: "1.000 produtores · Sul e Sudeste" },
                { v: "AFU 3.0", t: "10.000 produtores · Brasil" },
                { v: "AFU 4.0", t: "100.000 produtores · América Latina" },
                { v: "AFU 5.0", t: "1.000.000 produtores · Global" },
              ].map((m) => (
                <View key={m.v} className="flex-row items-center gap-3 py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ backgroundColor: "#1565C020", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{m.v}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{m.t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <AfuMvpFooter etapaNum={1} />
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/visao-geral"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
