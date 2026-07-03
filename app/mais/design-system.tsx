import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "marca", label: "Marca" },
  { id: "cores", label: "Cores" },
  { id: "tipografia", label: "Tipografia" },
  { id: "componentes", label: "Componentes" },
  { id: "ux", label: "UX/UI" },
  { id: "biblioteca", label: "Biblioteca" },
];

type SectionKey =
  | "institucional" | "operacional" | "conceito" | "logotipo"
  | "paleta" | "status"
  | "fontes" | "pesos" | "escala" | "grid"
  | "botoes" | "inputs" | "cards" | "outros"
  | "dashboard" | "mobile" | "acessibilidade" | "telas"
  | "pacote" | "temas" | "prototipo";

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

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg }} className="rounded-full px-3 py-1 mr-2 mb-2">
      <Text style={{ color }} className="text-xs font-semibold">{label}</Text>
    </View>
  );
}

const PALETA = [
  { nome: "Verde Institucional", hex: "#2E7D32", uso: "Ações positivas · Agricultura · Botões principais", textColor: "#FFFFFF" },
  { nome: "Verde Claro", hex: "#66BB6A", uso: "Indicadores saudáveis · Status OK", textColor: "#FFFFFF" },
  { nome: "Azul Tecnológico", hex: "#1565C0", uso: "IA · Gráficos · Dashboards", textColor: "#FFFFFF" },
  { nome: "Laranja Atenção", hex: "#EF6C00", uso: "Alertas · Avisos importantes", textColor: "#FFFFFF" },
  { nome: "Vermelho Crítico", hex: "#C62828", uso: "Problemas graves · Erros críticos", textColor: "#FFFFFF" },
  { nome: "Cinza Neutro", hex: "#ECEFF1", uso: "Fundos · Bordas · Superfícies", textColor: "#37474F" },
  { nome: "Branco", hex: "#FFFFFF", uso: "Fundo principal · Textos sobre escuro", textColor: "#37474F", border: true },
];

