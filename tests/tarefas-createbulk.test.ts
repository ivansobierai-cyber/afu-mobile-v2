/**
 * createBulk — all-or-nothing (pré-validação + transação).
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  createIsolatedTenantPair,
  expectTenantDenied,
  type TenantFixture,
} from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("tarefas.createBulk atomicidade", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_secret_createbulk";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("sucesso: cria uma tarefa por talhão válido", async () => {
    const terreno2 = await a.caller.coreData.terrenos.create({
      propriedadeId: a.propriedadeId,
      nome: "Talhao bulk 2",
      area: 2,
    });
    const ids = await a.caller.coreData.tarefas.createBulk({
      propriedadeId: a.propriedadeId,
      terrenoIds: [a.terrenoId, terreno2],
      culturaId: a.cultivoId,
      tipoOperacao: "pulverizacao",
      titulo: "Bulk ok",
      dataPrevista: new Date().toISOString(),
      prioridade: "normal",
      clientMutationId: `bulk_ok_${Date.now()}`,
    });
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("falha com terreno de outro tenant: não cria nenhuma tarefa nova", async () => {
    const before = await a.caller.coreData.tarefas.listByPropriedade({
      propriedadeId: a.propriedadeId,
    });
    const mutationId = `bulk_fail_${Date.now()}`;
    await expectTenantDenied(
      a.caller.coreData.tarefas.createBulk({
        propriedadeId: a.propriedadeId,
        terrenoIds: [a.terrenoId, b.terrenoId],
        tipoOperacao: "monitoramento",
        titulo: "Bulk deve falhar",
        dataPrevista: new Date().toISOString(),
        clientMutationId: mutationId,
      }),
    );
    const after = await a.caller.coreData.tarefas.listByPropriedade({
      propriedadeId: a.propriedadeId,
    });
    expect(after.length).toBe(before.length);
    expect(after.every((t) => !String(t.clientMutationId ?? "").startsWith(mutationId))).toBe(
      true,
    );
  });

  it("retry idempotente com clientMutationId devolve os mesmos ids", async () => {
    const terreno2 = await a.caller.coreData.terrenos.create({
      propriedadeId: a.propriedadeId,
      nome: "Talhao bulk idem",
      area: 1,
    });
    const mutationId = `bulk_idem_${Date.now()}`;
    const payload = {
      propriedadeId: a.propriedadeId,
      terrenoIds: [a.terrenoId, terreno2],
      tipoOperacao: "adubacao" as const,
      titulo: "Bulk idem",
      dataPrevista: new Date().toISOString(),
      clientMutationId: mutationId,
    };
    const first = await a.caller.coreData.tarefas.createBulk(payload);
    const second = await a.caller.coreData.tarefas.createBulk(payload);
    expect(second).toEqual(first);
  });
});
