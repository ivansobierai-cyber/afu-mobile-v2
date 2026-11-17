/**
 * WP-08 — MFA TOTP business logic (enroll, verify, recovery, admin reset).
 */
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";
import { getDb } from "./db";
import { userMfa, users, usuariosAfu } from "../drizzle/schema";
import { writeAuditLog } from "./private-files";
import {
  MFA_ISSUER,
  MFA_REQUIRED_TIPOS,
  MFA_SETUP_REQUIRED_CODE,
} from "../lib/mfa/constants";
import {
  buildOtpAuthUri,
  generateTotpSecret,
  verifyTotp,
} from "./mfa-totp";
import {
  consumeRecoveryCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  parseRecoveryHashes,
  serializeRecoveryHashes,
} from "./mfa-crypto";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export type MfaPublicStatus = {
  enabled: boolean;
  enrolledAt: Date | null;
  recoveryCodesRemaining: number;
  requiredForRole: boolean;
  setupRequired: boolean;
};

export function isMfaRequiredTipo(
  tipoUsuario: string | null | undefined,
): boolean {
  if (!tipoUsuario) return false;
  return (MFA_REQUIRED_TIPOS as readonly string[]).includes(tipoUsuario);
}

export async function userRequiresMfaEnrollment(userId: number): Promise<boolean> {
  const db = await requireDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;
  if (user.role === "admin") return true;
  const [perfil] = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, userId))
    .limit(1);
  return isMfaRequiredTipo(perfil?.tipoUsuario);
}

export async function getMfaRow(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(userMfa).where(eq(userMfa.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getMfaPublicStatus(userId: number): Promise<MfaPublicStatus> {
  const row = await getMfaRow(userId);
  const requiredForRole = await userRequiresMfaEnrollment(userId);
  const enabled = Boolean(row?.totpEnabled);
  return {
    enabled,
    enrolledAt: row?.enrolledAt ?? null,
    recoveryCodesRemaining: row?.recoveryCodesRemaining ?? 0,
    requiredForRole,
    setupRequired: requiredForRole && !enabled,
  };
}

async function ensureMfaRow(userId: number) {
  const db = await requireDb();
  const existing = await getMfaRow(userId);
  if (existing) return existing;
  await db.insert(userMfa).values({ userId, totpEnabled: false });
  const created = await getMfaRow(userId);
  if (!created) throw new Error("Failed to create user_mfa row");
  return created;
}

/**
 * Start enrollment: create pending secret, return otpauth + QR (secret once).
 */
export async function beginMfaEnrollment(input: {
  userId: number;
  accountName: string;
}): Promise<{
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}> {
  const db = await requireDb();
  await ensureMfaRow(input.userId);
  const secret = generateTotpSecret();
  const pending = encryptTotpSecret(secret);
  await db
    .update(userMfa)
    .set({
      pendingSecretEncrypted: pending,
      updatedAt: new Date(),
    })
    .where(eq(userMfa.userId, input.userId));

  const otpauthUrl = buildOtpAuthUri({
    secretBase32: secret,
    accountName: input.accountName,
    issuer: MFA_ISSUER,
  });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
  });

  await writeAuditLog({
    actorUserId: input.userId,
    action: "mfa.enroll_begin",
    resourceType: "user_mfa",
    resourceId: String(input.userId),
    meta: JSON.stringify({ hasQr: true }),
  });

  return { secret, otpauthUrl, qrDataUrl };
}

/**
 * Confirm enrollment with first TOTP code; enables MFA and returns recovery codes once.
 */
export async function confirmMfaEnrollment(input: {
  userId: number;
  code: string;
}): Promise<{ recoveryCodes: string[]; enabled: true }> {
  const db = await requireDb();
  const row = await getMfaRow(input.userId);
  if (!row?.pendingSecretEncrypted) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Inicie a configuração MFA antes de confirmar o código",
    });
  }
  const secret = decryptTotpSecret(row.pendingSecretEncrypted);
  if (!verifyTotp(secret, input.code)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Código MFA inválido",
    });
  }

  const recoveryCodes = generateRecoveryCodes();
  const hashes = await hashRecoveryCodes(recoveryCodes);
  const now = new Date();

  await db
    .update(userMfa)
    .set({
      totpSecretEncrypted: encryptTotpSecret(secret),
      pendingSecretEncrypted: null,
      totpEnabled: true,
      recoveryCodesHash: serializeRecoveryHashes(hashes),
      recoveryCodesRemaining: hashes.length,
      enrolledAt: now,
      lastVerifiedAt: now,
      disabledAt: null,
      disabledByAdminUserId: null,
      updatedAt: now,
    })
    .where(eq(userMfa.userId, input.userId));

  await writeAuditLog({
    actorUserId: input.userId,
    action: "mfa.enroll_confirm",
    resourceType: "user_mfa",
    resourceId: String(input.userId),
    meta: JSON.stringify({ recoveryCodesIssued: recoveryCodes.length }),
  });

  return { recoveryCodes, enabled: true };
}

export async function disableMfaSelf(input: {
  userId: number;
  code: string;
}): Promise<{ success: true }> {
  const db = await requireDb();
  const row = await getMfaRow(input.userId);
  if (!row?.totpEnabled || !row.totpSecretEncrypted) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "MFA não está ativo" });
  }
  const secret = decryptTotpSecret(row.totpSecretEncrypted);
  const totpOk = verifyTotp(secret, input.code);
  let recoveryOk = false;
  let remainingHashes = parseRecoveryHashes(row.recoveryCodesHash);
  if (!totpOk) {
    const consumed = await consumeRecoveryCode(input.code, remainingHashes);
    if (consumed.ok) {
      recoveryOk = true;
      remainingHashes = consumed.remainingHashes;
    }
  }
  if (!totpOk && !recoveryOk) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Código MFA inválido" });
  }

  await db
    .update(userMfa)
    .set({
      totpEnabled: false,
      totpSecretEncrypted: null,
      pendingSecretEncrypted: null,
      recoveryCodesHash: recoveryOk
        ? serializeRecoveryHashes(remainingHashes)
        : null,
      recoveryCodesRemaining: recoveryOk ? remainingHashes.length : 0,
      disabledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userMfa.userId, input.userId));

  await writeAuditLog({
    actorUserId: input.userId,
    action: "mfa.disable_self",
    resourceType: "user_mfa",
    resourceId: String(input.userId),
    meta: JSON.stringify({ via: totpOk ? "totp" : "recovery" }),
  });

  return { success: true };
}

