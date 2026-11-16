/**
 * WP-08 — MFA integração MySQL (enroll, login challenge, recovery, admin reset).
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import { createUserWithEmail } from "../server/db-auth";
import { generateTotp } from "../server/mfa-totp";
import { decryptTotpSecret } from "../server/mfa-crypto";
import { getMfaRow } from "../server/mfa";
import { REQUIRED_PREPARE_TAGS } from "../scripts/lib/schema-prepare-core";
import { MFA_SETUP_REQUIRED_CODE } from "../lib/mfa/constants";

const hasDb = Boolean(process.env.DATABASE_URL);

function minimalCtx(user?: TrpcContext["user"]): TrpcContext {
  return {
    user: user ?? null,
    req: {
      protocol: "http",
      hostname: "localhost",
      headers: { "user-agent": "vitest-mfa/1.0" },
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {
      setHeader: () => undefined,
      cookie: () => undefined,
      clearCookie: () => undefined,
    } as unknown as TrpcContext["res"],
  };
}

describe("MFA constants wiring", () => {
  it("prepare tags inclui 0045", () => {
    expect(REQUIRED_PREPARE_TAGS).toContain("0045_mfa_totp");
  });
});

describe.skipIf(!hasDb)("MFA integração MySQL", () => {
  let adminUser: NonNullable<TrpcContext["user"]>;
  let otherAdminUser: NonNullable<TrpcContext["user"]>;
  let adminEmail: string;
  let adminPassword: string;
  let producerEmail: string;
  let producerPassword: string;
  let recoveryCodes: string[] = [];
  let savedEnforce: string | undefined;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "vitest_mfa_integration_secret_key!";
    }

    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    adminEmail = `mfa_admin_${suffix}@example.com`;
    adminPassword = "MfaAdmin@1234";
    producerEmail = `mfa_prod_${suffix}@example.com`;
    producerPassword = "MfaProd@1234";

    const admin = await createUserWithEmail({
      email: adminEmail,
      password: adminPassword,
      name: "Admin MFA",
      profile: "administrador",
    });
    const other = await createUserWithEmail({
      email: `mfa_admin2_${suffix}@example.com`,
      password: "MfaAdmin2@1234",
      name: "Admin MFA 2",
      profile: "administrador",
    });
    await createUserWithEmail({
      email: producerEmail,
      password: producerPassword,
      name: "Produtor MFA",
      profile: "produtor",
    });

    const { getDb } = await import("../server/db");
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("DB required");

    const load = async (id: number) => {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!row) throw new Error("user missing");
      return row as NonNullable<TrpcContext["user"]>;
    };

    adminUser = await load(admin.userId);
    otherAdminUser = await load(other.userId);
  }, 120_000);

  afterEach(() => {
    if (savedEnforce !== undefined) {
      process.env.MFA_ADMIN_ENFORCE = savedEnforce;
      savedEnforce = undefined;
    }
  });

  it("admin sem MFA é bloqueado em adminProcedure quando enforce=1", async () => {
    savedEnforce = process.env.MFA_ADMIN_ENFORCE;
    process.env.MFA_ADMIN_ENFORCE = "1";
    const caller = appRouter.createCaller(minimalCtx(adminUser));
    await expect(caller.auth.admin.stats.usuarios()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining(MFA_SETUP_REQUIRED_CODE),
    });
  });

  it("enroll + confirm ativa MFA e emite recovery codes", async () => {
    const caller = appRouter.createCaller(minimalCtx(adminUser));
    const setup = await caller.auth.mfa.setup();
    expect(setup.secret).toBeTruthy();
    expect(setup.qrDataUrl.startsWith("data:image/png")).toBe(true);
    expect(setup.otpauthUrl).toContain("otpauth://totp/");

    const code = generateTotp(setup.secret);
    const confirmed = await caller.auth.mfa.confirm({ code });
    expect(confirmed.enabled).toBe(true);
    expect(confirmed.recoveryCodes.length).toBeGreaterThanOrEqual(8);
    recoveryCodes = confirmed.recoveryCodes;

    const status = await caller.auth.mfa.status();
    expect(status.enabled).toBe(true);
    expect(status.setupRequired).toBe(false);
  }, 60_000);

  it("login exige desafio MFA e verifyMfa completa sessão", async () => {
    const publicCaller = appRouter.createCaller(minimalCtx());
    const login = await publicCaller.auth.login({
      email: adminEmail,
      password: adminPassword,
    });
    expect(login.success).toBe(false);
    expect("mfaRequired" in login && login.mfaRequired).toBe(true);
    if (!("mfaToken" in login) || !login.mfaToken) {
      throw new Error("mfaToken ausente");
    }

    const row = await getMfaRow(adminUser.id);
    if (!row?.totpSecretEncrypted) throw new Error("secret missing");
    const secret = decryptTotpSecret(row.totpSecretEncrypted);
    const code = generateTotp(secret);

    const verified = await publicCaller.auth.verifyMfa({
      mfaToken: login.mfaToken,
      code,
    });
    expect(verified.success).toBe(true);
    expect(verified.accessToken).toBeTruthy();
    expect(verified.refreshToken).toBeTruthy();
  }, 60_000);

  it("recovery code autentica e é consumido", async () => {
    const publicCaller = appRouter.createCaller(minimalCtx());
    const login = await publicCaller.auth.login({
      email: adminEmail,
      password: adminPassword,
    });
    if (!("mfaToken" in login) || !login.mfaToken) {
      throw new Error("mfaToken ausente");
    }
    const code = recoveryCodes[0];
    if (!code) throw new Error("recovery codes ausentes do enroll");

    const verified = await publicCaller.auth.verifyMfa({
      mfaToken: login.mfaToken,
      code,
    });
    expect(verified.success).toBe(true);

    const login2 = await publicCaller.auth.login({
      email: adminEmail,
      password: adminPassword,
    });
    if (!("mfaToken" in login2) || !login2.mfaToken) {
      throw new Error("mfaToken ausente (2)");
    }
    await expect(
      publicCaller.auth.verifyMfa({ mfaToken: login2.mfaToken, code }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }, 60_000);

  it("produtor loga sem MFA; admin reset desativa TOTP alheio", async () => {
    const publicCaller = appRouter.createCaller(minimalCtx());
    const login = await publicCaller.auth.login({
      email: producerEmail,
      password: producerPassword,
    });
    expect(login.success).toBe(true);
    if ("accessToken" in login) {
      expect(login.accessToken).toBeTruthy();
    }

    // enforce off (vitest default) so other admin can call adminReset without enroll
    const otherCaller = appRouter.createCaller(minimalCtx(otherAdminUser));
    const reset = await otherCaller.auth.mfa.adminReset({
      userId: adminUser.id,
      reason: "vitest reset",
    });
    expect(reset.success).toBe(true);

    const status = await otherCaller.auth.mfa.adminStatus({ userId: adminUser.id });
    expect(status.enabled).toBe(false);

    const loginAfter = await publicCaller.auth.login({
      email: adminEmail,
      password: adminPassword,
    });
    expect(loginAfter.success).toBe(true);
  }, 60_000);
});
