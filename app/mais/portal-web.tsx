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

type Aba = "stack" | "telas" | "layout" | "comparacao" | "pwa";

const COR_PRIMARIA = "#2E7D32";
const COR_CLARA = "#66BB6A";
const COR_AZUL = "#1565C0";
const COR_LARANJA = "#EF6C00";
const COR_ROXO = "#6A1B9A";
const COR_TEAL = "#00695C";

const STACK_ITEMS = [
  { nome: "Next.js 14", desc: "App Router, SSR/SSG, Server Components", cor: COR_AZUL, icone: "▲" },
  { nome: "React 18", desc: "Componentes funcionais com hooks", cor: COR_AZUL, icone: "⚛" },
  { nome: "TypeScript", desc: "Tipagem estática compartilhada com o mobile", cor: COR_AZUL, icone: "TS" },
  { nome: "Tailwind CSS", desc: "Estilização responsiva utility-first", cor: COR_PRIMARIA, icone: "🎨" },
  { nome: "React Query", desc: "Cache e sincronização de dados do servidor", cor: COR_LARANJA, icone: "🔄" },
  { nome: "Axios", desc: "Requisições HTTP para a API Central", cor: COR_AZUL, icone: "📡" },
  { nome: "PWA", desc: "Progressive Web App: offline, instalável, notificações", cor: COR_TEAL, icone: "📲" },
];

const TELAS = [
  {
    nome: "Login e Cadastro",
    icone: "🔐",
    cor: COR_AZUL,
    campos: ["Nome completo", "Telefone", "E-mail", "Senha", "Região (estado/município)", "Tipo de produtor (familiar/comercial/orgânico)"],
  },
  {
    nome: "Painel Inicial",
    icone: "🏠",
    cor: COR_PRIMARIA,
    campos: ["Card: Analisar Planta", "Card: Minhas Propriedades", "Card: Minhas Culturas", "Card: Relatórios", "Card: Calendário", "Card: Materiais Didáticos", "Card: Suporte"],
  },
  {
    nome: "Minhas Propriedades",
    icone: "🏡",
    cor: COR_PRIMARIA,
    campos: ["Cadastrar nova propriedade", "Editar propriedade existente", "Visualizar culturas por propriedade", "Consultar histórico de análises"],
  },
  {
    nome: "Minhas Culturas",
    icone: "🌾",
    cor: COR_CLARA,
    campos: ["Cadastrar nova cultura", "Informar fase atual (plantio/crescimento/colheita)", "Registrar data de plantio", "Acompanhar previsão de colheita"],
  },
  {
    nome: "Diagnóstico por Imagem",
    icone: "🔬",
    cor: COR_LARANJA,
    campos: ["Upload de foto (câmera ou galeria)", "Selecionar cultura afetada", "Selecionar parte da planta", "Informar sintomas observados", "Visualizar resultado da IA"],
  },
  {
    nome: "Resultados e Relatórios",
    icone: "📄",
    cor: COR_AZUL,
    campos: ["Diagnósticos anteriores", "Análises fitotécnicas", "Relatórios PDF para download", "Certificados emitidos", "Recomendações técnicas"],
  },
  {
    nome: "Calendário Agrícola",
    icone: "📅",
    cor: COR_TEAL,
    campos: ["Lembrete: Irrigação", "Lembrete: Adubação", "Lembrete: Poda", "Lembrete: Pulverização", "Lembrete: Nova análise", "Lembrete: Colheita"],
  },
  {
    nome: "Materiais Didáticos",
    icone: "📚",
    cor: COR_PRIMARIA,
    campos: ["Apostilas técnicas (PDF)", "Vídeos tutoriais", "Áudios explicativos", "Guias rápidos", "Checklists agrícolas"],
  },
  {
    nome: "Suporte Técnico",
    icone: "💬",
    cor: COR_ROXO,
    campos: ["Chat com técnico", "Abertura de chamado", "Agendamento de visita técnica", "Envio de dúvidas por formulário"],
  },
];

