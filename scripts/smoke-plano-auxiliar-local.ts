/**
 * Smoke API local — custo médio estoque + produtividade colheita real.
 * Gera evidência em docs/evidencias/smoke-plano-auxiliar-latest.json
 *
 * Uso: npm run smoke:plano-auxiliar
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import superjson from "superjson";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/routers";

const API = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const DEMO_EMAIL = "demo@afuagro.com.br";
const DEMO_PASSWORD = "Demo@1234";

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

type Check = { id: string; ok: boolean; detail?: Record<string, unknown> | string };

async function main() {
  const started = Date.now();
  const checks: Check[] = [];
  const push = (id: string, ok: boolean, detail?: Check["detail"]) => {
    checks.push({ id, ok, detail });
    console.log(`${ok ? "✓" : "✗"} ${id}`, detail ?? "");
  };

  const health = await fetch(`${API}/api/health`);
  push("health", health.ok, { status: health.status });
  if (!health.ok) process.exit(1);

  const anon = makeClient();
  const login = await anon.auth.login.mutate({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  const token = login.accessToken;
  push("login", Boolean(token), { email: login.user?.email });
  if (!token) process.exit(1);

  const client = makeClient(token);
  const props = await client.coreData.propriedades.list.query();
  const prop = props[0];
  push("propriedade", Boolean(prop), { id: prop?.id, nome: prop?.nome });
  if (!prop) process.exit(1);

  const terrenos = await client.coreData.terrenos.listByPropriedade.query({
    propriedadeId: prop.id,
  });
  const terreno = terrenos[0];
  push("talhao", Boolean(terreno), { id: terreno?.id });

  const t0 = Date.now();
  const itemId = await client.coreData.expansao.estoque.createItem.mutate({
    propriedadeId: prop.id,
    nome: `Smoke CMP ${Date.now()}`,
    categoria: "fertilizante",
    unidadeBase: "kg",
    saldoInicial: 100,
    custoMedio: 5,
  });
  await client.coreData.expansao.estoque.movimento.mutate({
    itemId,
    propriedadeId: prop.id,
    tipo: "entrada",
    quantidade: 100,
    custoUnitario: 7,
    motivo: "Smoke CMP",
  });
  const estDash = await client.coreData.expansao.estoque.dashboard.query({
    propriedadeId: prop.id,
  });
  const estoqueMs = Date.now() - t0;
  push("estoque.valorDisponivel", estDash.valorDisponivel === true, {
    valorDisponivel: estDash.valorDisponivel,
    valorTotalEstoque: estDash.valorTotalEstoque,
  });
  push("estoque.valorTotalEstoque", Number(estDash.valorTotalEstoque) > 0, {
    valorTotalEstoque: estDash.valorTotalEstoque,
  });

  const t1 = Date.now();
  if (!terreno) {
    push("produtividade.skip", false, "sem talhão");
  } else {
    const cultivoId = await client.coreData.cultivos.create.mutate({
      propriedadeId: prop.id,
      terrenoId: terreno.id,
      nomeCultura: `Smoke Prod ${Date.now()}`,
      areaPlantada: 20,
      producaoEstimada: 12000,
      unidadeProducao: "kg",
    });
    await client.coreData.cultivos.update.mutate({
      id: cultivoId,
      data: { producaoReal: 11000, status: "colhido" },
    });
    const indCultivo = await client.coreData.cultivos.indicadores.query({ id: cultivoId });
    push(
      "cultivo.produtividade",
      indCultivo.produtividadeFonte === "real" && indCultivo.produtividade === 550,
      {
        fonte: indCultivo.produtividadeFonte,
        produtividade: indCultivo.produtividade,
      },
    );
    const ind = await client.coreData.expansao.indicadores.query({
      propriedadeId: prop.id,
    });
    push("propriedade.produtividadeFonte", ind.produtividadeFonte === "real", {
      fonte: ind.produtividadeFonte,
      produtividade: ind.produtividade,
    });
  }
  const prodMs = Date.now() - t1;

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok);
  const evidence = {
    suite: "smoke-plano-auxiliar-local",
    at: new Date().toISOString(),
    environment: "local",
    api: API,
    branch: "cursor/etapa7-estoque-inteligente-fd64",
    decision: failed.length === 0 ? "AVANCAR" : "BLOQUEADO",
    durationMs: Date.now() - started,
    timingsMs: { estoque: estoqueMs, produtividade: prodMs },
    passed,
    total: checks.length,
    checks,
    ui_smoke: {
      note: "Ver docs/ETAPA10_SMOKE_HOMOLOGACAO.md — seção plano auxiliar 2026-07-23",
      screenshots: [
        "/opt/cursor/artifacts/01-dashboard-login-success.webp",
        "/opt/cursor/artifacts/02-estoque-dashboard-with-item.webp",
        "/opt/cursor/artifacts/03-cultivo-custos-produtividade.webp",
      ],
    },
  };

  const outDir = path.join(process.cwd(), "docs/evidencias");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = evidence.at.replace(/[:.]/g, "-");
  fs.writeFileSync(
    path.join(outDir, `smoke-plano-auxiliar-${stamp}.json`),
    JSON.stringify(evidence, null, 2),
  );
  fs.writeFileSync(
    path.join(outDir, "smoke-plano-auxiliar-latest.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log("\n" + JSON.stringify({ decision: evidence.decision, passed, total: checks.length }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
