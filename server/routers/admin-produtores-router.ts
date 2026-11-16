/**
 * WP-06 — Admin: gestão de produtores (lista, detalhe, convite, soft-deactivate, plano/role).
 * Montado em `adminProdutores` (não em auth.admin) para evitar conflito com PR #61.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, adminProcedure } from "../_core/trpc";
import { writeAuditLog } from "../private-files";
import {
  listarProdutoresAdmin,
  getProdutorAdminDetalhe,
  ensureProdutorRow,
  setProdutorCadastroAtivo,
  setProdutorPlano,
  getEstatisticasProdutoresAdmin,
  generateTempPassword,
  type PlanoProdutor,
} from "../db-admin-produtores";
import {
  createUserWithEmail,
  emailExists,
  setMustChangePassword,
  setStatusPerfilAfu,
  setTipoUsuarioAfu,
  setUserRole,
} from "../db-auth";
import { ensurePersonalOrganization } from "../db-organizations";
import { generateResetToken } from "../password-reset";
import { sendPasswordResetEmail, isSendGridReady } from "../email-service";
import { revokeRefreshToken } from "../token-service";
import { users, usuariosAfu } from "../../drizzle/schema";
import { getDb } from "../db";

/** Temp password only outside production, or when explicitly enabled. */
function mayReturnTemporaryPassword(): boolean {
  if (process.env.ADMIN_INVITE_RETURN_TEMP_PASSWORD === "1") return true;
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const vercelEnv = process.env.VERCEL_ENV;
  if (nodeEnv === "production" || vercelEnv === "production") return false;
  return true;
}

const planoSchema = z.enum(["free", "produtor", "pro", "enterprise"]);
const statusSchema = z.enum(["ativo", "inativo", "suspenso"]);
const tipoSchema = z.enum([
  "administrador",
  "tecnico",
  "produtor",
  "parceiro",
  "comprador",
]);

async function auditProducerAction(opts: {
  actorUserId: number;
  action:
    | "admin.producer.invite"
    | "admin.producer.deactivate"
    | "admin.producer.reactivate"
    | "admin.producer.set_plano"
    | "admin.producer.set_role"
    | "admin.producer.set_tipo"
    | "admin.producer.set_cadastro";
  resourceId: string;
  organizationId?: number | null;
  meta?: Record<string, unknown>;
}) {
  await writeAuditLog({
    organizationId: opts.organizationId ?? null,
    actorUserId: opts.actorUserId,
    action: opts.action,
    resourceType: "produtor",
    resourceId: opts.resourceId,
    meta: opts.meta ? JSON.stringify(opts.meta) : null,
  });
}

