/**
 * Build web para Vercel preview/prod.
 * Respeita EXPO_PUBLIC_API_BASE_URL definida no ambiente (Preview por PR);
 * fallback para Railway (API canônica com MySQL) quando ausente.
 *
 * Nota: https://api.afuagro.tech é o domínio custom futuro (DNS → Railway).
 * Não usar como default enquanto o DNS apontar para a Hostinger sem DB.
 * Ver docs/API_ROUTING.md.
 *
 * Login demo NUNCA é o padrão em builds web de produção/preview.
 * Só habilita se EXPO_PUBLIC_SHOW_DEMO_LOGIN=1 for definido explicitamente.
 */
import { execSync } from "node:child_process";

const RAILWAY_API = "https://afu-mobile-v2-production.up.railway.app";
// Future custom domain (keep documented; do not delete):
// https://api.afuagro.tech

process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN =
  process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN ?? "0";

if (!process.env.EXPO_PUBLIC_API_BASE_URL?.trim()) {
  // Prefer Railway direto: DNS de api.afuagro.tech pode apontar para Hostinger
  // sem DATABASE_URL (login/signup quebrados). Override via env no Vercel.
  process.env.EXPO_PUBLIC_API_BASE_URL = RAILWAY_API;
}

console.log(
  `[build-web-preview] EXPO_PUBLIC_API_BASE_URL=${process.env.EXPO_PUBLIC_API_BASE_URL} EXPO_PUBLIC_SHOW_DEMO_LOGIN=${process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN}`,
);

execSync("npx expo export --platform web", {
  stdio: "inherit",
  env: process.env,
});
