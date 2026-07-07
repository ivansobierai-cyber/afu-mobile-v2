#!/bin/sh
set -e

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
