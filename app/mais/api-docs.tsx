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

type Aba = "modulos" | "endpoints" | "permissoes" | "seguranca" | "estrutura";

const METHOD_COLORS: Record<string, string> = {
  GET: "#2D6A4F",
  POST: "#1565C0",
  PATCH: "#D97706",
  DELETE: "#C62828",
  PUT: "#6A1B9A",
};

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  desc: string;
  auth?: boolean;
  roles?: string[];
}

interface Modulo {
  nome: string;
  icone: string;
  cor: string;
  desc: string;
  endpoints: Endpoint[];
}

const MODULOS: Modulo[] = [
  {
    nome: "auth",
    icone: "🔐",
    cor: "#1565C0",
    desc: "Autenticação, cadastro e recuperação de senha",
    endpoints: [
      { method: "POST", path: "/auth/cadastro", desc: "Criar nova conta de usuário" },
      { method: "POST", path: "/auth/login", desc: "Autenticar e receber JWT" },
      { method: "POST", path: "/auth/recuperar-senha", desc: "Solicitar recuperação de senha" },
      { method: "POST", path: "/auth/refresh-token", desc: "Renovar token de acesso", auth: true },
    ],
  },
  {
    nome: "usuarios",
    icone: "👤",
    cor: "#2D6A4F",
    desc: "Gerenciamento de usuários do sistema",
    endpoints: [
      { method: "GET", path: "/usuarios", desc: "Listar todos os usuários", auth: true, roles: ["admin"] },
      { method: "GET", path: "/usuarios/:id", desc: "Buscar usuário por ID", auth: true },
      { method: "PATCH", path: "/usuarios/:id", desc: "Atualizar dados do usuário", auth: true },
      { method: "DELETE", path: "/usuarios/:id", desc: "Remover usuário", auth: true, roles: ["admin"] },
    ],
  },
  {
    nome: "produtores",
    icone: "🌾",
    cor: "#40916C",
    desc: "Perfis e dados de produtores rurais",
    endpoints: [
      { method: "POST", path: "/produtores", desc: "Criar perfil de produtor", auth: true },
      { method: "GET", path: "/produtores", desc: "Listar produtores", auth: true, roles: ["admin", "tecnico"] },
      { method: "GET", path: "/produtores/:id", desc: "Buscar produtor por ID", auth: true },
      { method: "PATCH", path: "/produtores/:id", desc: "Atualizar produtor", auth: true },
      { method: "DELETE", path: "/produtores/:id", desc: "Remover produtor", auth: true, roles: ["admin"] },
    ],
  },
  {
    nome: "propriedades",
    icone: "🏡",
    cor: "#52B788",
    desc: "Propriedades rurais e talhões",
    endpoints: [
      { method: "POST", path: "/propriedades", desc: "Cadastrar nova propriedade", auth: true },
      { method: "GET", path: "/propriedades", desc: "Listar propriedades do usuário", auth: true },
      { method: "GET", path: "/propriedades/:id", desc: "Detalhes da propriedade", auth: true },
      { method: "PATCH", path: "/propriedades/:id", desc: "Atualizar propriedade", auth: true },
      { method: "DELETE", path: "/propriedades/:id", desc: "Remover propriedade", auth: true },
    ],
  },
  {
    nome: "culturas",
    icone: "🌱",
    cor: "#74C69D",
    desc: "Cultivos e fases fenológicas",
    endpoints: [
      { method: "POST", path: "/culturas", desc: "Cadastrar novo cultivo", auth: true },
      { method: "GET", path: "/culturas", desc: "Listar cultivos do usuário", auth: true },
      { method: "GET", path: "/culturas/:id", desc: "Detalhes do cultivo", auth: true },
      { method: "PATCH", path: "/culturas/:id", desc: "Atualizar cultivo", auth: true },
      { method: "DELETE", path: "/culturas/:id", desc: "Remover cultivo", auth: true },
    ],
  },
  {
    nome: "diagnosticos",
    icone: "🔬",
    cor: "#D4A017",
    desc: "Diagnóstico fitossanitário por IA",
    endpoints: [
      { method: "POST", path: "/diagnosticos/imagem", desc: "Enviar imagem para análise por IA", auth: true },
      { method: "GET", path: "/diagnosticos", desc: "Histórico de diagnósticos", auth: true },
      { method: "GET", path: "/diagnosticos/:id", desc: "Detalhes do diagnóstico", auth: true },
      { method: "PATCH", path: "/diagnosticos/:id/revisao", desc: "Revisar diagnóstico (técnico)", auth: true, roles: ["tecnico", "admin"] },
    ],
  },
  {
    nome: "analises",
    icone: "🧪",
    cor: "#00695C",
    desc: "Análises fitotécnicas de solo, água e planta",
    endpoints: [
      { method: "POST", path: "/analises", desc: "Registrar nova análise", auth: true },
      { method: "GET", path: "/analises", desc: "Listar análises do usuário", auth: true },
      { method: "GET", path: "/analises/:id", desc: "Detalhes da análise", auth: true },
      { method: "PATCH", path: "/analises/:id", desc: "Atualizar análise", auth: true, roles: ["tecnico", "admin"] },
    ],
  },
  {
    nome: "relatorios",
    icone: "📄",
    cor: "#6B4226",
    desc: "Geração de laudos e relatórios PDF",
    endpoints: [
      { method: "POST", path: "/relatorios/gerar", desc: "Gerar relatório/laudo em PDF", auth: true },
      { method: "GET", path: "/relatorios", desc: "Listar relatórios do usuário", auth: true },
      { method: "GET", path: "/relatorios/:id", desc: "Baixar relatório PDF", auth: true },
    ],
  },
  {
    nome: "materiais",
    icone: "📚",
    cor: "#5C4033",
    desc: "Materiais didáticos e conteúdo educativo",
    endpoints: [
      { method: "POST", path: "/materiais", desc: "Criar material didático", auth: true, roles: ["admin", "tecnico"] },
      { method: "GET", path: "/materiais", desc: "Listar materiais disponíveis", auth: true },
      { method: "GET", path: "/materiais/:id", desc: "Detalhes do material", auth: true },
      { method: "PATCH", path: "/materiais/:id", desc: "Atualizar material", auth: true, roles: ["admin", "tecnico"] },
      { method: "DELETE", path: "/materiais/:id", desc: "Remover material", auth: true, roles: ["admin"] },
    ],
  },
  {
    nome: "sensores",
    icone: "📡",
    cor: "#6A1B9A",
    desc: "Sensores IoT e leituras em tempo real",
    endpoints: [
      { method: "POST", path: "/sensores", desc: "Cadastrar sensor IoT", auth: true },
      { method: "GET", path: "/sensores", desc: "Listar sensores da propriedade", auth: true },
      { method: "POST", path: "/sensores/leitura", desc: "Registrar leitura do sensor", auth: true },
      { method: "GET", path: "/sensores/:id/leituras", desc: "Histórico de leituras", auth: true },
    ],
  },
  {
    nome: "marketplace",
    icone: "🛒",
    cor: "#E65100",
    desc: "Produtos, pedidos e transações",
    endpoints: [
      { method: "POST", path: "/produtos", desc: "Cadastrar produto", auth: true, roles: ["parceiro", "admin"] },
      { method: "GET", path: "/produtos", desc: "Listar produtos disponíveis", auth: true },
      { method: "POST", path: "/pedidos", desc: "Realizar pedido", auth: true },
      { method: "GET", path: "/pedidos", desc: "Listar pedidos do usuário", auth: true },
      { method: "GET", path: "/pedidos/:id", desc: "Detalhes do pedido", auth: true },
      { method: "PATCH", path: "/pedidos/:id/status", desc: "Atualizar status do pedido", auth: true, roles: ["parceiro", "admin"] },
    ],
  },
];

