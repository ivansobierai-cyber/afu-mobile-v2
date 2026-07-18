/**
 * Etapa 2 — matriz de papéis da organização.
 * Fonte de verdade para autorização por membership (não usar role do cliente).
 */

export const ORG_ROLES = [
  "proprietario",
  "administrador",
  "gerente",
  "agronomo",
  "operador",
  "consultor",
  "auditor",
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  proprietario: "Proprietário",
  administrador: "Administrador",
  gerente: "Gerente",
  agronomo: "Agrônomo/Técnico",
  operador: "Operador",
  consultor: "Consultor",
  auditor: "Auditor (somente leitura)",
};

/** Capacidades usadas pelos middlewares / UI */
export type OrgPermission =
  | "org.manage_members"
  | "org.manage_settings"
  | "org.archive"
  | "property.read"
  | "property.write"
  | "property.archive"
  | "property.delete"
  | "operations.read"
  | "operations.write"
  | "operations.approve"
  | "finance.read"
  | "finance.write"
  | "diagnostics.write"
  | "reports.read"
  | "reports.export"
  | "safra.close"
  | "safra.reopen";

const ALL_PERMS: OrgPermission[] = [
  "org.manage_members",
  "org.manage_settings",
  "org.archive",
  "property.read",
  "property.write",
  "property.archive",
  "property.delete",
  "operations.read",
  "operations.write",
  "operations.approve",
  "finance.read",
  "finance.write",
  "diagnostics.write",
  "reports.read",
  "reports.export",
  "safra.close",
  "safra.reopen",
];

const ROLE_PERMISSIONS: Record<OrgRole, readonly OrgPermission[]> = {
  proprietario: ALL_PERMS,
  administrador: ALL_PERMS.filter((p) => p !== "org.archive"),
  gerente: [
    "property.read",
    "property.write",
    "property.archive",
    "operations.read",
    "operations.write",
    "operations.approve",
    "finance.read",
    "diagnostics.write",
    "reports.read",
    "reports.export",
    "safra.close",
    "safra.reopen",
  ],
  agronomo: [
    "property.read",
    "operations.read",
    "operations.write",
    "diagnostics.write",
    "reports.read",
    "safra.close",
  ],
  operador: ["property.read", "operations.read", "operations.write", "diagnostics.write"],
  consultor: ["property.read", "operations.read", "diagnostics.write", "reports.read"],
  auditor: ["property.read", "operations.read", "finance.read", "reports.read"],
};

export function permissionsForRole(role: OrgRole): readonly OrgPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: OrgRole, permission: OrgPermission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function assertRolePermission(role: OrgRole, permission: OrgPermission): void {
  if (!roleHasPermission(role, permission)) {
    throw new Error(`Papel ${role} não possui permissão ${permission}`);
  }
}

/** Papéis que podem mutar cadastro organizacional / membros */
export function canManageMembers(role: OrgRole): boolean {
  return roleHasPermission(role, "org.manage_members");
}
