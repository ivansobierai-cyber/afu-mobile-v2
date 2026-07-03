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
  sensores,
  InsertSensor,
  leiturasSensores,
  InsertLeituraSensor,
  produtosMarketplace,
  InsertProdutoMarketplace,
  pedidos,
  InsertPedido,
  parceiros,
  InsertParceiro,
  pragasDoencas,
  InsertPragaDoenca,
  materiaisDidaticos,
  InsertMaterialDidatico,
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

export async function getPropriedades(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propriedades).orderBy(desc(propriedades.createdAt));
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
  const result = await db.insert(propriedades).values(data);
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

export async function createTerreno(data: InsertTerreno) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(terrenos).values(data);
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

export async function getCulturas(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(culturas).orderBy(desc(culturas.createdAt));
}

export async function getCulturasByPropriedade(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(culturas).where(eq(culturas.propriedadeId, propriedadeId));
}

export async function createCultura(data: InsertCultura) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(culturas).values(data);
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
  const result = await db.insert(diagnosticosIa).values(data);
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