const PERMISSOES = [
  {
    perfil: "Administrador",
    icone: "👑",
    cor: "#C62828",
    pode: [
      "Gerenciar todos os usuários",
      "Acessar todos os relatórios",
      "Aprovar técnicos",
      "Configurar banco de dados",
      "Remover qualquer registro",
      "Acessar logs de auditoria",
    ],
    nao_pode: [],
  },
  {
    perfil: "Técnico",
    icone: "🔬",
    cor: "#1565C0",
    pode: [
      "Revisar diagnósticos",
      "Emitir laudos técnicos",
      "Cadastrar pragas e doenças",
      "Acompanhar produtores",
      "Criar materiais didáticos",
      "Atualizar análises fitotécnicas",
    ],
    nao_pode: ["Gerenciar usuários", "Configurar sistema"],
  },
  {
    perfil: "Produtor",
    icone: "🌾",
    cor: "#2D6A4F",
    pode: [
      "Cadastrar propriedades",
      "Cadastrar culturas",
      "Enviar fotos para diagnóstico",
      "Consultar histórico próprio",
      "Baixar relatórios próprios",
      "Acessar materiais didáticos",
    ],
    nao_pode: ["Revisar diagnósticos", "Emitir laudos", "Ver dados de outros produtores"],
  },
  {
    perfil: "Parceiro",
    icone: "🤝",
    cor: "#6A1B9A",
    pode: [
      "Cadastrar serviços e produtos",
      "Visualizar oportunidades",
      "Participar do marketplace",
      "Gerenciar pedidos recebidos",
    ],
    nao_pode: ["Acessar dados de produtores", "Emitir laudos"],
  },
  {
    perfil: "Comprador",
    icone: "🛒",
    cor: "#E65100",
    pode: [
      "Visualizar produtos disponíveis",
      "Realizar pedidos",
      "Acompanhar compras",
      "Avaliar vendedores",
    ],
    nao_pode: ["Cadastrar produtos", "Acessar diagnósticos", "Ver propriedades"],
  },
];

