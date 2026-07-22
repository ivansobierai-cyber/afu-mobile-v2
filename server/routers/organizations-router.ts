/**
 * Etapa 2 — organizações, membership e troca de escopo.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  organizationProcedure,
  orgPermissionProcedure,
} from "../_core/trpc";
import { getUsuarioAfuByUserId, getDb } from "../db";
import { propriedades, produtores, organizations } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import {
  resolveSessionOrganization,
  ensurePersonalOrganization,
  getActiveMembership,
  setActiveOrganizationId,
  createOrganization,
  createMembership,
  listMembers,
  updateMembershipRole,
  setMembershipStatus,
  backfillPersonalOrganizations,
  listActiveMemberships,
} from "../db-organizations";
import { ORG_ROLES, canManageMembers, permissionsForRole } from "../../lib/security/org-roles";
import { users } from "../../drizzle/schema";

const roleSchema = z.enum(ORG_ROLES);

export const organizationsRouter = router({
  /** Lista orgs do usuário + ativa + papel */
  mine: protectedProcedure.query(async ({ ctx }) => {
    return resolveSessionOrganization(ctx.user.id);
  }),

  /** Matriz de papéis (documentação viva para UI) */
  rolesCatalog: protectedProcedure.query(() => {
    return ORG_ROLES.map((role) => ({
      role,
      permissions: permissionsForRole(role),
    }));
  }),

  /** Detalhe — só se membership ativo */
  get: protectedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const m = await getActiveMembership(ctx.user.id, input.organizationId);
      if (!m) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem membership ativo nesta organização.",
        });
      }
      return {
        organization: m.organization,
        role: m.membership.role,
        permissions: permissionsForRole(m.membership.role as any),
      };
    }),

  /**
   * Alterna organização ativa — invalida escopo anterior no servidor.
   * Cliente deve limpar React Query cache ao receber sucesso.
   */
  setActive: protectedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const m = await getActiveMembership(ctx.user.id, input.organizationId);
      if (!m) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem membership ativo nesta organização.",
        });
      }
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      }
      await setActiveOrganizationId(perfil.id, input.organizationId);
      return {
        success: true as const,
        activeOrganizationId: input.organizationId,
        role: m.membership.role,
        scopeChangedAt: new Date().toISOString(),
      };
    }),

  /** Garante org pessoal (idempotente) */
  ensurePersonal: protectedProcedure.mutation(async ({ ctx }) => {
    return ensurePersonalOrganization(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(2).max(150),
        tipo: z
          .enum(["produtor_individual", "empresa", "grupo", "cooperativa", "outro"])
          .optional(),
        setActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await createOrganization({
        nome: input.nome.trim(),
        tipo: input.tipo ?? "empresa",
        ownerUserId: ctx.user.id,
      });
      await createMembership({
        organizationId: orgId,
        userId: ctx.user.id,
        role: "proprietario",
      });
      if (input.setActive !== false) {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (perfil) await setActiveOrganizationId(perfil.id, orgId);
      }
      return { organizationId: orgId };
    }),

  members: organizationProcedure.query(async ({ ctx }) => {
    const orgId = (ctx as typeof ctx & { organization: { id: number } }).organization.id;
    return listMembers(orgId);
  }),

  invite: orgPermissionProcedure("org.manage_members")
    .input(
      z.object({
        email: z.string().email(),
        role: roleSchema.default("operador"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = (ctx as typeof ctx & { organization: { id: number } }).organization.id;
      if (input.role === "proprietario") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é permitido convidar como proprietário.",
        });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase().trim()))
        .limit(1);
      const target = rows[0];
      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário com este e-mail não encontrado. Peça para criar conta primeiro.",
        });
      }
      const existing = await getActiveMembership(target.id, orgId);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Usuário já é membro desta organização." });
      }
      try {
        const id = await createMembership({
          organizationId: orgId,
          userId: target.id,
          role: input.role,
          status: "ativo",
          invitedByUserId: ctx.user!.id,
        });
        return { membershipId: id };
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Não foi possível criar membership (possível vínculo existente).",
        });
      }
    }),

  updateMemberRole: orgPermissionProcedure("org.manage_members")
    .input(
      z.object({
        membershipId: z.number().int().positive(),
        role: roleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgCtx = ctx as typeof ctx & { organization: { id: number }; orgRole: string };
      if (input.role === "proprietario" && orgCtx.orgRole !== "proprietario") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Somente o proprietário pode promover a proprietário.",
        });
      }
      await updateMembershipRole(input.membershipId, orgCtx.organization.id, input.role);
      return { success: true as const };
    }),

  removeMember: orgPermissionProcedure("org.manage_members")
    .input(z.object({ membershipId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = (ctx as typeof ctx & { organization: { id: number } }).organization.id;
      await setMembershipStatus(input.membershipId, orgId, "removido");
      return { success: true as const };
    }),

  /**
   * Propriedades no escopo da organização ativa (via produtores.organizationId).
   * Etapa 3 expandirá organizationId direto nas tabelas filhas.
   */
  propriedades: organizationProcedure.query(async ({ ctx }) => {
    const orgId = (ctx as typeof ctx & { organization: { id: number } }).organization.id;
    const db = await getDb();
    if (!db) return [];
    const prods = await db
      .select({ id: produtores.id })
      .from(produtores)
      .where(eq(produtores.organizationId, orgId));
    if (prods.length === 0) return [];
    return db
      .select()
      .from(propriedades)
      .where(
        inArray(
          propriedades.produtorId,
          prods.map((p) => p.id),
        ),
      );
  }),

  /** Admin: backfill orgs pessoais */
  backfill: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Somente admin da plataforma." });
    }
    return backfillPersonalOrganizations();
  }),

  /** Helper para UI — permissões do papel ativo */
  myPermissions: protectedProcedure.query(async ({ ctx }) => {
    const session = await resolveSessionOrganization(ctx.user.id);
    if (!session.activeRole) return { permissions: [] as const, role: null };
    return {
      role: session.activeRole,
      permissions: permissionsForRole(session.activeRole),
      canManageMembers: canManageMembers(session.activeRole),
    };
  }),

  /** Etapa 9 — política de IA da organização ativa */
  aiPolicy: organizationProcedure.query(async ({ ctx }) => {
    const { getCtxTenant } = await import("../tenant-access");
    const { getOrgAiPolicy } = await import("../ai-governance");
    const { canUseForModelImprovement, globalAiTrainingAllowed } = await import(
      "../../lib/ai/ai-policy"
    );
    const tenant = getCtxTenant(ctx);
    const policy = await getOrgAiPolicy(tenant.organizationId);
    return {
      ...policy,
      globalTrainingAllowed: globalAiTrainingAllowed(),
      effectiveModelImprovement: canUseForModelImprovement(policy),
    };
  }),

  setAiPolicy: orgPermissionProcedure("org.manage_settings")
    .input(
      z.object({
        aiAllowModelImprovement: z.boolean(),
        aiShareAggregatedInsights: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { getCtxTenant } = await import("../tenant-access");
      const { writeAuditLog } = await import("../private-files");
      const tenant = getCtxTenant(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(organizations)
        .set({
          aiAllowModelImprovement: input.aiAllowModelImprovement,
          ...(input.aiShareAggregatedInsights != null
            ? { aiShareAggregatedInsights: input.aiShareAggregatedInsights }
            : {}),
        })
        .where(eq(organizations.id, tenant.organizationId));
      await writeAuditLog({
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: "admin.mutation",
        resourceType: "organization_ai_policy",
        resourceId: String(tenant.organizationId),
        meta: JSON.stringify(input),
      });
      return { success: true };
    }),

  /** Debug/aceite: lista memberships brutas */
  debugMemberships: protectedProcedure.query(async ({ ctx }) => {
    return listActiveMemberships(ctx.user.id);
  }),

  /** Etapa 8 — conflitos de sync offline da org ativa */
  syncConflicts: router({
    list: organizationProcedure
      .input(z.object({ limit: z.number().int().positive().max(100).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const { getCtxTenant, requireOrgPermission } = await import("../tenant-access");
        const { listOpenSyncConflicts } = await import("../sync-conflicts");
        const tenant = getCtxTenant(ctx);
        requireOrgPermission(tenant, "property.read");
        return listOpenSyncConflicts(tenant.organizationId, input?.limit ?? 50);
      }),
    resolve: orgPermissionProcedure("property.write")
      .input(
        z.object({
          conflictId: z.number().int().positive(),
          status: z.enum(["resolvido", "descartado"]).default("resolvido"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { getCtxTenant } = await import("../tenant-access");
        const { resolveServerSyncConflict } = await import("../sync-conflicts");
        const tenant = getCtxTenant(ctx);
        await resolveServerSyncConflict(
          tenant.organizationId,
          input.conflictId,
          tenant.userId,
          input.status,
        );
        return { success: true };
      }),
  }),
});
