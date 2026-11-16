import { WEB_APP_ORIGINS } from "../constants/api-hosts";

/**
 * Hardcoded production web hosts — always allowed, even when Railway has no
 * WEB_APP_ORIGINS / CORS_ALLOWED_ORIGINS env vars. Live site afuagro.tech
 * must never depend on dashboard env for CORS.
 */
export const DEFAULT_WEB_APP_ORIGINS: readonly string[] = [...WEB_APP_ORIGINS];

/**
 * @deprecated Prefer DEFAULT_WEB_APP_ORIGINS — same hardcoded list.
 * Kept so existing imports/tests keep working.
 */
export const REQUIRED_WEB_CORS_ORIGINS: readonly string[] = DEFAULT_WEB_APP_ORIGINS;

/**
 * This project's Vercel preview hosts (afu-mobile / afu-mobile-web / …).
 * Native apps send no Origin — CORS does not apply to them.
 */
export const VERCEL_PREVIEW_ORIGIN_RE =
  /^https:\/\/afu-mobile[-\w]*\.vercel\.app$/i;

const LOCAL_DEV_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function truthyEnv(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function parseCsvOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Hardcoded defaults ∪ optional env WEB_APP_ORIGINS (CSV extras).
 * Defaults are never cleared by an empty/missing env.
 */
export function getEffectiveWebAppOrigins(): readonly string[] {
  const fromEnv = parseCsvOrigins(process.env.WEB_APP_ORIGINS);
  if (fromEnv.length === 0) return DEFAULT_WEB_APP_ORIGINS;
  return [...new Set([...DEFAULT_WEB_APP_ORIGINS, ...fromEnv])];
}

/**
 * Whether an Origin is allowed for credentialed CORS.
 *
 * Production default: allowlist only
 *   - hardcoded DEFAULT_WEB_APP_ORIGINS (afuagro.tech / www / app) — always
 *   - optional WEB_APP_ORIGINS env CSV (merged, never replaces defaults)
 *   - Vercel previews matching VERCEL_PREVIEW_ORIGIN_RE
 *   - optional CORS_ALLOWED_ORIGINS CSV extras
 *
 * Dev (NODE_ENV !== production): also localhost / 127.0.0.1.
 *
 * Reflect-any-Origin only when CORS_REFLECT_ORIGIN=1 (explicit escape hatch).
 * Native clients send no Origin → resolveCorsAllowOrigin(undefined) → no ACAO header.
 */
export function isCorsOriginAllowed(origin: string): boolean {
  if (truthyEnv("CORS_REFLECT_ORIGIN")) return true;

  if (getEffectiveWebAppOrigins().includes(origin)) {
    return true;
  }

  const extras = parseCsvOrigins(process.env.CORS_ALLOWED_ORIGINS);
  if (extras.includes(origin)) return true;

  if (VERCEL_PREVIEW_ORIGIN_RE.test(origin)) return true;

  if (!isProductionRuntime() && LOCAL_DEV_ORIGIN_RE.test(origin)) {
    return true;
  }

  return false;
}

/**
 * Resolve Access-Control-Allow-Origin for a request (concrete origin, never "*").
 */
export function resolveCorsAllowOrigin(
  origin: string | undefined,
): string | undefined {
  if (!origin) return undefined;
  return isCorsOriginAllowed(origin) ? origin : undefined;
}

export function isRequiredWebCorsOrigin(origin: string): boolean {
  return DEFAULT_WEB_APP_ORIGINS.includes(origin);
}
