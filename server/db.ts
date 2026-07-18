import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  usuariosAfu,
  InsertUsuarioAfu,
  produtores,
  InsertProdutor,
  propriedades,
  InsertPropriedade,
  terrenos,
  InsertTerreno,
  culturas,
  InsertCultura,
  diagnosticosIa,
  InsertDiagnosticoIa,
  analisesFitotecnicas,
  InsertAnaliseFitotecnica,
  relatorios,
  InsertRelatorio,
  calendarioCuidados,
  InsertCalendarioCuidado,
  tarefasOperacionais,
  InsertTarefaOperacional,
  apontamentosOperacao,
  InsertApontamentoOperacao,
  sensores,
  InsertSensor,
  leiturasSensores,
  InsertLeituraSensor,
  produtosMarketplace,
  InsertProdutoMarketplace,
  pedidos,
  InsertPedido,
  Pedido,
  ticketsSuporte,
  InsertTicketSuporte,
  mensagensSuporte,
  InsertMensagemSuporte,
  parceiros,
  InsertParceiro,
  pragasDoencas,
  InsertPragaDoenca,
  materiaisDidaticos,
  InsertMaterialDidatico,
  pushTokens,
  InsertPushToken,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS (auth) ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── USUARIOS AFU ────────────────────────────────────────────────────────────

export async function getUsuariosAfu() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(usuariosAfu).orderBy(desc(usuariosAfu.createdAt));
}

export async function getUsuarioAfuByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(usuariosAfu).where(eq(usuariosAfu.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsuarioAfuById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(usuariosAfu).where(eq(usuariosAfu.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUsuarioAfu(data: InsertUsuarioAfu) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(usuariosAfu).values(data);
  return result[0].insertId;
}

export async function updateUsuarioAfu(id: number, data: Partial<InsertUsuarioAfu>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(usuariosAfu).set(data).where(eq(usuariosAfu.id, id));
}

// ─── PROPRIEDADES ────────────────────────────────────────────────────────────

/** Lista propriedades do produtor (produtorId = produtores.id). */
export async function getPropriedades(produtorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(propriedades)
    .where(eq(propriedades.produtorId, produtorId))
    .orderBy(desc(propriedades.createdAt));
}

export async function getPropriedadesComCoordenadas() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      propriedadeId: propriedades.id,
      nome: propriedades.nome,
      latitude: propriedades.latitude,
      longitude: propriedades.longitude,
      usuarioAfuId: produtores.usuarioId,
    })
    .from(propriedades)
    .innerJoin(produtores, eq(propriedades.produtorId, produtores.id));

  return rows
    .map((row) => {
      const latitude = row.latitude != null ? parseFloat(String(row.latitude)) : NaN;
      const longitude = row.longitude != null ? parseFloat(String(row.longitude)) : NaN;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        propriedadeId: row.propriedadeId,
        nome: row.nome,
        latitude,
        longitude,
        usuarioAfuId: row.usuarioAfuId,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
}

export async function getPropriedadeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(propriedades).where(eq(propriedades.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPropriedade(data: InsertPropriedade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let organizationId = data.organizationId;
  if (organizationId == null && data.produtorId) {
    const prod = await db
      .select({ organizationId: produtores.organizationId })
      .from(produtores)
      .where(eq(produtores.id, data.produtorId))
      .limit(1);
    organizationId = prod[0]?.organizationId ?? undefined;
  }
  const result = await db.insert(propriedades).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updatePropriedade(id: number, data: Partial<InsertPropriedade>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(propriedades).set(data).where(eq(propriedades.id, id));
}

export async function deletePropriedade(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(propriedades).where(eq(propriedades.id, id));
}

// ─── TERRENOS ────────────────────────────────────────────────────────────────

export async function getTerrenosByPropriedade(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(terrenos).where(eq(terrenos.propriedadeId, propriedadeId));
}

export async function getTerrenoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(terrenos).where(eq(terrenos.id, id)).limit(1);
  return rows[0];
}

export async function createTerreno(data: InsertTerreno) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await getPropriedadeById(data.propriedadeId);
    organizationId = prop?.organizationId ?? undefined;
  }
  const result = await db.insert(terrenos).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateTerreno(id: number, data: Partial<InsertTerreno>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(terrenos).set(data).where(eq(terrenos.id, id));
}

export async function deleteTerreno(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(terrenos).where(eq(terrenos.id, id));
}

// ─── CULTURAS ────────────────────────────────────────────────────────────────

/**
 * Lista cultivos do produtor vinculado ao perfil AFU.
 * @param usuarioAfuId — usuarios_afu.id (não users.id)
 */
export async function getCulturas(usuarioAfuId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: culturas.id,
      propriedadeId: culturas.propriedadeId,
      terrenoId: culturas.terrenoId,
      nomeCultura: culturas.nomeCultura,
      variedade: culturas.variedade,
      dataPlantio: culturas.dataPlantio,
      faseAtual: culturas.faseAtual,
      areaPlantada: culturas.areaPlantada,
      previsaoColheita: culturas.previsaoColheita,
      producaoEstimada: culturas.producaoEstimada,
      unidadeProducao: culturas.unidadeProducao,
      status: culturas.status,
      observacoes: culturas.observacoes,
      culturaCatalogoId: culturas.culturaCatalogoId,
      createdAt: culturas.createdAt,
      updatedAt: culturas.updatedAt,
    })
    .from(culturas)
    .innerJoin(propriedades, eq(culturas.propriedadeId, propriedades.id))
    .innerJoin(produtores, eq(propriedades.produtorId, produtores.id))
    .where(eq(produtores.usuarioId, usuarioAfuId))
    .orderBy(desc(culturas.createdAt));
}

/** Verifica se a propriedade pertence ao produtor. */
export async function propriedadeBelongsToProdutor(
  propriedadeId: number,
  produtorId: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: propriedades.id })
    .from(propriedades)
    .where(and(eq(propriedades.id, propriedadeId), eq(propriedades.produtorId, produtorId)))
    .limit(1);
  return rows.length > 0;
}

