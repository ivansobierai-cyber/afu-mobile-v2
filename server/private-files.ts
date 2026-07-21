/**
 * Etapa 6 — arquivos privados, URLs temporárias e auditoria.
 */
import { and, eq, desc } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import {
  privateFiles,
  auditLogs,
  type InsertPrivateFile,
  type InsertAuditLog,
} from "../drizzle/schema";
import { getActiveMembership, resolveSessionOrganization } from "./db-organizations";
import { roleHasPermission, type OrgPermission } from "../lib/security/org-roles";
import { storageGetSignedUrl, storagePut } from "./storage";

export const DOWNLOAD_TOKEN_TTL_SEC = 5 * 60; // 5 minutos
const ORG_KEY_RE = /^org\/(\d+)\//;

export type FileCategory =
  | "relatorio"
  | "diagnostico"
  | "laudo"
  | "documento"
  | "foto"
  | "outro";

export type AuditAction =
  | "file.download"
  | "file.upload"
  | "report.generate"
  | "report.download"
  | "report.view"
  | "ai.invoke"
  | "ai.invoke_failed"
  | "sync.conflict"
  | "admin.access"
  | "admin.mutation"
  | "admin.break_glass"
  | "access.denied"
  | "access.granted"
  | "safra.close"
  | "safra.reopen"
  | "safra.write_blocked"
  | "property.archive"
  | "property.restore"
  | "property.delete"
  | "property.export";

/** Auditoria de tentativa bloqueada (cross-tenant / sem membership / sem permissão). */
export async function auditAccessDenied(opts: {
  actorUserId: number;
  organizationId?: number | null;
  resourceType: string;
  resourceId?: string;
  storageKey?: string;
  reason: string;
  code: "NOT_FOUND" | "FORBIDDEN" | "UNAUTHORIZED";
}): Promise<void> {
  await writeAuditLog({
    organizationId: opts.organizationId ?? null,
    actorUserId: opts.actorUserId,
    action: "access.denied",
    resourceType: opts.resourceType,
    resourceId: opts.resourceId,
    storageKey: opts.storageKey,
    meta: JSON.stringify({ reason: opts.reason, code: opts.code }),
  });
}

function getDownloadSecret(): Uint8Array {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return new TextEncoder().encode(secret);
}

/** Chave opaca: org/{organizationId}/{category}/{name} */
export function buildTenantStorageKey(
  organizationId: number,
  category: FileCategory,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `org/${organizationId}/${category}/${safe}`;
}

export function parseTenantOrgFromKey(storageKey: string): number | null {
  const m = storageKey.replace(/^\/+/, "").match(ORG_KEY_RE);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function proxyPathForKey(storageKey: string): string {
  return `/manus-storage/${storageKey.replace(/^\/+/, "")}`;
}

export async function registerPrivateFile(
  data: InsertPrivateFile,
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(privateFiles).values(data);
  return result[0].insertId;
}

export async function getPrivateFileByKey(storageKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const key = storageKey.replace(/^\/+/, "");
  const rows = await db
    .select()
    .from(privateFiles)
    .where(eq(privateFiles.storageKey, key))
    .limit(1);
  return rows[0];
}

export async function writeAuditLog(entry: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values(entry);
  } catch (err) {
    console.error("[audit] failed to write:", err);
  }
}

/**
 * Resolve organização dona do arquivo (prefixo ou registro private_files).
 */
export async function resolveFileOrganizationId(storageKey: string): Promise<number | null> {
  const fromKey = parseTenantOrgFromKey(storageKey);
  if (fromKey) return fromKey;
  const row = await getPrivateFileByKey(storageKey);
  return row?.organizationId ?? null;
}

/**
 * Autoriza download: membership ativo + permissão (default reports.read).
 * Platform admin (users.role=admin) pode acessar com auditoria (break-glass leve).
 */
