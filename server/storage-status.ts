import { isForgeStorageConfigured, isStorageBackendConfigured } from "./storage";
import { isS3StorageConfigured, probeS3StorageBucket } from "./storage-s3";

/** Presign PUT sem upload — valida URL/chave Forge no deploy. */
export async function probeForgeStoragePresign(): Promise<{
  ok: boolean;
  detail?: string;
}> {
  if (!isForgeStorageConfigured()) {
    return { ok: false, detail: "BUILT_IN_FORGE_API_URL/KEY ausentes" };
  }
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL!.replace(/\/+$/, "");
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY!;
  try {
    const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
    presignUrl.searchParams.set("path", "org/0/_probe/healthcheck.txt");
    const resp = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${forgeKey}` },
    });
    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      return { ok: false, detail: `presign HTTP ${resp.status}: ${msg.slice(0, 180)}` };
    }
    const body = (await resp.json()) as { url?: string };
    if (!body.url) return { ok: false, detail: "presign sem url" };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export type PublicStorageHealth = {
  backend: "s3" | "forge" | "none";
  s3Configured: boolean;
  forgeConfigured: boolean;
  /** Pronto para upload/download de arquivo */
  storageReady: boolean;
  /** Alias legado (smoke) */
  forgePresignOk: boolean;
  detail?: string;
};

export async function getPublicStorageHealth(): Promise<PublicStorageHealth> {
  const s3Configured = isS3StorageConfigured();
  const forgeConfigured = isForgeStorageConfigured();

  if (s3Configured) {
    const probe = await probeS3StorageBucket();
    return {
      backend: "s3",
      s3Configured: true,
      forgeConfigured,
      storageReady: probe.ok,
      forgePresignOk: probe.ok,
      detail: probe.ok ? undefined : probe.detail,
    };
  }

  if (forgeConfigured) {
    const probe = await probeForgeStoragePresign();
    return {
      backend: "forge",
      s3Configured: false,
      forgeConfigured: true,
      storageReady: probe.ok,
      forgePresignOk: probe.ok,
      detail: probe.ok ? undefined : probe.detail,
    };
  }

  return {
    backend: "none",
    s3Configured: false,
    forgeConfigured: false,
    storageReady: false,
    forgePresignOk: false,
    detail:
      "configure STORAGE_S3_* (R2/S3) ou BUILT_IN_FORGE_* no Railway — ver docs/RAILWAY_STORAGE_EVENTOS.md",
  };
}

export { isStorageBackendConfigured };
