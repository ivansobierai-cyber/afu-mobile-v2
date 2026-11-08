/**
 * Build web para Vercel preview/prod.
 * Respeita EXPO_PUBLIC_API_BASE_URL definida no ambiente (Preview por PR);
 * fallback para Railway staging/prod quando ausente.
 */
import { execSync } from "node:child_process";

process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN = process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN ?? "1";

if (!process.env.EXPO_PUBLIC_API_BASE_URL?.trim()) {
  process.env.EXPO_PUBLIC_API_BASE_URL =
    "https://api.afuagro.tech";
}

console.log(
  `[build-web-preview] EXPO_PUBLIC_API_BASE_URL=${process.env.EXPO_PUBLIC_API_BASE_URL}`,
);

execSync("npx expo export --platform web", {
  stdio: "inherit",
  env: process.env,
});
