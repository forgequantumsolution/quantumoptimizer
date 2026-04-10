#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# smoke-test.sh — Post-deploy endpoint verification
# Usage: API_URL=https://api.example.com bash scripts/smoke-test.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
  local desc="$1"
  local url="$2"
  local expected_status="$3"

  actual_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}[PASS]${NC} $desc ($actual_status)"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}[FAIL]${NC} $desc — expected $expected_status, got $actual_status — $url"
    FAIL=$((FAIL + 1))
  fi
}

check_header() {
  local desc="$1"
  local url="$2"
  local header="$3"

  if curl -sI --max-time 10 "$url" | grep -qi "$header"; then
    echo -e "${GREEN}[PASS]${NC} Header present: $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}[FAIL]${NC} Header missing: $desc — $header"
    FAIL=$((FAIL + 1))
  fi
}

echo "======================================"
echo " Smoke Tests — $API_URL"
echo "======================================"

# Liveness
check "Liveness probe"    "$API_URL/health"       200
check "Readiness probe"   "$API_URL/health/ready"  200

# Auth endpoints — expect 400 (missing body), not 500
check "Auth login endpoint reachable"  "$API_URL/api/auth/login"     400

# Protected routes — expect 401 without token
check "Dashboard requires auth"   "$API_URL/api/dashboard"    401
check "Forecasts requires auth"   "$API_URL/api/forecasts"    401
check "Inventory requires auth"   "$API_URL/api/inventory"    401
check "Alerts requires auth"      "$API_URL/api/alerts"       401
check "Consensus requires auth"   "$API_URL/api/consensus"    401

# 404 for unknown routes
check "Unknown route returns 404" "$API_URL/api/does-not-exist" 404

# Security headers
check_header "X-Content-Type-Options"  "$API_URL/health" "x-content-type-options"
check_header "X-Frame-Options"         "$API_URL/health" "x-frame-options"
check_header "X-Request-ID"            "$API_URL/health" "x-request-id"

echo "======================================"
echo " Results: ${PASS} passed, ${FAIL} failed"
echo "======================================"

[ $FAIL -eq 0 ]
