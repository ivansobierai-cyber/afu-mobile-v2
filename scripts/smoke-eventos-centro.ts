/**
 * Smoke local/API — Centro de Eventos (Etapas 1–5).
 * Uso: EXPO_PUBLIC_API_BASE_URL=https://... npx tsx scripts/smoke-eventos-centro.ts
 */
import "dotenv/config";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../server/routers";
import { gerarEventosDoCiclo } from "../lib/eventos/ciclo-cultura";
import { montarSugestoesIA } from "../lib/eventos/ia-sugestoes";
import { nextOccurrenceDate } from "../lib/eventos/recurrence";

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
  const checks: { name: string; ok: boolean; detail?: string }[] = [];

  // Unit-side invariants
  checks.push({
    name: "ciclo gera >= 6 eventos",
    ok: gerarEventosDoCiclo({ nomeCultura: "Soja", dataPlantio: "2026-07-01" }).length >= 6,
  });
  checks.push({
    name: "recorrencia diaria",
    ok: !!nextOccurrenceDate("2026-07-01", "diaria"),
  });
  checks.push({
    name: "ia detecta atraso",
    ok:
      montarSugestoesIA({
        eventos: [
          {
            id: 1,
            titulo: "X",
            tipoAtividade: "plantio",
            status: "pendente",
            dataProgramada: "2020-01-01",
          },
        ],
        hoje: new Date("2026-07-24"),
      }).length > 0,
  });

  const login = await makeClient().auth.login.mutate({
    email: "demo@afuagro.com.br",
    password: "Demo@1234",
  });
  checks.push({ name: "login", ok: !!login.accessToken });
  const c = makeClient(login.accessToken);

  const list = await c.coreData.calendario.list.query({});
  checks.push({ name: "list eventos", ok: Array.isArray(list) });

  const stats = await c.coreData.calendario.stats.query({});
  checks.push({
    name: "stats",
    ok: typeof stats.total === "number" && typeof (stats as any).atrasados === "number",
  });

  const ia = await c.coreData.calendario.sugestoesIA.query({});
  checks.push({ name: "sugestoesIA", ok: Array.isArray(ia.sugestoes) });

  const failed = checks.filter((x) => !x.ok);
  const report = {
    suite: "smoke-eventos-centro",
    at: new Date().toISOString(),
    api: API,
    decision: failed.length ? "BLOQUEADO" : "AVANCAR",
    checks,
  };
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
