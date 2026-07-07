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

if [ "$SEED_ON_START" = "1" ]; then
  echo "[api] Running demo seeds..."
  npm run seed || true
  npm run seed:marketplace || true
  npm run seed:comprador || true
fi

echo "[api] Starting server on port ${PORT:-3000}..."
exec node dist/index.js
