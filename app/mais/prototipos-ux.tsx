import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "fluxos", label: "Fluxos" },
  { id: "mobile", label: "Mobile" },
  { id: "portal", label: "Portal" },
  { id: "admin", label: "Admin" },
  { id: "responsivo", label: "Responsivo" },
  { id: "entregaveis", label: "Entregáveis" },
];

type SectionKey =
  | "fluxoInicial" | "fluxoDiagnostico" | "fluxoRelatorios"
  | "splash" | "login" | "dashboard" | "diagnostico" | "resultado" | "historico"
  | "portalDash" | "portalMenu" | "propriedades" | "culturas" | "relatoriosPortal"
  | "adminLayout" | "adminKpis" | "adminDiagnosticos" | "adminRelatorios"
  | "resolucoes" | "microinteracoes" | "testesUx" | "entregaveis";

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

/** Mini wireframe de tela mobile */
function MobileWireframe({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View className="items-center mb-4">
      {/* Phone frame */}
      <View
        style={{ borderColor: "#374151", backgroundColor: "#111827", width: 160, borderRadius: 20, borderWidth: 2 }}
        className="overflow-hidden"
      >
        {/* Status bar */}
        <View style={{ backgroundColor: color }} className="h-5 items-center justify-center">
          <Text className="text-white text-xs">9:41</Text>
        </View>
        {/* Screen content */}
        <View className="p-2 min-h-48">{children}</View>
        {/* Home bar */}
        <View className="items-center py-1">
          <View className="w-10 h-1 bg-gray-600 rounded-full" />
        </View>
      </View>
      <Text style={{ color }} className="text-xs font-bold mt-2">{title}</Text>
    </View>
  );
}

