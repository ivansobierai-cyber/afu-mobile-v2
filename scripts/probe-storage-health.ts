/**
 * Probe rápido do storage via /api/health (sem login).
 * Uso: EXPO_PUBLIC_API_BASE_URL=https://... npm run probe:storage
 */
const API =
  process.env.SMOKE_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

async function main() {
  const resp = await fetch(`${API}/api/health`);
  const body = await resp.json();
  console.log(JSON.stringify({ api: API, status: resp.status, ...body }, null, 2));
  const storage = body.storage as { storageReady?: boolean; forgePresignOk?: boolean } | undefined;
  if (!storage?.storageReady && !storage?.forgePresignOk) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
