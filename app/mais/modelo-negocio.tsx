import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Canvas", "Receitas", "Planos", "Custos", "Projeções"];

export default function ModeloNegocioScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#4A148C" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#6A1B9A" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">💼</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Modelo de Negócio e Monetização</Text>
            <Text style={{ color: "#CE93D8" }} className="text-xs">Etapa 3 · Estratégia e Negócio</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#4A148C" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-3">
            <Text style={{ color: "#4A148C" }} className="text-sm font-bold">📋 Business Model Canvas</Text>
            {[
              { t: "Proposta de Valor", c: "#1B5E20", items: ["Diagnóstico fitotécnico por IA em segundos", "Banco agronômico completo regionalizado", "Gestão integrada de propriedades e cultivos", "Marketplace de insumos e serviços"] },
              { t: "Segmentos de Clientes", c: "#1565C0", items: ["Pequenos produtores rurais (1–50 ha)", "Médios produtores (50–500 ha)", "Técnicos agrícolas e agrônomos", "Cooperativas e associações rurais"] },
              { t: "Canais", c: "#C62828", items: ["App mobile (Android/iOS)", "Portal web do produtor", "WhatsApp Business", "Parceiros e revendedores"] },
              { t: "Fontes de Receita", c: "#E65100", items: ["Assinatura mensal/anual (SaaS)", "Comissão marketplace (5–10%)", "Laudos laboratoriais premium", "API para integradores (B2B)"] },
              { t: "Recursos-Chave", c: "#7B1FA2", items: ["Banco de dados agronômico proprietário", "Modelo de IA treinado (GPT-4o + fine-tuning)", "Equipe técnica multidisciplinar", "Parcerias com EMBRAPA e universidades"] },
              { t: "Atividades-Chave", c: "#00695C", items: ["Desenvolvimento e manutenção do app", "Curadoria do banco agronômico", "Treinamento e suporte ao produtor", "Expansão de parcerias regionais"] },
            ].map((b) => (
              <View key={b.t} style={{ backgroundColor: b.c + "12", borderWidth: 1, borderColor: b.c + "30" }} className="rounded-xl p-3">
                <Text style={{ color: b.c }} className="text-xs font-bold mb-2">{b.t}</Text>
                {b.items.map((item) => (
                  <Text key={item} className="text-xs text-muted">• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { cor: "#1B5E20", emoji: "💳", t: "SaaS — Assinatura", d: "Planos mensais e anuais por produtor ou por propriedade. Principal fonte de receita recorrente.", pct: "55%" },
              { cor: "#1565C0", emoji: "🛒", t: "Marketplace — Comissão", d: "5–10% sobre transações de mudas, sementes, bioinsumos e serviços técnicos.", pct: "20%" },
              { cor: "#7B1FA2", emoji: "🔬", t: "Laudos Premium", d: "Análises de solo, foliar, água e sementes com laudo digital e certificado.", pct: "12%" },
              { cor: "#C62828", emoji: "🔌", t: "API B2B", d: "Acesso à API do banco agronômico para cooperativas, revendas e integradores.", pct: "8%" },
              { cor: "#E65100", emoji: "📚", t: "Conteúdo e Treinamento", d: "Cursos, webinars e materiais técnicos premium para produtores e técnicos.", pct: "5%" },
            ].map((r) => (
              <View key={r.t} style={{ backgroundColor: r.cor + "12", borderWidth: 1, borderColor: r.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xl">{r.emoji}</Text>
                  <Text style={{ color: r.cor }} className="text-sm font-bold flex-1">{r.t}</Text>
                  <View style={{ backgroundColor: r.cor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text className="text-white text-xs font-bold">{r.pct}</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted leading-relaxed">{r.d}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            {[
              { cor: "#9E9E9E", nome: "Gratuito", preco: "R$ 0/mês", items: ["1 propriedade", "5 diagnósticos/mês", "Banco de culturas básico", "Suporte por e-mail"] },
              { cor: "#1565C0", nome: "Produtor", preco: "R$ 49/mês", items: ["3 propriedades", "Diagnósticos ilimitados", "Banco agronômico completo", "Calendário agrícola", "Relatórios PDF", "Suporte prioritário"] },
              { cor: "#1B5E20", nome: "Profissional", preco: "R$ 129/mês", items: ["10 propriedades", "Tudo do Produtor", "Laboratório digital", "Sensores IoT (até 10)", "API de integração", "Suporte dedicado"] },
              { cor: "#4A148C", nome: "Cooperativa", preco: "Sob consulta", items: ["Produtores ilimitados", "Tudo do Profissional", "Dashboard executivo", "Relatórios consolidados", "SLA garantido", "Gerente de conta"] },
            ].map((p) => (
              <View key={p.nome} style={{ backgroundColor: p.cor + "12", borderWidth: 1, borderColor: p.cor + "40" }} className="rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ color: p.cor }} className="text-base font-bold">{p.nome}</Text>
                  <Text style={{ color: p.cor }} className="text-sm font-bold">{p.preco}</Text>
                </View>
                {p.items.map((item) => (
                  <Text key={item} className="text-xs text-muted mb-1">✓ {item}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#C62828" }} className="text-sm font-bold mb-3">💸 Estrutura de Custos</Text>
              {[
                { k: "Infraestrutura Cloud (AWS/GCP)", v: "R$ 8.000/mês", t: "Fixo" },
                { k: "API OpenAI (GPT-4o)", v: "R$ 3.000/mês", t: "Variável" },
                { k: "Equipe técnica (4 devs)", v: "R$ 40.000/mês", t: "Fixo" },
                { k: "Marketing e aquisição", v: "R$ 10.000/mês", t: "Variável" },
                { k: "Suporte e operações", v: "R$ 8.000/mês", t: "Fixo" },
                { k: "Jurídico e compliance", v: "R$ 3.000/mês", t: "Fixo" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <View style={{ backgroundColor: r.t === "Fixo" ? "#1565C020" : "#C6282820", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                    <Text style={{ color: r.t === "Fixo" ? "#1565C0" : "#C62828" }} className="text-xs">{r.t}</Text>
                  </View>
                  <Text className="text-xs font-bold text-foreground">{r.v}</Text>
                </View>
              ))}
              <View className="flex-row pt-3 mt-1">
                <Text style={{ color: "#C62828" }} className="text-xs font-bold flex-1">Total Mensal (MVP)</Text>
                <Text style={{ color: "#C62828" }} className="text-xs font-bold">R$ 72.000/mês</Text>
              </View>
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">📈 Projeção de Receita</Text>
              {[
                { ano: "Ano 1 (AFU 1.0)", prod: "100", rec: "R$ 58.800", status: "Piloto" },
                { ano: "Ano 2 (AFU 2.0)", prod: "1.000", rec: "R$ 588.000", status: "Crescimento" },
                { ano: "Ano 3 (AFU 3.0)", prod: "10.000", rec: "R$ 5,88M", status: "Escala" },
                { ano: "Ano 4 (AFU 4.0)", prod: "100.000", rec: "R$ 58,8M", status: "Expansão" },
                { ano: "Ano 5 (AFU 5.0)", prod: "1.000.000", rec: "R$ 588M", status: "Global" },
              ].map((r) => (
                <View key={r.ano} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <View className="flex-row items-center justify-between">
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{r.ano}</Text>
                    <View style={{ backgroundColor: "#1B5E2020", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: "#1B5E20" }} className="text-xs">{r.status}</Text>
                    </View>
                  </View>
                  <View className="flex-row mt-1">
                    <Text className="text-xs text-muted flex-1">{r.prod} produtores</Text>
                    <Text className="text-xs font-bold text-foreground">{r.rec}/ano</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/modelo-negocio"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
