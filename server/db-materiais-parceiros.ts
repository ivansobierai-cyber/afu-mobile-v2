/**
 * db-materiais-parceiros.ts — Helpers de banco de dados para Materiais Didáticos e Parceiros
 *
 * Estende os helpers básicos de server/db.ts com operações admin completas:
 * - Listagem paginada com filtros
 * - CRUD completo (create, update, delete)
 * - Estatísticas e contagens
 */
import { eq, like, or, desc, asc, and, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  materiaisDidaticos,
  parceiros,
  InsertMaterialDidatico,
  InsertParceiro,
} from "../drizzle/schema";

// ─── MATERIAIS DIDÁTICOS ──────────────────────────────────────────────────────

export type MaterialFiltros = {
  busca?: string;
  tipo?: "video" | "audio" | "apostila" | "guia" | "checklist" | "infografico";
  nivel?: "iniciante" | "intermediario" | "avancado";
  publicoAlvo?: "produtor" | "tecnico" | "todos";
  status?: "ativo" | "inativo" | "rascunho";
  tema?: string;
  limit?: number;
  offset?: number;
};

export async function listarMateriaisAdmin(filtros: MaterialFiltros = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { busca, tipo, nivel, publicoAlvo, status, tema, limit = 50, offset = 0 } = filtros;

  const conditions = [];
  if (busca) {
    conditions.push(
      or(
        like(materiaisDidaticos.titulo, `%${busca}%`),
        like(materiaisDidaticos.descricao, `%${busca}%`),
        like(materiaisDidaticos.tema, `%${busca}%`),
      ),
    );
  }
  if (tipo) conditions.push(eq(materiaisDidaticos.tipoMaterial, tipo));
  if (nivel) conditions.push(eq(materiaisDidaticos.nivel, nivel));
  if (publicoAlvo) conditions.push(eq(materiaisDidaticos.publicoAlvo, publicoAlvo));
  if (status) conditions.push(eq(materiaisDidaticos.status, status));
  if (tema) conditions.push(like(materiaisDidaticos.tema, `%${tema}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(materiaisDidaticos)
      .where(where)
      .orderBy(desc(materiaisDidaticos.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(materiaisDidaticos).where(where),
  ]);

  return { items, total: totalResult[0]?.total ?? 0 };
}

export async function getMaterialById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(materiaisDidaticos).where(eq(materiaisDidaticos.id, id)).limit(1);
  return rows[0] ?? null;
}

export type MaterialCreateInput = {
  titulo: string;
  tipoMaterial: "video" | "audio" | "apostila" | "guia" | "checklist" | "infografico";
  tema?: string | null;
  descricao?: string | null;
  arquivoUrl?: string | null;
  videoUrl?: string | null;
  idioma?: string | null;
  publicoAlvo?: "produtor" | "tecnico" | "todos";
  nivel?: "iniciante" | "intermediario" | "avancado";
  status?: "ativo" | "inativo" | "rascunho";
};

export async function adminCreateMaterial(data: MaterialCreateInput) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const result = await db.insert(materiaisDidaticos).values({
    titulo: data.titulo,
    tipoMaterial: data.tipoMaterial,
    tema: data.tema ?? null,
    descricao: data.descricao ?? null,
    arquivoUrl: data.arquivoUrl ?? null,
    videoUrl: data.videoUrl ?? null,
    idioma: data.idioma ?? "pt-BR",
    publicoAlvo: data.publicoAlvo ?? "todos",
    nivel: data.nivel ?? "iniciante",
    status: data.status ?? "ativo",
  } as InsertMaterialDidatico);
  return { id: Number((result as any)[0]?.insertId ?? 0) };
}

export async function adminUpdateMaterial(id: number, data: Partial<MaterialCreateInput>) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const updateData: Record<string, unknown> = {};
  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.tipoMaterial !== undefined) updateData.tipoMaterial = data.tipoMaterial;
  if (data.tema !== undefined) updateData.tema = data.tema;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.arquivoUrl !== undefined) updateData.arquivoUrl = data.arquivoUrl;
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
  if (data.idioma !== undefined) updateData.idioma = data.idioma;
  if (data.publicoAlvo !== undefined) updateData.publicoAlvo = data.publicoAlvo;
  if (data.nivel !== undefined) updateData.nivel = data.nivel;
  if (data.status !== undefined) updateData.status = data.status;

  await db.update(materiaisDidaticos).set(updateData as any).where(eq(materiaisDidaticos.id, id));
  return { success: true };
}

export async function adminDeleteMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  await db.delete(materiaisDidaticos).where(eq(materiaisDidaticos.id, id));
  return { success: true };
}

export async function getEstatisticasMateriais() {
  const db = await getDb();
  if (!db) return { total: 0, ativos: 0, rascunhos: 0, inativos: 0, videos: 0, apostilas: 0 };

  const [statusRows, tipoRows] = await Promise.all([
    db.select({ status: materiaisDidaticos.status, total: count() })
      .from(materiaisDidaticos)
      .groupBy(materiaisDidaticos.status),
    db.select({ tipo: materiaisDidaticos.tipoMaterial, total: count() })
      .from(materiaisDidaticos)
      .groupBy(materiaisDidaticos.tipoMaterial),
  ]);

  const stats = { total: 0, ativos: 0, rascunhos: 0, inativos: 0, videos: 0, apostilas: 0 };
  for (const row of statusRows) {
    stats.total += Number(row.total);
    if (row.status === "ativo") stats.ativos = Number(row.total);
    if (row.status === "rascunho") stats.rascunhos = Number(row.total);
    if (row.status === "inativo") stats.inativos = Number(row.total);
  }
  for (const row of tipoRows) {
    if (row.tipo === "video") stats.videos = Number(row.total);
    if (row.tipo === "apostila") stats.apostilas = Number(row.total);
  }
  return stats;
}

// ─── PARCEIROS ────────────────────────────────────────────────────────────────

export type ParceiroFiltros = {
  busca?: string;
  tipo?: "laboratorio" | "cooperativa" | "consultoria" | "revendedor" | "instituicao" | "outro";
  estado?: string;
  status?: "ativo" | "inativo";
  limit?: number;
  offset?: number;
};

export async function listarParceirosAdmin(filtros: ParceiroFiltros = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { busca, tipo, estado, status, limit = 50, offset = 0 } = filtros;

  const conditions = [];
  if (busca) {
    conditions.push(
      or(
        like(parceiros.nome, `%${busca}%`),
        like(parceiros.descricao, `%${busca}%`),
        like(parceiros.cidade, `%${busca}%`),
        like(parceiros.servicosOferecidos, `%${busca}%`),
      ),
    );
  }
  if (tipo) conditions.push(eq(parceiros.tipo, tipo));
  if (estado) conditions.push(like(parceiros.estado, `%${estado}%`));
  if (status) conditions.push(eq(parceiros.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(parceiros)
      .where(where)
      .orderBy(asc(parceiros.nome))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(parceiros).where(where),
  ]);

  return { items, total: totalResult[0]?.total ?? 0 };
}

export async function getParceiroById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(parceiros).where(eq(parceiros.id, id)).limit(1);
  return rows[0] ?? null;
}

export type ParceiroCreateInput = {
  nome: string;
  tipo: "laboratorio" | "cooperativa" | "consultoria" | "revendedor" | "instituicao" | "outro";
  descricao?: string | null;
  cidade?: string | null;
  estado?: string | null;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  servicosOferecidos?: string | null;
  status?: "ativo" | "inativo";
};

export async function adminCreateParceiro(data: ParceiroCreateInput) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const result = await db.insert(parceiros).values({
    nome: data.nome,
    tipo: data.tipo,
    descricao: data.descricao ?? null,
    cidade: data.cidade ?? null,
    estado: data.estado ?? null,
    telefone: data.telefone ?? null,
    email: data.email ?? null,
    website: data.website ?? null,
    servicosOferecidos: data.servicosOferecidos ?? null,
    status: data.status ?? "ativo",
  } as InsertParceiro);
  return { id: Number((result as any)[0]?.insertId ?? 0) };
}

export async function adminUpdateParceiro(id: number, data: Partial<ParceiroCreateInput>) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const updateData: Record<string, unknown> = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.cidade !== undefined) updateData.cidade = data.cidade;
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.telefone !== undefined) updateData.telefone = data.telefone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.servicosOferecidos !== undefined) updateData.servicosOferecidos = data.servicosOferecidos;
  if (data.status !== undefined) updateData.status = data.status;

  await db.update(parceiros).set(updateData as any).where(eq(parceiros.id, id));
  return { success: true };
}

export async function adminDeleteParceiro(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  await db.delete(parceiros).where(eq(parceiros.id, id));
  return { success: true };
}

export async function getEstatisticasParceiros() {
  const db = await getDb();
  if (!db) return { total: 0, ativos: 0, inativos: 0, laboratorios: 0, cooperativas: 0, consultorias: 0 };

  const [statusRows, tipoRows] = await Promise.all([
    db.select({ status: parceiros.status, total: count() })
      .from(parceiros)
      .groupBy(parceiros.status),
    db.select({ tipo: parceiros.tipo, total: count() })
      .from(parceiros)
      .groupBy(parceiros.tipo),
  ]);

  const stats = { total: 0, ativos: 0, inativos: 0, laboratorios: 0, cooperativas: 0, consultorias: 0 };
  for (const row of statusRows) {
    stats.total += Number(row.total);
    if (row.status === "ativo") stats.ativos = Number(row.total);
    if (row.status === "inativo") stats.inativos = Number(row.total);
  }
  for (const row of tipoRows) {
    if (row.tipo === "laboratorio") stats.laboratorios = Number(row.total);
    if (row.tipo === "cooperativa") stats.cooperativas = Number(row.total);
    if (row.tipo === "consultoria") stats.consultorias = Number(row.total);
  }
  return stats;
}
