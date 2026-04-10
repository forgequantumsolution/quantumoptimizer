# Incident Response Plan — Quantum Optimizer

**Owner:** Engineering Manager | **Version:** 1.0 | **Date:** 2026-04-10

---

## Severity Matrix

| Severity | Definition | Response SLA | Stakeholder Notification |
|----------|-----------|-------------|-------------------------|
| SEV-1 | Production down OR confirmed data breach | 15 min | All hands + CTO + Legal |
| SEV-2 | >10% users affected OR significant perf degradation | 30 min | Engineering Manager |
| SEV-3 | Single feature broken, workaround exists | 4 hours | Team Lead |
| SEV-4 | Minor issue, no user impact | Next business day | None |

---

## Response Workflow

```
1. DETECT      → Alert fires (PagerDuty/Slack) or user reports
2. ACKNOWLEDGE → Claim incident in PagerDuty within SLA
3. ASSESS      → Determine severity, scope, initial diagnosis
4. COMMUNICATE → Update status page + notify stakeholders
5. MITIGATE    → Reduce customer impact (rollback if needed)
6. INVESTIGATE → Root cause analysis
7. RESOLVE     → Fix deployed and verified
8. POST-MORTEM → Blameless review within 48h
```

---

## Runbook Index

| Scenario | Runbook |
|----------|---------|
| Database failure | [runbook-database-failure.md](RUNBOOKS/runbook-database-failure.md) |
| Service outage | [runbook-service-outage.md](RUNBOOKS/runbook-service-outage.md) |
| Security incident | [SECURITY_RUNBOOK.md](SECURITY_RUNBOOK.md) |
| DDoS response | [runbook-ddos-response.md](RUNBOOKS/runbook-ddos-response.md) |

---

## Quick Actions

### Rollback to previous version
```bash
VERSION=<previous-git-sha-8> bash scripts/rollback.sh
```

### Take API offline (emergency)
```bash
docker stop qo-api
# nginx will return 503 for all /api/* requests
```

### Disable a specific user account
```sql
UPDATE "User" SET "isActive" = false WHERE email = 'compromised@example.com';
```

---

## Post-Mortem Template

Use this within 48 hours of every SEV-1/SEV-2 resolution.

```markdown
## Incident Post-Mortem — [Title]

**Date:** YYYY-MM-DD
**Severity:** SEV-X
**Duration:** Xh Xm
**Author:** [name]
**Reviewers:** [names]

### Impact
- Users affected: N
- Data affected: describe
- Revenue impact: estimate

### Timeline
- HH:MM — [event]
- HH:MM — [event]

### Root Cause (5 Whys)
Why 1: ...
Why 2: ...
Why 3: ...
Why 4: ...
Why 5: (root)

### Contributing Factors
- ...

### What Went Well
- ...

### Action Items
| Action | Owner | Due |
|--------|-------|-----|
| ... | ... | YYYY-MM-DD |
```
