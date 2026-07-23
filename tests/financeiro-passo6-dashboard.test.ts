/**
 * Etapa 8 Passo 6 — dashboard financeiro.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 8 Passo 6 — dashboard financeiro", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_dash_p6";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("retorna planejado/executado/receita/despesas/custos/resultado e séries", async () => {
    await a.caller.coreData.expansao.custos.createOrcamento({
      propriedadeId: a.propriedadeId,
      nomeSafra: "Safra Dash",
      orcamentoPrevisto: 10000,
    });
    await a.caller.coreData.expansao.custos.createCusto({
      propriedadeId: a.propriedadeId,
      descricao: "Custo dash",
      valor: 400,
      categoria: "insumo",
    });
    await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "receita",
      descricao: "Venda dash",
      valor: 2000,
    });
    await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "despesa",
      descricao: "Taxa dash",
      valor: 50,
    });

    const dash = await a.caller.coreData.expansao.financeiro.dashboard({
      propriedadeId: a.propriedadeId,
    });
    expect(dash.planejado).toBeGreaterThanOrEqual(10000);
    expect(dash.custos).toBeGreaterThanOrEqual(400);
    expect(dash.receita).toBeGreaterThanOrEqual(2000);
    expect(dash.despesas).toBeGreaterThanOrEqual(50);
    expect(dash.resultado).toBeDefined();
    expect(dash.series.length).toBeGreaterThanOrEqual(6);
    expect(dash.series.map((s) => s.label)).toEqual(
      expect.arrayContaining(["Planejado", "Executado", "Receita", "Despesas", "Custos", "Resultado"]),
    );
  });
});
