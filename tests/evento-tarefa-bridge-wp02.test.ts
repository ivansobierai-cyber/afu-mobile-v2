/**
 * WP-02 — ponte calendário ↔ tarefa (create/update + espelho de status).
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  createIsolatedTenantPair,
  expectTenantDenied,
  type TenantFixture,
} from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("WP-02 — ponte evento ↔ tarefa", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_wp02_bridge";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("criar evento com propriedade gera tarefa vinculada", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoAtividade: "pulverizacao",
      titulo: `WP02 bridge ${Date.now()}`,
      dataProgramada: new Date().toISOString(),
      status: "pendente",
      prioridade: "alta",
    });

    const tarefa = await a.caller.coreData.tarefas.getByEvento({ eventoId });
    expect(tarefa).not.toBeNull();
    expect(tarefa!.legadoEventoId).toBe(eventoId);
    expect(tarefa!.origem).toBe("calendario_legado");
    expect(tarefa!.tipoOperacao).toBe("pulverizacao");
    expect(tarefa!.status).toBe("planejada");
    expect(tarefa!.prioridade).toBe("alta");
    expect(tarefa!.organizationId).toBe(a.organizationId);
    expect(tarefa!.propriedadeId).toBe(a.propriedadeId);
  });

  it("atualizar evento espelha metadados sem bypassar status da tarefa", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      tipoAtividade: "monitoramento",
      titulo: "Antes do update",
      dataProgramada: new Date().toISOString(),
      status: "pendente",
    });
    const before = await a.caller.coreData.tarefas.getByEvento({ eventoId });
    expect(before?.status).toBe("planejada");

    await a.caller.coreData.calendario.update({
      id: eventoId,
      data: { titulo: "Depois do update", status: "em_andamento" },
    });

    const after = await a.caller.coreData.tarefas.getByEvento({ eventoId });
    expect(after?.id).toBe(before?.id);
    expect(after?.titulo).toBe("Depois do update");
    // Status operacional só muda via tarefas.transition (não write cru do calendário).
    expect(after?.status).toBe("planejada");
  });

  it("transição da tarefa espelha status no evento", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      tipoAtividade: "irrigacao",
      titulo: "Espelho inverso",
      dataProgramada: new Date().toISOString(),
      status: "pendente",
    });
    const tarefa = await a.caller.coreData.tarefas.getByEvento({ eventoId });
    expect(tarefa).not.toBeNull();

    await a.caller.coreData.tarefas.transition({
      id: tarefa!.id,
      status: "em_execucao",
    });

    const eventos = await a.caller.coreData.calendario.list({
      propriedadeId: a.propriedadeId,
    });
    const evento = eventos.find((e) => e.id === eventoId);
    expect(evento?.status).toBe("em_andamento");
  });

  it("promoteFromEvento liga tarefaId na operação e backfill em re-promote", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      tipoAtividade: "inspecao",
      titulo: "Promover com tarefa",
      dataProgramada: new Date().toISOString(),
      status: "pendente",
    });
    const tarefa = await a.caller.coreData.tarefas.getByEvento({ eventoId });
    expect(tarefa?.tipoOperacao).toBe("vistoria");

    const first = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    const op = await a.caller.coreData.operacoes.get({ id: first.operacaoId });
    expect(op.eventoOrigemId).toBe(eventoId);
    expect(op.tarefaId).toBe(tarefa!.id);

    // Simula promoção pré-WP-02 (tarefaId nulo) e confirma re-promote preenche o vínculo.
    const { getDb } = await import("../server/db");
    const { operacoesAgricolas } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    expect(db).toBeTruthy();
    await db!
      .update(operacoesAgricolas)
      .set({ tarefaId: null })
      .where(eq(operacoesAgricolas.id, first.operacaoId));

    const second = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    expect(second.alreadyExisted).toBe(true);
    expect(second.operacaoId).toBe(first.operacaoId);
    const opRelinked = await a.caller.coreData.operacoes.get({ id: second.operacaoId });
    expect(opRelinked.tarefaId).toBe(tarefa!.id);
  });

  it("isolamento tenant: getByEvento nega cross-tenant", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      tipoAtividade: "adubacao",
      titulo: "Tenant A only",
      dataProgramada: new Date().toISOString(),
    });
    await expectTenantDenied(b.caller.coreData.tarefas.getByEvento({ eventoId }));
  });

  it("evento sem propriedade não cria tarefa", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      tipoAtividade: "outro",
      titulo: "Só agenda",
      dataProgramada: new Date().toISOString(),
    });
    const tarefa = await a.caller.coreData.tarefas.getByEvento({ eventoId });
    expect(tarefa).toBeNull();
  });
});