const MENU_LATERAL = [
  { nome: "Início", icone: "🏠", cor: COR_PRIMARIA },
  { nome: "Propriedades", icone: "🏡", cor: COR_PRIMARIA },
  { nome: "Culturas", icone: "🌾", cor: COR_CLARA },
  { nome: "Diagnóstico IA", icone: "🔬", cor: COR_LARANJA },
  { nome: "Relatórios", icone: "📄", cor: COR_AZUL },
  { nome: "Calendário", icone: "📅", cor: COR_TEAL },
  { nome: "Materiais", icone: "📚", cor: COR_PRIMARIA },
  { nome: "Suporte", icone: "💬", cor: COR_ROXO },
  { nome: "Perfil", icone: "👤", cor: COR_AZUL },
];

const COMPARACAO = [
  {
    aspecto: "Tirar fotos",
    mobile: { valor: "Excelente", nota: 5, desc: "Câmera nativa integrada" },
    web: { valor: "Bom", nota: 3, desc: "Upload de arquivo ou câmera web" },
  },
  {
    aspecto: "Notificações push",
    mobile: { valor: "Excelente", nota: 5, desc: "Notificações nativas do SO" },
    web: { valor: "Bom", nota: 3, desc: "Web Push via Service Worker" },
  },
  {
    aspecto: "Uso em campo",
    mobile: { valor: "Excelente", nota: 5, desc: "Portátil, GPS, câmera" },
    web: { valor: "Regular", nota: 2, desc: "Depende de conexão estável" },
  },
  {
    aspecto: "Acesso offline",
    mobile: { valor: "Excelente", nota: 5, desc: "AsyncStorage + sync automático" },
    web: { valor: "Bom", nota: 3, desc: "Service Worker + cache PWA" },
  },
  {
    aspecto: "Visualizar relatórios",
    mobile: { valor: "Bom", nota: 3, desc: "Tela pequena, PDF limitado" },
    web: { valor: "Excelente", nota: 5, desc: "Tela grande, PDF nativo" },
  },
  {
    aspecto: "Preencher cadastros",
    mobile: { valor: "Regular", nota: 2, desc: "Teclado virtual limitado" },
    web: { valor: "Excelente", nota: 5, desc: "Teclado físico, formulários amplos" },
  },
  {
    aspecto: "Acessar materiais",
    mobile: { valor: "Bom", nota: 3, desc: "Vídeos e PDFs no app" },
    web: { valor: "Excelente", nota: 5, desc: "Tela grande, melhor experiência" },
  },
  {
    aspecto: "Histórico completo",
    mobile: { valor: "Bom", nota: 3, desc: "Lista paginada no app" },
    web: { valor: "Excelente", nota: 5, desc: "Tabelas, filtros, exportação" },
  },
];

const PWA_RECURSOS = [
  {
    recurso: "Instalação no dispositivo",
    desc: "Ícone na tela inicial do celular ou desktop, sem app store",
    icone: "📲",
    cor: COR_TEAL,
  },
  {
    recurso: "Acesso rápido",
    desc: "Abre direto como app, sem barra do navegador",
    icone: "⚡",
    cor: COR_LARANJA,
  },
  {
    recurso: "Notificações push",
    desc: "Alertas de calendário e diagnósticos via Web Push API",
    icone: "🔔",
    cor: COR_AZUL,
  },
  {
    recurso: "Cache de materiais",
    desc: "Apostilas e guias salvos localmente via Service Worker",
    icone: "💾",
    cor: COR_PRIMARIA,
  },
  {
    recurso: "Funcionamento offline parcial",
    desc: "Visualizar histórico e materiais sem internet",
    icone: "📡",
    cor: COR_ROXO,
  },
];

const PWA_MANIFEST = [
  { chave: "name", valor: '"AFU Planta Saudável"' },
  { chave: "short_name", valor: '"AFU"' },
  { chave: "display", valor: '"standalone"' },
  { chave: "theme_color", valor: '"#2E7D32"' },
  { chave: "background_color", valor: '"#F5F5F5"' },
  { chave: "start_url", valor: '"/painel"' },
  { chave: "icons", valor: "[192x192, 512x512 PNG]" },
];

