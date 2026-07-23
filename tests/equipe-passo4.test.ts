/**
 * Etapa 8 Passo 4 — equipes: listagem via memberships + alocação em tarefas.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 8 Passo 4 — equipes", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_equipe_p4";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("lista equipe da organização com papelEquipe", async () => {
    const equipe = await a.caller.coreData.expansao.equipe.list();
    expect(equipe.length).toBeGreaterThanOrEqual(1);
    expect(equipe.some((m) => m.userId === a.userId)).toBe(true);
    expect(equipe[0]?.papelEquipe).toBeTruthy();
  });

  it("aloca membro na tarefa e lista alocações", async () => {
    const id = await a.caller.coreData.tarefas.alocacoes.upsert({
      tarefaId: a.tarefaId,
      userId: a.userId,
      papelEquipe: "operador",
      horasPlanejadas: 4,
    });
    expect(id).toBeGreaterThan(0);
    const list = await a.caller.coreData.tarefas.alocacoes.list({ tarefaId: a.tarefaId });
    expect(list.some((x) => x.userId === a.userId && x.papelEquipe === "operador")).toBe(true);

    // upsert idempotente
    const id2 = await a.caller.coreData.tarefas.alocacoes.upsert({
      tarefaId: a.tarefaId,
      userId: a.userId,
      papelEquipe: "agronomo",
      horasPlanejadas: 6,
    });
    expect(id2).toBe(id);
    const list2 = await a.caller.coreData.tarefas.alocacoes.list({ tarefaId: a.tarefaId });
    expect(list2.find((x) => x.userId === a.userId)?.papelEquipe).toBe("agronomo");
  });

  it("bloqueia alocar usuário de outro tenant", async () => {
    await expect(
      a.caller.coreData.tarefas.alocacoes.upsert({
        tarefaId: a.tarefaId,
        userId: b.userId,
        papelEquipe: "tecnico",
      }),
    ).rejects.toThrow();
  });

  it("responsavelUserId existente continua válido (não remove função)", async () => {
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "monitoramento",
      titulo: "Com responsável",
      dataPrevista: new Date().toISOString(),
      responsavelUserId: a.userId,
    });
    expect(tarefaId).toBeGreaterThan(0);
  });
});
