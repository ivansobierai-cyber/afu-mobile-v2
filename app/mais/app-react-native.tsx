import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "tecnologia", label: "Tecnologia" },
  { id: "navegacao", label: "Navegação" },
  { id: "telas", label: "Telas" },
  { id: "recursos", label: "Recursos" },
  { id: "componentes", label: "Componentes" },
  { id: "build", label: "Build" },
];

type SectionKey =
  | "estrutura" | "stackBase" | "instalacao"
  | "authStack" | "appStack" | "fluxoPrincipal"
  | "telaLogin" | "telaDashboard" | "telaDiagnostico" | "telaResultado" | "telaHistorico"
  | "camera" | "notificacoes" | "offline" | "secureStore"
  | "pkgUi" | "tema" | "testes"
  | "buildAndroid" | "buildIos" | "criterios";

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

function ScreenCard({
  name,
  fields,
  api,
  color,
}: {
  name: string;
  fields: string[];
  api?: string;
  color: string;
}) {
  return (
    <View
      style={{ borderColor: color + "40", backgroundColor: "#1F2937" }}
      className="rounded-xl border p-3 mb-3"
    >
      {/* Phone frame top */}
      <View className="flex-row items-center justify-between mb-2">
        <View style={{ backgroundColor: color + "30" }} className="rounded px-2 py-0.5">
          <Text style={{ color }} className="text-xs font-bold">{name}</Text>
        </View>
        {api && (
          <View style={{ backgroundColor: "#374151" }} className="rounded px-2 py-0.5">
            <Text className="text-gray-400 text-xs font-mono">{api}</Text>
          </View>
        )}
      </View>
      <View className="flex-row flex-wrap gap-1">
        {fields.map((f) => (
          <View key={f} style={{ backgroundColor: color + "15" }} className="rounded-lg px-2 py-1">
            <Text style={{ color }} className="text-xs">{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AppReactNativeScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("tecnologia");
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
            <IconSymbol name="leaf.fill" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">App Planta Saudável AFU</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              React Native · Expo · TypeScript · Android / iOS
            </Text>
          </View>
          <View style={{ backgroundColor: "#0D47A1" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 25</Text>
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
        <AfuStackBanner note="App entregue com Expo Router + tRPC (não Axios→NestJS). Pasta services/ no plano antigo." />

        {/* ─── TECNOLOGIA ─── */}
        {activeTab === "tecnologia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Stack Tecnológica</Text>
            <Text className="text-xs text-muted mb-4">
              React Native · Expo · TypeScript · Zustand · Axios
            </Text>

            <ExpandableSection
              title="Stack Base"
              subtitle="6 categorias de tecnologia"
              color="#1B5E20"
              sectionKey="stackBase"
              expanded={!!expanded.stackBase}
              onToggle={toggle}
            >
              {[
                { cat: "Base", items: ["React Native", "Expo", "TypeScript"], cor: "#81C784" },
                { cat: "Navegação", items: ["React Navigation", "Expo Router"], cor: "#64B5F6" },
                { cat: "Estado Global", items: ["Zustand"], cor: "#CE93D8" },
                { cat: "Comunicação API", items: ["Axios", "React Query"], cor: "#FFB74D" },
                { cat: "Formulários", items: ["React Hook Form", "Zod"], cor: "#F48FB1" },
                { cat: "Recursos Nativos", items: ["Expo Camera", "Expo ImagePicker", "Expo Notifications", "Expo Location", "Expo SecureStore"], cor: "#80CBC4" },
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
              subtitle="apps/mobile/src/ · 12 diretórios"
              color="#1565C0"
              sectionKey="estrutura"
              expanded={!!expanded.estrutura}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-green-400 text-xs font-mono font-bold mb-2">apps/mobile/src/</Text>
                {[
                  { pasta: "assets/", desc: "Imagens, fontes, ícones", cor: "#F48FB1" },
                  { pasta: "components/", desc: "Componentes reutilizáveis", cor: "#CE93D8" },
                  { pasta: "screens/", desc: "Telas da aplicação", cor: "#81C784" },
                  { pasta: "navigation/", desc: "Stacks e Tab Navigator", cor: "#64B5F6" },
                  { pasta: "services/", desc: "Chamadas à API NestJS", cor: "#FFB74D" },
                  { pasta: "hooks/", desc: "Custom hooks React", cor: "#80CBC4" },
                  { pasta: "store/", desc: "Zustand stores", cor: "#EF9A9A" },
                  { pasta: "types/", desc: "TypeScript interfaces", cor: "#B0BEC5" },
                  { pasta: "theme/", desc: "Cores, tipografia, espaçamento", cor: "#FFCC80" },
                  { pasta: "utils/", desc: "Funções utilitárias", cor: "#90CAF9" },
                  { pasta: "constants/", desc: "Constantes globais", cor: "#A5D6A7" },
                  { pasta: "contexts/", desc: "React Contexts", cor: "#F8BBD0" },
                ].map((p) => (
                  <View key={p.pasta} className="flex-row items-center mb-1.5">
                    <Text className="text-gray-500 text-xs mr-1">├──</Text>
                    <View style={{ backgroundColor: p.cor + "20" }} className="rounded px-1.5 py-0.5 mr-2">
                      <Text style={{ color: p.cor }} className="text-xs font-mono">{p.pasta}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs flex-1">{p.desc}</Text>
                  </View>
                ))}
                <View className="flex-row items-center mt-1">
                  <Text className="text-gray-500 text-xs mr-1">└──</Text>
                  <Text className="text-yellow-400 text-xs font-mono">App.tsx</Text>
                </View>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Configuração Inicial"
              subtitle="Criar projeto Expo + instalar dependências"
              color="#EF6C00"
              sectionKey="instalacao"
              expanded={!!expanded.instalacao}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-gray-500 text-xs font-mono mb-2"># Criar projeto</Text>
                <Text className="text-gray-300 text-xs font-mono">npx create-expo-app planta-saudavel</Text>
                <Text className="text-gray-300 text-xs font-mono">cd planta-saudavel</Text>
                <Text className="text-gray-300 text-xs font-mono mb-3">npm install</Text>
                <Text className="text-gray-500 text-xs font-mono mb-1"># Dependências principais</Text>
                {[
                  "@react-navigation/native",
                  "zustand",
                  "axios @tanstack/react-query",
                  "react-hook-form zod",
                  "expo-camera expo-image-picker",
                  "expo-notifications expo-location",
                  "expo-secure-store",
                ].map((dep) => (
                  <View key={dep} className="flex-row items-center mb-1">
                    <Text className="text-green-400 text-xs mr-1">$</Text>
                    <Text className="text-gray-300 text-xs font-mono">npm install {dep}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── NAVEGAÇÃO ─── */}
        {activeTab === "navegacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Estrutura de Navegação</Text>
            <Text className="text-xs text-muted mb-4">
              Auth Stack · App Stack · Tab Navigator
            </Text>

            <ExpandableSection
              title="Fluxo Principal"
              subtitle="Splash → Login → Dashboard → Diagnóstico → Resultado → Histórico"
              color="#1B5E20"
              sectionKey="fluxoPrincipal"
              expanded={!!expanded.fluxoPrincipal}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { tela: "Splash", desc: "Logo AFU · Verificação de sessão", cor: "#81C784" },
                  { tela: "Login", desc: "Autenticação · JWT · SecureStore", cor: "#64B5F6" },
                  { tela: "Dashboard", desc: "Cards de acesso rápido · Indicadores", cor: "#FFB74D" },
                  { tela: "Diagnóstico", desc: "Câmera · Galeria · Upload · IA", cor: "#EF9A9A" },
                  { tela: "Resultado", desc: "Diagnóstico · Confiança · Recomendação", cor: "#CE93D8" },
                  { tela: "Histórico", desc: "Lista · Filtros · Período · Gravidade", cor: "#80CBC4" },
                ].map((s, i) => (
                  <View key={s.tela} className="items-start mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderColor: s.cor }} className="rounded-xl px-3 py-2 border w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.tela}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 5 && <Text className="text-gray-500 text-sm ml-4">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Auth Stack"
              subtitle="3 telas de autenticação"
              color="#C62828"
              sectionKey="authStack"
              expanded={!!expanded.authStack}
              onToggle={toggle}
            >
              {[
                { tela: "Login", desc: "E-mail + Senha · POST /auth/login · SecureStore", cor: "#EF9A9A" },
                { tela: "Cadastro", desc: "Nome + E-mail + Senha · POST /auth/register", cor: "#FFB74D" },
                { tela: "Recuperar Senha", desc: "E-mail · POST /auth/forgot-password", cor: "#CE93D8" },
              ].map((s) => (
                <View key={s.tela} style={{ borderLeftColor: s.cor, backgroundColor: s.cor + "10" }} className="border-l-4 rounded-r-xl p-3 mb-2">
                  <Text style={{ color: s.cor }} className="text-xs font-bold">{s.tela}</Text>
                  <Text className="text-xs text-muted mt-0.5">{s.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="App Stack (Tab Navigator)"
              subtitle="6 telas principais do app"
              color="#1565C0"
              sectionKey="appStack"
              expanded={!!expanded.appStack}
              onToggle={toggle}
            >
              {[
                { tela: "Dashboard", icon: "🏠", desc: "Cards · Indicadores · Alertas · Pendências", cor: "#64B5F6" },
                { tela: "Diagnóstico", icon: "📷", desc: "Câmera · Galeria · Upload · Resultado IA", cor: "#81C784" },
                { tela: "Propriedades", icon: "🌾", desc: "Lista · Cadastro · Edição · Mapa", cor: "#FFB74D" },
                { tela: "Culturas", icon: "🌱", desc: "Lista · Cadastro · Variedade · Fase", cor: "#A5D6A7" },
                { tela: "Relatórios", icon: "📄", desc: "PDF · Visualizar · Baixar · Compartilhar", cor: "#80CBC4" },
                { tela: "Perfil", icon: "👤", desc: "Dados · Configurações · Logout", cor: "#CE93D8" },
              ].map((s) => (
                <View key={s.tela} className="flex-row items-start py-2 border-b border-gray-100">
                  <Text className="text-base mr-2">{s.icon}</Text>
                  <View className="flex-1">
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.tela}</Text>
                    <Text className="text-xs text-muted">{s.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── TELAS ─── */}
        {activeTab === "telas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Especificação de Telas</Text>
            <Text className="text-xs text-muted mb-4">
              Login · Dashboard · Diagnóstico · Resultado · Histórico
            </Text>

            <ExpandableSection
              title="Tela Login"
              subtitle="Campos · Ações · Integração API"
              color="#1565C0"
              sectionKey="telaLogin"
              expanded={!!expanded.telaLogin}
              onToggle={toggle}
            >
              <ScreenCard
                name="Login"
                fields={["E-mail", "Senha", "Entrar", "Cadastrar", "Recuperar Senha"]}
                api="POST /auth/login"
                color="#64B5F6"
              />
              <Text className="text-xs font-semibold text-foreground mb-2">Persistência de Sessão:</Text>
              <View className="bg-gray-900 rounded-xl p-3">
                <Text className="text-yellow-400 text-xs font-mono mb-1">// Expo Secure Store</Text>
                {["accessToken", "refreshToken", "user"].map((k) => (
                  <View key={k} className="flex-row items-center mb-1">
                    <Text className="text-green-400 text-xs font-mono mr-2">→</Text>
                    <Text className="text-gray-300 text-xs font-mono">{k}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Dashboard"
              subtitle="6 cards · 3 indicadores"
              color="#1B5E20"
              sectionKey="telaDashboard"
              expanded={!!expanded.telaDashboard}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Cards de Acesso Rápido:</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {["Diagnóstico IA", "Propriedades", "Culturas", "Relatórios", "Calendário", "Materiais"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#1B5E2020", borderColor: "#1B5E2040" }} className="rounded-xl px-3 py-2 border">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{c}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Indicadores:</Text>
              <View className="flex-row flex-wrap">
                {["Últimos diagnósticos", "Alertas", "Pendências"].map((i) => (
                  <Tag key={i} label={i} color="#1B5E20" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Diagnóstico"
              subtitle="Câmera · Galeria · Upload · Fluxo IA"
              color="#EF6C00"
              sectionKey="telaDiagnostico"
              expanded={!!expanded.telaDiagnostico}
              onToggle={toggle}
            >
              <ScreenCard
                name="Diagnóstico"
                fields={["Câmera (Expo Camera)", "Galeria (ImagePicker)", "Compressão", "Upload", "Aguardar IA"]}
                api="POST /diagnostics/image"
                color="#FFB74D"
              />
              <Text className="text-xs font-semibold text-foreground mb-2">Fluxo de Upload:</Text>
              <View className="bg-gray-900 rounded-xl p-3">
                {["Foto", "Compressão (qualidade 0.8)", "Upload multipart/form-data", "POST /diagnostics/image", "Diagnóstico IA"].map((s, i) => (
                  <View key={s} className="items-start mb-0.5">
                    <Text style={{ color: i === 4 ? "#81C784" : "#9CA3AF" }} className="text-xs font-mono">{i === 0 ? "📷 " : "   "}{s}</Text>
                    {i < 4 && <Text className="text-gray-600 text-xs ml-3">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Resultado"
              subtitle="Diagnóstico · Confiança · Gravidade · Recomendação"
              color="#6A1B9A"
              sectionKey="telaResultado"
              expanded={!!expanded.telaResultado}
              onToggle={toggle}
            >
              <ScreenCard
                name="Resultado"
                fields={["Imagem", "Diagnóstico", "Confiança %", "Gravidade", "Recomendação"]}
                color="#CE93D8"
              />
              <Text className="text-xs font-semibold text-foreground mb-2">Botões de Ação:</Text>
              <View className="flex-row flex-wrap">
                {["Salvar", "Compartilhar", "Gerar Relatório"].map((b) => (
                  <Tag key={b} label={b} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tela Histórico"
              subtitle="Lista · Filtros · Período · Gravidade · Cultura"
              color="#2E7D32"
              sectionKey="telaHistorico"
              expanded={!!expanded.telaHistorico}
              onToggle={toggle}
            >
              <ScreenCard
                name="Histórico"
                fields={["Data", "Cultura", "Diagnóstico", "Filtro: Período", "Filtro: Gravidade", "Filtro: Cultura"]}
                api="GET /diagnostics"
                color="#81C784"
              />
            </ExpandableSection>
          </View>
        )}

        {/* ─── RECURSOS NATIVOS ─── */}
        {activeTab === "recursos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Recursos Nativos</Text>
            <Text className="text-xs text-muted mb-4">
              Câmera · Notificações · Offline · SecureStore · Localização
            </Text>

            <ExpandableSection
              title="Câmera & Galeria"
              subtitle="Expo Camera + Expo ImagePicker"
              color="#EF6C00"
              sectionKey="camera"
              expanded={!!expanded.camera}
              onToggle={toggle}
            >
              <View className="gap-2">
                {[
                  { rec: "Expo Camera", desc: "Captura foto diretamente pela câmera do dispositivo", cor: "#FFB74D" },
                  { rec: "Expo ImagePicker", desc: "Seleciona imagem da galeria do dispositivo", cor: "#F48FB1" },
                ].map((r) => (
                  <View key={r.rec} style={{ backgroundColor: r.cor + "15", borderColor: r.cor + "40" }} className="rounded-xl p-3 border">
                    <Text style={{ color: r.cor }} className="text-xs font-bold mb-1">{r.rec}</Text>
                    <Text className="text-xs text-muted">{r.desc}</Text>
                  </View>
                ))}
              </View>
              <View className="bg-gray-900 rounded-xl p-3 mt-3">
                <Text className="text-yellow-400 text-xs font-mono mb-1">// Permissões necessárias</Text>
                <Text className="text-gray-400 text-xs font-mono">CAMERA</Text>
                <Text className="text-gray-400 text-xs font-mono">MEDIA_LIBRARY</Text>
                <Text className="text-gray-400 text-xs font-mono">READ_EXTERNAL_STORAGE</Text>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Notificações Push"
              subtitle="4 tipos de notificação"
              color="#1565C0"
              sectionKey="notificacoes"
              expanded={!!expanded.notificacoes}
              onToggle={toggle}
            >
              {[
                { tipo: "Diagnóstico concluído", desc: "Notifica quando a IA termina a análise", cor: "#81C784" },
                { tipo: "Relatório disponível", desc: "Avisa quando o PDF foi gerado", cor: "#64B5F6" },
                { tipo: "Alerta agrícola", desc: "Notificações de pragas, doenças e clima", cor: "#FFB74D" },
                { tipo: "Calendário", desc: "Lembretes de plantio, colheita e tratamentos", cor: "#CE93D8" },
              ].map((n) => (
                <View key={n.tipo} style={{ borderLeftColor: n.cor, backgroundColor: n.cor + "10" }} className="border-l-4 rounded-r-xl p-3 mb-2">
                  <Text style={{ color: n.cor }} className="text-xs font-bold">{n.tipo}</Text>
                  <Text className="text-xs text-muted mt-0.5">{n.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Modo Offline"
              subtitle="3 funcionalidades disponíveis sem internet"
              color="#37474F"
              sectionKey="offline"
              expanded={!!expanded.offline}
              onToggle={toggle}
            >
              {[
                { func: "Consultar histórico", desc: "Diagnósticos anteriores em cache local" },
                { func: "Consultar materiais", desc: "Biblioteca de materiais técnicos offline" },
                { func: "Cadastrar informações temporárias", desc: "Dados sincronizados ao reconectar" },
              ].map((f) => (
                <View key={f.func} className="flex-row items-start py-2 border-b border-gray-100">
                  <View style={{ backgroundColor: "#ECEFF1" }} className="w-5 h-5 rounded items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: "#37474F" }} className="text-xs">○</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{f.func}</Text>
                    <Text className="text-xs text-muted">{f.desc}</Text>
                  </View>
                </View>
              ))}
              <View style={{ backgroundColor: "#E3F2FD" }} className="rounded-xl p-3 mt-3">
                <Text style={{ color: "#1565C0" }} className="text-xs font-semibold">Sincronização automática ao reconectar</Text>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Expo Secure Store"
              subtitle="Armazenamento seguro de tokens e dados sensíveis"
              color="#C62828"
              sectionKey="secureStore"
              expanded={!!expanded.secureStore}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-blue-400 text-xs font-mono mb-2">// Salvar token</Text>
                <Text className="text-gray-300 text-xs font-mono">await SecureStore.setItemAsync(</Text>
                <Text className="text-green-400 text-xs font-mono ml-3">'accessToken', token</Text>
                <Text className="text-gray-300 text-xs font-mono">);</Text>
                <Text className="text-blue-400 text-xs font-mono mt-3 mb-2">// Recuperar token</Text>
                <Text className="text-gray-300 text-xs font-mono">const token = await SecureStore</Text>
                <Text className="text-gray-300 text-xs font-mono ml-3">.getItemAsync('accessToken');</Text>
              </View>
              <View className="flex-row flex-wrap mt-3">
                {["accessToken", "refreshToken", "user"].map((k) => (
                  <Tag key={k} label={k} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── COMPONENTES ─── */}
        {activeTab === "componentes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Componentes & Tema</Text>
            <Text className="text-xs text-muted mb-4">
              packages/ui · Tema Visual AFU · Testes Jest
            </Text>

            <ExpandableSection
              title="Biblioteca packages/ui"
              subtitle="6 componentes reutilizáveis"
              color="#1B5E20"
              sectionKey="pkgUi"
              expanded={!!expanded.pkgUi}
              onToggle={toggle}
            >
              <View className="gap-2">
                {[
                  { comp: "Button", desc: "Primary · Secondary · Danger · Disabled · Loading", cor: "#81C784" },
                  { comp: "Input", desc: "Text · Password · Email · Multiline · Error state", cor: "#64B5F6" },
                  { comp: "Card", desc: "Diagnóstico · Propriedade · Cultura · Relatório", cor: "#FFB74D" },
                  { comp: "Modal", desc: "Confirmação · Alerta · Formulário · Bottom Sheet", cor: "#CE93D8" },
                  { comp: "Badge", desc: "Status · Gravidade · Tipo · Notificação", cor: "#EF9A9A" },
                  { comp: "Loader", desc: "Spinner · Skeleton · Progress bar", cor: "#80CBC4" },
                ].map((c) => (
                  <View key={c.comp} style={{ backgroundColor: c.cor + "15", borderColor: c.cor + "40" }} className="rounded-xl p-3 border flex-row items-start">
                    <View style={{ backgroundColor: c.cor + "30" }} className="rounded px-2 py-0.5 mr-3">
                      <Text style={{ color: c.cor }} className="text-xs font-bold">{c.comp}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{c.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Tema Visual AFU"
              subtitle="Baseado na Etapa 22 · 4 cores principais"
              color="#EF6C00"
              sectionKey="tema"
              expanded={!!expanded.tema}
              onToggle={toggle}
            >
              <View className="gap-2 mb-3">
                {[
                  { nome: "Verde AFU", hex: "#1B5E20", uso: "Primária · Botões · Headers · Sucesso" },
                  { nome: "Azul Tecnológico", hex: "#1565C0", uso: "Links · Info · Dados · Gráficos" },
                  { nome: "Laranja Alerta", hex: "#EF6C00", uso: "Alertas · Avisos · Pendências" },
                  { nome: "Vermelho Crítico", hex: "#C62828", uso: "Erros · Doenças graves · Crítico" },
                ].map((c) => (
                  <View key={c.nome} className="flex-row items-center rounded-xl overflow-hidden border border-gray-200">
                    <View style={{ backgroundColor: c.hex }} className="w-12 h-12" />
                    <View className="flex-1 px-3">
                      <Text className="text-xs font-bold text-foreground">{c.nome}</Text>
                      <Text className="text-xs font-mono text-muted">{c.hex}</Text>
                      <Text className="text-xs text-muted">{c.uso}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Testes — Jest + RNTL"
              subtitle="React Native Testing Library · Cobertura 80%"
              color="#6A1B9A"
              sectionKey="testes"
              expanded={!!expanded.testes}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4 mb-3">
                <Text className="text-purple-400 text-xs font-mono font-bold mb-2">Ferramentas de Teste</Text>
                <View className="flex-row flex-wrap">
                  {["Jest", "React Native Testing Library"].map((t) => (
                    <View key={t} style={{ backgroundColor: "#4A148C20" }} className="rounded-full px-3 py-1 mr-2 mb-2">
                      <Text style={{ color: "#CE93D8" }} className="text-xs font-semibold">{t}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row items-center mt-2">
                  <Text className="text-gray-400 text-xs flex-1">Cobertura mínima:</Text>
                  <View style={{ backgroundColor: "#4A148C" }} className="rounded px-2 py-0.5">
                    <Text className="text-purple-300 text-xs font-bold">80%</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: "#374151" }} className="rounded h-2 mt-2">
                  <View style={{ backgroundColor: "#CE93D8", width: "80%" }} className="h-2 rounded" />
                </View>
              </View>
              <View className="flex-row flex-wrap">
                {["Unit Tests", "Component Tests", "Integration Tests", "Snapshot Tests", "Hook Tests"].map((t) => (
                  <Tag key={t} label={t} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── BUILD ─── */}
        {activeTab === "build" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Build & Publicação</Text>
            <Text className="text-xs text-muted mb-4">
              EAS Build · Android · iOS · Critérios de Aceitação
            </Text>

            <ExpandableSection
              title="Build Android"
              subtitle="EAS Build · APK + AAB"
              color="#2E7D32"
              sectionKey="buildAndroid"
              expanded={!!expanded.buildAndroid}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4 mb-3">
                <Text className="text-green-400 text-xs font-mono font-bold mb-2">$ eas build --platform android</Text>
                <Text className="text-gray-500 text-xs font-mono mb-2"># Gera os seguintes artefatos:</Text>
                <View className="flex-row gap-2">
                  {[
                    { fmt: "APK", desc: "Instalação direta", cor: "#81C784" },
                    { fmt: "AAB", desc: "Google Play Store", cor: "#64B5F6" },
                  ].map((f) => (
                    <View key={f.fmt} style={{ backgroundColor: f.cor + "20", borderColor: f.cor + "40" }} className="flex-1 rounded-xl p-3 border items-center">
                      <Text style={{ color: f.cor }} className="text-sm font-bold">{f.fmt}</Text>
                      <Text className="text-gray-400 text-xs mt-1">{f.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="flex-row flex-wrap">
                {["Android 7.0+", "minSdkVersion 24", "arm64-v8a", "armeabi-v7a"].map((t) => (
                  <Tag key={t} label={t} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Build iOS"
              subtitle="EAS Build · IPA · App Store"
              color="#1565C0"
              sectionKey="buildIos"
              expanded={!!expanded.buildIos}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4 mb-3">
                <Text className="text-blue-400 text-xs font-mono font-bold mb-2">$ eas build --platform ios</Text>
                <Text className="text-gray-500 text-xs font-mono mb-2"># Gera o seguinte artefato:</Text>
                <View style={{ backgroundColor: "#1565C020", borderColor: "#1565C040" }} className="rounded-xl p-3 border items-center">
                  <Text style={{ color: "#64B5F6" }} className="text-sm font-bold">IPA</Text>
                  <Text className="text-gray-400 text-xs mt-1">Apple App Store</Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                {["iOS 15+", "Swift 5", "Xcode 15", "TestFlight"].map((t) => (
                  <Tag key={t} label={t} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Critérios de Aceitação"
              subtitle="9 critérios para app MVP pronto"
              color="#1B5E20"
              sectionKey="criterios"
              expanded={!!expanded.criterios}
              onToggle={toggle}
            >
              {[
                { item: "Login funcional", desc: "Autenticação JWT com SecureStore" },
                { item: "Cadastro funcional", desc: "Registro de novo usuário" },
                { item: "Dashboard funcional", desc: "Cards e indicadores carregando" },
                { item: "Cadastro de propriedades", desc: "CRUD completo com API" },
                { item: "Cadastro de culturas", desc: "CRUD completo com variedades" },
                { item: "Captura de imagem", desc: "Câmera e galeria funcionando" },
                { item: "Diagnóstico", desc: "Upload + IA + resultado exibido" },
                { item: "Histórico", desc: "Lista com filtros funcionando" },
                { item: "Relatórios", desc: "PDF gerado e compartilhável" },
              ].map((c) => (
                <View key={c.item} className="flex-row items-start py-2 border-b border-gray-100">
                  <View style={{ backgroundColor: "#E8F5E9" }} className="w-5 h-5 rounded items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{c.item}</Text>
                    <Text className="text-xs text-muted">{c.desc}</Text>
                  </View>
                </View>
              ))}
              <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mt-3">
                <Text className="text-white text-xs font-bold mb-1">Resultado da Etapa 25</Text>
                <Text style={{ color: "#A5D6A7" }} className="text-xs leading-5">
                  O aplicativo Planta Saudável AFU possui sua especificação completa para implementação em React Native, tornando-se o primeiro produto operacional do ecossistema AFU.
                </Text>
              </View>
            </ExpandableSection>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
