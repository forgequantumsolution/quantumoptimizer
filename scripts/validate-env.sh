#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# validate-env.sh — Pre-flight environment variable check
# Run before server start in production. Exits 1 with a clear error if any
# required variable is missing or still holds a placeholder value.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

check_required() {
  local var="$1"
  local desc="$2"
  if [ -z "${!var:-}" ]; then
    echo -e "${RED}[MISSING]${NC} $var — $desc"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}[OK]${NC} $var"
  fi
}

check_not_placeholder() {
  local var="$1"
  local placeholder="$2"
  if [ "${!var:-}" = "$placeholder" ]; then
    echo -e "${RED}[PLACEHOLDER]${NC} $var — replace '$placeholder' with a real value"
    ERRORS=$((ERRORS + 1))
  fi
}

check_min_length() {
  local var="$1"
  local min_len="$2"
  local val="${!var:-}"
  if [ ${#val} -lt $min_len ]; then
    echo -e "${RED}[WEAK]${NC} $var — must be at least $min_len characters (currently ${#val})"
    ERRORS=$((ERRORS + 1))
  fi
}

echo "======================================="
echo " Quantum Optimizer — Env Validation"
echo "======================================="

# Required variables
check_required DATABASE_URL       "PostgreSQL connection string"
check_required JWT_ACCESS_SECRET  "JWT signing secret (access tokens)"
check_required JWT_REFRESH_SECRET "JWT signing secret (refresh tokens)"
check_required FRONTEND_URL       "Allowed CORS origin"
check_required REDIS_URL          "Redis connection URL"

# Reject insecure defaults
check_not_placeholder JWT_ACCESS_SECRET  "dev_secret_change_before_production"
check_not_placeholder JWT_ACCESS_SECRET  "dev_secret"
check_not_placeholder JWT_REFRESH_SECRET "dev_refresh_change_before_production"
check_not_placeholder JWT_REFRESH_SECRET "dev_refresh_secret"
check_not_placeholder DATABASE_URL       "postgresql://qo_user:CHANGE_ME@localhost:5432/quantum_optimizer"

# Minimum secret strength
check_min_length JWT_ACCESS_SECRET  32
check_min_length JWT_REFRESH_SECRET 32

# HTTPS enforcement in production
if [ "${NODE_ENV:-}" = "production" ]; then
  if [[ "${FRONTEND_URL:-}" == http://* ]]; then
    echo -e "${YELLOW}[WARN]${NC} FRONTEND_URL uses HTTP — production should use HTTPS"
  fi
  if [[ "${DATABASE_URL:-}" == *":password@"* ]]; then
    echo -e "${RED}[WEAK]${NC} DATABASE_URL appears to use 'password' as the DB password"
    ERRORS=$((ERRORS + 1))
  fi
fi

echo "======================================="
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}FAILED — $ERRORS issue(s) found. Fix before starting the server.${NC}"
  exit 1
else
  echo -e "${GREEN}PASSED — all environment variables are set.${NC}"
fi
