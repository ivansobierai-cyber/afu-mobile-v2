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

type Aba = "stack" | "telas" | "dashboard" | "componentes" | "permissoes" | "fluxo";

const COR_PRIMARIA = "#2E7D32";
const COR_CLARA = "#66BB6A";
const COR_AZUL = "#1565C0";
const COR_LARANJA = "#EF6C00";
const COR_VERMELHO = "#C62828";
const COR_ROXO = "#6A1B9A";

const STACK = [
  { nome: "Next.js 14", desc: "Framework React com SSR/SSG e App Router", cor: COR_AZUL, icone: "▲" },
  { nome: "React 18", desc: "Biblioteca UI com Server Components", cor: COR_AZUL, icone: "⚛" },
  { nome: "TypeScript", desc: "Tipagem estática e segurança de tipos", cor: COR_AZUL, icone: "TS" },
  { nome: "Tailwind CSS", desc: "Estilização utility-first responsiva", cor: COR_PRIMARIA, icone: "🎨" },
  { nome: "React Query", desc: "Cache, sincronização e estado do servidor", cor: COR_LARANJA, icone: "🔄" },
  { nome: "Zustand", desc: "Gerenciamento de estado global leve", cor: COR_LARANJA, icone: "🐻" },
  { nome: "Axios", desc: "Requisições HTTP para a API Central", cor: COR_AZUL, icone: "📡" },
  { nome: "Recharts", desc: "Gráficos interativos (linha, barra, pizza)", cor: COR_ROXO, icone: "📊" },
  { nome: "React Hook Form", desc: "Formulários performáticos com validação", cor: COR_PRIMARIA, icone: "📝" },
  { nome: "Zod", desc: "Validação de schemas TypeScript em runtime", cor: COR_AZUL, icone: "✅" },
];

const ESTRUTURA = [
  { path: "src/app/", desc: "Rotas do App Router (Next.js 14)" },
  { path: "src/components/", desc: "Componentes reutilizáveis (Button, Table, Modal...)" },
  { path: "src/modules/", desc: "Módulos por domínio (produtores, diagnósticos...)" },
  { path: "src/services/", desc: "Chamadas à API Central (REST + tRPC)" },
  { path: "src/hooks/", desc: "Custom hooks (useAuth, useDiagnosticos, useSensores)" },
  { path: "src/store/", desc: "Estado global Zustand (sessão, filtros, UI)" },
  { path: "src/types/", desc: "Tipos TypeScript compartilhados com o mobile" },
  { path: "src/utils/", desc: "Funções utilitárias (formatação, PDF, exportação)" },
  { path: "src/theme/", desc: "Design System: cores, tipografia, tokens" },
];

