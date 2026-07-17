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

type Aba = "modelos" | "enums" | "relacoes" | "comandos" | "schema";

interface Campo {
  nome: string;
  tipo: string;
  modificadores?: string[];
  relacao?: string;
  pk?: boolean;
  fk?: boolean;
  unique?: boolean;
  opcional?: boolean;
}

interface Modelo {
  nome: string;
  icone: string;
  cor: string;
  desc: string;
  campos: Campo[];
  relacoes: string[];
}

const MODELOS: Modelo[] = [
  {
    nome: "Usuario",
    icone: "👤",
    cor: "#1565C0",
    desc: "Usuários do sistema (todos os perfis)",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "nome", tipo: "String" },
      { nome: "email", tipo: "String?", modificadores: ["@unique"], opcional: true, unique: true },
      { nome: "telefone", tipo: "String?", opcional: true },
      { nome: "senhaHash", tipo: "String" },
      { nome: "tipoUsuario", tipo: "TipoUsuario" },
      { nome: "status", tipo: "StatusGeral", modificadores: ["@default(ATIVO)"] },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "atualizadoEm", tipo: "DateTime", modificadores: ["@updatedAt"] },
      { nome: "produtor", tipo: "Produtor?", relacao: "1:1", opcional: true },
      { nome: "relatoriosTecnicos", tipo: "Relatorio[]", relacao: "1:N" },
    ],
    relacoes: ["Produtor (1:1)", "Relatorio (1:N via TecnicoRelatorios)"],
  },
  {
    nome: "Produtor",
    icone: "🌾",
    cor: "#2D6A4F",
    desc: "Perfil específico de produtores rurais",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "usuarioId", tipo: "String", modificadores: ["@unique"], fk: true, unique: true },
      { nome: "documento", tipo: "String?", opcional: true },
      { nome: "cidade", tipo: "String?", opcional: true },
      { nome: "estado", tipo: "String?", opcional: true },
      { nome: "pais", tipo: "String?", opcional: true },
      { nome: "regiao", tipo: "String?", opcional: true },
      { nome: "tipoProdutor", tipo: "String?", opcional: true },
      { nome: "ativo", tipo: "Boolean", modificadores: ["@default(true)"] },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "usuario", tipo: "Usuario", relacao: "N:1", fk: true },
      { nome: "propriedades", tipo: "Propriedade[]", relacao: "1:N" },
      { nome: "diagnosticos", tipo: "DiagnosticoIA[]", relacao: "1:N" },
      { nome: "analises", tipo: "AnaliseFitotecnica[]", relacao: "1:N" },
      { nome: "relatorios", tipo: "Relatorio[]", relacao: "1:N" },
      { nome: "produtos", tipo: "ProdutoMarketplace[]", relacao: "1:N" },
    ],
    relacoes: ["Usuario (N:1)", "Propriedade (1:N)", "DiagnosticoIA (1:N)", "AnaliseFitotecnica (1:N)", "Relatorio (1:N)", "ProdutoMarketplace (1:N)"],
  },
  {
    nome: "Propriedade",
    icone: "🏡",
    cor: "#40916C",
    desc: "Propriedades rurais dos produtores",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "produtorId", tipo: "String", fk: true },
      { nome: "nome", tipo: "String" },
      { nome: "cidade", tipo: "String?", opcional: true },
      { nome: "estado", tipo: "String?", opcional: true },
      { nome: "pais", tipo: "String?", opcional: true },
      { nome: "latitude", tipo: "Decimal?", opcional: true },
      { nome: "longitude", tipo: "Decimal?", opcional: true },
      { nome: "tamanhoArea", tipo: "Decimal?", opcional: true },
      { nome: "tipoSolo", tipo: "String?", opcional: true },
      { nome: "fonteAgua", tipo: "String?", opcional: true },
      { nome: "sistemaIrrigacao", tipo: "String?", opcional: true },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "produtor", tipo: "Produtor", relacao: "N:1", fk: true },
      { nome: "culturas", tipo: "Cultura[]", relacao: "1:N" },
      { nome: "diagnosticos", tipo: "DiagnosticoIA[]", relacao: "1:N" },
      { nome: "analises", tipo: "AnaliseFitotecnica[]", relacao: "1:N" },
      { nome: "sensores", tipo: "Sensor[]", relacao: "1:N" },
    ],
    relacoes: ["Produtor (N:1)", "Cultura (1:N)", "DiagnosticoIA (1:N)", "AnaliseFitotecnica (1:N)", "Sensor (1:N)"],
  },
  {
    nome: "Cultura",
    icone: "🌱",
    cor: "#52B788",
    desc: "Cultivos e fases fenológicas",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "propriedadeId", tipo: "String", fk: true },
      { nome: "nomeCultura", tipo: "String" },
      { nome: "variedade", tipo: "String?", opcional: true },
      { nome: "dataPlantio", tipo: "DateTime?", opcional: true },
      { nome: "faseAtual", tipo: "String?", opcional: true },
      { nome: "areaPlantada", tipo: "Decimal?", opcional: true },
      { nome: "previsaoColheita", tipo: "DateTime?", opcional: true },
      { nome: "status", tipo: "StatusGeral", modificadores: ["@default(ATIVO)"] },
      { nome: "propriedade", tipo: "Propriedade", relacao: "N:1", fk: true },
      { nome: "diagnosticos", tipo: "DiagnosticoIA[]", relacao: "1:N" },
      { nome: "analises", tipo: "AnaliseFitotecnica[]", relacao: "1:N" },
      { nome: "calendario", tipo: "CalendarioCuidado[]", relacao: "1:N" },
    ],
    relacoes: ["Propriedade (N:1)", "DiagnosticoIA (1:N)", "AnaliseFitotecnica (1:N)", "CalendarioCuidado (1:N)"],
  },
  {
    nome: "DiagnosticoIA",
    icone: "🔬",
    cor: "#D4A017",
    desc: "Diagnósticos fitossanitários por IA",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "produtorId", tipo: "String", fk: true },
      { nome: "propriedadeId", tipo: "String?", fk: true, opcional: true },
      { nome: "culturaId", tipo: "String?", fk: true, opcional: true },
      { nome: "imagemUrl", tipo: "String" },
      { nome: "partePlanta", tipo: "String?", opcional: true },
      { nome: "sintomasInformados", tipo: "String?", opcional: true },
      { nome: "resultado", tipo: "String?", opcional: true },
      { nome: "pragaProvavel", tipo: "String?", opcional: true },
      { nome: "doencaProvavel", tipo: "String?", opcional: true },
      { nome: "deficienciaNutricional", tipo: "String?", opcional: true },
      { nome: "gravidade", tipo: "Gravidade?", opcional: true },
      { nome: "confiancaIA", tipo: "Decimal?", opcional: true },
      { nome: "recomendacao", tipo: "String?", opcional: true },
      { nome: "statusRevisao", tipo: "String?", modificadores: ['@default("pendente")'], opcional: true },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "relatorios", tipo: "Relatorio[]", relacao: "1:N" },
    ],
    relacoes: ["Produtor (N:1)", "Propriedade (N:1 opcional)", "Cultura (N:1 opcional)", "Relatorio (1:N)"],
  },
  {
    nome: "AnaliseFitotecnica",
    icone: "🧪",
    cor: "#00695C",
    desc: "Análises de solo, água e nutrientes",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "produtorId", tipo: "String", fk: true },
      { nome: "propriedadeId", tipo: "String?", fk: true, opcional: true },
      { nome: "culturaId", tipo: "String?", fk: true, opcional: true },
      { nome: "tipoAnalise", tipo: "String" },
      { nome: "ph", tipo: "Decimal?", opcional: true },
      { nome: "nitrogenio", tipo: "Decimal?", opcional: true },
      { nome: "fosforo", tipo: "Decimal?", opcional: true },
      { nome: "potassio", tipo: "Decimal?", opcional: true },
      { nome: "calcio", tipo: "Decimal?", opcional: true },
      { nome: "magnesio", tipo: "Decimal?", opcional: true },
      { nome: "materiaOrganica", tipo: "Decimal?", opcional: true },
      { nome: "umidade", tipo: "Decimal?", opcional: true },
      { nome: "condutividadeEletrica", tipo: "Decimal?", opcional: true },
      { nome: "resultadoTecnico", tipo: "String?", opcional: true },
      { nome: "recomendacao", tipo: "String?", opcional: true },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "relatorios", tipo: "Relatorio[]", relacao: "1:N" },
    ],
    relacoes: ["Produtor (N:1)", "Propriedade (N:1 opcional)", "Cultura (N:1 opcional)", "Relatorio (1:N)"],
  },
  {
    nome: "Relatorio",
    icone: "📄",
    cor: "#6B4226",
    desc: "Laudos e relatórios técnicos em PDF",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "produtorId", tipo: "String", fk: true },
      { nome: "diagnosticoId", tipo: "String?", fk: true, opcional: true },
      { nome: "analiseId", tipo: "String?", fk: true, opcional: true },
      { nome: "tecnicoResponsavelId", tipo: "String?", fk: true, opcional: true },
      { nome: "titulo", tipo: "String" },
      { nome: "tipoRelatorio", tipo: "String" },
      { nome: "arquivoPdfUrl", tipo: "String?", opcional: true },
      { nome: "status", tipo: "String", modificadores: ['@default("gerado")'] },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
    ],
    relacoes: ["Produtor (N:1)", "DiagnosticoIA (N:1 opcional)", "AnaliseFitotecnica (N:1 opcional)", "Usuario/Técnico (N:1 opcional)"],
  },
  {
    nome: "PragaDoenca",
    icone: "🦗",
    cor: "#C62828",
    desc: "Banco de pragas e doenças agrícolas",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "nome", tipo: "String" },
      { nome: "tipo", tipo: "String" },
      { nome: "culturaAfetada", tipo: "String?", opcional: true },
      { nome: "sintomas", tipo: "String?", opcional: true },
      { nome: "causas", tipo: "String?", opcional: true },
      { nome: "tratamento", tipo: "String?", opcional: true },
      { nome: "prevencao", tipo: "String?", opcional: true },
      { nome: "imagensReferencia", tipo: "String?", opcional: true },
      { nome: "nivelRisco", tipo: "String?", opcional: true },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
    ],
    relacoes: [],
  },
  {
    nome: "MaterialDidatico",
    icone: "📚",
    cor: "#5C4033",
    desc: "Conteúdo educativo para produtores",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "titulo", tipo: "String" },
      { nome: "tipoMaterial", tipo: "String" },
      { nome: "tema", tipo: "String?", opcional: true },
      { nome: "descricao", tipo: "String?", opcional: true },
      { nome: "arquivoUrl", tipo: "String?", opcional: true },
      { nome: "videoUrl", tipo: "String?", opcional: true },
      { nome: "idioma", tipo: "String?", modificadores: ['@default("pt-BR")'], opcional: true },
      { nome: "publicoAlvo", tipo: "String?", opcional: true },
      { nome: "status", tipo: "StatusGeral", modificadores: ["@default(ATIVO)"] },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
    ],
    relacoes: [],
  },
  {
    nome: "CalendarioCuidado",
    icone: "📅",
    cor: "#E65100",
    desc: "Eventos e atividades agrícolas programadas",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "produtorId", tipo: "String", fk: true },
      { nome: "propriedadeId", tipo: "String?", fk: true, opcional: true },
      { nome: "culturaId", tipo: "String?", fk: true, opcional: true },
      { nome: "tipoAtividade", tipo: "String" },
      { nome: "descricao", tipo: "String?", opcional: true },
      { nome: "dataProgramada", tipo: "DateTime" },
      { nome: "recorrencia", tipo: "String?", opcional: true },
      { nome: "status", tipo: "String", modificadores: ['@default("pendente")'] },
      { nome: "lembreteAtivo", tipo: "Boolean", modificadores: ["@default(true)"] },
      { nome: "cultura", tipo: "Cultura?", relacao: "N:1", opcional: true },
    ],
    relacoes: ["Cultura (N:1 opcional)"],
  },
  {
    nome: "Sensor",
    icone: "📡",
    cor: "#6A1B9A",
    desc: "Sensores IoT instalados nas propriedades",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "propriedadeId", tipo: "String", fk: true },
      { nome: "tipoSensor", tipo: "String" },
      { nome: "codigoSensor", tipo: "String", modificadores: ["@unique"], unique: true },
      { nome: "localInstalacao", tipo: "String?", opcional: true },
      { nome: "status", tipo: "StatusGeral", modificadores: ["@default(ATIVO)"] },
      { nome: "ultimaLeitura", tipo: "Decimal?", opcional: true },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "propriedade", tipo: "Propriedade", relacao: "N:1", fk: true },
      { nome: "leituras", tipo: "LeituraSensor[]", relacao: "1:N" },
    ],
    relacoes: ["Propriedade (N:1)", "LeituraSensor (1:N)"],
  },
  {
    nome: "LeituraSensor",
    icone: "📊",
    cor: "#7B1FA2",
    desc: "Leituras históricas dos sensores IoT",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "sensorId", tipo: "String", fk: true },
      { nome: "valor", tipo: "Decimal" },
      { nome: "unidade", tipo: "String" },
      { nome: "alertaGerado", tipo: "Boolean", modificadores: ["@default(false)"] },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "sensor", tipo: "Sensor", relacao: "N:1", fk: true },
    ],
    relacoes: ["Sensor (N:1)"],
  },
  {
    nome: "ProdutoMarketplace",
    icone: "🛒",
    cor: "#D84315",
    desc: "Produtos agrícolas no marketplace",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "produtorId", tipo: "String", fk: true },
      { nome: "nomeProduto", tipo: "String" },
      { nome: "categoria", tipo: "String?", opcional: true },
      { nome: "descricao", tipo: "String?", opcional: true },
      { nome: "preco", tipo: "Decimal" },
      { nome: "estoque", tipo: "Decimal?", opcional: true },
      { nome: "unidade", tipo: "String?", opcional: true },
      { nome: "imagemUrl", tipo: "String?", opcional: true },
      { nome: "status", tipo: "StatusGeral", modificadores: ["@default(ATIVO)"] },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
      { nome: "produtor", tipo: "Produtor", relacao: "N:1", fk: true },
    ],
    relacoes: ["Produtor (N:1)"],
  },
  {
    nome: "Pedido",
    icone: "📦",
    cor: "#BF360C",
    desc: "Pedidos e transações do marketplace",
    campos: [
      { nome: "id", tipo: "String", modificadores: ["@id", "@default(uuid())"], pk: true },
      { nome: "compradorId", tipo: "String", fk: true },
      { nome: "produtorId", tipo: "String", fk: true },
      { nome: "valorTotal", tipo: "Decimal" },
      { nome: "statusPedido", tipo: "String", modificadores: ['@default("pendente")'] },
      { nome: "statusPagamento", tipo: "String", modificadores: ['@default("pendente")'] },
      { nome: "enderecoEntrega", tipo: "String?", opcional: true },
      { nome: "criadoEm", tipo: "DateTime", modificadores: ["@default(now())"] },
    ],
    relacoes: ["Usuario/Comprador (N:1)", "Produtor (N:1)"],
  },
];