export async function assertCanAccessStorageKey(opts: {
  userId: number;
  userRole?: string;
  storageKey: string;
  permission?: OrgPermission;
}): Promise<{ organizationId: number }> {
  const key = opts.storageKey.replace(/^\/+/, "");
  const organizationId = await resolveFileOrganizationId(key);
  if (organizationId == null) {
    // legado sem tenant — só platform admin
    if (opts.userRole === "admin") {
      await writeAuditLog({
        organizationId: null,
        actorUserId: opts.userId,
        action: "admin.break_glass",
        resourceType: "private_file",
        storageKey: key,
        meta: JSON.stringify({ reason: "legacy_key_no_org" }),
      });
      return { organizationId: 0 };
    }
    await auditAccessDenied({
      actorUserId: opts.userId,
      organizationId: null,
      resourceType: "private_file",
      storageKey: key,
      reason: "legacy_key_no_org",
      code: "NOT_FOUND",
    });
    throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado" });
  }

  const membership = await getActiveMembership(opts.userId, organizationId);
  if (!membership) {
    if (opts.userRole === "admin") {
      await writeAuditLog({
        organizationId,
        actorUserId: opts.userId,
        action: "admin.break_glass",
        resourceType: "private_file",
        storageKey: key,
        meta: JSON.stringify({ reason: "no_membership" }),
      });
      return { organizationId };
    }
    await auditAccessDenied({
      actorUserId: opts.userId,
      organizationId,
      resourceType: "private_file",
      storageKey: key,
      reason: "no_membership",
      code: "NOT_FOUND",
    });
    throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado" });
  }

  const perm = opts.permission ?? "reports.read";
  if (!roleHasPermission(membership.membership.role as any, perm) && opts.userRole !== "admin") {
    await auditAccessDenied({
      actorUserId: opts.userId,
      organizationId,
      resourceType: "private_file",
      storageKey: key,
      reason: `missing_permission:${perm}`,
      code: "FORBIDDEN",
    });
    throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para baixar este arquivo" });
  }
  if (!roleHasPermission(membership.membership.role as any, perm) && opts.userRole === "admin") {
    await writeAuditLog({
      organizationId,
      actorUserId: opts.userId,
      action: "admin.break_glass",
      resourceType: "private_file",
      storageKey: key,
      meta: JSON.stringify({ reason: "permission_bypass", permission: perm }),
    });
  }

  return { organizationId };
}

