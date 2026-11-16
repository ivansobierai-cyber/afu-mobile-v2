/**
 * auth-router.ts — Router tRPC para Autenticação e Controle de Acesso
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions, clearSessionCookie } from "../_core/cookies";
import {
  listarUsuariosCompletos,
  getUsuarioCompletoById,
  setUserRole,
  setStatusPerfilAfu,
  setTipoUsuarioAfu,
  upsertPerfilAfu,
  getEstatisticasUsuarios,
  loginWithEmail,
  createUserWithEmail,
  emailExists,
} from "../db-auth";
import { getUsuarioAfuByUserId } from "../db";
import { sdk } from "../_core/sdk";
import {
  requestPasswordReset,
  validateResetToken,
  resetPasswordWithToken,
} from "../password-reset";
import {
  createAccessToken,
  createRefreshToken,
  storeRefreshToken,
  renewTokens,
  revokeRefreshToken,
  verifyRefreshToken,
} from "../token-service";
import {
  anonymizeAccount,
  cancelAccountDeletion,
  exportUserData,
  extractClientMeta,
  getActiveDeletionRequest,
  getLgpdPublicInfo,
  listConsentsForUser,
  listDeletionRequests,
  recordConsent,
  recordSignupConsents,
  requestAccountDeletion,
} from "../lgpd";
import {
  LGPD_PRIVACY_VERSION,
  LGPD_TERMS_VERSION,
} from "../../lib/lgpd/constants";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const tipoUsuarioSchema = z.enum(["administrador", "tecnico", "produtor", "parceiro", "comprador"]);
const statusPerfilSchema = z.enum(["ativo", "inativo", "suspenso"]);

const perfilUpsertSchema = z.object({
  nome: z.string().min(2).max(150),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().max(30).optional(),
  tipoUsuario: tipoUsuarioSchema.default("produtor"),
  cargo: z.string().max(100).optional(),
  registroProfissional: z.string().max(50).optional(),
});

const listarUsuariosSchema = z.object({
  busca: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  status: statusPerfilSchema.optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  name: z.string().min(2).max(150),
  /** Público: não permite auto-promoção a admin de plataforma (P0-4) */
  profile: z.enum(["produtor", "tecnico"]),
  /** WP-07 — aceite explícito dos documentos legais (versão + flag) */
  acceptedTerms: z.literal(true),
  termsVersion: z.string().min(1).max(40).optional(),
  privacyVersion: z.string().min(1).max(40).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas nao conferem",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas nao conferem",
  path: ["confirmPassword"],
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Sub-routers ──────────────────────────────────────────────────────────────

const perfilRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    return perfil ?? null;
  }),

  upsert: protectedProcedure
    .input(perfilUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const perfilId = await upsertPerfilAfu(ctx.user.id, {
        nome: input.nome,
        email: input.email || null,
        telefone: input.telefone || null,
        tipoUsuario: input.tipoUsuario,
        cargo: input.cargo || null,
        registroProfissional: input.registroProfissional || null,
        status: "ativo",
      });
      return { perfilId, success: true };
    }),
});

