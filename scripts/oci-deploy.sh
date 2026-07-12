#!/usr/bin/env bash
# Deploy AFU Mobile (API + Web + MySQL) em VM Oracle Cloud ou Cloud Shell com Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker não encontrado. Instale: https://docs.docker.com/engine/install/"
  exit 1
fi

COMPOSE="docker compose"
if ! $COMPOSE version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
fi

ENV_FILE="${ENV_FILE:-.env.oci}"
if [ ! -f "$ENV_FILE" ]; then
  echo "Crie $ENV_FILE a partir de .env.oci.example"
  cp .env.oci.example "$ENV_FILE"
  echo "Edite as senhas em $ENV_FILE e rode de novo."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "==> Build e subida dos containers (pode levar 10–20 min na primeira vez)..."
$COMPOSE --env-file "$ENV_FILE" -f docker-compose.oci.yml up -d --build

echo ""
echo "==> Aguardando stack..."
for i in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${HTTP_PORT:-80}/api/health" >/dev/null 2>&1; then
    echo "Stack OK"
    break
  fi
  sleep 5
  if [ "$i" -eq 90 ]; then
    echo "Timeout. Logs:"
    $COMPOSE -f docker-compose.oci.yml logs --tail=50 api web
    exit 1
  fi
done

PUBLIC_IP="${PUBLIC_IP:-$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')}"

echo ""
echo "=============================================="
echo " AFU Agro online na Oracle Cloud"
echo " Web:  http://${PUBLIC_IP}/"
echo " API:  http://${PUBLIC_IP}/api/health"
echo " Demo: demo@afuagro.com.br / Demo@1234"
echo "=============================================="
echo ""
echo "Após validar, remova SEED_ON_START do $ENV_FILE e rode:"
echo "  $COMPOSE --env-file $ENV_FILE -f docker-compose.oci.yml up -d api"
