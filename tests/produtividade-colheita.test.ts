/**
 * Produtividade kg/ha — cálculo puro + API com produção real.
 */
import { describe, expect, it, beforeAll } from "vitest";
import {
  calcularProdutividadeAgregada,
  calcularProdutividadeCultivo,
} from "../lib/propriedades/produtividade";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

describe("calcularProdutividadeCultivo", () => {
  it("prefere produção real sobre estimada", () => {
    const r = calcularProdutividadeCultivo({
      areaPlantada: 10,
      producaoEstimada: 5000,
      producaoReal: 4000,
    });
    expect(r.fonte).toBe("real");
    expect(r.produtividade).toBe(400);
    expect(r.producaoUsada).toBe(4000);
  });

  it("usa estimada quando não há real", () => {
    const r = calcularProdutividadeCultivo({
      areaPlantada: 5,
      producaoEstimada: 1000,
      producaoReal: null,
    });
    expect(r.fonte).toBe("estimada");
    expect(r.produtividade).toBe(200);
  });
});

describe("calcularProdutividadeAgregada", () => {
  it("agrega só cultivos com produção real e área", () => {
    const r = calcularProdutividadeAgregada([
      { areaPlantada: 10, producaoReal: 4000, producaoEstimada: 9999 },
      { areaPlantada: 10, producaoReal: 6000 },
      { areaPlantada: 5, producaoEstimada: 1000 }, // ignorado
    ]);
    expect(r.fonte).toBe("real");
    expect(r.producaoUsada).toBe(10000);
    expect(r.areaHa).toBe(20);
    expect(r.produtividade).toBe(500);
  });

  it("retorna null sem produção real", () => {
    const r = calcularProdutividadeAgregada([
      { areaPlantada: 10, producaoEstimada: 5000 },
    ]);
    expect(r.produtividade).toBeNull();
    expect(r.fonte).toBeNull();
  });
});

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("produtividade API (integração)", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_prod_real";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("atualiza producaoReal e reflete nos indicadores", async () => {
    const cultivoId = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "Soja Prod",
      areaPlantada: 10,
      producaoEstimada: 5000,
      unidadeProducao: "kg",
    });

    await a.caller.coreData.cultivos.update({
      id: cultivoId,
      data: { producaoReal: 4500, status: "colhido" },
    });

    const indCultivo = await a.caller.coreData.cultivos.indicadores({ id: cultivoId });
    expect(indCultivo.produtividadeFonte).toBe("real");
    expect(indCultivo.produtividade).toBe(450);
    expect(indCultivo.producaoUsada).toBe(4500);

    const indProp = await a.caller.coreData.expansao.indicadores({
      propriedadeId: a.propriedadeId,
    });
    expect(indProp.produtividadeFonte).toBe("real");
    expect(indProp.produtividade).toBe(450);
  });
});