const SEGURANCA_API = [
  { item: "Criptografia de senha com bcrypt (salt rounds: 12)", icone: "🔒", tipo: "Autenticação" },
  { item: "Autenticação JWT com expiração de 1 dia", icone: "🎫", tipo: "Autenticação" },
  { item: "Refresh Token com rotação automática", icone: "🔄", tipo: "Autenticação" },
  { item: "Validação de entrada com class-validator", icone: "✅", tipo: "Validação" },
  { item: "Limite de upload de imagem (máx. 10MB)", icone: "📸", tipo: "Validação" },
  { item: "Controle de acesso por perfil (RBAC)", icone: "👥", tipo: "Autorização" },
  { item: "Guards NestJS para rotas protegidas", icone: "🛡️", tipo: "Autorização" },
  { item: "Logs de ações críticas (auditoria)", icone: "📋", tipo: "Auditoria" },
  { item: "Proteção contra uploads maliciosos", icone: "🦠", tipo: "Segurança" },
  { item: "Rate limiting (100 req/min por IP)", icone: "⏱️", tipo: "Segurança" },
  { item: "CORS configurado por domínio", icone: "🌐", tipo: "Segurança" },
  { item: "Conformidade com LGPD", icone: "⚖️", tipo: "Legal" },
];

const ESTRUTURA_API = `services/api/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/
│   ├── usuarios/
│   │   ├── usuarios.controller.ts
│   │   ├── usuarios.service.ts
│   │   └── dto/
│   ├── produtores/
│   ├── propriedades/
│   ├── culturas/
│   ├── diagnosticos/
│   │   ├── diagnosticos.service.ts
│   │   └── ia.service.ts  ← Integração IA
│   ├── analises/
│   ├── relatorios/
│   │   └── pdf.service.ts ← PDFKit/Puppeteer
│   ├── materiais/
│   ├── sensores/
│   ├── marketplace/
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── README.md`;

const ENV_EXAMPLE = `DATABASE_URL="postgresql://usuario:senha@localhost:5432/afu"
JWT_SECRET="trocar_por_chave_segura_256bits"
JWT_EXPIRES_IN="1d"
REFRESH_TOKEN_SECRET="trocar_por_chave_refresh"
REFRESH_TOKEN_EXPIRES_IN="7d"
STORAGE_BUCKET="afu-arquivos"
STORAGE_URL="https://r2.cloudflare.com/afu"
AI_SERVICE_URL="http://localhost:4001"
PDF_SERVICE_URL="http://localhost:4002"
PORT=3000
NODE_ENV="development"`;

