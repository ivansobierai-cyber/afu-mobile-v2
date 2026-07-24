import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
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
  /** Etapa 2 segurança — organização ativa na sessão */
  activeOrganizationId: int("activeOrganizationId"),
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
  /** Etapa 2 — ponte para tenant (Etapa 3 espalha organizationId nas tabelas filhas) */
  organizationId: int("organizationId"),
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
export const propriedades = mysqlTable(
  "propriedades",
  {
  id: int("id").autoincrement().primaryKey(),
  produtorId: int("produtorId").notNull(), // FK → produtores.id (um-para-muitos)
  /** Segurança Etapa 3 — tenant */
  organizationId: int("organizationId"),
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
  /** GeoJSON Polygon/MultiPolygon (WGS84) — Etapa 5 */
  geometriaGeoJson: text("geometriaGeoJson"),
  areaGeometricaHa: decimal("areaGeometricaHa", { precision: 12, scale: 4 }),
  geometriaOrigem: mysqlEnum("geometriaOrigem", ["desenhada", "gps", "importada", "integracao"]).default("desenhada"),
  geometriaVersao: int("geometriaVersao").default(1),
  /** Soft-archive (correção Etapa 7) — preferível à exclusão */
  archivedAt: timestamp("archivedAt"),
  archivedByUserId: int("archivedByUserId"),
  archiveMotivo: varchar("archiveMotivo", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
},
  (t) => [
    index("propriedades_organization_idx").on(t.organizationId),
    index("propriedades_org_id_idx").on(t.organizationId, t.id),
    index("propriedades_org_archived_idx").on(t.organizationId, t.archivedAt),
  ],
);

export type Propriedade = typeof propriedades.$inferSelect;
export type InsertPropriedade = typeof propriedades.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: safras (ciclo produtivo por propriedade)
// ─────────────────────────────────────────────
export const safras = mysqlTable(
  "safras",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    nome: varchar("nome", { length: 80 }).notNull(),
    anoInicio: int("anoInicio"),
    anoFim: int("anoFim"),
    dataInicio: date("dataInicio"),
    dataFim: date("dataFim"),
    status: mysqlEnum("status", ["planejada", "ativa", "encerrada", "arquivada"])
      .default("ativa")
      .notNull(),
    isDefault: boolean("isDefault").default(false).notNull(),
    createdByUserId: int("createdByUserId"),
    closedAt: timestamp("closedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("safras_organization_idx").on(t.organizationId),
    index("safras_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("safras_org_prop_status_idx").on(t.organizationId, t.propriedadeId, t.status),
  ],
);

export type Safra = typeof safras.$inferSelect;
export type InsertSafra = typeof safras.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: terrenos (talhões dentro de propriedades)
// ─────────────────────────────────────────────
export const terrenos = mysqlTable(
  "terrenos",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(), // FK → propriedades.id
  organizationId: int("organizationId"),
  nome: varchar("nome", { length: 100 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  tipoSolo: varchar("tipoSolo", { length: 100 }),
  sistemaIrrigacao: varchar("sistemaIrrigacao", { length: 100 }),
  observacoes: text("observacoes"),
  geometriaGeoJson: text("geometriaGeoJson"),
  areaGeometricaHa: decimal("areaGeometricaHa", { precision: 12, scale: 4 }),
  geometriaOrigem: mysqlEnum("geometriaOrigemTalhao", ["desenhada", "gps", "importada", "integracao"]).default("desenhada"),
  /** Etapa 8 — otimistic concurrency na sync offline */
  geometriaVersao: int("geometriaVersao").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
},
  (t) => [
    index("terrenos_organization_idx").on(t.organizationId),
    index("terrenos_org_prop_idx").on(t.organizationId, t.propriedadeId),
  ],
);

export type Terreno = typeof terrenos.$inferSelect;
export type InsertTerreno = typeof terrenos.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: culturas (cultivos por propriedade)
// ─────────────────────────────────────────────
export const culturas = mysqlTable(
  "culturas",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(), // FK → propriedades.id
  organizationId: int("organizationId"),
  /** Ciclo produtivo — obrigatório após backfill + migração 0030 */
  safraId: int("safraId").notNull(),
  terrenoId: int("terrenoId").notNull(), // FK → terrenos.id
  nomeCultura: varchar("nomeCultura", { length: 100 }).notNull(),
  variedade: varchar("variedade", { length: 100 }),
  dataPlantio: date("dataPlantio"),
  faseAtual: varchar("faseAtual", { length: 100 }),
  areaPlantada: decimal("areaPlantada", { precision: 12, scale: 2 }),
  previsaoColheita: date("previsaoColheita"),
  producaoEstimada: decimal("producaoEstimada", { precision: 12, scale: 2 }),
  /** Produção real colhida (mesma unidade de `unidadeProducao`, tipicamente kg) */
  producaoReal: decimal("producaoReal", { precision: 12, scale: 2 }),
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
},
  (t) => [
    index("culturas_organization_idx").on(t.organizationId),
    index("culturas_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("culturas_org_prop_safra_idx").on(t.organizationId, t.propriedadeId, t.safraId),
    index("culturas_terreno_idx").on(t.terrenoId),
    index("culturas_catalogo_idx").on(t.culturaCatalogoId),
  ],
);

export type Cultura = typeof culturas.$inferSelect;
export type InsertCultura = typeof culturas.$inferInsert;

/** Cultivos V2 — histórico de avanço fenológico (aditivo; faseAtual permanece na cultura) */
export const cultivoFaseEventos = mysqlTable(
  "cultivo_fase_eventos",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    culturaId: int("culturaId").notNull(),
    faseAnterior: varchar("faseAnterior", { length: 100 }),
    faseNova: varchar("faseNova", { length: 100 }).notNull(),
    dataEvento: timestamp("dataEvento").defaultNow().notNull(),
    origem: mysqlEnum("origemFaseCultivo", [
      "manual",
      "api",
      "backfill",
      "sistema",
    ])
      .default("manual")
      .notNull(),
    userId: int("userId"),
    observacao: text("observacao"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("cultivo_fase_org_idx").on(t.organizationId),
    index("cultivo_fase_cultura_idx").on(t.culturaId),
    index("cultivo_fase_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("cultivo_fase_cultura_data_idx").on(t.culturaId, t.dataEvento),
  ],
);

export type CultivoFaseEvento = typeof cultivoFaseEventos.$inferSelect;
export type InsertCultivoFaseEvento = typeof cultivoFaseEventos.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: diagnosticos_ia
// ─────────────────────────────────────────────
export const diagnosticosIa = mysqlTable(
  "diagnosticos_ia",
  {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  organizationId: int("organizationId"),
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
},
  (t) => [
    index("diagnosticos_organization_idx").on(t.organizationId),
    index("diagnosticos_org_created_idx").on(t.organizationId, t.dataDiagnostico),
  ],
);

export type DiagnosticoIa = typeof diagnosticosIa.$inferSelect;
export type InsertDiagnosticoIa = typeof diagnosticosIa.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: analises_fitotecnicas
// ─────────────────────────────────────────────
export const analisesFitotecnicas = mysqlTable(
  "analises_fitotecnicas",
  {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  organizationId: int("organizationId"),
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
},
  (t) => [index("analises_organization_idx").on(t.organizationId)],
);

export type AnaliseFitotecnica = typeof analisesFitotecnicas.$inferSelect;
export type InsertAnaliseFitotecnica =
  typeof analisesFitotecnicas.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: relatorios
// ─────────────────────────────────────────────
export const relatorios = mysqlTable(
  "relatorios",
  {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  organizationId: int("organizationId"),
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
},
  (t) => [index("relatorios_organization_idx").on(t.organizationId)],
);

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
export const calendarioCuidados = mysqlTable(
  "calendario_cuidados",
  {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"), // FK → usuarios_afu.id
  organizationId: int("organizationId"),
  propriedadeId: int("propriedadeId"), // FK → propriedades.id
  culturaId: int("culturaId"), // FK → culturas.id
  /** Etapa 2 Eventos — vínculos operacionais */
  terrenoId: int("terrenoId"), // FK → terrenos.id (talhão)
  safraId: int("safraId"), // FK → safras.id
  responsavelUserId: int("responsavelUserId"), // FK → users.id
  /** Etapa 4 — dependência / série de recorrência */
  dependsOnEventoId: int("dependsOnEventoId"),
  recurrenceParentId: int("recurrenceParentId"),
  tipoAtividade: mysqlEnum("tipoAtividade", [
    "plantio",
    "irrigacao",
    "adubacao",
    "pulverizacao",
    "monitoramento",
    "colheita",
    "analise",
    "manutencao",
    "inspecao",
    "laboratorio",
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
},
  (t) => [
    index("calendario_organization_idx").on(t.organizationId),
    index("calendario_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("calendario_org_safra_idx").on(t.organizationId, t.safraId),
    index("calendario_org_terreno_idx").on(t.organizationId, t.terrenoId),
    index("calendario_org_resp_idx").on(t.organizationId, t.responsavelUserId),
    index("calendario_depends_idx").on(t.dependsOnEventoId),
    index("calendario_recurrence_idx").on(t.recurrenceParentId),
  ],
);

export type CalendarioCuidado = typeof calendarioCuidados.$inferSelect;
export type InsertCalendarioCuidado = typeof calendarioCuidados.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: tarefas_operacionais (Etapa 3)
// Trabalho operacional ligado à propriedade/talhão/cultivo.
// Eventos de calendario_cuidados podem ser migrados com origem=calendario_legado.
// ─────────────────────────────────────────────
export const tarefasOperacionais = mysqlTable(
  "tarefas_operacionais",
  {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(), // criador — usuarios_afu.id
  responsavelUserId: int("responsavelUserId"),
  organizationId: int("organizationId"),
  propriedadeId: int("propriedadeId").notNull(),
  safraId: int("safraId"),
  terrenoId: int("terrenoId"),
  culturaId: int("culturaId"),
  tipoOperacao: mysqlEnum("tipoOperacao", [
    "plantio",
    "irrigacao",
    "adubacao",
    "pulverizacao",
    "monitoramento",
    "colheita",
    "analise",
    "manutencao",
    "vistoria",
    "outro",
  ]).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  instrucoes: text("instrucoes"),
  prioridade: mysqlEnum("prioridade", [
    "baixa",
    "normal",
    "alta",
    "critica",
  ]).default("normal").notNull(),
  status: mysqlEnum("status", [
    "planejada",
    "liberada",
    "em_execucao",
    "pausada",
    "concluida",
    "aprovada",
    "cancelada",
    "bloqueada",
  ]).default("planejada").notNull(),
  dataPrevista: timestamp("dataPrevista").notNull(),
  areaPlanejada: decimal("areaPlanejada", { precision: 12, scale: 2 }),
  origem: mysqlEnum("origem", [
    "manual",
    "calendario_legado",
    "template",
  ]).default("manual").notNull(),
  legadoEventoId: int("legadoEventoId"),
  motivoCancelamento: text("motivoCancelamento"),
  /** Etapa 9 — idempotência offline */
  clientMutationId: varchar("clientMutationId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
},
  (t) => [
    index("tarefas_organization_idx").on(t.organizationId),
    index("tarefas_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("tarefas_org_prop_safra_idx").on(t.organizationId, t.propriedadeId, t.safraId),
    index("tarefas_responsavel_idx").on(t.responsavelUserId),
  ],
);

export type TarefaOperacional = typeof tarefasOperacionais.$inferSelect;
export type InsertTarefaOperacional = typeof tarefasOperacionais.$inferInsert;

/** Etapa 8 Passo 4 — alocação de equipe em tarefas (N:N) */
export const tarefaAlocacoes = mysqlTable(
  "tarefa_alocacoes",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    tarefaId: int("tarefaId").notNull(),
    userId: int("userId").notNull(),
    papelEquipe: mysqlEnum("papelEquipe", [
      "funcionario",
      "operador",
      "tecnico",
      "agronomo",
    ])
      .default("operador")
      .notNull(),
    horasPlanejadas: decimal("horasPlanejadas", { precision: 10, scale: 2 }),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("tarefa_aloc_org_idx").on(t.organizationId),
    index("tarefa_aloc_tarefa_idx").on(t.tarefaId),
    index("tarefa_aloc_user_idx").on(t.userId),
    index("tarefa_aloc_org_prop_idx").on(t.organizationId, t.propriedadeId),
  ],
);

export type TarefaAlocacao = typeof tarefaAlocacoes.$inferSelect;
export type InsertTarefaAlocacao = typeof tarefaAlocacoes.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: apontamentos_operacao (execução real)
// ─────────────────────────────────────────────
export const apontamentosOperacao = mysqlTable("apontamentos_operacao", {
  id: int("id").autoincrement().primaryKey(),
  tarefaId: int("tarefaId").notNull(),
  usuarioId: int("usuarioId").notNull(),
  inicioReal: timestamp("inicioReal").notNull(),
  fimReal: timestamp("fimReal"),
  areaExecutada: decimal("areaExecutada", { precision: 12, scale: 2 }),
  notas: text("notas"),
  resultado: mysqlEnum("resultado", [
    "ok",
    "parcial",
    "problema",
  ]).default("ok"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApontamentoOperacao = typeof apontamentosOperacao.$inferSelect;
export type InsertApontamentoOperacao = typeof apontamentosOperacao.$inferInsert;

// ─────────────────────────────────────────────
// TABELA: sensores (IoT)
// ─────────────────────────────────────────────
export const sensores = mysqlTable(
  "sensores",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(), // FK → propriedades.id
  organizationId: int("organizationId"),
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
},
  (t) => [index("sensores_organization_idx").on(t.organizationId)],
);

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
  culturaCatalogoId: int("culturaCatalogoId").notNull().unique(),
  unidadeProdutividade: varchar("unidadeProdutividade", { length: 40 }).default("kg/ha"),
  produtividadeMin: decimal("produtividadeMin", { precision: 12, scale: 2 }),
  produtividadeMed: decimal("produtividadeMed", { precision: 12, scale: 2 }),
  produtividadeMax: decimal("produtividadeMax", { precision: 12, scale: 2 }),
  custoHaEstimado: decimal("custoHaEstimado", { precision: 12, scale: 2 }),
  precoUnidade: decimal("precoUnidade", { precision: 12, scale: 2 }),
  moeda: varchar("moeda", { length: 8 }).default("BRL"),
  observacoes: text("observacoes"),
});

// ─────────────────────────────────────────────
// EXPANSÃO — Etapas 42–43 (Geo / IoT fundação)
// ─────────────────────────────────────────────
export const camadasGeo = mysqlTable("camadas_geo", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 120 }).notNull(),
  tipo: mysqlEnum("tipo", [
    "ndvi",
    "chuva",
    "solo",
    "risco",
    "clima",
    "drone",
    "outro",
  ]).notNull(),
  descricao: text("descricao"),
  fonte: varchar("fonte", { length: 120 }),
  coberturaKm2: decimal("coberturaKm2", { precision: 14, scale: 2 }),
  resolucaoM: int("resolucaoM"),
  atualizadoEm: timestamp("atualizadoEm"),
  ativo: boolean("ativo").default(true),
});

export type CamadaGeo = typeof camadasGeo.$inferSelect;
export type InsertCamadaGeo = typeof camadasGeo.$inferInsert;

// ─────────────────────────────────────────────
// EXPANSÃO — Etapas 45–46 (NOC / Arquitetura)
// ─────────────────────────────────────────────
export const nocAlertas = mysqlTable("noc_alertas", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 64 }).notNull().unique(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: text("descricao"),
  severidade: mysqlEnum("severidade", ["info", "baixa", "media", "alta", "critica"]).default("media").notNull(),
  modulo: varchar("modulo", { length: 80 }).notNull(), // iot | geo | marketplace | lab | ia | piloto | sistema
  status: mysqlEnum("status", ["aberto", "reconhecido", "resolvido"]).default("aberto").notNull(),
  origem: varchar("origem", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const arquiteturaComponentes = mysqlTable("arquitetura_componentes", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 120 }).notNull(),
  camada: mysqlEnum("camada", [
    "frontend",
    "backend",
    "dados",
    "ia",
    "infra",
    "seguranca",
    "devops",
    "integracao",
  ]).notNull(),
  descricao: text("descricao"),
  tecnologia: varchar("tecnologia", { length: 200 }),
  status: mysqlEnum("status", ["planejado", "parcial", "operacional", "deprecado"]).default("operacional").notNull(),
  ordem: int("ordem").default(0),
});

export type NocAlerta = typeof nocAlertas.$inferSelect;
export type InsertNocAlerta = typeof nocAlertas.$inferInsert;
export type ArquiteturaComponente = typeof arquiteturaComponentes.$inferSelect;
export type InsertArquiteturaComponente = typeof arquiteturaComponentes.$inferInsert;

export type LabModulo = typeof labModulos.$inferSelect;
export type InsertLabModulo = typeof labModulos.$inferInsert;
export type EconomiaCultura = typeof economiaCultura.$inferSelect;
export type InsertEconomiaCultura = typeof economiaCultura.$inferInsert;

// ─────────────────────────────────────────────
// ETAPAS 4–10 — expansão operacional da propriedade
// ─────────────────────────────────────────────

/** Etapa 6 — ocorrência de campo */
export const ocorrenciasCampo = mysqlTable(
  "ocorrencias_campo",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(),
  organizationId: int("organizationId"),
  safraId: int("safraId"),
  terrenoId: int("terrenoId"),
  culturaId: int("culturaId"),
  usuarioId: int("usuarioId").notNull(),
  diagnosticoId: int("diagnosticoId"),
  tarefaId: int("tarefaId"),
  categoria: mysqlEnum("categoriaOcorrencia", [
    "praga",
    "doenca",
    "nutricao",
    "clima",
    "solo",
    "outro",
  ]).default("outro").notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: text("descricao"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  severidade: mysqlEnum("severidadeOcorrencia", ["baixa", "media", "alta", "critica"]).default("media"),
  status: mysqlEnum("statusOcorrencia", [
    "aberta",
    "em_acompanhamento",
    "resolvida",
    "descartada",
  ]).default("aberta").notNull(),
  resultadoAcompanhamento: mysqlEnum("resultadoAcompanhamento", [
    "melhorou",
    "estavel",
    "piorou",
    "resolvido",
  ]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
},
  (t) => [
    index("ocorrencias_organization_idx").on(t.organizationId),
    index("ocorrencias_org_prop_safra_idx").on(t.organizationId, t.propriedadeId, t.safraId),
  ],
);

export type OcorrenciaCampo = typeof ocorrenciasCampo.$inferSelect;
export type InsertOcorrenciaCampo = typeof ocorrenciasCampo.$inferInsert;

/** Etapa 7 — estoque agrícola (≠ marketplace) — base + extensão inteligente */
export const estoqueDepositos = mysqlTable(
  "estoque_depositos",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    nome: varchar("nome", { length: 120 }).notNull(),
    descricao: text("descricao"),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("estoque_depositos_org_idx").on(t.organizationId),
    index("estoque_depositos_org_prop_idx").on(t.organizationId, t.propriedadeId),
  ],
);

export type EstoqueDeposito = typeof estoqueDepositos.$inferSelect;
export type InsertEstoqueDeposito = typeof estoqueDepositos.$inferInsert;

export const estoqueItens = mysqlTable(
  "estoque_itens",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(),
  organizationId: int("organizationId"),
  depositoId: int("depositoId"),
  nome: varchar("nome", { length: 150 }).notNull(),
  categoria: mysqlEnum("categoriaEstoque", [
    "fertilizante",
    "defensivo",
    "herbicida",
    "fungicida",
    "inseticida",
    "semente",
    "combustivel",
    "peca",
    "ferramenta",
    "outro",
  ]).default("outro").notNull(),
  unidadeBase: varchar("unidadeBase", { length: 30 }).default("kg").notNull(),
  saldo: decimal("saldo", { precision: 14, scale: 3 }).default("0").notNull(),
  /** Custo médio ponderado (R$/unidade) — alimentado por entradas com custoUnitario */
  custoMedio: decimal("custoMedio", { precision: 14, scale: 4 }),
  estoqueMinimo: decimal("estoqueMinimo", { precision: 14, scale: 3 }).default("0"),
  fabricante: varchar("fabricante", { length: 120 }),
  observacoes: text("observacoes"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
},
  (t) => [
    index("estoque_itens_organization_idx").on(t.organizationId),
    index("estoque_itens_org_prop_idx").on(t.organizationId, t.propriedadeId),
  ],
);

export type EstoqueItem = typeof estoqueItens.$inferSelect;
export type InsertEstoqueItem = typeof estoqueItens.$inferInsert;

export const estoqueLotes = mysqlTable(
  "estoque_lotes",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    itemId: int("itemId").notNull(),
    depositoId: int("depositoId"),
    codigo: varchar("codigo", { length: 80 }).notNull(),
    validade: timestamp("validade"),
    quantidadeInicial: decimal("quantidadeInicial", { precision: 14, scale: 3 }).default("0").notNull(),
    bloqueado: boolean("bloqueado").default(false).notNull(),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("estoque_lotes_org_idx").on(t.organizationId),
    index("estoque_lotes_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("estoque_lotes_item_idx").on(t.itemId),
  ],
);

export type EstoqueLote = typeof estoqueLotes.$inferSelect;
export type InsertEstoqueLote = typeof estoqueLotes.$inferInsert;

export const estoqueMovimentos = mysqlTable(
  "estoque_movimentos",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId"),
    propriedadeId: int("propriedadeId"),
    itemId: int("itemId").notNull(),
    loteId: int("loteId"),
    depositoId: int("depositoId"),
    usuarioId: int("usuarioId").notNull(),
    tipo: mysqlEnum("tipoMovimentoEstoque", [
      "entrada",
      "saida",
      "reserva",
      "consumo",
      "ajuste",
      "perda",
      "transferencia",
    ]).notNull(),
    quantidade: decimal("quantidade", { precision: 14, scale: 3 }).notNull(),
    /** Custo unitário da entrada (R$) — atualiza custoMedio do item */
    custoUnitario: decimal("custoUnitario", { precision: 14, scale: 4 }),
    motivo: varchar("motivo", { length: 255 }),
    tarefaId: int("tarefaId"),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("estoque_movimentos_org_idx").on(t.organizationId),
    index("estoque_movimentos_item_idx").on(t.itemId),
    index("estoque_movimentos_tarefa_idx").on(t.tarefaId),
  ],
);

export type EstoqueMovimento = typeof estoqueMovimentos.$inferSelect;
export type InsertEstoqueMovimento = typeof estoqueMovimentos.$inferInsert;

/** Reservas explícitas ligadas a tarefa/operação (Etapa 7 — Passo 1/4) */
export const estoqueReservas = mysqlTable(
  "estoque_reservas",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    itemId: int("itemId").notNull(),
    loteId: int("loteId"),
    tarefaId: int("tarefaId"),
    quantidade: decimal("quantidade", { precision: 14, scale: 3 }).notNull(),
    status: mysqlEnum("statusReservaEstoque", [
      "ativa",
      "consumida",
      "liberada",
      "cancelada",
    ])
      .default("ativa")
      .notNull(),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("estoque_reservas_org_idx").on(t.organizationId),
    index("estoque_reservas_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("estoque_reservas_tarefa_idx").on(t.tarefaId),
    index("estoque_reservas_item_idx").on(t.itemId),
  ],
);

export type EstoqueReserva = typeof estoqueReservas.$inferSelect;
export type InsertEstoqueReserva = typeof estoqueReservas.$inferInsert;

/** Etapa 8 — orçamento e custos */
export const orcamentosSafra = mysqlTable(
  "orcamentos_safra",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(),
  organizationId: int("organizationId"),
  safraId: int("safraId"),
  nomeSafra: varchar("nomeSafra", { length: 80 }).notNull(),
  orcamentoPrevisto: decimal("orcamentoPrevisto", { precision: 14, scale: 2 }).default("0").notNull(),
  custoRealizado: decimal("custoRealizado", { precision: 14, scale: 2 }).default("0").notNull(),
  moeda: varchar("moeda", { length: 8 }).default("BRL").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
},
  (t) => [
    index("orcamentos_organization_idx").on(t.organizationId),
    index("orcamentos_org_prop_safra_idx").on(t.organizationId, t.propriedadeId, t.safraId),
  ],
);

export type OrcamentoSafra = typeof orcamentosSafra.$inferSelect;
export type InsertOrcamentoSafra = typeof orcamentosSafra.$inferInsert;

export const custosOperacao = mysqlTable(
  "custos_operacao",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(),
  organizationId: int("organizationId"),
  safraId: int("safraId"),
  terrenoId: int("terrenoId"),
  culturaId: int("culturaId"),
  orcamentoId: int("orcamentoId"),
  tarefaId: int("tarefaId"),
  categoria: mysqlEnum("categoriaCusto", [
    "insumo",
    "mao_obra",
    "maquina",
    "combustivel",
    "servico",
    "outro",
  ]).default("outro").notNull(),
  descricao: varchar("descricao", { length: 200 }).notNull(),
  valor: decimal("valor", { precision: 14, scale: 2 }).notNull(),
  dataCusto: timestamp("dataCusto").defaultNow().notNull(),
  usuarioId: int("usuarioId").notNull(),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
},
  (t) => [
    index("custos_organization_idx").on(t.organizationId),
    index("custos_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("custos_safra_idx").on(t.safraId),
    index("custos_terreno_idx").on(t.terrenoId),
    index("custos_cultura_idx").on(t.culturaId),
    index("custos_tarefa_idx").on(t.tarefaId),
  ],
);

export type CustoOperacao = typeof custosOperacao.$inferSelect;
export type InsertCustoOperacao = typeof custosOperacao.$inferInsert;

/** Etapa 8 Passo 2 — lançamentos financeiros (despesa/receita/custo/investimento) */
export const financeiroLancamentos = mysqlTable(
  "financeiro_lancamentos",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    safraId: int("safraId"),
    terrenoId: int("terrenoId"),
    culturaId: int("culturaId"),
    tarefaId: int("tarefaId"),
    tipo: mysqlEnum("tipoLancamentoFinanceiro", [
      "despesa",
      "receita",
      "custo",
      "investimento",
    ]).notNull(),
    categoriaAuto: varchar("categoriaAuto", { length: 60 }).notNull(),
    descricao: varchar("descricao", { length: 200 }).notNull(),
    valor: decimal("valor", { precision: 14, scale: 2 }).notNull(),
    dataLancamento: timestamp("dataLancamento").defaultNow().notNull(),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("fin_lanc_org_idx").on(t.organizationId),
    index("fin_lanc_org_prop_idx").on(t.organizationId, t.propriedadeId),
    index("fin_lanc_tipo_idx").on(t.tipo),
    index("fin_lanc_safra_idx").on(t.safraId),
  ],
);

