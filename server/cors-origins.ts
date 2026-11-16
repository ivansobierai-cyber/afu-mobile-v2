import { WEB_APP_ORIGINS } from "../constants/api-hosts";

/**
 * Production web hosts that must be able to call the Railway API with credentials.
 * Kept here so health/docs/tests can assert the contract without parsing Express.
 */
export const REQUIRED_WEB_CORS_ORIGINS: readonly string[] = WEB_APP_ORIGINS;

/**
 * Resolve Access-Control-Allow-Origin for a request.
 *
 * Default: reflect the request Origin (needed for Expo Go, Vercel previews,
 * localhost). Always includes afuagro.tech / www / app.
 *
 * Optional harden: set CORS_ALLOWED_ORIGINS to a comma-separated allowlist
 * (must still include the REQUIRED_WEB_CORS_ORIGINS when locking down).
 */
export function resolveCorsAllowOrigin(
  origin: string | undefined,
): string | undefined {
  if (!origin) return undefined;

  const fromEnv = process.env.CORS_ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (fromEnv && fromEnv.length > 0) {
    const allow = new Set([...fromEnv, ...REQUIRED_WEB_CORS_ORIGINS]);
    return allow.has(origin) ? origin : undefined;
  }

  // Permissive default — credentials require a concrete Origin, not "*".
  return origin;
}

export function isRequiredWebCorsOrigin(origin: string): boolean {
  return (REQUIRED_WEB_CORS_ORIGINS as readonly string[]).includes(origin);
}
