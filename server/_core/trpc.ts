import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import {
  requireTenantContext,
  requireOrgPermission,
  requirePropertyInTenant,
  type TenantContext,
} from "../tenant-access";
import {
  roleHasPermission,
  type OrgPermission,
  type OrgRole,
} from "../../lib/security/org-roles";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Etapa 4 — sessão + organização ativa + membership ativo.
 */
export const organizationProcedure = protectedProcedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    const tenant = await requireTenantContext(ctx.user.id);

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        tenant,
        organization: tenant.organization,
        membership: tenant.membership,
        orgRole: tenant.orgRole,
        organizationId: tenant.organizationId,
        perfilId: tenant.perfilId,
      },
    });
  }),
);

/** Exige permissão específica no papel da org ativa */
export function orgPermissionProcedure(permission: OrgPermission) {
  return organizationProcedure.use(
    t.middleware(async (opts) => {
      const { ctx, next } = opts;
      const tenant = (ctx as { tenant?: TenantContext }).tenant;
      if (!tenant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Contexto de organização ausente" });
      }
      requireOrgPermission(tenant, permission);
      return next({ ctx });
    }),
  );
}

/**
 * Etapa 4 — organizationProcedure + valida propriedadeId do input no tenant.
 * input deve incluir `propriedadeId` (ou `id` quando for get de propriedade).
 */
export const propertyProcedure = organizationProcedure.use(
  t.middleware(async (opts) => {
    const { ctx, next, getRawInput } = opts;
    const tenant = (ctx as { tenant?: TenantContext }).tenant;
    if (!tenant) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Contexto de organização ausente" });
    }
    const raw = (await getRawInput()) as
      | { propriedadeId?: number; id?: number }
      | undefined;
    const propriedadeId = raw?.propriedadeId ?? raw?.id;
    if (propriedadeId == null || !Number.isFinite(propriedadeId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "propriedadeId é obrigatório",
      });
    }
    const propriedade = await requirePropertyInTenant(tenant, Number(propriedadeId));
    return next({
      ctx: {
        ...ctx,
        propriedade,
      },
    });
  }),
);

export type { TenantContext, OrgRole, OrgPermission };
export { roleHasPermission };
