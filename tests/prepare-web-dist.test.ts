import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

const root = join(__dirname, "..");

describe("prepare-web-dist", () => {
  let work: string | undefined;

  afterEach(() => {
    if (work) rmSync(work, { recursive: true, force: true });
  });

  it("copia redirects e rewrite da API para dist/vercel.json", () => {
    work = mkdtempSync(join(tmpdir(), "afu-web-dist-"));
    mkdirSync(join(work, "dist"));
    writeFileSync(
      join(work, "vercel.json"),
      JSON.stringify({
        redirects: [
          {
            source: "/(.*)",
            has: [{ type: "host", value: "www.afuagro.tech" }],
            destination: "https://afuagro.tech/$1",
            permanent: true,
          },
        ],
        headers: [{ source: "/assets/(.*\\.ttf)", headers: [{ key: "Content-Type", value: "font/ttf" }] }],
        rewrites: [
          {
            source: "/(.*)",
            has: [{ type: "host", value: "api.afuagro.tech" }],
            destination: "https://afu-mobile-v2-production.up.railway.app/$1",
          },
          { source: "/((?!_expo|assets|.*\\..*).*)", destination: "/index.html" },
        ],
      }),
    );
    writeFileSync(
      join(work, "scripts-prepare.mjs"),
      readFileSync(join(root, "scripts/prepare-web-dist.mjs"), "utf8").replace(
        'join(dirname(fileURLToPath(import.meta.url)), "..")',
        JSON.stringify(work),
      ),
    );

    const result = spawnSync(process.execPath, [join(work, "scripts-prepare.mjs")], {
      encoding: "utf8",
    });
    expect(result.status).toBe(0);

    const distConfig = JSON.parse(readFileSync(join(work, "dist/vercel.json"), "utf8"));
    expect(distConfig.redirects?.[0]?.has?.[0]?.value).toBe("www.afuagro.tech");
    expect(distConfig.rewrites?.[0]?.has?.[0]?.value).toBe("api.afuagro.tech");
    expect(distConfig.rewrites?.some((r: { destination?: string }) => r.destination === "/index.html")).toBe(
      true,
    );
  });
});
