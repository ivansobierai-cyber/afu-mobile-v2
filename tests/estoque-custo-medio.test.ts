/**
 * Estoque — custo médio ponderado e valorDisponivel no dashboard.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";
import { calcularCustoMedioPonderado } from "../server/db-propriedade-expansao";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("estoque custo médio (puro)", () => {
  it("primeira entrada define custo", () => {
    expect(
      calcularCustoMedioPonderado({
        saldoAntes: 0,
        custoMedioAntes: null,
        quantidadeEntrada: 10,
        custoUnitario: 5,
      }),
    ).toBe(5);
  });

  it("pondera entradas sucessivas", () => {
    // 10@5 + 10@15 = média 10
    expect(
      calcularCustoMedioPonderado({
        saldoAntes: 10,
        custoMedioAntes: 5,
        quantidadeEntrada: 10,
        custoUnitario: 15,
      }),
    ).toBe(10);
  });
});

describe.skipIf(!hasDb)("estoque custo médio (integração)", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_estoque_cm";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("entrada com custoUnitario atualiza custoMedio e dashboard", async () => {
    const itemId = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "MAP Custo",
      categoria: "fertilizante",
      unidadeBase: "kg",
      saldoInicial: 100,
      custoMedio: 4.5,
    });

    const { getDb } = await import("../server/db");
    const { estoqueItens } = await import("../drizzle/schema");
    const db = await getDb();
    const rows = await db!
      .select()
      .from(estoqueItens)
      .where(eq(estoqueItens.id, itemId))
      .limit(1);
    expect(Number(rows[0]?.custoMedio)).toBeCloseTo(4.5, 3);
    expect(Number(rows[0]?.saldo)).toBe(100);

    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "entrada",
      quantidade: 100,
      custoUnitario: 5.5,
      motivo: "Reposição",
    });

    const after = await db!
      .select()
      .from(estoqueItens)
      .where(eq(estoqueItens.id, itemId))
      .limit(1);
    expect(Number(after[0]?.custoMedio)).toBeCloseTo(5, 3);
    expect(Number(after[0]?.saldo)).toBe(200);

    const dash = await a.caller.coreData.expansao.estoque.dashboard({
      propriedadeId: a.propriedadeId,
    });
    expect(dash.valorDisponivel).toBe(true);
    expect(dash.valorTotalEstoque).toBeGreaterThan(0);
  });
});
