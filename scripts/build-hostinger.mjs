/**
 * Build único para o app Node da Hostinger: API em dist/index.js e
 * web Expo em dist/public. EXPO_PUBLIC_API_BASE_URL vazio faz o cliente
 * web usar o mesmo domínio. HOSTINGER_SITE_URL define a URL absoluta.
 */
import { execSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN = process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN ?? "0";
const siteUrl = process.env.HOSTINGER_SITE_URL?.trim();
if (!process.env.EXPO_PUBLIC_API_BASE_URL?.trim() && siteUrl) {
  process.env.EXPO_PUBLIC_API_BASE_URL = siteUrl.replace(/\/$/, "");
}

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
