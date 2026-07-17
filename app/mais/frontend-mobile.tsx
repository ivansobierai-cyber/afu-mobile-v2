import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

type Aba = "design" | "navegacao" | "telas" | "notificacoes" | "offline" | "stack";

const COR_PRIMARIA = "#2E7D32";
const COR_CLARA = "#66BB6A";
const COR_AZUL = "#1565C0";
const COR_LARANJA = "#EF6C00";
const COR_VERMELHO = "#C62828";

const CORES_DESIGN = [
  { nome: "Verde Primário", hex: "#2E7D32", uso: "Botões, headers, ações principais" },
  { nome: "Verde Claro", hex: "#66BB6A", uso: "Ícones, badges, destaques positivos" },
  { nome: "Azul Tecnológico", hex: "#1565C0", uso: "Links, informações, dados técnicos" },
  { nome: "Laranja Alerta", hex: "#EF6C00", uso: "Alertas, avisos, atenção necessária" },
  { nome: "Vermelho Crítico", hex: "#C62828", uso: "Erros, situações críticas, exclusão" },
  { nome: "Branco", hex: "#FFFFFF", uso: "Fundo de cards, superfícies, formulários" },
  { nome: "Cinza Claro", hex: "#F5F5F5", uso: "Fundo de telas, separadores, áreas neutras" },
];

const TIPOGRAFIA = [
  { peso: "Regular (400)", uso: "Textos descritivos, legendas, labels" },
  { peso: "Medium (500)", uso: "Subtítulos, campos de formulário" },
  { peso: "SemiBold (600)", uso: "Títulos de seção, botões secundários" },
  { peso: "Bold (700)", uso: "Títulos principais, valores destacados" },
];

const BIBLIOTECAS = [
  { nome: "React Navigation", desc: "Navegação entre telas (Stack + Bottom Tabs)", cor: COR_AZUL },
  { nome: "React Query", desc: "Cache e sincronização de dados do servidor", cor: COR_PRIMARIA },
  { nome: "Zustand", desc: "Gerenciamento de estado global leve", cor: COR_LARANJA },
  { nome: "Axios", desc: "Requisições HTTP para a API Central", cor: COR_AZUL },
  { nome: "Expo Camera", desc: "Acesso à câmera para diagnóstico por foto", cor: COR_PRIMARIA },
  { nome: "Expo Image Picker", desc: "Seleção de imagens da galeria do dispositivo", cor: COR_PRIMARIA },
  { nome: "Expo Notifications", desc: "Notificações push (agrícolas, sistema, emergência)", cor: COR_LARANJA },
  { nome: "Expo Location", desc: "Geolocalização para propriedades e alertas", cor: COR_AZUL },
  { nome: "React Hook Form", desc: "Formulários performáticos com validação", cor: COR_PRIMARIA },
  { nome: "Zod", desc: "Validação de schemas TypeScript em runtime", cor: COR_AZUL },
];

const ESTRUTURA_PASTAS = [
  { path: "src/assets/", desc: "Imagens, ícones, fontes Inter" },
  { path: "src/components/", desc: "Componentes reutilizáveis (Button, Card, Input)" },
  { path: "src/screens/", desc: "Telas do app (Dashboard, Diagnóstico, Perfil...)" },
  { path: "src/navigation/", desc: "Configuração de rotas e navegação" },
  { path: "src/services/", desc: "Chamadas à API Central (auth, diagnóstico, análise)" },
  { path: "src/hooks/", desc: "Custom hooks (useAuth, useDiagnostico, useLocation)" },
  { path: "src/store/", desc: "Estado global Zustand (usuário, propriedades, offline)" },
  { path: "src/utils/", desc: "Funções utilitárias (formatação, validação, PDF)" },
  { path: "src/types/", desc: "Tipos TypeScript compartilhados" },
  { path: "src/theme/", desc: "Design System: cores, tipografia, espaçamentos" },
  { path: "src/contexts/", desc: "Contextos React (AuthContext, ThemeContext)" },
  { path: "App.tsx", desc: "Ponto de entrada da aplicação" },
];

