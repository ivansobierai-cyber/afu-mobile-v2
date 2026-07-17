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

type Aba = "stack" | "modulos" | "comunicacao" | "seguranca" | "hospedagem";

const STACK = [
  {
    categoria: "📱 Aplicativo Mobile",
    cor: "#2D6A4F",
    tecnologias: [
      { nome: "React Native", desc: "Framework cross-platform iOS/Android", icone: "⚛️" },
      { nome: "Expo SDK 54", desc: "Toolchain e runtime gerenciado", icone: "🚀" },
      { nome: "TypeScript", desc: "Tipagem estática e segurança de código", icone: "🔷" },
      { nome: "Expo Router", desc: "Navegação baseada em arquivos", icone: "🗺️" },
      { nome: "NativeWind v4", desc: "Tailwind CSS para React Native", icone: "🎨" },
      { nome: "tRPC", desc: "API type-safe cliente-servidor", icone: "🔗" },
    ],
  },
  {
    categoria: "🌐 Web Administrativo",
    cor: "#1565C0",
    tecnologias: [
      { nome: "Next.js 14", desc: "Framework React com SSR/SSG", icone: "▲" },
      { nome: "React 19", desc: "Biblioteca de interface de usuário", icone: "⚛️" },
      { nome: "TypeScript", desc: "Tipagem estática", icone: "🔷" },
      { nome: "Tailwind CSS", desc: "Framework CSS utilitário", icone: "🎨" },
    ],
  },
  {
    categoria: "⚙️ Backend",
    cor: "#6A1B9A",
    tecnologias: [
      { nome: "Node.js", desc: "Runtime JavaScript server-side", icone: "🟢" },
      { nome: "NestJS", desc: "Framework modular e escalável", icone: "🐱" },
      { nome: "Prisma ORM", desc: "ORM type-safe para PostgreSQL", icone: "🔺" },
      { nome: "tRPC / REST", desc: "Comunicação API type-safe", icone: "🔗" },
      { nome: "JWT + Refresh Token", desc: "Autenticação segura", icone: "🔑" },
    ],
  },
  {
    categoria: "🗄️ Banco de Dados",
    cor: "#E65100",
    tecnologias: [
      { nome: "PostgreSQL", desc: "Banco relacional robusto e escalável", icone: "🐘" },
      { nome: "Drizzle ORM", desc: "ORM type-safe (atual no MVP)", icone: "💧" },
      { nome: "Supabase", desc: "PostgreSQL gerenciado (MVP econômico)", icone: "⚡" },
    ],
  },
  {
    categoria: "☁️ Armazenamento",
    cor: "#00695C",
    tecnologias: [
      { nome: "AWS S3", desc: "Armazenamento de objetos escalável", icone: "🪣" },
      { nome: "Cloudflare R2", desc: "S3-compatível sem custo de egress", icone: "🌐" },
      { nome: "Firebase Storage", desc: "Alternativa para MVP", icone: "🔥" },
    ],
  },
  {
    categoria: "🤖 Inteligência Artificial",
    cor: "#1B4332",
    tecnologias: [
      { nome: "API de Visão Computacional", desc: "Análise de imagens de plantas", icone: "👁️" },
      { nome: "LLM Multimodal", desc: "Diagnóstico e recomendações (atual)", icone: "🧠" },
      { nome: "Modelo Próprio (futuro)", desc: "Treinado com imagens agrícolas", icone: "🌱" },
      { nome: "Banco de Imagens", desc: "Dataset de pragas e doenças", icone: "🖼️" },
    ],
  },
  {
    categoria: "📄 Relatórios PDF",
    cor: "#6B4226",
    tecnologias: [
      { nome: "Puppeteer", desc: "Geração de PDF via headless Chrome", icone: "🤖" },
      { nome: "PDFKit", desc: "Geração programática de PDFs", icone: "📋" },
    ],
  },
];

