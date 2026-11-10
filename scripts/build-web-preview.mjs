/**
 * Build web para Vercel preview/prod.
 * Respeita EXPO_PUBLIC_API_BASE_URL definida no ambiente (Preview por PR);
 * fallback para Railway staging/prod quando ausente.
 *
 * Login demo NUNCA é o padrão em builds web de produção/preview.
 * Só habilita se EXPO_PUBLIC_SHOW_DEMO_LOGIN=1 for definido explicitamente.
 */
import { execSync } from "node:child_process";

process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN =
  process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN ?? "0";

if (!process.env.EXPO_PUBLIC_API_BASE_URL?.trim()) {
  process.env.EXPO_PUBLIC_API_BASE_URL =
    "https://api.afuagro.tech";
}

console.log(
  `[build-web-preview] EXPO_PUBLIC_API_BASE_URL=${process.env.EXPO_PUBLIC_API_BASE_URL} EXPO_PUBLIC_SHOW_DEMO_LOGIN=${process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN}`,
);

execSync("npx expo export --platform web", {
  stdio: "inherit",
  env: process.env,
});
