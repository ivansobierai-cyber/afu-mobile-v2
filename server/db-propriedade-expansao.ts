import { and, eq, desc, sql } from "drizzle-orm";
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
  maquinasOperacionais,
  InsertMaquinaOperacional,
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

function requireOrgId(
  data: { organizationId?: number | null },
  resolved?: number | null,
): number {
  const orgId = data.organizationId ?? resolved ?? null;
  if (orgId == null || !Number.isFinite(orgId) || orgId <= 0) {
    throw new Error("organizationId obrigatório no INSERT (Etapa 5)");
  }
  return orgId;
}

export async function createOcorrencia(data: InsertOcorrenciaCampo) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(ocorrenciasCampo).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateOcorrencia(
  id: number,
  data: Partial<InsertOcorrenciaCampo>,
  organizationId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { organizationId: _drop, ...safe } = data as any;
  const result = await db
    .update(ocorrenciasCampo)
    .set(safe)
    .where(
      and(eq(ocorrenciasCampo.id, id), eq(ocorrenciasCampo.organizationId, organizationId)),
    );
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Ocorrência não encontrada no tenant");
  }
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
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(estoqueItens).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function getEstoqueItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(estoqueItens).where(eq(estoqueItens.id, id)).limit(1);
  return rows[0];
}

export async function findConsumoEstoqueByTarefaItem(tarefaId: number, itemId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(estoqueMovimentos)
    .where(
      and(
        eq(estoqueMovimentos.tarefaId, tarefaId),
        eq(estoqueMovimentos.itemId, itemId),
        eq(estoqueMovimentos.tipo, "consumo"),
      ),
    )
    .limit(1);
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
  // Etapa 5 — saldo só atualiza se o item continuar no mesmo tenant
  const whereItem =
    item.organizationId != null
      ? and(eq(estoqueItens.id, item.id), eq(estoqueItens.organizationId, item.organizationId))
      : eq(estoqueItens.id, item.id);
  await db.update(estoqueItens).set({ saldo: saldo.toFixed(3) }).where(whereItem);
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
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(orcamentosSafra).values({ ...data, organizationId });
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
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(custosOperacao).values({ ...data, organizationId });
  if (data.orcamentoId) {
    await db
      .update(orcamentosSafra)
      .set({
        custoRealizado: sql`${orcamentosSafra.custoRealizado} + ${data.valor}`,
      })
      .where(
        and(
          eq(orcamentosSafra.id, data.orcamentoId),
          eq(orcamentosSafra.organizationId, organizationId),
        ),
      );
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
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(atividadePropriedade).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateGeometriaPropriedade(
  id: number,
  data: {
    geometriaGeoJson: string;
    areaGeometricaHa?: string;
    geometriaOrigem?: "desenhada" | "gps" | "importada" | "integracao";
    expectedGeometriaVersao?: number;
  },
  organizationId: number,
): Promise<{ geometriaVersao: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const current = await db
    .select({
      id: propriedades.id,
      geometriaVersao: propriedades.geometriaVersao,
    })
    .from(propriedades)
    .where(and(eq(propriedades.id, id), eq(propriedades.organizationId, organizationId)))
    .limit(1);
  if (!current[0]) {
    throw new Error("Propriedade não encontrada no tenant");
  }
  const serverVersion = current[0].geometriaVersao ?? 1;
  if (
    data.expectedGeometriaVersao != null &&
    data.expectedGeometriaVersao !== serverVersion
  ) {
    const err = new Error(
      `Conflito de geometria: versão esperada ${data.expectedGeometriaVersao}, servidor ${serverVersion}`,
    );
    (err as any).code = "GEOMETRY_VERSION_CONFLICT";
    (err as any).serverVersion = serverVersion;
    throw err;
  }

  const result = await db
    .update(propriedades)
    .set({
      geometriaGeoJson: data.geometriaGeoJson,
      areaGeometricaHa: data.areaGeometricaHa,
      geometriaOrigem: data.geometriaOrigem ?? "desenhada",
      geometriaVersao: sql`COALESCE(${propriedades.geometriaVersao}, 0) + 1`,
    })
    .where(and(eq(propriedades.id, id), eq(propriedades.organizationId, organizationId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Propriedade não encontrada no tenant");
  }
  return { geometriaVersao: serverVersion + 1 };
}

export async function updateGeometriaTerreno(
  id: number,
  data: {
    geometriaGeoJson: string;
    areaGeometricaHa?: string;
    geometriaOrigem?: "desenhada" | "gps" | "importada" | "integracao";
    expectedGeometriaVersao?: number;
  },
  organizationId: number,
): Promise<{ geometriaVersao: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const current = await db
    .select({
      id: terrenos.id,
      geometriaVersao: terrenos.geometriaVersao,
    })
    .from(terrenos)
    .where(and(eq(terrenos.id, id), eq(terrenos.organizationId, organizationId)))
    .limit(1);
  if (!current[0]) {
    throw new Error("Talhão não encontrado no tenant");
  }
  const serverVersion = current[0].geometriaVersao ?? 1;
  if (
    data.expectedGeometriaVersao != null &&
    data.expectedGeometriaVersao !== serverVersion
  ) {
    const err = new Error(
      `Conflito de geometria: versão esperada ${data.expectedGeometriaVersao}, servidor ${serverVersion}`,
    );
    (err as any).code = "GEOMETRY_VERSION_CONFLICT";
    (err as any).serverVersion = serverVersion;
    throw err;
  }

  const result = await db
    .update(terrenos)
    .set({
      geometriaGeoJson: data.geometriaGeoJson,
      areaGeometricaHa: data.areaGeometricaHa,
      geometriaOrigem: data.geometriaOrigem ?? "desenhada",
      geometriaVersao: sql`COALESCE(${terrenos.geometriaVersao}, 0) + 1`,
    })
    .where(and(eq(terrenos.id, id), eq(terrenos.organizationId, organizationId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Talhão não encontrado no tenant");
  }
  return { geometriaVersao: serverVersion + 1 };
}

export async function listMaquinasOperacionais(
  propriedadeId: number,
  organizationId: number,
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(maquinasOperacionais)
    .where(
      and(
        eq(maquinasOperacionais.propriedadeId, propriedadeId),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    )
    .orderBy(desc(maquinasOperacionais.createdAt));
}

export async function getMaquinaOperacional(id: number, organizationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(maquinasOperacionais)
    .where(
      and(
        eq(maquinasOperacionais.id, id),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    )
    .limit(1);
  return rows[0];
}

export async function createMaquinaOperacional(data: InsertMaquinaOperacional) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const organizationId = requireOrgId(data, data.organizationId);
  const result = await db.insert(maquinasOperacionais).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateMaquinaOperacional(
  id: number,
  data: Partial<InsertMaquinaOperacional>,
  organizationId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { organizationId: _dropOrg, propriedadeId: _dropProp, ...safe } = data as any;
  const result = await db
    .update(maquinasOperacionais)
    .set(safe)
    .where(
      and(
        eq(maquinasOperacionais.id, id),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    );
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Máquina não encontrada no tenant");
  }
}

export async function removeMaquinaOperacional(id: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db
    .delete(maquinasOperacionais)
    .where(
      and(
        eq(maquinasOperacionais.id, id),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    );
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Máquina não encontrada no tenant");
  }
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
