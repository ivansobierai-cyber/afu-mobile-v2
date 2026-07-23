/**
 * Smoke API — custo médio estoque + produtividade colheita real.
 * Gera evidência em docs/evidencias/smoke-plano-auxiliar-latest.json
 *
 * Uso:
 *   npm run smoke:plano-auxiliar
 *   SMOKE_API_URL=https://... npm run smoke:plano-auxiliar
 *   # remoto é read-only por padrão; force write com SMOKE_WRITE=1
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import superjson from "superjson";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/routers";

const API =
  process.env.SMOKE_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";
const IS_LOCAL = /localhost|127\.0\.0\.1/.test(API);
const READ_ONLY =
  process.env.SMOKE_READ_ONLY === "1" ||
  (!IS_LOCAL && process.env.SMOKE_WRITE !== "1");
const DEMO_EMAIL = "demo@afuagro.com.br";
const DEMO_PASSWORD = "Demo@1234";

function envLabel(api: string) {
  if (/railway\.app/.test(api)) return "railway";
  if (/localhost|127\.0\.0\.1/.test(api)) return "local";
  return "custom";
}

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

function writeEvidence(evidence: Record<string, unknown>) {
  const outDir = path.join(process.cwd(), "docs/evidencias");
  fs.mkdirSync(outDir, { recursive: true });
  const at = String(evidence.at ?? new Date().toISOString());
  const stamp = at.replace(/[:.]/g, "-");
  const isRailway = evidence.environment === "railway";
  const latest = isRailway
    ? "smoke-plano-auxiliar-railway-probe-latest.json"
    : "smoke-plano-auxiliar-latest.json";
  const stamped = isRailway
    ? `smoke-plano-auxiliar-railway-probe-${stamp}.json`
    : `smoke-plano-auxiliar-${stamp}.json`;
  fs.writeFileSync(path.join(outDir, stamped), JSON.stringify(evidence, null, 2));
  fs.writeFileSync(path.join(outDir, latest), JSON.stringify(evidence, null, 2));
}

async function main() {
  const started = Date.now();
  const checks: Check[] = [];
  const push = (id: string, ok: boolean, detail?: Check["detail"]) => {
    checks.push({ id, ok, detail });
    console.log(`${ok ? "✓" : "✗"} ${id}`, detail ?? "");
  };

  let estoqueMs = 0;
  let prodMs = 0;

  try {
    const health = await fetch(`${API}/api/health`);
    push("health", health.ok, { status: health.status });
    if (!health.ok) throw new Error(`health ${health.status}`);

    const anon = makeClient();
    const login = await anon.auth.login.mutate({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    const token = login.accessToken;
    push("login", Boolean(token), { email: login.user?.email });
    if (!token) throw new Error("login sem token");

    const client = makeClient(token);
    const props = await client.coreData.propriedades.list.query();
    const prop = props[0];
    push("propriedade", Boolean(prop), { id: prop?.id, nome: prop?.nome });
    if (!prop) throw new Error("sem propriedade");

    const terrenos = await client.coreData.terrenos.listByPropriedade.query({
      propriedadeId: prop.id,
    });
    const terreno = terrenos[0];
    push("talhao", Boolean(terreno), { id: terreno?.id });

    const tEstoque = Date.now();
    try {
      if (READ_ONLY) {
        const estDash = await client.coreData.expansao.estoque.dashboard.query({
          propriedadeId: prop.id,
        });
        estoqueMs = Date.now() - tEstoque;
        push("estoque.valorDisponivel", estDash.valorDisponivel === true, {
          valorDisponivel: estDash.valorDisponivel,
          valorTotalEstoque: estDash.valorTotalEstoque,
          readOnly: true,
        });
        push(
          "estoque.valorTotalEstoque",
          typeof estDash.valorTotalEstoque === "number",
          { valorTotalEstoque: estDash.valorTotalEstoque, readOnly: true },
        );
      } else {
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
        estoqueMs = Date.now() - tEstoque;
        push("estoque.valorDisponivel", estDash.valorDisponivel === true, {
          valorDisponivel: estDash.valorDisponivel,
          valorTotalEstoque: estDash.valorTotalEstoque,
        });
        push("estoque.valorTotalEstoque", Number(estDash.valorTotalEstoque) > 0, {
          valorTotalEstoque: estDash.valorTotalEstoque,
        });
      }
    } catch (e) {
      estoqueMs = Date.now() - tEstoque;
      push("estoque.dashboard", false, e instanceof Error ? e.message : String(e));
    }

    const tProd = Date.now();
    if (!terreno) {
      push("produtividade", false, "sem talhão");
      prodMs = Date.now() - tProd;
    } else {
      try {
        if (READ_ONLY) {
          const cults = await client.coreData.cultivos.listByPropriedade.query({
            propriedadeId: prop.id,
          });
          const ind = await client.coreData.expansao.indicadores.query({
            propriedadeId: prop.id,
          });
          push("propriedade.indicadores.endpoint", ind != null, {
            fonte: (ind as { produtividadeFonte?: string | null }).produtividadeFonte ?? null,
            produtividade: ind.produtividade,
            readOnly: true,
          });
          const any = cults[0];
          if (any) {
            const indCultivo = await client.coreData.cultivos.indicadores.query({
              id: any.id,
            });
            push("cultivo.indicadores.endpoint", indCultivo != null, {
              fonte:
                (indCultivo as { produtividadeFonte?: string | null }).produtividadeFonte ??
                null,
              produtividade: indCultivo.produtividade,
              readOnly: true,
            });
          } else {
            push("cultivo.indicadores.endpoint", false, {
              readOnly: true,
              reason: "nenhum cultivo",
            });
          }
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
          const indCultivo = await client.coreData.cultivos.indicadores.query({
            id: cultivoId,
          });
          push(
            "cultivo.produtividade",
            indCultivo.produtividadeFonte === "real" &&
              indCultivo.produtividade === 550,
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
      } catch (e) {
        push("produtividade", false, e instanceof Error ? e.message : String(e));
      }
      prodMs = Date.now() - tProd;
    }

    const passed = checks.filter((c) => c.ok).length;
    const failed = checks.filter((c) => !c.ok);
    const evidence = {
      suite: "smoke-plano-auxiliar",
      at: new Date().toISOString(),
      environment: envLabel(API),
      api: API,
      readOnly: READ_ONLY,
      branch: "cursor/etapa7-estoque-inteligente-fd64",
      decision: failed.length === 0 ? "AVANCAR" : "BLOQUEADO",
      durationMs: Date.now() - started,
      timingsMs: { estoque: estoqueMs, produtividade: prodMs },
      passed,
      total: checks.length,
      checks,
    };
    writeEvidence(evidence);
    console.log(
      "\n" +
        JSON.stringify(
          {
            decision: evidence.decision,
            passed,
            total: checks.length,
            api: API,
            readOnly: READ_ONLY,
          },
          null,
          2,
        ),
    );
    if (failed.length) process.exit(1);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!checks.some((c) => c.id === "fatal")) push("fatal", false, msg);
    const evidence = {
      suite: "smoke-plano-auxiliar",
      at: new Date().toISOString(),
      environment: envLabel(API),
      api: API,
      readOnly: READ_ONLY,
      branch: "cursor/etapa7-estoque-inteligente-fd64",
      decision: "BLOQUEADO",
      durationMs: Date.now() - started,
      passed: checks.filter((c) => c.ok).length,
      total: checks.length,
      checks,
      error: msg,
    };
    writeEvidence(evidence);
    console.error(msg);
    process.exit(1);
  }
}

main();
