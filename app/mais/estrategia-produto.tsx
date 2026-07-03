import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Roadmap", "Funcionalidades", "Prioridades", "Métricas", "Riscos"];

export default function EstrategiaProdutoScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#E65100" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#F57F17" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🗺️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Estratégia de Produto e Roadmap</Text>
            <Text style={{ color: "#FFCC80" }} className="text-xs">Etapa 4 · Estratégia e Negócio</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#E65100" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            {[
              { v: "AFU 1.0", periodo: "Meses 1–6", cor: "#1B5E20", status: "MVP", items: ["App mobile Android/iOS", "Diagnóstico por foto (IA)", "17 culturas no banco", "Portal web básico", "100 produtores piloto"] },
              { v: "AFU 2.0", periodo: "Meses 7–12", cor: "#1565C0", status: "Crescimento", items: ["Laboratório digital", "Calendário agrícola", "Marketplace básico", "Sensores IoT (beta)", "1.000 produtores"] },
              { v: "AFU 3.0", periodo: "Ano 2", cor: "#7B1FA2", status: "Escala", items: ["Geointeligência (satélite)", "Drones integrados", "WhatsApp IA", "API B2B", "10.000 produtores"] },
              { v: "AFU 4.0", periodo: "Ano 3", cor: "#C62828", status: "Expansão", items: ["América Latina", "Multilíngue (ES/EN)", "NOC nacional", "Automação avançada", "100.000 produtores"] },
              { v: "AFU 5.0", periodo: "Ano 4–5", cor: "#E65100", status: "Global", items: ["Expansão global", "Parcerias estratégicas", "IPO / M&A", "1.000.000 produtores"] },
            ].map((v) => (
              <View key={v.v} style={{ backgroundColor: v.cor + "12", borderWidth: 1, borderColor: v.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <View style={{ backgroundColor: v.cor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text className="text-white text-xs font-bold">{v.v}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{v.periodo}</Text>
                  <View style={{ backgroundColor: v.cor + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: v.cor }} className="text-xs">{v.status}</Text>
                  </View>
                </View>
                {v.items.map((item) => (
                  <Text key={item} className="text-xs text-muted">• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { cat: "Core — Diagnóstico", cor: "#1B5E20", items: ["Captura de foto da planta", "Diagnóstico por IA (GPT-4o Vision)", "Identificação de pragas e doenças", "Recomendação de tratamento", "Histórico de diagnósticos"] },
              { cat: "Banco Agronômico", cor: "#1565C0", items: ["17 culturas com fichas técnicas", "Dados de clima, solo e nutrientes", "Calendário de plantio e colheita", "Pragas e doenças por cultura", "Genética G1–G5"] },
              { cat: "Gestão de Propriedade", cor: "#7B1FA2", items: ["Cadastro de propriedades e talhões", "Registro de cultivos", "Controle de insumos", "Relatórios de produção", "Exportação PDF/Excel"] },
              { cat: "Marketplace", cor: "#C62828", items: ["Catálogo de mudas e sementes", "Bioinsumos certificados", "Serviços técnicos", "Rastreabilidade QR Code", "Pagamento integrado"] },
            ].map((c) => (
              <View key={c.cat} style={{ backgroundColor: c.cor + "12", borderWidth: 1, borderColor: c.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: c.cor }} className="text-sm font-bold mb-2">{c.cat}</Text>
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
              <Text style={{ color: "#E65100" }} className="text-sm font-bold mb-3">🎯 Matriz de Prioridades (MoSCoW)</Text>
              {[
                { p: "Must Have", cor: "#C62828", items: ["Diagnóstico por foto", "Banco de 17 culturas", "App Android/iOS", "Backend NestJS", "Autenticação JWT"] },
                { p: "Should Have", cor: "#E65100", items: ["Portal web do produtor", "Calendário agrícola", "Relatórios PDF", "Notificações push"] },
                { p: "Could Have", cor: "#1565C0", items: ["Laboratório digital", "Marketplace básico", "Sensores IoT", "WhatsApp bot"] },
                { p: "Won't Have (v1)", cor: "#9E9E9E", items: ["Drones", "Satélite NDVI", "América Latina", "Multilíngue"] },
              ].map((m) => (
                <View key={m.p} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <View style={{ backgroundColor: m.cor + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 6 }}>
                    <Text style={{ color: m.cor }} className="text-xs font-bold">{m.p}</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {m.items.map((item) => (
                      <View key={item} style={{ backgroundColor: m.cor + "10", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: m.cor }} className="text-xs">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">📊 KPIs do Produto</Text>
              {[
                { k: "Taxa de acerto da IA", meta: "≥ 85% (MVP) → 95% (v3.0)" },
                { k: "Tempo de diagnóstico", meta: "< 10 segundos" },
                { k: "DAU/MAU (engajamento)", meta: "≥ 40%" },
                { k: "NPS (satisfação)", meta: "≥ 50 (MVP) → 70 (v3.0)" },
                { k: "Churn mensal", meta: "< 5%" },
                { k: "Tempo médio de sessão", meta: "≥ 8 minutos" },
                { k: "Diagnósticos por usuário/mês", meta: "≥ 4" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{r.meta}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            {[
              { nivel: "Alto", cor: "#C62828", riscos: [
                { r: "Precisão da IA abaixo do esperado", m: "Fine-tuning com dados reais do piloto" },
                { r: "Baixa adoção pelo produtor rural", m: "UX simplificada + suporte presencial no piloto" },
              ]},
              { nivel: "Médio", cor: "#E65100", riscos: [
                { r: "Concorrente lança produto similar", m: "Acelerar diferenciação com banco agronômico proprietário" },
                { r: "Custo de API OpenAI cresce", m: "Fine-tuning de modelo próprio a partir do AFU 2.0" },
              ]},
              { nivel: "Baixo", cor: "#1565C0", riscos: [
                { r: "Falha de infraestrutura cloud", m: "Multi-cloud + backup automático + SLA 99,9%" },
                { r: "Problema de LGPD", m: "DPO dedicado + auditoria jurídica trimestral" },
              ]},
            ].map((g) => (
              <View key={g.nivel} style={{ backgroundColor: g.cor + "10", borderWidth: 1, borderColor: g.cor + "30" }} className="rounded-xl p-4">
                <View style={{ backgroundColor: g.cor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 8 }}>
                  <Text className="text-white text-xs font-bold">Risco {g.nivel}</Text>
                </View>
                {g.riscos.map((r) => (
                  <View key={r.r} style={{ borderBottomWidth: 1, borderBottomColor: g.cor + "20" }} className="py-2">
                    <Text className="text-xs text-foreground font-medium">⚠️ {r.r}</Text>
                    <Text className="text-xs text-muted mt-1">✅ {r.m}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/estrategia-produto"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
