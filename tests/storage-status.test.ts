import { describe, expect, it, vi, afterEach } from "vitest";

describe("storage-status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("isForgeStorageConfigured exige URL e KEY", async () => {
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "");
    vi.resetModules();
    const { isForgeStorageConfigured } = await import("../server/storage-status");
    expect(isForgeStorageConfigured()).toBe(false);

    vi.stubEnv("BUILT_IN_FORGE_API_URL", "https://forge.example");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "secret");
    vi.resetModules();
    const mod2 = await import("../server/storage-status");
    expect(mod2.isForgeStorageConfigured()).toBe(true);
  });
});
