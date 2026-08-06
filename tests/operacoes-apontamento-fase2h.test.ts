/**
 * FASE 2H — apontamento real de execução (domínio/API).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
  assertApontamentoHorarios,
  canCreateApontamentoForStatus,
  canEditApontamentoForStatus,
  isApontamentoReadOnlyStatus,
  isMinimalValidApontamento,
} from "../lib/operacoes/operacao-apontamento-rules";
import { canTransitionOperacaoAgricola } from "../lib/operacoes/operacao-agricola-status";
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

async function createOp(fixture: TenantFixture, titulo = "Op 2H") {
  return fixture.caller.coreData.operacoes.create({
    propriedadeId: fixture.propriedadeId,
    terrenoId: fixture.terrenoId,
    tipoOperacao: "monitoramento",
    titulo: `${titulo} ${Date.now()}`,
    dataPrevista: new Date().toISOString(),
  });
}

async function transition(
  fixture: TenantFixture,
  operacaoId: number,
  toStatus: "liberada" | "em_execucao" | "pausada" | "concluida" | "aprovada" | "cancelada" | "bloqueada" | "reaberta",
  extra?: { motivo?: string },
) {
  const op = await fixture.caller.coreData.operacoes.get({ id: operacaoId });
  return fixture.caller.coreData.operacoes.transitionStatus({
    operacaoId,
    toStatus,
    expectedStatus: op.status as typeof toStatus,
    expectedRevision: op.statusRevision ?? 0,
    ...extra,
  });
}

async function toEmExecucao(fixture: TenantFixture, operacaoId: number) {
  await transition(fixture, operacaoId, "liberada");
  await transition(fixture, operacaoId, "em_execucao");
}

function minimalPayload(operacaoId: number, suffix = "") {
  // Segundos inteiros (UTC) evitam flutuação de ms / TZ no replay idempotente.
  const inicio = new Date("2026-06-15T12:00:00.000Z");
  const fim = new Date("2026-06-15T13:00:00.000Z");
  return {
    operacaoId,
    inicioReal: inicio.toISOString(),
    fimReal: fim.toISOString(),
    areaExecutada: 2.5,
    areaUnidade: "ha",
    equipeTexto: "Equipe A",
    clientMutationId: `2h-${operacaoId}-${Date.now()}${suffix}`,
  };
}

describe("FASE 2H — regras de domínio (unit)", () => {
  it("status — create/edit/read-only", () => {
    expect(canCreateApontamentoForStatus("em_execucao")).toBe(true);
    expect(canCreateApontamentoForStatus("pausada")).toBe(true);
    expect(canCreateApontamentoForStatus("reaberta")).toBe(true);
    expect(canCreateApontamentoForStatus("planejada")).toBe(false);
    expect(canCreateApontamentoForStatus("aprovada")).toBe(false);
    expect(canEditApontamentoForStatus("concluida")).toBe(true);
    expect(canEditApontamentoForStatus("aprovada")).toBe(false);
    expect(isApontamentoReadOnlyStatus("aprovada")).toBe(true);
    expect(isApontamentoReadOnlyStatus("bloqueada")).toBe(true);
  });

  it("mínimo válido e horários", () => {
    expect(
      isMinimalValidApontamento({
        inicioReal: new Date(),
        createdByUserId: 1,
      }),
    ).toBe(true);
    expect(
      isMinimalValidApontamento({
        inicioReal: null,
        createdByUserId: 1,
      }),
    ).toBe(false);
    const a = new Date("2026-01-01T10:00:00Z");
    const b = new Date("2026-01-01T09:00:00Z");
    expect(() => assertApontamentoHorarios(a, b)).toThrow(/INVALID_APONTAMENTO_HORARIO/);
  });

  it("2G — matriz continua rejeitando transição proibida", () => {
    expect(canTransitionOperacaoAgricola("planejada", "concluida")).toBe(false);
    expect(canTransitionOperacaoAgricola("aprovada", "em_execucao")).toBe(false);
  });
});

describe.skipIf(!hasDb)("FASE 2H — apontamentos server-side", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_fase2h";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("1 — criar apontamento em operação autorizada", async () => {
    const id = await createOp(a, "Create");
    await toEmExecucao(a, id);
    const r = await a.caller.coreData.operacoes.createApontamento(minimalPayload(id));
    expect(r.apontamentoId).toBeGreaterThan(0);
    expect(r.idempotentReplay).toBe(false);
    const list = await a.caller.coreData.operacoes.listApontamentos({ operacaoId: id });
    expect(list).toHaveLength(1);
    expect(Number(list[0].areaExecutada)).toBe(2.5);
  });

  it("2 — listar/obter apenas no tenant correto", async () => {
    const id = await createOp(a, "TenantList");
    await toEmExecucao(a, id);
    const r = await a.caller.coreData.operacoes.createApontamento(minimalPayload(id));
    const got = await a.caller.coreData.operacoes.getApontamento({ id: r.apontamentoId });
    expect(got.id).toBe(r.apontamentoId);
    await expectTenantDenied(
      b.caller.coreData.operacoes.listApontamentos({ operacaoId: id }),
    );
    await expectTenantDenied(
      b.caller.coreData.operacoes.getApontamento({ id: r.apontamentoId }),
    );
  });

  it("3 — editar com permissão", async () => {
    const id = await createOp(a, "Edit");
    await toEmExecucao(a, id);
    const r = await a.caller.coreData.operacoes.createApontamento(minimalPayload(id));
    const upd = await a.caller.coreData.operacoes.updateApontamento({
      apontamentoId: r.apontamentoId,
      expectedRevision: 0,
      areaExecutada: 3.1,
      areaUnidade: "ha",
      observacoes: "Ajuste de área",
    });
    expect(upd.revision).toBe(1);
    const got = await a.caller.coreData.operacoes.getApontamento({ id: r.apontamentoId });
    expect(Number(got.areaExecutada)).toBe(3.1);
    expect(got.observacoes).toBe("Ajuste de área");
  });

  it("4 — usuário somente leitura não grava", async () => {
    const id = await createOp(a, "RO");
    await toEmExecucao(a, id);
    await setOrgRole(a, "auditor");
    await expect(
      a.caller.coreData.operacoes.createApontamento(minimalPayload(id)),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await setOrgRole(a, "proprietario");
  });

  it("5 — cross-tenant negado", async () => {
    const id = await createOp(a, "XT");
    await toEmExecucao(a, id);
    await expectTenantDenied(
      b.caller.coreData.operacoes.createApontamento(minimalPayload(id)),
    );
  });

  it("6 — outra propriedade/safra negada via operação inexistente no tenant", async () => {
    const idB = await createOp(b, "OtherProp");
    await toEmExecucao(b, idB);
    await expectTenantDenied(
      a.caller.coreData.operacoes.createApontamento(minimalPayload(idB)),
    );
  });

  it("7 — safra encerrada/arquivada é negada", async () => {
    const { createSafra } = await import("../server/db-safras");
    const { getDb } = await import("../server/db");
    const { safras } = await import("../drizzle/schema");
    const safraId = await createSafra({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: `Safra 2H encerrada ${Date.now()}`,
      status: "ativa",
      isDefault: false,
    });
    const id = await a.caller.coreData.operacoes.create({
      propriedadeId: a.propriedadeId,
      safraId,
      tipoOperacao: "monitoramento",
      titulo: "Op safra 2H",
      dataPrevista: new Date().toISOString(),
    });
    await toEmExecucao(a, id);
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(safras).set({ status: "encerrada" }).where(eq(safras.id, safraId));
    await expect(
      a.caller.coreData.operacoes.createApontamento(minimalPayload(id)),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("8 — operação aprovada é imutável", async () => {
    const id = await createOp(a, "Approved");
    await toEmExecucao(a, id);
    const r = await a.caller.coreData.operacoes.createApontamento(minimalPayload(id));
    await transition(a, id, "concluida");
    await transition(a, id, "aprovada");
    await expect(
      a.caller.coreData.operacoes.updateApontamento({
        apontamentoId: r.apontamentoId,
        expectedRevision: 0,
        observacoes: "não deve",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      a.caller.coreData.operacoes.createApontamento(minimalPayload(id, "-x")),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("9 — cancelada/bloqueada não recebe nova execução", async () => {
    const idCancel = await createOp(a, "Cancel");
    await transition(a, idCancel, "cancelada", { motivo: "Abort" });
    await expect(
      a.caller.coreData.operacoes.createApontamento(minimalPayload(idCancel)),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const idBlock = await createOp(a, "Block");
    await toEmExecucao(a, idBlock);
    await transition(a, idBlock, "bloqueada", { motivo: "Chuva" });
    await expect(
      a.caller.coreData.operacoes.createApontamento(minimalPayload(idBlock)),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("10 — horários inválidos rejeitados", async () => {
    const id = await createOp(a, "Horario");
    await toEmExecucao(a, id);
    const inicio = new Date();
    const fim = new Date(inicio.getTime() - 60_000);
    await expect(
      a.caller.coreData.operacoes.createApontamento({
        operacaoId: id,
        inicioReal: inicio.toISOString(),
        fimReal: fim.toISOString(),
        clientMutationId: `bad-hora-${id}`,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("11 — quantidades/unidades inválidas rejeitadas", async () => {
    const id = await createOp(a, "Insumo");
    await toEmExecucao(a, id);
    await expect(
      a.caller.coreData.operacoes.createApontamento({
        ...minimalPayload(id),
        insumos: [{ descricao: "Ureia", quantidade: 0, unidade: "kg" }],
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("12 — conflito de revisão não sobrescreve", async () => {
    const id = await createOp(a, "Rev");
    await toEmExecucao(a, id);
    const r = await a.caller.coreData.operacoes.createApontamento(minimalPayload(id));
    await a.caller.coreData.operacoes.updateApontamento({
      apontamentoId: r.apontamentoId,
      expectedRevision: 0,
      observacoes: "v1",
    });
    await expect(
      a.caller.coreData.operacoes.updateApontamento({
        apontamentoId: r.apontamentoId,
        expectedRevision: 0,
        observacoes: "stale",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const got = await a.caller.coreData.operacoes.getApontamento({ id: r.apontamentoId });
    expect(got.observacoes).toBe("v1");
  });

  it("13 — replay idempotente não duplica", async () => {
    const id = await createOp(a, "Idem");
    await toEmExecucao(a, id);
    const payload = minimalPayload(id);
    const r1 = await a.caller.coreData.operacoes.createApontamento(payload);
    const r2 = await a.caller.coreData.operacoes.createApontamento(payload);
    expect(r1.idempotentReplay).toBe(false);
    expect(r2.idempotentReplay).toBe(true);
    expect(r2.apontamentoId).toBe(r1.apontamentoId);
    const list = await a.caller.coreData.operacoes.listApontamentos({ operacaoId: id });
    expect(list).toHaveLength(1);
  });

  it("14 — replay incompatível gera CONFLICT", async () => {
    const id = await createOp(a, "IdemConflict");
    await toEmExecucao(a, id);
    const mid = `conflict-${id}-${Date.now()}`;
    const inicio = new Date();
    await a.caller.coreData.operacoes.createApontamento({
      operacaoId: id,
      inicioReal: inicio.toISOString(),
      clientMutationId: mid,
    });
    await expect(
      a.caller.coreData.operacoes.createApontamento({
        operacaoId: id,
        inicioReal: new Date(inicio.getTime() + 10_000).toISOString(),
        clientMutationId: mid,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("14b — replay com área divergente gera CONFLICT", async () => {
    const id = await createOp(a, "IdemArea");
    await toEmExecucao(a, id);
    const mid = `area-${id}-${Date.now()}`;
    const inicio = new Date();
    await a.caller.coreData.operacoes.createApontamento({
      operacaoId: id,
      inicioReal: inicio.toISOString(),
      areaExecutada: 1,
      areaUnidade: "ha",
      clientMutationId: mid,
    });
    await expect(
      a.caller.coreData.operacoes.createApontamento({
        operacaoId: id,
        inicioReal: inicio.toISOString(),
        areaExecutada: 9,
        areaUnidade: "ha",
        clientMutationId: mid,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("15 — transição concluida sem apontamento mínimo é negada", async () => {
    const id = await createOp(a, "NoApt");
    await toEmExecucao(a, id);
    await expect(transition(a, id, "concluida")).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("16 — transição concluida com apontamento válido funciona", async () => {
    const id = await createOp(a, "WithApt");
    await toEmExecucao(a, id);
    await a.caller.coreData.operacoes.createApontamento(minimalPayload(id));
    await transition(a, id, "concluida");
    const op = await a.caller.coreData.operacoes.get({ id });
    expect(op.status).toBe("concluida");
  });

  it("17 — operação histórica concluída antes da 2H continua consultável sem backfill", async () => {
    const { getDb } = await import("../server/db");
    const { operacoesAgricolas, operacoesAgricolasApontamentos } = await import(
      "../drizzle/schema"
    );
    const id = await createOp(a, "Legacy");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    // Simula operação já concluída sem apontamento 2H (pré-regra / legado).
    await db
      .update(operacoesAgricolas)
      .set({ status: "concluida", statusRevision: 3 })
      .where(eq(operacoesAgricolas.id, id));
    const op = await a.caller.coreData.operacoes.get({ id });
    expect(op.status).toBe("concluida");
    const list = await a.caller.coreData.operacoes.listApontamentos({ operacaoId: id });
    expect(list).toHaveLength(0);
    const count = await db
      .select()
      .from(operacoesAgricolasApontamentos)
      .where(eq(operacoesAgricolasApontamentos.operacaoAgricolaId, id));
    expect(count).toHaveLength(0);
  });

  it("18 — promoteFromEvento continua idempotente e planejada", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoAtividade: "inspecao",
      titulo: "Ev 2H",
      dataProgramada: new Date().toISOString(),
      status: "pendente",
    });
    const p1 = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    const p2 = await a.caller.coreData.operacoes.promoteFromEvento({ eventoId });
    expect(p2.alreadyExisted).toBe(true);
    expect(p1.operacaoId).toBe(p2.operacaoId);
    const op = await a.caller.coreData.operacoes.get({ id: p1.operacaoId });
    expect(op.status).toBe("planejada");
  });

  it("19 — state machine 2G rejeita transição proibida", async () => {
    const id = await createOp(a, "InvalidTx");
    await expect(
      a.caller.coreData.operacoes.transitionStatus({
        operacaoId: id,
        toStatus: "concluida",
        expectedStatus: "planejada",
        expectedRevision: 0,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("insumo apontado NÃO altera saldo de estoque", async () => {
    const { getDb } = await import("../server/db");
    const { estoqueItens } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const inserted = await db.insert(estoqueItens).values({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: `Ureia 2H ${Date.now()}`,
      categoria: "fertilizante",
      unidadeBase: "kg",
      saldo: "100.000",
      createdByUserId: a.userId,
    });
    const itemId = inserted[0].insertId;
    const before = await db.select().from(estoqueItens).where(eq(estoqueItens.id, itemId)).limit(1);
    const saldoBefore = before[0]?.saldo;

    const id = await createOp(a, "NoStock");
    await toEmExecucao(a, id);
    await a.caller.coreData.operacoes.createApontamento({
      ...minimalPayload(id),
      insumos: [{ estoqueItemId: itemId, quantidade: 12, unidade: "kg" }],
    });

    const after = await db.select().from(estoqueItens).where(eq(estoqueItens.id, itemId)).limit(1);
    expect(after[0]?.saldo).toBe(saldoBefore);

    const resumo = await a.caller.coreData.operacoes.planejadoRealizado({ operacaoId: id });
    expect(resumo.realizado.insumos.length).toBe(1);
    expect(resumo.planejado.dataPrevista).toBeTruthy();
  });

  it("N apontamentos por operação + Planejado×Realizado não altera planejado", async () => {
    const id = await createOp(a, "Multi");
    await toEmExecucao(a, id);
    const opBefore = await a.caller.coreData.operacoes.get({ id });
    await a.caller.coreData.operacoes.createApontamento({
      ...minimalPayload(id, "-a"),
      areaExecutada: 1,
    });
    await a.caller.coreData.operacoes.createApontamento({
      ...minimalPayload(id, "-b"),
      areaExecutada: 1.5,
    });
    const list = await a.caller.coreData.operacoes.listApontamentos({ operacaoId: id });
    expect(list).toHaveLength(2);
    const opAfter = await a.caller.coreData.operacoes.get({ id });
    expect(opAfter.titulo).toBe(opBefore.titulo);
    expect(opAfter.dataPrevista).toEqual(opBefore.dataPrevista);
    expect(opAfter.status).toBe("em_execucao");
    const resumo = await a.caller.coreData.operacoes.planejadoRealizado({ operacaoId: id });
    expect(resumo.realizado.apontamentosCount).toBe(2);
    expect(resumo.realizado.areaExecutadaTotal).toBe(2.5);
  });

  it("planejada não aceita criação de apontamento", async () => {
    const id = await createOp(a, "Planned");
    await expect(
      a.caller.coreData.operacoes.createApontamento(minimalPayload(id)),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
