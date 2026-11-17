/**
 * WP-08 — Encrypt TOTP secrets at rest; hash recovery codes.
 * Uses AES-256-GCM keyed from JWT_SECRET (never store plaintext secrets).
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { ENV } from "./_core/env";
import { hashPassword, verifyPassword } from "./db-auth";
import {
  MFA_RECOVERY_CODE_COUNT,
  MFA_RECOVERY_CODE_LENGTH,
} from "../lib/mfa/constants";

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function deriveAesKey(): Buffer {
  const secret = ENV.cookieSecret;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET required to encrypt MFA secrets");
  }
  return createHash("sha256").update(`afu-mfa-v1:${secret}`).digest();
}

/** Format: v1:<ivHex>:<tagHex>:<cipherHex> */
export function encryptTotpSecret(plaintext: string): string {
  const key = deriveAesKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptTotpSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid MFA secret payload");
  }
  const [, ivHex, tagHex, cipherHex] = parts;
  const key = deriveAesKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

export function generateRecoveryCodes(
  count = MFA_RECOVERY_CODE_COUNT,
  length = MFA_RECOVERY_CODE_LENGTH,
): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(length);
    let code = "";
    for (let j = 0; j < length; j++) {
      code += RECOVERY_ALPHABET[bytes[j]! % RECOVERY_ALPHABET.length];
    }
    // Format XXXXX-XXXXX for readability when length is even
    if (length === 10) {
      codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
    } else {
      codes.push(code);
    }
  }
  return codes;
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  const hashes: string[] = [];
  for (const code of codes) {
    hashes.push(await hashPassword(normalizeRecoveryCode(code)));
  }
  return hashes;
}

export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

export async function consumeRecoveryCode(
  code: string,
  hashedCodes: string[],
): Promise<{ ok: true; remainingHashes: string[] } | { ok: false }> {
  const normalized = normalizeRecoveryCode(code);
  for (let i = 0; i < hashedCodes.length; i++) {
    const hash = hashedCodes[i]!;
    if (await verifyPassword(normalized, hash)) {
      const remaining = hashedCodes.filter((_, idx) => idx !== i);
      return { ok: true, remainingHashes: remaining };
    }
  }
  return { ok: false };
}

export function serializeRecoveryHashes(hashes: string[]): string {
  return JSON.stringify(hashes);
}

export function parseRecoveryHashes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

/** Constant-time length check helper for unit tests. */
export function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
