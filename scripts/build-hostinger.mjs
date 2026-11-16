/**
 * Build único para o app Node da Hostinger: API em dist/index.js e
 * web Expo em dist/public.
 *
 * Ordem de API base:
 * 1. EXPO_PUBLIC_API_BASE_URL (explícito)
 * 2. HOSTINGER_API_BASE_URL (ex.: Railway se o MySQL da Hostinger não estiver pronto)
 * 3. HOSTINGER_SITE_URL (same-origin — exige DATABASE_URL + JWT_SECRET no painel)
 *
 * Sem DATABASE_URL no Node da Hostinger, login/signup/forgot retornam erro;
 * use HOSTINGER_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app
 * até o MySQL local/remoto estar configurado.
 */
import { execSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN = process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN ?? "0";
const siteUrl = process.env.HOSTINGER_SITE_URL?.trim();
const hostingerApi = process.env.HOSTINGER_API_BASE_URL?.trim();
if (!process.env.EXPO_PUBLIC_API_BASE_URL?.trim()) {
  if (hostingerApi) {
    process.env.EXPO_PUBLIC_API_BASE_URL = hostingerApi.replace(/\/$/, "");
  } else if (siteUrl) {
    process.env.EXPO_PUBLIC_API_BASE_URL = siteUrl.replace(/\/$/, "");
  }
}
console.log(
  `[build-hostinger] EXPO_PUBLIC_API_BASE_URL=${process.env.EXPO_PUBLIC_API_BASE_URL ?? "(same-origin/empty)"}`,
);

execSync("node scripts/ensure-esbuild.mjs", { stdio: "inherit" });
execSync("node scripts/bundle-api.mjs", { stdio: "inherit" });
execSync("node scripts/ensure-nativewind-cache.mjs", { stdio: "inherit" });

const webOut = join(root, "web-export");
rmSync(webOut, { recursive: true, force: true });
execSync("npx expo export --platform web --output-dir web-export", {
  stdio: "inherit",
  env: process.env,
});

const publicDir = join(root, "dist", "public");
rmSync(publicDir, { recursive: true, force: true });
cpSync(webOut, publicDir, { recursive: true });
console.log("[build-hostinger] dist/index.js e dist/public prontos");
