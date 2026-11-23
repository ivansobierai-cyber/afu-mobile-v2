/**
 * Build único para o app Node da Hostinger: API em dist/index.js e
 * web Expo em dist/public.
 *
 * Ordem de API base (cliente web embutido em dist/public):
 * 1. HOSTINGER_API_BASE_URL (precedence — ex.: Railway se MySQL Hostinger não estiver pronto)
 * 2. EXPO_PUBLIC_API_BASE_URL (explícito)
 * 3. Default Railway (API canônica com MySQL) — NÃO same-origin:
 *    o Node da Hostinger frequentemente não tem DATABASE_URL.
 *
 * HOSTINGER_SITE_URL is ignored for API base (same-origin Hostinger Node often
 * has no DATABASE_URL). Set HOSTINGER_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL
 * instead. See docs/API_ROUTING.md.
 *
 * Futuro domínio custom da API: https://api.afuagro.tech (DNS → Railway).
 */
import { execSync } from "node:child_process";
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAILWAY_API = "https://afu-mobile-v2-production.up.railway.app";
// Kept for docs / future custom domain (do not delete):
// const FUTURE_API_CUSTOM_DOMAIN = "https://api.afuagro.tech";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN =
  process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN ?? "0";

const hostingerApi = process.env.HOSTINGER_API_BASE_URL?.trim();
const expoApi = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const siteUrl = process.env.HOSTINGER_SITE_URL?.trim();

if (siteUrl) {
  console.warn(
    `[build-hostinger] HOSTINGER_SITE_URL=${siteUrl} is ignored for API base ` +
      "(same-origin Hostinger Node often has no DATABASE_URL). " +
      "Use HOSTINGER_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL; default is Railway. " +
      "See docs/API_ROUTING.md.",
  );
}

if (hostingerApi) {
  process.env.EXPO_PUBLIC_API_BASE_URL = hostingerApi.replace(/\/$/, "");
} else if (expoApi) {
  process.env.EXPO_PUBLIC_API_BASE_URL = expoApi.replace(/\/$/, "");
} else {
  process.env.EXPO_PUBLIC_API_BASE_URL = RAILWAY_API;
}

console.log(
  `[build-hostinger] EXPO_PUBLIC_API_BASE_URL=${process.env.EXPO_PUBLIC_API_BASE_URL}`,
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

// Apache SPA fallback if document root is served as static (Node Express also
// falls back to index.html). Do not rewrite real files or /api.
const htaccess = `# AFU Agro — SPA fallback (Expo Router web)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api/
  RewriteRule . /index.html [L]
</IfModule>
`;
writeFileSync(join(publicDir, ".htaccess"), htaccess);
console.log("[build-hostinger] dist/index.js e dist/public (+ .htaccess) prontos");
