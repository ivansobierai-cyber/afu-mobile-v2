import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveCorsAllowOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("allows afuagro.tech and www by default (reflect)", async () => {
    vi.resetModules();
    const { resolveCorsAllowOrigin, REQUIRED_WEB_CORS_ORIGINS } = await import(
      "../server/cors-origins"
    );
    expect(REQUIRED_WEB_CORS_ORIGINS).toContain("https://afuagro.tech");
    expect(REQUIRED_WEB_CORS_ORIGINS).toContain("https://www.afuagro.tech");
    expect(resolveCorsAllowOrigin("https://afuagro.tech")).toBe(
      "https://afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("https://www.afuagro.tech")).toBe(
      "https://www.afuagro.tech",
    );
    expect(resolveCorsAllowOrigin("http://localhost:8081")).toBe(
      "http://localhost:8081",
    );
  });

  it("CORS_ALLOWED_ORIGINS still keeps required web origins", async () => {
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "https://preview.example.com");
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
});
