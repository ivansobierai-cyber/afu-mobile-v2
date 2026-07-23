/**
 * Smoke produção — gerarPDF resultado_cultivo
 * Uso: EXPO_PUBLIC_API_BASE_URL=https://... npx tsx scripts/smoke-resultado-cultivo.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import superjson from "superjson";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/routers";
import { buildResultadoCultivoConteudo } from "../lib/cultivos/resultado-cultivo-report";

const API =
  process.env.SMOKE_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

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
  const login = await makeClient().auth.login.mutate({
    email: "demo@afuagro.com.br",
    password: "Demo@1234",
  });
  if (!login.accessToken) throw new Error("login sem token");
  const c = makeClient(login.accessToken);
  const props = await c.coreData.propriedades.list.query();
  if (!props[0]) throw new Error("sem propriedade");
  const cults = await c.coreData.cultivos.listByPropriedade.query({
    propriedadeId: props[0].id,
  });
  const cult = cults[0];
  if (!cult) throw new Error("sem cultivo");

  const ind = await c.coreData.cultivos.indicadores.query({ id: cult.id });
  const dash = await c.coreData.cultivos.dashboard.query({ id: cult.id });
  const conteudo = buildResultadoCultivoConteudo({
    indicadores: ind,
    dashboard: dash,
  });

  let decision = "BLOQUEADO";
  let detail: Record<string, unknown> = {};
  try {
    const pdf = await c.analise.gerarPDF.mutate({
      tipo: "resultado_cultivo",
      titulo: `Resultado — ${dash.cultivo.nomeCultura ?? cult.id}`,
      propriedadeId: props[0].id,
      culturaNome: dash.cultivo.nomeCultura ?? undefined,
      conteudo: JSON.stringify(conteudo),
      dataEmissao: new Date().toISOString().slice(0, 10),
      persist: false,
    });
    const ok = pdf.html.includes("Relatório de Resultado do Cultivo");
    decision = ok ? "AVANCAR" : "BLOQUEADO";
    detail = { titulo: pdf.titulo, tipo: pdf.tipo, htmlLen: pdf.html.length, ok };
  } catch (e) {
    detail = { error: e instanceof Error ? e.message : String(e) };
  }

  const evidence = {
    suite: "smoke-resultado-cultivo",
    at: new Date().toISOString(),
    api: API,
    decision,
    detail,
  };
  const outDir = path.join(process.cwd(), "docs/evidencias");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "smoke-resultado-cultivo-latest.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify(evidence, null, 2));
  if (decision !== "AVANCAR") process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