export type FinanceiroLancamento = typeof financeiroLancamentos.$inferSelect;
export type InsertFinanceiroLancamento = typeof financeiroLancamentos.$inferInsert;

/** Etapa 4 — feed de atividade */
export const atividadePropriedade = mysqlTable(
  "atividade_propriedade",
  {
  id: int("id").autoincrement().primaryKey(),
  propriedadeId: int("propriedadeId").notNull(),
  organizationId: int("organizationId"),
  safraId: int("safraId"),
  usuarioId: int("usuarioId"),
  tipo: varchar("tipo", { length: 60 }).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  detalhe: text("detalhe"),
  gravidade: mysqlEnum("gravidadeAtividade", ["info", "atencao", "alto", "critico"]).default("info"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
},
  (t) => [index("atividade_organization_idx").on(t.organizationId)],
);

export type AtividadePropriedade = typeof atividadePropriedade.$inferSelect;
export type InsertAtividadePropriedade = typeof atividadePropriedade.$inferInsert;

/** P3 / Etapa 8 Passo 3 — máquinas e equipamentos operacionais */
export const maquinasOperacionais = mysqlTable(
  "maquinas_operacionais",
  {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  propriedadeId: int("propriedadeId").notNull(),
  nome: varchar("nome", { length: 120 }).notNull(),
  tipo: mysqlEnum("tipoMaquinaOperacional", [
    "trator",
    "pulverizador",
    "colheitadeira",
    "caminhao",
    "implemento",
    "irrigacao",
    "outro",
  ]).default("outro").notNull(),
  identificador: varchar("identificador", { length: 80 }),
  status: mysqlEnum("statusMaquinaOperacional", [
    "disponivel",
    "em_uso",
    "manutencao",
    "inativa",
  ]).default("disponivel").notNull(),
  /** Horímetro acumulado (horas) */
  horasUso: decimal("horasUso", { precision: 12, scale: 1 }),
  /** Nível atual de combustível (litros) */
  combustivelLitros: decimal("combustivelLitros", { precision: 12, scale: 2 }),
  ultimaManutencaoAt: timestamp("ultimaManutencaoAt"),
  notas: text("notas"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
},
  (t) => [
    index("maquinas_operacionais_org_idx").on(t.organizationId),
    index("maquinas_operacionais_org_prop_idx").on(t.organizationId, t.propriedadeId),
  ],
);

export type MaquinaOperacional = typeof maquinasOperacionais.$inferSelect;
export type InsertMaquinaOperacional = typeof maquinasOperacionais.$inferInsert;

/** Etapa 8 Passo 3 — eventos de máquina (horímetro, combustível, manutenção) */
export const maquinaEventos = mysqlTable(
  "maquina_eventos",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    propriedadeId: int("propriedadeId").notNull(),
    maquinaId: int("maquinaId").notNull(),
    tipo: mysqlEnum("tipoEventoMaquina", [
      "horimetro",
      "combustivel",
      "manutencao",
      "disponibilidade",
    ]).notNull(),
    /** Horímetro registrado / litros / etc. */
    valor: decimal("valor", { precision: 14, scale: 3 }),
    /** Para combustível: entrada | saida */
    sentido: varchar("sentido", { length: 20 }),
    descricao: varchar("descricao", { length: 255 }),
    tarefaId: int("tarefaId"),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("maquina_eventos_org_idx").on(t.organizationId),
    index("maquina_eventos_maquina_idx").on(t.maquinaId),
    index("maquina_eventos_org_prop_idx").on(t.organizationId, t.propriedadeId),
  ],
);

export type MaquinaEvento = typeof maquinaEventos.$inferSelect;
export type InsertMaquinaEvento = typeof maquinaEventos.$inferInsert;

// ─────────────────────────────────────────────
// SEGURANÇA ETAPA 2 — organizações e memberships
// ─────────────────────────────────────────────

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 150 }).notNull(),
  tipo: mysqlEnum("tipoOrganizacao", [
    "produtor_individual",
    "empresa",
    "grupo",
    "cooperativa",
    "outro",
  ])
    .default("produtor_individual")
    .notNull(),
  status: mysqlEnum("statusOrganizacao", ["ativa", "suspensa", "arquivada"])
    .default("ativa")
    .notNull(),
  ownerUserId: int("ownerUserId"),
  /** Etapa 9 — opt-in explícito para melhoria de modelos (default: false) */
  aiAllowModelImprovement: boolean("aiAllowModelImprovement").default(false).notNull(),
  aiShareAggregatedInsights: boolean("aiShareAggregatedInsights").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export const organizationMemberships = mysqlTable(
  "organization_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("orgRole", [
      "proprietario",
      "administrador",
      "gerente",
      "agronomo",
      "operador",
      "consultor",
      "auditor",
    ])
      .default("operador")
      .notNull(),
    status: mysqlEnum("membershipStatus", ["convidado", "ativo", "suspenso", "removido"])
      .default("ativo")
      .notNull(),
    invitedByUserId: int("invitedByUserId"),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("org_membership_org_user_uidx").on(t.organizationId, t.userId),
    index("org_membership_user_idx").on(t.userId),
    index("org_membership_org_idx").on(t.organizationId),
  ],
);

