import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "roadmap", label: "Roadmap" },
  { id: "cronograma", label: "Cronograma" },
  { id: "equipes", label: "Equipes" },
  { id: "indicadores", label: "Indicadores" },
  { id: "financeiro", label: "Financeiro" },
  { id: "status", label: "Status" },
];

type SectionKey =
  | "afu10" | "afu20" | "afu30" | "afu40" | "afu50"
  | "fases" | "tecnico"
  | "mvp" | "escalada"
  | "kpis" | "riscos"
  | "financas" | "lancamento" | "qualidade" | "docs"
  | "checklist" | "marcos";

function ExpandableSection({
  title,
  subtitle,
  color,
  sectionKey,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  color: string;
  sectionKey: SectionKey;
  expanded: boolean;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-xl overflow-hidden border border-gray-200">
      <TouchableOpacity
        onPress={() => onToggle(sectionKey)}
        style={{ backgroundColor: color + "15" }}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-muted mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        <IconSymbol
          name={expanded ? "chevron.down" : "chevron.right"}
          size={16}
          color={color}
        />
      </TouchableOpacity>
      {expanded && (
        <View className="p-4 bg-surface">{children}</View>
      )}
    </View>
  );
}

function Tag({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      style={{ backgroundColor: bg }}
      className="rounded-full px-3 py-1 mr-2 mb-2"
    >
      <Text style={{ color }} className="text-xs font-semibold">
        {label}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <Text className="text-xs text-muted flex-1">{label}</Text>
      <Text className="text-xs font-semibold text-foreground text-right flex-1">
        {value}
      </Text>
    </View>
  );
}

const VERSOES = [
  {
    key: "afu10" as SectionKey,
    versao: "AFU 1.0",
    titulo: "MVP",
    objetivo: "Validar o produto",
    prazo: "3 a 6 meses",
    meta: "100 produtores",
    cor: "#2E7D32",
    bg: "#E8F5E9",
    entregas: [
      "Login e Cadastro",
      "Propriedades e Culturas",
      "Diagnóstico por Imagem",
      "Relatórios PDF",
      "Portal do Produtor",
      "Painel Administrativo",
      "Banco de Conhecimento Inicial",
    ],
  },
  {
    key: "afu20" as SectionKey,
    versao: "AFU 2.0",
    titulo: "Operacional",
    objetivo: "Entrar em operação comercial",
    prazo: "6 a 12 meses",
    meta: "1.000 produtores",
    cor: "#1565C0",
    bg: "#E3F2FD",
    entregas: [
      "Laboratório e Certificações",
      "Materiais Didáticos",
      "Calendário Agrícola",
      "Notificações",
      "Assistente IA",
    ],
  },
  {
    key: "afu30" as SectionKey,
    versao: "AFU 3.0",
    titulo: "Inteligente",
    objetivo: "Adicionar automação agrícola",
    prazo: "12 a 24 meses",
    meta: "10.000 produtores",
    cor: "#EF6C00",
    bg: "#FFF3E0",
    entregas: [
      "Sensores IoT",
      "Irrigação Inteligente",
      "Drones",
      "Inteligência Preditiva",
      "BI Avançado",
    ],
  },
  {
    key: "afu40" as SectionKey,
    versao: "AFU 4.0",
    titulo: "Nacional",
    objetivo: "Expandir para todo o país",
    prazo: "24 a 48 meses",
    meta: "100.000 produtores",
    cor: "#6A1B9A",
    bg: "#F3E5F5",
    entregas: [
      "Marketplace completo",
      "Rede de laboratórios",
      "Integrações governamentais",
      "Certificações nacionais",
      "Centros regionais",
    ],
  },
  {
    key: "afu50" as SectionKey,
    versao: "AFU 5.0",
    titulo: "Internacional",
    objetivo: "Transformar o AFU em plataforma global",
    prazo: "48 a 72 meses",
    meta: "1.000.000 produtores",
    cor: "#C62828",
    bg: "#FFEBEE",
    entregas: [
      "Multilíngue",
      "Exportação",
      "Blockchain para rastreabilidade",
      "Satélites",
      "IA multimodal avançada",
    ],
  },
];

