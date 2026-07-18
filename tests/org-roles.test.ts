import { describe, expect, it } from "vitest";
import {
  ORG_ROLES,
  roleHasPermission,
  permissionsForRole,
  canManageMembers,
  assertRolePermission,
} from "@/lib/security/org-roles";

describe("org-roles matrix", () => {
  it("define os 7 papéis do prompt", () => {
    expect(ORG_ROLES).toEqual([
      "proprietario",
      "administrador",
      "gerente",
      "agronomo",
      "operador",
      "consultor",
      "auditor",
    ]);
  });

  it("proprietário tem gestão de membros e arquivo", () => {
    expect(canManageMembers("proprietario")).toBe(true);
    expect(roleHasPermission("proprietario", "org.archive")).toBe(true);
    expect(roleHasPermission("proprietario", "finance.write")).toBe(true);
  });

  it("operador não acessa finanças nem membros", () => {
    expect(roleHasPermission("operador", "finance.read")).toBe(false);
    expect(roleHasPermission("operador", "org.manage_members")).toBe(false);
    expect(roleHasPermission("operador", "operations.write")).toBe(true);
  });

  it("auditor é somente leitura operacional/financeira", () => {
    expect(roleHasPermission("auditor", "operations.write")).toBe(false);
    expect(roleHasPermission("auditor", "finance.read")).toBe(true);
    expect(roleHasPermission("auditor", "reports.read")).toBe(true);
    expect(() => assertRolePermission("auditor", "finance.write")).toThrow(/não possui/);
  });

  it("consultor não gerencia membros", () => {
    expect(canManageMembers("consultor")).toBe(false);
    expect(permissionsForRole("consultor").length).toBeGreaterThan(0);
  });
});
