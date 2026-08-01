import { ENV } from "./_core/env";

export function isForgeStorageConfigured(): boolean {
  return Boolean(ENV.forgeApiUrl?.trim() && ENV.forgeApiKey?.trim());
}

/** Presign PUT sem upload — valida URL/chave Forge no deploy. */
export async function probeForgeStoragePresign(): Promise<{
  ok: boolean;
  detail?: string;
}> {
  if (!isForgeStorageConfigured()) {
    return { ok: false, detail: "BUILT_IN_FORGE_API_URL/KEY ausentes" };
  }
  const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  try {
    const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
    presignUrl.searchParams.set("path", "org/0/_probe/healthcheck.txt");
    const resp = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
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

export async function getPublicStorageHealth(): Promise<{
  forgeConfigured: boolean;
  forgePresignOk: boolean;
  detail?: string;
}> {
  const forgeConfigured = isForgeStorageConfigured();
  if (!forgeConfigured) {
    return {
      forgeConfigured: false,
      forgePresignOk: false,
      detail: "configure BUILT_IN_FORGE_API_URL e BUILT_IN_FORGE_API_KEY no Railway",
    };
  }
  const probe = await probeForgeStoragePresign();
  return {
    forgeConfigured: true,
    forgePresignOk: probe.ok,
    detail: probe.ok ? undefined : probe.detail,
  };
}
