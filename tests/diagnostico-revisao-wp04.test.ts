/**
 * WP-04 — revisão técnica: procedures, permissões, auditoria, elo com tarefa.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { and, desc, eq } from "drizzle-orm";
import type { OrgRole } from "@/lib/security/org-roles";
import {
  createIsolatedTenantPair,
  expectTenantDenied,
  type TenantFixture,
} from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

async function setMembershipRole(membershipId: number, role: OrgRole): Promise<void> {
  const { getDb } = await import("../server/db");
  const { organizationMemberships } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(organizationMemberships)
    .set({ role })
    .where(eq(organizationMemberships.id, membershipId));
}

function salvarInput(fixture: TenantFixture, overrides?: Record<string, unknown>) {
  return {
    culturaNome: "Soja",
    parteAnalisada: "folha",
    problema: "Ferrugem asiática",
    tipo: "doenca",
    confianca: 88,
    severidade: "grave",
    descricao: "Lesões típicas em folha",
    recomendacoes: ["Aplicar fungicida registrado", "Monitorar talhão vizinho"],
    propriedadeId: fixture.propriedadeId,
    culturaId: fixture.cultivoId,
    ...overrides,
  };
}

describe.skipIf(!hasDb)("WP-04 — revisão técnica de diagnóstico", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_wp04_revisao";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("confirmar: status confirmado + audit trail", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Confirm WP04" }),
    );
    const result = await a.caller.diagnostico.revisar({
      diagnosticoId,
      acao: "confirmar",
      parecerTecnico: "Laudo coerente com sintomas.",
    });
    expect(result.statusRevisao).toBe("confirmado");
    expect(result.revisadoPorUserId).toBe(a.userId);
    expect(result.parecerTecnico).toContain("coerente");

    const revisao = await a.caller.diagnostico.getRevisao({ diagnosticoId });
    expect(revisao.statusRevisao).toBe("confirmado");
    expect(revisao.revisadoEm).toBeTruthy();

    const { getDb } = await import("../server/db");
    const { auditLogs } = await import("../drizzle/schema");
    const db = await getDb();
    const logs = await db!
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.organizationId, a.organizationId),
          eq(auditLogs.action, "diagnostico.revisao.confirmar"),
          eq(auditLogs.resourceId, String(diagnosticoId)),
        ),
      )
      .orderBy(desc(auditLogs.id))
      .limit(1);
    expect(logs[0]?.actorUserId).toBe(a.userId);
  });

  it("corrigir exige parecer + recomendação; alimenta criarTarefa", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Corrigir WP04" }),
    );

    await expect(
      a.caller.diagnostico.revisar({
        diagnosticoId,
        acao: "corrigir",
        parecerTecnico: "Só parecer",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const corrected = await a.caller.diagnostico.revisar({
      diagnosticoId,
      acao: "corrigir",
      parecerTecnico: "IA confundiu; tratar como cercospora.",
      recomendacaoCorrigida: "Aplicar produto Y registrado; Isolar foco",
    });
    expect(corrected.statusRevisao).toBe("revisado");
    expect(corrected.recomendacaoCorrigida).toContain("produto Y");

    const tarefa = await a.caller.diagnostico.criarTarefa({ diagnosticoId });
    expect(tarefa.created).toBe(true);
    const linked = await a.caller.diagnostico.getTarefaVinculada({ diagnosticoId });
    expect(linked!.instrucoes ?? "").toContain("produto Y");
    expect(linked!.instrucoes ?? "").toContain("revisão técnica");
    expect(linked!.instrucoes ?? "").toContain("cercospora");
  });

  it("descartar bloqueia criarTarefa", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Descartar WP04" }),
    );
    await a.caller.diagnostico.revisar({
      diagnosticoId,
      acao: "descartar",
      parecerTecnico: "Imagem sem qualidade / falso positivo.",
    });
    await expect(a.caller.diagnostico.criarTarefa({ diagnosticoId })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("rejeitado"),
    });
  });

  it("listarPendentesRevisao só retorna pendentes do tenant", async () => {
    const pendenteId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Pendente fila WP04" }),
    );
    const confirmadoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Já confirmado fila" }),
    );
    await a.caller.diagnostico.revisar({
      diagnosticoId: confirmadoId,
      acao: "confirmar",
    });

    const pendentes = await a.caller.diagnostico.listarPendentesRevisao({ limit: 100 });
    const ids = pendentes.map((d) => d.id);
    expect(ids).toContain(pendenteId);
    expect(ids).not.toContain(confirmadoId);

    // tenant B não vê pendentes de A
    const other = await b.caller.diagnostico.salvar(
      salvarInput(b, { problema: "Tenant B only" }),
    );
    const pendentesB = await b.caller.diagnostico.listarPendentesRevisao();
    expect(pendentesB.map((d) => d.id)).toContain(other);
    expect(pendentesB.map((d) => d.id)).not.toContain(pendenteId);
  });

  it("isolamento tenant: revisar / getRevisao negam cross-tenant", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Cross tenant WP04" }),
    );
    await expectTenantDenied(
      b.caller.diagnostico.revisar({
        diagnosticoId,
        acao: "confirmar",
      }),
    );
    await expectTenantDenied(b.caller.diagnostico.getRevisao({ diagnosticoId }));
  });

  it("operador sem diagnostics.review → FORBIDDEN em revisar", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Operador sem review" }),
    );
    await setMembershipRole(a.membershipId, "operador");
    await expect(
      a.caller.diagnostico.revisar({
        diagnosticoId,
        acao: "confirmar",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("diagnostics.review"),
    });
    await setMembershipRole(a.membershipId, "proprietario");
  });

  it("agronomo com diagnostics.review pode corrigir", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Agronomo review" }),
    );
    await setMembershipRole(a.membershipId, "agronomo");
    const result = await a.caller.diagnostico.revisar({
      diagnosticoId,
      acao: "corrigir",
      parecerTecnico: "Ajuste de recomendação pelo agrônomo.",
      recomendacaoCorrigida: "Monitorar a cada 48h",
    });
    expect(result.statusRevisao).toBe("revisado");
    await setMembershipRole(a.membershipId, "proprietario");
  });

  it("auditor sem diagnostics.review → FORBIDDEN em listarPendentes", async () => {
    await setMembershipRole(a.membershipId, "auditor");
    await expect(a.caller.diagnostico.listarPendentesRevisao()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await setMembershipRole(a.membershipId, "proprietario");
  });
});
