import { afterEach, describe, expect, it, vi } from "vitest";

describe("normalizeS3Endpoint / validateS3Endpoint", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("trims, prepends https when scheme missing, strips trailing slash", async () => {
    vi.resetModules();
    const { normalizeS3Endpoint } = await import("../server/storage-s3");

    expect(normalizeS3Endpoint(undefined)).toBeUndefined();
    expect(normalizeS3Endpoint("")).toBeUndefined();
    expect(normalizeS3Endpoint("   ")).toBeUndefined();
    expect(normalizeS3Endpoint("  abc.r2.cloudflarestorage.com  ")).toBe(
      "https://abc.r2.cloudflarestorage.com",
    );
    expect(normalizeS3Endpoint("abc.r2.cloudflarestorage.com/")).toBe(
      "https://abc.r2.cloudflarestorage.com",
    );
    expect(normalizeS3Endpoint("https://abc.r2.cloudflarestorage.com///")).toBe(
      "https://abc.r2.cloudflarestorage.com",
    );
    expect(normalizeS3Endpoint("http://localhost:9000")).toBe("http://localhost:9000");
  });

  it("validateS3Endpoint accepts http(s) and rejects garbage", async () => {
    vi.resetModules();
    const { normalizeS3Endpoint, validateS3Endpoint } = await import(
      "../server/storage-s3"
    );

    const ok = validateS3Endpoint(
      normalizeS3Endpoint("acct.r2.cloudflarestorage.com")!,
    );
    expect(ok).toEqual({ ok: true });

    const bad = validateS3Endpoint("not a url at all :::");
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.detail).toMatch(/STORAGE_S3_ENDPOINT inválido/);
      expect(bad.detail).toMatch(/https:\/\//);
    }
  });

  it("getS3StorageConfig applies normalize so scheme-less R2 works", async () => {
    vi.stubEnv("STORAGE_S3_BUCKET", "afu");
    vi.stubEnv("STORAGE_S3_ACCESS_KEY_ID", "id");
    vi.stubEnv("STORAGE_S3_SECRET_ACCESS_KEY", "secret");
    vi.stubEnv("STORAGE_S3_ENDPOINT", "deadbeef.r2.cloudflarestorage.com/");
    vi.resetModules();
    const { getS3StorageConfig } = await import("../server/storage-s3");
    const cfg = getS3StorageConfig();
    expect(cfg?.endpoint).toBe("https://deadbeef.r2.cloudflarestorage.com");
    expect(cfg?.forcePathStyle).toBe(false);
  });

  it("probeS3StorageBucket returns clear hint before AWS SDK Invalid URL", async () => {
    vi.stubEnv("STORAGE_S3_BUCKET", "afu");
    vi.stubEnv("STORAGE_S3_ACCESS_KEY_ID", "id");
    vi.stubEnv("STORAGE_S3_SECRET_ACCESS_KEY", "secret");
    // After normalize this becomes https://… which is syntactically valid;
    // force an un-normalizable raw by stubbing validate path via nonsense host chars
    // that survive normalize but fail URL in edge cases — use empty-after-scheme case
    // by setting endpoint that normalize can't fix into a usable host.
    vi.stubEnv("STORAGE_S3_ENDPOINT", "://bad");
    vi.resetModules();
    const { probeS3StorageBucket, normalizeS3Endpoint, validateS3Endpoint } =
      await import("../server/storage-s3");

    // normalize leaves "://bad" with a scheme already present (":" is not a scheme match
    // because scheme must start with letter) — actually "^[a-zA-Z]..." won't match "://bad"
    // so we prepend https → "https://://bad" which URL() rejects.
    const normalized = normalizeS3Endpoint("://bad");
    expect(normalized).toBe("https://://bad");
    expect(validateS3Endpoint(normalized!).ok).toBe(false);

    const probe = await probeS3StorageBucket();
    expect(probe.ok).toBe(false);
    expect(probe.detail).toMatch(/STORAGE_S3_ENDPOINT/);
    expect(probe.detail).not.toBe("Invalid URL");
  });
});
