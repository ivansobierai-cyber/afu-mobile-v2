import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { usePermission } from "@/components/route-guard";

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Etapa = {
  num: number;
  title: string;
  route: string | null; // null = sem tela própria (etapas sem rota dedicada)
  requireAdmin?: boolean;
};

type Fase = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  etapas: Etapa[];
};

// ─── Dados ───────────────────────────────────────────────────────────────────
const FASES: Fase[] = [
  {
    id: "estrategia",
    label: "Estratégia e Negócio",
    emoji: "🎯",
    color: "#1565C0",
    etapas: [
      { num: 1,  title: "Visão Geral e Proposta de Valor",           route: "/mais/visao-geral" },
      { num: 2,  title: "Análise de Mercado e Público-Alvo",         route: "/mais/analise-mercado" },
      { num: 3,  title: "Modelo de Negócio e Monetização",           route: "/mais/modelo-negocio" },
      { num: 4,  title: "Estratégia de Produto e Roadmap",            route: "/mais/estrategia-produto" },
      { num: 5,  title: "Plano de Marketing e Go-to-Market",          route: "/mais/plano-marketing" },
      { num: 6,  title: "Captação e Investimento",                    route: "/mais/captacao-investimento" },
    ],
  },
  {
    id: "tecnica",
    label: "Arquitetura Técnica",
    emoji: "⚙️",
    color: "#C62828",
    etapas: [
      { num: 7,  title: "Arquitetura do Sistema e Stack Tecnológico", route: "/mais/arquitetura-sistema" },
      { num: 8,  title: "Banco de Dados e Schema",                    route: "/mais/banco-dados-schema" },
      { num: 9,  title: "API Design — Contratos e Endpoints",         route: "/mais/api-design" },
      { num: 10, title: "Segurança Técnica e LGPD",                    route: "/mais/seguranca-tecnica" },
      { num: 11, title: "Infraestrutura Técnica e Cloud",             route: "/mais/infraestrutura-tecnica" },
      { num: 12, title: "Integrações Técnicas e Parceiros",            route: "/mais/integracoes-tecnicas" },
    ],
  },
  {
    id: "design",
    label: "Design e UX/UI",
    emoji: "🎨",
    color: "#7B1FA2",
    etapas: [
      { num: 13, title: "Design System Base — Cores e Tipografia",    route: "/mais/design-system-base" },
      { num: 14, title: "Wireframes — App, Web e Admin",               route: "/mais/wireframes" },
      { num: 15, title: "Fluxos de Usuário e Jornada",                route: "/mais/fluxos-usuario" },
      { num: 16, title: "Guia de Componentes — Atoms a Organisms",    route: "/mais/guia-componentes" },
      { num: 22, title: "Design System AFU",                          route: "/mais/design-system" },
      { num: 23, title: "Protótipos UX/UI Completos",                 route: "/mais/prototipos-ux" },
    ],
  },
  {
    id: "governanca",
    label: "Governança e Compliance",
    emoji: "⚖️",
    color: "#455A64",
    etapas: [
      { num: 17, title: "Estrutura Organizacional e Equipe",          route: "/mais/estrutura-organizacional" },
      { num: 18, title: "Indicadores de Desempenho (KPIs)",           route: "/mais/kpis" },
      { num: 19, title: "Governança, Segurança e LGPD",               route: "/mais/governanca-devops" },
      { num: 20, title: "Plano Mestre de Implementação AFU 1.0→5.0",  route: "/mais/plano-mestre" },
      { num: 21, title: "Execução Real do Projeto AFU MVP 1.0",       route: "/mais/execucao-mvp" },
      { num: 46, title: "Arquitetura Final de Software e Infra",      route: "/mais/arquitetura-final" },
    ],
  },
  {
    id: "implementacao",
    label: "Implementação do MVP",
    emoji: "🚀",
    color: "#2E7D32",
    etapas: [
      { num: 24, title: "Backend NestJS — Implementação Real",        route: "/mais/backend-nestjs" },
      { num: 25, title: "App React Native — Android e iOS",           route: "/mais/app-react-native" },
      { num: 26, title: "Portal Web do Produtor — Next.js 15",        route: "/mais/portal-web-v2" },
      { num: 27, title: "Painel Administrativo AFU",                  route: "/mais/painel-admin", requireAdmin: true },
      { num: 28, title: "Deploy Beta e Homologação (STAGING)",        route: "/mais/deploy-beta" },
      { num: 29, title: "Testes de Campo e Projeto Piloto",           route: "/mais/testes-campo" },
    ],
  },
  {
    id: "banco",
    label: "Banco de Dados Agronômico",
    emoji: "🌱",
    color: "#00695C",
    etapas: [
      { num: 30, title: "Banco de Dados Agronômico Avançado",         route: "/mais/banco-agronomico" },
      { num: 31, title: "Culturas Iniciais — 17 Fichas Técnicas",     route: "/mais/culturas-iniciais" },
      { num: 32, title: "Seed Inicial das Culturas (Prisma)",         route: "/mais/seed-culturas" },
      { num: 33, title: "Seed de Clima, Irrigação e Nutrientes",      route: "/mais/seed-tecnico" },
      { num: 34, title: "Pragas, Doenças, Rotação e Genética G1–G5",  route: "/mais/banco-fitossanitario" },
      { num: 35, title: "AFU GeoClima — Banco Climático Nacional",    route: "/mais/geoclima" },
      { num: 36, title: "AFU Solos — Banco Nacional de Solos",        route: "/mais/afu-solos" },
      { num: 37, title: "AFU Genoma Vegetal e Melhoramento Genético", route: "/mais/genoma-vegetal" },
      { num: 38, title: "Calendário Agrícola Inteligente",            route: "/mais/calendario-agricola" },
      { num: 39, title: "AFU Laboratório Digital",                    route: "/mais/laboratorio-digital" },
      { num: 40, title: "Economia Agrícola e Previsão de Produção",   route: "/mais/economia-agricola" },
      { num: 41, title: "IA Agrônomo Virtual (AFU AI CORE)",          route: "/mais/ia-agronomo" },
      { num: 42, title: "Satélite, Drones e Geointeligência",         route: "/mais/geointeligencia" },
      { num: 43, title: "Rede de Sensores IoT e Automação Rural",     route: "/mais/iot-automacao" },
      { num: 44, title: "Marketplace e Comercialização Agrícola",     route: "/mais/marketplace-agricola" },
      { num: 45, title: "Centro de Comando NOC Agrícola",             route: "/mais/noc-agricola" },
    ],
  },
];

