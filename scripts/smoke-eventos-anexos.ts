/**
 * Smoke API — anexos de Eventos (link + arquivo privado quando storage disponível).
 * Uso: EXPO_PUBLIC_API_BASE_URL=https://... npx tsx scripts/smoke-eventos-anexos.ts
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../server/routers";

const API =
  process.env.SMOKE_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

const DEMO_EMAIL = "demo@afuagro.com.br";
const DEMO_PASSWORD = "Demo@1234";

/** 1×1 PNG transparente */
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function makeClient(token?: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${API}/api/trpc`,
        transformer: superjson,
        headers() {
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

async function main() {
  const checks: { name: string; ok: boolean; detail?: string; optional?: boolean }[] = [];

  let storageHealth: {
    forgeConfigured?: boolean;
    forgePresignOk?: boolean;
    storageHint?: string;
  } = {};
  try {
    const healthResp = await fetch(`${API}/api/health`);
    const health = (await healthResp.json()) as {
      storage?: {
        forgeConfigured?: boolean;
        forgePresignOk?: boolean;
        storageHint?: string;
      };
    };
    storageHealth = health.storage ?? {};
    checks.push({
      name: "health storage forgeConfigured",
      ok: typeof storageHealth.forgeConfigured === "boolean",
      detail: JSON.stringify(storageHealth),
    });
    if (storageHealth.forgeConfigured) {
      checks.push({
        name: "health storage forgePresignOk",
        ok: storageHealth.forgePresignOk === true,
        detail: storageHealth.storageHint,
      });
    }
  } catch (e) {
    checks.push({
      name: "health storage",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  const fileUploadOptional = !storageHealth.forgePresignOk;

  const login = await makeClient().auth.login.mutate({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  checks.push({ name: "login", ok: !!login.accessToken });
  const c = makeClient(login.accessToken);

  const list = await c.coreData.calendario.list.query({});
  let eventoId = list[0]?.id as number | undefined;
  if (!eventoId) {
    const created = await c.coreData.calendario.create.mutate({
      tipoAtividade: "inspecao",
      titulo: `Smoke anexos ${Date.now()}`,
      dataProgramada: new Date().toISOString().slice(0, 10),
      status: "pendente",
    });
    eventoId = typeof created === "number" ? created : Number(created);
  }
  checks.push({ name: "evento alvo", ok: Number.isFinite(eventoId) });

  const linkNome = `smoke-link-${Date.now()}`;
  const link = await c.coreData.calendario.addAnexoLink.mutate({
    eventoId: eventoId!,
    nome: linkNome,
    url: "https://example.com/afu-smoke-anexo",
  });
  checks.push({ name: "addAnexoLink", ok: link.id > 0 });

  const listed = await c.coreData.calendario.listAnexos.query({ eventoId: eventoId! });
  checks.push({
    name: "listAnexos contém link",
    ok: listed.some((a) => a.id === link.id && a.nome === linkNome),
  });

  let arquivoId: number | undefined;
  try {
    const arquivo = await c.coreData.calendario.addAnexoArquivo.mutate({
      eventoId: eventoId!,
      filename: "smoke.png",
      contentType: "image/png",
      dataBase64: TINY_PNG_BASE64,
      nome: "Smoke PNG",
    });
    arquivoId = arquivo.id;
    checks.push({ name: "addAnexoArquivo", ok: arquivo.id > 0 });

    const dl = await c.coreData.calendario.getAnexoDownloadUrl.mutate({ anexoId: arquivo.id });
    const urlOk = typeof dl.url === "string" && dl.url.startsWith("http");
    checks.push({ name: "getAnexoDownloadUrl", ok: urlOk, detail: urlOk ? undefined : "url inválida" });

    if (urlOk) {
      const head = await fetch(dl.url, { method: "GET" });
      checks.push({
        name: "download arquivo (GET)",
        ok: head.ok,
        detail: head.ok ? undefined : `status ${head.status}`,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      name: "addAnexoArquivo",
      ok: false,
      optional: fileUploadOptional,
      detail: fileUploadOptional
        ? `storage não pronto: ${msg.slice(0, 120)}`
        : msg.slice(0, 200),
    });
    checks.push({
      name: "getAnexoDownloadUrl",
      ok: false,
      optional: fileUploadOptional,
      detail: "pulado — sem arquivo",
    });
  }

  try {
    await c.coreData.calendario.deleteAnexo.mutate({ id: link.id });
    checks.push({ name: "deleteAnexo link", ok: true });
  } catch (e) {
    checks.push({
      name: "deleteAnexo link",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  if (arquivoId) {
    try {
      await c.coreData.calendario.deleteAnexo.mutate({ id: arquivoId });
      checks.push({ name: "deleteAnexo arquivo", ok: true });
    } catch (e) {
      checks.push({
        name: "deleteAnexo arquivo",
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const requiredFailed = checks.filter((x) => !x.ok && !x.optional);
  const report = {
    suite: "smoke-eventos-anexos",
    at: new Date().toISOString(),
    api: API,
    storage: storageHealth,
    eventoId,
    decision: requiredFailed.length ? "BLOQUEADO" : "AVANCAR",
    checks,
  };

  const outPath = join(process.cwd(), "docs", "evidencias", "smoke-eventos-anexos-latest.json");
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (requiredFailed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
