/**
 * Etapa 4 — acesso tenant-aware.
 * Toda leitura/escrita privada deve passar por estes helpers.
 * Cross-tenant → NOT_FOUND (sem vazar existência).
 */
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb, getUsuarioAfuByUserId, getPropriedadeById, getTerrenoById } from "./db";
import {
  getActiveMembership,
  resolveSessionOrganization,
} from "./db-organizations";
import {
  propriedades,
  terrenos,
  culturas,
  diagnosticosIa,
  analisesFitotecnicas,
  relatorios,
  calendarioCuidados,
  tarefasOperacionais,
  produtores,
  type Organization,
  type OrganizationMembership,
} from "../drizzle/schema";
import {
  roleHasPermission,
  type OrgPermission,
  type OrgRole,
} from "../lib/security/org-roles";

export const TENANT_NOT_FOUND = "Recurso não encontrado";

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

/** Propriedade no escopo da organização ativa */
export async function requirePropertyInTenant(
  tenant: TenantContext,
  propriedadeId: number,
) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(propriedades)
    .where(
      and(
        eq(propriedades.id, propriedadeId),
        eq(propriedades.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  if (!rows[0]) {
    throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  }
  return rows[0];
}

/** Talhão pertence à propriedade e à mesma org */
export async function requireTerrenoInTenant(
  tenant: TenantContext,
  terrenoId: number,
  propriedadeId?: number,
) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(terrenos)
    .where(
      and(eq(terrenos.id, terrenoId), eq(terrenos.organizationId, tenant.organizationId)),
    )
    .limit(1);
  const t = rows[0];
  if (!t) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
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
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(culturas)
    .where(
      and(eq(culturas.id, culturaId), eq(culturas.organizationId, tenant.organizationId)),
    )
    .limit(1);
  const c = rows[0];
  if (!c) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  if (propriedadeId != null && c.propriedadeId !== propriedadeId) {
    throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  }
  return c;
}

export async function requireRelatorioInTenant(tenant: TenantContext, id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(relatorios)
    .where(and(eq(relatorios.id, id), eq(relatorios.organizationId, tenant.organizationId)))
    .limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  return rows[0];
}

export async function requireAnaliseInTenant(tenant: TenantContext, id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(analisesFitotecnicas)
    .where(
      and(
        eq(analisesFitotecnicas.id, id),
        eq(analisesFitotecnicas.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  return rows[0];
}

export async function requireTarefaInTenant(tenant: TenantContext, id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(tarefasOperacionais)
    .where(
      and(
        eq(tarefasOperacionais.id, id),
        eq(tarefasOperacionais.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  return rows[0];
}

export async function requireEventoInTenant(tenant: TenantContext, id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(calendarioCuidados)
    .where(
      and(
        eq(calendarioCuidados.id, id),
        eq(calendarioCuidados.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  return rows[0];
}

export async function requireDiagnosticoInTenant(tenant: TenantContext, id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(diagnosticosIa)
    .where(
      and(eq(diagnosticosIa.id, id), eq(diagnosticosIa.organizationId, tenant.organizationId)),
    )
    .limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  return rows[0];
}

/** Lista propriedades da organização ativa */
export async function listPropriedadesInTenant(tenant: TenantContext) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(propriedades)
    .where(eq(propriedades.organizationId, tenant.organizationId));
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
