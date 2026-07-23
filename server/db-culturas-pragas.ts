/**
 * db-culturas-pragas.ts — Helpers de banco de dados para Culturas e Pragas/Doenças
 *
 * Estende os helpers básicos de server/db.ts com operações admin completas:
 * - Listagem paginada com filtros
 * - CRUD completo (create, update, delete)
 * - Estatísticas e contagens
 */
import { eq, like, or, desc, asc, and, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  culturas,
  pragasDoencas,
  InsertCultura,
  InsertPragaDoenca,
} from "../drizzle/schema";

// ─── CULTURAS ─────────────────────────────────────────────────────────────────

export type CulturaFiltros = {
  busca?: string;
  status?: "planejado" | "em_andamento" | "colhido" | "perdido";
  propriedadeId?: number;
  /** Etapa 4 — escopo obrigatório para não-admin */
  organizationId?: number;
  limit?: number;
  offset?: number;
};

export async function listarCulturasAdmin(filtros: CulturaFiltros = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { busca, status, propriedadeId, organizationId, limit = 50, offset = 0 } = filtros;

  const conditions = [];
  if (organizationId != null) {
    conditions.push(eq(culturas.organizationId, organizationId));
  }
  if (busca) {
    conditions.push(
      or(
        like(culturas.nomeCultura, `%${busca}%`),
        like(culturas.variedade, `%${busca}%`),
        like(culturas.faseAtual, `%${busca}%`),
      ),
    );
  }
  if (status) conditions.push(eq(culturas.status, status));
  if (propriedadeId) conditions.push(eq(culturas.propriedadeId, propriedadeId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(culturas)
      .where(where)
      .orderBy(desc(culturas.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(culturas).where(where),
  ]);

  return { items, total: totalResult[0]?.total ?? 0 };
}

export async function getCulturaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(culturas).where(eq(culturas.id, id)).limit(1);
  return rows[0] ?? null;
}

export type CulturaCreateInput = {
  propriedadeId: number;
  terrenoId: number;
  nomeCultura: string;
  variedade?: string | null;
  dataPlantio?: string | null;
  faseAtual?: string | null;
  areaPlantada?: string | null;
  previsaoColheita?: string | null;
  producaoEstimada?: string | null;
  producaoReal?: string | null;
  unidadeProducao?: string | null;
  status?: "planejado" | "em_andamento" | "colhido" | "perdido";
  observacoes?: string | null;
};

export async function adminCreateCultura(data: CulturaCreateInput) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  if (!data.terrenoId) throw new Error("Talhão (terrenoId) é obrigatório");

  const { getPropriedadeById } = await import("./db");
  const { ensureDefaultSafra } = await import("./db-safras");
  const propriedade = await getPropriedadeById(data.propriedadeId);
  if (!propriedade?.organizationId) throw new Error("Propriedade sem organizationId");

  const safra = await ensureDefaultSafra({
    organizationId: propriedade.organizationId,
    propriedadeId: data.propriedadeId,
  });

  const result = await db.insert(culturas).values({
    propriedadeId: data.propriedadeId,
    organizationId: propriedade.organizationId,
    safraId: safra.id,
    terrenoId: data.terrenoId,
    nomeCultura: data.nomeCultura,
    variedade: data.variedade ?? null,
    dataPlantio: data.dataPlantio ? new Date(data.dataPlantio) : null,
    faseAtual: data.faseAtual ?? null,
    areaPlantada: data.areaPlantada ?? null,
    previsaoColheita: data.previsaoColheita ? new Date(data.previsaoColheita) : null,
    producaoEstimada: data.producaoEstimada ?? null,
    producaoReal: data.producaoReal ?? null,
    unidadeProducao: data.unidadeProducao ?? null,
    status: data.status ?? "em_andamento",
    observacoes: data.observacoes ?? null,
  } as InsertCultura);
  return { id: Number((result as any).insertId ?? (result as any)[0]?.insertId) };
}

export async function adminUpdateCultura(id: number, data: Partial<CulturaCreateInput>) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const updateData: Record<string, unknown> = {};
  if (data.nomeCultura !== undefined) updateData.nomeCultura = data.nomeCultura;
  if (data.variedade !== undefined) updateData.variedade = data.variedade;
  if (data.faseAtual !== undefined) updateData.faseAtual = data.faseAtual;
  if (data.areaPlantada !== undefined) updateData.areaPlantada = data.areaPlantada;
  if (data.producaoEstimada !== undefined) updateData.producaoEstimada = data.producaoEstimada;
  if (data.producaoReal !== undefined) updateData.producaoReal = data.producaoReal;
  if (data.unidadeProducao !== undefined) updateData.unidadeProducao = data.unidadeProducao;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
  if (data.dataPlantio !== undefined) updateData.dataPlantio = data.dataPlantio ? new Date(data.dataPlantio) : null;
  if (data.previsaoColheita !== undefined) updateData.previsaoColheita = data.previsaoColheita ? new Date(data.previsaoColheita) : null;

  // Etapa 5 — amarra ao organizationId do registro (nunca só id)
  const existing = await getCulturaById(id);
  if (!existing) throw new Error("Cultura não encontrada");
  if (existing.organizationId == null) {
    throw new Error("Cultura sem organizationId — rode backfill:organization-id");
  }
  await db
    .update(culturas)
    .set(updateData as any)
    .where(and(eq(culturas.id, id), eq(culturas.organizationId, existing.organizationId)));
  return { success: true };
}

export async function adminDeleteCultura(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const existing = await getCulturaById(id);
  if (!existing) throw new Error("Cultura não encontrada");
  if (existing.organizationId == null) {
    throw new Error("Cultura sem organizationId — rode backfill:organization-id");
  }
  await db
    .delete(culturas)
    .where(and(eq(culturas.id, id), eq(culturas.organizationId, existing.organizationId)));
  return { success: true };
}