const FLUXO_NAVEGACAO = [
  { tela: "Splash", desc: "Logo AFU + versão (2s)", icone: "🌱" },
  { tela: "Boas-vindas", desc: "Apresentação + benefícios", icone: "👋" },
  { tela: "Login", desc: "E-mail/telefone + senha", icone: "🔐" },
  { tela: "Dashboard", desc: "Painel principal do produtor", icone: "🏠" },
];

const TABS_NAVEGACAO = [
  { nome: "Início", desc: "Dashboard do produtor", icone: "🏠" },
  { nome: "Diagnóstico", desc: "Análise por IA com câmera", icone: "🔬" },
  { nome: "Culturas", desc: "Gestão das culturas plantadas", icone: "🌾" },
  { nome: "Calendário", desc: "Agenda agrícola com eventos", icone: "📅" },
  { nome: "Perfil", desc: "Conta e configurações do usuário", icone: "👤" },
];

const TELAS = [
  {
    nome: "Splash",
    icone: "🌱",
    cor: COR_PRIMARIA,
    elementos: ["Logo AFU centralizado", "Nome 'Planta Saudável'", "Versão do sistema", "Duração: 2 segundos"],
  },
  {
    nome: "Boas-vindas",
    icone: "👋",
    cor: COR_CLARA,
    elementos: ["Apresentação do sistema AFU", "Lista de benefícios", "Botão 'Entrar'", "Botão 'Criar Conta'"],
  },
  {
    nome: "Login",
    icone: "🔐",
    cor: COR_AZUL,
    elementos: ["Campo E-mail", "Campo Telefone", "Campo Senha", "Botão 'Entrar'", "Link 'Recuperar senha'", "Link 'Criar conta'"],
  },
  {
    nome: "Dashboard",
    icone: "🏠",
    cor: COR_PRIMARIA,
    elementos: ["Card Diagnóstico (câmera)", "Card Propriedades", "Card Culturas", "Card Relatórios", "Card Calendário", "Card Suporte"],
  },
  {
    nome: "Diagnóstico IA",
    icone: "🔬",
    cor: COR_AZUL,
    elementos: ["Botão Tirar Foto (câmera)", "Botão Escolher Imagem (galeria)", "Seletor de Cultura (milho/soja/feijão/tomate/mandioca)", "Seletor de Parte (folha/caule/fruto/raiz/planta inteira)"],
  },
  {
    nome: "Resultado IA",
    icone: "📊",
    cor: COR_LARANJA,
    elementos: ["Estado da Planta (saudável/atenção/crítico)", "Diagnóstico (fungo/bactéria/praga/deficiência/estresse)", "Confiança IA (ex: 92%)", "Recomendações de ações imediatas", "Botão 'Salvar análise'"],
  },
  {
    nome: "Propriedades",
    icone: "🏡",
    cor: COR_PRIMARIA,
    elementos: ["Lista: nome, área, localização", "Ação: Criar propriedade", "Ação: Editar propriedade", "Ação: Excluir propriedade"],
  },
  {
    nome: "Culturas",
    icone: "🌾",
    cor: COR_CLARA,
    elementos: ["Info: cultura, variedade, plantio, fase", "Ação: Adicionar cultura", "Ação: Editar cultura", "Ação: Remover cultura"],
  },
  {
    nome: "Calendário",
    icone: "📅",
    cor: COR_AZUL,
    elementos: ["Evento: Irrigação", "Evento: Adubação", "Evento: Poda", "Evento: Pulverização", "Evento: Colheita", "Notificações automáticas"],
  },
  {
    nome: "Relatórios",
    icone: "📄",
    cor: COR_AZUL,
    elementos: ["Tipo: Diagnóstico IA", "Tipo: Solo", "Tipo: Água", "Tipo: Produção", "Exportação em PDF"],
  },
  {
    nome: "Materiais Didáticos",
    icone: "📚",
    cor: COR_PRIMARIA,
    elementos: ["Vídeos tutoriais", "Apostilas técnicas", "Guias práticos", "Checklists", "Modo offline disponível"],
  },
  {
    nome: "Perfil",
    icone: "👤",
    cor: COR_AZUL,
    elementos: ["Dados: Nome, Região, Telefone, E-mail", "Config: Idioma", "Config: Notificações", "Config: Privacidade", "Config: Segurança"],
  },
];

