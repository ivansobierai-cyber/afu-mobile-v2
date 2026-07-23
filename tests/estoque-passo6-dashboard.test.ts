/**
 * Etapa 7 Passo 6 — dashboard de estoque.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 7 Passo 6 — dashboard estoque", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_estoque_p6";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("retorna indicadores do plano", async () => {
    const itemId = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "Dashboard Ureia",
      categoria: "fertilizante",
      unidadeBase: "kg",
      estoqueMinimo: 50,
      saldoInicial: 20,
    });
    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "saida",
      quantidade: 2,
      motivo: "Saída dashboard",
    });
    await a.caller.coreData.expansao.estoque.movimento({
      itemId,
      propriedadeId: a.propriedadeId,
      tipo: "perda",
      quantidade: 1,
      motivo: "Perda dashboard",
    });
    await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "adubacao",
      titulo: "Reserva dash",
      dataPrevista: new Date().toISOString(),
      reservas: [{ itemId, quantidade: 3 }],
    });

    const dash = await a.caller.coreData.expansao.estoque.dashboard({
      propriedadeId: a.propriedadeId,
    });
    expect(dash.estoqueAtual.itens).toBeGreaterThanOrEqual(1);
    expect(dash.consumoMensal).toBeGreaterThanOrEqual(2);
    expect(dash.perdasMensal).toBeGreaterThanOrEqual(1);
    expect(dash.reservas.ativas).toBeGreaterThanOrEqual(1);
    expect(dash.itensCriticos.some((i) => i.id === itemId)).toBe(true);
    expect(typeof dash.valorTotalEstoque).toBe("number");
  });
});