const TELAS = [
  {
    nome: "Login Administrativo",
    icone: "🔐",
    cor: COR_AZUL,
    elementos: ["Campo E-mail", "Campo Senha", "MFA (código 6 dígitos)", "Recuperar senha", "Redirecionamento por perfil"],
  },
  {
    nome: "Dashboard Geral",
    icone: "📊",
    cor: COR_PRIMARIA,
    elementos: ["8 cards de indicadores", "Gráfico: diagnósticos por mês", "Gráfico: problemas detectados", "Gráfico: culturas analisadas", "Gráfico: produtividade por região", "Gráfico: vendas por categoria"],
  },
  {
    nome: "Gestão de Produtores",
    icone: "👨‍🌾",
    cor: COR_PRIMARIA,
    elementos: ["Tabela com paginação", "Busca por nome/CPF/região", "Filtro por estado/cultura", "Visualizar propriedade", "Editar cadastro", "Acessar histórico completo"],
  },
  {
    nome: "Gestão de Propriedades",
    icone: "🏡",
    cor: COR_CLARA,
    elementos: ["Lista de propriedades", "Filtro por área/cultura/região", "Mapa de localização", "Histórico de produção", "Terrenos e talhões"],
  },
  {
    nome: "Diagnósticos IA",
    icone: "🔬",
    cor: COR_LARANJA,
    elementos: ["Visualizar fotos enviadas", "Resultado preliminar da IA", "Campo: parecer técnico", "Botão: Aprovar diagnóstico", "Botão: Corrigir resultado", "Botão: Gerar relatório"],
  },
  {
    nome: "Análises Fitotécnicas",
    icone: "🧪",
    cor: COR_AZUL,
    elementos: ["Tipos: solo, água, planta, insumos, alimentos", "Campos: pH, NPK, MO, umidade, CE", "Observações técnicas", "Interpretação automática", "Exportar dados CSV/PDF"],
  },
  {
    nome: "Relatórios e Certificados",
    icone: "📄",
    cor: COR_AZUL,
    elementos: ["Gerar PDF técnico", "Aprovar laudos", "Assinatura digital", "Enviar ao produtor", "Exportar dados em lote"],
  },
  {
    nome: "Banco de Pragas e Doenças",
    icone: "🐛",
    cor: COR_VERMELHO,
    elementos: ["Nome e cultura afetada", "Sintomas e causas", "Imagens de referência", "Tratamento e prevenção", "Nível de risco (1–5)"],
  },
  {
    nome: "Materiais Didáticos",
    icone: "📚",
    cor: COR_PRIMARIA,
    elementos: ["Upload de apostilas (PDF)", "Upload de vídeos", "Upload de áudios", "Checklists editáveis", "Treinamentos por módulo"],
  },
  {
    nome: "Sensores e IoT",
    icone: "📡",
    cor: COR_AZUL,
    elementos: ["Umidade do solo", "Temperatura ambiente", "pH em tempo real", "Pluviômetro", "Status da irrigação", "Alertas automáticos"],
  },
  {
    nome: "Marketplace",
    icone: "🛒",
    cor: COR_LARANJA,
    elementos: ["Gestão de produtos", "Pedidos e status", "Pagamentos", "Produtores vendedores", "Status de entrega"],
  },
  {
    nome: "Configurações",
    icone: "⚙️",
    cor: COR_ROXO,
    elementos: ["Usuários do painel", "Permissões por perfil", "Integrações externas", "Notificações do sistema", "Logs de auditoria"],
  },
];

const MENU_LATERAL = [
  { nome: "Dashboard", icone: "📊", cor: COR_PRIMARIA },
  { nome: "Produtores", icone: "👨‍🌾", cor: COR_PRIMARIA },
  { nome: "Propriedades", icone: "🏡", cor: COR_CLARA },
  { nome: "Culturas", icone: "🌾", cor: COR_CLARA },
  { nome: "Diagnósticos IA", icone: "🔬", cor: COR_LARANJA },
  { nome: "Análises", icone: "🧪", cor: COR_AZUL },
  { nome: "Relatórios", icone: "📄", cor: COR_AZUL },
  { nome: "Pragas e Doenças", icone: "🐛", cor: COR_VERMELHO },
  { nome: "Materiais", icone: "📚", cor: COR_PRIMARIA },
  { nome: "Sensores", icone: "📡", cor: COR_AZUL },
  { nome: "Marketplace", icone: "🛒", cor: COR_LARANJA },
  { nome: "Configurações", icone: "⚙️", cor: COR_ROXO },
];

const DASHBOARD_CARDS = [
  { label: "Produtores Ativos", valor: "1.247", icone: "👨‍🌾", cor: COR_PRIMARIA },
  { label: "Diagnósticos Hoje", valor: "38", icone: "🔬", cor: COR_LARANJA },
  { label: "Análises Pendentes", valor: "12", icone: "🧪", cor: COR_AZUL },
  { label: "Relatórios Emitidos", valor: "892", icone: "📄", cor: COR_AZUL },
  { label: "Alertas Críticos", valor: "3", icone: "⚠️", cor: COR_VERMELHO },
  { label: "Sensores Online", valor: "156", icone: "📡", cor: COR_PRIMARIA },
  { label: "Vendas do Mês", valor: "R$ 48.320", icone: "💰", cor: COR_CLARA },
  { label: "Certificações", valor: "24", icone: "🏆", cor: COR_ROXO },
];