// ─── Componente ──────────────────────────────────────────────────────────────
export default function IndiceGeralScreen() {
  const colors = useColors();
  const router = useRouter();
  const { canAccess: isAdmin } = usePermission({ requireAdmin: true });
  const [expandedFase, setExpandedFase] = useState<string | null>("estrategia");

  // Filtra etapas restritas a admins
  const fasesVisiveis = FASES.map((f) => ({
    ...f,
    etapas: f.etapas.filter((e) => !e.requireAdmin || isAdmin),
  }));

  const totalEtapas = FASES.reduce((acc, f) => acc + f.etapas.length, 0);
  const etapasComRota = FASES.reduce(
    (acc, f) => acc + f.etapas.filter((e) => e.route !== null).length,
    0
  );
  const progressoGeral = Math.round((etapasComRota / totalEtapas) * 100);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-3">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📋</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Índice Geral AFU</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              46 Etapas · 6 Fases · Documentação Completa
            </Text>
          </View>
        </View>

        {/* Progresso geral */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.12)" }} className="rounded-xl p-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-xs font-bold">Progresso Geral</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold">
              {etapasComRota}/{totalEtapas} etapas · {progressoGeral}%
            </Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", height: 8, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ backgroundColor: "#69F0AE", width: `${progressoGeral}%` as any, height: 8, borderRadius: 4 }} />
          </View>
          <View className="flex-row justify-between mt-2">
            {FASES.map((f) => {
              const pct = Math.round((f.etapas.filter((e) => e.route !== null).length / f.etapas.length) * 100);
              return (
                <View key={f.id} className="items-center" style={{ flex: 1 }}>
                  <Text className="text-white text-xs">{f.emoji}</Text>
                  <Text style={{ color: "#A5D6A7" }} className="text-xs">{pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Resumo por fase */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {FASES.map((f) => {
            const total = f.etapas.length;
            const done = f.etapas.filter((e) => e.route !== null).length;
            const pct = Math.round((done / total) * 100);
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setExpandedFase(expandedFase === f.id ? null : f.id)}
                style={{ backgroundColor: f.color + "15", borderWidth: 1, borderColor: f.color + "40", width: "47%" }}
                className="rounded-xl p-3"
              >
                <Text className="text-xl mb-1">{f.emoji}</Text>
                <Text style={{ color: f.color }} className="text-xs font-bold leading-tight">{f.label}</Text>
                <Text className="text-xs text-muted mt-1">{done}/{total} etapas</Text>
                <View style={{ backgroundColor: f.color + "30", height: 4, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                  <View style={{ backgroundColor: f.color, width: `${pct}%` as any, height: 4, borderRadius: 2 }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Lista de fases com etapas */}
        {fasesVisiveis.map((fase) => {
          const isOpen = expandedFase === fase.id;
          const done = fase.etapas.filter((e) => e.route !== null).length;
          const pct = Math.round((done / fase.etapas.length) * 100);

          return (
            <View key={fase.id} className="mb-3">
              {/* Cabeçalho da fase */}
              <TouchableOpacity
                onPress={() => setExpandedFase(isOpen ? null : fase.id)}
                style={{ backgroundColor: fase.color, borderRadius: 12 }}
                className="p-3 flex-row items-center"
              >
                <Text className="text-white text-lg mr-2">{fase.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-white text-sm font-bold">{fase.label}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View style={{ backgroundColor: "rgba(255,255,255,0.25)", height: 4, borderRadius: 2, flex: 1, overflow: "hidden" }}>
                      <View style={{ backgroundColor: "#fff", width: `${pct}%` as any, height: 4, borderRadius: 2 }} />
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.9)" }} className="text-xs">{done}/{fase.etapas.length}</Text>
                  </View>
                </View>
                <Text className="text-white text-base ml-2">{isOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {/* Etapas da fase */}
              {isOpen && (
                <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: fase.color + "30", borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }} className="overflow-hidden">
                  {fase.etapas.map((etapa, idx) => {
                    const hasRoute = etapa.route !== null;
                    const isAdminItem = etapa.requireAdmin === true;
                    return (
                      <TouchableOpacity
                        key={etapa.num}
                        onPress={() => hasRoute && router.push(etapa.route as any)}
                        disabled={!hasRoute}
                        style={{
                          borderTopWidth: idx > 0 ? 1 : 0,
                          borderTopColor: colors.border,
                          opacity: hasRoute ? 1 : 0.5,
                        }}
                        className="flex-row items-center px-3 py-3"
                      >
                        {/* Número */}
                        <View
                          style={{ backgroundColor: hasRoute ? fase.color : "#9E9E9E", width: 28, height: 28, borderRadius: 14 }}
                          className="items-center justify-center mr-3 flex-shrink-0"
                        >
                          <Text className="text-white text-xs font-bold">{etapa.num}</Text>
                        </View>

                        {/* Título */}
                        <Text style={{ color: hasRoute ? colors.foreground : colors.muted }} className="text-xs flex-1 leading-relaxed">
                          {etapa.title}
                        </Text>

                        {/* Badge Admin */}
                        {isAdminItem && isAdmin && (
                          <View style={{ backgroundColor: "#7C3AED20", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, marginLeft: 4 }}>
                            <Text style={{ color: "#7C3AED", fontSize: 9, fontWeight: "800" }}>ADMIN</Text>
                          </View>
                        )}
                        {/* Indicador */}
                        {hasRoute ? (
                          <View style={{ backgroundColor: fase.color + "20", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
                            <Text style={{ color: fase.color }} className="text-xs font-bold">→</Text>
                          </View>
                        ) : (
                          <View style={{ backgroundColor: "#9E9E9E20", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
                            <Text style={{ color: "#9E9E9E" }} className="text-xs">—</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Rodapé com estatísticas */}
        <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-4 mb-8">
          <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">📊 Estatísticas do Projeto</Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              { k: "46", v: "Etapas totais", cor: "#1B5E20" },
              { k: "6",  v: "Fases temáticas", cor: "#1565C0" },
              { k: "17", v: "Culturas no banco", cor: "#2E7D32" },
              { k: "17", v: "Tabelas PostgreSQL", cor: "#C62828" },
              { k: "11", v: "Módulos NestJS", cor: "#7B1FA2" },
              { k: "5",  v: "Plataformas cliente", cor: "#F57F17" },
              { k: "8",  v: "Serviços Docker", cor: "#0288D1" },
              { k: "10", v: "Módulos banco agro", cor: "#00695C" },
            ].map((s) => (
              <View key={s.k} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "22%" }} className="rounded-xl p-2 items-center">
                <Text style={{ color: s.cor }} className="text-lg font-bold">{s.k}</Text>
                <Text className="text-xs text-muted text-center leading-tight">{s.v}</Text>
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: "#1B5E2015", borderRadius: 8, padding: 10, marginTop: 12 }}>
            <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">🎯 Missão AFU</Text>
            <Text style={{ color: "#2E7D32" }} className="text-xs mt-1 leading-relaxed">
              Democratizar o acesso à tecnologia agronômica de ponta para pequenos e médios produtores rurais do Brasil, oferecendo diagnóstico fitotécnico por IA, banco de dados agronômico completo e ferramentas de gestão integradas.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