export default function PortalWebScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("stack");
  const [telaExpandida, setTelaExpandida] = useState<string | null>(null);

  const abas: { id: Aba; label: string }[] = [
    { id: "stack", label: "Stack" },
    { id: "telas", label: "Telas" },
    { id: "layout", label: "Layout" },
    { id: "comparacao", label: "App vs Web" },
    { id: "pwa", label: "PWA" },
  ];

  const renderEstrelas = (nota: number, cor: string) => (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 10, color: i <= nota ? cor : "#ccc" }}>★</Text>
      ))}
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COR_TEAL }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🌐 Portal Web do Produtor</Text>
          <Text style={styles.headerSubtitle}>AFU Etapa 10 · Next.js 14 · PWA · TypeScript · Tailwind</Text>
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
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: COR_TEAL, borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? COR_TEAL : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <AfuStackBanner note="Portal do produtor entregue via Expo web (não Next.js separado). Conteúdo abaixo é plano histórico." />

        {/* ─── STACK ─── */}
        {abaAtiva === "stack" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_TEAL }]}>
              <Text style={styles.infoTitle}>Stack Tecnológica</Text>
              <Text style={styles.infoSubtitle}>Next.js 14 · React 18 · TypeScript · Tailwind · PWA</Text>
            </View>

            {/* Tecnologias */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Tecnologias ({STACK_ITEMS.length})</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {STACK_ITEMS.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.stackRow,
                      idx < STACK_ITEMS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.stackIcone, { backgroundColor: item.cor + "20" }]}>
                      <Text style={{ fontSize: 13, color: item.cor, fontWeight: "800" }}>{item.icone}</Text>
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
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Estrutura apps/web-produtor/</Text>
              </View>
              <View style={{ padding: 14, gap: 0 }}>
                {[
                  { path: "src/app/", desc: "Rotas Next.js (login, painel, propriedades...)" },
                  { path: "src/components/", desc: "Componentes reutilizáveis (Button, Card, Form)" },
                  { path: "src/modules/", desc: "Módulos por domínio (diagnóstico, culturas...)" },
                  { path: "src/services/", desc: "Chamadas à API Central (auth, análise, relatório)" },
                  { path: "src/hooks/", desc: "Custom hooks (useAuth, useDiagnostico, useCalendario)" },
                  { path: "public/manifest.json", desc: "Configuração PWA (ícones, cores, display)" },
                  { path: "public/sw.js", desc: "Service Worker (cache, offline, push)" },
                ].map((p, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pastaRow,
                      idx < 6 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <Text style={[styles.pastaCaminho, { color: COR_TEAL }]}>{p.path}</Text>
                    <Text style={[styles.pastaDesc, { color: colors.muted }]}>{p.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Mockup do portal */}
            <View style={[styles.card, { backgroundColor: "#0A1F1A", padding: 16 }]}>
              <Text style={{ color: "#80CBC4", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Mockup — Portal Web do Produtor
              </Text>
              <View style={[styles.portalMockup, { backgroundColor: "#0F2A24", borderColor: "#1A4A3A" }]}>
                {/* Top bar */}
                <View style={[styles.portalTopBar, { backgroundColor: COR_TEAL, borderBottomColor: "#1A4A3A" }]}>
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>🌱 AFU Planta Saudável</Text>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <Text style={{ color: "#B2DFDB", fontSize: 10 }}>🔍</Text>
                    <Text style={{ color: "#B2DFDB", fontSize: 10 }}>🔔</Text>
                    <View style={[styles.portalAvatar, { backgroundColor: "#004D40" }]}>
                      <Text style={{ color: "#80CBC4", fontSize: 9, fontWeight: "800" }}>JP</Text>
                    </View>
                  </View>
                </View>
                {/* Content */}
                <View style={{ flexDirection: "row" }}>
                  {/* Sidebar */}
                  <View style={[styles.portalSidebar, { backgroundColor: "#0A1F1A", borderRightColor: "#1A4A3A" }]}>
                    {MENU_LATERAL.slice(0, 5).map((item, idx) => (
                      <View key={idx} style={[styles.portalMenuItem, idx === 0 && { backgroundColor: COR_TEAL + "30" }]}>
                        <Text style={{ fontSize: 10 }}>{item.icone}</Text>
                        <Text style={[styles.portalMenuText, { color: idx === 0 ? "#80CBC4" : "#445566" }]}>{item.nome}</Text>
                      </View>
                    ))}
                    <Text style={{ color: "#2A4A3A", fontSize: 9, marginLeft: 8, marginTop: 4 }}>+ 4 mais...</Text>
                  </View>
                  {/* Main content */}
                  <View style={{ flex: 1, padding: 8 }}>
                    <Text style={{ color: "#80CBC4", fontSize: 9, fontWeight: "700", marginBottom: 6 }}>Painel Inicial</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                      {["🔬 Diagnóstico", "🏡 Propriedades", "🌾 Culturas"].map((c, i) => (
                        <View key={i} style={[styles.portalCard, { backgroundColor: "#1A4A3A", borderColor: "#2A5A4A" }]}>
                          <Text style={{ color: "#80CBC4", fontSize: 8 }}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── TELAS ─── */}
        {abaAtiva === "telas" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_TEAL }]}>
              <Text style={styles.infoTitle}>9 Telas do Portal Web</Text>
              <Text style={styles.infoSubtitle}>Login · Painel · Propriedades · Diagnóstico · Suporte · e mais</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Telas", valor: "9", cor: COR_TEAL },
                { label: "Menu", valor: "9", cor: COR_PRIMARIA },
                { label: "Cards", valor: "7", cor: COR_LARANJA },
                { label: "PWA", valor: "5", cor: COR_ROXO },
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
                    <Text style={[styles.telaCount, { color: colors.muted }]}>{tela.campos.length} elementos</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {telaExpandida === tela.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {telaExpandida === tela.nome && (
                  <View style={[styles.telaBody, { borderTopColor: colors.border }]}>
                    {tela.campos.map((campo, idx) => (
                      <View key={idx} style={styles.telaElRow}>
                        <View style={[styles.telaElDot, { backgroundColor: tela.cor }]} />
                        <Text style={[styles.telaElText, { color: colors.foreground }]}>{campo}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── LAYOUT ─── */}
        {abaAtiva === "layout" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_TEAL }]}>
              <Text style={styles.infoTitle}>Layout do Portal</Text>
              <Text style={styles.infoSubtitle}>Menu lateral · Barra superior · Conteúdo principal</Text>
            </View>

            {/* Menu lateral */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Menu Lateral (9 itens)</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {MENU_LATERAL.map((item, idx) => (
                  <View key={idx} style={[styles.menuItemRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={[styles.menuItemIcone, { backgroundColor: item.cor + "20" }]}>
                      <Text style={{ fontSize: 18 }}>{item.icone}</Text>
                    </View>
                    <Text style={[styles.menuItemNome, { color: item.cor }]}>{item.nome}</Text>
                    <View style={[styles.menuNumBadge, { backgroundColor: item.cor }]}>
                      <Text style={styles.menuNumText}>{idx + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Barra superior */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Barra Superior</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { elemento: "Busca global", desc: "Pesquisar propriedades, culturas, diagnósticos", icone: "🔍" },
                  { elemento: "Notificações", desc: "Alertas de calendário, diagnósticos prontos", icone: "🔔" },
                  { elemento: "Status da conta", desc: "Nome do produtor e tipo de plano", icone: "👤" },
                  { elemento: "Botão Sair", desc: "Logout seguro com confirmação", icone: "🚪" },
                ].map((el, idx) => (
                  <View key={idx} style={[styles.barraRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 20 }}>{el.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.barraNome, { color: COR_TEAL }]}>{el.elemento}</Text>
                      <Text style={[styles.barraDesc, { color: colors.muted }]}>{el.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Layout responsivo */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Layout Responsivo</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { dispositivo: "Desktop (≥1280px)", layout: "Menu lateral fixo + conteúdo amplo", icone: "🖥" },
                  { dispositivo: "Tablet (768–1279px)", layout: "Menu lateral colapsável + grid 2 colunas", icone: "📱" },
                  { dispositivo: "Mobile (< 768px)", layout: "Menu hambúrguer + layout de 1 coluna", icone: "📲" },
                ].map((d, idx) => (
                  <View key={idx} style={[styles.dispositivoRow, { backgroundColor: COR_TEAL + "10", borderColor: COR_TEAL + "30" }]}>
                    <Text style={{ fontSize: 24 }}>{d.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dispositivoNome, { color: COR_TEAL }]}>{d.dispositivo}</Text>
                      <Text style={[styles.dispositivoLayout, { color: colors.muted }]}>{d.layout}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── COMPARAÇÃO APP vs WEB ─── */}
        {abaAtiva === "comparacao" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_TEAL }]}>
              <Text style={styles.infoTitle}>App Mobile vs. Portal Web</Text>
              <Text style={styles.infoSubtitle}>Quando usar cada plataforma</Text>
            </View>

            {/* Cabeçalho da comparação */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.compHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.compHeaderAspecto, { color: colors.muted }]}>Aspecto</Text>
                <View style={[styles.compHeaderCol, { backgroundColor: COR_PRIMARIA + "15" }]}>
                  <Text style={{ fontSize: 16 }}>📱</Text>
                  <Text style={[styles.compHeaderLabel, { color: COR_PRIMARIA }]}>Mobile</Text>
                </View>
                <View style={[styles.compHeaderCol, { backgroundColor: COR_TEAL + "15" }]}>
                  <Text style={{ fontSize: 16 }}>🌐</Text>
                  <Text style={[styles.compHeaderLabel, { color: COR_TEAL }]}>Web</Text>
                </View>
              </View>
              {COMPARACAO.map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.compRow,
                    idx < COMPARACAO.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={[styles.compAspecto, { color: colors.foreground }]}>{row.aspecto}</Text>
                  <View style={styles.compColuna}>
                    {renderEstrelas(row.mobile.nota, COR_PRIMARIA)}
                    <Text style={[styles.compValor, { color: COR_PRIMARIA }]}>{row.mobile.valor}</Text>
                  </View>
                  <View style={styles.compColuna}>
                    {renderEstrelas(row.web.nota, COR_TEAL)}
                    <Text style={[styles.compValor, { color: COR_TEAL }]}>{row.web.valor}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Recomendações */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quando Usar Cada Plataforma</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                <View style={[styles.recomCard, { backgroundColor: COR_PRIMARIA + "10", borderColor: COR_PRIMARIA + "30" }]}>
                  <Text style={[styles.recomTitulo, { color: COR_PRIMARIA }]}>📱 Prefira o App Mobile para:</Text>
                  {["Tirar fotos de plantas no campo", "Receber notificações em tempo real", "Usar em áreas rurais com sinal fraco", "Acesso rápido e offline"].map((item, i) => (
                    <View key={i} style={styles.recomItemRow}>
                      <Text style={{ color: COR_PRIMARIA, fontSize: 12 }}>✓</Text>
                      <Text style={[styles.recomItemText, { color: colors.foreground }]}>{item}</Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.recomCard, { backgroundColor: COR_TEAL + "10", borderColor: COR_TEAL + "30" }]}>
                  <Text style={[styles.recomTitulo, { color: COR_TEAL }]}>🌐 Prefira o Portal Web para:</Text>
                  {["Visualizar relatórios e laudos em PDF", "Preencher cadastros longos com teclado", "Acessar histórico completo com filtros", "Consultar materiais didáticos em tela grande"].map((item, i) => (
                    <View key={i} style={styles.recomItemRow}>
                      <Text style={{ color: COR_TEAL, fontSize: 12 }}>✓</Text>
                      <Text style={[styles.recomItemText, { color: colors.foreground }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── PWA ─── */}
        {abaAtiva === "pwa" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_TEAL }]}>
              <Text style={styles.infoTitle}>📲 Progressive Web App</Text>
              <Text style={styles.infoSubtitle}>Instalável · Offline · Notificações · Cache</Text>
            </View>

            {/* O que é PWA */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>O que é PWA?</Text>
              <Text style={[styles.pwaExplicacao, { color: colors.muted }]}>
                Progressive Web App (PWA) é uma tecnologia que permite que o portal web do AFU seja instalado no celular ou computador como se fosse um aplicativo nativo, sem precisar de app store. Usa Service Workers para cache e funcionalidade offline.
              </Text>
            </View>

            {/* Recursos PWA */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>5 Recursos PWA do AFU</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {PWA_RECURSOS.map((r, idx) => (
                  <View key={idx} style={[styles.pwaCard, { backgroundColor: r.cor + "10", borderColor: r.cor + "30" }]}>
                    <Text style={{ fontSize: 26 }}>{r.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pwaNome, { color: r.cor }]}>{r.recurso}</Text>
                      <Text style={[styles.pwaDesc, { color: colors.muted }]}>{r.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* manifest.json */}
            <View style={[styles.card, { backgroundColor: "#0A1F1A", padding: 16 }]}>
              <Text style={{ color: "#80CBC4", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                manifest.json — Configuração PWA
              </Text>
              <View style={[styles.codeBlock, { backgroundColor: "#0F2A24", borderColor: "#1A4A3A" }]}>
                <Text style={styles.codeLine}>{"{"}</Text>
                {PWA_MANIFEST.map((m, idx) => (
                  <Text key={idx} style={styles.codeLine}>
                    {"  "}
                    <Text style={{ color: "#80CBC4" }}>"{m.chave}"</Text>
                    <Text style={{ color: "#fff" }}>: </Text>
                    <Text style={{ color: "#A5D6A7" }}>{m.valor}</Text>
                    {idx < PWA_MANIFEST.length - 1 ? "," : ""}
                  </Text>
                ))}
                <Text style={styles.codeLine}>{"}"}</Text>
              </View>
            </View>

            {/* Como instalar */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Como Instalar o Portal</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { plataforma: "Android (Chrome)", passos: "Menu ⋮ → 'Adicionar à tela inicial'" },
                  { plataforma: "iPhone (Safari)", passos: "Botão compartilhar → 'Adicionar à Tela de Início'" },
                  { plataforma: "Desktop (Chrome/Edge)", passos: "Ícone ⊕ na barra de endereços → 'Instalar'" },
                ].map((p, idx) => (
                  <View key={idx} style={[styles.instalacaoRow, { backgroundColor: COR_TEAL + "10", borderColor: COR_TEAL + "30" }]}>
                    <Text style={[styles.instalacaoPlataforma, { color: COR_TEAL }]}>{p.plataforma}</Text>
                    <Text style={[styles.instalacaoPassos, { color: colors.muted }]}>{p.passos}</Text>
                  </View>
                ))}
              </View>
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
  headerSubtitle: { color: "#B2DFDB", fontSize: 11 },
  tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  infoCard: { borderRadius: 12, padding: 16 },
  infoTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoSubtitle: { color: "#B2DFDB", fontSize: 12, marginTop: 4 },
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
  portalMockup: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  portalTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  portalAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  portalSidebar: { width: 70, borderRightWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  portalMenuItem: { paddingHorizontal: 6, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 4 },
  portalMenuText: { fontSize: 8 },
  portalCard: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
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
  menuItemRow: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 10 },
  menuItemIcone: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuItemNome: { flex: 1, fontSize: 13, fontWeight: "700" },
  menuNumBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuNumText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  barraRow: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 10 },
  barraNome: { fontSize: 13, fontWeight: "700" },
  barraDesc: { fontSize: 11, marginTop: 2 },
  dispositivoRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, gap: 12 },
  dispositivoNome: { fontSize: 12, fontWeight: "700" },
  dispositivoLayout: { fontSize: 11, marginTop: 2 },
  compHeader: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  compHeaderAspecto: { flex: 1, fontSize: 11, fontWeight: "700" },
  compHeaderCol: { width: 80, alignItems: "center", padding: 6, borderRadius: 8, marginHorizontal: 2 },
  compHeaderLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  compRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 10 },
  compAspecto: { flex: 1, fontSize: 11 },
  compColuna: { width: 80, alignItems: "center", gap: 2 },
  compValor: { fontSize: 9, fontWeight: "700" },
  recomCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  recomTitulo: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  recomItemRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 },
  recomItemText: { fontSize: 12, flex: 1 },
  pwaExplicacao: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  pwaCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  pwaNome: { fontSize: 13, fontWeight: "700" },
  pwaDesc: { fontSize: 11, marginTop: 2 },
  codeBlock: { borderRadius: 10, borderWidth: 1, padding: 12 },
  codeLine: { color: "#fff", fontSize: 11, fontFamily: "monospace", lineHeight: 18 },
  instalacaoRow: { padding: 12, borderRadius: 10, borderWidth: 1 },
  instalacaoPlataforma: { fontSize: 13, fontWeight: "700" },
  instalacaoPassos: { fontSize: 12, marginTop: 4 },
});
