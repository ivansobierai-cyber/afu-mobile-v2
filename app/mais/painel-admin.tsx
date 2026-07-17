import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "gestao", label: "Gestão" },
  { id: "laboratorio", label: "Laboratório" },
  { id: "conteudo", label: "Conteúdo" },
  { id: "relatorios", label: "Relatórios" },
  { id: "monitoramento", label: "Monitor" },
];

type SectionKey =
  | "kpis" | "rbac" | "estrutura"
  | "usuarios" | "produtores" | "diagnosticos"
  | "labFluxo" | "bancoConhecimento"
  | "materiais" | "sensores" | "marketplace"
  | "relExport" | "auditoria"
  | "monitorOp" | "notificacoes" | "criterios";

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
    <View className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
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
        <Text style={{ color }} className="text-base font-bold ml-2">
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View className="p-4 bg-surface">{children}</View>
      )}
    </View>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg }} className="rounded-full px-3 py-1 mr-2 mb-2">
      <Text style={{ color }} className="text-xs font-semibold">{label}</Text>
    </View>
  );
}

export default function PainelAdminScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#37474F" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#455A64" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <Text className="text-white text-xl">⚙️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Painel Administrativo AFU</Text>
            <Text style={{ color: "#B0BEC5" }} className="text-xs">
              Next.js 15 · Recharts · RBAC · 5 perfis de acesso
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 27</Text>
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
              <Text
                style={{
                  color: activeTab === tab.id ? "#37474F" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#37474F", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Painel MVP admin usa Express/tRPC. Menções a NestJS abaixo são do plano histórico." />

        {/* ─── DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dashboard Executivo</Text>
            <Text className="text-xs text-muted mb-4">
              7 KPIs · Tempo real · 5 perfis RBAC
            </Text>

            <ExpandableSection
              title="KPIs Principais"
              subtitle="7 indicadores estratégicos"
              color="#37474F"
              sectionKey="kpis"
              expanded={!!expanded.kpis}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap gap-2 mb-3">
                {[
                  { kpi: "Produtores", valor: "12.450", cor: "#81C784" },
                  { kpi: "Propriedades", valor: "8.230", cor: "#64B5F6" },
                  { kpi: "Culturas", valor: "24.100", cor: "#FFB74D" },
                  { kpi: "Diagnósticos", valor: "45.670", cor: "#EF9A9A" },
                  { kpi: "Relatórios", valor: "18.900", cor: "#CE93D8" },
                  { kpi: "Sensores", valor: "3.200", cor: "#80CBC4" },
                  { kpi: "Receita", valor: "R$ 890K", cor: "#FFCC80" },
                ].map((k) => (
                  <View key={k.kpi} style={{ backgroundColor: k.cor + "20", borderWidth: 1, borderColor: k.cor + "40", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: k.cor }} className="text-base font-bold">{k.valor}</Text>
                    <Text className="text-xs text-muted mt-0.5">{k.kpi}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Indicadores em Tempo Real:</Text>
              {[
                { ind: "Usuários online", desc: "Sessões ativas no momento", cor: "#81C784" },
                { ind: "Alertas críticos", desc: "Diagnósticos com gravidade alta/crítica", cor: "#EF9A9A" },
                { ind: "Diagnósticos pendentes", desc: "Aguardando revisão técnica", cor: "#FFB74D" },
              ].map((i) => (
                <View key={i.ind} style={{ borderLeftWidth: 4, borderLeftColor: i.cor, backgroundColor: i.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: i.cor }} className="text-xs font-bold">{i.ind}</Text>
                  <Text className="text-xs text-muted mt-0.5">{i.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Controle de Acesso RBAC"
              subtitle="5 perfis com permissões distintas"
              color="#1565C0"
              sectionKey="rbac"
              expanded={!!expanded.rbac}
              onToggle={toggle}
            >
              {[
                { perfil: "Administrador", perms: "Acesso total · Configurações · Usuários · Auditoria", cor: "#EF9A9A" },
                { perfil: "Técnico", perms: "Diagnósticos · Banco de Conhecimento · Relatórios", cor: "#64B5F6" },
                { perfil: "Laboratório", perms: "Amostras · Laudos · Análises laboratoriais", cor: "#81C784" },
                { perfil: "Parceiro", perms: "Marketplace · Materiais · Dados limitados", cor: "#FFB74D" },
                { perfil: "Auditor", perms: "Logs de auditoria · Relatórios · Somente leitura", cor: "#CE93D8" },
              ].map((p) => (
                <View key={p.perfil} style={{ backgroundColor: p.cor + "15", borderWidth: 1, borderColor: p.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <Text style={{ color: p.cor }} className="text-xs font-bold mb-1">{p.perfil}</Text>
                  <Text className="text-xs text-muted">{p.perms}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Estrutura do Projeto"
              subtitle="apps/web-admin/src/ · 9 diretórios"
              color="#455A64"
              sectionKey="estrutura"
              expanded={!!expanded.estrutura}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4">
                <Text style={{ color: "#B0BEC5" }} className="text-xs font-mono font-bold mb-2">apps/web-admin/src/</Text>
                {[
                  { pasta: "app/", desc: "Rotas Next.js App Router", cor: "#64B5F6" },
                  { pasta: "modules/", desc: "Módulos por domínio (users, diagnósticos...)", cor: "#81C784" },
                  { pasta: "components/", desc: "Componentes UI + gráficos Recharts", cor: "#FFB74D" },
                  { pasta: "hooks/", desc: "React Query + Zustand hooks", cor: "#CE93D8" },
                  { pasta: "services/", desc: "Axios para API NestJS", cor: "#EF9A9A" },
                  { pasta: "store/", desc: "Estado global Zustand", cor: "#80CBC4" },
                  { pasta: "types/", desc: "TypeScript interfaces", cor: "#B0BEC5" },
                  { pasta: "theme/", desc: "Tokens Tailwind · Tema admin escuro", cor: "#FFCC80" },
                ].map((p) => (
                  <View key={p.pasta} className="flex-row items-center mb-1.5">
                    <Text style={{ color: "#555" }} className="text-xs mr-1">├──</Text>
                    <View style={{ backgroundColor: p.cor + "20" }} className="rounded px-1.5 py-0.5 mr-2">
                      <Text style={{ color: p.cor }} className="text-xs font-mono">{p.pasta}</Text>
                    </View>
                    <Text style={{ color: "#888" }} className="text-xs flex-1">{p.desc}</Text>
                  </View>
                ))}
                <View className="flex-row items-center mt-1">
                  <Text style={{ color: "#555" }} className="text-xs mr-1">└──</Text>
                  <Text style={{ color: "#FFD54F" }} className="text-xs font-mono">middleware.ts</Text>
                  <Text style={{ color: "#888" }} className="text-xs ml-2">RBAC + JWT</Text>
                </View>
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── GESTÃO ─── */}
        {activeTab === "gestao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Gestão Operacional</Text>
            <Text className="text-xs text-muted mb-4">
              Usuários · Produtores · Diagnósticos
            </Text>

            <ExpandableSection
              title="Gestão de Usuários"
              subtitle="CRUD completo · 5 campos · 5 ações"
              color="#C62828"
              sectionKey="usuarios"
              expanded={!!expanded.usuarios}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Funcionalidades:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Criar", "Editar", "Bloquear", "Excluir", "Redefinir Senha"].map((f) => (
                  <Tag key={f} label={f} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Campos:</Text>
              {["Nome completo", "E-mail", "Telefone", "Perfil (RBAC)", "Status (Ativo/Bloqueado)"].map((c) => (
                <View key={c} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#FFEBEE", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{c}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Gestão de Produtores"
              subtitle="Dados completos · Filtros por região"
              color="#1B5E20"
              sectionKey="produtores"
              expanded={!!expanded.produtores}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Visualização por Produtor:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Dados cadastrais", "Propriedades", "Culturas", "Diagnósticos", "Relatórios"].map((v) => (
                  <Tag key={v} label={v} color="#1B5E20" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Filtros disponíveis:</Text>
              <View className="flex-row gap-2">
                {[
                  { filtro: "Estado", desc: "Filtrar por UF", cor: "#81C784" },
                  { filtro: "Município", desc: "Filtrar por cidade", cor: "#64B5F6" },
                  { filtro: "Região", desc: "Norte/Sul/etc.", cor: "#FFB74D" },
                ].map((f) => (
                  <View key={f.filtro} style={{ backgroundColor: f.cor + "20", borderWidth: 1, borderColor: f.cor + "40" }} className="flex-1 rounded-xl p-2 items-center">
                    <Text style={{ color: f.cor }} className="text-xs font-bold">{f.filtro}</Text>
                    <Text style={{ color: "#888" }} className="text-xs mt-0.5 text-center">{f.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Gestão de Diagnósticos"
              subtitle="Tabela completa · 4 ações de revisão"
              color="#EF6C00"
              sectionKey="diagnosticos"
              expanded={!!expanded.diagnosticos}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Colunas da Tabela:</Text>
              {["Produtor", "Cultura afetada", "Resultado (doença/praga)", "Confiança da IA (%)", "Status (Pendente/Aprovado/Corrigido)"].map((c) => (
                <View key={c} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#FFF3E0", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{c}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Ações disponíveis:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { acao: "Visualizar", cor: "#64B5F6" },
                  { acao: "Aprovar", cor: "#81C784" },
                  { acao: "Corrigir", cor: "#FFB74D" },
                  { acao: "Encaminhar", cor: "#CE93D8" },
                ].map((a) => (
                  <View key={a.acao} style={{ backgroundColor: a.cor + "20" }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: a.cor }} className="text-xs font-semibold">{a.acao}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── LABORATÓRIO ─── */}
        {activeTab === "laboratorio" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Laboratório & Conhecimento</Text>
            <Text className="text-xs text-muted mb-4">
              Amostras · Laudos · Banco de Conhecimento
            </Text>

            <ExpandableSection
              title="Gestão Laboratorial"
              subtitle="Fluxo 4 etapas · Amostras · Laudos"
              color="#1565C0"
              sectionKey="labFluxo"
              expanded={!!expanded.labFluxo}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Cadastros:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Amostras", "Laudos", "Resultados"].map((c) => (
                  <Tag key={c} label={c} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Fluxo de Análise:</Text>
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4">
                {[
                  { step: "Recebimento", desc: "Registro da amostra + código de rastreio", cor: "#64B5F6" },
                  { step: "Análise", desc: "Processamento laboratorial + registro de dados", cor: "#FFB74D" },
                  { step: "Validação", desc: "Revisão técnica dos resultados", cor: "#81C784" },
                  { step: "Laudo", desc: "Emissão do laudo PDF + notificação ao produtor", cor: "#CE93D8" },
                ].map((s, i) => (
                  <View key={s.step} className="items-start mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderWidth: 1, borderColor: s.cor }} className="rounded-xl px-3 py-2 w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.step}</Text>
                      <Text style={{ color: "#999" }} className="text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 3 && <Text style={{ color: "#555" }} className="text-sm ml-4">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Banco de Conhecimento"
              subtitle="6 módulos · Cadastrar · Editar · Publicar · Arquivar"
              color="#1B5E20"
              sectionKey="bancoConhecimento"
              expanded={!!expanded.bancoConhecimento}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Módulos de Conhecimento:</Text>
              <View className="flex-row flex-wrap mb-3">
                {[
                  { mod: "Culturas", cor: "#81C784" },
                  { mod: "Pragas", cor: "#EF9A9A" },
                  { mod: "Doenças", cor: "#F48FB1" },
                  { mod: "Solos", cor: "#FFCC80" },
                  { mod: "Nutrientes", cor: "#80CBC4" },
                  { mod: "Clima", cor: "#64B5F6" },
                ].map((m) => (
                  <View key={m.mod} style={{ backgroundColor: m.cor + "20", borderWidth: 1, borderColor: m.cor + "40", width: "30%" }} className="rounded-xl p-2 mr-2 mb-2 items-center">
                    <Text style={{ color: m.cor }} className="text-xs font-bold">{m.mod}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Ações de Gestão:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { acao: "Cadastrar", cor: "#81C784" },
                  { acao: "Editar", cor: "#64B5F6" },
                  { acao: "Publicar", cor: "#FFB74D" },
                  { acao: "Arquivar", cor: "#B0BEC5" },
                ].map((a) => (
                  <View key={a.acao} style={{ backgroundColor: a.cor + "20" }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: a.cor }} className="text-xs font-semibold">{a.acao}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── CONTEÚDO ─── */}
        {activeTab === "conteudo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Conteúdo & Infraestrutura</Text>
            <Text className="text-xs text-muted mb-4">
              Materiais · Sensores IoT · Marketplace
            </Text>

            <ExpandableSection
              title="Gestão de Materiais Didáticos"
              subtitle="4 tipos de conteúdo · Categoria · Idioma · Status"
              color="#6A1B9A"
              sectionKey="materiais"
              expanded={!!expanded.materiais}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Tipos de Conteúdo:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Cursos", "Vídeos", "Apostilas", "Áudios"].map((t) => (
                  <Tag key={t} label={t} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Controles de Publicação:</Text>
              <View className="flex-row gap-2">
                {[
                  { ctrl: "Categoria", desc: "Agronomia · Solo · Pragas · etc.", cor: "#CE93D8" },
                  { ctrl: "Idioma", desc: "PT-BR · EN · ES", cor: "#F48FB1" },
                  { ctrl: "Status", desc: "Rascunho · Publicado · Arquivado", cor: "#81C784" },
                ].map((c) => (
                  <View key={c.ctrl} style={{ backgroundColor: c.cor + "20", borderWidth: 1, borderColor: c.cor + "40" }} className="flex-1 rounded-xl p-2 items-center">
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.ctrl}</Text>
                    <Text style={{ color: "#888" }} className="text-xs mt-0.5 text-center">{c.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Gestão de Sensores IoT"
              subtitle="3 estados · 4 tipos de dados"
              color="#00695C"
              sectionKey="sensores"
              expanded={!!expanded.sensores}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Estados dos Sensores:</Text>
              <View className="flex-row gap-2 mb-3">
                {[
                  { estado: "Online", cor: "#81C784" },
                  { estado: "Offline", cor: "#B0BEC5" },
                  { estado: "Falha", cor: "#EF9A9A" },
                ].map((e) => (
                  <View key={e.estado} style={{ backgroundColor: e.cor + "20", borderWidth: 1, borderColor: e.cor + "40" }} className="flex-1 rounded-xl p-2 items-center">
                    <View style={{ backgroundColor: e.cor, width: 8, height: 8 }} className="rounded-full mb-1" />
                    <Text style={{ color: e.cor }} className="text-xs font-bold">{e.estado}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Dados Monitorados:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { dado: "Umidade", cor: "#64B5F6" },
                  { dado: "Temperatura", cor: "#FFB74D" },
                  { dado: "pH do Solo", cor: "#81C784" },
                  { dado: "Irrigação", cor: "#80CBC4" },
                ].map((d) => (
                  <View key={d.dado} style={{ backgroundColor: d.cor + "20", borderWidth: 1, borderColor: d.cor + "40" }} className="rounded-xl px-3 py-2 mr-2 mb-2">
                    <Text style={{ color: d.cor }} className="text-xs font-bold">{d.dado}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Gestão do Marketplace"
              subtitle="4 indicadores · Aprovar · Suspender · Auditar"
              color="#EF6C00"
              sectionKey="marketplace"
              expanded={!!expanded.marketplace}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Indicadores do Marketplace:</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {[
                  { ind: "Produtos", cor: "#81C784" },
                  { ind: "Pedidos", cor: "#64B5F6" },
                  { ind: "Receita", cor: "#FFB74D" },
                  { ind: "Avaliações", cor: "#CE93D8" },
                ].map((i) => (
                  <View key={i.ind} style={{ backgroundColor: i.cor + "20", borderWidth: 1, borderColor: i.cor + "40", width: "47%" }} className="rounded-xl p-3 items-center">
                    <Text style={{ color: i.cor }} className="text-xs font-bold">{i.ind}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Ações Administrativas:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { acao: "Aprovar", cor: "#81C784" },
                  { acao: "Suspender", cor: "#FFB74D" },
                  { acao: "Auditar", cor: "#64B5F6" },
                ].map((a) => (
                  <View key={a.acao} style={{ backgroundColor: a.cor + "20" }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: a.cor }} className="text-xs font-semibold">{a.acao}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── RELATÓRIOS ─── */}
        {activeTab === "relatorios" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Relatórios & Auditoria</Text>
            <Text className="text-xs text-muted mb-4">
              PDF · Excel · CSV · Logs completos
            </Text>

            <ExpandableSection
              title="Relatórios Administrativos"
              subtitle="3 formatos de exportação · 3 filtros"
              color="#1565C0"
              sectionKey="relExport"
              expanded={!!expanded.relExport}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Formatos de Exportação:</Text>
              <View className="flex-row gap-2 mb-3">
                {[
                  { fmt: "PDF", desc: "Relatório formatado", cor: "#EF9A9A" },
                  { fmt: "Excel", desc: "Planilha de dados", cor: "#81C784" },
                  { fmt: "CSV", desc: "Dados brutos", cor: "#64B5F6" },
                ].map((f) => (
                  <View key={f.fmt} style={{ backgroundColor: f.cor + "20", borderWidth: 1, borderColor: f.cor + "40" }} className="flex-1 rounded-xl p-3 items-center">
                    <Text style={{ color: f.cor }} className="text-sm font-bold">{f.fmt}</Text>
                    <Text style={{ color: "#888" }} className="text-xs mt-1 text-center">{f.desc}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Filtros de Relatório:</Text>
              <View className="flex-row flex-wrap">
                {["Período (data inicial/final)", "Região (estado/município)", "Cultura (soja/milho/etc.)"].map((f) => (
                  <View key={f} className="flex-row items-center py-1.5 w-full" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: "#E3F2FD", width: 8, height: 8 }} className="rounded-full mr-3" />
                    <Text className="text-xs text-foreground">{f}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Auditoria do Sistema"
              subtitle="4 tipos de log · Campos completos"
              color="#C62828"
              sectionKey="auditoria"
              expanded={!!expanded.auditoria}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Tipos de Evento Auditado:</Text>
              <View className="flex-row flex-wrap mb-3">
                {[
                  { tipo: "Login", cor: "#64B5F6" },
                  { tipo: "Alterações", cor: "#FFB74D" },
                  { tipo: "Exclusões", cor: "#EF9A9A" },
                  { tipo: "Aprovações", cor: "#81C784" },
                ].map((t) => (
                  <View key={t.tipo} style={{ backgroundColor: t.cor + "20", borderWidth: 1, borderColor: t.cor + "40" }} className="rounded-xl px-3 py-2 mr-2 mb-2">
                    <Text style={{ color: t.cor }} className="text-xs font-bold">{t.tipo}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Campos do Log:</Text>
              {["Usuário (nome + ID)", "IP de origem", "Data e hora (timestamp)", "Ação executada + detalhes"].map((c) => (
                <View key={c} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#FFEBEE", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{c}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── MONITORAMENTO ─── */}
        {activeTab === "monitoramento" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Monitoramento & Status MVP</Text>
            <Text className="text-xs text-muted mb-4">
              5 painéis · 4 notificações · 7 critérios · MVP completo
            </Text>

            <ExpandableSection
              title="Monitoramento Operacional"
              subtitle="5 painéis · 4 indicadores de saúde"
              color="#37474F"
              sectionKey="monitorOp"
              expanded={!!expanded.monitorOp}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Painéis de Monitoramento:</Text>
              {[
                { painel: "API", desc: "Latência, throughput, taxa de erros por endpoint", cor: "#64B5F6" },
                { painel: "Banco de Dados", desc: "Conexões ativas, queries lentas, uso de disco", cor: "#81C784" },
                { painel: "IA", desc: "Tempo de inferência, acurácia, filas de processamento", cor: "#CE93D8" },
                { painel: "Sensores", desc: "Dispositivos online/offline, dados recebidos/hora", cor: "#80CBC4" },
                { painel: "Marketplace", desc: "Transações/hora, erros de pagamento, pedidos pendentes", cor: "#FFB74D" },
              ].map((p) => (
                <View key={p.painel} style={{ borderLeftWidth: 4, borderLeftColor: p.cor, backgroundColor: p.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: p.cor }} className="text-xs font-bold">{p.painel}</Text>
                  <Text className="text-xs text-muted mt-0.5">{p.desc}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Indicadores de Saúde:</Text>
              <View className="flex-row flex-wrap">
                {["Disponibilidade (%)", "Tempo de Resposta (ms)", "Erros (por hora)", "Uso de Recursos (CPU/RAM)"].map((i) => (
                  <Tag key={i} label={i} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Notificações Internas"
              subtitle="4 tipos de alerta administrativo"
              color="#1565C0"
              sectionKey="notificacoes"
              expanded={!!expanded.notificacoes}
              onToggle={toggle}
            >
              {[
                { tipo: "Sistema", desc: "Falhas de servidor, deploys, atualizações críticas", cor: "#EF9A9A" },
                { tipo: "Segurança", desc: "Tentativas de acesso indevido, tokens expirados", cor: "#FFB74D" },
                { tipo: "Operacional", desc: "Diagnósticos pendentes, laudos atrasados", cor: "#64B5F6" },
                { tipo: "Agrícola", desc: "Alertas climáticos, pragas emergentes, surtos", cor: "#81C784" },
              ].map((n) => (
                <View key={n.tipo} style={{ backgroundColor: n.cor + "15", borderWidth: 1, borderColor: n.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <Text style={{ color: n.cor }} className="text-xs font-bold mb-1">{n.tipo}</Text>
                  <Text className="text-xs text-muted">{n.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Critérios de Aceitação"
              subtitle="7 critérios para painel MVP pronto"
              color="#1B5E20"
              sectionKey="criterios"
              expanded={!!expanded.criterios}
              onToggle={toggle}
            >
              {[
                { item: "Dashboard funcional", desc: "KPIs e indicadores em tempo real" },
                { item: "Gestão de usuários", desc: "CRUD completo com RBAC" },
                { item: "Gestão de produtores", desc: "Visualização e filtros por região" },
                { item: "Gestão de diagnósticos", desc: "Tabela com ações de revisão" },
                { item: "Gestão de relatórios", desc: "Exportação PDF/Excel/CSV" },
                { item: "Banco de conhecimento", desc: "6 módulos gerenciáveis" },
                { item: "Auditoria", desc: "Logs completos de todas as ações" },
              ].map((c) => (
                <View key={c.item} className="flex-row items-start py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#E8F5E9", width: 20, height: 20 }} className="rounded items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{c.item}</Text>
                    <Text className="text-xs text-muted">{c.desc}</Text>
                  </View>
                </View>
              ))}

              {/* Status MVP */}
              <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mt-4">
                <Text className="text-white text-sm font-bold mb-2">Status do MVP AFU 1.0</Text>
                {[
                  { comp: "Backend NestJS", ok: true },
                  { comp: "Aplicativo Mobile", ok: true },
                  { comp: "Portal do Produtor", ok: true },
                  { comp: "Painel Administrativo", ok: true },
                ].map((s) => (
                  <View key={s.comp} className="flex-row items-center py-1">
                    <View style={{ backgroundColor: s.ok ? "#81C784" : "#EF9A9A", width: 16, height: 16 }} className="rounded items-center justify-center mr-2">
                      <Text className="text-white text-xs font-bold">{s.ok ? "✓" : "✗"}</Text>
                    </View>
                    <Text style={{ color: "#E8F5E9" }} className="text-xs">{s.comp}</Text>
                  </View>
                ))}
                <View style={{ backgroundColor: "#2E7D32" }} className="rounded-xl p-3 mt-3">
                  <Text className="text-white text-xs font-bold">Próxima Etapa: 28</Text>
                  <Text style={{ color: "#A5D6A7" }} className="text-xs mt-0.5">Deploy Beta · Docker Compose · CI/CD · STAGING · Testes integrados</Text>
                </View>
              </View>
            </ExpandableSection>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