const GRAFICOS = [
  { nome: "Diagnósticos por Mês", tipo: "Linha", desc: "Evolução mensal de diagnósticos realizados", cor: COR_AZUL },
  { nome: "Principais Problemas", tipo: "Pizza", desc: "Fungos, bactérias, pragas, deficiências, estresse", cor: COR_LARANJA },
  { nome: "Culturas Analisadas", tipo: "Barra", desc: "Soja, milho, feijão, tomate, mandioca, trigo", cor: COR_PRIMARIA },
  { nome: "Produtividade por Região", tipo: "Barra", desc: "Comparativo por estado/região do Brasil", cor: COR_CLARA },
  { nome: "Vendas por Categoria", tipo: "Pizza", desc: "Sementes, insumos, serviços, equipamentos", cor: COR_ROXO },
  { nome: "Alertas por Gravidade", tipo: "Barra", desc: "Baixo, médio, alto, crítico por período", cor: COR_VERMELHO },
];

const COMPONENTES = [
  { nome: "Button", desc: "Primário, secundário, destrutivo, loading, disabled", icone: "🔘" },
  { nome: "Input", desc: "Texto, número, senha, busca, com máscara", icone: "📝" },
  { nome: "Select", desc: "Dropdown simples e multi-seleção com busca", icone: "▼" },
  { nome: "Modal", desc: "Confirmação, formulário, visualização de imagem", icone: "🪟" },
  { nome: "Table", desc: "Ordenação, paginação, seleção, exportação", icone: "📋" },
  { nome: "Card", desc: "Indicador, resumo, ação rápida, gráfico inline", icone: "🃏" },
  { nome: "Badge", desc: "Status, gravidade, tipo, prioridade com cores", icone: "🏷" },
  { nome: "Chart", desc: "Linha, barra, pizza via Recharts (responsivo)", icone: "📊" },
  { nome: "FileUpload", desc: "Drag & drop, preview, progresso, validação", icone: "📁" },
  { nome: "ImagePreview", desc: "Zoom, galeria, comparação antes/depois", icone: "🖼" },
  { nome: "StatusTag", desc: "Pendente, ativo, aprovado, rejeitado, crítico", icone: "🔖" },
  { nome: "ConfirmDialog", desc: "Confirmação de ações destrutivas com texto", icone: "⚠️" },
  { nome: "Pagination", desc: "Navegação de páginas com tamanho configurável", icone: "📄" },
];

const PERMISSOES = [
  {
    perfil: "Administrador",
    icone: "👑",
    cor: COR_VERMELHO,
    acesso: "Total — todos os módulos, configurações e dados",
    modulos: ["Dashboard", "Produtores", "Diagnósticos", "Análises", "Relatórios", "Pragas/Doenças", "Materiais", "Sensores", "Marketplace", "Configurações"],
  },
  {
    perfil: "Técnico",
    icone: "🔬",
    cor: COR_AZUL,
    acesso: "Operacional — análise, revisão e emissão de laudos",
    modulos: ["Produtores", "Diagnósticos", "Análises", "Relatórios", "Pragas/Doenças", "Materiais"],
  },
  {
    perfil: "Parceiro",
    icone: "🤝",
    cor: COR_LARANJA,
    acesso: "Limitado — programas, certificações e marketplace",
    modulos: ["Programas", "Certificações", "Marketplace", "Relatórios autorizados"],
  },
  {
    perfil: "Laboratório",
    icone: "🧪",
    cor: COR_ROXO,
    acesso: "Especializado — análises, laudos e amostras",
    modulos: ["Análises", "Laudos", "Amostras", "Certificados"],
  },
];

