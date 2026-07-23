/**
 * Etapa 8 Passo 1 — centros de custo (propriedade, safra, talhão, cultura, operação).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 8 Passo 1 — centros de custo", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_centros_p1";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("lista centros da propriedade sem vazar tenant", async () => {
    const centros = await a.caller.coreData.expansao.custos.centros({
      propriedadeId: a.propriedadeId,
    });
    expect(centros.propriedade.id).toBe(a.propriedadeId);
    expect(centros.safras.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(centros.talhoes)).toBe(true);
    expect(Array.isArray(centros.culturas)).toBe(true);
    expect(Array.isArray(centros.operacoes)).toBe(true);

    await expect(
      a.caller.coreData.expansao.custos.centros({ propriedadeId: b.propriedadeId }),
    ).rejects.toThrow();
  });

  it("createCusto aceita terreno/cultura/tarefa do tenant", async () => {
    const centros = await a.caller.coreData.expansao.custos.centros({
      propriedadeId: a.propriedadeId,
    });
    const terrenoId = centros.talhoes[0]?.id ?? a.terrenoId;
    const culturaId = centros.culturas[0]?.id;
    const tarefaId = centros.operacoes[0]?.id ?? a.tarefaId;

    const id = await a.caller.coreData.expansao.custos.createCusto({
      propriedadeId: a.propriedadeId,
      terrenoId,
      culturaId,
      tarefaId,
      descricao: "Adubo talhão",
      valor: 150.5,
      categoria: "insumo",
    });
    expect(id).toBeGreaterThan(0);

    const { getDb } = await import("../server/db");
    const { custosOperacao } = await import("../drizzle/schema");
    const db = await getDb();
    const rows = await db!.select().from(custosOperacao).where(eq(custosOperacao.id, id)).limit(1);
    expect(rows[0]?.organizationId).toBe(a.organizationId);
    expect(rows[0]?.propriedadeId).toBe(a.propriedadeId);
    expect(rows[0]?.safraId).toBeTruthy();
    expect(rows[0]?.terrenoId).toBe(terrenoId);
    if (culturaId) expect(rows[0]?.culturaId).toBe(culturaId);
    expect(rows[0]?.tarefaId).toBe(tarefaId);
    expect(rows[0]?.createdByUserId).toBe(a.userId);
  });

  it("rejeita centro de outro tenant", async () => {
    await expect(
      a.caller.coreData.expansao.custos.createCusto({
        propriedadeId: a.propriedadeId,
        terrenoId: b.terrenoId,
        descricao: "Cross tenant",
        valor: 10,
      }),
    ).rejects.toThrow();
  });
});
