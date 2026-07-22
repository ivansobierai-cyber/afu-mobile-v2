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

echo "[api] Running database migrations..."
npx drizzle-kit migrate

# Idempotente: cobre casos em que o journal falhou no meio (0018/0019/0020/0021)
echo "[api] Applying sync/ai + safras + archive schema (idempotent)..."
npm run db:sync-ai:apply
npm run db:safras:apply
npm run db:archive:apply

run_seeds() {
  echo "[api] Running demo seeds (background)..."
  npm run seed
  npm run seed:marketplace
  npm run seed:comprador
  echo "[api] Running banco expansão 30–46..."
  npm run seed:banco-expansao
  echo "[api] Backfill safras padrão (idempotente)..."
  npm run db:safras:backfill || echo "[api] WARN: db:safras:backfill failed (non-fatal)"
  echo "[api] Seeds finished."
}

# Railway healthcheck exige PORT aberto cedo. Seed longo NÃO pode bloquear o listen.
if [ "$SEED_ON_START" = "1" ]; then
  echo "[api] SEED_ON_START=1 — seeds em background após abrir a porta"
  (
    # pequena folga para o HTTP subir
    sleep 3
    run_seeds
  ) &
fi

echo "[api] Starting server on port ${PORT:-3000}..."
exec node dist/index.js
