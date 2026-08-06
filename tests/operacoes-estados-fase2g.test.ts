/**
 * FASE 2G — máquina de estados, transições server-side e auditoria.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
  assertOperacaoAgricolaTransition,
  canTransitionOperacaoAgricola,
  listOperacaoTransitionActions,
  operacaoTransitionRequiredPermission,
  OPERACAO_AGRICOLA_STATUS,
} from "../lib/operacoes/operacao-agricola-status";
import { roleHasPermission } from "../lib/security/org-roles";
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

async function createOp(fixture: TenantFixture, titulo = "Op 2G") {
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
  toStatus: (typeof OPERACAO_AGRICOLA_STATUS)[number],
  extra?: { motivo?: string; clientMutationId?: string; expectedRevision?: number },
) {
  const op = await fixture.caller.coreData.operacoes.get({ id: operacaoId });
  return fixture.caller.coreData.operacoes.transitionStatus({
    operacaoId,
    toStatus,
    expectedStatus: op.status as (typeof OPERACAO_AGRICOLA_STATUS)[number],
    expectedRevision: op.statusRevision ?? extra?.expectedRevision ?? 0,
    ...extra,
  });
}

describe("FASE 2G — domínio de status (unit)", () => {
  it("matriz — transições válidas principais", () => {
    expect(canTransitionOperacaoAgricola("planejada", "liberada")).toBe(true);
    expect(canTransitionOperacaoAgricola("liberada", "em_execucao")).toBe(true);
    expect(canTransitionOperacaoAgricola("em_execucao", "pausada")).toBe(true);
    expect(canTransitionOperacaoAgricola("pausada", "em_execucao")).toBe(true);
    expect(canTransitionOperacaoAgricola("em_execucao", "concluida")).toBe(true);
    expect(canTransitionOperacaoAgricola("concluida", "aprovada")).toBe(true);
    expect(canTransitionOperacaoAgricola("concluida", "reaberta")).toBe(true);
    expect(canTransitionOperacaoAgricola("reaberta", "liberada")).toBe(true);
  });

  it("matriz — transições inválidas e terminais", () => {
    expect(canTransitionOperacaoAgricola("planejada", "concluida")).toBe(false);
    expect(canTransitionOperacaoAgricola("aprovada", "planejada")).toBe(false);
    expect(canTransitionOperacaoAgricola("cancelada", "planejada")).toBe(false);
    expect(() => assertOperacaoAgricolaTransition("aprovada", "cancelada")).toThrow(
      /INVALID_OPERATION_TRANSITION/,
    );
  });

  it("bloqueada — desbloqueio só para statusBeforeBlocked", () => {
    expect(
      canTransitionOperacaoAgricola("bloqueada", "em_execucao", {
        statusBeforeBlocked: "em_execucao",
      }),
    ).toBe(true);
    expect(
      canTransitionOperacaoAgricola("bloqueada", "liberada", {
        statusBeforeBlocked: "em_execucao",
      }),
    ).toBe(false);
  });

  it("RBAC — approve exigido para aprovar/reabrir", () => {
    expect(operacaoTransitionRequiredPermission("aprovada")).toBe("operations.approve");
    expect(operacaoTransitionRequiredPermission("reaberta")).toBe("operations.approve");
    expect(operacaoTransitionRequiredPermission("em_execucao")).toBe("operations.write");
    expect(roleHasPermission("operador", "operations.approve")).toBe(false);
    expect(roleHasPermission("proprietario", "operations.approve")).toBe(true);
  });

  it("UI — lista ações coerentes com estado planejada", () => {
    const actions = listOperacaoTransitionActions("planejada");
    expect(actions.map((a) => a.toStatus).sort()).toEqual(["bloqueada", "cancelada", "liberada"]);
  });
});

describe.skipIf(!hasDb)("FASE 2G — transições server-side", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_fase2g";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("fluxo principal até aprovada", async () => {
    const id = await createOp(a);
    await transition(a, id, "liberada");
    await transition(a, id, "em_execucao");
    await transition(a, id, "concluida");
    await transition(a, id, "aprovada");
    const op = await a.caller.coreData.operacoes.get({ id });
    expect(op.status).toBe("aprovada");
    const hist = await a.caller.coreData.operacoes.listStatusHistorico({ operacaoId: id });
    expect(hist.length).toBe(4);
  });

  it("pausar e retomar", async () => {
    const id = await createOp(a, "Pausa");
    await transition(a, id, "liberada");
    await transition(a, id, "em_execucao");
    await transition(a, id, "pausada");
    await transition(a, id, "em_execucao");
    const op = await a.caller.coreData.operacoes.get({ id });
    expect(op.status).toBe("em_execucao");
  });

  it("cancelamento exige motivo", async () => {
    const id = await createOp(a, "Cancel");
    await expect(
      a.caller.coreData.operacoes.transitionStatus({
        operacaoId: id,
        toStatus: "cancelada",
        expectedStatus: "planejada",
        expectedRevision: 0,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await transition(a, id, "cancelada", { motivo: "Chuva" });
    const hist = await a.caller.coreData.operacoes.listStatusHistorico({ operacaoId: id });
    expect(hist[0]?.motivo).toBe("Chuva");
  });

  it("operador não aprova", async () => {
    await setOrgRole(a, "operador");
    const id = await createOp(a, "NoApprove");
    await transition(a, id, "liberada");
    await transition(a, id, "em_execucao");
    await transition(a, id, "concluida");
    await expect(transition(a, id, "aprovada")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await setOrgRole(a, "proprietario");
  });

  it("auditor não transiciona (sem write)", async () => {
    const id = await createOp(a, "Auditor");
    await setOrgRole(a, "auditor");
    await expect(
      a.caller.coreData.operacoes.transitionStatus({
        operacaoId: id,
        toStatus: "liberada",
        expectedStatus: "planejada",
        expectedRevision: 0,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await setOrgRole(a, "proprietario");
  });

  it("cross-tenant negado no histórico", async () => {
    const id = await createOp(a);
    await expectTenantDenied(
      b.caller.coreData.operacoes.listStatusHistorico({ operacaoId: id }),
    );
  });

  it("idempotência clientMutationId", async () => {
    const id = await createOp(a, "Idem");
    const mid = `idem-${id}-${Date.now()}`;
    const r1 = await transition(a, id, "liberada", { clientMutationId: mid });
    const r2 = await transition(a, id, "liberada", { clientMutationId: mid });
    expect(r1.idempotentReplay).toBe(false);
    expect(r2.idempotentReplay).toBe(true);
    const hist = await a.caller.coreData.operacoes.listStatusHistorico({ operacaoId: id });
    expect(hist.filter((h) => h.toStatus === "liberada")).toHaveLength(1);
  });

  it("promoteFromEvento permanece planejada", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoAtividade: "inspecao",
      titulo: "Ev 2G",
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

  it("safra encerrada nega transição", async () => {
    const { createSafra } = await import("../server/db-safras");
    const safraId = await createSafra({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: `Safra 2G encerrada ${Date.now()}`,
      status: "encerrada",
      isDefault: false,
    });
    const id = await a.caller.coreData.operacoes.create({
      propriedadeId: a.propriedadeId,
      safraId,
      tipoOperacao: "monitoramento",
      titulo: "Op safra fechada",
      dataPrevista: new Date().toISOString(),
    });
    await expect(transition(a, id, "liberada")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
