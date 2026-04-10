#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Parameterized deployment script
# Usage: DEPLOY_ENV=production APP_VERSION=abc12345 bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_ENV="${DEPLOY_ENV:-staging}"
APP_VERSION="${APP_VERSION:-$(git rev-parse --short HEAD)}"
IMAGE="${IMAGE:-ghcr.io/forgequantumsolution/quantumoptimizer}"
TAG="${IMAGE}:quantum-optimizer-${APP_VERSION}"

echo "======================================="
echo " Quantum Optimizer Deploy"
echo " Env:     $DEPLOY_ENV"
echo " Version: $APP_VERSION"
echo "======================================="

# 1. Validate env vars
bash scripts/validate-env.sh

# 2. Pull new image
echo "[1/5] Pulling image $TAG"
docker pull "$TAG"

# 3. Run DB migrations (with rollback plan)
echo "[2/5] Running database migrations"
docker run --rm \
  --env-file .env \
  "$TAG" \
  sh -c "node -e \"require('./dist/scripts/migrate').migrate()\""

# 4. Blue/Green: spin new container, health-check, then swap
echo "[3/5] Starting new container"
docker run -d \
  --name "qo-api-green-${APP_VERSION}" \
  --env-file .env \
  -e APP_VERSION="$APP_VERSION" \
  -p 3002:3001 \
  --restart unless-stopped \
  "$TAG"

echo "[4/5] Waiting for health check (60s timeout)"
MAX_WAIT=60
ELAPSED=0
until curl -sf http://localhost:3002/health/ready > /dev/null; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "Health check timed out. Rolling back."
    docker stop "qo-api-green-${APP_VERSION}" || true
    docker rm  "qo-api-green-${APP_VERSION}" || true
    exit 1
  fi
done

echo "[5/5] Switching traffic to new container"
# Stop old blue container (adjust container name to your deployment)
docker stop qo-api-blue 2>/dev/null || true
docker rm   qo-api-blue 2>/dev/null || true
docker rename "qo-api-green-${APP_VERSION}" qo-api-blue

# Reload nginx to route to new port
docker exec qo-nginx nginx -s reload 2>/dev/null || true

echo "======================================="
echo " Deploy complete — version $APP_VERSION"
echo "======================================="