const ENUMS = [
  {
    nome: "TipoUsuario",
    cor: "#1565C0",
    desc: "Tipos de perfil de acesso ao sistema",
    valores: [
      { nome: "ADMINISTRADOR", desc: "Acesso total ao sistema" },
      { nome: "TECNICO", desc: "Revisar diagnósticos e emitir laudos" },
      { nome: "PRODUTOR", desc: "Cadastrar propriedades e culturas" },
      { nome: "PARCEIRO", desc: "Marketplace e serviços" },
      { nome: "COMPRADOR", desc: "Visualizar e comprar produtos" },
    ],
  },
  {
    nome: "StatusGeral",
    cor: "#2D6A4F",
    desc: "Status genérico para entidades do sistema",
    valores: [
      { nome: "ATIVO", desc: "Registro ativo e operacional" },
      { nome: "INATIVO", desc: "Registro desativado" },
      { nome: "PENDENTE", desc: "Aguardando aprovação/ação" },
      { nome: "BLOQUEADO", desc: "Acesso bloqueado pelo admin" },
    ],
  },
  {
    nome: "Gravidade",
    cor: "#C62828",
    desc: "Nível de gravidade do diagnóstico fitossanitário",
    valores: [
      { nome: "BAIXA", desc: "Problema leve, monitorar" },
      { nome: "MEDIA", desc: "Atenção necessária" },
      { nome: "ALTA", desc: "Tratamento urgente" },
      { nome: "CRITICA", desc: "Risco de perda total da cultura" },
    ],
  },
];

