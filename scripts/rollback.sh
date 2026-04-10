#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# rollback.sh — One-command rollback to a previous image version
# Usage: VERSION=abc12345 bash scripts/rollback.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VERSION="${VERSION:-}"
IMAGE="${IMAGE:-ghcr.io/forgequantumsolution/quantumoptimizer}"

if [ -z "$VERSION" ]; then
  echo "ERROR: VERSION is required. Example: VERSION=abc12345 bash scripts/rollback.sh"
  exit 1
fi

TAG="${IMAGE}:quantum-optimizer-${VERSION}"

echo "======================================="
echo " ROLLBACK to version $VERSION"
echo "======================================="

echo "[1/4] Pulling rollback image $TAG"
docker pull "$TAG"

echo "[2/4] Starting rollback container"
docker run -d \
  --name "qo-api-rollback-${VERSION}" \
  --env-file .env \
  -e APP_VERSION="$VERSION" \
  -p 3002:3001 \
  --restart unless-stopped \
  "$TAG"

echo "[3/4] Health check"
MAX_WAIT=60
ELAPSED=0
until curl -sf http://localhost:3002/health/ready > /dev/null; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "Rollback health check failed."
    docker stop "qo-api-rollback-${VERSION}" || true
    docker rm   "qo-api-rollback-${VERSION}" || true
    exit 1
  fi
done

echo "[4/4] Swapping traffic back"
docker stop qo-api-blue 2>/dev/null || true
docker rm   qo-api-blue 2>/dev/null || true
docker rename "qo-api-rollback-${VERSION}" qo-api-blue
docker exec qo-nginx nginx -s reload 2>/dev/null || true

echo "======================================="
echo " Rollback complete — now running $VERSION"
echo "======================================="
