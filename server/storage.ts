// Uploads: S3/R2 (preferência) ou Forge presign legado.
// Downloads: /manus-storage/{key} (proxy autenticado ou URL assinada).

import { ENV } from "./_core/env";
import {
  isS3StorageConfigured,
  s3GetSignedDownloadUrl,
  s3PutObject,
} from "./storage-s3";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: configure STORAGE_S3_* ou BUILT_IN_FORGE_API_URL/KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

export function isForgeStorageConfigured(): boolean {
  return Boolean(ENV.forgeApiUrl?.trim() && ENV.forgeApiKey?.trim());
}

export function isStorageBackendConfigured(): boolean {
  return isS3StorageConfigured() || isForgeStorageConfigured();
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

async function forgeStoragePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
): Promise<void> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as BlobPart], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
}

async function forgeStorageGetSignedUrl(key: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const getUrl = new URL("v1/storage/presign/get", `${forgeUrl}/`);
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  if (!url) throw new Error("Empty signed URL from Forge");
  return url;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  if (!isStorageBackendConfigured()) {
    throw new Error(
      "Storage config missing: configure STORAGE_S3_* ou BUILT_IN_FORGE_API_URL/KEY",
    );
  }

  const key = appendHashSuffix(normalizeKey(relKey));

  if (isS3StorageConfigured()) {
    await s3PutObject(key, data, contentType);
  } else {
    await forgeStoragePut(key, data, contentType);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  if (isS3StorageConfigured()) {
    return s3GetSignedDownloadUrl(key);
  }
  return forgeStorageGetSignedUrl(key);
}
