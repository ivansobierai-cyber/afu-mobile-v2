/**
 * Verifica se um host tRPC expõe um path (ex.: smoke pós-deploy Railway).
 * Uso: node scripts/probe-trpc-procedure-path.mjs coreData.operacoes.createApontamento
 */
const path = process.argv[2] ?? "coreData.operacoes.createApontamento";
const apiBase = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://afu-mobile-v2-production.up.railway.app"
).replace(/\/$/, "");

const url = `${apiBase}/api/trpc/${path}`;
const body = JSON.stringify({
  json: { operacaoId: 1, inicioReal: "2026-01-01T10:00:00.000Z" },
});

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
});
const text = await res.text();

let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  console.error(JSON.stringify({ ok: false, apiBase, path, status: res.status, raw: text.slice(0, 300) }));
  process.exit(1);
}

const msg = parsed?.error?.json?.message ?? parsed?.error?.message ?? "";
const notFound =
  msg.includes("No procedure found") ||
  parsed?.error?.json?.data?.code === "NOT_FOUND";

if (notFound) {
  console.error(
    JSON.stringify({
      ok: false,
      apiBase,
      path,
      status: res.status,
      message: msg,
      hint: "API deste host não contém o código 2H — faça deploy do branch feat/fase-2h no Railway.",
    }),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    apiBase,
    path,
    status: res.status,
    note: "Procedure existe (resposta não é NOT_FOUND de path ausente).",
    sample: parsed,
  }),
);
