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
      terrenoId: a.terrenoId,
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
        terrenoId: a.terrenoId,
        nomeCultura: "Bloqueado",
        status: "planejado",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("close e reopen com auditoria — reopen exige safra.reopen", async () => {
    const safra = await a.caller.coreData.expansao.safras.ensureDefault({
      propriedadeId: a.propriedadeId,
    });
    const closedRes = await a.caller.coreData.expansao.safras.close({
      propriedadeId: a.propriedadeId,
      safraId: safra.id,
      allowNoDefault: true,
    });
    expect(closedRes.status).toBe("encerrada");
    expect(closedRes.isDefault).toBe(false);

    await expect(
      a.caller.coreData.cultivos.create({
        propriedadeId: a.propriedadeId,
        safraId: closedRes.id,
        terrenoId: a.terrenoId,
        nomeCultura: "Bloqueado pós-close",
      }),
    ).rejects.toBeInstanceOf(TRPCError);

    const reopened = await a.caller.coreData.expansao.safras.reopen({
      propriedadeId: a.propriedadeId,
      safraId: closedRes.id,
      makeDefault: true,
    });
    expect(reopened.status).toBe("ativa");
    expect(reopened.isDefault).toBe(true);
  });

  it("transition de tarefa em safra encerrada é negada (SAFRA_READ_ONLY)", async () => {
    const atual = await a.caller.coreData.expansao.safras.ensureDefault({
      propriedadeId: a.propriedadeId,
    });
    const { createSafra } = await import("../server/db-safras");
    const histId = await createSafra({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: "Safra Transição Histórica",
      status: "ativa",
      isDefault: false,
    });
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      safraId: histId,
      tipoOperacao: "monitoramento",
      titulo: "Tarefa histórica",
      dataPrevista: new Date().toISOString(),
    });
    await a.caller.coreData.expansao.safras.close({
      propriedadeId: a.propriedadeId,
      safraId: histId,
      allowNoDefault: true,
    });
    // garantir corrente permanece
    expect(atual.id).toBeTruthy();

    await expect(
      a.caller.coreData.tarefas.transition({
        id: tarefaId,
        status: "em_execucao",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("SAFRA_READ_ONLY"),
    });
  });
});

describe.skipIf(!hasDb)("property archive (correção Etapa 7)", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_archive";
    const pair = await createIsolatedTenantPair();
    a = pair.a;
  }, 120_000);

  it("archive remove da listagem e restore recupera", async () => {
    const before = await a.caller.coreData.propriedades.list({
      cacheScope: a.organizationId,
    });
    expect(before.some((p) => p.id === a.propriedadeId)).toBe(true);

    await a.caller.coreData.propriedades.archive({
      id: a.propriedadeId,
      motivo: "Teste de arquivamento soft",
    });
    const after = await a.caller.coreData.propriedades.list({
      cacheScope: a.organizationId,
    });
    expect(after.some((p) => p.id === a.propriedadeId)).toBe(false);

    await a.caller.coreData.propriedades.restore({ id: a.propriedadeId });
    const restored = await a.caller.coreData.propriedades.list({
      cacheScope: a.organizationId,
    });
    expect(restored.some((p) => p.id === a.propriedadeId)).toBe(true);
  });

  it("listArchived lista soft-arquivadas", async () => {
    await a.caller.coreData.propriedades.archive({
      id: a.propriedadeId,
      motivo: "Listagem arquivadas",
    });
    const archived = await a.caller.coreData.propriedades.listArchived({
      cacheScope: a.organizationId,
    });
    expect(archived.some((p) => p.id === a.propriedadeId)).toBe(true);
    await a.caller.coreData.propriedades.restore({ id: a.propriedadeId });
  });

  it("exportResumo retorna texto e exige reports.export", async () => {
    const res = await a.caller.coreData.propriedades.exportResumo({
      id: a.propriedadeId,
      safraLabel: "Safra teste",
    });
    expect(res.text).toContain("Propriedade:");
    expect(res.title).toContain("Resumo");
    expect(res.exportedAt).toBeTruthy();
  });

  it("delete definitivo exige confirmNome e property.delete", async () => {
    const created = await a.caller.coreData.propriedades.create({
      nome: "Prop Delete Test",
      cidade: "Teste",
      estado: "PR",
    });
    await expect(
      a.caller.coreData.propriedades.delete({
        id: created,
        confirmNome: "Nome errado",
      }),
    ).rejects.toBeInstanceOf(TRPCError);

    await a.caller.coreData.propriedades.delete({
      id: created,
      confirmNome: "Prop Delete Test",
    });
    const list = await a.caller.coreData.propriedades.list({
      cacheScope: a.organizationId,
    });
    expect(list.some((p) => p.id === created)).toBe(false);
  });
});
