/**
 * FASE 2E — persistência de operações agrícolas + promoteFromEvento.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
  createIsolatedTenantPair,
  expectTenantDenied,
  type TenantFixture,
} from "./helpers/tenant-fixture";
import type { OrgRole } from "../lib/security/org-roles";

const hasDb = Boolean(process.env.DATABASE_URL);

async function setOrgRole(fixture: TenantFixture, role: OrgRole) {
  const { getDb } = await import("../server/db");
  const { organizationMemberships } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(organizationMemberships)
    .set({ role })
    .where(eq(organizationMemberships.id, fixture.membershipId));
}

async function countApontamentos(): Promise<number> {
  const { getDb } = await import("../server/db");
  const { apontamentosOperacao } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(apontamentosOperacao);
  return rows.length;
}

async function setTarefaDimensions(
  tarefaId: number,
  patch: { safraId?: number | null; terrenoId?: number | null; culturaId?: number | null },
) {
  const { getDb } = await import("../server/db");
  const { tarefasOperacionais } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(tarefasOperacionais).set(patch).where(eq(tarefasOperacionais.id, tarefaId));
}

async function createWritableSafra(fixture: TenantFixture, nome: string) {
  const { createSafra } = await import("../server/db-safras");
  return createSafra({
    organizationId: fixture.organizationId,
    propriedadeId: fixture.propriedadeId,
    nome,
    status: "ativa",
    isDefault: false,
  });
}

async function createEvento(fixture: TenantFixture, overrides?: { status?: string; tipo?: string }) {
  return fixture.caller.coreData.calendario.create({
    propriedadeId: fixture.propriedadeId,
    terrenoId: fixture.terrenoId,
    culturaId: fixture.cultivoId,
    tipoAtividade: (overrides?.tipo ?? "inspecao") as "inspecao",
    titulo: `Evento 2E ${Date.now()}`,
    dataProgramada: new Date().toISOString(),
    status: (overrides?.status as "concluido") ?? "pendente",
  });
}

describe.skipIf(!hasDb)("FASE 2E — operações persistência", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_fase2e";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("1 — criar operação no tenant correto", async () => {
    const id = await a.caller.coreData.operacoes.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      tipoOperacao: "pulverizacao",
      titulo: "Op manual",
      dataPrevista: new Date().toISOString(),
    });
    const op = await a.caller.coreData.operacoes.get({ id });
    expect(op.organizationId).toBe(a.organizationId);
    expect(op.status).toBe("planejada");
  });

  it("2 — negar list/get cross-tenant", async () => {
    const id = await a.caller.coreData.operacoes.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "monitoramento",
      titulo: "Op isolada",
      dataPrevista: new Date().toISOString(),
    });
    await expectTenantDenied(b.caller.coreData.operacoes.get({ id }));
    await expectTenantDenied(
      b.caller.coreData.operacoes.listByPropriedade({ propriedadeId: a.propriedadeId }),
    );
  });

  it("3 — negar safra de outra propriedade", async () => {
    const prop2 = await a.caller.coreData.propriedades.create({
      nome: `Fazenda 2E safra ${Date.now()}`,
      cidade: "T",
      estado: "PR",
      tamanhoArea: 5,
      tipoProducao: "graos",
    });
    const safra2 = await a.caller.coreData.expansao.safras.ensureDefault({ propriedadeId: prop2 });
    await expectTenantDenied(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        safraId: safra2.id,
        tipoOperacao: "adubacao",
        titulo: "Safra errada",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("4 — negar talhão de outra propriedade (mesma org)", async () => {
    const prop2 = await a.caller.coreData.propriedades.create({
      nome: `Fazenda 2E talhao ${Date.now()}`,
      cidade: "T",
      estado: "PR",
      tamanhoArea: 4,
      tipoProducao: "graos",
    });
    const terreno2 = await a.caller.coreData.terrenos.create({
      propriedadeId: prop2,
      nome: "T2",
      area: 1,
    });
    await expectTenantDenied(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        terrenoId: terreno2,
        tipoOperacao: "vistoria",
        titulo: "Talhão errado",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("5 — negar cultivo incompatível com talhão", async () => {
    const outroTalhao = await a.caller.coreData.terrenos.create({
      propriedadeId: a.propriedadeId,
      nome: "Talhão sem cultivo",
      area: 1,
    });
    await expectTenantDenied(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        terrenoId: outroTalhao,
        culturaId: a.cultivoId,
        tipoOperacao: "monitoramento",
        titulo: "Cultivo errado",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("6 — vínculo opcional com tarefa válida", async () => {
    const opId = await a.caller.coreData.operacoes.create({
      propriedadeId: a.propriedadeId,
      tarefaId: a.tarefaId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoOperacao: "manutencao",
      titulo: "Op com tarefa",
      dataPrevista: new Date().toISOString(),
    });
    const op = await a.caller.coreData.operacoes.get({ id: opId });
    expect(op.tarefaId).toBe(a.tarefaId);
  });

  it("6A — safra encerrada na tarefa bloqueia create sem safraId no payload", async () => {
    const { createSafra } = await import("../server/db-safras");
    const histId = await createSafra({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: "Safra 2E encerrada tarefa",
      status: "encerrada",
      isDefault: false,
    });
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoOperacao: "monitoramento",
      titulo: "Tarefa para lock safra",
      dataPrevista: new Date().toISOString(),
    });
    await setTarefaDimensions(tarefaId, { safraId: histId });
    await expect(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        tarefaId,
        tipoOperacao: "monitoramento",
        titulo: "Bypass safra via tarefa",
        dataPrevista: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("6B — safra da tarefa incompatível com payload.safraId", async () => {
    const safraTarefa = await createWritableSafra(a, `Safra tarefa ${Date.now()}`);
    const safraPayload = await createWritableSafra(a, `Safra payload ${Date.now()}`);
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      safraId: safraTarefa,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoOperacao: "adubacao",
      titulo: "Tarefa safra A",
      dataPrevista: new Date().toISOString(),
    });
    await expectTenantDenied(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        tarefaId,
        safraId: safraPayload,
        tipoOperacao: "adubacao",
        titulo: "Safra conflito",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("6C — terreno da tarefa incompatível com payload.terrenoId", async () => {
    const outroTalhao = await a.caller.coreData.terrenos.create({
      propriedadeId: a.propriedadeId,
      nome: "Talhão op conflito",
      area: 1,
    });
    await expectTenantDenied(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        tarefaId: a.tarefaId,
        terrenoId: outroTalhao,
        tipoOperacao: "vistoria",
        titulo: "Terreno conflito",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("6D — cultura da tarefa incompatível com payload.culturaId", async () => {
    const outroTalhao = await a.caller.coreData.terrenos.create({
      propriedadeId: a.propriedadeId,
      nome: "Talhão cultivo isolado",
      area: 1,
    });
    const outroCultivo = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: outroTalhao,
      nomeCultura: "Cultivo outro talhão",
      status: "em_andamento",
      areaPlantada: 1,
    });
    await expectTenantDenied(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        tarefaId: a.tarefaId,
        culturaId: outroCultivo,
        tipoOperacao: "monitoramento",
        titulo: "Cultura conflito",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("6F — herda dimensões da tarefa quando omitidas no payload", async () => {
    const safraId = await createWritableSafra(a, `Safra herança ${Date.now()}`);
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      safraId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoOperacao: "irrigacao",
      titulo: "Tarefa herança dims",
      dataPrevista: new Date().toISOString(),
    });
    const opId = await a.caller.coreData.operacoes.create({
      propriedadeId: a.propriedadeId,
      tarefaId,
      tipoOperacao: "irrigacao",
      titulo: "Op herda contexto",
      dataPrevista: new Date().toISOString(),
    });
    const op = await a.caller.coreData.operacoes.get({ id: opId });
    expect(op.safraId).toBe(safraId);
    expect(op.terrenoId).toBe(a.terrenoId);
    expect(op.culturaId).toBe(a.cultivoId);
  });

  it("7–12 — promoteFromEvento", async () => {
    const apontBefore = await countApontamentos();
    const eventoId = await createEvento(a, { tipo: "laboratorio" });

    const first = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    expect(first.alreadyExisted).toBe(false);
    const op = await a.caller.coreData.operacoes.get({ id: first.operacaoId });
    expect(op.status).toBe("planejada");
    expect(op.origem).toBe("evento_calendario");
    expect(op.eventoOrigemId).toBe(eventoId);
    expect(op.tipoOperacao).toBe("laboratorio");

    const second = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    expect(second.alreadyExisted).toBe(true);
    expect(second.operacaoId).toBe(first.operacaoId);

    const lista = await a.caller.coreData.calendario.list({
      propriedadeId: a.propriedadeId,
    });
    expect(lista.some((e) => e.id === eventoId)).toBe(true);

    const apontAfter = await countApontamentos();
    expect(apontAfter).toBe(apontBefore);
  });

  it("8 — negar promote evento cross-tenant", async () => {
    const eventoId = await createEvento(b);
    await expectTenantDenied(
      a.caller.coreData.operacoes.promoteFromEvento({ eventoId }),
    );
  });

  it("9 — evento concluído não marca operação executada", async () => {
    const eventoId = await createEvento(a, { status: "concluido", tipo: "analise" });
    const { operacaoId } = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    const op = await a.caller.coreData.operacoes.get({ id: operacaoId });
    expect(op.status).toBe("planejada");
    expect(op.tipoOperacao).toBe("analise");
  });

  it("10 — inspecao no evento vira vistoria canônica na operação", async () => {
    const eventoId = await createEvento(a, { tipo: "inspecao" });
    const { operacaoId } = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    const op = await a.caller.coreData.operacoes.get({ id: operacaoId });
    expect(op.tipoOperacao).toBe("vistoria");
    expect(op.tipoAtividadeLegado).toBe("inspecao");
  });

  it("11 — safra encerrada bloqueia create", async () => {
    const { createSafra } = await import("../server/db-safras");
    const histId = await createSafra({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: "Safra 2E encerrada",
      status: "encerrada",
      isDefault: false,
    });
    await expect(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        safraId: histId,
        tipoOperacao: "monitoramento",
        titulo: "Bloqueado",
        dataPrevista: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("12 — auditor sem operations.write não cria operação", async () => {
    await setOrgRole(a, "auditor");
    await expect(
      a.caller.coreData.operacoes.create({
        propriedadeId: a.propriedadeId,
        tipoOperacao: "outro",
        titulo: "Sem permissão",
        dataPrevista: new Date().toISOString(),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await setOrgRole(a, "proprietario");
  });

  it("13 — auditor sem operations.write não promove evento", async () => {
    const eventoId = await createEvento(a);
    await setOrgRole(a, "auditor");
    await expect(
      a.caller.coreData.operacoes.promoteFromEvento({ eventoId }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await setOrgRole(a, "proprietario");
  });
});