export async function getCulturasByPropriedade(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(culturas).where(eq(culturas.propriedadeId, propriedadeId));
}

export async function createCultura(data: InsertCultura) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await getPropriedadeById(data.propriedadeId);
    organizationId = prop?.organizationId ?? undefined;
  }
  const result = await db.insert(culturas).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateCultura(id: number, data: Partial<InsertCultura>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(culturas).set(data).where(eq(culturas.id, id));
}

export async function deleteCultura(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(culturas).where(eq(culturas.id, id));
}

// ─── DIAGNÓSTICOS ────────────────────────────────────────────────────────────

export async function getDiagnosticos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diagnosticosIa).where(eq(diagnosticosIa.usuarioId, userId)).orderBy(desc(diagnosticosIa.dataDiagnostico));
}

export async function createDiagnostico(data: InsertDiagnosticoIa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await getPropriedadeById(data.propriedadeId);
    organizationId = prop?.organizationId ?? undefined;
  }
  if (organizationId == null && data.usuarioId) {
    const prod = await db
      .select({ organizationId: produtores.organizationId })
      .from(produtores)
      .where(eq(produtores.usuarioId, data.usuarioId))
      .limit(1);
    organizationId = prod[0]?.organizationId ?? undefined;
  }
  const result = await db.insert(diagnosticosIa).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateDiagnostico(id: number, data: Partial<InsertDiagnosticoIa>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(diagnosticosIa).set(data).where(eq(diagnosticosIa.id, id));
}

// ─── ANÁLISES FITOTÉCNICAS ───────────────────────────────────────────────────

export async function getAnalises(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analisesFitotecnicas).where(eq(analisesFitotecnicas.usuarioId, userId)).orderBy(desc(analisesFitotecnicas.dataAnalise));
}

export async function createAnalise(data: InsertAnaliseFitotecnica) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(analisesFitotecnicas).values(data);
  return result[0].insertId;
}