export async function issueDownloadToken(opts: {
  userId: number;
  organizationId: number;
  storageKey: string;
  ttlSec?: number;
}): Promise<{ token: string; expiresAt: Date }> {
  const ttl = opts.ttlSec ?? DOWNLOAD_TOKEN_TTL_SEC;
  const expiresAt = new Date(Date.now() + ttl * 1000);
  const token = await new SignJWT({
    tokenType: "file_download",
    userId: opts.userId,
    organizationId: opts.organizationId,
    storageKey: opts.storageKey.replace(/^\/+/, ""),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getDownloadSecret());
  return { token, expiresAt };
}

export async function verifyDownloadToken(token: string): Promise<{
  userId: number;
  organizationId: number;
  storageKey: string;
}> {
  try {
    const { payload } = await jwtVerify(token, getDownloadSecret());
    if (payload.tokenType !== "file_download") {
      throw new Error("invalid type");
    }
    const userId = Number(payload.userId);
    const organizationId = Number(payload.organizationId);
    const storageKey = String(payload.storageKey || "");
    if (!userId || !storageKey) throw new Error("invalid payload");
    return { userId, organizationId, storageKey };
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Link temporário inválido ou expirado" });
  }
}

/**
 * Emite URL temporária autenticada:
 * 1) Preferência: Forge signed GET (quando configurado)
 * 2) Fallback: /manus-storage/{key}?token=JWT (proxy autenticado)
 */
export async function createTemporaryDownloadUrl(opts: {
  userId: number;
  userRole?: string;
  storageKey: string;
  permission?: OrgPermission;
  baseUrl?: string;
  ip?: string;
  userAgent?: string;
  auditAction?: AuditAction;
  resourceType?: string;
  resourceId?: string;
}): Promise<{ url: string; expiresAt: Date; storageKey: string }> {
  const key = opts.storageKey.replace(/^\/+/, "").replace(/^manus-storage\//, "");
  const { organizationId } = await assertCanAccessStorageKey({
    userId: opts.userId,
    userRole: opts.userRole,
    storageKey: key,
    permission: opts.permission,
  });

  const { token, expiresAt } = await issueDownloadToken({
    userId: opts.userId,
    organizationId: organizationId || 0,
    storageKey: key,
  });

  let url: string;
  try {
    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      // Signed S3 — curto; ainda exigimos token de app no proxy se o cliente usar proxy
      const signed = await storageGetSignedUrl(key);
      url = signed;
    } else {
      const base = (opts.baseUrl || "").replace(/\/+$/, "");
      url = `${base}${proxyPathForKey(key)}?token=${encodeURIComponent(token)}`;
    }
  } catch {
    const base = (opts.baseUrl || "").replace(/\/+$/, "");
    url = `${base}${proxyPathForKey(key)}?token=${encodeURIComponent(token)}`;
  }

  // Sempre oferecer também proxy tokenizado como alternativa estável
  if (ENV.forgeApiUrl && ENV.forgeApiKey && opts.baseUrl) {
    // Prefer signed URL when available; audit still records download intent
  }

  await writeAuditLog({
    organizationId: organizationId || null,
    actorUserId: opts.userId,
    action: opts.auditAction ?? "file.download",
    resourceType: opts.resourceType ?? "private_file",
    resourceId: opts.resourceId,
    storageKey: key,
    ip: opts.ip,
    userAgent: opts.userAgent?.slice(0, 255),
    meta: JSON.stringify({ expiresAt: expiresAt.toISOString() }),
  });

  return { url, expiresAt, storageKey: key };
}

/** Upload tenant-scoped + registro em private_files */
export async function putPrivateFile(opts: {
  organizationId: number;
  category: FileCategory;
  filename: string;
  data: Buffer | string;
  contentType: string;
  createdByUserId: number;
  relatorioId?: number;
  diagnosticoId?: number;
  propriedadeId?: number;
}): Promise<{ key: string; proxyUrl: string; fileId: number }> {
  const relKey = buildTenantStorageKey(opts.organizationId, opts.category, opts.filename);
  const put = await storagePut(relKey, opts.data, opts.contentType);
  const sizeBytes =
    typeof opts.data === "string" ? Buffer.byteLength(opts.data) : opts.data.byteLength;
  const fileId = await registerPrivateFile({
    organizationId: opts.organizationId,
    storageKey: put.key,
    category: opts.category,
    contentType: opts.contentType,
    originalName: opts.filename,
    sizeBytes,
    relatorioId: opts.relatorioId,
    diagnosticoId: opts.diagnosticoId,
    propriedadeId: opts.propriedadeId,
    createdByUserId: opts.createdByUserId,
  });
  await writeAuditLog({
    organizationId: opts.organizationId,
    actorUserId: opts.createdByUserId,
    action: "file.upload",
    resourceType: opts.category,
    resourceId: String(fileId),
    storageKey: put.key,
    meta: JSON.stringify({ contentType: opts.contentType, sizeBytes }),
  });
  return { key: put.key, proxyUrl: put.url, fileId };
}

export async function listRecentAuditForOrg(organizationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/** Garante que o usuário ainda tem org ativa (para proxy com sessão) */
export async function requireActiveOrgForUser(userId: number): Promise<number> {
  const session = await resolveSessionOrganization(userId);
  if (!session.activeOrganizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Nenhuma organização ativa",
    });
  }
  return session.activeOrganizationId;
}

// silence unused import guard for and if needed later
void and;