export const adminProdutoresRouter = router({
  stats: adminProcedure.query(async () => getEstatisticasProdutoresAdmin()),

  listar: adminProcedure
    .input(
      z
        .object({
          busca: z.string().max(200).optional(),
          status: statusSchema.optional(),
          estado: z.string().max(100).optional(),
          cidade: z.string().max(100).optional(),
          regiao: z.string().max(100).optional(),
          plano: planoSchema.optional(),
          cadastroAtivo: z.boolean().optional(),
          limit: z.number().int().min(1).max(200).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => listarProdutoresAdmin(input ?? {})),

  detalhe: adminProcedure
    .input(
      z
        .object({
          produtorId: z.number().int().positive().optional(),
          userId: z.number().int().positive().optional(),
        })
        .refine((v) => v.produtorId != null || v.userId != null, {
          message: "Informe produtorId ou userId",
        }),
    )
    .query(async ({ input }) => {
      const detalhe = await getProdutorAdminDetalhe({
        produtorId: input.produtorId,
        userId: input.userId,
      });
      if (!detalhe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produtor não encontrado",
        });
      }
      return detalhe;
    }),

  /**
   * Convida/cria produtor: cria user+perfil, org pessoal, linha produtores.
   * Soft: nunca apaga. E-mail de reset é best-effort (SendGrid opcional).
   */
  convidar: adminProcedure
    .input(
      z.object({
        nome: z.string().min(2).max(150),
        email: z.string().email().max(320),
        cidade: z.string().max(100).optional(),
        estado: z.string().max(100).optional(),
        regiao: z.string().max(100).optional(),
        documento: z.string().max(50).optional(),
        plano: planoSchema.default("free"),
        tipoProdutor: z
          .enum(["familiar", "comercial", "organico", "cooperado", "empresarial"])
          .default("comercial"),
        enviarEmailReset: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      if (await emailExists(email)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe usuário com este e-mail",
        });
      }

      const tempPassword = generateTempPassword();
      const created = await createUserWithEmail({
        email,
        password: tempPassword,
        name: input.nome.trim(),
        profile: "produtor",
      });

      let organizationId: number | null = null;
      try {
        const org = await ensurePersonalOrganization(created.userId);
        organizationId = org.organizationId;
      } catch (e) {
        console.warn("[adminProdutores.convidar] ensurePersonalOrganization:", e);
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const perfilRows = await db
        .select()
        .from(usuariosAfu)
        .where(eq(usuariosAfu.userId, created.userId))
        .limit(1);
      const perfil = perfilRows[0];
      if (!perfil) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Perfil AFU não criado no convite",
        });
      }

      const produtorId = await ensureProdutorRow({
        usuarioAfuId: perfil.id,
        organizationId,
        cidade: input.cidade ?? null,
        estado: input.estado ?? null,
        regiao: input.regiao ?? null,
        documento: input.documento ?? null,
        tipoProdutor: input.tipoProdutor,
        plano: input.plano as PlanoProdutor,
      });

      // Convite: sempre exige troca de senha no próximo login
      await setMustChangePassword(created.userId, true);

      let emailEnviado = false;
      if (input.enviarEmailReset) {
        try {
          const { token, expiresAt } = generateResetToken();
          await db
            .update(users)
            .set({ resetToken: token, resetTokenExpiry: expiresAt })
            .where(eq(users.id, created.userId));

          // Usa resultado real do SendGrid — requestPasswordReset mascara falhas com success:true
          if (isSendGridReady()) {
            const appUrl = process.env.APP_URL || "https://afumobile.com";
            const emailResult = await sendPasswordResetEmail(email, token, appUrl);
            emailEnviado = Boolean(emailResult.success);
          } else {
            emailEnviado = false;
          }
        } catch (e) {
          console.warn("[adminProdutores.convidar] reset email failed:", e);
          emailEnviado = false;
        }
      }

      const revealTemp = !emailEnviado && mayReturnTemporaryPassword();

      await auditProducerAction({
        actorUserId: ctx.user.id,
        action: "admin.producer.invite",
        resourceId: String(produtorId),
        organizationId,
        meta: {
          userId: created.userId,
          email,
          plano: input.plano,
          emailEnviado,
          mustChangePassword: true,
          temporaryPasswordReturned: revealTemp,
        },
      });

      return {
        success: true as const,
        userId: created.userId,
        produtorId,
        organizationId,
        emailEnviado,
        mustChangePassword: true as const,
        /**
         * Senha temporária: só se e-mail NÃO foi enviado e
         * (dev/non-prod OU ADMIN_INVITE_RETURN_TEMP_PASSWORD=1).
         * Em produção sem flag, use forgot-password / reenvio.
         */
        temporaryPassword: revealTemp ? tempPassword : undefined,
      };
    }),

  /** Soft deactivate: status perfil + cadastroAtivo=false. Nunca hard delete. */
  desativar: adminProcedure
    .input(
      z.object({
        produtorId: z.number().int().positive().optional(),
        userId: z.number().int().positive().optional(),
        modo: z.enum(["inativo", "suspenso"]).default("suspenso"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const detalhe = await getProdutorAdminDetalhe({
        produtorId: input.produtorId,
        userId: input.userId,
      });
      if (!detalhe) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produtor não encontrado" });
      }
      if (detalhe.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode desativar a própria conta por este painel.",
        });
      }

      await setStatusPerfilAfu(detalhe.usuarioAfuId, input.modo);
      if (detalhe.produtorId != null) {
        await setProdutorCadastroAtivo(detalhe.produtorId, false);
      }
      // Encerra sessões ativas — soft-deactivate passa a bloquear login/auth
      await revokeRefreshToken(detalhe.userId);

      await auditProducerAction({
        actorUserId: ctx.user.id,
        action: "admin.producer.deactivate",
        resourceId: String(detalhe.produtorId ?? detalhe.userId),
        organizationId: detalhe.organizationId,
        meta: { userId: detalhe.userId, modo: input.modo, refreshRevoked: true },
      });

      return {
        success: true as const,
        userId: detalhe.userId,
        produtorId: detalhe.produtorId,
        status: input.modo,
        cadastroAtivo: false,
      };
    }),

  reativar: adminProcedure
    .input(
      z.object({
        produtorId: z.number().int().positive().optional(),
        userId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const detalhe = await getProdutorAdminDetalhe({
        produtorId: input.produtorId,
        userId: input.userId,
      });
      if (!detalhe) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produtor não encontrado" });
      }

      await setStatusPerfilAfu(detalhe.usuarioAfuId, "ativo");
      let produtorId = detalhe.produtorId;
      if (produtorId != null) {
        await setProdutorCadastroAtivo(produtorId, true);
      } else {
        produtorId = await ensureProdutorRow({
          usuarioAfuId: detalhe.usuarioAfuId,
          organizationId: detalhe.organizationId,
        });
      }

      await auditProducerAction({
        actorUserId: ctx.user.id,
        action: "admin.producer.reactivate",
        resourceId: String(produtorId),
        organizationId: detalhe.organizationId,
        meta: { userId: detalhe.userId },
      });

      return {
        success: true as const,
        userId: detalhe.userId,
        produtorId,
        status: "ativo" as const,
        cadastroAtivo: true,
      };
    }),

  setPlano: adminProcedure
    .input(
      z.object({
        produtorId: z.number().int().positive(),
        plano: planoSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const detalhe = await getProdutorAdminDetalhe({ produtorId: input.produtorId });
      if (!detalhe || detalhe.produtorId == null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produtor não encontrado" });
      }
      await setProdutorPlano(detalhe.produtorId, input.plano);
      await auditProducerAction({
        actorUserId: ctx.user.id,
        action: "admin.producer.set_plano",
        resourceId: String(detalhe.produtorId),
        organizationId: detalhe.organizationId,
        meta: { planoAnterior: detalhe.plano, planoNovo: input.plano },
      });
      return { success: true as const, produtorId: detalhe.produtorId, plano: input.plano };
    }),

  setRole: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        role: z.enum(["user", "admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId && input.role === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode remover seu próprio acesso de administrador.",
        });
      }
      await setUserRole(input.userId, input.role);
      await auditProducerAction({
        actorUserId: ctx.user.id,
        action: "admin.producer.set_role",
        resourceId: String(input.userId),
        meta: { role: input.role },
      });
      return { success: true as const, userId: input.userId, role: input.role };
    }),

  setTipo: adminProcedure
    .input(
      z.object({
        perfilId: z.number().int().positive(),
        tipoUsuario: tipoSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await setTipoUsuarioAfu(input.perfilId, input.tipoUsuario);
      await auditProducerAction({
        actorUserId: ctx.user.id,
        action: "admin.producer.set_tipo",
        resourceId: String(input.perfilId),
        meta: { tipoUsuario: input.tipoUsuario },
      });
      return {
        success: true as const,
        perfilId: input.perfilId,
        tipoUsuario: input.tipoUsuario,
      };
    }),

  setCadastroAtivo: adminProcedure
    .input(
      z.object({
        produtorId: z.number().int().positive(),
        cadastroAtivo: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await setProdutorCadastroAtivo(input.produtorId, input.cadastroAtivo);
      await auditProducerAction({
        actorUserId: ctx.user.id,
        action: "admin.producer.set_cadastro",
        resourceId: String(input.produtorId),
        meta: { cadastroAtivo: input.cadastroAtivo },
      });
      return {
        success: true as const,
        produtorId: input.produtorId,
        cadastroAtivo: input.cadastroAtivo,
      };
    }),
});
