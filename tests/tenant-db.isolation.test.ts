/**
 * Etapa 5 — isolamento direto no banco via tenant-db.
 * Usa MySQL local (afu_mobile). Skip se DATABASE_URL ausente.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { TRPCError } from "@trpc/server";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("tenant-db isolation (Etapa 5 / MySQL)", () => {
  let createTenantDb: typeof import("../server/tenant-db").createTenantDb;
  let orgA: number;
  let orgB: number;
  let propA: number;
  let propB: number;
  let terrenoB: number;

  beforeAll(async () => {
    ({ createTenantDb } = await import("../server/tenant-db"));
    const { getDb } = await import("../server/db");
    const { propriedades, terrenos } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const props = await db.select().from(propriedades).limit(20);
    const byOrg = new Map<number, number>();
    for (const p of props) {
      if (p.organizationId != null && !byOrg.has(p.organizationId)) {
        byOrg.set(p.organizationId, p.id);
      }
    }
    const orgs = [...byOrg.keys()];
    if (orgs.length < 2) {
      throw new Error(
        "Precisa de ≥2 organizações com propriedades para o teste de isolamento (rode seed/backfill)",
      );
    }
    orgA = orgs[0];
    orgB = orgs[1];
    propA = byOrg.get(orgA)!;
    propB = byOrg.get(orgB)!;

    const trows = await db.select().from(terrenos).limit(50);
    const tb = trows.find((t) => t.organizationId === orgB);
    if (!tb) throw new Error("Org B sem talhão — rode seed");
    terrenoB = tb.id;
  });

  it("org A lê sua propriedade e não a da org B", async () => {
    const dbA = createTenantDb(orgA);
    const own = await dbA.getPropriedade(propA);
    expect(own?.id).toBe(propA);
    expect(own?.organizationId).toBe(orgA);

    const foreign = await dbA.getPropriedade(propB);
    expect(foreign).toBeUndefined();
  });

  it("requirePropriedade cross-tenant lança NOT_FOUND genérico", async () => {
    const dbA = createTenantDb(orgA);
    try {
      await dbA.requirePropriedade(propB);
      expect.fail("deveria lançar");
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect((e as TRPCError).code).toBe("NOT_FOUND");
      expect((e as TRPCError).message).toBe("Recurso não encontrado");
    }
  });

  it("UPDATE com organizationId errado não altera linha", async () => {
    const dbA = createTenantDb(orgA);
    const before = await createTenantDb(orgB).requireTerreno(terrenoB);
    const ok = await dbA.updateTerreno(terrenoB, { nome: "__CROSS_TENANT_SHOULD_FAIL__" });
    expect(ok).toBe(false);
    const after = await createTenantDb(orgB).requireTerreno(terrenoB);
    expect(after.nome).toBe(before.nome);
  });

  it("DELETE cross-tenant não remove linha", async () => {
    const dbA = createTenantDb(orgA);
    const ok = await dbA.deleteTerreno(terrenoB);
    expect(ok).toBe(false);
    const still = await createTenantDb(orgB).getTerreno(terrenoB);
    expect(still?.id).toBe(terrenoB);
  });

  it("listPropriedades só retorna a org ativa", async () => {
    const listA = await createTenantDb(orgA).listPropriedades();
    expect(listA.every((p) => p.organizationId === orgA)).toBe(true);
    expect(listA.some((p) => p.id === propB)).toBe(false);
  });

  it("dashboardStats não mistura tenants", async () => {
    const statsA = await createTenantDb(orgA).dashboardStats();
    const statsB = await createTenantDb(orgB).dashboardStats();
    const listA = await createTenantDb(orgA).listPropriedades();
    const listB = await createTenantDb(orgB).listPropriedades();
    expect(statsA.propriedades).toBe(listA.length);
    expect(statsB.propriedades).toBe(listB.length);
  });

  it("INSERT sem organizationId é rejeitado na camada de create helpers", async () => {
    const { createRelatorio } = await import("../server/db");
    await expect(
      createRelatorio({
        titulo: "x",
        usuarioId: 1,
      } as any),
    ).rejects.toThrow(/organizationId obrigatório/);
  });
});
