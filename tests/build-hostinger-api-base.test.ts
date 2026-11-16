import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Unit-test the precedence logic of scripts/build-hostinger.mjs without
 * running expo export: mirror the resolution block in isolation.
 */
function resolveHostingerApiBase(env: Record<string, string | undefined>): string {
  const hostingerApi = env.HOSTINGER_API_BASE_URL?.trim();
  const expoApi = env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const RAILWAY_API = "https://afu-mobile-v2-production.up.railway.app";
  if (hostingerApi) return hostingerApi.replace(/\/$/, "");
  if (expoApi) return expoApi.replace(/\/$/, "");
  return RAILWAY_API;
}

describe("build-hostinger API base precedence", () => {
  it("HOSTINGER_API_BASE_URL wins over EXPO_PUBLIC_API_BASE_URL", () => {
    expect(
      resolveHostingerApiBase({
        HOSTINGER_API_BASE_URL: "https://afu-mobile-v2-production.up.railway.app/",
        EXPO_PUBLIC_API_BASE_URL: "https://same-origin.example",
      }),
    ).toBe("https://afu-mobile-v2-production.up.railway.app");
  });

  it("EXPO_PUBLIC_API_BASE_URL used when HOSTINGER unset", () => {
    expect(
      resolveHostingerApiBase({
        EXPO_PUBLIC_API_BASE_URL: "https://custom.example/",
      }),
    ).toBe("https://custom.example");
  });

  it("defaults to Railway when no env set", () => {
    expect(resolveHostingerApiBase({})).toBe(
      "https://afu-mobile-v2-production.up.railway.app",
    );
  });

  it("script file documents Railway and warns on HOSTINGER_SITE_URL", () => {
    const src = readFileSync("scripts/build-hostinger.mjs", "utf8");
    expect(src).toMatch(/HOSTINGER_API_BASE_URL/);
    expect(src).toMatch(/afu-mobile-v2-production\.up\.railway\.app/);
    expect(src).toMatch(/api\.afuagro\.tech/);
    expect(src).toMatch(/HOSTINGER_SITE_URL/);
    expect(src).toMatch(/is ignored for API base/);
  });
});

describe("eas.json production/preview → Railway", () => {
  it("points production and preview at Railway", () => {
    const eas = JSON.parse(readFileSync("eas.json", "utf8")) as {
      build: {
        production: { env: { EXPO_PUBLIC_API_BASE_URL: string } };
        preview: { env: { EXPO_PUBLIC_API_BASE_URL: string } };
      };
    };
    const railway = "https://afu-mobile-v2-production.up.railway.app";
    expect(eas.build.production.env.EXPO_PUBLIC_API_BASE_URL).toBe(railway);
    expect(eas.build.preview.env.EXPO_PUBLIC_API_BASE_URL).toBe(railway);
  });
});
