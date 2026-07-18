import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("safras entity (correção Etapa 2)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_safras";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("ensureDefault cria safra na propriedade do tenant", async () => {
    const safra = await a.caller.coreData.expansao.safras.ensureDefault({
      propriedadeId: a.propriedadeId,
    });
    expect(safra.organizationId).toBe(a.organizationId);
    expect(safra.propriedadeId).toBe(a.propriedadeId);
    expect(safra.isDefault).toBe(true);

    const list = await a.caller.coreData.expansao.safras.list({
      propriedadeId: a.propriedadeId,
    });
    expect(list.some((s) => s.id === safra.id)).toBe(true);
  });

  it("A não lê safra de B (cross-tenant / cross-property)", async () => {
    const safraB = await b.caller.coreData.expansao.safras.ensureDefault({
      propriedadeId: b.propriedadeId,
    });
    await expect(
      a.caller.coreData.expansao.safras.get({
        propriedadeId: a.propriedadeId,
        safraId: safraB.id,
      }),
    ).rejects.toBeInstanceOf(TRPCError);

    await expect(
      a.caller.coreData.expansao.safras.get({
        propriedadeId: b.propriedadeId,
        safraId: safraB.id,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("overview resolve safraId e scope do tenant", async () => {
    const safra = await a.caller.coreData.expansao.safras.ensureDefault({
      propriedadeId: a.propriedadeId,
    });
    const overview = await a.caller.coreData.expansao.overview({
      propriedadeId: a.propriedadeId,
      safraId: safra.id,
      cacheScope: a.organizationId,
    });
    expect(overview.scope?.organizationId).toBe(a.organizationId);
    expect(overview.scope?.safraId).toBe(safra.id);
    expect(["complete", "partial"]).toContain(overview.completeness?.status);
  });

  it("duas safras — overview não mistura cultivos", async () => {
    const atual = await a.caller.coreData.expansao.safras.ensureDefault({
      propriedadeId: a.propriedadeId,
    });
    const { createSafra } = await import("../server/db-safras");
    const { getDb } = await import("../server/db");
    const { culturas } = await import("../drizzle/schema");
    const histId = await createSafra({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: "Safra 2024/25",
      status: "encerrada",
      isDefault: false,
    });
    await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      safraId: atual.id,
      nomeCultura: "Soja atual",
      status: "em_andamento",
    });
    // histórico: insert direto (create API bloqueia safra encerrada — Etapa 5)
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.insert(culturas).values({
      propriedadeId: a.propriedadeId,
      organizationId: a.organizationId,
      safraId: histId,
      nomeCultura: "Milho histórico",
      status: "colhido",
    });

    const cultAtual = await a.caller.coreData.cultivos.listByPropriedade({
      propriedadeId: a.propriedadeId,
      safraId: atual.id,
    });
    const cultHist = await a.caller.coreData.cultivos.listByPropriedade({
      propriedadeId: a.propriedadeId,
      safraId: histId,
    });
    expect(cultAtual.every((c) => c.safraId === atual.id)).toBe(true);
    expect(cultHist.every((c) => c.safraId === histId)).toBe(true);
    expect(cultAtual.some((c) => c.nomeCultura === "Milho histórico")).toBe(false);
    expect(cultHist.some((c) => c.nomeCultura === "Soja atual")).toBe(false);

    await expect(
      a.caller.coreData.cultivos.create({
        propriedadeId: a.propriedadeId,
        safraId: histId,
        nomeCultura: "Bloqueado",
        status: "planejado",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