export async function regenerateRecoveryCodes(input: {
  userId: number;
  code: string;
}): Promise<{ recoveryCodes: string[] }> {
  const db = await requireDb();
  const row = await getMfaRow(input.userId);
  if (!row?.totpEnabled || !row.totpSecretEncrypted) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "MFA não está ativo" });
  }
  const secret = decryptTotpSecret(row.totpSecretEncrypted);
  if (!verifyTotp(secret, input.code)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Código MFA inválido" });
  }
  const recoveryCodes = generateRecoveryCodes();
  const hashes = await hashRecoveryCodes(recoveryCodes);
  await db
    .update(userMfa)
    .set({
      recoveryCodesHash: serializeRecoveryHashes(hashes),
      recoveryCodesRemaining: hashes.length,
      updatedAt: new Date(),
    })
    .where(eq(userMfa.userId, input.userId));

  await writeAuditLog({
    actorUserId: input.userId,
    action: "mfa.recovery_regenerate",
    resourceType: "user_mfa",
    resourceId: String(input.userId),
    meta: JSON.stringify({ count: recoveryCodes.length }),
  });

  return { recoveryCodes };
}

/**
 * Verify TOTP or recovery code for an MFA-enabled user (login challenge).
 */
export async function verifyMfaLoginCode(input: {
  userId: number;
  code: string;
}): Promise<{ ok: true; via: "totp" | "recovery" }> {
  const db = await requireDb();
  const row = await getMfaRow(input.userId);
  if (!row?.totpEnabled || !row.totpSecretEncrypted) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MFA não está ativo para este usuário",
    });
  }
  const secret = decryptTotpSecret(row.totpSecretEncrypted);
  if (verifyTotp(secret, input.code)) {
    await db
      .update(userMfa)
      .set({ lastVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(userMfa.userId, input.userId));
    await writeAuditLog({
      actorUserId: input.userId,
      action: "mfa.verify_login",
      resourceType: "user_mfa",
      resourceId: String(input.userId),
      meta: JSON.stringify({ via: "totp" }),
    });
    return { ok: true, via: "totp" };
  }

  const hashes = parseRecoveryHashes(row.recoveryCodesHash);
  const consumed = await consumeRecoveryCode(input.code, hashes);
  if (!consumed.ok) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Código MFA inválido" });
  }
  await db
    .update(userMfa)
    .set({
      recoveryCodesHash: serializeRecoveryHashes(consumed.remainingHashes),
      recoveryCodesRemaining: consumed.remainingHashes.length,
      lastVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userMfa.userId, input.userId));
  await writeAuditLog({
    actorUserId: input.userId,
    action: "mfa.verify_login",
    resourceType: "user_mfa",
    resourceId: String(input.userId),
    meta: JSON.stringify({
      via: "recovery",
      remaining: consumed.remainingHashes.length,
    }),
  });
  return { ok: true, via: "recovery" };
}

export async function adminResetMfa(input: {
  targetUserId: number;
  adminUserId: number;
  reason?: string;
}): Promise<{ success: true }> {
  const db = await requireDb();
  await ensureMfaRow(input.targetUserId);
  await db
    .update(userMfa)
    .set({
      totpEnabled: false,
      totpSecretEncrypted: null,
      pendingSecretEncrypted: null,
      recoveryCodesHash: null,
      recoveryCodesRemaining: 0,
      disabledAt: new Date(),
      disabledByAdminUserId: input.adminUserId,
      updatedAt: new Date(),
    })
    .where(eq(userMfa.userId, input.targetUserId));

  await writeAuditLog({
    actorUserId: input.adminUserId,
    action: "mfa.admin_reset",
    resourceType: "user_mfa",
    resourceId: String(input.targetUserId),
    meta: JSON.stringify({
      reason: input.reason ?? null,
      targetUserId: input.targetUserId,
    }),
  });

  return { success: true };
}

/**
 * Used by adminProcedure — admins must have MFA enabled (except MFA setup paths).
 *
 * Enforcement is on by default. Set `MFA_ADMIN_ENFORCE=0` to disable
 * (Vitest / emergency break-glass). Production should leave it unset.
 */
export async function assertAdminMfaSatisfied(input: {
  userId: number;
  path: string;
}): Promise<void> {
  if (process.env.MFA_ADMIN_ENFORCE === "0") {
    return;
  }
  // Enrollment uses protectedProcedure (not adminProcedure); no path exempt here.
  void input.path;
  try {
    const status = await getMfaPublicStatus(input.userId);
    if (status.setupRequired) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Configure MFA (TOTP) antes de usar funções administrativas. Código: ${MFA_SETUP_REQUIRED_CODE}`,
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    // Tabela ainda não migrada / DB parcial — não derruba admin legado.
    console.warn("[mfa] assertAdminMfaSatisfied skipped:", err);
  }
}

export async function isMfaEnabled(userId: number): Promise<boolean> {
  const row = await getMfaRow(userId);
  return Boolean(row?.totpEnabled && row.totpSecretEncrypted);
}
