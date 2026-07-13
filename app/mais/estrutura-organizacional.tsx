import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Equipe", "Papéis", "RACI", "Parceiros"];

const PAPEIS = [
  { papel: "CEO / Produto", resp: "Visão, roadmap, stakeholders, captação", pessoas: "1 FTE" },
  { papel: "Tech Lead", resp: "Arquitetura, code review, deploy, segurança", pessoas: "1 FTE" },
  { papel: "Dev Full-stack", resp: "Expo, tRPC, MySQL, integrações", pessoas: "2 FTE" },
  { papel: "Agrônomo / IA", resp: "Banco fitossanitário, prompts, validação campo", pessoas: "1 FTE" },
  { papel: "UX / Suporte", resp: "Onboarding, materiais, tickets produtor", pessoas: "1 FTE" },
  { papel: "Comercial / CS", resp: "Piloto, cooperativas, marketplace vendedores", pessoas: "1 FTE" },
];

export default function EstruturaOrganizacionalScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#455A64" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#546E7A" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">👥</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Estrutura Organizacional</Text>
            <Text style={{ color: "#CFD8DC" }} className="text-xs">Etapa 17 · Governança · MVP 1.0</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(i)}
                style={{
                  backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: tab === i ? "#455A64" : "#fff" }} className="text-xs font-bold">
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-3">
            <View style={{ backgroundColor: "#455A6415", borderWidth: 1, borderColor: "#455A6430" }} className="rounded-xl p-4">
              <Text style={{ color: "#455A64" }} className="text-sm font-bold mb-2">Organograma MVP (7 pessoas)</Text>
              <Text className="text-xs text-muted leading-relaxed">
                Estrutura enxuta para validar o piloto Planta Saudável: produto + engenharia + agronomia + suporte ao produtor.
              </Text>
            </View>
            {PAPEIS.map((p) => (
              <View
                key={p.papel}
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                className="rounded-xl p-3"
              >
                <Text className="text-sm font-bold text-foreground">{p.papel}</Text>
                <Text className="text-xs text-muted mt-1">{p.resp}</Text>
                <Text style={{ color: "#455A64" }} className="text-xs font-semibold mt-2">{p.pessoas}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View className="gap-3">
            {[
              { nivel: "Estratégico", times: "CEO, Tech Lead, Agrônomo", foco: "Roadmap, qualidade IA, compliance" },
              { nivel: "Operacional", times: "Dev, UX, Comercial", foco: "Entregas sprint, suporte, piloto" },
              { nivel: "Campo", times: "Técnicos parceiros + cooperativas", foco: "Coleta de feedback, RC piloto" },
            ].map((n) => (
              <View key={n.nivel} style={{ borderLeftWidth: 4, borderLeftColor: "#455A64", backgroundColor: "#455A6408" }} className="rounded-r-xl p-3">
                <Text className="text-sm font-bold">{n.nivel}</Text>
                <Text className="text-xs text-muted mt-1">{n.times}</Text>
                <Text className="text-xs mt-2">{n.foco}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-2">
            {[
              { atividade: "Deploy staging (Railway/Vercel)", r: "Tech Lead", a: "Dev", c: "CEO" },
              { atividade: "Validação diagnóstico IA", r: "Agrônomo", a: "Dev", c: "Suporte" },
              { atividade: "Piloto 50 produtores", r: "Comercial", a: "UX", c: "CEO" },
              { atividade: "LGPD / dados sensíveis", r: "CEO", a: "Tech Lead", c: "Jurídico ext." },
            ].map((row) => (
              <View key={row.atividade} className="flex-row py-2 border-b border-gray-100">
                <Text className="text-xs flex-1 text-foreground">{row.atividade}</Text>
                <Text className="text-xs w-16 text-center" style={{ color: "#C62828" }}>{row.r}</Text>
                <Text className="text-xs w-16 text-center" style={{ color: "#1565C0" }}>{row.a}</Text>
                <Text className="text-xs w-16 text-center text-muted">{row.c}</Text>
              </View>
            ))}
            <Text className="text-xs text-muted mt-2">R = Responsável · A = Accountable · C = Consultado</Text>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-3">
            {[
              { nome: "Cooperativas regionais", tipo: "Distribuição + piloto", status: "Em negociação" },
              { nome: "Laboratórios parceiros", tipo: "Laudos e análises", status: "Cadastro no app" },
              { nome: "EAS / Expo", tipo: "Build mobile", status: "Ativo" },
              { nome: "Railway + Vercel", tipo: "Hosting staging", status: "Produção staging" },
            ].map((p) => (
              <View key={p.nome} className="rounded-xl p-3" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-sm font-bold">{p.nome}</Text>
                <Text className="text-xs text-muted">{p.tipo}</Text>
                <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold mt-1">{p.status}</Text>
              </View>
            ))}
          </View>
        )}

        <RelatedLinks links={RELATED_LINKS_MAP["/mais/estrutura-organizacional"] ?? []} />
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