export default function DesignSystemScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("marca");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#2E7D32" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <IconSymbol name="paintbrush.fill" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Design System AFU</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Marca · Cores · Tipografia · Componentes · UX/UI
            </Text>
          </View>
          <View style={{ backgroundColor: "#1565C0" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 22</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-surface border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
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
                <View style={{ backgroundColor: "#1B5E20" }} className="h-0.5 rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── MARCA ─── */}
        {activeTab === "marca" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Arquitetura de Marca</Text>
            <Text className="text-xs text-muted mb-4">
              Marca institucional · Marca operacional · Conceito visual
            </Text>

            <ExpandableSection
              title="AFU — Marca Institucional"
              subtitle="Analisador Fitotécnico Universal"
              color="#2E7D32"
              sectionKey="institucional"
              expanded={!!expanded.institucional}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-5 mb-4 items-center">
                <Text className="text-white text-3xl font-bold tracking-widest">AFU</Text>
                <Text style={{ color: "#A5D6A7" }} className="text-xs mt-1 text-center">
                  Analisador Fitotécnico Universal
                </Text>
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Representa:</Text>
              <View className="flex-row flex-wrap">
                {["Ciência", "Tecnologia", "Agricultura", "Sustentabilidade", "Inteligência Artificial"].map((v) => (
                  <Tag key={v} label={v} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Planta Saudável — Marca Operacional"
              subtitle="App de uso diário do produtor"
              color="#66BB6A"
              sectionKey="operacional"
              expanded={!!expanded.operacional}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#E8F5E9", borderColor: "#66BB6A" }} className="rounded-xl p-5 mb-4 items-center border-2">
                <View className="flex-row items-center gap-2">
                  <View style={{ backgroundColor: "#2E7D32" }} className="w-8 h-8 rounded-full items-center justify-center">
                    <Text className="text-white text-base">🌿</Text>
                  </View>
                  <Text style={{ color: "#1B5E20" }} className="text-xl font-bold">Planta Saudável</Text>
                </View>
                <Text style={{ color: "#388E3C" }} className="text-xs mt-1">by AFU</Text>
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Representa:</Text>
              <View className="flex-row flex-wrap">
                {["Diagnóstico", "Cuidado", "Simplicidade", "Uso diário do produtor"].map((v) => (
                  <Tag key={v} label={v} color="#388E3C" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Conceito Visual"
              subtitle="5 elementos simbólicos da identidade"
              color="#1565C0"
              sectionKey="conceito"
              expanded={!!expanded.conceito}
              onToggle={toggle}
            >
              {[
                { elem: "Planta", simb: "🌱", sig: "Vida · Crescimento · Natureza", cor: "#2E7D32" },
                { elem: "Folha", simb: "🍃", sig: "Agricultura · Campo · Cultivo", cor: "#66BB6A" },
                { elem: "Circuito", simb: "⚡", sig: "Tecnologia · Conectividade · Inovação", cor: "#1565C0" },
                { elem: "Gráfico", simb: "📊", sig: "Análise · Dados · Inteligência", cor: "#EF6C00" },
                { elem: "Gota d'água", simb: "💧", sig: "Sustentabilidade · Irrigação · Recursos", cor: "#0277BD" },
              ].map((e) => (
                <View key={e.elem} className="flex-row items-center mb-3">
                  <View
                    style={{ backgroundColor: e.cor + "20" }}
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  >
                    <Text className="text-lg">{e.simb}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: e.cor }} className="text-xs font-bold">{e.elem}</Text>
                    <Text className="text-xs text-muted">{e.sig}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Logotipo — Estrutura"
              subtitle="Símbolo + Texto + Subtexto"
              color="#37474F"
              sectionKey="logotipo"
              expanded={!!expanded.logotipo}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-5 mb-3">
                <View className="items-center">
                  <View style={{ backgroundColor: "#2E7D32" }} className="w-14 h-14 rounded-2xl items-center justify-center mb-3">
                    <Text className="text-white text-2xl">🌿</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold tracking-widest">AFU</Text>
                  <Text style={{ color: "#A5D6A7" }} className="text-xs mt-1">
                    Analisador Fitotécnico Universal
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                {[
                  { parte: "Símbolo", desc: "Folha + Circuito + Dados", cor: "#2E7D32" },
                  { parte: "Texto", desc: "AFU — Bold, tracking wide", cor: "#1565C0" },
                  { parte: "Subtexto", desc: "Nome completo — Regular", cor: "#37474F" },
                ].map((p) => (
                  <View key={p.parte} style={{ backgroundColor: p.cor + "15", borderColor: p.cor + "40" }} className="flex-1 rounded-xl p-2 border">
                    <Text style={{ color: p.cor }} className="text-xs font-bold">{p.parte}</Text>
                    <Text className="text-xs text-muted mt-0.5">{p.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── CORES ─── */}
        {activeTab === "cores" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Paleta de Cores Oficial</Text>
            <Text className="text-xs text-muted mb-4">
              7 cores · Sistema de status · Uso por contexto
            </Text>

            <ExpandableSection
              title="Paleta Principal"
              subtitle="7 cores oficiais do AFU"
              color="#2E7D32"
              sectionKey="paleta"
              expanded={!!expanded.paleta}
              onToggle={toggle}
            >
              {PALETA.map((cor) => (
                <View key={cor.nome} className="mb-3">
                  <View className="flex-row items-center mb-1">
                    <View
                      style={{
                        backgroundColor: cor.hex,
                        borderWidth: cor.border ? 1 : 0,
                        borderColor: "#E5E7EB",
                      }}
                      className="w-12 h-12 rounded-xl mr-3"
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-bold text-foreground">{cor.nome}</Text>
                        <View style={{ backgroundColor: "#F5F5F5" }} className="rounded px-2 py-0.5">
                          <Text className="text-xs font-mono text-muted">{cor.hex}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted mt-0.5">{cor.uso}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Sistema de Status"
              subtitle="4 estados visuais padronizados"
              color="#1565C0"
              sectionKey="status"
              expanded={!!expanded.status}
              onToggle={toggle}
            >
              {[
                { estado: "Sucesso", cor: "#2E7D32", bg: "#E8F5E9", desc: "Operação concluída · Diagnóstico saudável · Aprovado", icone: "✓" },
                { estado: "Informação", cor: "#1565C0", bg: "#E3F2FD", desc: "Dados informativos · Notificações · Dicas de uso", icone: "ℹ" },
                { estado: "Atenção", cor: "#EF6C00", bg: "#FFF3E0", desc: "Alertas · Pragas detectadas · Ação recomendada", icone: "!" },
                { estado: "Erro", cor: "#C62828", bg: "#FFEBEE", desc: "Falhas críticas · Doença grave · Ação urgente", icone: "✕" },
              ].map((s) => (
                <View key={s.estado} style={{ backgroundColor: s.bg, borderColor: s.cor + "40" }} className="rounded-xl p-3 mb-2 border flex-row items-start">
                  <View style={{ backgroundColor: s.cor }} className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: "#FFFFFF" }} className="text-xs font-bold">{s.icone}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.estado}</Text>
                    <Text className="text-xs text-muted mt-0.5">{s.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            {/* Paleta visual rápida */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3">Paleta Visual</Text>
              <View className="flex-row gap-2">
                {PALETA.map((c) => (
                  <View key={c.hex} className="flex-1 items-center">
                    <View
                      style={{ backgroundColor: c.hex, borderWidth: c.border ? 1 : 0, borderColor: "#555" }}
                      className="w-full h-10 rounded-lg mb-1"
                    />
                    <Text className="text-gray-400 text-xs text-center" numberOfLines={1}>
                      {c.hex}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── TIPOGRAFIA ─── */}
        {activeTab === "tipografia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Sistema Tipográfico</Text>
            <Text className="text-xs text-muted mb-4">
              Inter + Roboto · 4 pesos · Escala de tamanhos
            </Text>

            <ExpandableSection
              title="Fontes Oficiais"
              subtitle="Inter (principal) · Roboto (secundária)"
              color="#2E7D32"
              sectionKey="fontes"
              expanded={!!expanded.fontes}
              onToggle={toggle}
            >
              <View className="mb-4">
                <View style={{ backgroundColor: "#E8F5E9" }} className="rounded-xl p-4 mb-3">
                  <Text style={{ color: "#2E7D32" }} className="text-xs font-bold mb-1">Inter — Fonte Principal</Text>
                  <Text className="text-foreground text-2xl font-bold">Aa Bb Cc</Text>
                  <Text className="text-foreground text-base">ABCDEFGHIJKLMNOPQRSTUVWXYZ</Text>
                  <Text className="text-muted text-sm">abcdefghijklmnopqrstuvwxyz</Text>
                  <Text className="text-muted text-xs mt-1">
                    Usada em títulos, botões, labels, UI em geral
                  </Text>
                </View>
                <View style={{ backgroundColor: "#E3F2FD" }} className="rounded-xl p-4">
                  <Text style={{ color: "#1565C0" }} className="text-xs font-bold mb-1">Roboto — Fonte Secundária</Text>
                  <Text className="text-foreground text-2xl">Aa Bb Cc</Text>
                  <Text className="text-foreground text-base">ABCDEFGHIJKLMNOPQRSTUVWXYZ</Text>
                  <Text className="text-muted text-sm">abcdefghijklmnopqrstuvwxyz</Text>
                  <Text className="text-muted text-xs mt-1">
                    Usada em textos longos, descrições, relatórios
                  </Text>
                </View>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Pesos Tipográficos"
              subtitle="Regular · Medium · SemiBold · Bold"
              color="#1565C0"
              sectionKey="pesos"
              expanded={!!expanded.pesos}
              onToggle={toggle}
            >
              {[
                { peso: "Regular", valor: "400", uso: "Textos corridos, descrições, parágrafos" },
                { peso: "Medium", valor: "500", uso: "Labels, subtítulos, textos de apoio" },
                { peso: "SemiBold", valor: "600", uso: "Títulos secundários, destaques, badges" },
                { peso: "Bold", valor: "700", uso: "Títulos principais, botões, KPIs" },
              ].map((p) => (
                <View key={p.peso} className="flex-row items-center py-3 border-b border-gray-100">
                  <View className="w-24">
                    <Text
                      style={{ fontWeight: p.valor as any }}
                      className="text-foreground text-base"
                    >
                      {p.peso}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: "#F5F5F5" }} className="rounded px-2 py-0.5 mr-3">
                    <Text className="text-xs font-mono text-muted">{p.valor}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{p.uso}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Escala de Tamanhos"
              subtitle="Mobile-first · 6 tamanhos"
              color="#EF6C00"
              sectionKey="escala"
              expanded={!!expanded.escala}
              onToggle={toggle}
            >
              {[
                { nome: "xs", px: "12px", uso: "Legendas, badges, labels pequenos" },
                { nome: "sm", px: "14px", uso: "Textos secundários, subtítulos" },
                { nome: "base", px: "16px", uso: "Texto padrão, parágrafos" },
                { nome: "lg", px: "18px", uso: "Títulos de seção, subtítulos" },
                { nome: "xl", px: "20px", uso: "Títulos de tela" },
                { nome: "2xl", px: "24px", uso: "Títulos principais, KPIs" },
              ].map((t) => (
                <View key={t.nome} className="flex-row items-center py-2 border-b border-gray-100">
                  <View style={{ backgroundColor: "#FFF3E0" }} className="rounded px-2 py-0.5 w-12 mr-3">
                    <Text style={{ color: "#EF6C00" }} className="text-xs font-mono font-bold">{t.nome}</Text>
                  </View>
                  <Text className="text-xs text-muted w-12">{t.px}</Text>
                  <Text className="text-xs text-muted flex-1">{t.uso}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Grid & Espaçamento"
              subtitle="Mobile: 4-32px · Web: 12 colunas"
              color="#37474F"
              sectionKey="grid"
              expanded={!!expanded.grid}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Mobile — Espaçamento:</Text>
              <View className="flex-row gap-2 mb-4">
                {[
                  { val: "4px", w: 4 },
                  { val: "8px", w: 8 },
                  { val: "16px", w: 16 },
                  { val: "24px", w: 24 },
                  { val: "32px", w: 32 },
                ].map((s) => (
                  <View key={s.val} className="items-center">
                    <View
                      style={{ backgroundColor: "#2E7D32", width: s.w, height: s.w }}
                      className="rounded mb-1"
                    />
                    <Text className="text-xs text-muted">{s.val}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Web — Grid:</Text>
              <View className="flex-row gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <View
                    key={i}
                    style={{ backgroundColor: "#1565C0" + "30", borderColor: "#1565C0" + "60" }}
                    className="flex-1 h-6 rounded border items-center justify-center"
                  >
                    <Text style={{ color: "#1565C0" }} className="text-xs">{i + 1}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs text-muted mt-1 text-center">12 colunas · Web Admin e Portal</Text>
            </ExpandableSection>
          </View>
        )}

        {/* ─── COMPONENTES ─── */}
        {activeTab === "componentes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Componentes Base</Text>
            <Text className="text-xs text-muted mb-4">
              Botões · Inputs · Cards · Modais · Tabelas
            </Text>

            <ExpandableSection
              title="Botões"
              subtitle="4 variantes · Primário · Secundário · Alerta · Perigo"
              color="#2E7D32"
              sectionKey="botoes"
              expanded={!!expanded.botoes}
              onToggle={toggle}
            >
              <View className="gap-3">
                {[
                  { label: "Primário — Verde AFU", bg: "#2E7D32", text: "#FFFFFF", desc: "Ação principal, confirmação, salvar" },
                  { label: "Secundário — Azul", bg: "#1565C0", text: "#FFFFFF", desc: "Ação secundária, navegação, info" },
                  { label: "Alerta — Laranja", bg: "#EF6C00", text: "#FFFFFF", desc: "Ação de atenção, aviso, moderado" },
                  { label: "Perigo — Vermelho", bg: "#C62828", text: "#FFFFFF", desc: "Exclusão, ação irreversível, crítico" },
                  { label: "Outline — Borda Verde", bg: "transparent", text: "#2E7D32", desc: "Ação terciária, cancelar, voltar", border: "#2E7D32" },
                ].map((b) => (
                  <View key={b.label} className="mb-2">
                    <View
                      style={{
                        backgroundColor: b.bg,
                        borderColor: b.border ?? "transparent",
                        borderWidth: b.border ? 1.5 : 0,
                      }}
                      className="rounded-xl px-4 py-3 items-center mb-1"
                    >
                      <Text style={{ color: b.text }} className="text-sm font-semibold">{b.label}</Text>
                    </View>
                    <Text className="text-xs text-muted text-center">{b.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Inputs"
              subtitle="6 tipos · Texto · Número · E-mail · Telefone · Senha · Data"
              color="#1565C0"
              sectionKey="inputs"
              expanded={!!expanded.inputs}
              onToggle={toggle}
            >
              <View className="gap-2">
                {[
                  { tipo: "Texto", placeholder: "Ex: Nome da propriedade", icon: "T" },
                  { tipo: "Número", placeholder: "Ex: 120 (hectares)", icon: "#" },
                  { tipo: "E-mail", placeholder: "Ex: produtor@email.com", icon: "@" },
                  { tipo: "Telefone", placeholder: "Ex: (65) 99999-0000", icon: "☎" },
                  { tipo: "Senha", placeholder: "••••••••", icon: "🔒" },
                  { tipo: "Data", placeholder: "Ex: 15/10/2025", icon: "📅" },
                ].map((inp) => (
                  <View key={inp.tipo} className="mb-2">
                    <Text className="text-xs font-semibold text-foreground mb-1">{inp.tipo}</Text>
                    <View
                      style={{ borderColor: "#E5E7EB" }}
                      className="flex-row items-center border rounded-xl px-3 py-3 bg-white"
                    >
                      <Text className="text-base mr-2">{inp.icon}</Text>
                      <Text className="text-muted text-sm flex-1">{inp.placeholder}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Cards"
              subtitle="Dashboard · Relatórios · Propriedades · Culturas"
              color="#EF6C00"
              sectionKey="cards"
              expanded={!!expanded.cards}
              onToggle={toggle}
            >
              {/* Card de KPI */}
              <Text className="text-xs font-semibold text-foreground mb-2">Card de KPI:</Text>
              <View style={{ backgroundColor: "#E8F5E9", borderColor: "#2E7D32" + "40" }} className="rounded-xl p-4 mb-3 border">
                <Text className="text-xs text-muted">Propriedades Ativas</Text>
                <Text style={{ color: "#2E7D32" }} className="text-3xl font-bold mt-1">24</Text>
                <Text className="text-xs text-muted mt-1">↑ 3 este mês</Text>
              </View>
              {/* Card de item */}
              <Text className="text-xs font-semibold text-foreground mb-2">Card de Item:</Text>
              <View style={{ borderColor: "#E5E7EB" }} className="rounded-xl p-4 mb-3 border bg-white">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-bold text-foreground">Soja — TMG 7062 IPRO</Text>
                  <View style={{ backgroundColor: "#E8F5E9" }} className="rounded-full px-2 py-0.5">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">Saudável</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted">120 ha · Plantio: 15/10/2025</Text>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Outros Componentes"
              subtitle="Tabelas · Modais · Badges · Ícones"
              color="#37474F"
              sectionKey="outros"
              expanded={!!expanded.outros}
              onToggle={toggle}
            >
              {/* Badges */}
              <Text className="text-xs font-semibold text-foreground mb-2">Badges de Status:</Text>
              <View className="flex-row flex-wrap mb-3">
                {[
                  { label: "Saudável", cor: "#2E7D32", bg: "#E8F5E9" },
                  { label: "Atenção", cor: "#EF6C00", bg: "#FFF3E0" },
                  { label: "Crítico", cor: "#C62828", bg: "#FFEBEE" },
                  { label: "Processando", cor: "#1565C0", bg: "#E3F2FD" },
                ].map((b) => (
                  <View key={b.label} style={{ backgroundColor: b.bg }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: b.cor }} className="text-xs font-semibold">{b.label}</Text>
                  </View>
                ))}
              </View>
              {/* Ícones Lucide */}
              <Text className="text-xs font-semibold text-foreground mb-2">Ícones Lucide:</Text>
              <View className="flex-row flex-wrap">
                {["🌿 Leaf", "💧 Droplet", "📷 Camera", "📊 BarChart", "🗺️ Map", "🧠 Brain", "🎓 GraduationCap", "🏪 Store"].map((ic) => (
                  <View key={ic} style={{ backgroundColor: "#F5F5F5" }} className="rounded-lg px-2 py-1.5 mr-2 mb-2">
                    <Text className="text-xs text-muted">{ic}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── UX/UI ─── */}
        {activeTab === "ux" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Diretrizes UX/UI</Text>
            <Text className="text-xs text-muted mb-4">
              Dashboard · Mobile · Acessibilidade · Telas prioritárias
            </Text>

            <ExpandableSection
              title="Dashboard UX — Princípios"
              subtitle="4 princípios de usabilidade"
              color="#2E7D32"
              sectionKey="dashboard"
              expanded={!!expanded.dashboard}
              onToggle={toggle}
            >
              {[
                { princ: "Poucos cliques", desc: "Máximo 3 cliques para qualquer ação principal", icon: "👆" },
                { princ: "Leitura rápida", desc: "KPIs visíveis acima do fold, sem scroll para dados críticos", icon: "👁️" },
                { princ: "Foco em indicadores", desc: "Números grandes, cores claras, sem ruído visual", icon: "📊" },
                { princ: "Uso em campo", desc: "Funciona com luvas, sol forte, conexão lenta", icon: "🌾" },
              ].map((p) => (
                <View key={p.princ} className="flex-row items-start mb-3">
                  <Text className="text-xl mr-3 mt-0.5">{p.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-foreground">{p.princ}</Text>
                    <Text className="text-xs text-muted">{p.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Mobile UX — Regras"
              subtitle="5 regras para uso em campo"
              color="#1565C0"
              sectionKey="mobile"
              expanded={!!expanded.mobile}
              onToggle={toggle}
            >
              {[
                { regra: "Botões grandes", desc: "Mínimo 48px de altura · Fácil de tocar com luvas ou dedos grossos", cor: "#2E7D32" },
                { regra: "Pouca digitação", desc: "Preferir seleção, câmera e voz a formulários longos", cor: "#1565C0" },
                { regra: "Navegação simples", desc: "Tab bar visível · Máximo 5 abas · Hierarquia clara", cor: "#EF6C00" },
                { regra: "Modo offline", desc: "Funcionar sem internet · Sincronizar quando conectar", cor: "#6A1B9A" },
                { regra: "Alto contraste", desc: "Legível sob sol forte · WCAG AA mínimo", cor: "#C62828" },
              ].map((r) => (
                <View key={r.regra} style={{ borderLeftColor: r.cor, backgroundColor: r.cor + "10" }} className="border-l-4 rounded-r-xl p-3 mb-2">
                  <Text style={{ color: r.cor }} className="text-xs font-bold">{r.regra}</Text>
                  <Text className="text-xs text-muted mt-0.5">{r.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Acessibilidade"
              subtitle="WCAG · Leitores de tela · Alto contraste"
              color="#37474F"
              sectionKey="acessibilidade"
              expanded={!!expanded.acessibilidade}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { item: "WCAG 2.1 AA", desc: "Contraste mínimo 4.5:1" },
                  { item: "Leitores de tela", desc: "VoiceOver (iOS) · TalkBack (Android)" },
                  { item: "Navegação por teclado", desc: "Tab order lógico · Focus visível" },
                  { item: "Contraste elevado", desc: "Modo de alto contraste disponível" },
                ].map((a) => (
                  <View key={a.item} className="w-full mb-3">
                    <Text className="text-xs font-bold text-foreground">{a.item}</Text>
                    <Text className="text-xs text-muted">{a.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Telas Prioritárias"
              subtitle="Mobile (5 telas) · Web (4 telas)"
              color="#EF6C00"
              sectionKey="telas"
              expanded={!!expanded.telas}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Mobile — Planta Saudável:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Login", "Dashboard", "Diagnóstico", "Resultado", "Histórico"].map((t) => (
                  <Tag key={t} label={t} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Web — Admin & Portal:</Text>
              <View className="flex-row flex-wrap">
                {["Dashboard", "Produtores", "Diagnósticos", "Relatórios"].map((t) => (
                  <Tag key={t} label={t} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── BIBLIOTECA ─── */}
        {activeTab === "biblioteca" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Biblioteca de Componentes</Text>
            <Text className="text-xs text-muted mb-4">
              packages/ui · 10 componentes · Temas · Figma
            </Text>

            <ExpandableSection
              title="Pacote packages/ui"
              subtitle="10 componentes compartilhados"
              color="#2E7D32"
              sectionKey="pacote"
              expanded={!!expanded.pacote}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4 mb-3">
                <Text className="text-green-400 text-xs font-mono font-bold mb-2">packages/ui/</Text>
                {[
                  { comp: "Button", desc: "4 variantes + loading + disabled" },
                  { comp: "Input", desc: "6 tipos + validação + erro" },
                  { comp: "Select", desc: "Dropdown + busca + multi-select" },
                  { comp: "Modal", desc: "Confirmação + edição + alertas" },
                  { comp: "Card", desc: "KPI + item + diagnóstico + relatório" },
                  { comp: "Table", desc: "Sortable + paginação + filtros" },
                  { comp: "Badge", desc: "Status + categoria + contador" },
                  { comp: "Avatar", desc: "Foto + iniciais + placeholder" },
                  { comp: "Chart", desc: "Linha + barra + pizza + área" },
                  { comp: "FileUpload", desc: "Drag & drop + câmera + validação" },
                ].map((c) => (
                  <View key={c.comp} className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: "#2E7D3230", borderColor: "#81C784" }} className="rounded px-2 py-0.5 border mr-3 w-24">
                      <Text style={{ color: "#81C784" }} className="text-xs font-mono">{c.comp}</Text>
                    </View>
                    <Text className="text-gray-400 text-xs flex-1">{c.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Temas — Claro e Escuro"
              subtitle="Suporte completo em Web e Mobile"
              color="#1565C0"
              sectionKey="temas"
              expanded={!!expanded.temas}
              onToggle={toggle}
            >
              <View className="flex-row gap-3">
                <View style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }} className="flex-1 rounded-xl p-4 border">
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-bold mb-2">☀️ Tema Claro</Text>
                  <Text className="text-xs text-gray-600">Padrão inicial</Text>
                  <View style={{ backgroundColor: "#2E7D32" }} className="rounded-lg px-3 py-2 mt-2">
                    <Text className="text-white text-xs font-semibold text-center">Botão</Text>
                  </View>
                  <View style={{ backgroundColor: "#F5F5F5", borderColor: "#E5E7EB" }} className="rounded-lg px-3 py-2 mt-2 border">
                    <Text className="text-gray-400 text-xs">Input de texto</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: "#151718", borderColor: "#334155" }} className="flex-1 rounded-xl p-4 border">
                  <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold mb-2">🌙 Tema Escuro</Text>
                  <Text className="text-xs text-gray-400">Web e Mobile</Text>
                  <View style={{ backgroundColor: "#2E7D32" }} className="rounded-lg px-3 py-2 mt-2">
                    <Text className="text-white text-xs font-semibold text-center">Botão</Text>
                  </View>
                  <View style={{ backgroundColor: "#1e2022", borderColor: "#334155" }} className="rounded-lg px-3 py-2 mt-2 border">
                    <Text className="text-gray-500 text-xs">Input de texto</Text>
                  </View>
                </View>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Protótipos — Figma"
              subtitle="Wireframes · Protótipos navegáveis · Design System"
              color="#37474F"
              sectionKey="prototipo"
              expanded={!!expanded.prototipo}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#F5F5F5" }} className="rounded-xl p-4 mb-3">
                <Text className="text-xs font-bold text-foreground mb-2">Ferramenta: Figma</Text>
                <Text className="text-xs text-muted mb-3">
                  Todos os protótipos e o design system serão criados no Figma, com componentes reutilizáveis e tokens sincronizados com o código.
                </Text>
                <Text className="text-xs font-semibold text-foreground mb-2">Entregáveis:</Text>
                <View className="flex-row flex-wrap">
                  {["Wireframes", "Protótipos navegáveis", "Design System", "Biblioteca de componentes"].map((e) => (
                    <Tag key={e} label={e} color="#37474F" bg="#ECEFF1" />
                  ))}
                </View>
              </View>
              <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
                <Text className="text-white text-xs font-bold mb-2">Resultado da Etapa 22</Text>
                <Text style={{ color: "#A5D6A7" }} className="text-xs leading-5">
                  O AFU passa a possuir uma identidade visual oficial, design system padronizado, biblioteca de componentes e diretrizes UX/UI para todas as aplicações do ecossistema.
                </Text>
              </View>
            </ExpandableSection>

            {/* Identidade visual complementar */}
            <Text className="text-sm font-bold text-foreground mt-2 mb-3">
              Identidade Visual Complementar
            </Text>
            <View className="flex-row gap-3">
              <View style={{ backgroundColor: "#E8F5E9" }} className="flex-1 rounded-xl p-3">
                <Text style={{ color: "#2E7D32" }} className="text-xs font-bold mb-2">Ilustrações</Text>
                {["Agricultura", "Sensores IoT", "Inteligência Artificial", "Sustentabilidade"].map((i) => (
                  <Text key={i} className="text-xs text-muted mb-1">• {i}</Text>
                ))}
              </View>
              <View style={{ backgroundColor: "#E3F2FD" }} className="flex-1 rounded-xl p-3">
                <Text style={{ color: "#1565C0" }} className="text-xs font-bold mb-2">Fotografias</Text>
                {["Produtores", "Culturas", "Laboratórios", "Tecnologia rural"].map((f) => (
                  <Text key={f} className="text-xs text-muted mb-1">• {f}</Text>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