const RELACOES = [
  { de: "Usuario", para: "Produtor", tipo: "1:1", desc: "Um usuário pode ter um perfil de produtor" },
  { de: "Usuario", para: "Relatorio", tipo: "1:N", desc: "Técnico pode ser responsável por múltiplos relatórios" },
  { de: "Produtor", para: "Propriedade", tipo: "1:N", desc: "Produtor possui múltiplas propriedades" },
  { de: "Produtor", para: "DiagnosticoIA", tipo: "1:N", desc: "Produtor realiza múltiplos diagnósticos" },
  { de: "Produtor", para: "AnaliseFitotecnica", tipo: "1:N", desc: "Produtor registra múltiplas análises" },
  { de: "Produtor", para: "Relatorio", tipo: "1:N", desc: "Produtor possui múltiplos relatórios" },
  { de: "Produtor", para: "ProdutoMarketplace", tipo: "1:N", desc: "Produtor vende múltiplos produtos" },
  { de: "Propriedade", para: "Cultura", tipo: "1:N", desc: "Propriedade tem múltiplos cultivos" },
  { de: "Propriedade", para: "DiagnosticoIA", tipo: "1:N", desc: "Diagnósticos vinculados à propriedade" },
  { de: "Propriedade", para: "AnaliseFitotecnica", tipo: "1:N", desc: "Análises vinculadas à propriedade" },
  { de: "Propriedade", para: "Sensor", tipo: "1:N", desc: "Sensores instalados na propriedade" },
  { de: "Cultura", para: "DiagnosticoIA", tipo: "1:N", desc: "Diagnósticos por cultura específica" },
  { de: "Cultura", para: "CalendarioCuidado", tipo: "1:N", desc: "Eventos do calendário por cultura" },
  { de: "DiagnosticoIA", para: "Relatorio", tipo: "1:N", desc: "Diagnóstico pode gerar múltiplos relatórios" },
  { de: "AnaliseFitotecnica", para: "Relatorio", tipo: "1:N", desc: "Análise pode gerar múltiplos relatórios" },
  { de: "Sensor", para: "LeituraSensor", tipo: "1:N", desc: "Sensor registra múltiplas leituras históricas" },
];

