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
    const { resolveCorsAllowOrigin, REQUIRED_WEB_CORS_ORIGINS } = await import(
      "../server/cors-origins"
    );
    expect(REQUIRED_WEB_CORS_ORIGINS).toEqual([
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
