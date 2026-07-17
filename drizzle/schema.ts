import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// TABELA: users (autenticação OAuth + e-mail/senha)
// ─────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Opcional para login com e-mail/senha
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(), // Pode ser usado para login com e-mail/senha
  passwordHash: varchar("passwordHash", { length: 255 }), // Hash bcrypt para e-mail/senha
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' | 'email' | 'email_oauth'
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  resetToken: varchar("resetToken", { length: 255 }).unique(), // Token para recuperação de senha
  resetTokenExpiry: timestamp("resetTokenExpiry"), // Expiração do token de reset
  refreshToken: varchar("refreshToken", { length: 512 }), // Refresh token para renovar sessão
  refreshTokenExpiry: timestamp("refreshTokenExpiry"), // Expiração do refresh token
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tipo para login (sem expor passwordHash e tokens sensíveis)
export type UserPublic = Omit<User, 'passwordHash' | 'refreshToken'>;

// Tipo para resposta de autenticação
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
};

// Tipo para payload de refresh token
export type RefreshTokenPayload = {
  openId: string;
  appId: string;
  tokenVersion: number;
};

// Tipo para payload de access token
export type AccessTokenPayload = {
  openId: string;
  appId: string;
  name: string;
  tokenType: 'access';
};

// ─────────────────────────────────────────────
// TABELA: usuarios_afu (perfis do sistema AFU)
// ─────────────────────────────────────────────
export const usuariosAfu = mysqlTable("usuarios_afu", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK → users.id (OAuth ou e-mail/senha)
  nome: varchar("nome", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }),
  telefone: varchar("telefone", { length: 30 }),
  tipoUsuario: mysqlEnum("tipoUsuario", [
    "administrador",
    "tecnico",
    "produtor",
    "parceiro",
    "comprador",
  ])
    .default("produtor")
    .notNull(),
  status: mysqlEnum("status", ["ativo", "inativo", "suspenso"])
    .default("ativo")
    .notNull(),
  registroProfissional: varchar("registroProfissional", { length: 50 }),
  cargo: varchar("cargo", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsuarioAfu = typeof usuariosAfu.$inferSelect;
export type InsertUsuarioAfu = typeof usuariosAfu.$inferInsert;

// Tipo para resposta de usuário (sem dados sensíveis)
export type UsuarioAfuPublic = Omit<UsuarioAfu, 'createdAt' | 'updatedAt'>;

// ─────────────────────────────────────────────
// TABELA: produtores
// ─────────────────────────────────────────────
export const produtores = mysqlTable("produtores", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull().unique(), // FK → usuarios_afu.id (um-para-um)
  documento: varchar("documento", { length: 50 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 100 }),
  pais: varchar("pais", { length: 100 }).default("Brasil"),
  regiao: varchar("regiao", { length: 100 }),
  tipoProdutor: mysqlEnum("tipoProdutor", [
    "familiar",
    "comercial",
    "organico",
    "cooperado",
    "empresarial",
  ]).default("comercial"),
  cadastroAtivo: boolean("cadastroAtivo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Produtor = typeof produtores.$inferSelect;
export type InsertProdutor = typeof produtores.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: propriedades
// ─────────────────────────────────────────────
export const propriedades = mysqlTable("propriedades", {
  id: int("id").autoincrement().primaryKey(),
  produtorId: int("produtorId").notNull(), // FK → produtores.id (um-para-muitos)
  nome: varchar("nome", { length: 150 }).notNull(),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 100 }),
  pais: varchar("pais", { length: 100 }).default("Brasil"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  tamanhoArea: decimal("tamanhoArea", { precision: 12, scale: 2 }),
  unidadeArea: mysqlEnum("unidadeArea", ["ha", "alqueire", "m2"]).default("ha"),
  tipoSolo: varchar("tipoSolo", { length: 100 }),
  fonteAgua: varchar("fonteAgua", { length: 100 }),
  sistemaIrrigacao: varchar("sistemaIrrigacao", { length: 100 }),
  tipoProducao: mysqlEnum("tipoProducao", [
    "graos",
    "hortifruti",
    "fruticultura",
    "cana",
    "cafe",
    "pecuaria",
    "misto",
    "outro",
  ]).default("graos"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Propriedade = typeof propriedades.$inferSelect;
export type InsertPropriedade = typeof propriedades.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: terrenos (talhões dentro de propriedades)
// ─────────────────────────────────────────────
export const terrenos = mysqlTable("terrenos", {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(), // FK → propriedades.id
  nome: varchar("nome", { length: 100 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  tipoSolo: varchar("tipoSolo", { length: 100 }),
  sistemaIrrigacao: varchar("sistemaIrrigacao", { length: 100 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Terreno = typeof terrenos.$inferSelect;
export type InsertTerreno = typeof terrenos.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: culturas (cultivos por propriedade)
// ─────────────────────────────────────────────
export const culturas = mysqlTable("culturas", {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(), // FK → propriedades.id
  terrenoId: int("terrenoId"), // FK → terrenos.id (opcional)
  nomeCultura: varchar("nomeCultura", { length: 100 }).notNull(),
  variedade: varchar("variedade", { length: 100 }),
  dataPlantio: date("dataPlantio"),
  faseAtual: varchar("faseAtual", { length: 100 }),
  areaPlantada: decimal("areaPlantada", { precision: 12, scale: 2 }),
  previsaoColheita: date("previsaoColheita"),
  producaoEstimada: decimal("producaoEstimada", { precision: 12, scale: 2 }),
  unidadeProducao: varchar("unidadeProducao", { length: 30 }),
  status: mysqlEnum("status", [
    "planejado",
    "em_andamento",
    "colhido",
    "perdido",
  ]).default("em_andamento"),
  observacoes: text("observacoes"),
  culturaCatalogoId: int("culturaCatalogoId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cultura = typeof culturas.$inferSelect;
export type InsertCultura = typeof culturas.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: diagnosticos_ia
// ─────────────────────────────────────────────
export const diagnosticosIa = mysqlTable("diagnosticos_ia", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  propriedadeId: int("propriedadeId"), // FK → propriedades.id
  culturaId: int("culturaId"), // FK → culturas.id
  imagemUrl: text("imagemUrl"),
  partePlanta: varchar("partePlanta", { length: 50 }),
  sintomasInformados: text("sintomasInformados"),
  resultado: text("resultado"), // JSON com análise completa
  pragaProvavel: varchar("pragaProvavel", { length: 150 }),
  doencaProvavel: varchar("doencaProvavel", { length: 150 }),
  deficienciaNutricional: varchar("deficienciaNutricional", { length: 150 }),
  gravidade: mysqlEnum("gravidade", [
    "saudavel",
    "leve",
    "moderada",
    "grave",
    "critica",
  ]).default("saudavel"),
  confiancaIa: int("confiancaIa"), // 0-100
  recomendacao: text("recomendacao"),
  statusRevisao: mysqlEnum("statusRevisao", [
    "pendente",
    "revisado",
    "confirmado",
    "descartado",
  ]).default("pendente"),
  dataDiagnostico: timestamp("dataDiagnostico").defaultNow().notNull(),
});

export type DiagnosticoIa = typeof diagnosticosIa.$inferSelect;
export type InsertDiagnosticoIa = typeof diagnosticosIa.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: analises_fitotecnicas
// ─────────────────────────────────────────────
export const analisesFitotecnicas = mysqlTable("analises_fitotecnicas", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  propriedadeId: int("propriedadeId"), // FK → propriedades.id
  culturaId: int("culturaId"), // FK → culturas.id
  tipoAnalise: mysqlEnum("tipoAnalise", [
    "solo",
    "agua",
    "foliar",
    "completa",
  ]).default("solo"),
  phSolo: decimal("phSolo", { precision: 4, scale: 2 }),
  phAgua: decimal("phAgua", { precision: 4, scale: 2 }),
  nitrogenio: decimal("nitrogenio", { precision: 8, scale: 3 }),
  fosforo: decimal("fosforo", { precision: 8, scale: 3 }),
  potassio: decimal("potassio", { precision: 8, scale: 3 }),
  calcio: decimal("calcio", { precision: 8, scale: 3 }),
  magnesio: decimal("magnesio", { precision: 8, scale: 3 }),
  materiaOrganica: decimal("materiaOrganica", { precision: 6, scale: 2 }),
  umidade: decimal("umidade", { precision: 6, scale: 2 }),
  condutividadeEletrica: decimal("condutividadeEletrica", {
    precision: 8,
    scale: 4,
  }),
  resultadoTecnico: text("resultadoTecnico"), // JSON com interpretação da IA
  recomendacao: text("recomendacao"),
  dataAnalise: timestamp("dataAnalise").defaultNow().notNull(),
});

export type AnaliseFitotecnica = typeof analisesFitotecnicas.$inferSelect;
export type InsertAnaliseFitotecnica =
  typeof analisesFitotecnicas.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: relatorios
// ─────────────────────────────────────────────
export const relatorios = mysqlTable("relatorios", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  diagnosticoId: int("diagnosticoId"), // FK → diagnosticos_ia.id
  analiseId: int("analiseId"), // FK → analises_fitotecnicas.id
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipoRelatorio: mysqlEnum("tipoRelatorio", [
    "diagnostico",
    "analise_solo",
    "historico",
    "certificado",
    "recomendacao",
  ]).default("diagnostico"),
  arquivoPdfUrl: text("arquivoPdfUrl"),
  status: mysqlEnum("status", [
    "rascunho",
    "emitido",
    "assinado",
    "cancelado",
  ]).default("emitido"),
  tecnicoResponsavelId: int("tecnicoResponsavelId"),
  conteudo: text("conteudo"), // JSON com dados do relatório
  dataEmissao: timestamp("dataEmissao").defaultNow().notNull(),
});

export type Relatorio = typeof relatorios.$inferSelect;
export type InsertRelatorio = typeof relatorios.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: pragas_doencas (banco de conhecimento)
// ─────────────────────────────────────────────
export const pragasDoencas = mysqlTable("pragas_doencas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 150 }).notNull(),
  nomecientifico: varchar("nomeCientifico", { length: 200 }),
  tipo: mysqlEnum("tipo", ["praga", "doenca", "deficiencia"]).notNull(),
  culturaAfetada: varchar("culturaAfetada", { length: 200 }),
  sintomas: text("sintomas"),
  causas: text("causas"),
  tratamento: text("tratamento"),
  prevencao: text("prevencao"),
  imagensReferencia: text("imagensReferencia"), // JSON array de URLs
  nivelRisco: mysqlEnum("nivelRisco", ["baixo", "medio", "alto", "critico"])
    .default("medio")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PragaDoenca = typeof pragasDoencas.$inferSelect;
export type InsertPragaDoenca = typeof pragasDoencas.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: materiais_didaticos
// ─────────────────────────────────────────────
export const materiaisDidaticos = mysqlTable("materiais_didaticos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipoMaterial: mysqlEnum("tipoMaterial", [
    "video",
    "audio",
    "apostila",
    "guia",
    "checklist",
    "infografico",
  ]).notNull(),
  tema: varchar("tema", { length: 100 }),
  descricao: text("descricao"),
  arquivoUrl: text("arquivoUrl"),
  videoUrl: text("videoUrl"),
  idioma: varchar("idioma", { length: 20 }).default("pt-BR"),
  publicoAlvo: mysqlEnum("publicoAlvo", [
    "produtor",
    "tecnico",
    "todos",
  ]).default("todos"),
  nivel: mysqlEnum("nivel", [
    "iniciante",
    "intermediario",
    "avancado",
  ]).default("iniciante"),
  status: mysqlEnum("status", ["ativo", "inativo", "rascunho"]).default(
    "ativo"
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaterialDidatico = typeof materiaisDidaticos.$inferSelect;
export type InsertMaterialDidatico = typeof materiaisDidaticos.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: calendario_cuidados
// ─────────────────────────────────────────────
export const calendarioCuidados = mysqlTable("calendario_cuidados", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  propriedadeId: int("propriedadeId"), // FK → propriedades.id
  culturaId: int("culturaId"), // FK → culturas.id
  tipoAtividade: mysqlEnum("tipoAtividade", [
    "plantio",
    "irrigacao",
    "adubacao",
    "pulverizacao",
    "monitoramento",
    "colheita",
    "analise",
    "manutencao",
    "outro",
  ]).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: text("descricao"),
  dataProgramada: timestamp("dataProgramada").notNull(),
  recorrencia: mysqlEnum("recorrencia", [
    "nenhuma",
    "diaria",
    "semanal",
    "quinzenal",
    "mensal",
  ]).default("nenhuma"),
  prioridade: mysqlEnum("prioridade", [
    "baixa",
    "normal",
    "alta",
    "critica",
  ]).default("normal"),
  status: mysqlEnum("status", [
    "pendente",
    "em_andamento",
    "concluido",
    "cancelado",
  ]).default("pendente"),
  lembreteAtivo: boolean("lembreteAtivo").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarioCuidado = typeof calendarioCuidados.$inferSelect;
export type InsertCalendarioCuidado = typeof calendarioCuidados.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: sensores (IoT)
// ─────────────────────────────────────────────
export const sensores = mysqlTable("sensores", {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(), // FK → propriedades.id
  tipoSensor: mysqlEnum("tipoSensor", [
    "temperatura",
    "umidade_solo",
    "umidade_ar",
    "ph",
    "condutividade",
    "chuva",
    "vento",
    "luminosidade",
    "co2",
    "outro",
  ]).notNull(),
  codigoSensor: varchar("codigoSensor", { length: 100 }),
  localInstalacao: varchar("localInstalacao", { length: 200 }),
  status: mysqlEnum("status", [
    "ativo",
    "inativo",
    "manutencao",
    "falha",
  ]).default("ativo"),
  ultimaLeitura: decimal("ultimaLeitura", { precision: 10, scale: 4 }),
  unidadeLeitura: varchar("unidadeLeitura", { length: 20 }),
  dataInstalacao: date("dataInstalacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sensor = typeof sensores.$inferSelect;
export type InsertSensor = typeof sensores.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: leituras_sensores
// ─────────────────────────────────────────────
export const leiturasSensores = mysqlTable("leituras_sensores", {
  id: int("id").autoincrement().primaryKey(),
  sensorId: int("sensorId").notNull(), // FK → sensores.id
  valor: decimal("valor", { precision: 10, scale: 4 }).notNull(),
  unidade: varchar("unidade", { length: 20 }),
  dataLeitura: timestamp("dataLeitura").defaultNow().notNull(),
  alertaGerado: boolean("alertaGerado").default(false),
  alertaMensagem: varchar("alertaMensagem", { length: 255 }),
});

export type LeituraSensor = typeof leiturasSensores.$inferSelect;
export type InsertLeituraSensor = typeof leiturasSensores.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: produtos_marketplace
// ─────────────────────────────────────────────
export const produtosMarketplace = mysqlTable("produtos_marketplace", {
  id: int("id").autoincrement().primaryKey(),
  vendedorId: int("vendedorId").notNull(), // FK → usuarios_afu.id
  nomeProduto: varchar("nomeProduto", { length: 200 }).notNull(),
  categoria: mysqlEnum("categoria", [
    "sementes",
    "fertilizantes",
    "defensivos",
    "equipamentos",
    "servicos",
    "producao_propria",
    "outro",
  ]).notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 12, scale: 2 }),
  estoque: decimal("estoque", { precision: 12, scale: 2 }),
  unidade: varchar("unidade", { length: 30 }),
  imagemUrl: text("imagemUrl"),
  status: mysqlEnum("status", [
    "disponivel",
    "indisponivel",
    "pausado",
  ]).default("disponivel"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProdutoMarketplace = typeof produtosMarketplace.$inferSelect;
export type InsertProdutoMarketplace = typeof produtosMarketplace.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: pedidos
// ─────────────────────────────────────────────
export const pedidos = mysqlTable("pedidos", {
  id: int("id").autoincrement().primaryKey(),
  compradorId: int("compradorId").notNull(), // FK → usuarios_afu.id
  vendedorId: int("vendedorId").notNull(), // FK → usuarios_afu.id
  produtoId: int("produtoId").notNull(), // FK → produtos_marketplace.id
  quantidade: decimal("quantidade", { precision: 10, scale: 2 }).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 12, scale: 2 }),
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }),
  statusPedido: mysqlEnum("statusPedido", [
    "aguardando",
    "confirmado",
    "em_preparo",
    "enviado",
    "entregue",
    "cancelado",
  ]).default("aguardando"),
  statusPagamento: mysqlEnum("statusPagamento", [
    "pendente",
    "pago",
    "estornado",
    "cancelado",
  ]).default("pendente"),
  enderecoEntrega: text("enderecoEntrega"),
  observacoes: text("observacoes"),
  dataPedido: timestamp("dataPedido").defaultNow().notNull(),
  dataEntrega: timestamp("dataEntrega"),
});

export type Pedido = typeof pedidos.$inferSelect;
export type InsertPedido = typeof pedidos.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: tickets_suporte
// ─────────────────────────────────────────────
export const ticketsSuporte = mysqlTable("tickets_suporte", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(),
  tipo: mysqlEnum("tipo", ["chamado", "duvida", "visita", "chat"]).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: text("descricao").notNull(),
  prioridade: mysqlEnum("prioridade", ["baixa", "normal", "alta"]).default("normal"),
  status: mysqlEnum("status", ["aberto", "em_andamento", "resolvido", "cancelado"]).default("aberto"),
  culturaRelacionada: varchar("culturaRelacionada", { length: 100 }),
  dataVisita: varchar("dataVisita", { length: 30 }),
  resposta: text("resposta"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketSuporte = typeof ticketsSuporte.$inferSelect;
export type InsertTicketSuporte = typeof ticketsSuporte.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: mensagens_suporte
// ─────────────────────────────────────────────
export const mensagensSuporte = mysqlTable("mensagens_suporte", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(),
  ticketId: int("ticketId"),
  autor: mysqlEnum("autor", ["usuario", "sistema", "tecnico"]).notNull(),
  texto: text("texto").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MensagemSuporte = typeof mensagensSuporte.$inferSelect;
export type InsertMensagemSuporte = typeof mensagensSuporte.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: parceiros
// ─────────────────────────────────────────────
export const parceiros = mysqlTable("parceiros", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  tipo: mysqlEnum("tipo", [
    "laboratorio",
    "cooperativa",
    "consultoria",
    "revendedor",
    "instituicao",
    "outro",
  ]).notNull(),
  descricao: text("descricao"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 100 }),
  telefone: varchar("telefone", { length: 30 }),
  email: varchar("email", { length: 150 }),
  website: varchar("website", { length: 255 }),
  servicosOferecidos: text("servicosOferecidos"),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Parceiro = typeof parceiros.$inferSelect;
export type InsertParceiro = typeof parceiros.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: push_tokens (FCM/APNs via Expo Push)
// ─────────────────────────────────────────────
export const pushTokens = mysqlTable(
  "push_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    usuarioAfuId: int("usuarioAfuId").notNull(),
    expoPushToken: varchar("expoPushToken", { length: 255 }).notNull().unique(),
    platform: mysqlEnum("platform", ["ios", "android", "web"]).notNull(),
    deviceName: varchar("deviceName", { length: 100 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  },
  (table) => ({
    usuarioIdx: index("push_tokens_usuario_idx").on(table.usuarioAfuId),
  }),
);

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

// ─────────────────────────────────────────────
// BANCO AGRONÔMICO AVANÇADO (Etapa 30)
// ─────────────────────────────────────────────
export const culturasCatalogo = mysqlTable("culturas_catalogo", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nomePopular: varchar("nomePopular", { length: 150 }).notNull(),
  nomeCientifico: varchar("nomeCientifico", { length: 200 }),
  familiaBotanica: varchar("familiaBotanica", { length: 100 }),
  categoria: varchar("categoria", { length: 50 }),
  descricao: text("descricao"),
  cicloProdutivoMin: int("cicloProdutivoMin"),
  cicloProdutivoMax: int("cicloProdutivoMax"),
  fasesFenologicas: text("fasesFenologicas"),
  tipoSolo: text("tipoSolo"),
  epocasPlantio: text("epocasPlantio"),
  produtividadeMedia: varchar("produtividadeMedia", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CulturaCatalogo = typeof culturasCatalogo.$inferSelect;
export type InsertCulturaCatalogo = typeof culturasCatalogo.$inferInsert;

export const climaCultura = mysqlTable("clima_cultura", {
  id: int("id").autoincrement().primaryKey(),
  culturaCatalogoId: int("culturaCatalogoId").notNull(),
  temperaturaMin: decimal("temperaturaMin", { precision: 5, scale: 1 }),
  temperaturaMax: decimal("temperaturaMax", { precision: 5, scale: 1 }),
  precipitacaoMin: int("precipitacaoMin"),
  precipitacaoMax: int("precipitacaoMax"),
  necessidadeLuz: text("necessidadeLuz"),
});

export const irrigacaoCultura = mysqlTable("irrigacao_cultura", {
  id: int("id").autoincrement().primaryKey(),
  culturaCatalogoId: int("culturaCatalogoId").notNull(),
  metodoRecomendado: varchar("metodoRecomendado", { length: 100 }),
  laminaAgua: varchar("laminaAgua", { length: 100 }),
  frequencia: varchar("frequencia", { length: 150 }),
});

export const nutrientesCultura = mysqlTable("nutrientes_cultura", {
  id: int("id").autoincrement().primaryKey(),
  culturaCatalogoId: int("culturaCatalogoId").notNull(),
  nutriente: varchar("nutriente", { length: 10 }).notNull(),
  tipo: mysqlEnum("tipo", ["macro", "micro"]).notNull(),
  exigencia: varchar("exigencia", { length: 50 }),
  observacoes: text("observacoes"),
});

export const geneticaCultura = mysqlTable("genetica_cultura", {
  id: int("id").autoincrement().primaryKey(),
  culturaCatalogoId: int("culturaCatalogoId").notNull(),
  geracao: mysqlEnum("geracao", ["G1", "G2", "G3", "G4", "G5"]).notNull(),
  descricao: text("descricao"),
});

export const pragasCatalogo = mysqlTable("pragas_catalogo", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 150 }).notNull(),
  nomeCientifico: varchar("nomeCientifico", { length: 200 }),
  nivelRisco: mysqlEnum("nivelRisco", ["baixo", "medio", "alto", "critico"]).default("medio"),
  sintomas: text("sintomas"),
  controle: text("controle"),
});

export const doencasCatalogo = mysqlTable("doencas_catalogo", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 150 }).notNull(),
  nomeCientifico: varchar("nomeCientifico", { length: 200 }),
  nivelRisco: mysqlEnum("nivelRisco", ["baixo", "medio", "alto", "critico"]).default("medio"),
  sintomas: text("sintomas"),
  controle: text("controle"),
});

export const controlePragasCultura = mysqlTable("controle_pragas_cultura", {
  id: int("id").autoincrement().primaryKey(),
  culturaCatalogoId: int("culturaCatalogoId").notNull(),
  pragaCatalogoId: int("pragaCatalogoId"),
  doencaCatalogoId: int("doencaCatalogoId"),
});

// ─────────────────────────────────────────────
// PILOTO CAMPO (Etapa 29)
// ─────────────────────────────────────────────
export const pilotoParticipantes = mysqlTable("piloto_participantes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  regiao: varchar("regiao", { length: 100 }),
  cultura: varchar("cultura", { length: 100 }),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pilotoFeedback = mysqlTable("piloto_feedback", {
  id: int("id").autoincrement().primaryKey(),
  participanteId: int("participanteId").notNull(),
  notaNps: int("notaNps").notNull(),
  comentario: text("comentario"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pilotoMetricas = mysqlTable("piloto_metricas", {
  id: int("id").autoincrement().primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PilotoParticipante = typeof pilotoParticipantes.$inferSelect;
export type InsertPilotoParticipante = typeof pilotoParticipantes.$inferInsert;
export type PilotoFeedback = typeof pilotoFeedback.$inferSelect;
export type InsertPilotoFeedback = typeof pilotoFeedback.$inferInsert;

// ─────────────────────────────────────────────
// EXPANSÃO BANCO — Etapas 35–36 (GeoClima / Solos)
// ─────────────────────────────────────────────
export const zonasClimaticas = mysqlTable("zonas_climaticas", {
  id: int("id").autoincrement().primaryKey(),
  codigoKoppen: varchar("codigoKoppen", { length: 10 }).notNull().unique(),
  nome: varchar("nome", { length: 120 }).notNull(),
  descricao: text("descricao"),
  regioesBrasil: text("regioesBrasil"),
  tempMediaMin: decimal("tempMediaMin", { precision: 5, scale: 1 }),
  tempMediaMax: decimal("tempMediaMax", { precision: 5, scale: 1 }),
  precipitacaoAnualMin: int("precipitacaoAnualMin"),
  precipitacaoAnualMax: int("precipitacaoAnualMax"),
  aptidaoCulturas: text("aptidaoCulturas"), // JSON array of slugs
});

export const tiposSolo = mysqlTable("tipos_solo", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 120 }).notNull(),
  descricao: text("descricao"),
  textura: varchar("textura", { length: 80 }),
  phMin: decimal("phMin", { precision: 3, scale: 1 }),
  phMax: decimal("phMax", { precision: 3, scale: 1 }),
  drenagem: varchar("drenagem", { length: 80 }),
  fertilidade: varchar("fertilidade", { length: 80 }),
  aptidaoCulturas: text("aptidaoCulturas"), // JSON array of slugs
  manejo: text("manejo"),
});

export type ZonaClimatica = typeof zonasClimaticas.$inferSelect;
export type InsertZonaClimatica = typeof zonasClimaticas.$inferInsert;
export type TipoSolo = typeof tiposSolo.$inferSelect;
export type InsertTipoSolo = typeof tiposSolo.$inferInsert;

// ─────────────────────────────────────────────
// EXPANSÃO — Etapas 39–40 (Lab / Economia)
// ─────────────────────────────────────────────
export const labModulos = mysqlTable("lab_modulos", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 120 }).notNull(),
  descricao: text("descricao"),
  parametros: text("parametros"), // JSON string[]
  cor: varchar("cor", { length: 20 }),
  emoji: varchar("emoji", { length: 16 }),
});

export const economiaCultura = mysqlTable("economia_cultura", {
  id: int("id").autoincrement().primaryKey(),
  culturaCatalogoId: int("culturaCatalogoId").notNull(),
  unidadeProdutividade: varchar("unidadeProdutividade", { length: 40 }).default("kg/ha"),
  produtividadeMin: decimal("produtividadeMin", { precision: 12, scale: 2 }),
  produtividadeMed: decimal("produtividadeMed", { precision: 12, scale: 2 }),
  produtividadeMax: decimal("produtividadeMax", { precision: 12, scale: 2 }),
  custoHaEstimado: decimal("custoHaEstimado", { precision: 12, scale: 2 }),
  precoUnidade: decimal("precoUnidade", { precision: 12, scale: 2 }),
  moeda: varchar("moeda", { length: 8 }).default("BRL"),
  observacoes: text("observacoes"),
});

export type LabModulo = typeof labModulos.$inferSelect;
export type InsertLabModulo = typeof labModulos.$inferInsert;
export type EconomiaCultura = typeof economiaCultura.$inferSelect;
export type InsertEconomiaCultura = typeof economiaCultura.$inferInsert;
