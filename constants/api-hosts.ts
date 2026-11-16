/**
 * Canonical API hosts for AFU Agro.
 *
 * Production API with MySQL lives on Railway today.
 * `api.afuagro.tech` is the intended custom domain (DNS → Railway) — keep the
 * name documented; do not point mobile/web builds at Hostinger's Node API.
 */
export const RAILWAY_API_BASE_URL =
  "https://afu-mobile-v2-production.up.railway.app";

/** Future custom domain for the Railway API (optional DNS step). */
export const FUTURE_API_CUSTOM_DOMAIN = "https://api.afuagro.tech";

/** Web origins that call the Railway API from the browser. */
export const WEB_APP_ORIGINS = [
  "https://afuagro.tech",
  "https://www.afuagro.tech",
  "https://app.afuagro.tech",
] as const;
