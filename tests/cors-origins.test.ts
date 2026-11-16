import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveCorsAllowOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("production allowlist: afuagro.tech + www + app; rejects evil", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_REFLECT_ORIGIN", "");
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "");
    vi.resetModules();
    const { resolveCorsAllowOrigin, DEFAULT_WEB_APP_ORIGINS } = await import(
      "../server/cors-origins"
    );
    expect(DEFAULT_WEB_APP_ORIGINS).toEqual([
      "https://afuagro.tech",
      "https://www.afuagro.tech",
      "https://app.afuagro.tech",
    ]);
    expect(resolveCorsAllowOrigin("https://afuagro.tech")).toBe(
      "https://afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://www.afuagro.tech")).toBe(
      "https://www.afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://app.afuagro.tech")).toBe(
      "https://app.afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://evil.example")).toBeUndefined();
    expect(resolveCorsAllowOrigin("http://localhost:8081")).toBeUndefined();
    expect(resolveCorsAllowOrigin(undefined)).toBeUndefined();
  });

  it("afuagro.tech / www / app allowed when WEB_APP_ORIGINS env is unset on Railway", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_REFLECT_ORIGIN", "");
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "");
    // Simulate Railway with no WEB_APP_ORIGINS dashboard variable
    vi.stubEnv("WEB_APP_ORIGINS", "");
    vi.resetModules();
    const {
      resolveCorsAllowOrigin,
      getEffectiveWebAppOrigins,
      DEFAULT_WEB_APP_ORIGINS,
    } = await import("../server/cors-origins");

    expect(process.env.WEB_APP_ORIGINS).toBe("");
    expect(getEffectiveWebAppOrigins()).toEqual([...DEFAULT_WEB_APP_ORIGINS]);
    expect(resolveCorsAllowOrigin("https://afuagro.tech")).toBe(
      "https://afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://www.afuagro.tech")).toBe(
      "https://www.afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://app.afuagro.tech")).toBe(
      "https://app.afuagro.tech",
    );
  });

  it("WEB_APP_ORIGINS env merges extras without dropping hardcoded defaults", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_REFLECT_ORIGIN", "");
    vi.stubEnv("WEB_APP_ORIGINS", "https://staging.afuagro.tech");
    vi.resetModules();
    const { resolveCorsAllowOrigin, getEffectiveWebAppOrigins } = await import(
      "../server/cors-origins"
    );
    expect(getEffectiveWebAppOrigins()).toContain("https://afuagro.tech");
    expect(getEffectiveWebAppOrigins()).toContain("https://staging.afuagro.tech");
    expect(resolveCorsAllowOrigin("https://afuagro.tech")).toBe(
      "https://afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://staging.afuagro.tech")).toBe(
      "https://staging.afuagro.tech",
    );
  });

  it("allows this project's Vercel preview origins", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_REFLECT_ORIGIN", "");
    vi.resetModules();
    const { resolveCorsAllowOrigin } = await import("../server/cors-origins");
    expect(
      resolveCorsAllowOrigin(
        "https://afu-mobile-git-cursor-api-ro-6f5466-ivansobierai-8642s-projects.vercel.app",
      ),
    ).toMatch(/^https:\/\/afu-mobile/);
    expect(
      resolveCorsAllowOrigin(
        "https://afu-mobile-web-git-cursor-ap-f97490-ivansobierai-8642s-projects.vercel.app",
      ),
    ).toMatch(/^https:\/\/afu-mobile/);
    expect(
      resolveCorsAllowOrigin("https://other-app-git-x.vercel.app"),
    ).toBeUndefined();
  });

  it("localhost only outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CORS_REFLECT_ORIGIN", "");
    vi.resetModules();
    const { resolveCorsAllowOrigin } = await import("../server/cors-origins");
    expect(resolveCorsAllowOrigin("http://localhost:8081")).toBe(
      "http://localhost:8081",
    );
    expect(resolveCorsAllowOrigin("http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000",
    );
  });

  it("CORS_ALLOWED_ORIGINS adds extras; required origins remain", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "https://preview.example.com");
    vi.stubEnv("CORS_REFLECT_ORIGIN", "");
    vi.resetModules();
    const { resolveCorsAllowOrigin } = await import("../server/cors-origins");
    expect(resolveCorsAllowOrigin("https://preview.example.com")).toBe(
      "https://preview.example.com",
    );
    expect(resolveCorsAllowOrigin("https://afuagro.tech")).toBe(
      "https://afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://evil.example")).toBeUndefined();
  });

  it("CORS_REFLECT_ORIGIN=1 restores reflect-any (explicit)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_REFLECT_ORIGIN", "1");
    vi.resetModules();
    const { resolveCorsAllowOrigin } = await import("../server/cors-origins");
    expect(resolveCorsAllowOrigin("https://evil.example")).toBe(
      "https://evil.example",
    );
  });
});