const MODULOS_BACKEND = [
  {
    nome: "AuthModule",
    icone: "🔐",
    cor: "#1565C0",
    responsabilidades: ["Login e cadastro", "Recuperação de senha", "Autenticação JWT", "Permissão por perfil", "MFA para administradores"],
  },
  {
    nome: "ProducersModule",
    icone: "🌾",
    cor: "#2D6A4F",
    responsabilidades: ["Gestão de produtores", "Propriedades rurais", "Culturas plantadas", "Histórico agrícola"],
  },
  {
    nome: "DiagnosisModule",
    icone: "🔬",
    cor: "#D4A017",
    responsabilidades: ["Envio de imagem", "Análise por IA", "Resultado do diagnóstico", "Revisão técnica"],
  },
  {
    nome: "AnalysisModule",
    icone: "🧪",
    cor: "#00695C",
    responsabilidades: ["Análises de solo", "Análises de água", "Análises de planta", "Recomendações técnicas"],
  },
  {
    nome: "ReportsModule",
    icone: "📄",
    cor: "#6B4226",
    responsabilidades: ["Geração de PDF", "Laudos técnicos", "Certificados", "Relatórios estatísticos"],
  },
  {
    nome: "MarketplaceModule",
    icone: "🛒",
    cor: "#E65100",
    responsabilidades: ["Gestão de produtos", "Pedidos", "Pagamentos", "Logística"],
  },
  {
    nome: "EducationModule",
    icone: "📚",
    cor: "#5C4033",
    responsabilidades: ["Materiais didáticos", "Vídeos educativos", "Apostilas e guias", "Treinamentos"],
  },
  {
    nome: "SensorsModule",
    icone: "📡",
    cor: "#6A1B9A",
    responsabilidades: ["Gestão de sensores IoT", "Leituras em tempo real", "Alertas automáticos", "Irrigação automática"],
  },
];

const COMUNICACAO = [
  {
    de: "📱 Mobile / 🌐 Web",
    para: "⚙️ API Backend",
    cor: "#2D6A4F",
    usos: ["Login e cadastro", "Envio de fotos", "Consulta de diagnósticos", "Histórico", "Relatórios", "Materiais didáticos"],
  },
  {
    de: "⚙️ API Backend",
    para: "🗄️ Banco de Dados",
    cor: "#1565C0",
    usos: ["Salvar usuários", "Salvar produtores", "Salvar propriedades", "Salvar diagnósticos", "Consultar histórico"],
  },
  {
    de: "⚙️ API Backend",
    para: "☁️ Armazenamento",
    cor: "#E65100",
    usos: ["Salvar imagens", "Salvar relatórios PDF", "Salvar materiais didáticos"],
  },
  {
    de: "⚙️ API Backend",
    para: "🤖 Módulo de IA",
    cor: "#D4A017",
    usos: ["Enviar imagem", "Receber diagnóstico", "Salvar resultado", "Gerar recomendação"],
  },
  {
    de: "⚙️ API Backend",
    para: "📡 Módulo IoT",
    cor: "#6A1B9A",
    usos: ["Receber leituras de sensores", "Gerar alertas", "Controlar irrigação"],
  },
];

const SEGURANCA = [
  { item: "Senha criptografada com bcrypt", icone: "🔒", nivel: "Essencial" },
  { item: "Autenticação JWT", icone: "🎫", nivel: "Essencial" },
  { item: "Refresh Token", icone: "🔄", nivel: "Essencial" },
  { item: "Permissões por tipo de usuário", icone: "👥", nivel: "Essencial" },
  { item: "Validação de dados com Zod", icone: "✅", nivel: "Essencial" },
  { item: "Proteção contra upload malicioso", icone: "🛡️", nivel: "Importante" },
  { item: "Logs de auditoria", icone: "📋", nivel: "Importante" },
  { item: "Conformidade com LGPD", icone: "⚖️", nivel: "Legal" },
  { item: "MFA para administradores", icone: "📱", nivel: "Avançado" },
  { item: "Rate limiting nas APIs", icone: "⏱️", nivel: "Avançado" },
  { item: "HTTPS/TLS em todas as conexões", icone: "🔐", nivel: "Essencial" },
];

