/**
 * WP-08 — RFC 6238 TOTP (HMAC-SHA1) without external OTP libraries.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  MFA_TOTP_DIGITS,
  MFA_TOTP_PERIOD_SECONDS,
  MFA_TOTP_WINDOW,
} from "../lib/mfa/constants";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) {
      throw new Error("Invalid base32 character");
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

function hotp(secret: Buffer, counter: number, digits: number): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const str = String(code % 10 ** digits);
  return str.padStart(digits, "0");
}

export function generateTotp(
  secretBase32: string,
  opts?: { timeMs?: number; period?: number; digits?: number },
): string {
  const period = opts?.period ?? MFA_TOTP_PERIOD_SECONDS;
  const digits = opts?.digits ?? MFA_TOTP_DIGITS;
  const timeMs = opts?.timeMs ?? Date.now();
  const counter = Math.floor(timeMs / 1000 / period);
  return hotp(base32Decode(secretBase32), counter, digits);
}

export function verifyTotp(
  secretBase32: string,
  token: string,
  opts?: { timeMs?: number; period?: number; digits?: number; window?: number },
): boolean {
  const cleaned = String(token ?? "").replace(/\s+/g, "");
  const digits = opts?.digits ?? MFA_TOTP_DIGITS;
  if (!/^\d+$/.test(cleaned) || cleaned.length !== digits) {
    return false;
  }
  const period = opts?.period ?? MFA_TOTP_PERIOD_SECONDS;
  const window = opts?.window ?? MFA_TOTP_WINDOW;
  const timeMs = opts?.timeMs ?? Date.now();
  const counter = Math.floor(timeMs / 1000 / period);
  const secret = base32Decode(secretBase32);
  const expectedBuf = Buffer.from(cleaned);

  for (let w = -window; w <= window; w++) {
    const candidate = hotp(secret, counter + w, digits);
    const candidateBuf = Buffer.from(candidate);
    if (
      candidateBuf.length === expectedBuf.length &&
      timingSafeEqual(candidateBuf, expectedBuf)
    ) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(params: {
  secretBase32: string;
  accountName: string;
  issuer?: string;
  digits?: number;
  period?: number;
}): string {
  const issuer = params.issuer ?? "AFU Agro";
  const label = encodeURIComponent(`${issuer}:${params.accountName}`);
  const query = new URLSearchParams({
    secret: params.secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(params.digits ?? MFA_TOTP_DIGITS),
    period: String(params.period ?? MFA_TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