const adminUsuariosRouter = router({
  listar: adminProcedure
    .input(listarUsuariosSchema)
    .query(async ({ input }) => {
      const usuarios = await listarUsuariosCompletos({
        busca: input.busca,
        role: input.role,
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });
      return { usuarios, total: usuarios.length };
    }),

  detalhe: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const usuario = await getUsuarioCompletoById(input.userId);
      if (!usuario) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Usuario ${input.userId} nao encontrado` });
      }
      return usuario;
    }),

  setRole: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId && input.role === "user") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Voce nao pode remover seu proprio acesso de administrador." });
      }
      await setUserRole(input.userId, input.role);
      return { success: true, userId: input.userId, novoRole: input.role };
    }),

  setStatus: adminProcedure
    .input(z.object({ perfilId: z.number().int().positive(), status: statusPerfilSchema }))
    .mutation(async ({ input }) => {
      await setStatusPerfilAfu(input.perfilId, input.status);
      return { success: true, perfilId: input.perfilId, novoStatus: input.status };
    }),

  setTipo: adminProcedure
    .input(z.object({ perfilId: z.number().int().positive(), tipoUsuario: tipoUsuarioSchema }))
    .mutation(async ({ input }) => {
      await setTipoUsuarioAfu(input.perfilId, input.tipoUsuario);
      return { success: true, perfilId: input.perfilId, novoTipo: input.tipoUsuario };
    }),
});

const adminStatsRouter = router({
  usuarios: adminProcedure.query(async () => {
    return getEstatisticasUsuarios();
  }),
});

// ─── Router principal ─────────────────────────────────────────────────────────

export const authRouter = router({
  me: protectedProcedure.query((opts) => opts.ctx.user ?? null),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await revokeRefreshToken(ctx.user.id);
    clearSessionCookie(ctx.res, ctx.req);
    return { success: true } as const;
  }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await loginWithEmail(input.email, input.password);
        
        // Garantir que openId sempre existe (nunca null)
        if (!user.openId) {
          throw new Error('User openId is missing');
        }

        // Etapa 10 — org pessoal só no login/signup (não em cada resolveSession)
        try {
          const { ensurePersonalOrganization } = await import("../db-organizations");
          await ensurePersonalOrganization(user.id);
        } catch (e) {
          console.warn("[auth.login] ensurePersonalOrganization failed:", e);
        }
        
        // Criar access token (curta duração)
        const accessToken = await createAccessToken(user.openId, user.name || '');
        
        // Criar refresh token (longa duração)
        const refreshToken = await createRefreshToken(user.openId);
        
        // Armazenar refresh token no banco
        await storeRefreshToken(user.id, refreshToken);
        
        // Setar cookie para web (usa access token)
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`);
        
        return {
          success: true,
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, name: user.name, role: user.role, openId: user.openId },
          message: "Login realizado com sucesso",
        };
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha invalidos" });
      }
    }),

  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const exists = await emailExists(input.email);
        if (exists) {
          throw new TRPCError({ code: "CONFLICT", message: "Este e-mail ja esta registrado" });
        }
        const result = await createUserWithEmail({
          email: input.email,
          password: input.password,
          name: input.name,
          profile: input.profile,
        });

        try {
          const { ensurePersonalOrganization } = await import("../db-organizations");
          await ensurePersonalOrganization(result.userId);
        } catch (e) {
          console.warn("[auth.signup] ensurePersonalOrganization failed:", e);
        }

        try {
          const meta = extractClientMeta(ctx.req);
          await recordSignupConsents({
            userId: result.userId,
            termsVersion: input.termsVersion ?? LGPD_TERMS_VERSION,
            privacyVersion: input.privacyVersion ?? LGPD_PRIVACY_VERSION,
            ip: meta.ip,
            userAgent: meta.userAgent,
          });
        } catch (e) {
          console.warn("[auth.signup] LGPD consent recording failed:", e);
        }
        
        // Garantir que openId sempre existe (nunca null)
        if (!result.openId) {
          throw new Error('User openId is missing after creation');
        }
        
        // Criar access token (curta duração)
        const accessToken = await createAccessToken(result.openId, result.name);
        
        // Criar refresh token (longa duração)
        const refreshToken = await createRefreshToken(result.openId);
        
        // Armazenar refresh token no banco
        await storeRefreshToken(result.userId, refreshToken);
        
        // Setar cookie para web (usa access token)
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`);
        
        return {
          success: true,
          accessToken,
          refreshToken,
          user: { id: result.userId, email: result.email, name: result.name, openId: result.openId },
          message: "Conta criada com sucesso",
        };
      } catch (error: any) {
        if (error.code === "CONFLICT") throw error;
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar conta" });
      }
    }),

  // Renovar access token usando refresh token
  refresh: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ input }) => {
      try {
        const tokens = await renewTokens(input.refreshToken);
        if (!tokens) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Refresh token inválido ou expirado" });
        }

        return {
          success: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          message: "Tokens renovados com sucesso",
        };
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Erro ao renovar tokens" });
      }
    }),

  // Verificar se access token está próximo de expirar
  checkTokenExpiry: protectedProcedure.query(async ({ ctx }) => {
    // Este endpoint é protegido, então se chegou aqui, o token é válido
    // Retorna informação sobre quando vai expirar
    return {
      isValid: true,
      expiresIn: 15 * 60, // 15 minutos em segundos
      message: "Token válido",
    };
  }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      const result = await requestPasswordReset(input.email);
      return result;
    }),

  validateResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const result = await validateResetToken(input.token);
      return result;
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const result = await resetPasswordWithToken(input.token, input.newPassword);
      return result;
    }),

  resendPasswordReset: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      // Reenviar e-mail de reset (mesmo que forgotPassword)
      // Rate limiting implementado no frontend com cooldown
      const result = await requestPasswordReset(input.email);
      return result;
    }),

  isAdmin: publicProcedure.query((opts) => ({
    isAdmin: opts.ctx.user?.role === "admin",
  })),

  session: publicProcedure.query(async (opts) => {
    const user = opts.ctx.user;
    if (!user) {
      return {
        user: null,
        perfil: null,
        isAdmin: false,
        organizations: [] as const,
        activeOrganizationId: null,
        activeRole: null,
      };
    }
    const perfil = await getUsuarioAfuByUserId(user.id);
    const isAdmin =
      user.role === "admin" || perfil?.tipoUsuario === "administrador";
    let orgSession: {
      organizations: Array<{
        id: number;
        nome: string;
        tipo: string;
        role: string;
        status: string;
      }>;
      activeOrganizationId: number | null;
      activeRole: string | null;
    } | null = null;
    try {
      const { resolveSessionOrganization } = await import("../db-organizations");
      orgSession = await resolveSessionOrganization(user.id);
    } catch {
      orgSession = null;
    }
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastSignedIn: user.lastSignedIn,
      },
      perfil: perfil ?? null,
      isAdmin,
      organizations: orgSession?.organizations ?? [],
      activeOrganizationId: orgSession?.activeOrganizationId ?? null,
      activeRole: orgSession?.activeRole ?? null,
    };
  }),

  perfil: perfilRouter,

  /** WP-07 — LGPD: consentimento, exportação e exclusão agendada (sem hard-delete) */
  lgpd: router({
    info: publicProcedure.query(() => getLgpdPublicInfo()),

    consents: protectedProcedure.query(async ({ ctx }) => listConsentsForUser(ctx.user.id)),

    recordConsent: protectedProcedure
      .input(
        z.object({
          documentType: z.enum(["terms", "privacy"]),
          documentVersion: z.string().min(1).max(40),
          source: z.string().max(40).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const meta = extractClientMeta(ctx.req);
        const id = await recordConsent({
          userId: ctx.user.id,
          documentType: input.documentType,
          documentVersion: input.documentVersion,
          source: input.source ?? "in_app",
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        return { success: true as const, consentId: id };
      }),

    export: protectedProcedure.mutation(async ({ ctx }) => {
      const data = await exportUserData(ctx.user.id);
      return { success: true as const, data };
    }),

    deletionStatus: protectedProcedure.query(async ({ ctx }) => {
      const active = await getActiveDeletionRequest(ctx.user.id);
      const history = await listDeletionRequests({
        userId: ctx.user.id,
        limit: 20,
        offset: 0,
      });
      return { active, history };
    }),

    requestErase: protectedProcedure
      .input(
        z.object({
          reason: z.string().max(2000).optional(),
          confirm: z.literal(true),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const meta = extractClientMeta(ctx.req);
        const row = await requestAccountDeletion({
          userId: ctx.user.id,
          reason: input.reason,
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        return {
          success: true as const,
          request: row,
          message:
            "Solicitação registrada. Conta suspensa; anonimização agendada após o período de graça. Não há exclusão imediata.",
        };
      }),

    cancelErase: protectedProcedure
      .input(z.object({ requestId: z.number().int().positive().optional() }).optional())
      .mutation(async ({ ctx, input }) => {
        const meta = extractClientMeta(ctx.req);
        const row = await cancelAccountDeletion({
          userId: ctx.user.id,
          requestId: input?.requestId,
          actorUserId: ctx.user.id,
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        return { success: true as const, request: row };
      }),

    adminListEraseRequests: adminProcedure
      .input(
        z
          .object({
            status: z
              .enum(["pending", "scheduled", "cancelled", "anonymized", "rejected"])
              .optional(),
            limit: z.number().int().min(1).max(200).default(50),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const requests = await listDeletionRequests({
          status: input?.status,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        });
        return { requests, total: requests.length };
      }),

    adminCancelErase: adminProcedure
      .input(z.object({ requestId: z.number().int().positive(), userId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const meta = extractClientMeta(ctx.req);
        const row = await cancelAccountDeletion({
          userId: input.userId,
          requestId: input.requestId,
          actorUserId: ctx.user.id,
          isAdmin: true,
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        return { success: true as const, request: row };
      }),

    adminAnonymize: adminProcedure
      .input(
        z.object({
          requestId: z.number().int().positive(),
          force: z.boolean().optional(),
          adminNotes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const meta = extractClientMeta(ctx.req);
        const result = await anonymizeAccount({
          requestId: input.requestId,
          adminUserId: ctx.user.id,
          force: input.force,
          adminNotes: input.adminNotes,
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        return {
          success: true as const,
          ...result,
          message: "Dados pessoais anonimizados. Nenhum hard-delete foi executado.",
        };
      }),
  }),

  admin: router({
    usuarios: adminUsuariosRouter,
    stats: adminStatsRouter,
  }),
});
