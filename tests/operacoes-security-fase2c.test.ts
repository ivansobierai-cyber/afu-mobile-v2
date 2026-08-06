/**
 * FASE 2C — hardening de segurança operacional (tarefas, apontamentos, eventos).
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

async function advanceToConcluida(fixture: TenantFixture, tarefaId: number) {
  await fixture.caller.coreData.tarefas.transition({ id: tarefaId, status: "em_execucao" });
  await fixture.caller.coreData.tarefas.transition({ id: tarefaId, status: "concluida" });
}

describe.skipIf(!hasDb)("FASE 2C — operações segurança", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_fase2c";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("1 — get tarefa cross-tenant → NOT_FOUND", async () => {
    await expectTenantDenied(a.caller.coreData.tarefas.get({ id: b.tarefaId }));
  });

  it("2 — list tarefas por propriedade de outro tenant → NOT_FOUND", async () => {
    await expectTenantDenied(
      a.caller.coreData.tarefas.listByPropriedade({ propriedadeId: b.propriedadeId }),
    );
  });

  it("3 — transition cross-tenant → NOT_FOUND", async () => {
    await expectTenantDenied(
      a.caller.coreData.tarefas.transition({
        id: b.tarefaId,
        status: "em_execucao",
      }),
    );
  });

  it("4 — apontamentos cross-tenant → NOT_FOUND", async () => {
    await expectTenantDenied(
      a.caller.coreData.tarefas.apontamentos({ tarefaId: b.tarefaId }),
    );
  });

  it("5 — operador sem operations.approve não pode aprovar tarefa", async () => {
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "monitoramento",
      titulo: `Aprovação negada ${Date.now()}`,
      dataPrevista: new Date().toISOString(),
    });
    await advanceToConcluida(a, tarefaId);
    await setOrgRole(a, "operador");
    await expect(
      a.caller.coreData.tarefas.transition({ id: tarefaId, status: "aprovada" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("operations.approve"),
    });
    await setOrgRole(a, "proprietario");
  });

  it("6 — proprietário com operations.approve pode aprovar", async () => {
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "monitoramento",
      titulo: `Aprovação ok ${Date.now()}`,
      dataPrevista: new Date().toISOString(),
    });
    await advanceToConcluida(a, tarefaId);
    await a.caller.coreData.tarefas.transition({ id: tarefaId, status: "aprovada" });
    const { tarefa } = await a.caller.coreData.tarefas.get({ id: tarefaId });
    expect(tarefa.status).toBe("aprovada");
  });

  it("7 — responsável que não pertence à organização (tarefa e evento)", async () => {
    await expectTenantDenied(
      a.caller.coreData.tarefas.create({
        propriedadeId: a.propriedadeId,
        responsavelUserId: b.userId,
        tipoOperacao: "monitoramento",
        titulo: "Resp inválido tarefa",
        dataPrevista: new Date().toISOString(),
      }),
    );

    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      tipoAtividade: "monitoramento",
      titulo: "Evento base",
      dataProgramada: new Date().toISOString(),
    });
    await expectTenantDenied(
      a.caller.coreData.calendario.update({
        id: eventoId,
        data: { responsavelUserId: b.userId },
      }),
    );
  });

  it("8 — safra de outra propriedade (mesma org) negada na criação", async () => {
    const prop2 = await a.caller.coreData.propriedades.create({
      nome: `Fazenda 2C ${Date.now()}`,
      cidade: "Teste",
      estado: "PR",
      tamanhoArea: 8,
      tipoProducao: "graos",
    });
    const safra2 = await a.caller.coreData.expansao.safras.ensureDefault({
      propriedadeId: prop2,
    });
    await expectTenantDenied(
      a.caller.coreData.tarefas.create({
        propriedadeId: a.propriedadeId,
        safraId: safra2.id,
        tipoOperacao: "adubacao",
        titulo: "Safra errada",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("9 — talhão de outra propriedade (mesma org) negado", async () => {
    const prop2 = await a.caller.coreData.propriedades.create({
      nome: `Fazenda talhão 2C ${Date.now()}`,
      cidade: "Teste",
      estado: "PR",
      tamanhoArea: 6,
      tipoProducao: "graos",
    });
    const terreno2 = await a.caller.coreData.terrenos.create({
      propriedadeId: prop2,
      nome: "Talhão outra fazenda",
      area: 2,
    });
    await expectTenantDenied(
      a.caller.coreData.tarefas.create({
        propriedadeId: a.propriedadeId,
        terrenoId: terreno2,
        tipoOperacao: "pulverizacao",
        titulo: "Talhão errado",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("10 — cultivo incompatível com talhão (mesma propriedade)", async () => {
    const outroTalhao = await a.caller.coreData.terrenos.create({
      propriedadeId: a.propriedadeId,
      nome: "Talhão sem cultivo vinculado",
      area: 1,
    });
    await expectTenantDenied(
      a.caller.coreData.tarefas.create({
        propriedadeId: a.propriedadeId,
        terrenoId: outroTalhao,
        culturaId: a.cultivoId,
        tipoOperacao: "monitoramento",
        titulo: "Cultivo/talhão incoerente",
        dataPrevista: new Date().toISOString(),
      }),
    );
  });

  it("11 — escrita em safra encerrada (create tarefa)", async () => {
    const { createSafra } = await import("../server/db-safras");
    const histId = await createSafra({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: "Safra 2C encerrada",
      status: "encerrada",
      isDefault: false,
    });
    await expect(
      a.caller.coreData.tarefas.create({
        propriedadeId: a.propriedadeId,
        safraId: histId,
        tipoOperacao: "monitoramento",
        titulo: "Bloqueado safra encerrada",
        dataPrevista: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("12 — createBulk não cruza propriedade/tenant (mesma org)", async () => {
    const prop2 = await a.caller.coreData.propriedades.create({
      nome: `Bulk cross prop ${Date.now()}`,
      cidade: "Teste",
      estado: "PR",
      tamanhoArea: 5,
      tipoProducao: "graos",
    });
    const terreno2 = await a.caller.coreData.terrenos.create({
      propriedadeId: prop2,
      nome: "Bulk talhão remoto",
      area: 2,
    });
    const before = await a.caller.coreData.tarefas.listByPropriedade({
      propriedadeId: a.propriedadeId,
    });
    await expectTenantDenied(
      a.caller.coreData.tarefas.createBulk({
        propriedadeId: a.propriedadeId,
        terrenoIds: [a.terrenoId, terreno2],
        tipoOperacao: "monitoramento",
        titulo: "Bulk cross property",
        dataPrevista: new Date().toISOString(),
        clientMutationId: `bulk_2c_${Date.now()}`,
      }),
    );
    const after = await a.caller.coreData.tarefas.listByPropriedade({
      propriedadeId: a.propriedadeId,
    });
    expect(after.length).toBe(before.length);
  });

  it("13 — update evento com responsável inválido negado", async () => {
    const eventoId = await a.caller.coreData.calendario.create({
      propriedadeId: a.propriedadeId,
      tipoAtividade: "inspecao",
      titulo: "Evento update resp",
      dataProgramada: new Date().toISOString(),
    });
    await expectTenantDenied(
      a.caller.coreData.calendario.update({
        id: eventoId,
        data: { responsavelUserId: b.userId },
      }),
    );
  });
});
