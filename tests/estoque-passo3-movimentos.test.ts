/**
 * Etapa 7 Passo 3 — movimentações: saldo só via movimentos + histórico/auditoria.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";
import {
  calcularSaldoPorMovimentos,
  deltaSaldoMovimento,
} from "../server/db-propriedade-expansao";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("Etapa 7 Passo 3 — regras de saldo (puro)", () => {
  it("delta por tipo", () => {
    expect(deltaSaldoMovimento("entrada", 10)).toBe(10);
    expect(deltaSaldoMovimento("ajuste", 3)).toBe(3);
    expect(deltaSaldoMovimento("saida", 2)).toBe(-2);
    expect(deltaSaldoMovimento("consumo", 1)).toBe(-1);
    expect(deltaSaldoMovimento("reserva", 4)).toBe(0);
    expect(deltaSaldoMovimento("perda", 1)).toBe(-1);
    expect(deltaSaldoMovimento("transferencia", 99)).toBe(0);
  });

  it("saldo reconstruído pelos movimentos", () => {
    const saldo = calcularSaldoPorMovimentos([
      { tipo: "entrada", quantidade: 100 },
      { tipo: "reserva", quantidade: 20 },
      { tipo: "consumo", quantidade: 10 },
      { tipo: "saida", quantidade: 5 },
      { tipo: "ajuste", quantidade: 2 },
      { tipo: "transferencia", quantidade: 50 },
    ]);
    // reserva não altera saldo físico → 100 - 10 - 5 + 2 = 87
    expect(saldo).toBe(87);
  });
});

describe.skipIf(!hasDb)("Etapa 7 Passo 3 — movimentações integração", () => {
  let a: TenantFixture;
  let itemId: number;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_estoque_p3";
    ({ a } = await createIsolatedTenantPair());
    itemId = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "Ureia P3",
      categoria: "fertilizante",
      unidadeBase: "kg",
      saldoInicial: 0,
    });
  }, 120_000);

  async function saldoAtual() {
    const { getDb } = await import("../server/db");
    const { estoqueItens } = await import("../drizzle/schema");
    const db = await getDb();
    const rows = await db!.select().from(estoqueItens).where(eq(estoqueItens.id, itemId)).limit(1);
    return Number(rows[0]?.saldo);
  }

  it("entrada aumenta saldo e grava auditoria", async () => {
    const r = await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "entrada",
      quantidade: 50,
      motivo: "Compra",
    });
    expect(r.saldo).toBe(50);
    expect(await saldoAtual()).toBe(50);

    const hist = await a.caller.coreData.expansao.estoque.historico({
      propriedadeId: a.propriedadeId,
      itemId,
    });
    expect(hist.length).toBeGreaterThan(0);
    expect(hist[0]?.organizationId).toBe(a.organizationId);
    expect(hist[0]?.propriedadeId).toBe(a.propriedadeId);
    expect(hist[0]?.createdByUserId).toBe(a.userId);
    expect(hist.some((h) => h.tipo === "entrada")).toBe(true);
  });

  it("saida / reserva / consumo / ajuste / transferencia", async () => {
    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "saida",
      quantidade: 5,
      motivo: "Venda interna",
    });
    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "reserva",
      quantidade: 10,
      motivo: "Reserva tarefa",
    });
    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "consumo",
      quantidade: 3,
      motivo: "Aplicação",
      tarefaId: 1,
    });
    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "ajuste",
      quantidade: 1,
      motivo: "Inventário",
    });
    const beforeTx = await saldoAtual();
    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "transferencia",
      quantidade: 2,
      motivo: "Troca de depósito",
    });
    expect(await saldoAtual()).toBe(beforeTx);

    const hist = await a.caller.coreData.expansao.estoque.historico({
      propriedadeId: a.propriedadeId,
      itemId,
      limit: 50,
    });
    const tipos = new Set(hist.map((h) => h.tipo));
    for (const t of ["entrada", "saida", "reserva", "consumo", "ajuste", "transferencia"] as const) {
      expect(tipos.has(t)).toBe(true);
    }

    // Saldo em cache = reconstrução pelos movimentos
    const reconstruido = calcularSaldoPorMovimentos(
      hist.map((h) => ({ tipo: h.tipo, quantidade: h.quantidade })),
    );
    expect(await saldoAtual()).toBe(reconstruido);
  });

  it("bloqueia saída além do saldo", async () => {
    const atual = await saldoAtual();
    await expect(
      a.caller.coreData.expansao.estoque.movimento({
        itemId,
        propriedadeId: a.propriedadeId,
        tipo: "saida",
        quantidade: atual + 100,
      }),
    ).rejects.toThrow();
  });

  it("histórico não vaza entre propriedades", async () => {
    const { b } = await createIsolatedTenantPair();
    const histB = await b.caller.coreData.expansao.estoque.historico({
      propriedadeId: b.propriedadeId,
      itemId,
    });
    expect(histB.length).toBe(0);
  });
});
