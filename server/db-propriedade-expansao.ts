import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  ocorrenciasCampo,
  InsertOcorrenciaCampo,
  estoqueItens,
  InsertEstoqueItem,
  estoqueMovimentos,
  InsertEstoqueMovimento,
  orcamentosSafra,
  InsertOrcamentoSafra,
  custosOperacao,
  InsertCustoOperacao,
  atividadePropriedade,
  InsertAtividadePropriedade,
  propriedades,
  terrenos,
} from "../drizzle/schema";

export async function listOcorrencias(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ocorrenciasCampo)
    .where(eq(ocorrenciasCampo.propriedadeId, propriedadeId))
    .orderBy(desc(ocorrenciasCampo.createdAt));
}

export async function createOcorrencia(data: InsertOcorrenciaCampo) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(ocorrenciasCampo).values(data);
  return result[0].insertId;
}

export async function updateOcorrencia(id: number, data: Partial<InsertOcorrenciaCampo>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(ocorrenciasCampo).set(data).where(eq(ocorrenciasCampo.id, id));
}

export async function getOcorrenciaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(ocorrenciasCampo).where(eq(ocorrenciasCampo.id, id)).limit(1);
  return rows[0];
}

export async function listEstoque(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(estoqueItens).where(eq(estoqueItens.propriedadeId, propriedadeId));
}

export async function createEstoqueItem(data: InsertEstoqueItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(estoqueItens).values(data);
  return result[0].insertId;
}

export async function getEstoqueItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(estoqueItens).where(eq(estoqueItens.id, id)).limit(1);
  return rows[0];
}

export async function registrarMovimentoEstoque(data: InsertEstoqueMovimento) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const item = await getEstoqueItem(data.itemId);
  if (!item) throw new Error("Item não encontrado");
  const qtd = Number(data.quantidade);
  let saldo = Number(item.saldo);
  if (["saida", "consumo", "perda", "reserva"].includes(data.tipo)) saldo -= qtd;
  else saldo += qtd;
  await db.insert(estoqueMovimentos).values(data);
  await db.update(estoqueItens).set({ saldo: saldo.toFixed(3) }).where(eq(estoqueItens.id, item.id));
  return { saldo };
}

export async function listOrcamentos(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orcamentosSafra).where(eq(orcamentosSafra.propriedadeId, propriedadeId));
}

export async function createOrcamento(data: InsertOrcamentoSafra) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(orcamentosSafra).values(data);
  return result[0].insertId;
}

export async function listCustos(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(custosOperacao)
    .where(eq(custosOperacao.propriedadeId, propriedadeId))
    .orderBy(desc(custosOperacao.dataCusto));
}

export async function createCusto(data: InsertCustoOperacao) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(custosOperacao).values(data);
  if (data.orcamentoId) {
    await db
      .update(orcamentosSafra)
      .set({
        custoRealizado: sql`${orcamentosSafra.custoRealizado} + ${data.valor}`,
      })
      .where(eq(orcamentosSafra.id, data.orcamentoId));
  }
  return result[0].insertId;
}

export async function listAtividades(propriedadeId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(atividadePropriedade)
    .where(eq(atividadePropriedade.propriedadeId, propriedadeId))
    .orderBy(desc(atividadePropriedade.createdAt))
    .limit(limit);
}

export async function registrarAtividade(data: InsertAtividadePropriedade) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(atividadePropriedade).values(data);
  return result[0].insertId;
}

export async function updateGeometriaPropriedade(
  id: number,
  data: {
    geometriaGeoJson: string;
    areaGeometricaHa?: string;
    geometriaOrigem?: "desenhada" | "gps" | "importada" | "integracao";
  },
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(propriedades)
    .set({
      geometriaGeoJson: data.geometriaGeoJson,
      areaGeometricaHa: data.areaGeometricaHa,
      geometriaOrigem: data.geometriaOrigem ?? "desenhada",
      geometriaVersao: sql`COALESCE(${propriedades.geometriaVersao}, 0) + 1`,
    })
    .where(eq(propriedades.id, id));
}

export async function updateGeometriaTerreno(
  id: number,
  data: {
    geometriaGeoJson: string;
    areaGeometricaHa?: string;
    geometriaOrigem?: "desenhada" | "gps" | "importada" | "integracao";
  },
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(terrenos)
    .set({
      geometriaGeoJson: data.geometriaGeoJson,
      areaGeometricaHa: data.areaGeometricaHa,
      geometriaOrigem: data.geometriaOrigem ?? "desenhada",
    })
    .where(eq(terrenos.id, id));
}

export async function findTarefaByClientMutationId(clientMutationId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { tarefasOperacionais } = await import("../drizzle/schema");
  const rows = await db
    .select()
    .from(tarefasOperacionais)
    .where(eq(tarefasOperacionais.clientMutationId, clientMutationId))
    .limit(1);
  return rows[0];
}
