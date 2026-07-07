/**
 * Smoke test P3 — login, clima, push, propriedades GPS
 * Uso: npx tsx scripts/smoke-p3.ts
 */
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

async function main() {
  const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

  const log = (name: string, ok: boolean, detail?: string) => {
    results.push({ name, ok, detail });
    const icon = ok ? "✓" : "✗";
    console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
  };

  console.log("\n=== AFU P3 Smoke Test ===\n");
  console.log(`API: ${API}\n`);

  try {
    const health = await fetch(`${API}/api/health`);
    log("Health check", health.ok, `status ${health.status}`);
  } catch (e) {
    log("Health check", false, String(e));
    process.exit(1);
  }

  const anon = makeClient();
  let token: string | undefined;

  try {
    const login = await anon.auth.login.mutate({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    token = login.accessToken ?? undefined;
    log("Login demo", !!token, login.user?.email ?? undefined);
  } catch (e) {
    log("Login demo", false, e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  const client = makeClient(token);

  try {
    const props = await client.coreData.propriedades.list.query();
    const comGps = props.filter((p) => p.latitude && p.longitude);
    log("Propriedades", props.length > 0, `${props.length} total, ${comGps.length} com GPS`);

    if (comGps.length > 0) {
      const prop = comGps[0];
      try {
        const weather = await client.weather.byPropriedade.query({ propriedadeId: prop.id });
        log(
          "Clima (Open-Meteo)",
          weather.current.temperature != null,
          `${Math.round(weather.current.temperature)}°C, ${weather.current.weatherLabel}, ${weather.alerts.length} alerta(s)`,
        );
      } catch (e) {
        log("Clima (Open-Meteo)", false, e instanceof Error ? e.message : String(e));
      }
    } else {
      log("Clima (Open-Meteo)", false, "nenhuma propriedade com GPS");
    }
  } catch (e) {
    log("Propriedades", false, e instanceof Error ? e.message : String(e));
  }

  try {
    const status = await client.push.status.query();
    log("Push status", true, `${status.tokenCount} dispositivo(s) registrado(s)`);

    const fakeToken = `ExponentPushToken[smoke-test-${Date.now()}]`;
    await client.push.register.mutate({
      expoPushToken: fakeToken,
      platform: "android",
      deviceName: "smoke-test",
    });
    const after = await client.push.status.query();
    log("Push register", after.tokenCount >= 1, `tokens: ${after.tokenCount}`);

    await client.push.unregister.mutate({ expoPushToken: fakeToken });
    log("Push unregister", true);
  } catch (e) {
    log("Push API", false, e instanceof Error ? e.message : String(e));
  }

  try {
    const eventId = await client.coreData.calendario.create.mutate({
      titulo: "Smoke test P3 — irrigação",
      tipoAtividade: "irrigacao",
      prioridade: "normal",
      dataProgramada: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      status: "pendente",
      lembreteAtivo: true,
    });
    log("Calendário + push trigger", !!eventId, `evento #${eventId}`);

    await client.coreData.calendario.delete.mutate({ id: Number(eventId) });
    log("Cleanup evento teste", true);
  } catch (e) {
    log("Calendário", false, e instanceof Error ? e.message : String(e));
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Resultado: ${results.length - failed}/${results.length} OK ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
