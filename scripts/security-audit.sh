#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# security-audit.sh — One-command local DevSecOps security scan
# Run before pushing: bash scripts/security-audit.sh
# Requires: gitleaks, npm, semgrep, trivy (install via Homebrew/apt)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
WARN=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${YELLOW}[STEP $1]${NC} $2"; }
ok()   { echo -e "${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARN=$((WARN+1)); }

echo "========================================"
echo " Quantum Optimizer — Security Audit"
echo " $(date)"
echo "========================================"

cd "$ROOT_DIR"

# ── Step 1: Gitleaks — secret detection ─────────────────────────────────────
step 1 "Gitleaks — scanning for secrets"
if command -v gitleaks &>/dev/null; then
  if gitleaks detect --source . --no-banner -q; then
    ok "No secrets detected"
  else
    fail "Secrets detected by gitleaks — review output above"
  fi
else
  warn "gitleaks not installed — skipping (install: https://github.com/gitleaks/gitleaks)"
fi

# ── Step 2: npm audit — dependency vulnerabilities ───────────────────────────
step 2 "npm audit — server dependencies"
if cd server && npm audit --audit-level=high 2>/dev/null; then
  ok "Server deps: no HIGH/CRITICAL CVEs"
else
  fail "Server deps have HIGH or CRITICAL CVEs — run: cd server && npm audit fix"
fi
cd "$ROOT_DIR"

step 2b "npm audit — client dependencies"
if cd client && npm audit --audit-level=high 2>/dev/null; then
  ok "Client deps: no HIGH/CRITICAL CVEs"
else
  warn "Client deps have HIGH CVEs — review and upgrade"
fi
cd "$ROOT_DIR"

# ── Step 3: Semgrep — SAST ───────────────────────────────────────────────────
step 3 "Semgrep — static analysis (OWASP + secrets)"
if command -v semgrep &>/dev/null; then
  if semgrep --config "p/owasp-top-ten" --config "p/nodejs" --config "p/secrets" \
     --error --quiet server/src/ 2>/dev/null; then
    ok "Semgrep: no findings"
  else
    fail "Semgrep found issues — review output above"
  fi
else
  warn "semgrep not installed — skipping (install: pip install semgrep)"
fi

# ── Step 4: TypeScript — no compilation errors ───────────────────────────────
step 4 "TypeScript strict check"
if cd server && npx tsc --noEmit 2>/dev/null; then
  ok "TypeScript: 0 errors"
else
  fail "TypeScript compilation errors found"
fi
cd "$ROOT_DIR"

# ── Step 5: Env file safety check ────────────────────────────────────────────
step 5 "Environment file safety"
if [ -f .env ]; then
  warn ".env file exists locally — ensure it is in .gitignore"
  if git ls-files --error-unmatch .env &>/dev/null 2>&1; then
    fail ".env is TRACKED by git — remove it immediately: git rm --cached .env"
  else
    ok ".env exists but is NOT tracked by git"
  fi
else
  ok "No .env file in repo root"
fi

# ── Step 6: Trivy filesystem scan ────────────────────────────────────────────
step 6 "Trivy — filesystem vulnerability scan"
if command -v trivy &>/dev/null; then
  if trivy fs . --severity HIGH,CRITICAL --quiet --exit-code 1 2>/dev/null; then
    ok "Trivy: no HIGH/CRITICAL findings"
  else
    fail "Trivy found HIGH/CRITICAL vulnerabilities — review and patch"
  fi
else
  warn "trivy not installed — skipping (install: https://aquasecurity.github.io/trivy)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo " Results: ${PASS} passed | ${FAIL} failed | ${WARN} warnings"
echo "========================================"

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}AUDIT FAILED — fix the issues above before pushing.${NC}"
  exit 1
else
  echo -e "${GREEN}AUDIT PASSED.${NC}"
fi
