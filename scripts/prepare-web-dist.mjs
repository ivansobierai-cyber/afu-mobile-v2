import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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

const pwaHeadMarkup = [
  '<meta name="description" content="Diagnóstico inteligente de plantas, gestão de cultivos e suporte para produtores rurais.">',
  '<meta name="theme-color" content="#2D6A4F">',
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="/icons/afu-icon.png">',
].join("\n");
const pwaRegistration =
  '<script>if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(() => {}));</script>';

function injectPwaMetadata(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      injectPwaMetadata(filePath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;

    const html = readFileSync(filePath, "utf8");
    if (html.includes('rel="manifest"')) continue;
    if (!html.includes("</head>") || !html.includes("</body>")) {
      throw new Error(`Could not inject PWA metadata: ${filePath} has no closing head/body tag`);
    }
    writeFileSync(
      filePath,
      html.replace("</head>", `${pwaHeadMarkup}\n</head>`).replace("</body>", `${pwaRegistration}\n</body>`),
    );
  }
}

injectPwaMetadata(dist);

console.log("Prepared dist/ for static deploy with PWA metadata and safe service worker registration");
