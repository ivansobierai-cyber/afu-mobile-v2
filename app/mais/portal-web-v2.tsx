import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "tecnologia", label: "Tecnologia" },
  { id: "rotas", label: "Rotas" },
  { id: "funcionalidades", label: "Funcionalidades" },
  { id: "conteudo", label: "Conteúdo" },
  { id: "componentes", label: "Componentes" },
  { id: "seguranca", label: "Segurança" },
];

type SectionKey =
  | "stackFrontend" | "estrutura"
  | "rotasAuth" | "rotasApp"
  | "dashboard" | "propriedades" | "culturas" | "diagnosticoIA" | "resultado"
  | "relatorios" | "calendario" | "materiais" | "perfil"
  | "pkgUi" | "responsividade" | "pwa"
  | "segImpl" | "criterios";

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

export default function PortalWebV2Screen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("tecnologia");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#1565C0" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <Text className="text-white text-xl">🌐</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Portal Web do Produtor AFU</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Next.js 15 · React · TypeScript · Tailwind CSS
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 26</Text>
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
                  color: activeTab === tab.id ? "#0D47A1" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#0D47A1", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── TECNOLOGIA ─── */}
        {activeTab === "tecnologia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Stack Tecnológica</Text>
            <Text className="text-xs text-muted mb-4">
              Next.js 15 · React · TypeScript · Tailwind · Zustand · Axios
            </Text>

            <ExpandableSection
              title="Frontend Stack"
              subtitle="4 categorias de tecnologia"
              color="#0D47A1"
              sectionKey="stackFrontend"
              expanded={!!expanded.stackFrontend}
              onToggle={toggle}
            >
              {[
                { cat: "Frontend", items: ["Next.js 15", "React", "TypeScript", "Tailwind CSS"], cor: "#64B5F6" },
                { cat: "Estado", items: ["React Query", "Zustand"], cor: "#CE93D8" },
                { cat: "Formulários", items: ["React Hook Form", "Zod"], cor: "#F48FB1" },
                { cat: "Comunicação", items: ["Axios"], cor: "#FFB74D" },
              ].map((s) => (
                <View key={s.cat} className="mb-3">
                  <Text style={{ color: s.cor }} className="text-xs font-bold mb-1.5">{s.cat}</Text>
                  <View className="flex-row flex-wrap">
                    {s.items.map((item) => (
                      <Tag key={item} label={item} color={s.cor} bg={s.cor + "20"} />
                    ))}
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Estrutura do Projeto"
              subtitle="apps/web-produtor/src/ · 10 diretórios"
              color="#1565C0"
              sectionKey="estrutura"
              expanded={!!expanded.estrutura}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4">
                <Text style={{ color: "#64B5F6" }} className="text-xs font-mono font-bold mb-2">apps/web-produtor/src/</Text>
                {[
                  { pasta: "app/", desc: "Rotas Next.js App Router · Pages · Layouts", cor: "#64B5F6" },
                  { pasta: "components/", desc: "Componentes UI reutilizáveis", cor: "#CE93D8" },
                  { pasta: "modules/", desc: "Módulos de domínio (auth, dashboard, etc.)", cor: "#81C784" },
                  { pasta: "hooks/", desc: "Custom hooks React Query + Zustand", cor: "#FFB74D" },
                  { pasta: "services/", desc: "Chamadas Axios à API NestJS", cor: "#80CBC4" },
                  { pasta: "store/", desc: "Zustand stores globais", cor: "#EF9A9A" },
                  { pasta: "types/", desc: "TypeScript interfaces e tipos", cor: "#B0BEC5" },
                  { pasta: "theme/", desc: "Tokens Tailwind · Cores AFU", cor: "#FFCC80" },
                  { pasta: "utils/", desc: "Funções utilitárias e helpers", cor: "#90CAF9" },
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
                  <Text style={{ color: "#888" }} className="text-xs ml-2">Proteção de rotas JWT</Text>
                </View>
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── ROTAS ─── */}
        {activeTab === "rotas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Rotas do Portal</Text>
            <Text className="text-xs text-muted mb-4">
              13 rotas · Auth · Dashboard · CRUD · Diagnóstico
            </Text>

            <ExpandableSection
              title="Rotas de Autenticação"
              subtitle="Login · Cadastro · Middleware de proteção"
              color="#C62828"
              sectionKey="rotasAuth"
              expanded={!!expanded.rotasAuth}
              onToggle={toggle}
            >
              {["/login", "/register"].map((r) => (
                <View key={r} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <Text className="text-xs font-mono text-foreground flex-1">{r}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Integração API:</Text>
              {[
                { method: "POST", path: "/auth/login", cor: "#81C784" },
                { method: "POST", path: "/auth/register", cor: "#81C784" },
                { method: "POST", path: "/auth/refresh", cor: "#FFB74D" },
              ].map((r) => (
                <View key={r.path} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: r.cor + "20", width: 56 }} className="rounded px-2 py-0.5 mr-3 items-center">
                    <Text style={{ color: r.cor }} className="text-xs font-bold">{r.method}</Text>
                  </View>
                  <Text className="text-xs font-mono text-foreground">{r.path}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Sessão:</Text>
              <View className="flex-row flex-wrap">
                {["JWT", "Refresh Token", "Middleware"].map((t) => (
                  <Tag key={t} label={t} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Rotas da Aplicação"
              subtitle="11 rotas protegidas pelo middleware"
              color="#0D47A1"
              sectionKey="rotasApp"
              expanded={!!expanded.rotasApp}
              onToggle={toggle}
            >
              {[
                { path: "/dashboard", desc: "Painel principal com cards e indicadores", cor: "#64B5F6" },
                { path: "/propriedades", desc: "Lista de propriedades rurais", cor: "#81C784" },
                { path: "/propriedades/novo", desc: "Formulário de nova propriedade", cor: "#A5D6A7" },
                { path: "/culturas", desc: "Lista de culturas cadastradas", cor: "#FFB74D" },
                { path: "/culturas/nova", desc: "Formulário de nova cultura", cor: "#FFCC80" },
                { path: "/diagnosticos", desc: "Histórico de diagnósticos IA", cor: "#EF9A9A" },
                { path: "/diagnosticos/[id]", desc: "Detalhe do diagnóstico + resultado", cor: "#F48FB1" },
                { path: "/relatorios", desc: "Relatórios PDF e Excel", cor: "#80CBC4" },
                { path: "/calendario", desc: "Calendário agrícola de eventos", cor: "#CE93D8" },
                { path: "/materiais", desc: "Biblioteca de materiais didáticos", cor: "#B0BEC5" },
                { path: "/perfil", desc: "Dados do produtor e configurações", cor: "#90CAF9" },
              ].map((r) => (
                <View key={r.path} style={{ borderLeftWidth: 4, borderLeftColor: r.cor, backgroundColor: r.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: r.cor }} className="text-xs font-mono font-bold">{r.path}</Text>
                  <Text className="text-xs text-muted mt-0.5">{r.desc}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── FUNCIONALIDADES ─── */}
        {activeTab === "funcionalidades" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Funcionalidades Principais</Text>
            <Text className="text-xs text-muted mb-4">
              Dashboard · Propriedades · Culturas · Diagnóstico IA
            </Text>

            <ExpandableSection
              title="Dashboard Principal"
              subtitle="4 cards + 3 indicadores"
              color="#0D47A1"
              sectionKey="dashboard"
              expanded={!!expanded.dashboard}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Cards de Resumo:</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {["Propriedades", "Culturas", "Diagnósticos", "Relatórios"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#0D47A120", borderWidth: 1, borderColor: "#0D47A140" }} className="rounded-xl px-3 py-2 flex-1">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-semibold text-center">{c}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Indicadores:</Text>
              <View className="flex-row flex-wrap">
                {["Diagnósticos recentes", "Alertas", "Próximas atividades"].map((i) => (
                  <Tag key={i} label={i} color="#0D47A1" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Gestão de Propriedades"
              subtitle="CRUD completo · 5 campos"
              color="#1B5E20"
              sectionKey="propriedades"
              expanded={!!expanded.propriedades}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Funcionalidades:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Criar", "Editar", "Excluir", "Visualizar"].map((f) => (
                  <Tag key={f} label={f} color="#1B5E20" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Campos do Formulário:</Text>
              {["Nome", "Área (ha)", "Localização (Cidade/Estado)", "Tipo de Solo", "Sistema de Irrigação"].map((c) => (
                <View key={c} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#E8F5E9", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{c}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Gestão de Culturas"
              subtitle="Cadastrar · Editar · Remover · 5 campos"
              color="#EF6C00"
              sectionKey="culturas"
              expanded={!!expanded.culturas}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Campos do Formulário:</Text>
              {["Nome da Cultura", "Variedade / Cultivar", "Data de Plantio", "Área Cultivada (ha)", "Fase Fenológica"].map((c) => (
                <View key={c} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#FFF3E0", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{c}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Funções:</Text>
              <View className="flex-row flex-wrap">
                {["Cadastrar", "Editar", "Remover"].map((f) => (
                  <Tag key={f} label={f} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Diagnóstico IA"
              subtitle="Upload → Processamento → Resultado → Histórico"
              color="#C62828"
              sectionKey="diagnosticoIA"
              expanded={!!expanded.diagnosticoIA}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
                {[
                  { step: "Upload", desc: "Arrastar ou selecionar imagem (JPG/PNG/WEBP)", cor: "#F48FB1" },
                  { step: "Processamento", desc: "Envio ao backend · POST /diagnostics/image", cor: "#FFB74D" },
                  { step: "Resultado", desc: "Diagnóstico + Gravidade + Confiança + Recomendações", cor: "#81C784" },
                  { step: "Histórico", desc: "Salvo em /diagnosticos com link para detalhe", cor: "#64B5F6" },
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
              <Text className="text-xs font-semibold text-foreground mb-2">Formatos aceitos:</Text>
              <View className="flex-row flex-wrap">
                {["JPG", "PNG", "WEBP"].map((f) => (
                  <Tag key={f} label={f} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela de Resultado"
              subtitle="Diagnóstico · Gravidade · Confiança · Recomendações"
              color="#6A1B9A"
              sectionKey="resultado"
              expanded={!!expanded.resultado}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Informações exibidas:</Text>
              {["Imagem enviada", "Diagnóstico (doença/praga identificada)", "Gravidade (Baixa/Média/Alta/Crítica)", "Confiança da IA (%)", "Recomendações de tratamento"].map((i) => (
                <View key={i} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#F3E5F5", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{i}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Botões de Ação:</Text>
              <View className="flex-row flex-wrap">
                {["Relatório", "Compartilhar"].map((b) => (
                  <Tag key={b} label={b} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── CONTEÚDO ─── */}
        {activeTab === "conteudo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Conteúdo & Módulos</Text>
            <Text className="text-xs text-muted mb-4">
              Relatórios · Calendário · Materiais · Perfil
            </Text>

            <ExpandableSection
              title="Relatórios"
              subtitle="4 tipos · PDF e Excel"
              color="#2E7D32"
              sectionKey="relatorios"
              expanded={!!expanded.relatorios}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Tipos de Relatório:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Diagnóstico", "Solo", "Água", "Culturas"].map((t) => (
                  <Tag key={t} label={t} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Exportação:</Text>
              <View className="flex-row gap-2">
                {[
                  { fmt: "PDF", desc: "Relatório formatado para impressão", cor: "#EF9A9A" },
                  { fmt: "Excel", desc: "Dados tabulares para análise", cor: "#81C784" },
                ].map((f) => (
                  <View key={f.fmt} style={{ backgroundColor: f.cor + "20", borderWidth: 1, borderColor: f.cor + "40" }} className="flex-1 rounded-xl p-3 items-center">
                    <Text style={{ color: f.cor }} className="text-sm font-bold">{f.fmt}</Text>
                    <Text style={{ color: "#888" }} className="text-xs mt-1 text-center">{f.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Calendário Agrícola"
              subtitle="5 tipos de eventos · Integração Google Calendar (futuro)"
              color="#1565C0"
              sectionKey="calendario"
              expanded={!!expanded.calendario}
              onToggle={toggle}
            >
              {[
                { ev: "Irrigação", desc: "Agendamento de irrigação por setor", cor: "#64B5F6" },
                { ev: "Adubação", desc: "Aplicação de fertilizantes e corretivos", cor: "#81C784" },
                { ev: "Poda", desc: "Poda de formação e produção", cor: "#FFB74D" },
                { ev: "Pulverização", desc: "Defensivos agrícolas e biológicos", cor: "#EF9A9A" },
                { ev: "Colheita", desc: "Data prevista e realizada de colheita", cor: "#CE93D8" },
              ].map((e) => (
                <View key={e.ev} style={{ borderLeftWidth: 4, borderLeftColor: e.cor, backgroundColor: e.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: e.cor }} className="text-xs font-bold">{e.ev}</Text>
                  <Text className="text-xs text-muted mt-0.5">{e.desc}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: "#E3F2FD" }} className="rounded-xl p-3 mt-2">
                <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">Google Calendar</Text>
                <Text className="text-xs text-muted mt-0.5">Integração opcional em versões futuras</Text>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Materiais Didáticos"
              subtitle="Vídeos · PDF · Guias · Checklists · Online/Offline"
              color="#37474F"
              sectionKey="materiais"
              expanded={!!expanded.materiais}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Tipos de Material:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Vídeos", "PDF", "Guias", "Checklists"].map((m) => (
                  <Tag key={m} label={m} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Modo de Acesso:</Text>
              <View className="flex-row gap-2">
                {[
                  { modo: "Online", desc: "Streaming direto", cor: "#64B5F6" },
                  { modo: "Offline (PWA)", desc: "Cache local", cor: "#81C784" },
                ].map((m) => (
                  <View key={m.modo} style={{ backgroundColor: m.cor + "20", borderWidth: 1, borderColor: m.cor + "40" }} className="flex-1 rounded-xl p-3 items-center">
                    <Text style={{ color: m.cor }} className="text-xs font-bold">{m.modo}</Text>
                    <Text style={{ color: "#888" }} className="text-xs mt-1">{m.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Perfil do Produtor"
              subtitle="Dados pessoais · Configurações · Segurança"
              color="#EF6C00"
              sectionKey="perfil"
              expanded={!!expanded.perfil}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Campos do Perfil:</Text>
              {["Nome completo", "Telefone / WhatsApp", "E-mail", "Região / Estado"].map((c) => (
                <View key={c} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#FFF3E0", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{c}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Configurações:</Text>
              <View className="flex-row flex-wrap">
                {["Notificações", "Idioma", "Segurança"].map((c) => (
                  <Tag key={c} label={c} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── COMPONENTES ─── */}
        {activeTab === "componentes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Componentes & Responsividade</Text>
            <Text className="text-xs text-muted mb-4">
              packages/ui · 3 breakpoints · PWA
            </Text>

            <ExpandableSection
              title="Biblioteca packages/ui"
              subtitle="7 componentes reutilizáveis"
              color="#0D47A1"
              sectionKey="pkgUi"
              expanded={!!expanded.pkgUi}
              onToggle={toggle}
            >
              <View className="gap-2">
                {[
                  { comp: "Button", desc: "Primary · Secondary · Danger · Loading · Disabled", cor: "#64B5F6" },
                  { comp: "Input", desc: "Text · Password · Email · Select · Textarea", cor: "#81C784" },
                  { comp: "Card", desc: "Dashboard · Propriedade · Cultura · Diagnóstico", cor: "#FFB74D" },
                  { comp: "Table", desc: "Sortable · Filterable · Paginada · Exportável", cor: "#CE93D8" },
                  { comp: "Modal", desc: "Confirmação · Formulário · Alerta · Drawer", cor: "#EF9A9A" },
                  { comp: "Badge", desc: "Status · Gravidade · Tipo · Notificação", cor: "#80CBC4" },
                  { comp: "Pagination", desc: "Navegação entre páginas de listas", cor: "#F48FB1" },
                ].map((c) => (
                  <View key={c.comp} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "40" }} className="rounded-xl p-3 flex-row items-start">
                    <View style={{ backgroundColor: c.cor + "30" }} className="rounded px-2 py-0.5 mr-3">
                      <Text style={{ color: c.cor }} className="text-xs font-bold">{c.comp}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{c.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Responsividade"
              subtitle="3 breakpoints · Mobile · Tablet · Desktop"
              color="#1B5E20"
              sectionKey="responsividade"
              expanded={!!expanded.responsividade}
              onToggle={toggle}
            >
              <View className="gap-2">
                {[
                  { res: "Mobile", px: "390px", desc: "Layout em coluna única · Menu hamburguer · Cards empilhados", cor: "#81C784" },
                  { res: "Tablet", px: "768px", desc: "Layout 2 colunas · Sidebar recolhível · Tabelas compactas", cor: "#64B5F6" },
                  { res: "Desktop", px: "1440px", desc: "Layout 3 colunas · Sidebar fixa · Tabelas completas · Gráficos", cor: "#CE93D8" },
                ].map((r) => (
                  <View key={r.res} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "40" }} className="rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <Text style={{ color: r.cor }} className="text-xs font-bold mr-2">{r.res}</Text>
                      <View style={{ backgroundColor: r.cor + "30" }} className="rounded px-2 py-0.5">
                        <Text style={{ color: r.cor }} className="text-xs font-mono">{r.px}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted">{r.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="PWA — Progressive Web App"
              subtitle="Instalação · Cache · Offline · Notificações"
              color="#6A1B9A"
              sectionKey="pwa"
              expanded={!!expanded.pwa}
              onToggle={toggle}
            >
              <View className="gap-2">
                {[
                  { func: "Instalação", desc: "Adicionar à tela inicial no Android e iOS", cor: "#CE93D8" },
                  { func: "Cache", desc: "Service Worker cacheia assets e dados", cor: "#F48FB1" },
                  { func: "Offline parcial", desc: "Histórico e materiais disponíveis sem internet", cor: "#81C784" },
                  { func: "Notificações", desc: "Push notifications via Web Push API", cor: "#64B5F6" },
                ].map((f) => (
                  <View key={f.func} style={{ borderLeftWidth: 4, borderLeftColor: f.cor, backgroundColor: f.cor + "10" }} className="rounded-r-xl p-3">
                    <Text style={{ color: f.cor }} className="text-xs font-bold">{f.func}</Text>
                    <Text className="text-xs text-muted mt-0.5">{f.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── SEGURANÇA ─── */}
        {activeTab === "seguranca" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Segurança & Critérios</Text>
            <Text className="text-xs text-muted mb-4">
              JWT · HTTPS · Validação · Sanitização · 7 Critérios
            </Text>

            <ExpandableSection
              title="Implementações de Segurança"
              subtitle="5 camadas de proteção"
              color="#C62828"
              sectionKey="segImpl"
              expanded={!!expanded.segImpl}
              onToggle={toggle}
            >
              {[
                { seg: "JWT", desc: "Access Token 15min + Refresh Token 7d · Middleware de proteção de rotas", cor: "#EF9A9A" },
                { seg: "HTTPS", desc: "TLS 1.3 obrigatório em produção · Certificado SSL/TLS", cor: "#FFB74D" },
                { seg: "Validação", desc: "Zod + React Hook Form · Validação client-side e server-side", cor: "#81C784" },
                { seg: "Sanitização", desc: "DOMPurify para inputs HTML · Prevenção XSS", cor: "#64B5F6" },
                { seg: "Controle de Sessão", desc: "Logout automático por inatividade · Revogação de tokens", cor: "#CE93D8" },
              ].map((s) => (
                <View key={s.seg} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <Text style={{ color: s.cor }} className="text-xs font-bold mb-1">{s.seg}</Text>
                  <Text className="text-xs text-muted">{s.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Critérios de Aceitação"
              subtitle="7 critérios para portal MVP pronto"
              color="#1B5E20"
              sectionKey="criterios"
              expanded={!!expanded.criterios}
              onToggle={toggle}
            >
              {[
                { item: "Login funcional", desc: "Autenticação JWT com redirect correto" },
                { item: "Dashboard funcional", desc: "Cards e indicadores carregando via API" },
                { item: "CRUD propriedades", desc: "Criar, editar, excluir e visualizar" },
                { item: "CRUD culturas", desc: "Cadastro completo com variedades" },
                { item: "Upload diagnóstico", desc: "Imagem enviada e resultado exibido" },
                { item: "Visualização relatórios", desc: "PDF e Excel gerados e baixados" },
                { item: "Perfil funcional", desc: "Dados editáveis e configurações salvas" },
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
              <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mt-3">
                <Text className="text-white text-xs font-bold mb-1">Resultado da Etapa 26</Text>
                <Text style={{ color: "#90CAF9" }} className="text-xs leading-5">
                  O Portal Web do Produtor AFU possui sua especificação completa de implementação e está pronto para desenvolvimento em Next.js 15.
                </Text>
              </View>
            </ExpandableSection>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
