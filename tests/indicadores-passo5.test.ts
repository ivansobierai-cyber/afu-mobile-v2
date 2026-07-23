/**
 * Etapa 8 Passo 5 — indicadores (cálculos + API).
 */
import { describe, expect, it, beforeAll } from "vitest";
import { calcularIndicadores } from "../lib/propriedades/indicadores-financeiros";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

describe("calcularIndicadores", () => {
  it("calcula custo/ha, lucro, margem e ROI sem dupla contagem", () => {
    const r = calcularIndicadores({
      areaHa: 10,
      custos: [
        { valor: 1000, safraId: 1, culturaId: 2, tarefaId: 3 },
        { valor: 500, safraId: 1, culturaId: 2, tarefaId: 4 },
      ],
      lancamentos: [
        { tipo: "receita", valor: 5000 },
        { tipo: "despesa", valor: 200 },
        { tipo: "investimento", valor: 1000 },
        { tipo: "custo", valor: 9999 }, // ignorado no P&L porque há custos_operacao
      ],
      produtividade: 60,
    });
    expect(r.custosOperacionais).toBe(1500);
    expect(r.custoPorHectare).toBe(150);
    expect(r.custoPorSafra[0]?.total).toBe(1500);
    expect(r.custoPorCultura[0]?.total).toBe(1500);
    expect(r.custoPorOperacao).toHaveLength(2);
    expect(r.lucro).toBe(5000 - 200 - 1500);
    expect(r.margemPct).toBeGreaterThan(0);
    expect(r.roiPct).toBeDefined();
    expect(r.produtividade).toBe(60);
  });
});

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 8 Passo 5 — indicadores API", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_ind_p5";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("retorna indicadores da propriedade", async () => {
    await a.caller.coreData.expansao.custos.createCusto({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      tarefaId: a.tarefaId,
      descricao: "Custo indicador",
      valor: 250,
      categoria: "insumo",
    });
    await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "receita",
      descricao: "Venda indicador",
      valor: 1000,
    });
    const ind = await a.caller.coreData.expansao.indicadores({
      propriedadeId: a.propriedadeId,
    });
    expect(ind.receita).toBeGreaterThanOrEqual(1000);
    expect(ind.custosOperacionais).toBeGreaterThanOrEqual(250);
    expect(ind.lucro).toBeDefined();
    expect(ind.margemPct).toBeDefined();
    expect(ind.roiPct).toBeDefined();
  });
});
