/**
 * WP-07 — LGPD operacional: consentimento, exportação e exclusão agendada.
 * Nunca faz hard-delete de conta. Anonimização só após período de graça.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import { getDb } from "./db";
import { writeAuditLog } from "./private-files";
import { revokeRefreshToken } from "./token-service";
import {
  LGPD_DELETION_GRACE_DAYS,
  LGPD_PRIVACY_VERSION,
  LGPD_TERMS_VERSION,
} from "../lib/lgpd/constants";
import {
  auditLogs,
  culturas,
  diagnosticosIa,
  lgpdConsentRecords,
  lgpdDeletionRequests,
  produtores,
  propriedades,
  users,
  usuariosAfu,
  type InsertLgpdConsentRecord,
  type LgpdDeletionRequest,
} from "../drizzle/schema";

export type ClientRequestMeta = {
  ip: string | null;
  userAgent: string | null;
};

export function extractClientMeta(req: Request | { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } }): ClientRequestMeta {
  const headers = req.headers ?? {};
  const xf = headers["x-forwarded-for"];
  let ip: string | null = null;
  if (typeof xf === "string" && xf.trim()) {
    ip = xf.split(",")[0]?.trim() || null;
  } else if (Array.isArray(xf) && xf[0]) {
    ip = String(xf[0]).split(",")[0]?.trim() || null;
  } else if ("socket" in req && req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress;
  } else if ("ip" in req && typeof (req as { ip?: string }).ip === "string") {
    ip = (req as { ip: string }).ip;
  }
  const ua = headers["user-agent"];
  const userAgent = typeof ua === "string" ? ua.slice(0, 255) : null;
  return { ip, userAgent };
}

function addDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function recordConsent(opts: {
  userId: number;
  documentType: "terms" | "privacy";
  documentVersion: string;
  source?: string;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

  const values: InsertLgpdConsentRecord = {
    userId: opts.userId,
    documentType: opts.documentType,
    documentVersion: opts.documentVersion,
    acceptedAt: new Date(),
    ip: opts.ip ?? null,
    userAgent: opts.userAgent ?? null,
    source: opts.source ?? "signup",
    meta: opts.meta ? JSON.stringify(opts.meta) : null,
  };

  const result = await db.insert(lgpdConsentRecords).values(values);
  const id = Number(result[0].insertId);

  await writeAuditLog({
    actorUserId: opts.userId,
    action: "lgpd.consent",
    resourceType: "lgpd_consent",
    resourceId: String(id),
    ip: opts.ip ?? undefined,
    userAgent: opts.userAgent ?? undefined,
    meta: JSON.stringify({
      documentType: opts.documentType,
      documentVersion: opts.documentVersion,
      source: opts.source ?? "signup",
    }),
  });

  return id;
}

export async function recordSignupConsents(opts: {
  userId: number;
  termsVersion?: string;
  privacyVersion?: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ termsId: number; privacyId: number }> {
  const termsVersion = opts.termsVersion || LGPD_TERMS_VERSION;
  const privacyVersion = opts.privacyVersion || LGPD_PRIVACY_VERSION;
  const termsId = await recordConsent({
    userId: opts.userId,
    documentType: "terms",
    documentVersion: termsVersion,
    source: "signup",
    ip: opts.ip,
    userAgent: opts.userAgent,
  });
  const privacyId = await recordConsent({
    userId: opts.userId,
    documentType: "privacy",
    documentVersion: privacyVersion,
    source: "signup",
    ip: opts.ip,
    userAgent: opts.userAgent,
  });
  return { termsId, privacyId };
}

export async function listConsentsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(lgpdConsentRecords)
    .where(eq(lgpdConsentRecords.userId, userId))
    .orderBy(desc(lgpdConsentRecords.acceptedAt));
}

export async function getActiveDeletionRequest(userId: number): Promise<LgpdDeletionRequest | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(lgpdDeletionRequests)
    .where(
      and(
        eq(lgpdDeletionRequests.userId, userId),
        inArray(lgpdDeletionRequests.status, ["pending", "scheduled"]),
      ),
    )
    .orderBy(desc(lgpdDeletionRequests.requestedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function exportUserData(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
  }

  const [perfil] = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, userId))
    .limit(1);

  let produtor: (typeof produtores.$inferSelect) | null = null;
  let props: (typeof propriedades.$inferSelect)[] = [];
  let cultivosRows: (typeof culturas.$inferSelect)[] = [];
  let diagnosticos: (typeof diagnosticosIa.$inferSelect)[] = [];
  if (perfil) {
    const prodRows = await db
      .select()
      .from(produtores)
      .where(eq(produtores.usuarioId, perfil.id))
      .limit(1);
    produtor = prodRows[0] ?? null;
    if (produtor) {
      props = await db
        .select()
        .from(propriedades)
        .where(eq(propriedades.produtorId, produtor.id));
      const propIds = props.map((p) => p.id);
      if (propIds.length > 0) {
        cultivosRows = await db
          .select()
          .from(culturas)
          .where(inArray(culturas.propriedadeId, propIds));
      }
    }
    diagnosticos = await db
      .select()
      .from(diagnosticosIa)
      .where(eq(diagnosticosIa.usuarioId, perfil.id));
  }

  const consents = await listConsentsForUser(userId);
  const deletionReqs = await db
    .select()
    .from(lgpdDeletionRequests)
    .where(eq(lgpdDeletionRequests.userId, userId))
    .orderBy(desc(lgpdDeletionRequests.requestedAt));

  const audits = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.actorUserId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  const { passwordHash: _ph, refreshToken: _rt, resetToken: _rst, ...userSafe } = user;

  const payload = {
    exportedAt: new Date().toISOString(),
    formatVersion: "1.0",
    notice:
      "Exportação LGPD (portabilidade). PLACEHOLDER jurídico — validar escopo com DPO/assessoria.",
    user: userSafe,
    perfilAfu: perfil ?? null,
    produtor,
    propriedades: props,
    cultivos: cultivosRows,
    diagnosticos,
    consents,
    deletionRequests: deletionReqs,
    recentAuditLogs: audits,
  };

  await writeAuditLog({
    actorUserId: userId,
    action: "lgpd.export",
    resourceType: "user",
    resourceId: String(userId),
    meta: JSON.stringify({
      propriedades: props.length,
      cultivos: cultivosRows.length,
      diagnosticos: diagnosticos.length,
    }),
  });

  return payload;
}

export async function requestAccountDeletion(opts: {
  userId: number;
  reason?: string;
  gracePeriodDays?: number;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<LgpdDeletionRequest> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

  const existing = await getActiveDeletionRequest(opts.userId);
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Já existe solicitação de exclusão (#${existing.id}) com status ${existing.status}. Cancele-a antes de criar outra.`,
    });
  }

  const grace = opts.gracePeriodDays ?? LGPD_DELETION_GRACE_DAYS;
  const now = new Date();
  const scheduledAnonymizeAt = addDays(now, grace);

  const result = await db.insert(lgpdDeletionRequests).values({
    userId: opts.userId,
    status: "scheduled",
    reason: opts.reason?.slice(0, 2000) || null,
    gracePeriodDays: grace,
    requestedAt: now,
    scheduledAnonymizeAt,
    ip: opts.ip ?? null,
    userAgent: opts.userAgent ?? null,
  });
  const id = Number(result[0].insertId);

  // Suspende login imediatamente (soft) — dados permanecem até anonimização
  const [perfil] = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, opts.userId))
    .limit(1);
  if (perfil) {
    await db
      .update(usuariosAfu)
      .set({ status: "suspenso" })
      .where(eq(usuariosAfu.id, perfil.id));
  }
  await revokeRefreshToken(opts.userId);

  await writeAuditLog({
    actorUserId: opts.userId,
    action: "lgpd.erase_request",
    resourceType: "lgpd_deletion_request",
    resourceId: String(id),
    ip: opts.ip ?? undefined,
    userAgent: opts.userAgent ?? undefined,
    meta: JSON.stringify({
      gracePeriodDays: grace,
      scheduledAnonymizeAt: scheduledAnonymizeAt.toISOString(),
    }),
  });

  const [row] = await db
    .select()
    .from(lgpdDeletionRequests)
    .where(eq(lgpdDeletionRequests.id, id))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao ler solicitação criada" });
  }
  return row;
}

export async function cancelAccountDeletion(opts: {
  userId: number;
  requestId?: number;
  actorUserId: number;
  isAdmin?: boolean;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<LgpdDeletionRequest> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

  const active = opts.requestId
    ? (
        await db
          .select()
          .from(lgpdDeletionRequests)
          .where(eq(lgpdDeletionRequests.id, opts.requestId))
          .limit(1)
      )[0]
    : await getActiveDeletionRequest(opts.userId);

  if (!active || !["pending", "scheduled"].includes(active.status)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma solicitação ativa para cancelar" });
  }
  if (!opts.isAdmin && active.userId !== opts.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para cancelar esta solicitação" });
  }

  await db
    .update(lgpdDeletionRequests)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(lgpdDeletionRequests.id, active.id));

  const [perfil] = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, active.userId))
    .limit(1);
  if (perfil && perfil.status === "suspenso") {
    await db
      .update(usuariosAfu)
      .set({ status: "ativo" })
      .where(eq(usuariosAfu.id, perfil.id));
  }

  await writeAuditLog({
    actorUserId: opts.actorUserId,
    action: "lgpd.erase_cancel",
    resourceType: "lgpd_deletion_request",
    resourceId: String(active.id),
    ip: opts.ip ?? undefined,
    userAgent: opts.userAgent ?? undefined,
  });

  const [row] = await db
    .select()
    .from(lgpdDeletionRequests)
    .where(eq(lgpdDeletionRequests.id, active.id))
    .limit(1);
  return row!;
}

/**
 * Anonimiza dados pessoais do titular. NUNCA hard-delete.
 * Só processa se status scheduled/pending e scheduledAnonymizeAt <= now (ou forceAdmin).
 */
