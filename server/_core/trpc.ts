import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import {
  getActiveMembership,
  resolveSessionOrganization,
} from "../db-organizations";
import { getUsuarioAfuByUserId } from "../db";
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
 * Etapa 2 — exige membership ativo na organização ativa (ou organizationId do input).
 * input pode carregar `organizationId`; senão usa activeOrganizationId do perfil.
 */
export const organizationProcedure = protectedProcedure.use(
  t.middleware(async (opts) => {
    const { ctx, next, getRawInput } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    const raw = (await getRawInput()) as { organizationId?: number } | undefined;
    const sessionOrg = await resolveSessionOrganization(ctx.user.id);
    const organizationId = raw?.organizationId ?? sessionOrg.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nenhuma organização ativa. Selecione uma organização.",
      });
    }

    const membership = await getActiveMembership(ctx.user.id, organizationId);
    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Sem membership ativo nesta organização.",
      });
    }

    const perfil = await getUsuarioAfuByUserId(ctx.user.id);

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        organization: membership.organization,
        membership: membership.membership,
        orgRole: membership.membership.role as OrgRole,
        perfil,
      },
    });
  }),
);

/** Exige permissão específica no papel da org ativa */
export function orgPermissionProcedure(permission: OrgPermission) {
  return organizationProcedure.use(
    t.middleware(async (opts) => {
      const { ctx, next } = opts;
      const role = (ctx as { orgRole?: OrgRole }).orgRole;
      if (!role || !roleHasPermission(role, permission)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Permissão necessária: ${permission}`,
        });
      }
      return next({ ctx });
    }),
  );
}