const NOTIFICACOES = [
  {
    tipo: "Agrícolas",
    icone: "🌾",
    cor: COR_PRIMARIA,
    itens: ["Irrigação programada", "Adubação necessária", "Colheita no prazo"],
  },
  {
    tipo: "Sistema",
    icone: "🔔",
    cor: COR_AZUL,
    itens: ["Relatório pronto para download", "Nova análise disponível", "Atualização do sistema"],
  },
  {
    tipo: "Emergenciais",
    icone: "⚠️",
    cor: COR_VERMELHO,
    itens: ["Alerta de geada", "Período de seca", "Tempestade prevista", "Surto de pragas detectado"],
  },
];

const OFFLINE_RECURSOS = [
  { recurso: "Visualizar histórico", desc: "Diagnósticos e análises anteriores salvos localmente" },
  { recurso: "Consultar materiais", desc: "Vídeos, apostilas e guias baixados previamente" },
  { recurso: "Registrar informações", desc: "Novos dados salvos no dispositivo para sincronizar depois" },
  { recurso: "Sincronização automática", desc: "Dados enviados ao servidor quando a internet retornar" },
];

export default function FrontendMobileScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("design");
  const [telaExpandida, setTelaExpandida] = useState<string | null>(null);

  const abas: { id: Aba; label: string }[] = [
    { id: "design", label: "Design" },
    { id: "stack", label: "Stack" },
    { id: "navegacao", label: "Navegação" },
    { id: "telas", label: "Telas" },
    { id: "notificacoes", label: "Notif." },
    { id: "offline", label: "Offline" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COR_PRIMARIA }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📱 Frontend Mobile</Text>
          <Text style={styles.headerSubtitle}>AFU Etapa 8 · React Native · Expo · TypeScript</Text>
        </View>
      </View>

      {/* Abas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {abas.map((aba) => (
          <TouchableOpacity
            key={aba.id}
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: COR_PRIMARIA, borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? COR_PRIMARIA : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <AfuStackBanner note="App mobile = Expo SDK 54 + Expo Router + tRPC. Menções a stacks alternativas abaixo são planejamento." />

        {/* ─── DESIGN SYSTEM ─── */}
        {abaAtiva === "design" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_PRIMARIA }]}>
              <Text style={styles.infoTitle}>Design System AFU</Text>
              <Text style={styles.infoSubtitle}>Planta Saudável · Cores · Tipografia · Componentes</Text>
            </View>

            {/* Paleta de cores */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Paleta de Cores Oficial</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {CORES_DESIGN.map((c) => (
                  <View key={c.hex} style={styles.corRow}>
                    <View style={[styles.corSwatch, { backgroundColor: c.hex }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.corNomeRow}>
                        <Text style={[styles.corNome, { color: colors.foreground }]}>{c.nome}</Text>
                        <Text style={[styles.corHex, { color: colors.muted }]}>{c.hex}</Text>
                      </View>
                      <Text style={[styles.corUso, { color: colors.muted }]}>{c.uso}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Tipografia */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tipografia — Inter</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {TIPOGRAFIA.map((t, idx) => (
                  <View key={idx} style={[styles.tipoRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.tipoPeso, { color: COR_PRIMARIA, fontWeight: idx === 0 ? "400" : idx === 1 ? "500" : idx === 2 ? "600" : "700" }]}>
                      {t.peso}
                    </Text>
                    <Text style={[styles.tipoUso, { color: colors.muted }]}>{t.uso}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Preview de cores */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preview dos Componentes</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                <View style={[styles.previewBtn, { backgroundColor: COR_PRIMARIA }]}>
                  <Text style={styles.previewBtnText}>Botão Primário — Verde #2E7D32</Text>
                </View>
                <View style={[styles.previewBtn, { backgroundColor: COR_AZUL }]}>
                  <Text style={styles.previewBtnText}>Botão Secundário — Azul #1565C0</Text>
                </View>
                <View style={[styles.previewBtn, { backgroundColor: COR_LARANJA }]}>
                  <Text style={styles.previewBtnText}>Botão Alerta — Laranja #EF6C00</Text>
                </View>
                <View style={[styles.previewBtn, { backgroundColor: COR_VERMELHO }]}>
                  <Text style={styles.previewBtnText}>Botão Crítico — Vermelho #C62828</Text>
                </View>
                <View style={[styles.previewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.previewCardTitle, { color: colors.foreground }]}>Card de Propriedade</Text>
                  <Text style={[styles.previewCardSub, { color: colors.muted }]}>Fazenda São João · 150 ha · Minas Gerais</Text>
                  <View style={[styles.previewBadge, { backgroundColor: COR_CLARA + "30" }]}>
                    <Text style={[styles.previewBadgeText, { color: COR_PRIMARIA }]}>✓ Ativa</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── STACK ─── */}
        {abaAtiva === "stack" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_PRIMARIA }]}>
              <Text style={styles.infoTitle}>Stack Tecnológica</Text>
              <Text style={styles.infoSubtitle}>React Native · Expo SDK · TypeScript · 10 bibliotecas</Text>
            </View>

            {/* Framework */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Framework Principal</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                {[
                  { nome: "React Native", desc: "UI nativa iOS/Android", cor: COR_AZUL },
                  { nome: "Expo SDK", desc: "Ferramentas e APIs nativas", cor: COR_PRIMARIA },
                  { nome: "TypeScript", desc: "Tipagem estática segura", cor: COR_AZUL },
                ].map((f) => (
                  <View key={f.nome} style={[styles.frameworkCard, { backgroundColor: f.cor + "15", borderColor: f.cor + "40" }]}>
                    <Text style={[styles.frameworkNome, { color: f.cor }]}>{f.nome}</Text>
                    <Text style={[styles.frameworkDesc, { color: colors.muted }]}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bibliotecas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>Bibliotecas ({BIBLIOTECAS.length})</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {BIBLIOTECAS.map((lib, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.libRow,
                      idx < BIBLIOTECAS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.libDot, { backgroundColor: lib.cor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.libNome, { color: lib.cor }]}>{lib.nome}</Text>
                      <Text style={[styles.libDesc, { color: colors.muted }]}>{lib.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Estrutura de pastas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>Estrutura de Pastas</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {ESTRUTURA_PASTAS.map((p, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pastaRow,
                      idx < ESTRUTURA_PASTAS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <Text style={[styles.pastaCaminho, { color: COR_PRIMARIA }]}>{p.path}</Text>
                    <Text style={[styles.pastaDesc, { color: colors.muted }]}>{p.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── NAVEGAÇÃO ─── */}
        {abaAtiva === "navegacao" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_PRIMARIA }]}>
              <Text style={styles.infoTitle}>Navegação do App</Text>
              <Text style={styles.infoSubtitle}>Fluxo inicial + 5 tabs da navegação inferior</Text>
            </View>

            {/* Fluxo inicial */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fluxo Inicial</Text>
              <View style={{ marginTop: 12, gap: 0 }}>
                {FLUXO_NAVEGACAO.map((item, idx) => (
                  <View key={idx} style={styles.fluxoRow}>
                    <View style={{ alignItems: "center", width: 40 }}>
                      <View style={[styles.fluxoCircle, { backgroundColor: COR_PRIMARIA }]}>
                        <Text style={{ fontSize: 18 }}>{item.icone}</Text>
                      </View>
                      {idx < FLUXO_NAVEGACAO.length - 1 && (
                        <View style={[styles.fluxoLinha, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: idx < FLUXO_NAVEGACAO.length - 1 ? 16 : 0 }}>
                      <Text style={[styles.fluxoTela, { color: colors.foreground }]}>{item.tela}</Text>
                      <Text style={[styles.fluxoDesc, { color: colors.muted }]}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Tabs */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Navegação Inferior (5 Tabs)</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {TABS_NAVEGACAO.map((tab, idx) => (
                  <View key={idx} style={[styles.tabNavRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={[styles.tabNavIcone, { backgroundColor: COR_PRIMARIA + "20" }]}>
                      <Text style={{ fontSize: 22 }}>{tab.icone}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tabNavNome, { color: COR_PRIMARIA }]}>{tab.nome}</Text>
                      <Text style={[styles.tabNavDesc, { color: colors.muted }]}>{tab.desc}</Text>
                    </View>
                    <View style={[styles.tabNumBadge, { backgroundColor: COR_PRIMARIA }]}>
                      <Text style={styles.tabNumText}>{idx + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Tab bar mockup */}
            <View style={[styles.card, { backgroundColor: "#1B2E1C", padding: 16 }]}>
              <Text style={{ color: "#B7E4C7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Mockup — Barra de Navegação
              </Text>
              <View style={[styles.tabBarMockup, { backgroundColor: "#0F1A14", borderColor: "#2D4A35" }]}>
                {TABS_NAVEGACAO.map((tab, idx) => (
                  <View key={idx} style={[styles.tabBarItem, idx === 0 && { opacity: 1 }]}>
                    <Text style={{ fontSize: 20 }}>{tab.icone}</Text>
                    <Text style={[styles.tabBarLabel, { color: idx === 0 ? COR_CLARA : "#6B7C6E" }]}>
                      {tab.nome}
                    </Text>
                    {idx === 0 && <View style={[styles.tabBarDot, { backgroundColor: COR_CLARA }]} />}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── TELAS ─── */}
        {abaAtiva === "telas" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_PRIMARIA }]}>
              <Text style={styles.infoTitle}>12 Telas do App</Text>
              <Text style={styles.infoSubtitle}>Splash · Login · Dashboard · Diagnóstico · Perfil · e mais</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Telas", valor: "12", cor: COR_PRIMARIA },
                { label: "Tabs", valor: "5", cor: COR_AZUL },
                { label: "Modais", valor: "3", cor: COR_LARANJA },
                { label: "Fluxos", valor: "4", cor: COR_CLARA },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.statValor, { color: s.cor }]}>{s.valor}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {TELAS.map((tela) => (
              <View key={tela.nome} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.telaHeader}
                  onPress={() => setTelaExpandida(telaExpandida === tela.nome ? null : tela.nome)}
                >
                  <View style={[styles.telaIcone, { backgroundColor: tela.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{tela.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.telaNome, { color: tela.cor }]}>{tela.nome}</Text>
                    <Text style={[styles.telaCount, { color: colors.muted }]}>{tela.elementos.length} elementos</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {telaExpandida === tela.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {telaExpandida === tela.nome && (
                  <View style={[styles.telaBody, { borderTopColor: colors.border }]}>
                    {tela.elementos.map((el, idx) => (
                      <View key={idx} style={styles.telaElRow}>
                        <View style={[styles.telaElDot, { backgroundColor: tela.cor }]} />
                        <Text style={[styles.telaElText, { color: colors.foreground }]}>{el}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── NOTIFICAÇÕES ─── */}
        {abaAtiva === "notificacoes" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_PRIMARIA }]}>
              <Text style={styles.infoTitle}>🔔 Notificações Push</Text>
              <Text style={styles.infoSubtitle}>Agrícolas · Sistema · Emergenciais</Text>
            </View>

            {/* Tecnologia */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tecnologia</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                {[
                  { nome: "Expo Notifications", desc: "SDK para push nativo iOS/Android", cor: COR_LARANJA },
                  { nome: "FCM / APNs", desc: "Firebase Cloud Messaging + Apple Push", cor: COR_AZUL },
                ].map((t) => (
                  <View key={t.nome} style={[styles.frameworkCard, { backgroundColor: t.cor + "15", borderColor: t.cor + "40" }]}>
                    <Text style={[styles.frameworkNome, { color: t.cor }]}>{t.nome}</Text>
                    <Text style={[styles.frameworkDesc, { color: colors.muted }]}>{t.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {NOTIFICACOES.map((grupo) => (
              <View key={grupo.tipo} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
                <View style={styles.notifHeaderRow}>
                  <Text style={{ fontSize: 28 }}>{grupo.icone}</Text>
                  <Text style={[styles.notifTipo, { color: grupo.cor }]}>{grupo.tipo}</Text>
                </View>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {grupo.itens.map((item, idx) => (
                    <View key={idx} style={[styles.notifItemCard, { backgroundColor: grupo.cor + "10", borderColor: grupo.cor + "30" }]}>
                      <View style={[styles.notifDot, { backgroundColor: grupo.cor }]} />
                      <Text style={[styles.notifItemText, { color: colors.foreground }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Mockup de notificação */}
            <View style={[styles.card, { backgroundColor: "#1B2E1C", padding: 16 }]}>
              <Text style={{ color: "#B7E4C7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Exemplo de Notificação Push
              </Text>
              <View style={[styles.notifMockup, { backgroundColor: "#0F1A14", borderColor: "#2D4A35" }]}>
                <View style={styles.notifMockupHeader}>
                  <Text style={{ fontSize: 20 }}>🌾</Text>
                  <Text style={styles.notifMockupApp}>AFU Planta Saudável</Text>
                  <Text style={styles.notifMockupHora}>agora</Text>
                </View>
                <Text style={styles.notifMockupTitulo}>Irrigação programada para hoje</Text>
                <Text style={styles.notifMockupDesc}>Sua cultura de soja precisa de irrigação às 7h. Toque para ver detalhes.</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── OFFLINE ─── */}
        {abaAtiva === "offline" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_PRIMARIA }]}>
              <Text style={styles.infoTitle}>📡 Modo Offline</Text>
              <Text style={styles.infoSubtitle}>Funcionalidade sem internet + sincronização automática</Text>
            </View>

            {/* Recursos offline */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>O que funciona offline</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {OFFLINE_RECURSOS.map((r, idx) => (
                  <View key={idx} style={[styles.offlineCard, { backgroundColor: COR_PRIMARIA + "10", borderColor: COR_PRIMARIA + "30" }]}>
                    <View style={[styles.offlineDot, { backgroundColor: COR_PRIMARIA }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.offlineRecurso, { color: COR_PRIMARIA }]}>{r.recurso}</Text>
                      <Text style={[styles.offlineDesc, { color: colors.muted }]}>{r.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Estratégia de armazenamento */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estratégia de Armazenamento</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { lib: "AsyncStorage", uso: "Dados do usuário, configurações, preferências", cor: COR_AZUL },
                  { lib: "React Query Cache", uso: "Respostas da API em cache para acesso offline", cor: COR_PRIMARIA },
                  { lib: "Expo FileSystem", uso: "Materiais didáticos (PDFs, vídeos) baixados", cor: COR_LARANJA },
                  { lib: "Zustand Persist", uso: "Estado global persistido entre sessões", cor: COR_PRIMARIA },
                ].map((s, idx) => (
                  <View key={idx} style={[styles.storageRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.storageBadge, { backgroundColor: s.cor }]}>
                      <Text style={styles.storageBadgeText}>{s.lib}</Text>
                    </View>
                    <Text style={[styles.storageUso, { color: colors.muted }]}>{s.uso}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fluxo de sincronização */}
            <View style={[styles.card, { backgroundColor: "#1B2E1C", padding: 16 }]}>
              <Text style={{ color: "#B7E4C7", fontSize: 14, fontWeight: "700", marginBottom: 12 }}>
                Fluxo de Sincronização
              </Text>
              {[
                { icone: "📴", texto: "App sem internet — modo offline ativo" },
                { icone: "💾", texto: "Dados registrados localmente no dispositivo" },
                { icone: "📶", texto: "Internet restaurada — sincronização iniciada" },
                { icone: "🔄", texto: "Dados enviados ao servidor em background" },
                { icone: "✅", texto: "Sincronização concluída — notificação ao usuário" },
              ].map((step, idx) => (
                <View key={idx} style={styles.syncRow}>
                  <Text style={{ fontSize: 20 }}>{step.icone}</Text>
                  <Text style={styles.syncText}>{step.texto}</Text>
                  {idx < 4 && <Text style={styles.syncArrow}>↓</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 8, gap: 12 },
  backBtn: { padding: 8 },
  backIcon: { color: "#fff", fontSize: 20 },
  headerContent: { flex: 1 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSubtitle: { color: "#C8E6C9", fontSize: 12 },
  tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  infoCard: { borderRadius: 12, padding: 16 },
  infoTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoSubtitle: { color: "#C8E6C9", fontSize: 13, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  corRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  corSwatch: { width: 44, height: 44, borderRadius: 10 },
  corNomeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  corNome: { fontSize: 13, fontWeight: "700" },
  corHex: { fontSize: 11, fontFamily: "monospace" },
  corUso: { fontSize: 11, marginTop: 2 },
  tipoRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  tipoPeso: { fontSize: 14, marginBottom: 2 },
  tipoUso: { fontSize: 12 },
  previewBtn: { padding: 14, borderRadius: 10, alignItems: "center" },
  previewBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  previewCard: { padding: 14, borderRadius: 10, borderWidth: 1 },
  previewCardTitle: { fontSize: 14, fontWeight: "700" },
  previewCardSub: { fontSize: 12, marginTop: 4 },
  previewBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  previewBadgeText: { fontSize: 11, fontWeight: "700" },
  frameworkCard: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  frameworkNome: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  frameworkDesc: { fontSize: 10, textAlign: "center", marginTop: 4 },
  codeHeader: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  codeTitle: { fontSize: 14, fontWeight: "700" },
  libRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 10 },
  libDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  libNome: { fontSize: 13, fontWeight: "700" },
  libDesc: { fontSize: 11, marginTop: 2 },
  pastaRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  pastaCaminho: { fontSize: 12, fontFamily: "monospace", fontWeight: "700" },
  pastaDesc: { fontSize: 11, marginTop: 2 },
  fluxoRow: { flexDirection: "row", gap: 12 },
  fluxoCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  fluxoLinha: { width: 2, flex: 1, minHeight: 12, alignSelf: "center" },
  fluxoTela: { fontSize: 15, fontWeight: "700" },
  fluxoDesc: { fontSize: 12, marginTop: 2 },
  tabNavRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, gap: 12 },
  tabNavIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tabNavNome: { fontSize: 14, fontWeight: "700" },
  tabNavDesc: { fontSize: 12, marginTop: 2 },
  tabNumBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tabNumText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  tabBarMockup: { borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: "row", justifyContent: "space-around" },
  tabBarItem: { alignItems: "center", gap: 4, opacity: 0.5 },
  tabBarLabel: { fontSize: 9, fontWeight: "600" },
  tabBarDot: { width: 4, height: 4, borderRadius: 2 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center" },
  statValor: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  telaHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  telaIcone: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  telaNome: { fontSize: 15, fontWeight: "700" },
  telaCount: { fontSize: 12, marginTop: 2 },
  telaBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  telaElRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  telaElDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  telaElText: { fontSize: 13, flex: 1 },
  notifHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  notifTipo: { fontSize: 16, fontWeight: "700" },
  notifItemCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, borderWidth: 1 },
  notifDot: { width: 8, height: 8, borderRadius: 4 },
  notifItemText: { fontSize: 13, flex: 1 },
  notifMockup: { borderRadius: 12, borderWidth: 1, padding: 14 },
  notifMockupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  notifMockupApp: { flex: 1, color: "#B7E4C7", fontSize: 11, fontWeight: "700" },
  notifMockupHora: { color: "#6B7C6E", fontSize: 11 },
  notifMockupTitulo: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  notifMockupDesc: { color: "#B7E4C7", fontSize: 12, lineHeight: 18 },
  offlineCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  offlineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  offlineRecurso: { fontSize: 13, fontWeight: "700" },
  offlineDesc: { fontSize: 12, marginTop: 2 },
  storageRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  storageBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  storageBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  storageUso: { fontSize: 12 },
  syncRow: { marginBottom: 6 },
  syncText: { color: "#fff", fontSize: 13, marginLeft: 8, marginTop: 2 },
  syncArrow: { color: "#B7E4C7", fontSize: 14, marginLeft: 28, marginTop: 2 },
});