const HOSPEDAGEM = [
  {
    tipo: "MVP Econômico",
    icone: "🚀",
    cor: "#2D6A4F",
    descricao: "Ideal para validar o produto com custo reduzido",
    servicos: [
      { nome: "Vercel", uso: "Web Administrativo e Web do Produtor", icone: "▲" },
      { nome: "Railway / Render", uso: "API Backend Node.js", icone: "🚂" },
      { nome: "Supabase", uso: "PostgreSQL gerenciado", icone: "⚡" },
      { nome: "Cloudflare R2", uso: "Armazenamento de arquivos", icone: "🌐" },
    ],
    custo: "~$20-50/mês",
  },
  {
    tipo: "Produção Escalável",
    icone: "🏭",
    cor: "#1565C0",
    descricao: "Para escalar com alta disponibilidade e performance",
    servicos: [
      { nome: "AWS / GCP / Azure", uso: "Infraestrutura completa", icone: "☁️" },
      { nome: "Kubernetes", uso: "Orquestração de containers", icone: "⚓" },
      { nome: "CDN Global", uso: "Distribuição de conteúdo", icone: "🌍" },
      { nome: "Monitoramento Avançado", uso: "Datadog, New Relic, etc.", icone: "📊" },
    ],
    custo: "~$200+/mês",
  },
];

const ESTRUTURA_PASTAS = `afu/
├── apps/
│   ├── mobile/          ← React Native + Expo
│   ├── web-admin/       ← Next.js (Administradores)
│   └── web-produtor/    ← Next.js (Produtores)
├── services/
│   ├── api/             ← NestJS Backend
│   ├── ai-service/      ← Módulo de IA
│   ├── pdf-service/     ← Geração de PDFs
│   └── iot-service/     ← Sensores IoT
├── packages/
│   ├── ui/              ← Componentes compartilhados
│   ├── database/        ← Schema Prisma/Drizzle
│   ├── validators/      ← Schemas Zod
│   └── shared-types/    ← Tipos TypeScript
├── docs/
│   ├── requisitos/
│   ├── telas/
│   ├── banco-de-dados/
│   └── arquitetura/
└── README.md`;