const MAIN_TS = `// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  });
  
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  await app.listen(process.env.PORT || 3000);
  console.log(\`AFU API rodando na porta \${process.env.PORT || 3000}\`);
}

bootstrap();`;

export default function ApiDocsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("modulos");
  const [moduloExpandido, setModuloExpandido] = useState<string | null>(null);
  const [perfilExpandido, setPerfilExpandido] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");

  const abas: { id: Aba; label: string }[] = [
    { id: "modulos", label: "Módulos" },
    { id: "endpoints", label: "Endpoints" },
    { id: "permissoes", label: "Perfis" },
    { id: "seguranca", label: "Segurança" },
    { id: "estrutura", label: "Código" },
  ];

  const tiposSeguranca = ["Todos", "Autenticação", "Validação", "Autorização", "Auditoria", "Segurança", "Legal"];

  const segurancaFiltrada = filtroTipo === "Todos"
    ? SEGURANCA_API
    : SEGURANCA_API.filter(s => s.tipo === filtroTipo);

  const totalEndpoints = MODULOS.reduce((acc, m) => acc + m.endpoints.length, 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B4332" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>⚙️ API Backend</Text>
          <Text style={styles.headerSubtitle}>AFU — Etapa 5 · {MODULOS.length} módulos · {totalEndpoints} endpoints</Text>
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
        <AfuStackBanner note="Documentação de referência NestJS/Prisma. API real: server/ com Express + tRPC + Drizzle/MySQL." />

        {/* ─── MÓDULOS ─── */}
        {abaAtiva === "modulos" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>11 Módulos da API AFU</Text>
              <Text style={styles.infoSubtitle}>NestJS · Node.js · TypeScript · Prisma ORM</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Módulos", valor: MODULOS.length.toString(), cor: "#2D6A4F" },
                { label: "Endpoints", valor: totalEndpoints.toString(), cor: "#1565C0" },
                { label: "Perfis", valor: PERMISSOES.length.toString(), cor: "#E65100" },
                { label: "Regras", valor: SEGURANCA_API.length.toString(), cor: "#6A1B9A" },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.statValor, { color: s.cor }]}>{s.valor}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {MODULOS.map((modulo) => (
              <View key={modulo.nome} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.moduloHeader}
                  onPress={() => setModuloExpandido(moduloExpandido === modulo.nome ? null : modulo.nome)}
                >
                  <View style={[styles.moduloIcone, { backgroundColor: modulo.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{modulo.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.moduloNome, { color: modulo.cor }]}>/{modulo.nome}</Text>
                    <Text style={[styles.moduloDesc, { color: colors.muted }]}>{modulo.desc}</Text>
                    <Text style={[styles.moduloCount, { color: colors.muted }]}>
                      {modulo.endpoints.length} endpoints
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {moduloExpandido === modulo.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {moduloExpandido === modulo.nome && (
                  <View style={[styles.endpointsList, { borderTopColor: colors.border }]}>
                    {modulo.endpoints.map((ep, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.endpointRow,
                          idx < modulo.endpoints.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                      >
                        <View style={[styles.methodBadge, { backgroundColor: METHOD_COLORS[ep.method] }]}>
                          <Text style={styles.methodText}>{ep.method}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.epPath, { color: colors.foreground }]}>{ep.path}</Text>
                          <Text style={[styles.epDesc, { color: colors.muted }]}>{ep.desc}</Text>
                        </View>
                        {ep.auth && (
                          <Text style={{ fontSize: 14 }}>🔒</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── ENDPOINTS ─── */}
        {abaAtiva === "endpoints" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>Todos os Endpoints REST</Text>
              <Text style={styles.infoSubtitle}>Base URL: https://api.afu.com.br/api</Text>
            </View>

            {/* Legenda de métodos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.legendaTitulo, { color: colors.foreground }]}>Métodos HTTP</Text>
              <View style={styles.legendaGrid}>
                {Object.entries(METHOD_COLORS).map(([method, cor]) => (
                  <View key={method} style={[styles.methodBadge, { backgroundColor: cor }]}>
                    <Text style={styles.methodText}>{method}</Text>
                  </View>
                ))}
                <View style={styles.authInfo}>
                  <Text style={{ fontSize: 14 }}>🔒</Text>
                  <Text style={[styles.authText, { color: colors.muted }]}>Requer JWT</Text>
                </View>
              </View>
            </View>

            {MODULOS.map((modulo) => (
              <View key={modulo.nome} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.moduloHeaderSimple, { borderBottomColor: colors.border }]}>
                  <Text style={{ fontSize: 18 }}>{modulo.icone}</Text>
                  <Text style={[styles.moduloNome, { color: modulo.cor }]}>/{modulo.nome}</Text>
                </View>
                {modulo.endpoints.map((ep, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.endpointRow,
                      idx < modulo.endpoints.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.methodBadge, { backgroundColor: METHOD_COLORS[ep.method] }]}>
                      <Text style={styles.methodText}>{ep.method}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.epPath, { color: colors.foreground }]}>{ep.path}</Text>
                      <Text style={[styles.epDesc, { color: colors.muted }]}>{ep.desc}</Text>
                      {ep.roles && (
                        <View style={styles.rolesRow}>
                          {ep.roles.map((r) => (
                            <View key={r} style={[styles.roleBadge, { backgroundColor: colors.border }]}>
                              <Text style={[styles.roleText, { color: colors.muted }]}>{r}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    {ep.auth && <Text style={{ fontSize: 14 }}>🔒</Text>}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ─── PERMISSÕES ─── */}
        {abaAtiva === "permissoes" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>Perfis e Permissões (RBAC)</Text>
              <Text style={styles.infoSubtitle}>Role-Based Access Control — 5 perfis de acesso</Text>
            </View>

            {PERMISSOES.map((perfil) => (
              <View key={perfil.perfil} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.perfilHeader}
                  onPress={() => setPerfilExpandido(perfilExpandido === perfil.perfil ? null : perfil.perfil)}
                >
                  <View style={[styles.perfilIcone, { backgroundColor: perfil.cor + "20" }]}>
                    <Text style={{ fontSize: 24 }}>{perfil.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.perfilNome, { color: perfil.cor }]}>{perfil.perfil}</Text>
                    <Text style={[styles.perfilCount, { color: colors.muted }]}>
                      {perfil.pode.length} permissões
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {perfilExpandido === perfil.perfil ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {perfilExpandido === perfil.perfil && (
                  <View style={[styles.perfilBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.perfilSecao, { color: "#2D6A4F" }]}>✅ Pode:</Text>
                    {perfil.pode.map((p, idx) => (
                      <View key={idx} style={styles.permRow}>
                        <View style={[styles.permDot, { backgroundColor: "#2D6A4F" }]} />
                        <Text style={[styles.permText, { color: colors.foreground }]}>{p}</Text>
                      </View>
                    ))}
                    {perfil.nao_pode.length > 0 && (
                      <>
                        <Text style={[styles.perfilSecao, { color: "#C62828", marginTop: 10 }]}>❌ Não pode:</Text>
                        {perfil.nao_pode.map((p, idx) => (
                          <View key={idx} style={styles.permRow}>
                            <View style={[styles.permDot, { backgroundColor: "#C62828" }]} />
                            <Text style={[styles.permText, { color: colors.foreground }]}>{p}</Text>
                          </View>
                        ))}
                      </>
                    )}
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
              <Text style={styles.infoTitle}>🔒 Segurança da API</Text>
              <Text style={styles.infoSubtitle}>{SEGURANCA_API.length} medidas de proteção implementadas</Text>
            </View>

            {/* Filtros */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
                {tiposSeguranca.map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.filtroBtn,
                      { backgroundColor: filtroTipo === tipo ? "#2D6A4F" : colors.surface, borderColor: filtroTipo === tipo ? "#2D6A4F" : colors.border },
                    ]}
                    onPress={() => setFiltroTipo(tipo)}
                  >
                    <Text style={[styles.filtroText, { color: filtroTipo === tipo ? "#fff" : colors.muted }]}>{tipo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {segurancaFiltrada.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.segRow,
                    idx < segurancaFiltrada.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={styles.segIcone}>{item.icone}</Text>
                  <Text style={[styles.segItem, { color: colors.foreground }]}>{item.item}</Text>
                  <View style={[styles.tipoBadge, { backgroundColor: "#2D6A4F20" }]}>
                    <Text style={[styles.tipoText, { color: "#2D6A4F" }]}>{item.tipo}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── ESTRUTURA / CÓDIGO ─── */}
        {abaAtiva === "estrutura" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>📁 Código Base da API</Text>
              <Text style={styles.infoSubtitle}>Estrutura de pastas, variáveis de ambiente e main.ts</Text>
            </View>

            {/* Estrutura de pastas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>📁 Estrutura de Pastas</Text>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={[styles.codeBlock, { color: colors.foreground, backgroundColor: colors.background }]}>
                  {ESTRUTURA_API}
                </Text>
              </View>
            </View>

            {/* .env */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>⚙️ Variáveis de Ambiente (.env)</Text>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={[styles.codeBlock, { color: "#2D6A4F", backgroundColor: colors.background }]}>
                  {ENV_EXAMPLE}
                </Text>
              </View>
            </View>

            {/* main.ts */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>🚀 main.ts — Ponto de Entrada</Text>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={[styles.codeBlock, { color: "#1565C0", backgroundColor: colors.background }]}>
                  {MAIN_TS}
                </Text>
              </View>
            </View>

            {/* Stack */}
            <View style={[styles.card, { backgroundColor: "#1B4332", padding: 16 }]}>
              <Text style={styles.stackTitulo}>Stack da API</Text>
              {[
                { nome: "Node.js", desc: "Runtime JavaScript" },
                { nome: "NestJS", desc: "Framework modular e escalável" },
                { nome: "TypeScript", desc: "Tipagem estática" },
                { nome: "Prisma ORM", desc: "Queries type-safe" },
                { nome: "PostgreSQL", desc: "Banco relacional" },
                { nome: "JWT + bcrypt", desc: "Autenticação segura" },
              ].map((tech, idx) => (
                <View key={idx} style={styles.stackRow}>
                  <Text style={styles.stackNome}>• {tech.nome}</Text>
                  <Text style={styles.stackDesc}>{tech.desc}</Text>
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
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center" },
  statValor: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  moduloHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  moduloHeaderSimple: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  moduloIcone: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  moduloNome: { fontSize: 15, fontWeight: "700", fontFamily: "monospace" },
  moduloDesc: { fontSize: 12, marginTop: 2 },
  moduloCount: { fontSize: 11, marginTop: 2 },
  endpointsList: { borderTopWidth: StyleSheet.hairlineWidth },
  endpointRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  methodBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  methodText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  epPath: { fontSize: 13, fontFamily: "monospace", fontWeight: "600" },
  epDesc: { fontSize: 11, marginTop: 2 },
  rolesRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: "600" },
  legendaTitulo: { fontSize: 13, fontWeight: "700", marginBottom: 10 },
  legendaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  authInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  authText: { fontSize: 12 },
  perfilHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  perfilIcone: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  perfilNome: { fontSize: 16, fontWeight: "700" },
  perfilCount: { fontSize: 12, marginTop: 2 },
  perfilBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  perfilSecao: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  permRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  permDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  permText: { fontSize: 13, flex: 1 },
  filtroBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filtroText: { fontSize: 12, fontWeight: "600" },
  segRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  segIcone: { fontSize: 18, width: 26, textAlign: "center" },
  segItem: { fontSize: 13, flex: 1 },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tipoText: { fontSize: 10, fontWeight: "700" },
  codeHeader: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  codeTitle: { fontSize: 14, fontWeight: "700" },
  codeBlock: { fontSize: 10, fontFamily: "monospace", lineHeight: 16, padding: 12, borderRadius: 8 },
  stackTitulo: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  stackRow: { marginBottom: 8 },
  stackNome: { color: "#B7E4C7", fontSize: 14, fontWeight: "600" },
  stackDesc: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
});