// ─── RELATÓRIOS ──────────────────────────────────────────────────────────────

export async function getRelatorios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relatorios).where(eq(relatorios.usuarioId, userId)).orderBy(desc(relatorios.dataEmissao));
}

export async function createRelatorio(data: InsertRelatorio) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(relatorios).values(data);
  return result[0].insertId;
}

export async function updateRelatorio(id: number, data: Partial<InsertRelatorio>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(relatorios).set(data).where(eq(relatorios.id, id));
}

// ─── CALENDÁRIO ──────────────────────────────────────────────────────────────

export async function getCalendario(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarioCuidados).where(eq(calendarioCuidados.usuarioId, userId)).orderBy(calendarioCuidados.dataProgramada);
}

export async function createEvento(data: InsertCalendarioCuidado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(calendarioCuidados).values(data);
  return result[0].insertId;
}

export async function updateEvento(id: number, data: Partial<InsertCalendarioCuidado>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(calendarioCuidados).set(data).where(eq(calendarioCuidados.id, id));
}

export async function deleteEvento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(calendarioCuidados).where(eq(calendarioCuidados.id, id));
}

export async function getEventoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(calendarioCuidados).where(eq(calendarioCuidados.id, id)).limit(1);
  return rows[0];
}

// ─── TAREFAS OPERACIONAIS (Etapa 3) ───────────────────────────────────────────

export async function getTarefasByPropriedade(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tarefasOperacionais)
    .where(eq(tarefasOperacionais.propriedadeId, propriedadeId))
    .orderBy(tarefasOperacionais.dataPrevista);
}

export async function getTarefaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tarefasOperacionais).where(eq(tarefasOperacionais.id, id)).limit(1);
  return rows[0];
}

export async function createTarefa(data: InsertTarefaOperacional) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await getPropriedadeById(data.propriedadeId);
    organizationId = prop?.organizationId ?? undefined;
  }
  const result = await db.insert(tarefasOperacionais).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateTarefa(id: number, data: Partial<InsertTarefaOperacional>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tarefasOperacionais).set(data).where(eq(tarefasOperacionais.id, id));
}

export async function createApontamento(data: InsertApontamentoOperacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(apontamentosOperacao).values(data);
  return result[0].insertId;
}

export async function getApontamentosByTarefa(tarefaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(apontamentosOperacao)
    .where(eq(apontamentosOperacao.tarefaId, tarefaId))
    .orderBy(desc(apontamentosOperacao.createdAt));
}

// ─── SENSORES ────────────────────────────────────────────────────────────────

export async function getSensoresByPropriedade(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sensores).where(eq(sensores.propriedadeId, propriedadeId));
}

export async function createSensor(data: InsertSensor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sensores).values(data);
  return result[0].insertId;
}

export async function createLeituraSensor(data: InsertLeituraSensor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leiturasSensores).values(data);
  return result[0].insertId;
}

export async function getLeiturasBySensor(sensorId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leiturasSensores).where(eq(leiturasSensores.sensorId, sensorId)).orderBy(desc(leiturasSensores.dataLeitura)).limit(limit);
}

// ─── MARKETPLACE ─────────────────────────────────────────────────────────────

export async function getProdutosMarketplace() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(produtosMarketplace).where(eq(produtosMarketplace.status, "disponivel")).orderBy(desc(produtosMarketplace.createdAt));
}

export async function createProdutoMarketplace(data: InsertProdutoMarketplace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(produtosMarketplace).values(data);
  return result[0].insertId;
}

export async function updateProdutoMarketplace(id: number, data: Partial<InsertProdutoMarketplace>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(produtosMarketplace).set(data).where(eq(produtosMarketplace.id, id));
}

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

export async function getPedidosComprador(compradorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pedidos).where(eq(pedidos.compradorId, compradorId)).orderBy(desc(pedidos.dataPedido));
}

