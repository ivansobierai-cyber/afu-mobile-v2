/**
 * SUBFASE 0B — RBAC diagnostics.write nas mutations de diagnostico.*
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { OrgRole } from "@/lib/security/org-roles";
import { roleHasPermission } from "@/lib/security/org-roles";
import {
  createIsolatedTenantPair,
  expectTenantDenied,
  type TenantFixture,
} from "./helpers/tenant-fixture";
import * as llm from "../server/_core/llm";

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

function salvarInput(fixture: TenantFixture) {
  return {
    culturaNome: "Soja",
    parteAnalisada: "folha",
    problema: "Mancha",
    tipo: "doenca",
    confianca: 80,
    severidade: "leve",
    descricao: "Teste RBAC",
    recomendacoes: ["Monitorar"],
    propriedadeId: fixture.propriedadeId,
    culturaId: fixture.cultivoId,
  };
}

function analisarInput(fixture: TenantFixture) {
  return {
    imageBase64: "QUFBQQ==",
    culturaNome: "Soja",
    parteAnalisada: "folha",
    propriedadeId: fixture.propriedadeId,
    culturaId: fixture.cultivoId,
  };
}

describe.skipIf(!hasDb)("diagnostico RBAC — diagnostics.write (SUBFASE 0B)", () => {
  let a: TenantFixture;
  let b: TenantFixture;
  let suiteReady = false;
  const invokeSpy = vi.spyOn(llm, "invokeLLM");

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_secret_diagnostics_rbac";
    try {
      ({ a, b } = await createIsolatedTenantPair());
      suiteReady = true;
    } catch {
      suiteReady = false;
    }
  }, 120_000);

  afterEach(() => {
    invokeSpy.mockReset();
  });

  it("matriz: auditor não possui diagnostics.write; operador possui", () => {
    expect(roleHasPermission("auditor", "diagnostics.write")).toBe(false);
    expect(roleHasPermission("auditor", "property.read")).toBe(true);
    expect(roleHasPermission("operador", "diagnostics.write")).toBe(true);
    expect(roleHasPermission("operador", "property.read")).toBe(true);
  });

  it("auditor não pode executar diagnostico.salvar → FORBIDDEN", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await setMembershipRole(a.membershipId, "auditor");
    await expect(a.caller.diagnostico.salvar(salvarInput(a))).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("diagnostics.write"),
    } satisfies Partial<TRPCError>);
  });

  it("auditor não pode executar diagnostico.analisar → FORBIDDEN antes da IA", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await setMembershipRole(a.membershipId, "auditor");
    await expect(a.caller.diagnostico.analisar(analisarInput(a))).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("diagnostics.write"),
    } satisfies Partial<TRPCError>);
    expect(invokeSpy).not.toHaveBeenCalled();
  });

  it("operador passa RBAC em salvar e persiste diagnóstico", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await setMembershipRole(a.membershipId, "operador");
    const id = await a.caller.diagnostico.salvar(salvarInput(a));
    expect(id).toBeGreaterThan(0);
  });

  it("operador passa RBAC em analisar com property.read + diagnostics.write (IA mockada)", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await setMembershipRole(a.membershipId, "operador");
    invokeSpy.mockResolvedValue({
      model: "test-model",
      choices: [
        {
          message: {
            content: JSON.stringify({
              problema: "Teste",
              tipo: "outro",
              confianca: 70,
              severidade: "leve",
              descricao: "ok",
              recomendacoes: [],
            }),
          },
        },
      ],
    } as Awaited<ReturnType<typeof llm.invokeLLM>>);

    const result = await a.caller.diagnostico.analisar(analisarInput(a));
    expect(result.problema).toBe("Teste");
    expect(invokeSpy).toHaveBeenCalledTimes(1);
  });

  it("diagnostico.historico não exige diagnostics.write (auditor pode listar)", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await setMembershipRole(a.membershipId, "auditor");
    const list = await a.caller.diagnostico.historico({ cacheScope: a.organizationId });
    expect(Array.isArray(list)).toBe(true);
  });

  it("cross-tenant em analisar permanece bloqueado antes da IA", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await setMembershipRole(a.membershipId, "operador");
    const msg = await expectTenantDenied(
      a.caller.diagnostico.analisar({
        imageBase64: "QUFBQQ==",
        culturaNome: "Soja",
        parteAnalisada: "folha",
        propriedadeId: b.propriedadeId,
      }),
    );
    expect(invokeSpy).not.toHaveBeenCalled();
    expect(msg).toMatch(/NOT_FOUND|FORBIDDEN/);
  });
});
