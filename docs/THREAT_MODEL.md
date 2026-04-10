# Quantum Optimizer — STRIDE Threat Model

**Version:** 1.0 | **Date:** 2026-04-10 | **Owner:** Security Team

## System Components

| Component | Description |
|-----------|-------------|
| React Frontend | SPA served via Nginx; JWT stored in localStorage |
| Express API | Node.js REST API; JWT auth; multi-tenant RBAC |
| PostgreSQL | Primary datastore; PII fields; audit log |
| Redis | Rate limit counters; future session store |
| External Connectors | ERP, CRM, WMS, POS, IoT, Market data |
| Nginx | Reverse proxy; TLS termination |

## Threat Register

| ID | STRIDE | Component | Attack Vector | Likelihood | Impact | Risk | Mitigation | Residual Risk | Owner |
|----|--------|-----------|---------------|------------|--------|------|------------|---------------|-------|
| T-001 | Spoofing | Auth | Brute-force login with credential stuffing | High | Critical | **Critical** | Rate limit: 10 req/min/IP; bcrypt cost 12; timing-safe comparison | Low (with monitoring) | Backend Team |
| T-002 | Spoofing | Auth | JWT 'none' algorithm bypass | Low | Critical | **High** | Algorithm whitelist: HS256 only in `auth.ts` | Low | Backend Team |
| T-003 | Tampering | API | SQL injection via unvalidated query params | Medium | Critical | **High** | Prisma ORM (parameterized); Zod input validation | Low | Backend Team |
| T-004 | Tampering | Frontend | XSS — inject script via forecast override note | Medium | High | **High** | CSP `script-src 'self'`; input sanitization; no `dangerouslySetInnerHTML` | Medium | Frontend Team |
| T-005 | Repudiation | AuditLog | Planner denies changing consensus plan cell | Medium | High | **High** | Immutable AuditLog + PlanApproval trail; before/after values stored | Low | Backend Team |
| T-006 | Info Disclosure | API | Stack trace in 500 error response | High | Medium | **High** | errorHandler never returns stack; only requestId exposed | Low | Backend Team |
| T-007 | Info Disclosure | localStorage | XSS reads JWT from localStorage | Medium | Critical | **Critical** | Migrate to HttpOnly cookie (planned); CSP reduces XSS surface | High (mitigate soon) | Frontend Team |
| T-008 | Info Disclosure | DB | PII exposed via over-broad API response | Medium | High | **High** | Field-level select in Prisma; no raw `SELECT *`; role-based field masking | Medium | Backend Team |
| T-009 | Denial of Service | API | Flood /api/auth/login — exhaust server resources | High | High | **High** | 10 req/min auth rate limit (Nginx + express-rate-limit); 1000/15min API | Low | DevOps |
| T-010 | Denial of Service | DB | Unbounded query — no pagination on large tables | Medium | High | **High** | Enforce `take: N` on all Prisma queries; cursor pagination | Medium | Backend Team |
| T-011 | Elevation of Privilege | RBAC | Planner accesses admin endpoints | Low | Critical | **High** | `requireRole()` middleware on all admin routes; deny-by-default | Low | Backend Team |
| T-012 | Elevation of Privilege | Multi-tenancy | Tenant A accesses Tenant B data | Low | Critical | **Critical** | All queries scoped by `tenantId` from JWT; cannot be overridden by input | Low | Backend Team |
| T-013 | Spoofing | Connectors | MITM on ERP/CRM connector HTTP calls | Low | High | **Medium** | HTTPS enforced; TLS cert validation; no `http://` in connector configs | Low | Integration Team |
| T-014 | Tampering | File Uploads | Malicious file masquerading as CSV (future) | Low | High | **Medium** | MIME type validation from content (not extension); server-side rename; size limits | Low | Backend Team |
| T-015 | Info Disclosure | Logs | PII logged in structured logs | Medium | High | **High** | PII scrubber in logger.ts redacts: password, token, firstName, etc. | Low | Backend Team |

## High-Risk Items Requiring Immediate Action

1. **T-007**: JWT in localStorage — migrate to `HttpOnly; Secure; SameSite=Strict` cookie
2. **T-001**: Add account lockout (5 failures → 15-min lock) on top of rate limiting
3. **T-010**: Audit all Prisma queries for missing `take` limits

## Review Schedule

Threat model reviewed: **quarterly** or when architecture changes significantly.
Next review: **2026-07-10**