export async function createPedido(data: InsertPedido) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pedidos).values(data);
  return result[0].insertId;
}

export async function getProdutoMarketplaceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(produtosMarketplace)
    .where(eq(produtosMarketplace.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPedidoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function confirmarPagamentoPix(pedidoId: number, compradorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pedido = await getPedidoById(pedidoId);
  if (!pedido || pedido.compradorId !== compradorId) {
    throw new Error("Pedido não encontrado");
  }
  if (pedido.statusPedido === "cancelado") {
    throw new Error("Pedido cancelado");
  }
  if (pedido.statusPagamento !== "pendente") {
    throw new Error("Pagamento já processado");
  }
  const metodoMatch = (pedido.observacoes ?? "").match(/^__mp:(pix|na_entrega)__/);
  if (metodoMatch?.[1] !== "pix") {
    throw new Error("Este pedido não usa pagamento PIX");
  }

  await db.update(pedidos).set({ statusPagamento: "pago" }).where(eq(pedidos.id, pedidoId));
  return pedido;
}

export async function cancelarPedido(id: number, compradorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(pedidos)
    .where(eq(pedidos.id, id))
    .limit(1);
  const pedido = rows[0];
  if (!pedido || pedido.compradorId !== compradorId) {
    throw new Error("Pedido não encontrado");
  }
  if (pedido.statusPedido !== "aguardando") {
    throw new Error("Somente pedidos aguardando podem ser cancelados");
  }
  await db
    .update(pedidos)
    .set({ statusPedido: "cancelado", statusPagamento: "cancelado" })
    .where(eq(pedidos.id, id));
  return { success: true };
}

export async function getPedidosVendedor(vendedorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pedidos)
    .where(eq(pedidos.vendedorId, vendedorId))
    .orderBy(desc(pedidos.dataPedido));
}

type StatusPedido = NonNullable<Pedido["statusPedido"]>;

const VENDOR_STATUS_TRANSITIONS: Record<StatusPedido, StatusPedido[]> = {
  aguardando: ["confirmado", "cancelado"],
  confirmado: ["em_preparo", "cancelado"],
  em_preparo: ["enviado"],
  enviado: ["entregue"],
  entregue: [],
  cancelado: [],
};

export async function atualizarStatusPedidoVendedor(
  id: number,
  vendedorId: number,
  novoStatus: StatusPedido,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1);
  const pedido = rows[0];
  if (!pedido || pedido.vendedorId !== vendedorId) {
    throw new Error("Pedido não encontrado");
  }

  const statusAtual = (pedido.statusPedido ?? "aguardando") as StatusPedido;
  const permitidos = VENDOR_STATUS_TRANSITIONS[statusAtual];
  if (!permitidos.includes(novoStatus)) {
    throw new Error(`Não é possível alterar de "${statusAtual}" para "${novoStatus}"`);
  }

  const updates: Partial<InsertPedido> = { statusPedido: novoStatus };
  if (novoStatus === "entregue") {
    updates.dataEntrega = new Date();
    const metodoMatch = (pedido.observacoes ?? "").match(/^__mp:(pix|na_entrega)__/);
    if (metodoMatch?.[1] === "na_entrega" && pedido.statusPagamento === "pendente") {
      updates.statusPagamento = "pago";
    }
  }
  if (novoStatus === "cancelado") {
    updates.statusPagamento = "cancelado";
  }

  await db.update(pedidos).set(updates).where(eq(pedidos.id, id));
  const updated = await getPedidoById(id);
  return { success: true, pedido: updated };
}

// ─── SUPORTE ─────────────────────────────────────────────────────────────────

export async function getTicketsSuporte(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ticketsSuporte)
    .where(eq(ticketsSuporte.usuarioId, usuarioId))
    .orderBy(desc(ticketsSuporte.createdAt));
}

export async function createTicketSuporte(data: InsertTicketSuporte) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ticketsSuporte).values(data);
  return result[0].insertId as number;
}

