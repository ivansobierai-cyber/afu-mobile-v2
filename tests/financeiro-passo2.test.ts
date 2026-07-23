/**
 * Etapa 8 Passo 2 — lançamentos financeiros + classificação automática.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { classificarLancamentoFinanceiro } from "../lib/propriedades/financeiro-classificar";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

describe("classificarLancamentoFinanceiro", () => {
  it("classifica receita/despesa/investimento", () => {
    expect(classificarLancamentoFinanceiro("receita", "Venda de soja")).toBe("venda_producao");
    expect(classificarLancamentoFinanceiro("despesa", "Diesel pulverização")).toBe("combustivel");
    expect(classificarLancamentoFinanceiro("custo", "Ureia 45%")).toBe("insumo");
    expect(classificarLancamentoFinanceiro("investimento", "Trator novo")).toBe("ativo_imobilizado");
    expect(classificarLancamentoFinanceiro("despesa", "Outros")).toBe("despesa_outra");
  });
});

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 8 Passo 2 — cadastro financeiro", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_fin_p2";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("cria despesa/receita/custo/investimento com categoria automática", async () => {
    const despesa = await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "despesa",
      descricao: "Salário operador",
      valor: 2000,
    });
    expect(despesa.categoriaAuto).toBe("mao_obra");

    const receita = await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "receita",
      descricao: "Venda colheita milho",
      valor: 50000,
    });
    expect(receita.categoriaAuto).toBe("venda_producao");

    const custo = await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "custo",
      descricao: "Herbicida glifosato",
      valor: 800,
      terrenoId: a.terrenoId,
      tarefaId: a.tarefaId,
    });
    expect(custo.categoriaAuto).toBe("insumo");

    const inv = await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "investimento",
      descricao: "Pulverizador autopropelido",
      valor: 120000,
    });
    expect(inv.categoriaAuto).toBe("ativo_imobilizado");

    const list = await a.caller.coreData.expansao.financeiro.list({
      propriedadeId: a.propriedadeId,
    });
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.every((l) => l.organizationId === a.organizationId)).toBe(true);

    const { getDb } = await import("../server/db");
    const { financeiroLancamentos } = await import("../drizzle/schema");
    const db = await getDb();
    const row = await db!
      .select()
      .from(financeiroLancamentos)
      .where(eq(financeiroLancamentos.id, custo.id))
      .limit(1);
    expect(row[0]?.tarefaId).toBe(a.tarefaId);
    expect(row[0]?.createdByUserId).toBe(a.userId);
  });

  it("não lista lançamentos de outro tenant", async () => {
    await b.caller.coreData.expansao.financeiro.create({
      propriedadeId: b.propriedadeId,
      tipo: "receita",
      descricao: "Receita secreta B",
      valor: 1,
    });
    const listA = await a.caller.coreData.expansao.financeiro.list({
      propriedadeId: a.propriedadeId,
    });
    expect(listA.some((l) => l.descricao === "Receita secreta B")).toBe(false);
  });
});
