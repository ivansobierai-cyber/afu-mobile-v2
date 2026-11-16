import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthDependencyError,
  isAuthDependencyError,
  normalizeEmail,
} from "../server/auth-errors";
import {
  canExposeDevResetToken,
  generateResetToken,
} from "../server/password-reset";
import { hashPassword, verifyPassword } from "../server/db-auth";
import {
  __resetDbHealthCacheForTests,
  probeDatabaseHealth,
} from "../server/db-health";
import { resolveAppUrl } from "../server/email-service";

describe("auth hardening — email/DB/login", () => {
  const envKeys = [
    "NODE_ENV",
    "ALLOW_DEV_RESET_TOKEN",
    "APP_URL",
    "DATABASE_URL",
  ] as const;
  const saved: Partial<Record<(typeof envKeys)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of envKeys) saved[key] = process.env[key];
    __resetDbHealthCacheForTests();
  });

  afterEach(() => {
    for (const key of envKeys) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    __resetDbHealthCacheForTests();
    vi.restoreAllMocks();
  });

  describe("normalizeEmail", () => {
    it("trim + lowercase", () => {
      expect(normalizeEmail("  Demo@AFUAgro.com.br ")).toBe("demo@afuagro.com.br");
    });
  });

  describe("AuthDependencyError", () => {
    it("detecta AuthDependencyError e mensagens de DB", () => {
      expect(isAuthDependencyError(new AuthDependencyError())).toBe(true);
      expect(isAuthDependencyError(new Error("Database not available"))).toBe(true);
      expect(isAuthDependencyError(new Error("Invalid email or password"))).toBe(false);
    });
  });

  describe("PBKDF2 verifyPassword", () => {
    it("aceita senha correta e rejeita incorreta / hash inválido", async () => {
      const hash = await hashPassword("Demo@1234");
      expect(await verifyPassword("Demo@1234", hash)).toBe(true);
      expect(await verifyPassword("wrong-password", hash)).toBe(false);
      expect(await verifyPassword("Demo@1234", "not-a-hash")).toBe(false);
    });
  });

  describe("canExposeDevResetToken", () => {
    it("nunca expõe em production", () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOW_DEV_RESET_TOKEN = "1";
      expect(canExposeDevResetToken()).toBe(false);
    });

    it("expõe só com flag explícita fora de production", () => {
      process.env.NODE_ENV = "test";
      delete process.env.ALLOW_DEV_RESET_TOKEN;
      expect(canExposeDevResetToken()).toBe(false);
      process.env.ALLOW_DEV_RESET_TOKEN = "1";
      expect(canExposeDevResetToken()).toBe(true);
    });
  });

  describe("generateResetToken", () => {
    it("gera token hex e expiry ~1h", () => {
      const { token, expiresAt } = generateResetToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
      const delta = expiresAt.getTime() - Date.now();
      expect(delta).toBeGreaterThan(50 * 60 * 1000);
      expect(delta).toBeLessThan(70 * 60 * 1000);
    });
  });

  describe("resolveAppUrl", () => {
    it("usa APP_URL quando definida", () => {
      process.env.APP_URL = "https://custom.example/";
      expect(resolveAppUrl()).toBe("https://custom.example");
    });

    it("default afuagro.tech", () => {
      delete process.env.APP_URL;
      expect(resolveAppUrl()).toBe("https://afuagro.tech");
    });
  });

  describe("probeDatabaseHealth", () => {
    it("reporta DATABASE_URL ausente", async () => {
      delete process.env.DATABASE_URL;
      const health = await probeDatabaseHealth({ force: true });
      expect(health.configured).toBe(false);
      expect(health.reachable).toBe(false);
      expect(health.detail).toMatch(/DATABASE_URL/i);
    });

    it("reporta URL inválida como unreachable", async () => {
      process.env.DATABASE_URL = "mysql://nope:nope@127.0.0.1:1/nope";
      const health = await probeDatabaseHealth({ force: true, timeoutMs: 500 });
      expect(health.configured).toBe(true);
      expect(health.reachable).toBe(false);
      expect(health.detail).toBeTruthy();
    });
  });
});