const COMANDOS = `# Gerar cliente Prisma
npx prisma generate

# Criar migration inicial
npx prisma migrate dev --name init_afu

# Aplicar migrations em produção
npx prisma migrate deploy

# Visualizar banco no Prisma Studio
npx prisma studio

# Resetar banco (dev only)
npx prisma migrate reset

# Verificar status das migrations
npx prisma migrate status`;

const SCHEMA_PRISMA = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TipoUsuario {
  ADMINISTRADOR
  TECNICO
  PRODUTOR
  PARCEIRO
  COMPRADOR
}

enum StatusGeral {
  ATIVO
  INATIVO
  PENDENTE
  BLOQUEADO
}

enum Gravidade {
  BAIXA
  MEDIA
  ALTA
  CRITICA
}

model Usuario {
  id           String      @id @default(uuid())
  nome         String
  email        String?     @unique
  telefone     String?
  senhaHash    String
  tipoUsuario  TipoUsuario
  status       StatusGeral @default(ATIVO)
  criadoEm     DateTime    @default(now())
  atualizadoEm DateTime    @updatedAt

  produtor           Produtor?
  relatoriosTecnicos Relatorio[] @relation("TecnicoRelatorios")
}

model Produtor {
  id           String   @id @default(uuid())
  usuarioId    String   @unique
  documento    String?
  cidade       String?
  estado       String?
  pais         String?
  regiao       String?
  tipoProdutor String?
  ativo        Boolean  @default(true)
  criadoEm     DateTime @default(now())

  usuario      Usuario              @relation(fields: [usuarioId], references: [id])
  propriedades Propriedade[]
  diagnosticos DiagnosticoIA[]
  analises     AnaliseFitotecnica[]
  relatorios   Relatorio[]
  produtos     ProdutoMarketplace[]
}

