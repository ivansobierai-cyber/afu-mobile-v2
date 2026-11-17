import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const RAILWAY_API = "https://afu-mobile-v2-production.up.railway.app";

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("Play Store Android production config", () => {
  it("uses stable br.com.afuagro.app package and afuagro scheme", () => {
    const appConfig = read("app.config.ts");
    expect(appConfig).toContain("br.com.afuagro.app");
    expect(appConfig).toContain("afuagro");
    expect(appConfig).not.toContain("space.manus.afu.mobile");
    expect(appConfig).toContain("READ_MEDIA_IMAGES");
    expect(appConfig).toContain("blockedPermissions");
    expect(appConfig).toContain("RECORD_AUDIO");
    // Gallery on API ≤32 needs READ_EXTERNAL_STORAGE — must not be blocked.
    expect(appConfig).not.toMatch(
      /blockedPermissions:\s*\[[\s\S]*READ_EXTERNAL_STORAGE/,
    );
    expect(appConfig).toContain("httpsOnlyProfiles");
    expect(appConfig).not.toMatch(/plugins:\s*\[[\s\S]*expo-audio/);
    expect(appConfig).toContain("https://afuagro.tech/privacidade");
  });

  it("production EAS profile builds app-bundle against Railway without demo flags", () => {
    const eas = JSON.parse(read("eas.json")) as {
      build: {
        production: {
          autoIncrement?: boolean;
          android?: { buildType?: string };
          env?: Record<string, string>;
        };
        preview?: {
          env?: Record<string, string>;
        };
      };
      cli?: { appVersionSource?: string };
    };

    expect(eas.cli?.appVersionSource).toBe("remote");
    expect(eas.build.production.autoIncrement).toBe(true);
    expect(eas.build.production.android?.buildType).toBe("app-bundle");
    expect(eas.build.production.env?.EXPO_PUBLIC_API_BASE_URL).toBe(RAILWAY_API);
    expect(eas.build.production.env?.EXPO_PUBLIC_SHOW_DEMO_LOGIN).toBe("0");
    expect(eas.build.production.env?.EXPO_PUBLIC_DEV_SKIP_AUTH).toBe("0");
    expect(eas.build.preview?.env?.EXPO_PUBLIC_API_BASE_URL).toBe(RAILWAY_API);
  });

  it("oauth native fallback points to Railway with afuagro scheme (api.afuagro.tech documented)", () => {
    const oauth = read("constants/oauth.ts");
    const hosts = read("constants/api-hosts.ts");
    expect(oauth).toContain("afuagro");
    expect(oauth).toContain("RAILWAY_API_BASE_URL");
    expect(hosts).toContain(RAILWAY_API);
    // Future custom domain kept in comments / host allowlist — not used as default.
    expect(oauth).toContain("https://api.afuagro.tech");
  });

  it("ships Portuguese Play listing docs and privacy source with redirects", () => {
    expect(read("docs/playstore/descricao-curta.txt").trim().length).toBeGreaterThan(10);
    expect(read("docs/playstore/descricao-curta.txt").trim().length).toBeLessThanOrEqual(80);
    expect(read("docs/playstore/descricao-completa.txt")).toMatch(/AFU Agro/);
    expect(read("docs/playstore/data-safety.md")).toMatch(/Data safety/);
    expect(read("lib/legal/privacidade-content.ts")).toMatch(/LGPD/);
    expect(read("app/privacidade.tsx")).toMatch(/Redirect/);
    expect(read("app/privacidade.tsx")).toMatch(/legal\/privacidade/);
    expect(read("app/termos.tsx")).toMatch(/Redirect/);
    expect(read("app/legal/privacidade.tsx")).toMatch(/Política de Privacidade/);
    expect(read("app/legal/termos.tsx")).toMatch(/Termos de Uso/);
  });
});
