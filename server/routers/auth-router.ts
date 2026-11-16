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
import { isAuthDependencyError, normalizeEmail } from "../auth-errors";
import { sendWelcomeEmail, isSendGridReady } from "../email-service";
import { toAccountInactiveTrpc } from "../account-status";
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
import { assertAccountActive, getAccountStatus } from "../lgpd-account-active";
import {
  adminResetMfa,
  beginMfaEnrollment,
  confirmMfaEnrollment,
  disableMfaSelf,
  getMfaPublicStatus,
  isMfaEnabled,
  regenerateRecoveryCodes,
  userRequiresMfaEnrollment,
  verifyMfaLoginCode,
} from "../mfa";
import { createMfaChallengeToken, verifyMfaChallengeToken } from "../mfa-challenge";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { MFA_CHALLENGE_REQUIRED_CODE } from "../../lib/mfa/constants";

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
  /** WP-07 — aceite explícito; versões gravadas são sempre as do servidor */
  acceptedTerms: z.literal(true),
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
        const user = await loginWithEmail(normalizeEmail(input.email), input.password);

        // Garantir que openId sempre existe (nunca null)
        if (!user.openId) {
          throw new Error("User openId is missing");
        }

        /**
         * WP-06 coordenará enforcement completo de suspensão via
         * `assertAccountActive(user.id, { allowPendingErasure: true })`.
         * Em #69 (WP-07) ainda não bloqueamos login genérico, mas:
         * - sinalizamos `pendingErasure` no retorno
         * - se WP-06 ligar o assert com allowPendingErasure, titular com
         *   exclusão agendada continua autenticável para cancelar
         * - alternativa sem sessão: `auth.lgpd.cancelEraseWithCredentials`
         */
        const account = await getAccountStatus(user.id);
        if (account.status === "suspenso" && account.pendingErasure) {
          // Prévia do comportamento WP-06: permite sessão restrita à exclusão.
          await assertAccountActive(user.id, { allowPendingErasure: true });
        }

        // WP-08 — se MFA ativo, não emitir sessão até TOTP/recovery
        let mfaEnabled = false;
        try {
          mfaEnabled = await isMfaEnabled(user.id);
        } catch (e) {
          console.warn("[auth.login] MFA status check failed:", e);
        }
        if (mfaEnabled) {
          const mfaToken = await createMfaChallengeToken({
            userId: user.id,
            openId: user.openId,
            email: user.email || input.email,
          });
          return {
            success: false as const,
            mfaRequired: true as const,
            mfaToken,
            code: MFA_CHALLENGE_REQUIRED_CODE,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              openId: user.openId,
            },
            message: "Informe o código do autenticador (ou um código de recuperação)",
          };
        }

        // Etapa 10 — org pessoal só no login/signup (não em cada resolveSession)
        try {
          const { ensurePersonalOrganization } = await import("../db-organizations");
          await ensurePersonalOrganization(user.id);
        } catch (e) {
          console.warn("[auth.login] ensurePersonalOrganization failed:", e);
        }

        const accessToken = await createAccessToken(user.openId, user.name || "");
        const refreshToken = await createRefreshToken(user.openId);
        await storeRefreshToken(user.id, refreshToken);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        });

        let mfaSetupRequired = false;
        try {
          mfaSetupRequired = await userRequiresMfaEnrollment(user.id);
        } catch {
          mfaSetupRequired = false;
        }

        return {
          success: true as const,
          mfaRequired: false as const,
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            openId: user.openId,
            mustChangePassword: Boolean(user.mustChangePassword),
          },
          accountStatus: account.status,
          pendingErasure: account.pendingErasure,
          mfaSetupRequired,
          message: account.pendingErasure
            ? "Login OK. Conta com exclusão LGPD agendada — você pode cancelar em Perfil ou via auth.lgpd.cancelErase."
            : mfaSetupRequired
              ? "Login OK. Configure MFA (TOTP) em Segurança para liberar funções administrativas."
              : "Login realizado com sucesso",
        };
      } catch (error) {
        // WP-06 — soft-deactivate deve surfacer FORBIDDEN (não mascarar como credencial inválida)
        const inactive = toAccountInactiveTrpc(error);
        if (inactive) throw inactive;
        if (error instanceof TRPCError) throw error;
        if (isAuthDependencyError(error)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Servico de autenticacao temporariamente indisponivel",
          });
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha invalidos" });
      }
    }),

  /** WP-08 — completa login após desafio TOTP / recovery */
  verifyMfa: publicProcedure
    .input(
      z.object({
        mfaToken: z.string().min(10),
        code: z.string().min(6).max(32),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const challenge = await verifyMfaChallengeToken(input.mfaToken);
      if (!challenge) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Desafio MFA expirado ou inválido. Faça login novamente.",
        });
      }
      await verifyMfaLoginCode({ userId: challenge.userId, code: input.code });

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Servico de autenticacao temporariamente indisponivel",
        });
      }
      const [user] = await db.select().from(users).where(eq(users.id, challenge.userId)).limit(1);
      if (!user?.openId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário MFA inválido" });
      }

      try {
        const { ensurePersonalOrganization } = await import("../db-organizations");
        await ensurePersonalOrganization(user.id);
      } catch (e) {
        console.warn("[auth.verifyMfa] ensurePersonalOrganization failed:", e);
      }

      const accessToken = await createAccessToken(user.openId, user.name || "");
      const refreshToken = await createRefreshToken(user.openId);
      await storeRefreshToken(user.id, refreshToken);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      const account = await getAccountStatus(user.id);

      return {
        success: true as const,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          openId: user.openId,
          mustChangePassword: Boolean(user.mustChangePassword),
        },
        accountStatus: account.status,
        pendingErasure: account.pendingErasure,
        mfaSetupRequired: false,
        message: "Login MFA realizado com sucesso",
      };
    }),

  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const email = normalizeEmail(input.email);
        const exists = await emailExists(email);
        if (exists) {
          throw new TRPCError({ code: "CONFLICT", message: "Este e-mail ja esta registrado" });
        }
        const result = await createUserWithEmail({
          email,
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

        // Consentimento obrigatório — falha o signup se não gravar (versões só do servidor).
        const meta = extractClientMeta(ctx.req);
        await recordSignupConsents({
          userId: result.userId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        });

        // Garantir que openId sempre existe (nunca null)
        if (!result.openId) {
          throw new Error("User openId is missing after creation");
        }

        const accessToken = await createAccessToken(result.openId, result.name);
        const refreshToken = await createRefreshToken(result.openId);
        await storeRefreshToken(result.userId, refreshToken);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        });

        // Boas-vindas best-effort — falha de e-mail não bloqueia o cadastro
        if (isSendGridReady()) {
          void sendWelcomeEmail(result.email, result.name).catch((e) => {
            console.warn("[auth.signup] welcome email failed:", e);
          });
        }

        return {
          success: true,
          accessToken,
          refreshToken,
          user: {
            id: result.userId,
            email: result.email,
            name: result.name,
            openId: result.openId,
          },
          message: "Conta criada com sucesso",
        };
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;
        if (isAuthDependencyError(error)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Servico de autenticacao temporariamente indisponivel",
          });
        }
        console.error("[auth.signup]", error);
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
      const result = await requestPasswordReset(normalizeEmail(input.email));
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
      const result = await requestPasswordReset(normalizeEmail(input.email));
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
        mfa: null,
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
    let mfa: Awaited<ReturnType<typeof getMfaPublicStatus>> | null = null;
    try {
      mfa = await getMfaPublicStatus(user.id);
    } catch {
      mfa = null;
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
      mfa,
    };
  }),

  perfil: perfilRouter,

  /** WP-08 — MFA TOTP (enroll / status / recovery / admin reset) */
  mfa: router({
    status: protectedProcedure.query(async ({ ctx }) => getMfaPublicStatus(ctx.user.id)),

    setup: protectedProcedure.mutation(async ({ ctx }) => {
      const accountName = ctx.user.email || ctx.user.name || `user-${ctx.user.id}`;
      return beginMfaEnrollment({
        userId: ctx.user.id,
        accountName,
      });
    }),

    confirm: protectedProcedure
      .input(z.object({ code: z.string().min(6).max(12) }))
      .mutation(async ({ ctx, input }) => confirmMfaEnrollment({
        userId: ctx.user.id,
        code: input.code,
      })),

    disable: protectedProcedure
      .input(z.object({ code: z.string().min(6).max(32) }))
      .mutation(async ({ ctx, input }) => disableMfaSelf({
        userId: ctx.user.id,
        code: input.code,
      })),

    regenerateRecoveryCodes: protectedProcedure
      .input(z.object({ code: z.string().min(6).max(12) }))
      .mutation(async ({ ctx, input }) => regenerateRecoveryCodes({
        userId: ctx.user.id,
        code: input.code,
      })),

    adminReset: adminProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          reason: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Use desativar MFA na própria conta; adminReset é para outros usuários",
          });
        }
        return adminResetMfa({
          targetUserId: input.userId,
          adminUserId: ctx.user.id,
          reason: input.reason,
        });
      }),

    adminStatus: adminProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .query(async ({ input }) => getMfaPublicStatus(input.userId)),
  }),

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

    /**
     * Cancela exclusão com e-mail/senha — funciona mesmo quando WP-06
     * bloquear login/sessão para contas suspensas (sem allowPendingErasure).
     */
    cancelEraseWithCredentials: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          confirm: z.literal(true),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        let user;
        try {
          user = await loginWithEmail(input.email, input.password);
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha invalidos" });
        }
        const active = await getActiveDeletionRequest(user.id);
        if (!active) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nenhuma solicitação de exclusão ativa para esta conta",
          });
        }
        const meta = extractClientMeta(ctx.req);
        const row = await cancelAccountDeletion({
          userId: user.id,
          requestId: active.id,
          actorUserId: user.id,
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        return {
          success: true as const,
          request: row,
          message: "Solicitação de exclusão cancelada. Faça login novamente para usar o app.",
        };
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