export default function PrototiposUxScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("fluxos");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#4A148C" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#6A1B9A" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <IconSymbol name="rectangle.on.rectangle" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Protótipos UX/UI — MVP 1.0</Text>
            <Text style={{ color: "#CE93D8" }} className="text-xs">
              Fluxos · Mobile · Portal · Admin · Responsivo
            </Text>
          </View>
          <View style={{ backgroundColor: "#2E7D32" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 23</Text>
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
                  color: activeTab === tab.id ? "#4A148C" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#4A148C" }} className="h-0.5 rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── FLUXOS ─── */}
        {activeTab === "fluxos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Fluxos Mobile Completos</Text>
            <Text className="text-xs text-muted mb-4">
              3 fluxos principais · Ferramenta: Figma
            </Text>

            {/* Arquivos Figma */}
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-bold mb-2">Arquivos Figma</Text>
              {[
                { arq: "AFU Design System", cor: "#CE93D8" },
                { arq: "AFU Mobile", cor: "#81C784" },
                { arq: "AFU Web Produtor", cor: "#64B5F6" },
                { arq: "AFU Web Admin", cor: "#FFB74D" },
                { arq: "AFU Component Library", cor: "#EF9A9A" },
              ].map((a) => (
                <View key={a.arq} className="flex-row items-center mb-1">
                  <View style={{ backgroundColor: a.cor + "30" }} className="w-2 h-2 rounded-full mr-2" />
                  <Text style={{ color: a.cor }} className="text-xs font-mono">{a.arq}</Text>
                </View>
              ))}
            </View>

            <ExpandableSection
              title="Fluxo Inicial"
              subtitle="Splash → Boas-vindas → Login → Dashboard"
              color="#2E7D32"
              sectionKey="fluxoInicial"
              expanded={!!expanded.fluxoInicial}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { tela: "Splash", desc: "Logo AFU + Planta Saudável + loader · 2s", cor: "#81C784" },
                  { tela: "Boas-vindas", desc: "Apresentação do app + benefícios + CTA", cor: "#A5D6A7" },
                  { tela: "Login", desc: "E-mail/Telefone + Senha + Entrar/Criar Conta", cor: "#66BB6A" },
                  { tela: "Dashboard", desc: "Cards de ações + indicadores rápidos", cor: "#2E7D32" },
                ].map((s, i) => (
                  <View key={s.tela} className="items-center mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderColor: s.cor }} className="rounded-xl px-4 py-2 border w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.tela}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 3 && <Text className="text-gray-500 text-sm">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Fluxo Diagnóstico"
              subtitle="8 etapas · Da captura ao histórico"
              color="#6A1B9A"
              sectionKey="fluxoDiagnostico"
              expanded={!!expanded.fluxoDiagnostico}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { tela: "Dashboard", cor: "#81C784" },
                  { tela: "Diagnóstico", cor: "#CE93D8" },
                  { tela: "Captura Foto", cor: "#CE93D8" },
                  { tela: "Upload", cor: "#CE93D8" },
                  { tela: "Análise IA", cor: "#FFB74D" },
                  { tela: "Resultado", cor: "#EF9A9A" },
                  { tela: "Salvar", cor: "#64B5F6" },
                  { tela: "Histórico", cor: "#80CBC4" },
                ].map((s, i) => (
                  <View key={s.tela} className="items-center mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderColor: s.cor }} className="rounded-xl px-4 py-2 border w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold text-center">{s.tela}</Text>
                    </View>
                    {i < 7 && <Text className="text-gray-500 text-sm">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Fluxo Relatórios"
              subtitle="5 etapas · Do dashboard ao PDF"
              color="#1565C0"
              sectionKey="fluxoRelatorios"
              expanded={!!expanded.fluxoRelatorios}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { tela: "Dashboard", cor: "#81C784" },
                  { tela: "Relatórios", cor: "#64B5F6" },
                  { tela: "Selecionar Relatório", cor: "#64B5F6" },
                  { tela: "Visualizar", cor: "#64B5F6" },
                  { tela: "Baixar PDF", cor: "#EF9A9A" },
                ].map((s, i) => (
                  <View key={s.tela} className="items-center mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderColor: s.cor }} className="rounded-xl px-4 py-2 border w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold text-center">{s.tela}</Text>
                    </View>
                    {i < 4 && <Text className="text-gray-500 text-sm">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── MOBILE ─── */}
        {activeTab === "mobile" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Telas Mobile — Planta Saudável</Text>
            <Text className="text-xs text-muted mb-4">
              6 telas principais · Wireframes de alta fidelidade
            </Text>

            {/* Wireframes visuais */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-4 px-1 py-2">
                {/* Splash */}
                <MobileWireframe title="Splash" color="#2E7D32">
                  <View className="flex-1 items-center justify-center">
                    <View style={{ backgroundColor: "#2E7D32" }} className="w-12 h-12 rounded-2xl items-center justify-center mb-2">
                      <Text className="text-white text-xl">🌿</Text>
                    </View>
                    <Text className="text-white text-xs font-bold">AFU</Text>
                    <Text className="text-gray-400 text-xs">Planta Saudável</Text>
                    <View className="mt-4 flex-row gap-1">
                      {[1,2,3].map((i) => (
                        <View key={i} style={{ backgroundColor: i === 2 ? "#2E7D32" : "#374151" }} className="w-1.5 h-1.5 rounded-full" />
                      ))}
                    </View>
                  </View>
                </MobileWireframe>

                {/* Login */}
                <MobileWireframe title="Login" color="#1565C0">
                  <View className="flex-1 pt-2">
                    <Text className="text-white text-xs font-bold mb-3 text-center">Entrar</Text>
                    <View style={{ backgroundColor: "#1F2937", borderColor: "#374151" }} className="rounded-lg px-2 py-1.5 border mb-2">
                      <Text className="text-gray-500 text-xs">E-mail</Text>
                    </View>
                    <View style={{ backgroundColor: "#1F2937", borderColor: "#374151" }} className="rounded-lg px-2 py-1.5 border mb-3">
                      <Text className="text-gray-500 text-xs">Senha</Text>
                    </View>
                    <View style={{ backgroundColor: "#2E7D32" }} className="rounded-lg py-1.5 items-center mb-2">
                      <Text className="text-white text-xs font-bold">Entrar</Text>
                    </View>
                    <Text className="text-blue-400 text-xs text-center">Criar Conta</Text>
                  </View>
                </MobileWireframe>

                {/* Dashboard */}
                <MobileWireframe title="Dashboard" color="#2E7D32">
                  <View className="flex-1">
                    <Text className="text-white text-xs font-bold mb-2">Olá, João!</Text>
                    <View className="flex-row gap-1 mb-2">
                      {["12", "3", "8"].map((n, i) => (
                        <View key={i} style={{ backgroundColor: "#1F2937" }} className="flex-1 rounded-lg p-1.5 items-center">
                          <Text style={{ color: ["#81C784","#FFB74D","#64B5F6"][i] }} className="text-sm font-bold">{n}</Text>
                          <Text className="text-gray-500 text-xs">{["Diag","Alert","Anal"][i]}</Text>
                        </View>
                      ))}
                    </View>
                    <View className="flex-row flex-wrap gap-1">
                      {["IA","Prop","Cult","Rel"].map((c) => (
                        <View key={c} style={{ backgroundColor: "#1F2937", width: "47%" }} className="rounded-lg p-1.5 items-center">
                          <Text className="text-gray-400 text-xs">{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </MobileWireframe>

                {/* Diagnóstico */}
                <MobileWireframe title="Diagnóstico" color="#6A1B9A">
                  <View className="flex-1">
                    <Text className="text-white text-xs font-bold mb-2">Diagnóstico IA</Text>
                    <View style={{ backgroundColor: "#1F2937", borderColor: "#6A1B9A", borderStyle: "dashed" }} className="rounded-xl h-20 items-center justify-center border mb-2">
                      <Text className="text-gray-500 text-xs">📷 Foto</Text>
                    </View>
                    <View style={{ backgroundColor: "#1F2937", borderColor: "#374151" }} className="rounded-lg px-2 py-1 border mb-1">
                      <Text className="text-gray-500 text-xs">Cultura ▾</Text>
                    </View>
                    <View style={{ backgroundColor: "#1F2937", borderColor: "#374151" }} className="rounded-lg px-2 py-1 border mb-2">
                      <Text className="text-gray-500 text-xs">Parte ▾</Text>
                    </View>
                    <View style={{ backgroundColor: "#6A1B9A" }} className="rounded-lg py-1.5 items-center">
                      <Text className="text-white text-xs font-bold">Analisar</Text>
                    </View>
                  </View>
                </MobileWireframe>

                {/* Resultado */}
                <MobileWireframe title="Resultado" color="#C62828">
                  <View className="flex-1">
                    <View style={{ backgroundColor: "#FFF3E0" }} className="rounded-lg p-2 mb-2 items-center">
                      <Text className="text-orange-600 text-xs font-bold">⚠ Atenção</Text>
                      <Text className="text-orange-500 text-xs">Ferrugem Asiática</Text>
                    </View>
                    <Text className="text-gray-400 text-xs mb-1">Confiança: 87%</Text>
                    <View style={{ backgroundColor: "#1F2937" }} className="rounded h-1.5 mb-2">
                      <View style={{ backgroundColor: "#FFB74D", width: "87%" }} className="h-1.5 rounded" />
                    </View>
                    <Text className="text-gray-500 text-xs mb-2">Recomendações...</Text>
                    <View style={{ backgroundColor: "#2E7D32" }} className="rounded-lg py-1 items-center">
                      <Text className="text-white text-xs">Salvar</Text>
                    </View>
                  </View>
                </MobileWireframe>
              </View>
            </ScrollView>

            {/* Especificações expandíveis */}
            <ExpandableSection
              title="Splash Screen"
              subtitle="Logo · Nome · Loader · 2 segundos"
              color="#2E7D32"
              sectionKey="splash"
              expanded={!!expanded.splash}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Logo AFU centralizado", "Nome Planta Saudável", "Indicador de carregamento", "Duração: 2 segundos", "Fundo verde institucional"].map((c) => (
                  <Tag key={c} label={c} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Login"
              subtitle="E-mail · Telefone · Senha · 3 botões"
              color="#1565C0"
              sectionKey="login"
              expanded={!!expanded.login}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Campos:</Text>
              <View className="flex-row flex-wrap mb-2">
                {["E-mail", "Telefone", "Senha"].map((c) => (
                  <Tag key={c} label={c} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Botões:</Text>
              <View className="flex-row flex-wrap">
                {["Entrar", "Criar Conta", "Recuperar Senha"].map((b) => (
                  <Tag key={b} label={b} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Dashboard"
              subtitle="7 cards de ação · 3 indicadores rápidos"
              color="#2E7D32"
              sectionKey="dashboard"
              expanded={!!expanded.dashboard}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Cards de Ação:</Text>
              <View className="flex-row flex-wrap mb-2">
                {["Diagnóstico IA", "Propriedades", "Culturas", "Relatórios", "Calendário", "Materiais", "Suporte"].map((c) => (
                  <Tag key={c} label={c} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Indicadores Rápidos:</Text>
              <View className="flex-row flex-wrap">
                {["Diagnósticos", "Alertas", "Análises"].map((i) => (
                  <Tag key={i} label={i} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Diagnóstico"
              subtitle="Câmera · Galeria · Seletores · Analisar"
              color="#6A1B9A"
              sectionKey="diagnostico"
              expanded={!!expanded.diagnostico}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Área Principal:</Text>
              <View className="flex-row flex-wrap mb-2">
                {["Capturar Foto", "Escolher da Galeria"].map((a) => (
                  <Tag key={a} label={a} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Seletores:</Text>
              <View className="flex-row flex-wrap mb-2">
                {["Cultura", "Parte da Planta"].map((s) => (
                  <Tag key={s} label={s} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Botão Principal:</Text>
              <View style={{ backgroundColor: "#6A1B9A" }} className="rounded-xl py-2 items-center">
                <Text className="text-white text-xs font-bold">Analisar</Text>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Resultado"
              subtitle="Status · Diagnóstico · Confiança · Recomendações"
              color="#C62828"
              sectionKey="resultado"
              expanded={!!expanded.resultado}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Seções:</Text>
              <View className="flex-row flex-wrap mb-2">
                {[
                  { label: "Saudável", cor: "#2E7D32", bg: "#E8F5E9" },
                  { label: "Atenção", cor: "#EF6C00", bg: "#FFF3E0" },
                  { label: "Crítico", cor: "#C62828", bg: "#FFEBEE" },
                ].map((s) => (
                  <View key={s.label} style={{ backgroundColor: s.bg }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: s.cor }} className="text-xs font-semibold">{s.label}</Text>
                  </View>
                ))}
              </View>
              <View className="flex-row flex-wrap mb-2">
                {["Diagnóstico", "Confiança %", "Recomendações", "Prevenção"].map((s) => (
                  <Tag key={s} label={s} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Botões:</Text>
              <View className="flex-row flex-wrap">
                {["Salvar", "Gerar Relatório", "Compartilhar"].map((b) => (
                  <Tag key={b} label={b} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Histórico"
              subtitle="Filtros · Lista com foto e diagnóstico"
              color="#37474F"
              sectionKey="historico"
              expanded={!!expanded.historico}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Filtros:</Text>
              <View className="flex-row flex-wrap mb-2">
                {["Data", "Cultura", "Gravidade"].map((f) => (
                  <Tag key={f} label={f} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Itens da Lista:</Text>
              <View className="flex-row flex-wrap">
                {["Foto thumbnail", "Diagnóstico", "Data"].map((i) => (
                  <Tag key={i} label={i} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── PORTAL ─── */}
        {activeTab === "portal" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Portal Web do Produtor</Text>
            <Text className="text-xs text-muted mb-4">
              Dashboard · Menu · Propriedades · Culturas · Relatórios
            </Text>

            <ExpandableSection
              title="Dashboard do Produtor"
              subtitle="4 indicadores principais"
              color="#2E7D32"
              sectionKey="portalDash"
              expanded={!!expanded.portalDash}
              onToggle={toggle}
            >
              {/* Mini dashboard web */}
              <View className="bg-gray-900 rounded-xl p-4 mb-3">
                <Text className="text-white text-xs font-bold mb-3">Portal do Produtor</Text>
                <View className="flex-row gap-2 mb-3">
                  {[
                    { label: "Propriedades", val: "3", cor: "#81C784" },
                    { label: "Culturas", val: "7", cor: "#64B5F6" },
                    { label: "Diagnósticos", val: "24", cor: "#CE93D8" },
                    { label: "Relatórios", val: "12", cor: "#FFB74D" },
                  ].map((k) => (
                    <View key={k.label} style={{ backgroundColor: "#1F2937" }} className="flex-1 rounded-xl p-2 items-center">
                      <Text style={{ color: k.cor }} className="text-base font-bold">{k.val}</Text>
                      <Text className="text-gray-500 text-xs text-center">{k.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="flex-row flex-wrap">
                {["Propriedades", "Culturas", "Diagnósticos", "Relatórios"].map((i) => (
                  <Tag key={i} label={i} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Menu de Navegação"
              subtitle="8 itens de menu"
              color="#1565C0"
              sectionKey="portalMenu"
              expanded={!!expanded.portalMenu}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Início", "Propriedades", "Culturas", "Diagnóstico", "Relatórios", "Calendário", "Materiais", "Perfil"].map((m) => (
                  <Tag key={m} label={m} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Propriedades"
              subtitle="Tabela com 4 colunas · 3 ações"
              color="#EF6C00"
              sectionKey="propriedades"
              expanded={!!expanded.propriedades}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-3 mb-3">
                <View className="flex-row mb-2">
                  {["Nome", "Área", "Cidade", "Status"].map((col) => (
                    <Text key={col} className="text-gray-400 text-xs flex-1 font-semibold">{col}</Text>
                  ))}
                </View>
                {["Fazenda São João", "Sítio Verde", "Chácara Boa Vista"].map((p, i) => (
                  <View key={p} className="flex-row py-1.5 border-t border-gray-700">
                    <Text className="text-gray-300 text-xs flex-1">{p}</Text>
                    <Text className="text-gray-400 text-xs flex-1">{["120 ha","45 ha","8 ha"][i]}</Text>
                    <Text className="text-gray-400 text-xs flex-1">{["Sorriso","Sinop","Cuiabá"][i]}</Text>
                    <View style={{ backgroundColor: "#E8F5E9" }} className="rounded px-1">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">Ativo</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View className="flex-row flex-wrap">
                {["Novo", "Editar", "Excluir"].map((a) => (
                  <Tag key={a} label={a} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Culturas"
              subtitle="4 campos principais"
              color="#6A1B9A"
              sectionKey="culturas"
              expanded={!!expanded.culturas}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Nome", "Variedade", "Data de Plantio", "Fase Fenológica"].map((c) => (
                  <Tag key={c} label={c} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Relatórios"
              subtitle="Visualização PDF/HTML · Exportação"
              color="#37474F"
              sectionKey="relatoriosPortal"
              expanded={!!expanded.relatoriosPortal}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Visualização:</Text>
              <View className="flex-row flex-wrap mb-2">
                {["PDF", "HTML"].map((v) => (
                  <Tag key={v} label={v} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Exportação:</Text>
              <View className="flex-row flex-wrap">
                {["PDF", "Excel"].map((e) => (
                  <Tag key={e} label={e} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── ADMIN ─── */}
        {activeTab === "admin" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Painel Administrativo AFU</Text>
            <Text className="text-xs text-muted mb-4">
              Layout · KPIs · Diagnósticos · Relatórios
            </Text>

            <ExpandableSection
              title="Layout do Painel Admin"
              subtitle="Menu lateral · Barra superior · Área central"
              color="#1565C0"
              sectionKey="adminLayout"
              expanded={!!expanded.adminLayout}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-3 mb-3">
                <View className="flex-row gap-2">
                  {/* Sidebar */}
                  <View style={{ backgroundColor: "#1B5E20", width: 50 }} className="rounded-xl p-2">
                    <Text className="text-white text-xs font-bold mb-2 text-center">AFU</Text>
                    {["🏠","📊","👥","🌿","📋","⚙️"].map((ic) => (
                      <Text key={ic} className="text-center text-base mb-2">{ic}</Text>
                    ))}
                  </View>
                  {/* Main */}
                  <View className="flex-1">
                    {/* Top bar */}
                    <View style={{ backgroundColor: "#1F2937" }} className="rounded-xl p-2 mb-2 flex-row items-center justify-between">
                      <Text className="text-gray-400 text-xs">Dashboard</Text>
                      <Text className="text-gray-400 text-xs">Admin ▾</Text>
                    </View>
                    {/* KPIs */}
                    <View className="flex-row gap-1">
                      {["P","D","A"].map((k, i) => (
                        <View key={k} style={{ backgroundColor: "#1F2937" }} className="flex-1 rounded-xl p-2 items-center">
                          <Text style={{ color: ["#81C784","#CE93D8","#64B5F6"][i] }} className="text-sm font-bold">{["142","89","23"][i]}</Text>
                          <Text className="text-gray-500 text-xs">{k}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                {["Menu lateral", "Barra superior", "Área central"].map((l) => (
                  <Tag key={l} label={l} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Dashboard Administrativo — KPIs"
              subtitle="6 KPIs + 4 tipos de gráfico"
              color="#2E7D32"
              sectionKey="adminKpis"
              expanded={!!expanded.adminKpis}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">KPIs:</Text>
              <View className="flex-row flex-wrap mb-3">
                {[
                  { label: "Produtores", cor: "#2E7D32" },
                  { label: "Propriedades", cor: "#1565C0" },
                  { label: "Diagnósticos", cor: "#6A1B9A" },
                  { label: "Análises", cor: "#EF6C00" },
                  { label: "Sensores", cor: "#37474F" },
                  { label: "Receita", cor: "#C62828" },
                ].map((k) => (
                  <View key={k.label} style={{ backgroundColor: k.cor + "15", borderColor: k.cor + "40" }} className="rounded-full px-3 py-1 mr-2 mb-2 border">
                    <Text style={{ color: k.cor }} className="text-xs font-semibold">{k.label}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Gráficos:</Text>
              <View className="flex-row flex-wrap">
                {["Linha", "Barra", "Mapa", "Pizza"].map((g) => (
                  <Tag key={g} label={g} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Diagnósticos Admin"
              subtitle="Tabela · Aprovar · Corrigir"
              color="#6A1B9A"
              sectionKey="adminDiagnosticos"
              expanded={!!expanded.adminDiagnosticos}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-3 mb-3">
                <View className="flex-row mb-2">
                  {["Produtor","Cultura","Diagnóstico","Conf.","Status"].map((col) => (
                    <Text key={col} className="text-gray-400 text-xs flex-1 font-semibold" numberOfLines={1}>{col}</Text>
                  ))}
                </View>
                {["João S.","Maria O.","Pedro L."].map((p, i) => (
                  <View key={p} className="flex-row py-1.5 border-t border-gray-700 items-center">
                    <Text className="text-gray-300 text-xs flex-1" numberOfLines={1}>{p}</Text>
                    <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>{["Soja","Milho","Café"][i]}</Text>
                    <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>{["Ferrug.","Mancha","Broca"][i]}</Text>
                    <Text className="text-gray-400 text-xs flex-1">{["87%","92%","78%"][i]}</Text>
                    <View style={{ backgroundColor: ["#E8F5E9","#FFF3E0","#FFEBEE"][i] }} className="rounded px-1">
                      <Text style={{ color: ["#2E7D32","#EF6C00","#C62828"][i] }} className="text-xs">{["OK","⚠","!"][i]}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View className="flex-row flex-wrap">
                {["Visualizar", "Aprovar", "Corrigir"].map((a) => (
                  <Tag key={a} label={a} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Relatórios Administrativos"
              subtitle="Filtros · Exportação PDF/Excel/CSV"
              color="#C62828"
              sectionKey="adminRelatorios"
              expanded={!!expanded.adminRelatorios}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Filtros:</Text>
              <View className="flex-row flex-wrap mb-2">
                {["Período", "Região", "Cultura"].map((f) => (
                  <Tag key={f} label={f} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Exportação:</Text>
              <View className="flex-row flex-wrap">
                {["PDF", "Excel", "CSV"].map((e) => (
                  <Tag key={e} label={e} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── RESPONSIVO ─── */}
        {activeTab === "responsivo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Protótipos Responsivos</Text>
            <Text className="text-xs text-muted mb-4">
              3 resoluções · Mobile · Tablet · Desktop
            </Text>

            <ExpandableSection
              title="Resoluções Suportadas"
              subtitle="Mobile · Tablet · Desktop"
              color="#1565C0"
              sectionKey="resolucoes"
              expanded={!!expanded.resolucoes}
              onToggle={toggle}
            >
              <View className="gap-3">
                {[
                  { device: "Mobile", res: "390 × 844", desc: "iPhone 14 Pro · Android padrão · App Planta Saudável", cor: "#2E7D32", icon: "📱" },
                  { device: "Tablet", res: "768 × 1024", desc: "iPad · Android tablet · Portal do Produtor adaptado", cor: "#1565C0", icon: "📋" },
                  { device: "Desktop", res: "1440 × 900", desc: "Laptop · Monitor · Web Admin e Portal completos", cor: "#6A1B9A", icon: "🖥️" },
                ].map((d) => (
                  <View key={d.device} style={{ borderColor: d.cor + "40", backgroundColor: d.cor + "10" }} className="rounded-xl p-4 border flex-row items-start">
                    <Text className="text-2xl mr-3">{d.icon}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text style={{ color: d.cor }} className="text-sm font-bold">{d.device}</Text>
                        <View style={{ backgroundColor: d.cor + "20" }} className="rounded px-2 py-0.5">
                          <Text style={{ color: d.cor }} className="text-xs font-mono">{d.res}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted">{d.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            {/* Comparativo visual */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3 text-center">Comparativo de Layouts</Text>
              <View className="flex-row items-end gap-2 justify-center">
                {/* Mobile */}
                <View className="items-center">
                  <View style={{ backgroundColor: "#1F2937", borderColor: "#374151", width: 40, height: 72, borderRadius: 6, borderWidth: 1 }} className="mb-1">
                    <View style={{ backgroundColor: "#2E7D32" }} className="h-3 rounded-t" />
                    <View className="p-1">
                      <View style={{ backgroundColor: "#374151" }} className="h-2 rounded mb-1" />
                      <View style={{ backgroundColor: "#374151" }} className="h-2 rounded mb-1" />
                      <View style={{ backgroundColor: "#374151" }} className="h-2 rounded" />
                    </View>
                  </View>
                  <Text className="text-gray-400 text-xs">390px</Text>
                </View>
                {/* Tablet */}
                <View className="items-center">
                  <View style={{ backgroundColor: "#1F2937", borderColor: "#374151", width: 64, height: 88, borderRadius: 6, borderWidth: 1 }} className="mb-1">
                    <View style={{ backgroundColor: "#1565C0" }} className="h-3 rounded-t" />
                    <View className="flex-row p-1 gap-1">
                      <View style={{ backgroundColor: "#374151", width: 16 }} className="rounded" />
                      <View className="flex-1">
                        <View style={{ backgroundColor: "#374151" }} className="h-2 rounded mb-1" />
                        <View style={{ backgroundColor: "#374151" }} className="h-2 rounded mb-1" />
                        <View style={{ backgroundColor: "#374151" }} className="h-2 rounded" />
                      </View>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-xs">768px</Text>
                </View>
                {/* Desktop */}
                <View className="items-center">
                  <View style={{ backgroundColor: "#1F2937", borderColor: "#374151", width: 100, height: 64, borderRadius: 6, borderWidth: 1 }} className="mb-1">
                    <View style={{ backgroundColor: "#6A1B9A" }} className="h-3 rounded-t" />
                    <View className="flex-row p-1 gap-1">
                      <View style={{ backgroundColor: "#374151", width: 20 }} className="rounded" />
                      <View className="flex-1">
                        <View className="flex-row gap-1 mb-1">
                          {[1,2,3,4].map((i) => (
                            <View key={i} style={{ backgroundColor: "#374151" }} className="flex-1 h-6 rounded" />
                          ))}
                        </View>
                        <View style={{ backgroundColor: "#374151" }} className="h-2 rounded" />
                      </View>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-xs">1440px</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── ENTREGÁVEIS ─── */}
        {activeTab === "entregaveis" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Entregáveis & Qualidade</Text>
            <Text className="text-xs text-muted mb-4">
              Microinterações · Testes UX · Biblioteca · Arquivos finais
            </Text>

            <ExpandableSection
              title="Microinterações"
              subtitle="5 animações · 150ms a 300ms"
              color="#6A1B9A"
              sectionKey="microinteracoes"
              expanded={!!expanded.microinteracoes}
              onToggle={toggle}
            >
              {[
                { anim: "Carregamento", desc: "Spinner suave · Skeleton loading · 200ms", cor: "#64B5F6" },
                { anim: "Sucesso", desc: "Check animado · Verde · Haptic feedback · 250ms", cor: "#81C784" },
                { anim: "Erro", desc: "Shake sutil · Vermelho · Vibração · 150ms", cor: "#EF9A9A" },
                { anim: "Upload", desc: "Barra de progresso · Percentual · 300ms", cor: "#FFB74D" },
                { anim: "Diagnóstico", desc: "Pulse no ícone IA · Análise em andamento · 300ms", cor: "#CE93D8" },
              ].map((a) => (
                <View key={a.anim} className="flex-row items-start mb-3">
                  <View style={{ backgroundColor: a.cor + "30", borderColor: a.cor }} className="rounded-full w-8 h-8 items-center justify-center border mr-3">
                    <Text style={{ color: a.cor }} className="text-xs font-bold">▶</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-foreground">{a.anim}</Text>
                    <Text className="text-xs text-muted">{a.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Testes de UX"
              subtitle="Produtores · Técnicos · Cooperativas"
              color="#2E7D32"
              sectionKey="testesUx"
              expanded={!!expanded.testesUx}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Validação com:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Produtores rurais", "Técnicos agrícolas", "Cooperativas"].map((v) => (
                  <Tag key={v} label={v} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Métricas de Sucesso:</Text>
              {[
                { metrica: "Tempo para concluir tarefa", meta: "< 3 minutos para diagnóstico completo" },
                { metrica: "Facilidade de uso", meta: "Score ≥ 4.0/5.0 (SUS)" },
                { metrica: "Satisfação", meta: "NPS ≥ 50" },
                { metrica: "Taxa de erro", meta: "< 10% nas tarefas principais" },
              ].map((m) => (
                <View key={m.metrica} className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-xs text-muted flex-1">{m.metrica}</Text>
                  <Text className="text-xs font-semibold text-foreground text-right flex-1">{m.meta}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Arquivos Finais Entregues"
              subtitle="5 arquivos Figma"
              color="#37474F"
              sectionKey="entregaveis"
              expanded={!!expanded.entregaveis}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { arq: "Protótipo Mobile", cor: "#2E7D32", bg: "#E8F5E9" },
                  { arq: "Protótipo Web Produtor", cor: "#1565C0", bg: "#E3F2FD" },
                  { arq: "Protótipo Web Admin", cor: "#6A1B9A", bg: "#F3E5F5" },
                  { arq: "Biblioteca UI", cor: "#EF6C00", bg: "#FFF3E0" },
                  { arq: "Fluxos Navegáveis", cor: "#C62828", bg: "#FFEBEE" },
                ].map((a) => (
                  <View key={a.arq} style={{ backgroundColor: a.bg }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: a.cor }} className="text-xs font-semibold">{a.arq}</Text>
                  </View>
                ))}
              </View>
              <View style={{ backgroundColor: "#4A148C" }} className="rounded-xl p-4 mt-3">
                <Text className="text-white text-xs font-bold mb-2">Resultado da Etapa 23</Text>
                <Text style={{ color: "#CE93D8" }} className="text-xs leading-5">
                  O AFU passa a possuir a especificação completa das interfaces e da experiência do usuário, permitindo iniciar a implementação visual sem ambiguidades.
                </Text>
              </View>
            </ExpandableSection>

            {/* Próxima etapa */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-2">Próxima Etapa — 24</Text>
              <Text style={{ color: "#A5D6A7" }} className="text-xs leading-5">
                Implementação Backend NestJS Real: módulos, autenticação JWT, Prisma, PostgreSQL, APIs REST, upload de imagens, geração de relatórios e integração inicial com IA.
              </Text>
            </View>
          </View>
        )}
        <AfuMvpFooter etapaNum={23} />
      </ScrollView>
    </ScreenContainer>
  );
}
