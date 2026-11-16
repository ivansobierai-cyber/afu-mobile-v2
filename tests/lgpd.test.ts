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
import { createUserWithEmail, getUsuarioCompletoById } from "../server/db-auth";
import { getDb } from "../server/db";
import { eq } from "drizzle-orm";
import { users, usuariosAfu } from "../drizzle/schema";
import { REQUIRED_PREPARE_TAGS } from "../scripts/lib/schema-prepare-core";

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
      clearCookie: () => undefined,
    } as unknown as TrpcContext["res"],
  };
}

describe("LGPD constants & helpers", () => {
  it("expõe versões placeholder e graça padrão", () => {
    expect(LGPD_TERMS_VERSION).toContain("placeholder");
    expect(LGPD_PRIVACY_VERSION).toContain("placeholder");
    expect(LGPD_DELETION_GRACE_DAYS).toBe(30);
    const info = getLgpdPublicInfo();
    expect(info.legalReviewRequired).toBe(true);
    expect(info.deletionGraceDays).toBe(30);
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

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB required");

    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const created = await createUserWithEmail({
      email: `lgpd_user_${suffix}@example.com`,
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
      termsVersion: LGPD_TERMS_VERSION,
      privacyVersion: LGPD_PRIVACY_VERSION,
      ip: "203.0.113.50",
      userAgent: "vitest",
    });
  }, 60_000);

  it("grava consentimentos de termos e privacidade", async () => {
    const consents = await listConsentsForUser(userId);
    expect(consents.length).toBeGreaterThanOrEqual(2);
    const types = consents.map((c) => c.documentType).sort();
    expect(types).toContain("terms");
    expect(types).toContain("privacy");
    expect(consents[0]?.ip).toBeTruthy();
  });

  it("exporta JSON do titular sem passwordHash/refreshToken", async () => {
    const payload = await exportUserData(userId);
    expect(payload.user.id).toBe(userId);
    expect(payload.user).not.toHaveProperty("passwordHash");
    expect(payload.user).not.toHaveProperty("refreshToken");
    expect(payload.consents.length).toBeGreaterThanOrEqual(2);
    expect(payload.formatVersion).toBe("1.0");
  });

  it("solicita exclusão agendada (sem hard-delete) e cancela", async () => {
    const row = await requestAccountDeletion({
      userId,
      reason: "teste wp-07",
      gracePeriodDays: 30,
      ip: "203.0.113.50",
    });
    expect(row.status).toBe("scheduled");
    expect(row.gracePeriodDays).toBe(30);
    expect(row.scheduledAnonymizeAt.getTime()).toBeGreaterThan(Date.now());

    const active = await getActiveDeletionRequest(userId);
    expect(active?.id).toBe(row.id);

    const completo = await getUsuarioCompletoById(userId);
    expect(completo?.status).toBe("suspenso");

    const cancelled = await cancelAccountDeletion({
      userId,
      requestId: row.id,
      actorUserId: userId,
    });
    expect(cancelled.status).toBe("cancelled");
    expect(await getActiveDeletionRequest(userId)).toBeNull();
  });

  it("anonimiza após force admin sem apagar a linha do usuário", async () => {
    const row = await requestAccountDeletion({
      userId,
      reason: "anonimizar teste",
      gracePeriodDays: 30,
    });
    const result = await anonymizeAccount({
      requestId: row.id,
      adminUserId: adminUserId,
      force: true,
      adminNotes: "vitest force",
    });
    expect(result.userId).toBe(userId);

    const db = await getDb();
    if (!db) throw new Error("DB required");
    const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    expect(u).toBeTruthy();
    expect(u!.email).toMatch(/^deleted_\d+@anonymized\.local$/);
    expect(u!.passwordHash).toBeNull();
    expect(u!.name).toContain("Anonimizado");

    const [perfil] = await db
      .select()
      .from(usuariosAfu)
      .where(eq(usuariosAfu.userId, userId))
      .limit(1);
    expect(perfil?.status).toBe("inativo");
  });

  it("auth.lgpd.export via tRPC caller", async () => {
    // cria usuário fresco pois o anterior foi anonimizado
    const suffix = `${Date.now()}_trpc`;
    const created = await createUserWithEmail({
      email: `lgpd_trpc_${suffix}@example.com`,
      password: "LgpdTest@1234",
      name: "TRPC LGPD",
      profile: "produtor",
    });
    await recordSignupConsents({ userId: created.userId });

    const db = await getDb();
    if (!db) throw new Error("DB required");
    const [user] = await db.select().from(users).where(eq(users.id, created.userId)).limit(1);
    const caller = appRouter.createCaller(minimalCtx(user!));
    const result = await caller.auth.lgpd.export();
    expect(result.success).toBe(true);
    expect(result.data.user.id).toBe(created.userId);
    expect(result.data.user).not.toHaveProperty("passwordHash");
  });

  it("signup exige acceptedTerms", async () => {
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
  });
});
