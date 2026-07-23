/**
 * Etapa 7 Passo 4 — reserva na criação → validação ao iniciar → consumo ao concluir → liberação ao cancelar.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 7 Passo 4 — integração operações/estoque", () => {
  let a: TenantFixture;
  let itemId: number;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_estoque_p4";
    ({ a } = await createIsolatedTenantPair());
    itemId = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "Adubo P4",
      categoria: "fertilizante",
      unidadeBase: "kg",
      saldoInicial: 100,
    });
  }, 120_000);

  async function reservasDaTarefa(tarefaId: number) {
    const { getDb } = await import("../server/db");
    const { estoqueReservas } = await import("../drizzle/schema");
    const db = await getDb();
    return db!
      .select()
      .from(estoqueReservas)
      .where(
        and(
          eq(estoqueReservas.tarefaId, tarefaId),
          eq(estoqueReservas.organizationId, a.organizationId),
        ),
      );
  }

  async function saldoItem() {
    const list = await a.caller.coreData.expansao.estoque.list({
      propriedadeId: a.propriedadeId,
    });
    return Number(list.find((i) => i.id === itemId)?.saldo ?? 0);
  }

  it("cria tarefa com reserva ativa sem baixar saldo físico", async () => {
    const before = await saldoItem();
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "adubacao",
      titulo: "Adubação com reserva",
      dataPrevista: new Date().toISOString(),
      reservas: [{ itemId, quantidade: 15 }],
    });
    const reservas = await reservasDaTarefa(tarefaId);
    expect(reservas).toHaveLength(1);
    expect(reservas[0]?.status).toBe("ativa");
    expect(Number(reservas[0]?.quantidade)).toBe(15);
    expect(await saldoItem()).toBe(before);
  });

  it("ao concluir transforma reserva em consumo e baixa saldo", async () => {
    const before = await saldoItem();
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "adubacao",
      titulo: "Adubação concluir",
      dataPrevista: new Date().toISOString(),
      reservas: [{ itemId, quantidade: 10 }],
    });
    await a.caller.coreData.tarefas.transition({
      id: tarefaId,
      status: "liberada",
    });
    await a.caller.coreData.tarefas.transition({
      id: tarefaId,
      status: "em_execucao",
    });
    await a.caller.coreData.tarefas.transition({
      id: tarefaId,
      status: "concluida",
    });
    const reservas = await reservasDaTarefa(tarefaId);
    expect(reservas[0]?.status).toBe("consumida");
    expect(await saldoItem()).toBe(before - 10);

    const hist = await a.caller.coreData.expansao.estoque.historico({
      propriedadeId: a.propriedadeId,
      itemId,
      limit: 50,
    });
    expect(hist.some((h) => h.tipo === "consumo" && h.tarefaId === tarefaId)).toBe(true);
  });

  it("ao cancelar libera reserva sem consumir", async () => {
    const before = await saldoItem();
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "adubacao",
      titulo: "Adubação cancelar",
      dataPrevista: new Date().toISOString(),
      reservas: [{ itemId, quantidade: 8 }],
    });
    await a.caller.coreData.tarefas.transition({
      id: tarefaId,
      status: "cancelada",
      motivoCancelamento: "Chuva",
    });
    const reservas = await reservasDaTarefa(tarefaId);
    expect(reservas[0]?.status).toBe("cancelada");
    expect(await saldoItem()).toBe(before);
  });

  it("bloqueia consumo sem tarefa relacionada", async () => {
    await expect(
      a.caller.coreData.expansao.estoque.movimento({
        itemId,
        propriedadeId: a.propriedadeId,
        tipo: "consumo",
        quantidade: 1,
      }),
    ).rejects.toThrow(/operação relacionada|tarefaId/i);
  });

  it("bloqueia reserva acima do disponível", async () => {
    const saldo = await saldoItem();
    await expect(
      a.caller.coreData.tarefas.create({
        propriedadeId: a.propriedadeId,
        tipoOperacao: "adubacao",
        titulo: "Reserva impossível",
        dataPrevista: new Date().toISOString(),
        reservas: [{ itemId, quantidade: saldo + 500 }],
      }),
    ).rejects.toThrow();
  });
});
