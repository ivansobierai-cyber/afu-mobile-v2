/**
 * WP-03 — ponte diagnóstico → tarefa (criar, idempotente, RBAC, tenant).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { OrgRole } from "@/lib/security/org-roles";
import { roleHasPermission } from "@/lib/security/org-roles";
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

describe.skipIf(!hasDb)("WP-03 — ponte diagnóstico → tarefa", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_wp03_bridge";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("matriz RBAC: criar tarefa exige operations.write + diagnostics.write", () => {
    expect(roleHasPermission("operador", "operations.write")).toBe(true);
    expect(roleHasPermission("operador", "diagnostics.write")).toBe(true);
    expect(roleHasPermission("consultor", "diagnostics.write")).toBe(true);
    expect(roleHasPermission("consultor", "operations.write")).toBe(false);
    expect(roleHasPermission("auditor", "operations.write")).toBe(false);
    expect(roleHasPermission("auditor", "diagnostics.write")).toBe(false);
  });

  it("salvar com safraId + criarTarefa gera tarefa na mesma propriedade/safra", async () => {
    const { getDb } = await import("../server/db");
    const { culturas } = await import("../drizzle/schema");
    const db = await getDb();
    expect(db).toBeTruthy();
    const [cultivo] = await db!
      .select()
      .from(culturas)
      .where(eq(culturas.id, a.cultivoId))
      .limit(1);
    expect(cultivo?.safraId).toBeTruthy();

    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { safraId: cultivo!.safraId }),
    );
    expect(diagnosticoId).toBeGreaterThan(0);

    const created = await a.caller.diagnostico.criarTarefa({ diagnosticoId });
    expect(created.created).toBe(true);
    expect(created.diagnosticoId).toBe(diagnosticoId);
    expect(created.tarefaId).toBeGreaterThan(0);

    const linked = await a.caller.diagnostico.getTarefaVinculada({ diagnosticoId });
    expect(linked).not.toBeNull();
    expect(linked!.id).toBe(created.tarefaId);
    expect(linked!.origem).toBe("diagnostico");
    expect(linked!.legadoDiagnosticoId).toBe(diagnosticoId);
    expect(linked!.organizationId).toBe(a.organizationId);
    expect(linked!.propriedadeId).toBe(a.propriedadeId);
    expect(linked!.safraId).toBe(cultivo!.safraId);
    expect(linked!.tipoOperacao).toBe("monitoramento");
    expect(linked!.prioridade).toBe("alta");
    expect(linked!.instrucoes ?? "").toContain("não é certeza absoluta");
    expect(linked!.instrucoes ?? "").toContain("Aplicar fungicida");
  });

  it("criarTarefa é idempotente (mesmo legadoDiagnosticoId)", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Idempotência WP03" }),
    );
    const first = await a.caller.diagnostico.criarTarefa({ diagnosticoId });
    const second = await a.caller.diagnostico.criarTarefa({ diagnosticoId });
    expect(second.created).toBe(false);
    expect(second.tarefaId).toBe(first.tarefaId);
  });

  it("diagnóstico sem propriedade → BAD_REQUEST", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar({
      ...salvarInput(a),
      propriedadeId: undefined,
      culturaId: undefined,
      safraId: undefined,
    });
    await expect(a.caller.diagnostico.criarTarefa({ diagnosticoId })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("isolamento tenant: getTarefaVinculada / criarTarefa negam cross-tenant", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Tenant A only WP03" }),
    );
    await a.caller.diagnostico.criarTarefa({ diagnosticoId });
    await expectTenantDenied(
      b.caller.diagnostico.getTarefaVinculada({ diagnosticoId }),
    );
    await expectTenantDenied(b.caller.diagnostico.criarTarefa({ diagnosticoId }));
  });

  it("consultor sem operations.write → FORBIDDEN em criarTarefa", async () => {
    await setMembershipRole(a.membershipId, "consultor");
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Consultor laudo" }),
    );
    await expect(a.caller.diagnostico.criarTarefa({ diagnosticoId })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("operations.write"),
    });
    // restaura para não contaminar outros testes se a ordem variar
    await setMembershipRole(a.membershipId, "proprietario");
  });

  it("auditor sem diagnostics.write → FORBIDDEN em criarTarefa", async () => {
    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Antes auditor" }),
    );
    await setMembershipRole(a.membershipId, "auditor");
    await expect(a.caller.diagnostico.criarTarefa({ diagnosticoId })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await setMembershipRole(a.membershipId, "proprietario");
  });

  it("terreno de outra propriedade no mesmo tenant é rejeitado", async () => {
    const prop2Id = await a.caller.coreData.propriedades.create({
      nome: `WP03 prop2 ${Date.now()}`,
      cidade: "Teste",
      estado: "PR",
      tamanhoArea: 10,
      tipoProducao: "graos",
    });
    const terreno2Id = await a.caller.coreData.terrenos.create({
      propriedadeId: prop2Id,
      nome: "Talhao outro",
      area: 2,
    });

    const diagnosticoId = await a.caller.diagnostico.salvar(
      salvarInput(a, { problema: "Terreno mismatch" }),
    );
    await expect(
      a.caller.diagnostico.criarTarefa({
        diagnosticoId,
        terrenoId: terreno2Id,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
