/**
 * Etapa 4 — autorização de API tenant-aware.
 * Leituras/escritas privadas delegam à Etapa 5 (`tenant-db`).
 * Cross-tenant → NOT_FOUND (sem vazar existência).
 */
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb, getUsuarioAfuByUserId, getPropriedadeById, getTerrenoById } from "./db";
import {
  getActiveMembership,
  resolveSessionOrganization,
} from "./db-organizations";
import { produtores, type Organization, type OrganizationMembership } from "../drizzle/schema";
import {
  roleHasPermission,
  type OrgPermission,
  type OrgRole,
} from "../lib/security/org-roles";
import { createTenantDb, TENANT_DB_NOT_FOUND } from "./tenant-db";

export const TENANT_NOT_FOUND = TENANT_DB_NOT_FOUND;

export type TenantContext = {
  userId: number;
  perfilId: number;
  organizationId: number;
  organization: Organization;
  membership: OrganizationMembership;
  orgRole: OrgRole;
};

/** Sessão + org ativa + membership ativo */
export async function requireTenantContext(userId: number): Promise<TenantContext> {
  const perfil = await getUsuarioAfuByUserId(userId);
  if (!perfil) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
  }
  const session = await resolveSessionOrganization(userId);
  const organizationId = session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nenhuma organização ativa. Selecione uma organização.",
    });
  }
  const m = await getActiveMembership(userId, organizationId);
  if (!m) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sem membership ativo nesta organização.",
    });
  }
  return {
    userId,
    perfilId: perfil.id,
    organizationId,
    organization: m.organization,
    membership: m.membership,
    orgRole: m.membership.role as OrgRole,
  };
}

export function requireOrgPermission(tenant: TenantContext, permission: OrgPermission) {
  if (!roleHasPermission(tenant.orgRole, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Permissão necessária: ${permission}`,
    });
  }
}

/** Propriedade no escopo da organização ativa (via tenant-db) */
export async function requirePropertyInTenant(
  tenant: TenantContext,
  propriedadeId: number,
) {
  return createTenantDb(tenant.organizationId).requirePropriedade(propriedadeId);
}

/** Talhão pertence à propriedade e à mesma org */
export async function requireTerrenoInTenant(
  tenant: TenantContext,
  terrenoId: number,
  propriedadeId?: number,
) {
  const t = await createTenantDb(tenant.organizationId).requireTerreno(terrenoId);
  if (propriedadeId != null && t.propriedadeId !== propriedadeId) {
    throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  }
  return t;
}

/** Cultivo no escopo da org (e opcionalmente da propriedade) */
export async function requireCulturaInTenant(
  tenant: TenantContext,
  culturaId: number,
  propriedadeId?: number,
) {
  const c = await createTenantDb(tenant.organizationId).requireCultura(culturaId);
  if (propriedadeId != null && c.propriedadeId !== propriedadeId) {
    throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  }
  return c;
}

export async function requireRelatorioInTenant(tenant: TenantContext, id: number) {
  return createTenantDb(tenant.organizationId).requireRelatorio(id);
}

export async function requireAnaliseInTenant(tenant: TenantContext, id: number) {
  return createTenantDb(tenant.organizationId).requireAnalise(id);
}

export async function requireTarefaInTenant(tenant: TenantContext, id: number) {
  return createTenantDb(tenant.organizationId).requireTarefa(id);
}

export async function requireEventoInTenant(tenant: TenantContext, id: number) {
  return createTenantDb(tenant.organizationId).requireEvento(id);
}

export async function requireDiagnosticoInTenant(tenant: TenantContext, id: number) {
  return createTenantDb(tenant.organizationId).requireDiagnostico(id);
}

/** Lista propriedades da organização ativa */
export async function listPropriedadesInTenant(tenant: TenantContext) {
  return createTenantDb(tenant.organizationId).listPropriedades();
}

/** ProdutorId do usuário (para creates que ainda usam FK produtor) — amarra à org ativa */
export async function getProdutorIdForTenant(tenant: TenantContext): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(produtores)
    .where(
      and(
        eq(produtores.usuarioId, tenant.perfilId),
        eq(produtores.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  if (rows[0]) return rows[0].id;

  // Fallback: produtor do perfil (legado) — só se org bater ou estiver null
  const legacy = await db
    .select()
    .from(produtores)
    .where(eq(produtores.usuarioId, tenant.perfilId))
    .limit(1);
  if (legacy[0]) {
    if (
      legacy[0].organizationId == null ||
      legacy[0].organizationId === tenant.organizationId
    ) {
      if (legacy[0].organizationId == null) {
        await db
          .update(produtores)
          .set({ organizationId: tenant.organizationId })
          .where(eq(produtores.id, legacy[0].id));
      }
      return legacy[0].id;
    }
  }

  const result = await db.insert(produtores).values({
    usuarioId: tenant.perfilId,
    organizationId: tenant.organizationId,
  });
  return result[0].insertId;
}

/** Valida relações internas de um create operacional */
export async function assertRelatedIdsInTenant(
  tenant: TenantContext,
  refs: {
    propriedadeId?: number;
    terrenoId?: number;
    culturaId?: number;
  },
) {
  if (refs.propriedadeId != null) {
    await requirePropertyInTenant(tenant, refs.propriedadeId);
  }
  if (refs.terrenoId != null) {
    await requireTerrenoInTenant(tenant, refs.terrenoId, refs.propriedadeId);
  }
  if (refs.culturaId != null) {
    await requireCulturaInTenant(tenant, refs.culturaId, refs.propriedadeId);
  }
}

/** Extrai tenant já injetado por organizationProcedure */
export function getCtxTenant(ctx: { tenant?: TenantContext }): TenantContext {
  if (!ctx.tenant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Contexto de organização ausente",
    });
  }
  return ctx.tenant;
}

// Re-export helpers already used elsewhere
export { getPropriedadeById, getTerrenoById };