export async function getEstatisticasCulturas() {
  const db = await getDb();
  if (!db) return { total: 0, emAndamento: 0, planejadas: 0, colhidas: 0, perdidas: 0 };

  const rows = await db
    .select({
      status: culturas.status,
      total: count(),
    })
    .from(culturas)
    .groupBy(culturas.status);

  const stats = { total: 0, emAndamento: 0, planejadas: 0, colhidas: 0, perdidas: 0 };
  for (const row of rows) {
    stats.total += Number(row.total);
    if (row.status === "em_andamento") stats.emAndamento = Number(row.total);
    if (row.status === "planejado") stats.planejadas = Number(row.total);
    if (row.status === "colhido") stats.colhidas = Number(row.total);
    if (row.status === "perdido") stats.perdidas = Number(row.total);
  }
  return stats;
}

// ─── PRAGAS E DOENÇAS ─────────────────────────────────────────────────────────

export type PragaFiltros = {
  busca?: string;
  tipo?: "praga" | "doenca" | "deficiencia";
  nivelRisco?: "baixo" | "medio" | "alto" | "critico";
  culturaAfetada?: string;
  limit?: number;
  offset?: number;
};

export async function listarPragasAdmin(filtros: PragaFiltros = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { busca, tipo, nivelRisco, culturaAfetada, limit = 50, offset = 0 } = filtros;

  const conditions = [];
  if (busca) {
    conditions.push(
      or(
        like(pragasDoencas.nome, `%${busca}%`),
        like(pragasDoencas.nomecientifico, `%${busca}%`),
        like(pragasDoencas.culturaAfetada, `%${busca}%`),
        like(pragasDoencas.sintomas, `%${busca}%`),
      ),
    );
  }
  if (tipo) conditions.push(eq(pragasDoencas.tipo, tipo));
  if (nivelRisco) conditions.push(eq(pragasDoencas.nivelRisco, nivelRisco));
  if (culturaAfetada) conditions.push(like(pragasDoencas.culturaAfetada, `%${culturaAfetada}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(pragasDoencas)
      .where(where)
      .orderBy(asc(pragasDoencas.nome))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(pragasDoencas).where(where),
  ]);

  return { items, total: totalResult[0]?.total ?? 0 };
}

export async function getPragaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(pragasDoencas).where(eq(pragasDoencas.id, id)).limit(1);
  return rows[0] ?? null;
}

export type PragaCreateInput = {
  nome: string;
  nomeCientifico?: string | null;
  tipo: "praga" | "doenca" | "deficiencia";
  culturaAfetada?: string | null;
  sintomas?: string | null;
  causas?: string | null;
  tratamento?: string | null;
  prevencao?: string | null;
  imagensReferencia?: string | null;
  nivelRisco?: "baixo" | "medio" | "alto" | "critico";
};

export async function adminCreatePraga(data: PragaCreateInput) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const result = await db.insert(pragasDoencas).values({
    nome: data.nome,
    nomecientifico: data.nomeCientifico ?? null,
    tipo: data.tipo,
    culturaAfetada: data.culturaAfetada ?? null,
    sintomas: data.sintomas ?? null,
    causas: data.causas ?? null,
    tratamento: data.tratamento ?? null,
    prevencao: data.prevencao ?? null,
    imagensReferencia: data.imagensReferencia ?? null,
    nivelRisco: data.nivelRisco ?? "medio",
  } as InsertPragaDoenca);
  return { id: Number((result as any).insertId) };
}

export async function adminUpdatePraga(id: number, data: Partial<PragaCreateInput>) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const updateData: Record<string, unknown> = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.nomeCientifico !== undefined) updateData.nomecientifico = data.nomeCientifico;
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.culturaAfetada !== undefined) updateData.culturaAfetada = data.culturaAfetada;
  if (data.sintomas !== undefined) updateData.sintomas = data.sintomas;
  if (data.causas !== undefined) updateData.causas = data.causas;
  if (data.tratamento !== undefined) updateData.tratamento = data.tratamento;
  if (data.prevencao !== undefined) updateData.prevencao = data.prevencao;
  if (data.imagensReferencia !== undefined) updateData.imagensReferencia = data.imagensReferencia;
  if (data.nivelRisco !== undefined) updateData.nivelRisco = data.nivelRisco;

  await db.update(pragasDoencas).set(updateData as any).where(eq(pragasDoencas.id, id));
  return { success: true };
}

export async function adminDeletePraga(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  await db.delete(pragasDoencas).where(eq(pragasDoencas.id, id));
  return { success: true };
}

export async function getEstatisticasPragas() {
  const db = await getDb();
  if (!db) return { total: 0, pragas: 0, doencas: 0, deficiencias: 0, criticas: 0 };

  const [tipoRows, riscoRows] = await Promise.all([
    db
      .select({ tipo: pragasDoencas.tipo, total: count() })
      .from(pragasDoencas)
      .groupBy(pragasDoencas.tipo),
    db
      .select({ total: count() })
      .from(pragasDoencas)
      .where(eq(pragasDoencas.nivelRisco, "critico")),
  ]);

  const stats = { total: 0, pragas: 0, doencas: 0, deficiencias: 0, criticas: 0 };
  for (const row of tipoRows) {
    stats.total += Number(row.total);
    if (row.tipo === "praga") stats.pragas = Number(row.total);
    if (row.tipo === "doenca") stats.doencas = Number(row.total);
    if (row.tipo === "deficiencia") stats.deficiencias = Number(row.total);
  }
  stats.criticas = Number(riscoRows[0]?.total ?? 0);
  return stats;
}
