import { describe, expect, it, vi, afterEach } from "vitest";

describe("storage backends", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("isForgeStorageConfigured exige URL e KEY", async () => {
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "");
    vi.resetModules();
    const { isForgeStorageConfigured } = await import("../server/storage");
    expect(isForgeStorageConfigured()).toBe(false);

    vi.stubEnv("BUILT_IN_FORGE_API_URL", "https://forge.example");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "secret");
    vi.resetModules();
    const mod2 = await import("../server/storage");
    expect(mod2.isForgeStorageConfigured()).toBe(true);
  });

  it("isS3StorageConfigured exige bucket e credenciais", async () => {
    vi.stubEnv("STORAGE_S3_BUCKET", "");
    vi.resetModules();
    const { isS3StorageConfigured } = await import("../server/storage-s3");
    expect(isS3StorageConfigured()).toBe(false);

    vi.stubEnv("STORAGE_S3_BUCKET", "afu");
    vi.stubEnv("STORAGE_S3_ACCESS_KEY_ID", "id");
    vi.stubEnv("STORAGE_S3_SECRET_ACCESS_KEY", "secret");
    vi.resetModules();
    const mod2 = await import("../server/storage-s3");
    expect(mod2.isS3StorageConfigured()).toBe(true);
  });

  it("getS3EnvPresence detecta aliases AWS", async () => {
    vi.stubEnv("STORAGE_S3_BUCKET", "");
    vi.stubEnv("AWS_S3_BUCKET", "b");
    vi.stubEnv("AWS_ACCESS_KEY_ID", "k");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "s");
    vi.resetModules();
    const { getS3EnvPresence, isS3StorageConfigured } = await import("../server/storage-s3");
    expect(getS3EnvPresence().bucket).toBe(true);
    expect(isS3StorageConfigured()).toBe(true);
  });

  it("S3 tem prioridade em isStorageBackendConfigured", async () => {
    vi.stubEnv("STORAGE_S3_BUCKET", "afu");
    vi.stubEnv("STORAGE_S3_ACCESS_KEY_ID", "id");
    vi.stubEnv("STORAGE_S3_SECRET_ACCESS_KEY", "secret");
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "");
    vi.resetModules();
    const { isStorageBackendConfigured } = await import("../server/storage");
    expect(isStorageBackendConfigured()).toBe(true);
  });
});