export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type InsertOrganizationMembership = typeof organizationMemberships.$inferInsert;

// ─────────────────────────────────────────────
// SEGURANÇA ETAPA 6 — arquivos privados + auditoria
// ─────────────────────────────────────────────

/** Metadados de arquivos no storage (chave → organização) */
export const privateFiles = mysqlTable(
  "private_files",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    category: mysqlEnum("fileCategory", [
      "relatorio",
      "diagnostico",
      "laudo",
      "documento",
      "foto",
      "outro",
    ])
      .default("outro")
      .notNull(),
    contentType: varchar("contentType", { length: 120 }),
    originalName: varchar("originalName", { length: 255 }),
    sizeBytes: int("sizeBytes"),
    relatorioId: int("relatorioId"),
    diagnosticoId: int("diagnosticoId"),
    propriedadeId: int("propriedadeId"),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("private_files_storage_key_uidx").on(t.storageKey),
    index("private_files_organization_idx").on(t.organizationId),
    index("private_files_relatorio_idx").on(t.relatorioId),
  ],
);

export type PrivateFile = typeof privateFiles.$inferSelect;
export type InsertPrivateFile = typeof privateFiles.$inferInsert;

/** Trilha de geração/download e mutações sensíveis */
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId"),
    actorUserId: int("actorUserId"),
    action: varchar("action", { length: 80 }).notNull(),
    resourceType: varchar("resourceType", { length: 60 }),
    resourceId: varchar("resourceId", { length: 64 }),
    storageKey: varchar("storageKey", { length: 512 }),
    ip: varchar("ip", { length: 64 }),
    userAgent: varchar("userAgent", { length: 255 }),
    meta: text("meta"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_organization_idx").on(t.organizationId),
    index("audit_logs_actor_idx").on(t.actorUserId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/** Etapa 8 — conflitos de sincronização offline resolvidos no servidor */
export const syncConflicts = mysqlTable(
  "sync_conflicts",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    actorUserId: int("actorUserId"),
    deviceId: varchar("deviceId", { length: 80 }),
    clientMutationId: varchar("clientMutationId", { length: 64 }),
    entity: varchar("entity", { length: 60 }).notNull(),
    action: varchar("action", { length: 40 }).notNull(),
    resourceType: varchar("resourceType", { length: 60 }),
    resourceId: varchar("resourceId", { length: 64 }),
    reason: varchar("reason", { length: 80 }).notNull(),
    message: text("message"),
    payload: text("payload"),
    status: mysqlEnum("syncConflictStatus", [
      "aberto",
      "resolvido",
      "descartado",
    ])
      .default("aberto")
      .notNull(),
    resolvedByUserId: int("resolvedByUserId"),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("sync_conflicts_organization_idx").on(t.organizationId),
    index("sync_conflicts_status_idx").on(t.organizationId, t.status),
    index("sync_conflicts_client_mutation_idx").on(t.clientMutationId),
  ],
);

export type SyncConflict = typeof syncConflicts.$inferSelect;
export type InsertSyncConflict = typeof syncConflicts.$inferInsert;
