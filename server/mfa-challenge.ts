/**
 * WP-08 — Short-lived MFA challenge JWT (password OK, TOTP pending).
 */
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import { MFA_CHALLENGE_TTL_SECONDS } from "../lib/mfa/constants";

export type MfaChallengePayload = {
  purpose: "mfa_challenge";
  userId: number;
  openId: string;
  email: string;
};

function getSecret(): Uint8Array {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return new TextEncoder().encode(secret);
}

export async function createMfaChallengeToken(input: {
  userId: number;
  openId: string;
  email: string;
}): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor(
    (issuedAt + MFA_CHALLENGE_TTL_SECONDS * 1000) / 1000,
  );
  return new SignJWT({
    purpose: "mfa_challenge",
    userId: input.userId,
    openId: input.openId,
    email: input.email,
  } satisfies MfaChallengePayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSecret());
}

export async function verifyMfaChallengeToken(
  token: string,
): Promise<MfaChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      payload.purpose !== "mfa_challenge" ||
      typeof payload.userId !== "number" ||
      typeof payload.openId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return {
      purpose: "mfa_challenge",
      userId: payload.userId,
      openId: payload.openId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
