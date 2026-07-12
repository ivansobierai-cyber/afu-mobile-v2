import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(dist)) {
  console.error("dist/ not found — run npm run build:web:preview first");
  process.exit(1);
}

writeFileSync(
  join(dist, "vercel.json"),
  JSON.stringify(
    {
      rewrites: [
        {
          source: "/((?!_expo|assets|.*\\..*).*)",
          destination: "/index.html",
        },
      ],
      headers: [
        {
          source: "/assets/(.*\\.ttf)",
          headers: [{ key: "Content-Type", value: "font/ttf" }],
        },
      ],
    },
    null,
    2,
  ),
);

console.log("Prepared dist/ for static deploy (vercel.json)");