export default function PlanoMestreScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("roadmap");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{ backgroundColor: "#1B5E20" }}
        className="px-4 pt-4 pb-3"
      >
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#2E7D32" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <IconSymbol name="map.fill" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">
              Plano Mestre AFU 1.0 → 5.0
            </Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Roadmap · Cronograma · Equipes · Indicadores · Financeiro
            </Text>
          </View>
          <View
            style={{ backgroundColor: "#2E7D32" }}
            className="rounded-full px-2 py-0.5"
          >
            <Text className="text-white text-xs font-bold">Etapa 20</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-surface border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-2"
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className="mr-1 py-3 px-3"
            >
              <Text
                style={{
                  color: activeTab === tab.id ? "#1B5E20" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View
                  style={{ backgroundColor: "#1B5E20" }}
                  className="h-0.5 rounded-full mt-1"
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Cronograma e equipes abaixo referem o plano original. O MVP 1.0 entregue usa Express/tRPC, MySQL/Drizzle, Expo e Vercel." />

        {/* ─── ROADMAP ─── */}
        {activeTab === "roadmap" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Roadmap de Versões
            </Text>
            <Text className="text-xs text-muted mb-4">
              5 versões · Do MVP à plataforma agrícola global
            </Text>

            {/* Timeline visual */}
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                Evolução do AFU
              </Text>
              {VERSOES.map((v, i) => (
                <View key={v.versao} className="flex-row items-start mb-3">
                  <View className="items-center mr-3">
                    <View
                      style={{ backgroundColor: v.cor, borderColor: v.cor }}
                      className="w-8 h-8 rounded-full items-center justify-center border-2"
                    >
                      <Text className="text-white text-xs font-bold">
                        {i + 1}
                      </Text>
                    </View>
                    {i < VERSOES.length - 1 && (
                      <View
                        style={{ backgroundColor: v.cor + "60" }}
                        className="w-0.5 h-6"
                      />
                    )}
                  </View>
                  <View className="flex-1 pb-1">
                    <View className="flex-row items-center gap-2">
                      <Text style={{ color: v.cor }} className="text-xs font-bold">
                        {v.versao}
                      </Text>
                      <Text className="text-gray-400 text-xs">—</Text>
                      <Text className="text-white text-xs font-semibold">
                        {v.titulo}
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {v.prazo} · Meta: {v.meta}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Versões expandíveis */}
            {VERSOES.map((v) => (
              <ExpandableSection
                key={v.key}
                title={`${v.versao} — ${v.titulo}`}
                subtitle={`${v.objetivo} · ${v.prazo} · Meta: ${v.meta}`}
                color={v.cor}
                sectionKey={v.key}
                expanded={!!expanded[v.key]}
                onToggle={toggle}
              >
                <InfoRow label="Objetivo" value={v.objetivo} />
                <InfoRow label="Prazo" value={v.prazo} />
                <InfoRow label="Meta de usuários" value={v.meta} />
                <Text className="text-xs font-semibold text-foreground mt-3 mb-2">
                  Entregas:
                </Text>
                <View className="flex-row flex-wrap">
                  {v.entregas.map((e) => (
                    <Tag key={e} label={e} color={v.cor} bg={v.bg} />
                  ))}
                </View>
              </ExpandableSection>
            ))}
          </View>
        )}

        {/* ─── CRONOGRAMA ─── */}
        {activeTab === "cronograma" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Cronograma de Implementação
            </Text>
            <Text className="text-xs text-muted mb-4">
              6 fases macro · Cronograma técnico mês a mês
            </Text>

            <ExpandableSection
              title="Cronograma Macro — 6 Fases"
              subtitle="Total: ~300 dias para o MVP"
              color="#1565C0"
              sectionKey="fases"
              expanded={!!expanded.fases}
              onToggle={toggle}
            >
              {[
                { fase: "Fase 1", nome: "Infraestrutura", prazo: "30 dias", cor: "#64B5F6", desc: "Configuração de servidores, banco de dados, CI/CD e ambientes DEV/STAGING/PROD." },
                { fase: "Fase 2", nome: "Backend", prazo: "60 dias", cor: "#81C784", desc: "API Express + tRPC, JWT, routers principais e Drizzle/MySQL." },
                { fase: "Fase 3", nome: "Aplicativos", prazo: "60 dias", cor: "#FFB74D", desc: "App Expo/React Native, portal web (Expo export/Vercel) e admin." },
                { fase: "Fase 4", nome: "IA Inicial", prazo: "60 dias", cor: "#CE93D8", desc: "Módulo de diagnóstico por imagem, banco de conhecimento e assistente IA." },
                { fase: "Fase 5", nome: "Testes", prazo: "30 dias", cor: "#EF9A9A", desc: "Testes unitários, integração, carga, segurança e usabilidade." },
                { fase: "Fase 6", nome: "Piloto", prazo: "60 dias", cor: "#80CBC4", desc: "Implantação com primeiros 100 produtores, coleta de feedback e ajustes." },
              ].map((f) => (
                <View key={f.fase} className="mb-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{ backgroundColor: f.cor }}
                        className="w-2 h-2 rounded-full"
                      />
                      <Text className="text-xs font-bold text-foreground">
                        {f.fase} — {f.nome}
                      </Text>
                    </View>
                    <View
                      style={{ backgroundColor: f.cor + "30" }}
                      className="rounded-full px-2 py-0.5"
                    >
                      <Text style={{ color: f.cor }} className="text-xs font-semibold">
                        {f.prazo}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted ml-4">{f.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Cronograma Técnico — Mês a Mês"
              subtitle="6 meses para o MVP funcional"
              color="#2E7D32"
              sectionKey="tecnico"
              expanded={!!expanded.tecnico}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { mes: "Mês 1", items: ["Banco de dados", "API base", "Autenticação JWT"], cor: "#81C784" },
                  { mes: "Mês 2", items: ["App Mobile", "Portal Web"], cor: "#64B5F6" },
                  { mes: "Mês 3", items: ["Diagnóstico IA", "Banco de Conhecimento"], cor: "#FFB74D" },
                  { mes: "Mês 4", items: ["Relatórios PDF", "Certificações"], cor: "#CE93D8" },
                  { mes: "Mês 5", items: ["Testes completos", "Correções"], cor: "#EF9A9A" },
                  { mes: "Mês 6", items: ["Implantação piloto", "Onboarding produtores"], cor: "#80CBC4" },
                ].map((m, i) => (
                  <View key={m.mes} className="flex-row items-start mb-3">
                    <View
                      style={{ backgroundColor: m.cor + "30", borderColor: m.cor }}
                      className="w-8 h-8 rounded-full items-center justify-center border mr-3"
                    >
                      <Text style={{ color: m.cor }} className="text-xs font-bold">
                        {i + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: m.cor }} className="text-xs font-bold mb-1">
                        {m.mes}
                      </Text>
                      {m.items.map((item) => (
                        <Text key={item} className="text-gray-400 text-xs">
                          • {item}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            {/* Marcos */}
            <Text className="text-sm font-bold text-foreground mt-2 mb-3">
              Marcos de Entrega
            </Text>
            {[
              { marco: "MVP", desc: "Sistema funcional com módulos core", cor: "#2E7D32" },
              { marco: "Operacional", desc: "Primeiros clientes pagantes", cor: "#1565C0" },
              { marco: "Escala", desc: "Operação nacional consolidada", cor: "#EF6C00" },
              { marco: "Internacionalização", desc: "Operação multinacional", cor: "#C62828" },
            ].map((m) => (
              <View
                key={m.marco}
                style={{ borderLeftColor: m.cor, backgroundColor: m.cor + "10" }}
                className="border-l-4 rounded-r-xl p-3 mb-2"
              >
                <Text style={{ color: m.cor }} className="text-xs font-bold">
                  {m.marco}
                </Text>
                <Text className="text-xs text-muted mt-0.5">{m.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── EQUIPES ─── */}
        {activeTab === "equipes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Estrutura de Equipes
            </Text>
            <Text className="text-xs text-muted mb-4">
              Equipe mínima MVP · Equipe escalada AFU 3.0+
            </Text>

            <ExpandableSection
              title="Equipe Mínima — MVP"
              subtitle="10 profissionais · 4 áreas"
              color="#2E7D32"
              sectionKey="mvp"
              expanded={!!expanded.mvp}
              onToggle={toggle}
            >
              {[
                {
                  area: "Gestão",
                  cor: "#1565C0",
                  bg: "#E3F2FD",
                  membros: [
                    { cargo: "Product Owner", resp: "Visão do produto, backlog, prioridades" },
                    { cargo: "Gerente de Projeto", resp: "Cronograma, riscos, entregas" },
                  ],
                },
                {
                  area: "Desenvolvimento",
                  cor: "#2E7D32",
                  bg: "#E8F5E9",
                  membros: [
                    { cargo: "Backend Developer", resp: "API tRPC, MySQL/Drizzle, integrações" },
                    { cargo: "Frontend Web", resp: "Expo web, portal Vercel, admin" },
                    { cargo: "Mobile Developer", resp: "React Native, app iOS e Android" },
                    { cargo: "UX/UI Designer", resp: "Design system, protótipos, usabilidade" },
                  ],
                },
                {
                  area: "Dados & IA",
                  cor: "#EF6C00",
                  bg: "#FFF3E0",
                  membros: [
                    { cargo: "Especialista IA", resp: "Modelos de ML, banco de conhecimento, prompts" },
                    { cargo: "DBA", resp: "MySQL 8, otimização, backups, migrações Drizzle" },
                  ],
                },
                {
                  area: "Agronomia",
                  cor: "#37474F",
                  bg: "#ECEFF1",
                  membros: [
                    { cargo: "Engenheiro Agrônomo", resp: "Validação científica, metodologias, laudos" },
                    { cargo: "Técnico Agrícola", resp: "Suporte técnico, treinamento de produtores" },
                  ],
                },
              ].map((area) => (
                <View key={area.area} className="mb-4">
                  <View
                    style={{ backgroundColor: area.bg }}
                    className="rounded-lg px-3 py-1.5 mb-2 self-start"
                  >
                    <Text style={{ color: area.cor }} className="text-xs font-bold">
                      {area.area}
                    </Text>
                  </View>
                  {area.membros.map((m) => (
                    <View key={m.cargo} className="flex-row items-start mb-2 ml-2">
                      <View
                        style={{ backgroundColor: area.cor }}
                        className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2"
                      />
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-foreground">
                          {m.cargo}
                        </Text>
                        <Text className="text-xs text-muted">{m.resp}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Equipe Escalada — AFU 3.0+"
              subtitle="Especialistas adicionais para crescimento"
              color="#6A1B9A"
              sectionKey="escalada"
              expanded={!!expanded.escalada}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  "Arquitetos de Software",
                  "Engenheiros DevOps",
                  "Especialistas GIS",
                  "Especialistas IoT",
                  "Equipe Comercial",
                  "Equipe Educacional",
                  "Equipe Jurídica",
                ].map((e) => (
                  <Tag key={e} label={e} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
              <Text className="text-xs text-muted mt-3">
                A partir do AFU 3.0, a plataforma requer especialistas em infraestrutura distribuída, georreferenciamento, integração com sensores de campo e expansão comercial para novos mercados.
              </Text>
            </ExpandableSection>

            {/* Organograma visual */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                Organograma MVP
              </Text>
              <View className="items-center">
                <View
                  style={{ backgroundColor: "#1565C020", borderColor: "#64B5F6" }}
                  className="rounded-xl px-4 py-2 border mb-2"
                >
                  <Text className="text-blue-300 text-xs font-bold text-center">
                    Product Owner
                  </Text>
                </View>
                <View className="w-0.5 h-3 bg-gray-600" />
                <View
                  style={{ backgroundColor: "#2E7D3220", borderColor: "#81C784" }}
                  className="rounded-xl px-4 py-2 border mb-2"
                >
                  <Text className="text-green-300 text-xs font-bold text-center">
                    Gerente de Projeto
                  </Text>
                </View>
                <View className="w-0.5 h-3 bg-gray-600" />
                <View className="flex-row gap-2">
                  {["Dev", "Dados", "Agro"].map((area, i) => (
                    <View
                      key={area}
                      style={{
                        backgroundColor: ["#EF6C0020", "#6A1B9A20", "#37474F20"][i],
                        borderColor: ["#FFB74D", "#CE93D8", "#90A4AE"][i],
                      }}
                      className="rounded-xl px-3 py-2 border"
                    >
                      <Text
                        style={{ color: ["#FFB74D", "#CE93D8", "#90A4AE"][i] }}
                        className="text-xs font-bold"
                      >
                        {area}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── INDICADORES ─── */}
        {activeTab === "indicadores" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Indicadores & Riscos
            </Text>
            <Text className="text-xs text-muted mb-4">
              KPIs técnicos e de negócio · Gestão de riscos
            </Text>

            <ExpandableSection
              title="Indicadores de Sucesso"
              subtitle="Técnicos · Negócio · Qualidade"
              color="#2E7D32"
              sectionKey="kpis"
              expanded={!!expanded.kpis}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">
                KPIs Técnicos:
              </Text>
              {[
                { kpi: "Disponibilidade", meta: "> 99%", cor: "#2E7D32" },
                { kpi: "Tempo de resposta", meta: "< 3 segundos", cor: "#2E7D32" },
                { kpi: "Precisão da IA", meta: "> 85%", cor: "#2E7D32" },
              ].map((k) => (
                <View
                  key={k.kpi}
                  className="flex-row items-center justify-between py-2 border-b border-gray-100"
                >
                  <Text className="text-xs text-muted">{k.kpi}</Text>
                  <View
                    style={{ backgroundColor: k.cor + "20" }}
                    className="rounded-full px-3 py-0.5"
                  >
                    <Text style={{ color: k.cor }} className="text-xs font-bold">
                      {k.meta}
                    </Text>
                  </View>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">
                KPIs de Negócio:
              </Text>
              <View className="flex-row flex-wrap">
                {["Usuários ativos", "Receita recorrente", "Taxa de retenção", "Satisfação (NPS)"].map((k) => (
                  <Tag key={k} label={k} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Gestão de Riscos"
              subtitle="Técnicos · Operacionais · Legais"
              color="#C62828"
              sectionKey="riscos"
              expanded={!!expanded.riscos}
              onToggle={toggle}
            >
              {[
                {
                  tipo: "Riscos Técnicos",
                  cor: "#C62828",
                  bg: "#FFEBEE",
                  items: [
                    { risco: "Qualidade dos dados", mitg: "Curadoria contínua com Comitê Científico" },
                    { risco: "Treinamento da IA", mitg: "Dataset de 50K imagens + validação agronômica" },
                    { risco: "Conectividade rural", mitg: "Modo offline com sincronização assíncrona" },
                  ],
                },
                {
                  tipo: "Riscos Operacionais",
                  cor: "#EF6C00",
                  bg: "#FFF3E0",
                  items: [
                    { risco: "Adesão dos produtores", mitg: "Piloto com cooperativas e universidades" },
                    { risco: "Custo de implantação", mitg: "Modelo SaaS escalonável por porte" },
                  ],
                },
                {
                  tipo: "Riscos Legais",
                  cor: "#37474F",
                  bg: "#ECEFF1",
                  items: [
                    { risco: "LGPD", mitg: "Comitê de Segurança + DPO dedicado" },
                    { risco: "Certificações", mitg: "Comitê Científico + parceiros certificadores" },
                    { risco: "Propriedade intelectual", mitg: "Equipe jurídica + contratos claros" },
                  ],
                },
              ].map((grupo) => (
                <View key={grupo.tipo} className="mb-4">
                  <View
                    style={{ backgroundColor: grupo.bg }}
                    className="rounded-lg px-3 py-1.5 mb-2 self-start"
                  >
                    <Text style={{ color: grupo.cor }} className="text-xs font-bold">
                      {grupo.tipo}
                    </Text>
                  </View>
                  {grupo.items.map((item) => (
                    <View key={item.risco} className="mb-2 ml-2">
                      <Text className="text-xs font-semibold text-foreground">
                        {item.risco}
                      </Text>
                      <Text className="text-xs text-muted">
                        Mitigação: {item.mitg}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ExpandableSection>

            {/* Plano de Qualidade */}
            <Text className="text-sm font-bold text-foreground mt-2 mb-3">
              Plano de Qualidade
            </Text>
            <View className="bg-gray-900 rounded-xl p-4">
              <Text className="text-white text-xs font-bold mb-3">
                Validações e Testes
              </Text>
              <View className="flex-row gap-3 mb-3">
                {["Agronômica", "Laboratorial", "Tecnológica"].map((v, i) => (
                  <View
                    key={v}
                    style={{ backgroundColor: ["#2E7D3230", "#1565C030", "#EF6C0030"][i], borderColor: ["#81C784", "#64B5F6", "#FFB74D"][i] }}
                    className="flex-1 rounded-xl p-2 border items-center"
                  >
                    <Text style={{ color: ["#81C784", "#64B5F6", "#FFB74D"][i] }} className="text-xs font-bold text-center">
                      {v}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="text-gray-400 text-xs font-semibold mb-2">
                Tipos de teste:
              </Text>
              <View className="flex-row flex-wrap">
                {["Unitários", "Integração", "Carga", "Segurança", "Usabilidade"].map((t, i) => (
                  <View
                    key={t}
                    style={{ backgroundColor: "#FFFFFF10" }}
                    className="rounded px-2 py-0.5 mr-1 mb-1"
                  >
                    <Text className="text-gray-300 text-xs">{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── FINANCEIRO ─── */}
        {activeTab === "financeiro" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Plano Financeiro & Lançamento
            </Text>
            <Text className="text-xs text-muted mb-4">
              Categorias de investimento · Modelos de receita · Estratégia
            </Text>

            <ExpandableSection
              title="Plano Financeiro Inicial"
              subtitle="6 categorias de investimento · 5 modelos de receita"
              color="#1565C0"
              sectionKey="financas"
              expanded={!!expanded.financas}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">
                Categorias de Investimento:
              </Text>
              <View className="flex-row flex-wrap mb-4">
                {[
                  { cat: "Infraestrutura", cor: "#1565C0", bg: "#E3F2FD" },
                  { cat: "Desenvolvimento", cor: "#2E7D32", bg: "#E8F5E9" },
                  { cat: "IA & Dados", cor: "#EF6C00", bg: "#FFF3E0" },
                  { cat: "Marketing", cor: "#6A1B9A", bg: "#F3E5F5" },
                  { cat: "Treinamento", cor: "#37474F", bg: "#ECEFF1" },
                  { cat: "Operação", cor: "#C62828", bg: "#FFEBEE" },
                ].map((c) => (
                  <Tag key={c.cat} label={c.cat} color={c.cor} bg={c.bg} />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">
                Modelos de Receita:
              </Text>
              {[
                { modelo: "SaaS", desc: "Assinatura mensal/anual por produtor ou propriedade" },
                { modelo: "Assinatura", desc: "Planos básico, profissional e enterprise" },
                { modelo: "Licenciamento", desc: "Licença para cooperativas e associações" },
                { modelo: "Marketplace", desc: "Comissão sobre transações de insumos e produtos" },
                { modelo: "Serviços Técnicos", desc: "Laudos, análises laboratoriais e consultoria" },
              ].map((m) => (
                <View key={m.modelo} className="mb-2">
                  <Text className="text-xs font-bold text-foreground">{m.modelo}</Text>
                  <Text className="text-xs text-muted">{m.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Estratégia de Lançamento"
              subtitle="Piloto → Municípios → Estados → Nacional"
              color="#2E7D32"
              sectionKey="lancamento"
              expanded={!!expanded.lancamento}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">
                Fase Piloto — Parcerias:
              </Text>
              <View className="flex-row flex-wrap mb-3">
                {["Cooperativas", "Universidades", "Associações rurais"].map((p) => (
                  <Tag key={p} label={p} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">
                Expansão Progressiva:
              </Text>
              <View className="bg-gray-900 rounded-xl p-3">
                {[
                  { nivel: "Municípios", desc: "Regiões agrícolas estratégicas", cor: "#81C784" },
                  { nivel: "Estados", desc: "Principais estados produtores", cor: "#64B5F6" },
                  { nivel: "Regiões", desc: "Cobertura nacional por bioma", cor: "#FFB74D" },
                  { nivel: "Nacional", desc: "Todos os estados brasileiros", cor: "#CE93D8" },
                ].map((e) => (
                  <View key={e.nivel} className="flex-row items-center mb-2">
                    <View
                      style={{ backgroundColor: e.cor }}
                      className="w-2 h-2 rounded-full mr-3"
                    />
                    <Text style={{ color: e.cor }} className="text-xs font-bold w-20">
                      {e.nivel}
                    </Text>
                    <Text className="text-gray-400 text-xs flex-1">{e.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Documentação Obrigatória"
              subtitle="5 documentos técnicos e operacionais"
              color="#37474F"
              sectionKey="docs"
              expanded={!!expanded.docs}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  "Manual Técnico",
                  "Manual do Usuário",
                  "Documentação API",
                  "Documentação IA",
                  "Documentação Operacional",
                ].map((d) => (
                  <Tag key={d} label={d} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── STATUS ─── */}
        {activeTab === "status" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Status Geral do Projeto
            </Text>
            <Text className="text-xs text-muted mb-4">
              14 etapas de documentação concluídas · Pronto para execução
            </Text>

            <ExpandableSection
              title="Documentação Estratégica Concluída"
              subtitle="14 módulos documentados e validados"
              color="#2E7D32"
              sectionKey="checklist"
              expanded={!!expanded.checklist}
              onToggle={toggle}
            >
              {[
                "Fundação (Etapa 1)",
                "Arquitetura Técnica (Etapa 4)",
                "Banco de Dados / Drizzle (Etapas 8, 30)",
                "API Backend tRPC (Etapa 9, 24)",
                "Autenticação & Permissões (Etapa 7)",
                "Aplicativos Mobile e Web (Etapas 8, 9, 10)",
                "Módulo de IA (Etapa 11)",
                "Banco de Conhecimento (Etapa 12)",
                "Diagnóstico por Imagem (Etapa 13)",
                "Laboratório (Etapa 14)",
                "IoT & Agricultura Inteligente (Etapa 15)",
                "Marketplace Rural (Etapa 16)",
                "Universidade Rural Digital (Etapa 17)",
                "BI & Inteligência Estratégica (Etapa 18)",
                "Governança & DevOps (Etapa 19)",
                "Roadmap de Implementação (Etapa 20)",
              ].map((item) => (
                <View key={item} className="flex-row items-center py-1.5 border-b border-gray-100">
                  <View
                    style={{ backgroundColor: "#2E7D32" }}
                    className="w-4 h-4 rounded items-center justify-center mr-3"
                  >
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                  <Text className="text-xs text-foreground flex-1">{item}</Text>
                </View>
              ))}
            </ExpandableSection>

            {/* Próxima fase */}
            <View
              style={{ backgroundColor: "#1B5E20" }}
              className="rounded-xl p-4 mb-4"
            >
              <Text className="text-white text-xs font-bold mb-2">
                PRÓXIMA FASE — Etapa 21
              </Text>
              <Text className="text-green-200 text-xs leading-5">
                Execução Real do Projeto — monorepo Expo, API Express/tRPC, MySQL/Drizzle, app React Native, portal web Vercel e banco agronômico com 17 culturas no MVP 1.0.
              </Text>
            </View>

            <ExpandableSection
              title="Marcos de Entrega"
              subtitle="4 marcos principais do projeto"
              color="#1565C0"
              sectionKey="marcos"
              expanded={!!expanded.marcos}
              onToggle={toggle}
            >
              {[
                { marco: "MVP", versao: "AFU 1.0", desc: "Sistema funcional com módulos core validados", prazo: "6 meses", cor: "#2E7D32" },
                { marco: "Operacional", versao: "AFU 2.0", desc: "Primeiros clientes pagantes em produção", prazo: "12 meses", cor: "#1565C0" },
                { marco: "Escala Nacional", versao: "AFU 4.0", desc: "100.000 produtores em todo o Brasil", prazo: "48 meses", cor: "#EF6C00" },
                { marco: "Internacionalização", versao: "AFU 5.0", desc: "1 milhão de produtores em múltiplos países", prazo: "72 meses", cor: "#C62828" },
              ].map((m) => (
                <View key={m.marco} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{ backgroundColor: m.cor }}
                        className="w-2 h-2 rounded-full"
                      />
                      <Text className="text-xs font-bold text-foreground">
                        {m.marco}
                      </Text>
                      <View
                        style={{ backgroundColor: m.cor + "20" }}
                        className="rounded-full px-2 py-0.5"
                      >
                        <Text style={{ color: m.cor }} className="text-xs">
                          {m.versao}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted">{m.prazo}</Text>
                  </View>
                  <Text className="text-xs text-muted ml-4">{m.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            {/* Resumo final */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                AFU — Visão Completa
              </Text>
              <Text className="text-gray-300 text-xs text-center leading-5 mb-3">
                O AFU passa a possuir um roteiro completo de evolução, desde a concepção até uma plataforma agrícola de escala nacional e internacional.
              </Text>
              <View className="flex-row flex-wrap justify-center">
                {["MVP 1.0", "Operacional 2.0", "Inteligente 3.0", "Nacional 4.0", "Internacional 5.0"].map((v, i) => (
                  <View
                    key={v}
                    style={{ backgroundColor: ["#2E7D3230", "#1565C030", "#EF6C0030", "#6A1B9A30", "#C6282830"][i], borderColor: ["#81C784", "#64B5F6", "#FFB74D", "#CE93D8", "#EF9A9A"][i] }}
                    className="rounded-full px-3 py-1 mr-1 mb-1 border"
                  >
                    <Text style={{ color: ["#81C784", "#64B5F6", "#FFB74D", "#CE93D8", "#EF9A9A"][i] }} className="text-xs font-semibold">
                      {v}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
        <AfuMvpFooter etapaNum={20} />
      </ScrollView>
    </ScreenContainer>
  );
}