export async function getMensagensSuporte(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(mensagensSuporte)
    .where(eq(mensagensSuporte.usuarioId, usuarioId))
    .orderBy(mensagensSuporte.createdAt);
}

export async function createMensagemSuporte(data: InsertMensagemSuporte) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mensagensSuporte).values(data);
  return result[0].insertId as number;
}

// ─── PARCEIROS ───────────────────────────────────────────────────────────────

export async function getParceiros() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parceiros).where(eq(parceiros.status, "ativo")).orderBy(parceiros.nome);
}

export async function createParceiro(data: InsertParceiro) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(parceiros).values(data);
  return result[0].insertId;
}

export async function updateParceiro(id: number, data: Partial<InsertParceiro>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(parceiros).set(data).where(eq(parceiros.id, id));
}

export async function deleteParceiro(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(parceiros).where(eq(parceiros.id, id));
}

// ─── PRAGAS E DOENÇAS ────────────────────────────────────────────────────────

export async function getPragasDoencas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pragasDoencas).orderBy(pragasDoencas.nome);
}

export async function createPragaDoenca(data: InsertPragaDoenca) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pragasDoencas).values(data);
  return result[0].insertId;
}

// ─── MATERIAIS DIDÁTICOS ─────────────────────────────────────────────────────

export async function getMateriaisDidaticos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materiaisDidaticos).where(eq(materiaisDidaticos.status, "ativo")).orderBy(desc(materiaisDidaticos.createdAt));
}

export async function createMaterialDidatico(data: InsertMaterialDidatico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(materiaisDidaticos).values(data);
  return result[0].insertId;
}

// ─── ESTATÍSTICAS DASHBOARD ──────────────────────────────────────────────────

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { propriedades: 0, culturas: 0, diagnosticos: 0, analises: 0, relatorios: 0, eventos: 0 };

  const [props, cultsAll, diags, anals, rels, evts] = await Promise.all([
    db.select().from(propriedades),
    db.select().from(culturas).where(eq(culturas.status, "em_andamento")),
    db.select().from(diagnosticosIa).where(eq(diagnosticosIa.usuarioId, userId)),
    db.select().from(analisesFitotecnicas).where(eq(analisesFitotecnicas.usuarioId, userId)),
    db.select().from(relatorios).where(eq(relatorios.usuarioId, userId)),
    db.select().from(calendarioCuidados).where(and(eq(calendarioCuidados.usuarioId, userId), eq(calendarioCuidados.status, "pendente"))),
  ]);

  return {
    propriedades: props.length,
    culturas: cultsAll.length,
    diagnosticos: diags.length,
    analises: anals.length,
    relatorios: rels.length,
    eventos: evts.length,
  };
}

// ─── PUSH TOKENS ─────────────────────────────────────────────────────────────

export async function upsertPushToken(data: {
  usuarioAfuId: number;
  expoPushToken: string;
  platform: "ios" | "android" | "web";
  deviceName?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(pushTokens)
    .where(eq(pushTokens.expoPushToken, data.expoPushToken))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushTokens)
      .set({
        usuarioAfuId: data.usuarioAfuId,
        platform: data.platform,
        deviceName: data.deviceName,
        lastUsedAt: new Date(),
      })
      .where(eq(pushTokens.expoPushToken, data.expoPushToken));
    return;
  }

  await db.insert(pushTokens).values({
    usuarioAfuId: data.usuarioAfuId,
    expoPushToken: data.expoPushToken,
    platform: data.platform,
    deviceName: data.deviceName,
    lastUsedAt: new Date(),
  } as InsertPushToken);
}

export async function getPushTokensByUsuario(usuarioAfuId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens).where(eq(pushTokens.usuarioAfuId, usuarioAfuId));
}

export async function deletePushToken(expoPushToken: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushTokens).where(eq(pushTokens.expoPushToken, expoPushToken));
}

export async function deletePushTokensByUsuario(usuarioAfuId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushTokens).where(eq(pushTokens.usuarioAfuId, usuarioAfuId));
}