export async function anonymizeAccount(opts: {
  requestId: number;
  adminUserId: number;
  force?: boolean;
  adminNotes?: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ requestId: number; userId: number }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

  const [reqRow] = await db
    .select()
    .from(lgpdDeletionRequests)
    .where(eq(lgpdDeletionRequests.id, opts.requestId))
    .limit(1);
  if (!reqRow) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada" });
  }
  if (!["pending", "scheduled"].includes(reqRow.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Solicitação em status ${reqRow.status} não pode ser anonimizada`,
    });
  }
  if (!opts.force && reqRow.scheduledAnonymizeAt.getTime() > Date.now()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Período de graça ativo até ${reqRow.scheduledAnonymizeAt.toISOString()}. Use force apenas com base legal/admin.`,
    });
  }

  const userId = reqRow.userId;
  const anonEmail = `deleted_${userId}@anonymized.local`;
  const anonName = `Usuario Anonimizado ${userId}`;

  await db
    .update(users)
    .set({
      email: anonEmail,
      name: anonName,
      passwordHash: null,
      refreshToken: null,
      refreshTokenExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
      openId: `anon_${userId}_${Date.now()}`,
    })
    .where(eq(users.id, userId));

  const [perfil] = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, userId))
    .limit(1);
  if (perfil) {
    await db
      .update(usuariosAfu)
      .set({
        nome: anonName,
        email: anonEmail,
        telefone: null,
        registroProfissional: null,
        cargo: null,
        status: "inativo",
      })
      .where(eq(usuariosAfu.id, perfil.id));

    const [prod] = await db
      .select()
      .from(produtores)
      .where(eq(produtores.usuarioId, perfil.id))
      .limit(1);
    if (prod) {
      await db
        .update(produtores)
        .set({
          documento: null,
          cidade: null,
          estado: null,
          regiao: null,
          cadastroAtivo: false,
        })
        .where(eq(produtores.id, prod.id));
    }
  }

  await revokeRefreshToken(userId);

  await db
    .update(lgpdDeletionRequests)
    .set({
      status: "anonymized",
      processedAt: new Date(),
      processedByAdminUserId: opts.adminUserId,
      adminNotes: opts.adminNotes ?? null,
    })
    .where(eq(lgpdDeletionRequests.id, opts.requestId));

  await writeAuditLog({
    actorUserId: opts.adminUserId,
    action: "lgpd.anonymize",
    resourceType: "lgpd_deletion_request",
    resourceId: String(opts.requestId),
    ip: opts.ip ?? undefined,
    userAgent: opts.userAgent ?? undefined,
    meta: JSON.stringify({
      targetUserId: userId,
      force: Boolean(opts.force),
    }),
  });

  return { requestId: opts.requestId, userId };
}

export async function listDeletionRequests(opts?: {
  status?: LgpdDeletionRequest["status"];
  userId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const conditions = [];
  if (opts?.status) conditions.push(eq(lgpdDeletionRequests.status, opts.status));
  if (opts?.userId != null) conditions.push(eq(lgpdDeletionRequests.userId, opts.userId));
  if (conditions.length === 0) {
    return db
      .select()
      .from(lgpdDeletionRequests)
      .orderBy(desc(lgpdDeletionRequests.requestedAt))
      .limit(limit)
      .offset(offset);
  }
  return db
    .select()
    .from(lgpdDeletionRequests)
    .where(conditions.length === 1 ? conditions[0]! : and(...conditions))
    .orderBy(desc(lgpdDeletionRequests.requestedAt))
    .limit(limit)
    .offset(offset);
}

export function getLgpdPublicInfo() {
  return {
    termsVersion: LGPD_TERMS_VERSION,
    privacyVersion: LGPD_PRIVACY_VERSION,
    deletionGraceDays: LGPD_DELETION_GRACE_DAYS,
    legalReviewRequired: true,
    notice:
      "Textos legais e prazos são PLACEHOLDER para revisão jurídica (LGPD / Play Store Data Safety).",
  };
}
