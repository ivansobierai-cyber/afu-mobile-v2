import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(dist)) {
  console.error("dist/ not found — run npm run build:web:preview first");
  process.exit(1);
}

const rootConfig = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));

/** Config estático para `vercel deploy dist` — inclui redirects/rewrites do apex. */
const distConfig = {
  redirects: rootConfig.redirects ?? [],
  headers: rootConfig.headers ?? [
    {
      source: "/assets/(.*\\.ttf)",
      headers: [{ key: "Content-Type", value: "font/ttf" }],
    },
  ],
  rewrites: rootConfig.rewrites ?? [
    {
      source: "/((?!_expo|assets|.*\\..*).*)",
      destination: "/index.html",
    },
  ],
};

writeFileSync(join(dist, "vercel.json"), JSON.stringify(distConfig, null, 2) + "\n");

console.log("Prepared dist/ for static deploy (vercel.json com redirects/rewrites do apex)");
