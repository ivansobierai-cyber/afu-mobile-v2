/**
 * WP-08 — unit tests for TOTP / crypto (no DB).
 */
import { describe, expect, it, beforeAll } from "vitest";
import {
  base32Decode,
  base32Encode,
  buildOtpAuthUri,
  generateTotp,
  generateTotpSecret,
  verifyTotp,
} from "../server/mfa-totp";
import {
  encryptTotpSecret,
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  consumeRecoveryCode,
  normalizeRecoveryCode,
} from "../server/mfa-crypto";
import { REQUIRED_PREPARE_TAGS } from "../scripts/lib/schema-prepare-core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MFA_CHALLENGE_REQUIRED_CODE,
  MFA_RECOVERY_CODE_COUNT,
  MFA_SETUP_REQUIRED_CODE,
} from "../lib/mfa/constants";

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "vitest_mfa_totp_secret_key_32b!";
  }
});

describe("MFA TOTP primitives", () => {
  it("round-trips base32", () => {
    const raw = Buffer.from("Hello AFU MFA!!");
    expect(base32Decode(base32Encode(raw)).equals(raw)).toBe(true);
  });

  it("gera e verifica TOTP no relógio atual", () => {
    const secret = generateTotpSecret();
    const code = generateTotp(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("aceita janela ±1 step", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const prev = generateTotp(secret, { timeMs: now - 30_000 });
    expect(verifyTotp(secret, prev, { timeMs: now })).toBe(true);
  });

  it("monta otpauth URI com issuer AFU", () => {
    const uri = buildOtpAuthUri({
      secretBase32: "JBSWY3DPEHPK3PXP",
      accountName: "admin@afuagro.com.br",
    });
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("issuer=AFU+Agro");
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
  });
});

describe("MFA crypto", () => {
  it("cifra e decifra secret TOTP", () => {
    const secret = generateTotpSecret();
    const enc = encryptTotpSecret(secret);
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain(secret);
    expect(decryptTotpSecret(enc)).toBe(secret);
  });

  it("gera e consome recovery codes (hash PBKDF2)", async () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(MFA_RECOVERY_CODE_COUNT);
    const hashes = await hashRecoveryCodes(codes);
    const used = await consumeRecoveryCode(codes[0]!, hashes);
    expect(used.ok).toBe(true);
    if (used.ok) {
      expect(used.remainingHashes).toHaveLength(hashes.length - 1);
      const again = await consumeRecoveryCode(codes[0]!, used.remainingHashes);
      expect(again.ok).toBe(false);
    }
  }, 60_000);

  it("normaliza recovery com hífen/espaço", () => {
    expect(normalizeRecoveryCode("ab-cd ef")).toBe("ABCDEF");
  });
});

describe("MFA manifest / docs", () => {
  it("schema prepare inclui 0045_mfa_totp", () => {
    expect(REQUIRED_PREPARE_TAGS).toContain("0045_mfa_totp");
  });

  it("package.json tem db:mfa:apply", () => {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf8"),
    ) as { scripts: Record<string, string>; dependencies: Record<string, string> };
    expect(pkg.scripts["db:mfa:apply"]).toContain("apply-0045-mfa-totp");
    expect(pkg.dependencies.qrcode).toBeTruthy();
  });

  it("expõe códigos estáveis MFA_REQUIRED / MFA_SETUP_REQUIRED", () => {
    expect(MFA_CHALLENGE_REQUIRED_CODE).toBe("MFA_REQUIRED");
    expect(MFA_SETUP_REQUIRED_CODE).toBe("MFA_SETUP_REQUIRED");
  });
});
