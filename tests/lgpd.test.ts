/**
 * WP-07 — LGPD: consentimento, exportação e exclusão agendada (sem hard-delete).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import {
  LGPD_DELETION_GRACE_DAYS,
  LGPD_PRIVACY_VERSION,
  LGPD_TERMS_VERSION,
} from "../lib/lgpd/constants";
import {
  extractClientMeta,
  getLgpdPublicInfo,
  recordSignupConsents,
  listConsentsForUser,
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
  anonymizeAccount,
  getActiveDeletionRequest,
} from "../server/lgpd";
import { assertAccountActive, getAccountStatus } from "../server/lgpd-account-active";
import { createUserWithEmail, getUsuarioCompletoById, setStatusPerfilAfu } from "../server/db-auth";
import { getDb } from "../server/db";
import { eq } from "drizzle-orm";
import { lgpdConsentRecords, lgpdDeletionRequests, users, usuariosAfu } from "../drizzle/schema";
import { REQUIRED_PREPARE_TAGS } from "../scripts/lib/schema-prepare-core";
import { writeAuditLog } from "../server/private-files";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const hasDb = Boolean(process.env.DATABASE_URL);

function minimalCtx(user?: TrpcContext["user"]): TrpcContext {
  return {
    user: user ?? null,
    req: {
      protocol: "http",
      hostname: "localhost",
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "user-agent": "vitest-lgpd/1.0",
      },
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {
      setHeader: () => undefined,
      cookie: () => undefined,
      clearCookie: () => undefined,
    } as unknown as TrpcContext["res"],
  };
}

describe("LGPD constants & helpers", () => {
  it("expõe versões placeholder, graça e modo manual de anonimização", () => {
    expect(LGPD_TERMS_VERSION).toContain("placeholder");
    expect(LGPD_PRIVACY_VERSION).toContain("placeholder");
    expect(LGPD_DELETION_GRACE_DAYS).toBe(30);
    const info = getLgpdPublicInfo();
    expect(info.legalReviewRequired).toBe(true);
    expect(info.deletionGraceDays).toBe(30);
    expect(info.anonymizationMode).toBe("manual_admin");
  });

  it("extractClientMeta lê X-Forwarded-For e User-Agent", () => {
    const meta = extractClientMeta({
      headers: {
        "x-forwarded-for": "198.51.100.20, 192.168.1.1",
        "user-agent": "AFU-Test",
      },
    });
    expect(meta.ip).toBe("198.51.100.20");
    expect(meta.userAgent).toBe("AFU-Test");
  });

  it("schema prepare inclui tag 0043_lgpd_compliance", () => {
    expect(REQUIRED_PREPARE_TAGS).toContain("0043_lgpd_compliance");
  });

  it("vercel redireciona /privacidade e /termos para /legal/*", () => {
    const raw = readFileSync(join(__dirname, "..", "vercel.json"), "utf8");
    const cfg = JSON.parse(raw) as { redirects: Array<{ source: string; destination: string }> };
    const sources = cfg.redirects.map((r) => r.source);
    expect(sources).toContain("/privacidade");
    expect(sources).toContain("/termos");
    expect(cfg.redirects.find((r) => r.source === "/privacidade")?.destination).toBe(
      "/legal/privacidade",
    );
    expect(cfg.redirects.find((r) => r.source === "/termos")?.destination).toBe("/legal/termos");
  });

  it("auth.lgpd.info é público via caller", async () => {
    const caller = appRouter.createCaller(minimalCtx());
    const info = await caller.auth.lgpd.info();
    expect(info.termsVersion).toBe(LGPD_TERMS_VERSION);
    expect(info.privacyVersion).toBe(LGPD_PRIVACY_VERSION);
  });
});

describe.skipIf(!hasDb)("LGPD integração MySQL", () => {
  let userId: number;
  let adminUserId: number;
  let userEmail: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB required");

    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    userEmail = `lgpd_user_${suffix}@example.com`;
    const created = await createUserWithEmail({
      email: userEmail,
      password: "LgpdTest@1234",
      name: "Titular LGPD",
      profile: "produtor",
    });
    userId = created.userId;

    const admin = await createUserWithEmail({
      email: `lgpd_admin_${suffix}@example.com`,
      password: "LgpdAdmin@1234",
      name: "Admin LGPD",
      profile: "administrador",
    });
    adminUserId = admin.userId;

    await recordSignupConsents({
      userId,
      ip: "203.0.113.50",
      userAgent: "vitest",
    });
  }, 60_000);

  it("grava consentimentos com versões canônicas do servidor", async () => {
    const consents = await listConsentsForUser(userId);
    expect(consents.length).toBeGreaterThanOrEqual(2);
    expect(consents.some((c) => c.documentType === "terms" && c.documentVersion === LGPD_TERMS_VERSION)).toBe(
      true,
    );
    expect(
      consents.some((c) => c.documentType === "privacy" && c.documentVersion === LGPD_PRIVACY_VERSION),
    ).toBe(true);
  });

  it("exporta JSON do titular sem passwordHash e sem audit de terceiros", async () => {
    await writeAuditLog({
      actorUserId: userId,
      action: "admin.mutation",
      resourceType: "user",
      resourceId: "999999",
      meta: JSON.stringify({ invitedEmail: "outro@example.com", secret: "leak" }),
      ip: "1.2.3.4",
    });
    await writeAuditLog({
      actorUserId: userId,
      action: "lgpd.export",
      resourceType: "user",
      resourceId: String(userId),
      meta: JSON.stringify({ ok: true }),
    });

    const payload = await exportUserData(userId);
    expect(payload.user.id).toBe(userId);
    expect(payload.user).not.toHaveProperty("passwordHash");
    expect(payload.user).not.toHaveProperty("refreshToken");
    const leaked = payload.recentAuditLogs.some(
      (a) => typeof a.meta === "string" && a.meta.includes("outro@example.com"),
    );
    expect(leaked).toBe(false);
    expect(payload.recentAuditLogs.every((a) => a.action.startsWith("lgpd.") || a.resourceId === String(userId) || a.resourceType?.startsWith("lgpd"))).toBe(true);
  });

  it("solicita exclusão, restaura previousStatus e permite cancelEraseWithCredentials", async () => {
    const row = await requestAccountDeletion({
      userId,
      reason: "teste wp-07",
      gracePeriodDays: 30,
      ip: "203.0.113.50",
    });
    expect(row.status).toBe("scheduled");
    expect(row.previousStatusPerfil).toBe("ativo");
    expect(row.scheduledAnonymizeAt.getTime()).toBeGreaterThan(Date.now());

    const account = await getAccountStatus(userId);
    expect(account.status).toBe("suspenso");
    expect(account.pendingErasure).toBe(true);
    await expect(assertAccountActive(userId, { allowPendingErasure: true })).resolves.toBeTruthy();
    await expect(assertAccountActive(userId, { allowPendingErasure: false })).rejects.toThrow(/suspensa/i);

    const caller = appRouter.createCaller(minimalCtx());
    const cancelled = await caller.auth.lgpd.cancelEraseWithCredentials({
      email: userEmail,
      password: "LgpdTest@1234",
      confirm: true,
    });
    expect(cancelled.request.status).toBe("cancelled");
    expect(await getActiveDeletionRequest(userId)).toBeNull();
    const after = await getUsuarioCompletoById(userId);
    expect(after?.status).toBe("ativo");
  });

  it("cancel restaura suspensão administrativa prévia (não força ativo)", async () => {
    const suffix = `${Date.now()}_prev`;
    const created = await createUserWithEmail({
      email: `lgpd_prev_${suffix}@example.com`,
      password: "LgpdTest@1234",
      name: "Prev Status",
      profile: "produtor",
    });
    const completo = await getUsuarioCompletoById(created.userId);
    await setStatusPerfilAfu(completo!.perfilId!, "suspenso");

    const row = await requestAccountDeletion({
      userId: created.userId,
      reason: "ja estava suspenso",
    });
    expect(row.previousStatusPerfil).toBe("suspenso");

    await cancelAccountDeletion({
      userId: created.userId,
      requestId: row.id,
      actorUserId: created.userId,
    });
    const after = await getUsuarioCompletoById(created.userId);
    expect(after?.status).toBe("suspenso");
  });

  it("anonimiza em transaction: limpa ip/ua LGPD e não hard-delete", async () => {
    const suffix = `${Date.now()}_anon`;
    const created = await createUserWithEmail({
      email: `lgpd_anon_${suffix}@example.com`,
      password: "LgpdTest@1234",
      name: "Anon Target",
      profile: "produtor",
    });
    await recordSignupConsents({
      userId: created.userId,
      ip: "198.51.100.9",
      userAgent: "to-clear",
    });
    const row = await requestAccountDeletion({
      userId: created.userId,
      reason: "anonimizar teste",
      gracePeriodDays: 30,
      ip: "198.51.100.9",
      userAgent: "to-clear",
    });
    const result = await anonymizeAccount({
      requestId: row.id,
      adminUserId: adminUserId,
      force: true,
      adminNotes: "vitest force",
    });
    expect(result.userId).toBe(created.userId);

    const db = await getDb();
    if (!db) throw new Error("DB required");
    const [u] = await db.select().from(users).where(eq(users.id, created.userId)).limit(1);
    expect(u!.email).toMatch(/^deleted_\d+@anonymized\.local$/);
    expect(u!.passwordHash).toBeNull();

    const consents = await db
      .select()
      .from(lgpdConsentRecords)
      .where(eq(lgpdConsentRecords.userId, created.userId));
    expect(consents.every((c) => c.ip == null && c.userAgent == null)).toBe(true);

    const [del] = await db
      .select()
      .from(lgpdDeletionRequests)
      .where(eq(lgpdDeletionRequests.id, row.id))
      .limit(1);
    expect(del!.status).toBe("anonymized");
    expect(del!.ip).toBeNull();
    expect(del!.userAgent).toBeNull();

    const [perfil] = await db
      .select()
      .from(usuariosAfu)
      .where(eq(usuariosAfu.userId, created.userId))
      .limit(1);
    expect(perfil?.status).toBe("inativo");
  });

  it("signup exige acceptedTerms e grava versões do servidor", async () => {
    const caller = appRouter.createCaller(minimalCtx());
    await expect(
      caller.auth.signup({
        email: `no_terms_${Date.now()}@example.com`,
        password: "SecurePass1",
        confirmPassword: "SecurePass1",
        name: "Sem Termos",
        profile: "produtor",
        // @ts-expect-error — acceptedTerms obrigatório
        acceptedTerms: false,
      }),
    ).rejects.toThrow();

    const email = `ok_terms_${Date.now()}@example.com`;
    const result = await caller.auth.signup({
      email,
      password: "SecurePass1",
      confirmPassword: "SecurePass1",
      name: "Com Termos",
      profile: "produtor",
      acceptedTerms: true,
    });
    expect(result.success).toBe(true);
    const consents = await listConsentsForUser(result.user.id);
    expect(consents.some((c) => c.documentVersion === LGPD_TERMS_VERSION)).toBe(true);
  });

});