const FLUXO_REVISAO = [
  { icone: "📱", texto: "Produtor envia foto pelo app mobile", cor: COR_PRIMARIA },
  { icone: "🤖", texto: "IA analisa e gera resultado preliminar", cor: COR_AZUL },
  { icone: "🔔", texto: "Técnico recebe notificação no painel web", cor: COR_LARANJA },
  { icone: "🔬", texto: "Técnico revisa imagem e recomendação da IA", cor: COR_AZUL },
  { icone: "✅", texto: "Técnico aprova ou corrige o diagnóstico", cor: COR_PRIMARIA },
  { icone: "📄", texto: "Sistema gera relatório técnico em PDF", cor: COR_AZUL },
  { icone: "📲", texto: "Produtor recebe notificação push com resultado", cor: COR_PRIMARIA },
];

export default function WebAdminScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("stack");
  const [telaExpandida, setTelaExpandida] = useState<string | null>(null);
  const [perfilExpandido, setPerfilExpandido] = useState<string | null>(null);

  const abas: { id: Aba; label: string }[] = [
    { id: "stack", label: "Stack" },
    { id: "telas", label: "Telas" },
    { id: "dashboard", label: "Dashboard" },
    { id: "componentes", label: "Comp." },
    { id: "permissoes", label: "Acesso" },
    { id: "fluxo", label: "Fluxo" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COR_AZUL }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🖥 Frontend Web Admin</Text>
          <Text style={styles.headerSubtitle}>AFU Etapa 9 · Next.js 14 · React · TypeScript · Tailwind</Text>
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
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: COR_AZUL, borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? COR_AZUL : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <AfuStackBanner note="Plano Next.js admin abaixo é referência. O admin MVP atual roda no mesmo app Expo web + Express/tRPC." />

        {/* ─── STACK ─── */}
        {abaAtiva === "stack" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_AZUL }]}>
              <Text style={styles.infoTitle}>Stack Tecnológica</Text>
              <Text style={styles.infoSubtitle}>Next.js 14 · React 18 · TypeScript · 10 bibliotecas</Text>
            </View>

            {/* Tecnologias */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Tecnologias ({STACK.length})</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {STACK.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.stackRow,
                      idx < STACK.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.stackIcone, { backgroundColor: item.cor + "20" }]}>
                      <Text style={{ fontSize: 14, color: item.cor, fontWeight: "800" }}>{item.icone}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stackNome, { color: item.cor }]}>{item.nome}</Text>
                      <Text style={[styles.stackDesc, { color: colors.muted }]}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Estrutura de pastas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Estrutura apps/web-admin/</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {ESTRUTURA.map((p, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pastaRow,
                      idx < ESTRUTURA.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <Text style={[styles.pastaCaminho, { color: COR_AZUL }]}>{p.path}</Text>
                    <Text style={[styles.pastaDesc, { color: colors.muted }]}>{p.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Menu lateral mockup */}
            <View style={[styles.card, { backgroundColor: "#0D1B2A", padding: 16 }]}>
              <Text style={{ color: "#90CAF9", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Mockup — Menu Lateral do Painel
              </Text>
              <View style={[styles.menuMockup, { backgroundColor: "#132338", borderColor: "#1E3A5F" }]}>
                <View style={[styles.menuLogo, { borderBottomColor: "#1E3A5F" }]}>
                  <Text style={{ fontSize: 18 }}>🌱</Text>
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>AFU Admin</Text>
                </View>
                {MENU_LATERAL.slice(0, 6).map((item, idx) => (
                  <View key={idx} style={[styles.menuItem, idx === 0 && { backgroundColor: COR_AZUL + "30" }]}>
                    <Text style={{ fontSize: 14 }}>{item.icone}</Text>
                    <Text style={[styles.menuItemText, { color: idx === 0 ? "#90CAF9" : "#8899AA" }]}>{item.nome}</Text>
                  </View>
                ))}
                <Text style={{ color: "#445566", fontSize: 11, marginTop: 6, marginLeft: 12 }}>+ 6 mais...</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── TELAS ─── */}
        {abaAtiva === "telas" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_AZUL }]}>
              <Text style={styles.infoTitle}>12 Telas do Painel Web</Text>
              <Text style={styles.infoSubtitle}>Login · Dashboard · Produtores · Diagnósticos · e mais</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Telas", valor: "12", cor: COR_AZUL },
                { label: "Módulos", valor: "10", cor: COR_PRIMARIA },
                { label: "Menu", valor: "12", cor: COR_LARANJA },
                { label: "Perfis", valor: "4", cor: COR_ROXO },
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

        {/* ─── DASHBOARD ─── */}
        {abaAtiva === "dashboard" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_AZUL }]}>
              <Text style={styles.infoTitle}>Dashboard Geral</Text>
              <Text style={styles.infoSubtitle}>8 cards de indicadores + 6 gráficos Recharts</Text>
            </View>

            {/* Cards de indicadores */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cards de Indicadores</Text>
              <View style={styles.cardsGrid}>
                {DASHBOARD_CARDS.map((card, idx) => (
                  <View key={idx} style={[styles.dashCard, { backgroundColor: card.cor + "12", borderColor: card.cor + "30" }]}>
                    <Text style={{ fontSize: 22 }}>{card.icone}</Text>
                    <Text style={[styles.dashValor, { color: card.cor }]}>{card.valor}</Text>
                    <Text style={[styles.dashLabel, { color: colors.muted }]}>{card.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Gráficos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Gráficos Recharts ({GRAFICOS.length})</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {GRAFICOS.map((g, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.graficoRow,
                      idx < GRAFICOS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.graficoBadge, { backgroundColor: g.cor }]}>
                      <Text style={styles.graficoBadgeText}>{g.tipo}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.graficoNome, { color: colors.foreground }]}>{g.nome}</Text>
                      <Text style={[styles.graficoDesc, { color: colors.muted }]}>{g.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Barra superior mockup */}
            <View style={[styles.card, { backgroundColor: "#0D1B2A", padding: 16 }]}>
              <Text style={{ color: "#90CAF9", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Mockup — Barra Superior do Painel
              </Text>
              <View style={[styles.topBarMockup, { backgroundColor: "#132338", borderColor: "#1E3A5F" }]}>
                <View style={[styles.topBarSearch, { backgroundColor: "#1E3A5F" }]}>
                  <Text style={{ color: "#445566", fontSize: 12 }}>🔍  Busca global...</Text>
                </View>
                <View style={styles.topBarActions}>
                  <View style={[styles.topBarBadge, { backgroundColor: COR_VERMELHO }]}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>3</Text>
                  </View>
                  <Text style={{ fontSize: 16 }}>🔔</Text>
                  <View style={[styles.topBarAvatar, { backgroundColor: COR_AZUL }]}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>AD</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── COMPONENTES ─── */}
        {abaAtiva === "componentes" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_AZUL }]}>
              <Text style={styles.infoTitle}>13 Componentes Reutilizáveis</Text>
              <Text style={styles.infoSubtitle}>Button · Input · Table · Modal · Chart · e mais</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Biblioteca de Componentes</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {COMPONENTES.map((comp, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.compRow,
                      idx < COMPONENTES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.compIcone, { backgroundColor: COR_AZUL + "15" }]}>
                      <Text style={{ fontSize: 18 }}>{comp.icone}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.compNome, { color: COR_AZUL }]}>{comp.nome}</Text>
                      <Text style={[styles.compDesc, { color: colors.muted }]}>{comp.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Preview de componentes */}
            <View style={[styles.card, { backgroundColor: "#0D1B2A", padding: 16 }]}>
              <Text style={{ color: "#90CAF9", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Preview — Componentes Visuais
              </Text>
              <View style={{ gap: 10 }}>
                {/* Buttons */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={[styles.previewBtn, { backgroundColor: COR_AZUL }]}>
                    <Text style={styles.previewBtnText}>Primário</Text>
                  </View>
                  <View style={[styles.previewBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: COR_AZUL }]}>
                    <Text style={[styles.previewBtnText, { color: COR_AZUL }]}>Secundário</Text>
                  </View>
                  <View style={[styles.previewBtn, { backgroundColor: COR_VERMELHO }]}>
                    <Text style={styles.previewBtnText}>Excluir</Text>
                  </View>
                </View>
                {/* Badges */}
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { label: "Ativo", cor: COR_PRIMARIA },
                    { label: "Pendente", cor: COR_LARANJA },
                    { label: "Aprovado", cor: COR_AZUL },
                    { label: "Crítico", cor: COR_VERMELHO },
                  ].map((b) => (
                    <View key={b.label} style={[styles.previewBadge, { backgroundColor: b.cor + "25", borderColor: b.cor + "50" }]}>
                      <Text style={[styles.previewBadgeText, { color: b.cor }]}>{b.label}</Text>
                    </View>
                  ))}
                </View>
                {/* Table row */}
                <View style={[styles.previewTableRow, { backgroundColor: "#132338", borderColor: "#1E3A5F" }]}>
                  <Text style={{ color: "#90CAF9", fontSize: 11, flex: 1 }}>João Silva</Text>
                  <Text style={{ color: "#8899AA", fontSize: 11, flex: 1 }}>MG · 150 ha</Text>
                  <View style={[styles.previewBadge, { backgroundColor: COR_PRIMARIA + "25", borderColor: COR_PRIMARIA + "50" }]}>
                    <Text style={[styles.previewBadgeText, { color: COR_PRIMARIA }]}>Ativo</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── PERMISSÕES ─── */}
        {abaAtiva === "permissoes" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_AZUL }]}>
              <Text style={styles.infoTitle}>Permissões por Perfil</Text>
              <Text style={styles.infoSubtitle}>Admin · Técnico · Parceiro · Laboratório</Text>
            </View>

            {PERMISSOES.map((p) => (
              <View key={p.perfil} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.perfilHeader}
                  onPress={() => setPerfilExpandido(perfilExpandido === p.perfil ? null : p.perfil)}
                >
                  <View style={[styles.perfilIcone, { backgroundColor: p.cor + "20" }]}>
                    <Text style={{ fontSize: 24 }}>{p.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.perfilNome, { color: p.cor }]}>{p.perfil}</Text>
                    <Text style={[styles.perfilAcesso, { color: colors.muted }]}>{p.acesso}</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {perfilExpandido === p.perfil ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {perfilExpandido === p.perfil && (
                  <View style={[styles.perfilBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.perfilModulosTitle, { color: colors.foreground }]}>Módulos com acesso:</Text>
                    <View style={styles.perfilModulosGrid}>
                      {p.modulos.map((m, idx) => (
                        <View key={idx} style={[styles.perfilModuloBadge, { backgroundColor: p.cor + "15", borderColor: p.cor + "40" }]}>
                          <Text style={[styles.perfilModuloText, { color: p.cor }]}>✓ {m}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Matriz resumida */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Matriz de Acesso Resumida</Text>
              <View style={{ marginTop: 12, gap: 6 }}>
                {[
                  { modulo: "Dashboard", admin: true, tecnico: true, parceiro: false, lab: false },
                  { modulo: "Diagnósticos", admin: true, tecnico: true, parceiro: false, lab: false },
                  { modulo: "Análises", admin: true, tecnico: true, parceiro: false, lab: true },
                  { modulo: "Relatórios", admin: true, tecnico: true, parceiro: true, lab: true },
                  { modulo: "Marketplace", admin: true, tecnico: false, parceiro: true, lab: false },
                  { modulo: "Configurações", admin: true, tecnico: false, parceiro: false, lab: false },
                ].map((row, idx) => (
                  <View key={idx} style={[styles.matrizRow, { borderBottomColor: colors.border, borderBottomWidth: idx < 5 ? StyleSheet.hairlineWidth : 0 }]}>
                    <Text style={[styles.matrizModulo, { color: colors.foreground }]}>{row.modulo}</Text>
                    {[row.admin, row.tecnico, row.parceiro, row.lab].map((ok, i) => (
                      <Text key={i} style={[styles.matrizCell, { color: ok ? COR_PRIMARIA : COR_VERMELHO }]}>
                        {ok ? "✓" : "✗"}
                      </Text>
                    ))}
                  </View>
                ))}
                <View style={styles.matrizLegenda}>
                  {["Admin", "Técnico", "Parceiro", "Lab"].map((l, i) => (
                    <Text key={i} style={[styles.matrizLegendaText, { color: colors.muted }]}>{l}</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── FLUXO ─── */}
        {abaAtiva === "fluxo" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_AZUL }]}>
              <Text style={styles.infoTitle}>Fluxo de Revisão Técnica</Text>
              <Text style={styles.infoSubtitle}>Produtor → IA → Técnico → Aprovação → Relatório → Notificação</Text>
            </View>

            {/* Fluxo visual */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Etapas do Processo</Text>
              <View style={{ marginTop: 12, gap: 0 }}>
                {FLUXO_REVISAO.map((step, idx) => (
                  <View key={idx} style={styles.fluxoRow}>
                    <View style={{ alignItems: "center", width: 48 }}>
                      <View style={[styles.fluxoCircle, { backgroundColor: step.cor }]}>
                        <Text style={{ fontSize: 20 }}>{step.icone}</Text>
                      </View>
                      {idx < FLUXO_REVISAO.length - 1 && (
                        <View style={[styles.fluxoLinha, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: idx < FLUXO_REVISAO.length - 1 ? 16 : 0 }}>
                      <View style={styles.fluxoStepRow}>
                        <View style={[styles.fluxoNumBadge, { backgroundColor: step.cor }]}>
                          <Text style={styles.fluxoNumText}>{idx + 1}</Text>
                        </View>
                        <Text style={[styles.fluxoTexto, { color: colors.foreground }]}>{step.texto}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Responsabilidades */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Responsabilidades por Ator</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { ator: "Produtor (App Mobile)", cor: COR_PRIMARIA, acoes: ["Tira foto da planta", "Seleciona cultura e parte afetada", "Recebe resultado e notificação"] },
                  { ator: "IA (Servidor)", cor: COR_AZUL, acoes: ["Analisa imagem com modelo multimodal", "Gera diagnóstico preliminar", "Calcula confiança e gravidade"] },
                  { ator: "Técnico (Painel Web)", cor: COR_LARANJA, acoes: ["Revisa resultado da IA", "Adiciona parecer técnico", "Aprova ou corrige diagnóstico", "Gera relatório final"] },
                ].map((a, idx) => (
                  <View key={idx} style={[styles.atorCard, { backgroundColor: a.cor + "10", borderColor: a.cor + "30" }]}>
                    <Text style={[styles.atorNome, { color: a.cor }]}>{a.ator}</Text>
                    {a.acoes.map((acao, i) => (
                      <View key={i} style={styles.atorAcaoRow}>
                        <View style={[styles.atorDot, { backgroundColor: a.cor }]} />
                        <Text style={[styles.atorAcaoText, { color: colors.foreground }]}>{acao}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* SLA */}
            <View style={[styles.card, { backgroundColor: "#0D1B2A", padding: 16 }]}>
              <Text style={{ color: "#90CAF9", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                SLA — Tempo de Resposta
              </Text>
              {[
                { etapa: "IA gera resultado", tempo: "< 30 segundos", cor: COR_PRIMARIA },
                { etapa: "Técnico recebe notificação", tempo: "< 1 minuto", cor: COR_AZUL },
                { etapa: "Revisão técnica", tempo: "< 4 horas (úteis)", cor: COR_LARANJA },
                { etapa: "Relatório gerado", tempo: "< 2 minutos após aprovação", cor: COR_PRIMARIA },
                { etapa: "Produtor notificado", tempo: "< 30 segundos após relatório", cor: COR_AZUL },
              ].map((s, idx) => (
                <View key={idx} style={[styles.slaRow, { borderBottomColor: "#1E3A5F", borderBottomWidth: idx < 4 ? StyleSheet.hairlineWidth : 0 }]}>
                  <Text style={{ color: "#8899AA", fontSize: 12, flex: 1 }}>{s.etapa}</Text>
                  <View style={[styles.slaBadge, { backgroundColor: s.cor }]}>
                    <Text style={styles.slaBadgeText}>{s.tempo}</Text>
                  </View>
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#BBDEFB", fontSize: 11 },
  tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  infoCard: { borderRadius: 12, padding: 16 },
  infoTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoSubtitle: { color: "#BBDEFB", fontSize: 12, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  cardHeader: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  stackRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  stackIcone: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stackNome: { fontSize: 13, fontWeight: "700" },
  stackDesc: { fontSize: 11, marginTop: 2 },
  pastaRow: { paddingVertical: 8 },
  pastaCaminho: { fontSize: 12, fontFamily: "monospace", fontWeight: "700" },
  pastaDesc: { fontSize: 11, marginTop: 2 },
  menuMockup: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  menuLogo: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  menuItemText: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center" },
  statValor: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  telaHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  telaIcone: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  telaNome: { fontSize: 14, fontWeight: "700" },
  telaCount: { fontSize: 12, marginTop: 2 },
  telaBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  telaElRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  telaElDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  telaElText: { fontSize: 13, flex: 1 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  dashCard: { width: "47%", borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  dashValor: { fontSize: 18, fontWeight: "800" },
  dashLabel: { fontSize: 10, textAlign: "center" },
  graficoRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 10 },
  graficoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  graficoBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  graficoNome: { fontSize: 13, fontWeight: "700" },
  graficoDesc: { fontSize: 11, marginTop: 2 },
  topBarMockup: { borderRadius: 10, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  topBarSearch: { flex: 1, padding: 8, borderRadius: 8 },
  topBarActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  topBarBadge: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", position: "absolute", right: 28, top: -4 },
  topBarAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  compRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 12 },
  compIcone: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  compNome: { fontSize: 13, fontWeight: "700" },
  compDesc: { fontSize: 11, marginTop: 2 },
  previewBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  previewBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  previewBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  previewBadgeText: { fontSize: 10, fontWeight: "700" },
  previewTableRow: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 8, borderWidth: 1 },
  perfilHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  perfilIcone: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  perfilNome: { fontSize: 15, fontWeight: "700" },
  perfilAcesso: { fontSize: 11, marginTop: 2 },
  perfilBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14 },
  perfilModulosTitle: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  perfilModulosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  perfilModuloBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  perfilModuloText: { fontSize: 11, fontWeight: "700" },
  matrizRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  matrizModulo: { flex: 1, fontSize: 12 },
  matrizCell: { width: 30, textAlign: "center", fontSize: 14, fontWeight: "800" },
  matrizLegenda: { flexDirection: "row", marginTop: 8 },
  matrizLegendaText: { width: 30, textAlign: "center", fontSize: 9, marginLeft: "auto" },
  fluxoRow: { flexDirection: "row", gap: 12 },
  fluxoCircle: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  fluxoLinha: { width: 2, flex: 1, minHeight: 12, alignSelf: "center" },
  fluxoStepRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  fluxoNumBadge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  fluxoNumText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  fluxoTexto: { fontSize: 13, flex: 1, lineHeight: 20 },
  atorCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  atorNome: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  atorAcaoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 4 },
  atorDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  atorAcaoText: { fontSize: 12, flex: 1 },
  slaRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
  slaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  slaBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
