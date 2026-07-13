import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Estratégia", "Canais", "Conteúdo", "Parcerias", "Métricas"];

export default function PlanoMarketingScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#C62828" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#D32F2F" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📣</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Plano de Marketing e Go-to-Market</Text>
            <Text style={{ color: "#FFCDD2" }} className="text-xs">Etapa 5 · Estratégia e Negócio</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#C62828" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#C6282815", borderWidth: 1, borderColor: "#C6282830" }} className="rounded-xl p-4">
              <Text style={{ color: "#C62828" }} className="text-sm font-bold mb-3">🎯 Estratégia Go-to-Market</Text>
              <Text className="text-sm text-foreground leading-relaxed mb-3">
                O AFU adota uma estratégia de <Text className="font-bold">lançamento regional focado</Text>, iniciando em Santa Catarina com produtores de horticultura e fruticultura, expandindo progressivamente para o Sul e depois para o Brasil.
              </Text>
              {[
                { fase: "Fase 1 — Piloto", periodo: "Meses 1–3", desc: "100 produtores selecionados em Penha-SC e região. Onboarding presencial. Feedback intensivo." },
                { fase: "Fase 2 — Lançamento SC", periodo: "Meses 4–6", desc: "Lançamento público em Santa Catarina. Marketing digital + parceiros locais." },
                { fase: "Fase 3 — Expansão Sul", periodo: "Meses 7–12", desc: "PR e RS. Parcerias com cooperativas e EMATER. Meta: 1.000 produtores." },
                { fase: "Fase 4 — Brasil", periodo: "Ano 2", desc: "Expansão nacional. Parceiros regionais. Meta: 10.000 produtores." },
              ].map((f) => (
                <View key={f.fase} style={{ borderBottomWidth: 1, borderBottomColor: "#C6282820" }} className="py-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text style={{ color: "#C62828" }} className="text-xs font-bold">{f.fase}</Text>
                    <Text className="text-xs text-muted">· {f.periodo}</Text>
                  </View>
                  <Text className="text-xs text-muted leading-relaxed">{f.desc}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#C62828" }} className="text-sm font-bold mb-2">💡 Posicionamento</Text>
              <Text className="text-xs text-muted leading-relaxed">
                "O AFU é o <Text className="font-bold text-foreground">agrônomo digital</Text> que cabe no bolso do produtor rural. Diagnóstico rápido, banco de dados completo e gestão integrada — tudo em um app simples e acessível."
              </Text>
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { cor: "#1565C0", emoji: "📱", t: "Marketing Digital", items: ["Instagram e Facebook com conteúdo educativo", "YouTube — tutoriais e casos de sucesso", "Google Ads para produtores rurais", "SEO para buscas agronômicas"] },
              { cor: "#1B5E20", emoji: "🤝", t: "Vendas Diretas", items: ["Visitas a cooperativas e associações", "Feiras agropecuárias (Agrishow, Expointer)", "Parceiros locais e revendas", "Demonstrações presenciais no campo"] },
              { cor: "#7B1FA2", emoji: "💬", t: "WhatsApp e Comunidades", items: ["Grupos de produtores rurais", "Bot de diagnóstico via WhatsApp", "Grupos de cooperativas parceiras", "Influenciadores do agro"] },
              { cor: "#E65100", emoji: "🏫", t: "Educação e Conteúdo", items: ["Webinars técnicos mensais", "Blog agronômico SEO", "Parcerias com escolas agrícolas", "Certificações e cursos online"] },
            ].map((c) => (
              <View key={c.t} style={{ backgroundColor: c.cor + "12", borderWidth: 1, borderColor: c.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">{c.emoji}</Text>
                  <Text style={{ color: c.cor }} className="text-sm font-bold">{c.t}</Text>
                </View>
                {c.items.map((item) => (
                  <Text key={item} className="text-xs text-muted">• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#C62828" }} className="text-sm font-bold mb-3">📝 Estratégia de Conteúdo</Text>
              {[
                { tipo: "Diagnóstico em vídeo", freq: "3x/semana", canal: "Instagram/YouTube", desc: "\"Identifique essa praga em 10 segundos\"" },
                { tipo: "Dica agronômica", freq: "Diário", canal: "Instagram Stories", desc: "Calendário de plantio, nutrição, manejo" },
                { tipo: "Caso de sucesso", freq: "1x/semana", canal: "Blog/LinkedIn", desc: "Produtor que aumentou produtividade com AFU" },
                { tipo: "Webinar técnico", freq: "1x/mês", canal: "YouTube Live", desc: "Especialistas em fitotecnia e agronomia" },
                { tipo: "Newsletter", freq: "1x/semana", canal: "E-mail", desc: "Alertas climáticos + dicas da semana" },
              ].map((r) => (
                <View key={r.tipo} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-xs font-bold text-foreground flex-1">{r.tipo}</Text>
                    <Text style={{ color: "#C62828" }} className="text-xs font-bold">{r.freq}</Text>
                  </View>
                  <Text className="text-xs text-muted">{r.canal} · {r.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            {[
              { cor: "#1B5E20", emoji: "🏛️", t: "Institucionais", parceiros: ["EMBRAPA", "EPAGRI (SC)", "EMATER (PR/RS)", "Universidades Agrícolas", "SENAR"] },
              { cor: "#1565C0", emoji: "🤝", t: "Cooperativas", parceiros: ["Cooperativas do Sul do Brasil", "OCEPAR (PR)", "OCESC (SC)", "FECOOAGRO (RS)"] },
              { cor: "#7B1FA2", emoji: "🏪", t: "Distribuidores de Insumos", parceiros: ["Lojas agropecuárias regionais", "Distribuidores de sementes", "Revendas de fertilizantes", "Fabricantes de bioinsumos"] },
              { cor: "#E65100", emoji: "📱", t: "Tecnologia", parceiros: ["Meta (WhatsApp Business)", "Google (Maps/Cloud)", "AWS / GCP", "Fabricantes de sensores IoT"] },
            ].map((g) => (
              <View key={g.t} style={{ backgroundColor: g.cor + "12", borderWidth: 1, borderColor: g.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">{g.emoji}</Text>
                  <Text style={{ color: g.cor }} className="text-sm font-bold">{g.t}</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {g.parceiros.map((p) => (
                    <View key={p} style={{ backgroundColor: g.cor + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: g.cor }} className="text-xs">{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#C62828" }} className="text-sm font-bold mb-3">📊 KPIs de Marketing</Text>
              {[
                { k: "CAC (Custo de Aquisição)", meta: "< R$ 50/produtor (MVP)" },
                { k: "LTV (Lifetime Value)", meta: "> R$ 600/produtor (12 meses)" },
                { k: "LTV/CAC", meta: "> 12x" },
                { k: "Taxa de conversão (trial→pago)", meta: "> 25%" },
                { k: "Seguidores Instagram", meta: "10.000 em 6 meses" },
                { k: "Inscritos YouTube", meta: "5.000 em 6 meses" },
                { k: "NPS de marketing", meta: "> 40 (promotores recomendam)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#C62828" }} className="text-xs font-bold">{r.meta}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <AfuMvpFooter etapaNum={5} />
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/plano-marketing"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