export default function ArquiteturaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("stack");
  const [moduloExpandido, setModuloExpandido] = useState<string | null>(null);
  const [comunicacaoExpandida, setComunicacaoExpandida] = useState<string | null>(null);

  const abas: { id: Aba; label: string }[] = [
    { id: "stack", label: "Stack" },
    { id: "modulos", label: "Módulos" },
    { id: "comunicacao", label: "Fluxo" },
    { id: "seguranca", label: "Segurança" },
    { id: "hospedagem", label: "Deploy" },
  ];

  const nivelCor = (nivel: string) => {
    switch (nivel) {
      case "Essencial": return "#2D6A4F";
      case "Importante": return "#D97706";
      case "Legal": return "#1565C0";
      case "Avançado": return "#6A1B9A";
      default: return "#6B7280";
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B4332" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>⚙️ Arquitetura Técnica</Text>
          <Text style={styles.headerSubtitle}>AFU — Etapa 4 · Stack & Infraestrutura</Text>
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
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: "#2D6A4F", borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? "#2D6A4F" : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <AfuStackBanner note="Conteúdo abaixo mistura plano original (NestJS/Prisma/PostgreSQL). Stack entregue: Expo + Express/tRPC + MySQL/Drizzle." />

        {/* ─── STACK ─── */}
        {abaAtiva === "stack" && (
          <View style={{ gap: 14 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>Stack Tecnológica do AFU</Text>
              <Text style={styles.infoSubtitle}>Tecnologias selecionadas para cada camada do sistema</Text>
            </View>
            {STACK.map((grupo) => (
              <View key={grupo.categoria} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHeaderSimple, { borderBottomColor: colors.border }]}>
                  <View style={[styles.dot, { backgroundColor: grupo.cor }]} />
                  <Text style={[styles.cardCategoria, { color: grupo.cor }]}>{grupo.categoria}</Text>
                </View>
                {grupo.tecnologias.map((tech, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.techRow,
                      idx < grupo.tecnologias.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <Text style={styles.techIcone}>{tech.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.techNome, { color: colors.foreground }]}>{tech.nome}</Text>
                      <Text style={[styles.techDesc, { color: colors.muted }]}>{tech.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* Estrutura de pastas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeaderSimple, { borderBottomColor: colors.border }]}>
                <View style={[styles.dot, { backgroundColor: "#6B7280" }]} />
                <Text style={[styles.cardCategoria, { color: "#6B7280" }]}>📁 Estrutura do Monorepo</Text>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={[styles.codeBlock, { color: colors.foreground, backgroundColor: colors.background }]}>
                  {ESTRUTURA_PASTAS}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── MÓDULOS BACKEND ─── */}
        {abaAtiva === "modulos" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>8 Módulos do Backend</Text>
              <Text style={styles.infoSubtitle}>Arquitetura modular NestJS — cada módulo tem responsabilidade única</Text>
            </View>
            {MODULOS_BACKEND.map((modulo) => (
              <View key={modulo.nome} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.moduloHeader}
                  onPress={() => setModuloExpandido(moduloExpandido === modulo.nome ? null : modulo.nome)}
                >
                  <View style={[styles.moduloIcone, { backgroundColor: modulo.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{modulo.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.moduloNome, { color: modulo.cor }]}>{modulo.nome}</Text>
                    <Text style={[styles.moduloCount, { color: colors.muted }]}>
                      {modulo.responsabilidades.length} responsabilidades
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {moduloExpandido === modulo.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {moduloExpandido === modulo.nome && (
                  <View style={[styles.moduloBody, { borderTopColor: colors.border }]}>
                    {modulo.responsabilidades.map((resp, idx) => (
                      <View key={idx} style={styles.respRow}>
                        <View style={[styles.respDot, { backgroundColor: modulo.cor }]} />
                        <Text style={[styles.respText, { color: colors.foreground }]}>{resp}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── COMUNICAÇÃO ─── */}
        {abaAtiva === "comunicacao" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>Fluxo de Comunicação</Text>
              <Text style={styles.infoSubtitle}>Como os sistemas se comunicam entre si</Text>
            </View>

            {/* Diagrama visual */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
              <Text style={[styles.diagramaTitulo, { color: colors.foreground }]}>Diagrama de Arquitetura</Text>
              <View style={styles.diagrama}>
                {/* Camada cliente */}
                <View style={styles.diagramaLinha}>
                  <View style={[styles.diagramaBox, { backgroundColor: "#2D6A4F20", borderColor: "#2D6A4F" }]}>
                    <Text style={styles.diagramaBoxIcone}>📱</Text>
                    <Text style={[styles.diagramaBoxText, { color: "#2D6A4F" }]}>Mobile</Text>
                  </View>
                  <View style={[styles.diagramaBox, { backgroundColor: "#1565C020", borderColor: "#1565C0" }]}>
                    <Text style={styles.diagramaBoxIcone}>🌐</Text>
                    <Text style={[styles.diagramaBoxText, { color: "#1565C0" }]}>Web</Text>
                  </View>
                </View>
                <Text style={[styles.diagramaSeta, { color: colors.muted }]}>↓ HTTPS / tRPC</Text>
                {/* API */}
                <View style={[styles.diagramaBoxFull, { backgroundColor: "#6A1B9A20", borderColor: "#6A1B9A" }]}>
                  <Text style={styles.diagramaBoxIcone}>⚙️</Text>
                  <Text style={[styles.diagramaBoxText, { color: "#6A1B9A" }]}>API Backend (NestJS)</Text>
                </View>
                <View style={styles.diagramaLinha}>
                  <Text style={[styles.diagramaSeta, { color: colors.muted }]}>↓ SQL</Text>
                  <Text style={[styles.diagramaSeta, { color: colors.muted }]}>↓ HTTP</Text>
                  <Text style={[styles.diagramaSeta, { color: colors.muted }]}>↓ SDK</Text>
                </View>
                {/* Serviços */}
                <View style={styles.diagramaLinha}>
                  <View style={[styles.diagramaBox, { backgroundColor: "#E6510020", borderColor: "#E65100" }]}>
                    <Text style={styles.diagramaBoxIcone}>🗄️</Text>
                    <Text style={[styles.diagramaBoxText, { color: "#E65100" }]}>PostgreSQL</Text>
                  </View>
                  <View style={[styles.diagramaBox, { backgroundColor: "#1B433220", borderColor: "#1B4332" }]}>
                    <Text style={styles.diagramaBoxIcone}>🤖</Text>
                    <Text style={[styles.diagramaBoxText, { color: "#1B4332" }]}>IA</Text>
                  </View>
                  <View style={[styles.diagramaBox, { backgroundColor: "#00695C20", borderColor: "#00695C" }]}>
                    <Text style={styles.diagramaBoxIcone}>☁️</Text>
                    <Text style={[styles.diagramaBoxText, { color: "#00695C" }]}>Storage</Text>
                  </View>
                </View>
                <Text style={[styles.diagramaSeta, { color: colors.muted }]}>↓ MQTT / WebSocket</Text>
                <View style={[styles.diagramaBoxFull, { backgroundColor: "#6A1B9A20", borderColor: "#6A1B9A" }]}>
                  <Text style={styles.diagramaBoxIcone}>📡</Text>
                  <Text style={[styles.diagramaBoxText, { color: "#6A1B9A" }]}>Sensores IoT</Text>
                </View>
              </View>
            </View>

            {/* Detalhes de cada fluxo */}
            {COMUNICACAO.map((fluxo) => (
              <View key={fluxo.de + fluxo.para} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.fluxoHeader}
                  onPress={() => setComunicacaoExpandida(comunicacaoExpandida === fluxo.de ? null : fluxo.de)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.fluxoRota}>
                      <Text style={[styles.fluxoDe, { color: colors.foreground }]}>{fluxo.de}</Text>
                      <Text style={[styles.fluxoSeta, { color: fluxo.cor }]}>→</Text>
                      <Text style={[styles.fluxoPara, { color: fluxo.cor }]}>{fluxo.para}</Text>
                    </View>
                    <Text style={[styles.fluxoCount, { color: colors.muted }]}>{fluxo.usos.length} operações</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {comunicacaoExpandida === fluxo.de ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {comunicacaoExpandida === fluxo.de && (
                  <View style={[styles.fluxoBody, { borderTopColor: colors.border }]}>
                    {fluxo.usos.map((uso, idx) => (
                      <View key={idx} style={styles.respRow}>
                        <View style={[styles.respDot, { backgroundColor: fluxo.cor }]} />
                        <Text style={[styles.respText, { color: colors.foreground }]}>{uso}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── SEGURANÇA ─── */}
        {abaAtiva === "seguranca" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>🔒 Segurança do Sistema</Text>
              <Text style={styles.infoSubtitle}>Medidas de proteção, autenticação e conformidade legal</Text>
            </View>

            {/* Legenda */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.legendaTitulo, { color: colors.foreground }]}>Níveis de Prioridade</Text>
              <View style={styles.legendaGrid}>
                {[
                  { nivel: "Essencial", cor: "#2D6A4F" },
                  { nivel: "Importante", cor: "#D97706" },
                  { nivel: "Legal", cor: "#1565C0" },
                  { nivel: "Avançado", cor: "#6A1B9A" },
                ].map((l) => (
                  <View key={l.nivel} style={styles.legendaItem}>
                    <View style={[styles.legendaDot, { backgroundColor: l.cor }]} />
                    <Text style={[styles.legendaText, { color: colors.muted }]}>{l.nivel}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Lista de medidas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {SEGURANCA.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.segurancaRow,
                    idx < SEGURANCA.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={styles.segurancaIcone}>{item.icone}</Text>
                  <Text style={[styles.segurancaItem, { color: colors.foreground }]}>{item.item}</Text>
                  <View style={[styles.nivelBadge, { backgroundColor: nivelCor(item.nivel) + "20" }]}>
                    <Text style={[styles.nivelText, { color: nivelCor(item.nivel) }]}>{item.nivel}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* LGPD */}
            <View style={[styles.card, { backgroundColor: "#1565C010", borderColor: "#1565C0", padding: 16 }]}>
              <Text style={[styles.lgpdTitulo, { color: "#1565C0" }]}>⚖️ Conformidade LGPD</Text>
              <Text style={[styles.lgpdTexto, { color: colors.foreground }]}>
                O AFU coleta e processa dados pessoais de produtores rurais. A conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) é obrigatória e inclui: consentimento explícito, direito de acesso e exclusão, política de privacidade clara, e registro de atividades de tratamento de dados.
              </Text>
            </View>
          </View>
        )}

        {/* ─── HOSPEDAGEM ─── */}
        {abaAtiva === "hospedagem" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>🚀 Estratégia de Deploy</Text>
              <Text style={styles.infoSubtitle}>Opções de hospedagem para MVP e produção escalável</Text>
            </View>

            {HOSPEDAGEM.map((opcao) => (
              <View key={opcao.tipo} style={[styles.card, { backgroundColor: colors.surface, borderColor: opcao.cor }]}>
                <View style={[styles.hospedagemHeader, { backgroundColor: opcao.cor + "15" }]}>
                  <Text style={{ fontSize: 28 }}>{opcao.icone}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.hospedagemTipo, { color: opcao.cor }]}>{opcao.tipo}</Text>
                    <Text style={[styles.hospedagemDesc, { color: colors.muted }]}>{opcao.descricao}</Text>
                  </View>
                  <View style={[styles.custoBadge, { backgroundColor: opcao.cor }]}>
                    <Text style={styles.custoText}>{opcao.custo}</Text>
                  </View>
                </View>
                <View style={{ padding: 14, gap: 10 }}>
                  {opcao.servicos.map((servico, idx) => (
                    <View key={idx} style={styles.servicoRow}>
                      <Text style={styles.servicoIcone}>{servico.icone}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.servicoNome, { color: colors.foreground }]}>{servico.nome}</Text>
                        <Text style={[styles.servicoUso, { color: colors.muted }]}>{servico.uso}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Recomendação */}
            <View style={[styles.card, { backgroundColor: "#2D6A4F10", borderColor: "#2D6A4F", padding: 16 }]}>
              <Text style={[styles.recomendacaoTitulo, { color: "#2D6A4F" }]}>💡 Recomendação</Text>
              <Text style={[styles.recomendacaoTexto, { color: colors.foreground }]}>
                Inicie com o <Text style={{ fontWeight: "700" }}>MVP Econômico</Text> para validar o produto com custo mínimo. Após atingir 100+ usuários ativos, migre gradualmente para a infraestrutura escalável, começando pelos serviços de maior demanda (API e banco de dados).
              </Text>
            </View>

            {/* Roadmap */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
              <Text style={[styles.roadmapTitulo, { color: colors.foreground }]}>📅 Roadmap de Deploy</Text>
              {[
                { fase: "Fase 1 — MVP", desc: "Vercel + Railway + Supabase", prazo: "Agora", cor: "#2D6A4F" },
                { fase: "Fase 2 — Crescimento", desc: "AWS EC2 + RDS PostgreSQL", prazo: "100+ usuários", cor: "#D97706" },
                { fase: "Fase 3 — Escala", desc: "Kubernetes + CDN + Monitoramento", prazo: "1000+ usuários", cor: "#1565C0" },
              ].map((fase, idx) => (
                <View key={idx} style={[styles.roadmapRow, { borderLeftColor: fase.cor }]}>
                  <Text style={[styles.roadmapFase, { color: fase.cor }]}>{fase.fase}</Text>
                  <Text style={[styles.roadmapDesc, { color: colors.foreground }]}>{fase.desc}</Text>
                  <Text style={[styles.roadmapPrazo, { color: colors.muted }]}>{fase.prazo}</Text>
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
  headerSubtitle: { color: "#B7E4C7", fontSize: 12 },
  tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  infoCard: { borderRadius: 12, padding: 16 },
  infoTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoSubtitle: { color: "#B7E4C7", fontSize: 13, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  cardHeaderSimple: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardCategoria: { fontSize: 15, fontWeight: "700" },
  techRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  techIcone: { fontSize: 20, width: 28, textAlign: "center" },
  techNome: { fontSize: 14, fontWeight: "600" },
  techDesc: { fontSize: 12, marginTop: 1 },
  codeBlock: { fontSize: 11, fontFamily: "monospace", lineHeight: 18, padding: 12, borderRadius: 8 },
  moduloHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  moduloIcone: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  moduloNome: { fontSize: 15, fontWeight: "700" },
  moduloCount: { fontSize: 12, marginTop: 2 },
  moduloBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  respRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  respDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  respText: { fontSize: 13, flex: 1 },
  fluxoHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  fluxoRota: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  fluxoDe: { fontSize: 13, fontWeight: "600" },
  fluxoSeta: { fontSize: 16, fontWeight: "700" },
  fluxoPara: { fontSize: 13, fontWeight: "700" },
  fluxoCount: { fontSize: 12, marginTop: 2 },
  fluxoBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  diagramaTitulo: { fontSize: 14, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  diagrama: { alignItems: "center", gap: 8 },
  diagramaLinha: { flexDirection: "row", gap: 10, justifyContent: "center" },
  diagramaBox: { borderRadius: 10, borderWidth: 1.5, padding: 10, alignItems: "center", minWidth: 80 },
  diagramaBoxFull: { borderRadius: 10, borderWidth: 1.5, padding: 10, alignItems: "center", width: "90%", flexDirection: "row", gap: 8, justifyContent: "center" },
  diagramaBoxIcone: { fontSize: 18 },
  diagramaBoxText: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  diagramaSeta: { fontSize: 13, fontWeight: "600" },
  segurancaRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  segurancaIcone: { fontSize: 18, width: 26, textAlign: "center" },
  segurancaItem: { fontSize: 13, flex: 1 },
  nivelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  nivelText: { fontSize: 10, fontWeight: "700" },
  legendaTitulo: { fontSize: 13, fontWeight: "700", marginBottom: 10 },
  legendaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendaDot: { width: 10, height: 10, borderRadius: 5 },
  legendaText: { fontSize: 12 },
  lgpdTitulo: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  lgpdTexto: { fontSize: 13, lineHeight: 20 },
  hospedagemHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  hospedagemTipo: { fontSize: 16, fontWeight: "700" },
  hospedagemDesc: { fontSize: 12, marginTop: 2 },
  custoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  custoText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  servicoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  servicoIcone: { fontSize: 20, width: 28, textAlign: "center" },
  servicoNome: { fontSize: 14, fontWeight: "600" },
  servicoUso: { fontSize: 12, marginTop: 1 },
  recomendacaoTitulo: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  recomendacaoTexto: { fontSize: 13, lineHeight: 20 },
  roadmapTitulo: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  roadmapRow: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12 },
  roadmapFase: { fontSize: 13, fontWeight: "700" },
  roadmapDesc: { fontSize: 12, marginTop: 2 },
  roadmapPrazo: { fontSize: 11, marginTop: 2 },
});