// ... (14 modelos no total)`;

export default function PrismaSchemaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("modelos");
  const [modeloExpandido, setModeloExpandido] = useState<string | null>(null);
  const [enumExpandido, setEnumExpandido] = useState<string | null>(null);

  const abas: { id: Aba; label: string }[] = [
    { id: "modelos", label: "Modelos" },
    { id: "enums", label: "Enums" },
    { id: "relacoes", label: "Relações" },
    { id: "comandos", label: "Comandos" },
    { id: "schema", label: "Schema" },
  ];

  const totalCampos = MODELOS.reduce((acc, m) => acc + m.campos.length, 0);

  const getTipoCor = (tipo: string) => {
    if (tipo.startsWith("String")) return "#1565C0";
    if (tipo.startsWith("Decimal")) return "#2D6A4F";
    if (tipo.startsWith("Boolean")) return "#E65100";
    if (tipo.startsWith("DateTime")) return "#6A1B9A";
    if (tipo.endsWith("[]")) return "#C62828";
    if (tipo === "TipoUsuario" || tipo === "StatusGeral" || tipo === "Gravidade") return "#D4A017";
    return "#6B7280";
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B4332" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🗄️ Schema Prisma</Text>
          <Text style={styles.headerSubtitle}>AFU — Etapa 6 · {MODELOS.length} modelos · {ENUMS.length} enums · {totalCampos} campos</Text>
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
        <AfuStackBanner note="Schema de referência Prisma/PostgreSQL. Fonte de verdade: drizzle/schema.ts (MySQL 8)." />

        {/* ─── MODELOS ─── */}
        {abaAtiva === "modelos" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>14 Modelos do Banco de Dados</Text>
              <Text style={styles.infoSubtitle}>Prisma ORM · PostgreSQL · {totalCampos} campos no total</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Modelos", valor: MODELOS.length.toString(), cor: "#2D6A4F" },
                { label: "Enums", valor: ENUMS.length.toString(), cor: "#D4A017" },
                { label: "Relações", valor: RELACOES.length.toString(), cor: "#1565C0" },
                { label: "Campos", valor: totalCampos.toString(), cor: "#6A1B9A" },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.statValor, { color: s.cor }]}>{s.valor}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {MODELOS.map((modelo) => (
              <View key={modelo.nome} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.modeloHeader}
                  onPress={() => setModeloExpandido(modeloExpandido === modelo.nome ? null : modelo.nome)}
                >
                  <View style={[styles.modeloIcone, { backgroundColor: modelo.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{modelo.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeloNome, { color: modelo.cor }]}>model {modelo.nome}</Text>
                    <Text style={[styles.modeloDesc, { color: colors.muted }]}>{modelo.desc}</Text>
                    <Text style={[styles.modeloCount, { color: colors.muted }]}>
                      {modelo.campos.filter(c => !c.relacao).length} campos · {modelo.relacoes.length} relações
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {modeloExpandido === modelo.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {modeloExpandido === modelo.nome && (
                  <View style={[styles.camposList, { borderTopColor: colors.border }]}>
                    {modelo.campos.map((campo, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.campoRow,
                          idx < modelo.campos.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                      >
                        <View style={styles.campoLeft}>
                          {campo.pk && <View style={[styles.badgePK, { backgroundColor: "#D4A017" }]}><Text style={styles.badgeText}>PK</Text></View>}
                          {campo.fk && !campo.pk && <View style={[styles.badgePK, { backgroundColor: "#1565C0" }]}><Text style={styles.badgeText}>FK</Text></View>}
                          {campo.unique && !campo.pk && !campo.fk && <View style={[styles.badgePK, { backgroundColor: "#6A1B9A" }]}><Text style={styles.badgeText}>UQ</Text></View>}
                          {!campo.pk && !campo.fk && !campo.unique && <View style={styles.badgePK}><Text style={[styles.badgeText, { color: "#transparent" }]}> </Text></View>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.campoNomeRow}>
                            <Text style={[styles.campoNome, { color: colors.foreground }]}>{campo.nome}</Text>
                            {campo.opcional && <Text style={[styles.opcionalBadge, { color: colors.muted }]}>?</Text>}
                          </View>
                          {campo.modificadores && campo.modificadores.length > 0 && (
                            <Text style={[styles.campoMod, { color: colors.muted }]}>{campo.modificadores.join(" ")}</Text>
                          )}
                        </View>
                        <Text style={[styles.campoTipo, { color: getTipoCor(campo.tipo) }]}>{campo.tipo}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── ENUMS ─── */}
        {abaAtiva === "enums" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>3 Enumerações (Enums)</Text>
              <Text style={styles.infoSubtitle}>Valores fixos para tipos, status e gravidade</Text>
            </View>

            {/* Legenda de tipos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.legendaTitulo, { color: colors.foreground }]}>Tipos de Campos</Text>
              <View style={styles.legendaGrid}>
                {[
                  { tipo: "String", cor: "#1565C0" },
                  { tipo: "Decimal", cor: "#2D6A4F" },
                  { tipo: "Boolean", cor: "#E65100" },
                  { tipo: "DateTime", cor: "#6A1B9A" },
                  { tipo: "Enum", cor: "#D4A017" },
                  { tipo: "Relation[]", cor: "#C62828" },
                ].map((t) => (
                  <View key={t.tipo} style={[styles.tipoBadgeLegenda, { backgroundColor: t.cor + "20", borderColor: t.cor }]}>
                    <Text style={[styles.tipoTextLegenda, { color: t.cor }]}>{t.tipo}</Text>
                  </View>
                ))}
              </View>
            </View>

            {ENUMS.map((enumItem) => (
              <View key={enumItem.nome} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.enumHeader}
                  onPress={() => setEnumExpandido(enumExpandido === enumItem.nome ? null : enumItem.nome)}
                >
                  <View style={[styles.enumIcone, { backgroundColor: enumItem.cor + "20" }]}>
                    <Text style={[styles.enumKeyword, { color: enumItem.cor }]}>enum</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.enumNome, { color: enumItem.cor }]}>{enumItem.nome}</Text>
                    <Text style={[styles.enumDesc, { color: colors.muted }]}>{enumItem.desc}</Text>
                    <Text style={[styles.enumCount, { color: colors.muted }]}>{enumItem.valores.length} valores</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {enumExpandido === enumItem.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {enumExpandido === enumItem.nome && (
                  <View style={[styles.enumBody, { borderTopColor: colors.border }]}>
                    {enumItem.valores.map((val, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.enumValorRow,
                          idx < enumItem.valores.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                      >
                        <View style={[styles.enumValorBadge, { backgroundColor: enumItem.cor + "20" }]}>
                          <Text style={[styles.enumValorText, { color: enumItem.cor }]}>{val.nome}</Text>
                        </View>
                        <Text style={[styles.enumValorDesc, { color: colors.muted }]}>{val.desc}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── RELAÇÕES ─── */}
        {abaAtiva === "relacoes" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>🔗 Relações entre Modelos</Text>
              <Text style={styles.infoSubtitle}>{RELACOES.length} relações mapeadas no schema</Text>
            </View>

            {/* Legenda */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.legendaTitulo, { color: colors.foreground }]}>Tipos de Relação</Text>
              <View style={styles.legendaGrid}>
                {[
                  { tipo: "1:1", cor: "#1565C0", desc: "Um para um" },
                  { tipo: "1:N", cor: "#2D6A4F", desc: "Um para muitos" },
                  { tipo: "N:1", cor: "#D4A017", desc: "Muitos para um" },
                ].map((t) => (
                  <View key={t.tipo} style={styles.relacaoLegendaItem}>
                    <View style={[styles.relacaoBadge, { backgroundColor: t.cor }]}>
                      <Text style={styles.relacaoBadgeText}>{t.tipo}</Text>
                    </View>
                    <Text style={[styles.relacaoLegendaDesc, { color: colors.muted }]}>{t.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {RELACOES.map((rel, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.relacaoRow,
                    idx < RELACOES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={styles.relacaoModelos}>
                    <Text style={[styles.relacaoModelo, { color: "#2D6A4F" }]}>{rel.de}</Text>
                    <View style={[styles.relacaoBadge, { backgroundColor: rel.tipo === "1:1" ? "#1565C0" : rel.tipo === "1:N" ? "#2D6A4F" : "#D4A017" }]}>
                      <Text style={styles.relacaoBadgeText}>{rel.tipo}</Text>
                    </View>
                    <Text style={[styles.relacaoModelo, { color: "#C62828" }]}>{rel.para}</Text>
                  </View>
                  <Text style={[styles.relacaoDesc, { color: colors.muted }]}>{rel.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── COMANDOS ─── */}
        {abaAtiva === "comandos" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>⚡ Comandos Prisma</Text>
              <Text style={styles.infoSubtitle}>Gerar, migrar e gerenciar o banco de dados</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>🖥️ CLI Prisma</Text>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={[styles.codeBlock, { color: "#2D6A4F", backgroundColor: colors.background }]}>
                  {COMANDOS}
                </Text>
              </View>
            </View>

            {/* Fluxo de desenvolvimento */}
            <View style={[styles.card, { backgroundColor: "#1B4332", padding: 16 }]}>
              <Text style={styles.fluxoTitulo}>Fluxo de Desenvolvimento</Text>
              {[
                { step: "1", acao: "Editar schema.prisma", desc: "Adicionar/modificar modelos" },
                { step: "2", acao: "npx prisma generate", desc: "Regenerar cliente TypeScript" },
                { step: "3", acao: "npx prisma migrate dev", desc: "Criar e aplicar migration" },
                { step: "4", acao: "npx prisma studio", desc: "Visualizar dados no browser" },
              ].map((f) => (
                <View key={f.step} style={styles.fluxoRow}>
                  <View style={styles.fluxoStep}>
                    <Text style={styles.fluxoStepText}>{f.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fluxoAcao}>{f.acao}</Text>
                    <Text style={styles.fluxoDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── SCHEMA ─── */}
        {abaAtiva === "schema" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1B4332" }]}>
              <Text style={styles.infoTitle}>📋 schema.prisma</Text>
              <Text style={styles.infoSubtitle}>services/api/prisma/schema.prisma</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>schema.prisma (resumo)</Text>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={[styles.codeBlock, { color: "#1565C0", backgroundColor: colors.background }]}>
                  {SCHEMA_PRISMA}
                </Text>
              </View>
            </View>

            {/* Resumo dos modelos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>Todos os Modelos</Text>
              </View>
              {MODELOS.map((m, idx) => (
                <View
                  key={m.nome}
                  style={[
                    styles.schemaModeloRow,
                    idx < MODELOS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={{ fontSize: 18, width: 28 }}>{m.icone}</Text>
                  <Text style={[styles.schemaModeloNome, { color: m.cor }]}>model {m.nome}</Text>
                  <Text style={[styles.schemaModeloCampos, { color: colors.muted }]}>
                    {m.campos.filter(c => !c.relacao).length}c · {m.relacoes.length}r
                  </Text>
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
  modeloHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  modeloIcone: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modeloNome: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  modeloDesc: { fontSize: 12, marginTop: 2 },
  modeloCount: { fontSize: 11, marginTop: 2 },
  camposList: { borderTopWidth: StyleSheet.hairlineWidth },
  campoRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  campoLeft: { width: 28, alignItems: "center", paddingTop: 2 },
  badgePK: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, backgroundColor: "transparent" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  campoNomeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  campoNome: { fontSize: 13, fontFamily: "monospace", fontWeight: "600" },
  opcionalBadge: { fontSize: 16, fontWeight: "700" },
  campoMod: { fontSize: 10, fontFamily: "monospace", marginTop: 1 },
  campoTipo: { fontSize: 12, fontFamily: "monospace", fontWeight: "600", alignSelf: "flex-start", paddingTop: 2 },
  legendaTitulo: { fontSize: 13, fontWeight: "700", marginBottom: 10 },
  legendaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  tipoBadgeLegenda: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tipoTextLegenda: { fontSize: 11, fontWeight: "700" },
  enumHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  enumIcone: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  enumKeyword: { fontSize: 11, fontWeight: "800", fontFamily: "monospace" },
  enumNome: { fontSize: 15, fontWeight: "700" },
  enumDesc: { fontSize: 12, marginTop: 2 },
  enumCount: { fontSize: 11, marginTop: 2 },
  enumBody: { borderTopWidth: StyleSheet.hairlineWidth },
  enumValorRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 12 },
  enumValorBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  enumValorText: { fontSize: 12, fontWeight: "700", fontFamily: "monospace" },
  enumValorDesc: { fontSize: 12, flex: 1 },
  relacaoLegendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  relacaoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  relacaoBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  relacaoLegendaDesc: { fontSize: 11 },
  relacaoRow: { paddingHorizontal: 14, paddingVertical: 10 },
  relacaoModelos: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  relacaoModelo: { fontSize: 13, fontWeight: "700", fontFamily: "monospace" },
  relacaoDesc: { fontSize: 12 },
  codeHeader: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  codeTitle: { fontSize: 14, fontWeight: "700" },
  codeBlock: { fontSize: 10, fontFamily: "monospace", lineHeight: 16, padding: 12, borderRadius: 8 },
  fluxoTitulo: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 14 },
  fluxoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  fluxoStep: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  fluxoStepText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  fluxoAcao: { color: "#B7E4C7", fontSize: 13, fontWeight: "600", fontFamily: "monospace" },
  fluxoDesc: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  schemaModeloRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  schemaModeloNome: { fontSize: 13, fontWeight: "700", fontFamily: "monospace", flex: 1 },
  schemaModeloCampos: { fontSize: 11 },
});
