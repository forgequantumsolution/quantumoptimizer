# Security Runbook — Quantum Optimizer

## Escalation Matrix

| Severity | First Responder | Escalate To | SLA |
|----------|----------------|-------------|-----|
| P1 — Production breach / data exposure | On-call engineer | CTO + Legal within 1h | 15 min response |
| P2 — Auth bypass / privilege escalation | Backend lead | Engineering Manager | 1h response |
| P3 — Dependency CVE Critical | DevOps | Backend lead | 24h |
| P4 — Dependency CVE High | Assigned dev | Team lead | 7 days |

---

## 1. Responding to an Auth Anomaly Alert

**Trigger:** `auth_failure` event count > 10× baseline in 5 minutes

### Steps
1. Check Grafana → Security Events dashboard for source IP
2. If single IP: the rate limiter is already blocking it; no action needed
3. If distributed (many IPs): escalate to P2; consider WAF rule
4. Review AuditLog: `SELECT * FROM "AuditLog" WHERE action = 'LOGIN' AND "createdAt" > NOW() - INTERVAL '1 hour' ORDER BY "createdAt" DESC;`
5. If a real user account is being attacked, notify the user by email
6. Document the incident in `docs/INCIDENT_RESPONSE.md`

---

## 2. Rotating a Compromised JWT Secret

**When:** JWT secret exposed in logs, leaked in code, or after a breach

### Steps
1. Generate new secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in your secrets manager (AWS Secrets Manager / Vault)
3. Deploy the updated environment variables
4. **All existing JWT tokens are now invalid.** Users will be logged out automatically.
5. Monitor for 401 spike — expected and normal
6. Update `.env.example` comment to note rotation date

---

## 3. Responding to a CRITICAL Dependency CVE

**Trigger:** Dependabot alert or `npm audit` in CI with CVSS ≥ 9.0

### Steps
1. Assess exploitability: is the vulnerable code path reachable in this app?
2. Check for a patched version: `npm outdated <package>`
3. If patch available: `npm install <package>@<patched-version>` → PR → fast-track review
4. If no patch: evaluate workaround (disable feature, add input filter)
5. Create GitHub Issue with label `severity:critical` and `sla:24h`
6. Assign to on-call engineer
7. Deploy fix within 24 hours (SLA for Critical CVE)

---

## 4. Revoking a Compromised Access Token

**When:** User reports token stolen, or suspicious activity on an account

### Steps (current implementation — stateless JWT)
1. Rotate `JWT_ACCESS_SECRET` immediately (see section 2)
2. This invalidates ALL tokens — coordinate with users
3. **Longer term:** implement a token blocklist (Redis `SET token:<jti> 1 EX <ttl>`) so only the compromised token is revoked

---

## 5. Responding to a Data Exposure Incident

**When:** PII accessible to unauthorized party; log file with PII exposed

### Steps
1. **STOP** — do not delete anything; preserve evidence
2. Immediately revoke access to the exposed data source
3. Assess scope: which users affected? What data? For how long?
4. Notify Engineering Manager and Legal within 1 hour
5. If GDPR applies: 72-hour notification obligation to supervisory authority
6. Notify affected users within the legally required window
7. Document in incident log with timeline
8. Post-mortem within 48 hours of resolution

---

## 6. Incident Severity Classification

| Severity | Examples | Response Time |
|----------|----------|---------------|
| SEV-1 | Production down, data breach, complete auth bypass | 15 min |
| SEV-2 | Partial auth bypass, >10% users affected, data leak | 1 hour |
| SEV-3 | Single feature broken, performance degradation | 4 hours |
| SEV-4 | Minor bug, workaround exists | Next business day |
