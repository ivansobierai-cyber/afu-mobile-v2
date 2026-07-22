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

# 0020/0021 ainda não estão no journal completo do drizzle-kit em todos os ambientes;
# apply idempotente garante safras + soft-archive no MySQL do Railway.
echo "[api] Applying safras + property archive schema (idempotent)..."
npm run db:safras:apply
npm run db:archive:apply

if [ "$SEED_ON_START" = "1" ]; then
  echo "[api] Running demo seeds..."
  npm run seed
  npm run seed:marketplace
  npm run seed:comprador
  echo "[api] Running banco expansão 30–46..."
  npm run seed:banco-expansao
  echo "[api] Backfill safras padrão (idempotente)..."
  npm run db:safras:backfill || echo "[api] WARN: db:safras:backfill failed (non-fatal)"
fi

echo "[api] Starting server on port ${PORT:-3000}..."
exec node dist/index.js
