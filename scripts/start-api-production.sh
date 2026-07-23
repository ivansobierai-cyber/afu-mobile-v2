#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ] && [ -n "$MYSQL_URL" ]; then
  export DATABASE_URL="$MYSQL_URL"
fi

if [ -z "$DATABASE_URL" ] && [ -n "$MYSQLHOST" ]; then
  export DATABASE_URL="mysql://${MYSQLUSER}:${MYSQLPASSWORD}@${MYSQLHOST}:${MYSQLPORT:-3306}/${MYSQLDATABASE}"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "[api] ERROR: DATABASE_URL is not set."
  echo "[api] On Railway (API service Variables), add:"
  echo "[api]   DATABASE_URL=\${{MySQL.MYSQL_URL}}"
  echo "[api] Replace 'MySQL' with your database service name if different."
  exit 1
fi

case "$DATABASE_URL" in
  railwaymysql://*)
    echo "[api] WARN: fixing malformed DATABASE_URL prefix (railwaymysql -> mysql)"
    export DATABASE_URL="mysql://${DATABASE_URL#railwaymysql://}"
    ;;
esac

case "$DATABASE_URL" in
  *127.0.0.1*|*localhost*)
    echo "[api] ERROR: DATABASE_URL points to localhost."
    echo "[api] Use: DATABASE_URL=\${{MySQL.MYSQL_URL}}"
    exit 1
    ;;
esac

BOOT_PORT="${PORT:-3000}"

# Responde health imediatamente para o Railway não marcar 502 durante migrate/seed.
echo "[api] Starting temporary boot health on port ${BOOT_PORT}..."
node -e "
const http=require('http');
const port=Number(process.env.PORT||3000);
const s=http.createServer((req,res)=>{
  res.setHeader('content-type','application/json');
  if (req.url && req.url.startsWith('/api/health')) {
    res.end(JSON.stringify({ok:true,booting:true,timestamp:Date.now()}));
    return;
  }
  res.statusCode=503;
  res.end(JSON.stringify({ok:false,booting:true}));
});
s.listen(port,'0.0.0.0',()=>console.log('[api] boot health listening on',port));
" &
BOOT_PID=$!
# garante que o listen subiu
sleep 1

echo "[api] Running database migrations..."
if command -v timeout >/dev/null 2>&1; then
  timeout 90 npx drizzle-kit migrate || echo "[api] WARN: drizzle-kit migrate failed or timed out"
else
  npx drizzle-kit migrate || echo "[api] WARN: drizzle-kit migrate failed"
fi

echo "[api] Applying sync/ai + safras + archive schema (idempotent)..."
npm run db:sync-ai:apply || echo "[api] WARN: db:sync-ai:apply failed (non-fatal)"
npm run db:safras:apply || echo "[api] WARN: db:safras:apply failed (non-fatal)"
npm run db:archive:apply || echo "[api] WARN: db:archive:apply failed (non-fatal)"
npm run db:tarefas-responsavel:apply || echo "[api] WARN: db:tarefas-responsavel:apply failed (non-fatal)"
npm run db:maquinas:apply || echo "[api] WARN: db:maquinas:apply failed (non-fatal)"
npm run db:estoque:apply || echo "[api] WARN: db:estoque:apply failed (non-fatal)"
npm run db:centros-custo:apply || echo "[api] WARN: db:centros-custo:apply failed (non-fatal)"
npm run db:financeiro:apply || echo "[api] WARN: db:financeiro:apply failed (non-fatal)"
npm run db:maquinas-controle:apply || echo "[api] WARN: db:maquinas-controle:apply failed (non-fatal)"
npm run db:equipe:apply || echo "[api] WARN: db:equipe:apply failed (non-fatal)"

run_seeds() {
  echo "[api] Running demo seeds (background)..."
  npm run seed || echo "[api] WARN: seed failed"
  npm run seed:marketplace || echo "[api] WARN: seed:marketplace failed"
  npm run seed:comprador || echo "[api] WARN: seed:comprador failed"
  echo "[api] Running banco expansão 30–46..."
  npm run seed:banco-expansao || echo "[api] WARN: seed:banco-expansao failed"
  echo "[api] Backfill safras padrão (idempotente)..."
  npm run db:safras:backfill || echo "[api] WARN: db:safras:backfill failed (non-fatal)"
  echo "[api] Seeds finished."
}

if [ "$SEED_ON_START" = "1" ]; then
  echo "[api] SEED_ON_START=1 — seeds em background após API real"
fi

echo "[api] Stopping temporary boot health (pid ${BOOT_PID})..."
kill "$BOOT_PID" 2>/dev/null || true
wait "$BOOT_PID" 2>/dev/null || true
sleep 1

if [ "$SEED_ON_START" = "1" ]; then
  (
    sleep 3
    run_seeds
  ) &
fi

echo "[api] Starting server on port ${BOOT_PORT}..."
exec node dist/index.js
