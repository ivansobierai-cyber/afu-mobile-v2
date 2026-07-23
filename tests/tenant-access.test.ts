import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  TENANT_NOT_FOUND,
  getCtxTenant,
  requireOrgPermission,
  type TenantContext,
} from "../server/tenant-access";
import { roleHasPermission } from "@/lib/security/org-roles";

function fakeTenant(role: TenantContext["orgRole"], organizationId = 10): TenantContext {
  return {
    userId: 1,
    perfilId: 2,
    organizationId,
    organization: {
      id: organizationId,
      nome: "Org Teste",
      tipo: "produtor_individual",
      status: "ativa",
      ownerUserId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TenantContext["organization"],
    membership: {
      id: 1,
      organizationId,
      userId: 1,
      role,
      status: "ativo",
      invitedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TenantContext["membership"],
    orgRole: role,
  };
}

describe("tenant-access helpers (Etapa 4)", () => {
  it("exporta mensagem genérica NOT_FOUND sem vazar existência", () => {
    expect(TENANT_NOT_FOUND).toBe("Recurso não encontrado");
  });

  it("getCtxTenant exige tenant no contexto", () => {
    expect(() => getCtxTenant({})).toThrow(TRPCError);
    const tenant = fakeTenant("gerente");
    expect(getCtxTenant({ tenant })).toBe(tenant);
  });

  it("requireOrgPermission bloqueia papel sem capability", () => {
    const auditor = fakeTenant("auditor");
    expect(() => requireOrgPermission(auditor, "finance.write")).toThrow(TRPCError);
    expect(() => requireOrgPermission(auditor, "reports.read")).not.toThrow();
  });

  it("operador não exporta relatórios; proprietário sim", () => {
    expect(roleHasPermission("operador", "reports.export")).toBe(false);
    expect(roleHasPermission("proprietario", "reports.export")).toBe(true);
  });

  it("surface de helpers tenant-aware está exportada", async () => {
    const mod = await import("../server/tenant-access");
    expect(typeof mod.requirePropertyInTenant).toBe("function");
    expect(typeof mod.requireRelatorioInTenant).toBe("function");
    expect(typeof mod.requireAnaliseInTenant).toBe("function");
    expect(typeof mod.requireTarefaInTenant).toBe("function");
    expect(typeof mod.requireTerrenoInTenant).toBe("function");
    expect(typeof mod.requireCulturaInTenant).toBe("function");
    expect(typeof mod.assertRelatedIdsInTenant).toBe("function");
    expect(typeof mod.requireOrgMemberUserId).toBe("function");
  });

  it("trpc exporta organizationProcedure e propertyProcedure", async () => {
    const trpc = await import("../server/_core/trpc");
    expect(typeof trpc.organizationProcedure).toBe("object");
    expect(typeof trpc.propertyProcedure).toBe("object");
    expect(typeof trpc.orgPermissionProcedure).toBe("function");
  });
});
