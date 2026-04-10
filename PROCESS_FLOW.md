# Quantum Optimizer — Platform Process Flow

> **Living document.** Updated every time a feature, route, module, or data model changes.
> Last updated: 2026-04-10 | Version: 1.3.0

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [End-to-End Planning Cycle](#3-end-to-end-planning-cycle)
4. [Module Process Flows](#4-module-process-flows)
   - 4.1 [Authentication](#41-authentication)
   - 4.2 [Data Hub — Ingestion Layer](#42-data-hub--ingestion-layer)
   - 4.3 [AI Demand Forecasting](#43-ai-demand-forecasting)
   - 4.4 [Consensus Demand Planning](#44-consensus-demand-planning)
   - 4.5 [Inventory Management](#45-inventory-management)
   - 4.6 [Alerts & Exception Management](#46-alerts--exception-management)
   - 4.7 [Scenario Planner](#47-scenario-planner)
   - 4.8 [Dashboard](#48-dashboard)
   - 4.9 [Admin](#49-admin)
5. [Data Architecture](#5-data-architecture)
6. [API Reference](#6-api-reference)
7. [Event Bus](#7-event-bus)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Security Controls](#9-security-controls)
10. [Changelog](#10-changelog)

---

## 1. Platform Overview

Quantum Optimizer is an enterprise SaaS platform for **AI-driven Demand Planning & Supply Chain Forecasting**, purpose-built for Pharma, F&B, and FMCG industries.

The platform implements a **Kinaxis Rapid Response–inspired** planning cycle:

```
External Data      AI Engine         Collaborative     Supply Action
Sources        →   Demand Sensing  → Consensus Plan  → Replenishment
(ERP/CRM/WMS)      (3-model         (S&OP workflow)   (PO generation
                    ensemble)                           + monitoring)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 3, Zustand, TanStack Query |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (via Prisma v7 + PrismaPg adapter) |
| Auth | JWT (HS256), bcrypt cost 12 |
| Deployment | Vercel (frontend), Docker (backend) |
| CI/CD | GitHub Actions (6-stage pipeline) |

### Multi-Tenancy

All data is scoped by `tenantId`. Users from Tenant A cannot access Tenant B data under any circumstances. `tenantId` is read from the JWT — never from request input.

---

## 2. User Roles & Permissions

| Role | Code | Key Capabilities |
|------|------|-----------------|
| Super Admin | `SUPER_ADMIN` | Full access to all modules + Admin panel |
| Supply Planner | `SUPPLY_PLANNER` | Create/edit forecasts, manage consensus plans, submit for approval |
| Finance Approver | `FINANCE` | Approve or reject submitted consensus plans |
| Production Manager | `PRODUCTION_MANAGER` | View forecasts, inventory, replenishment orders |
| Distributor Manager | `DISTRIBUTOR_MANAGER` | View inventory, distribution planning |
| Retailer | `RETAILER` | Read-only: inventory, alerts |

### Route-Level Access

| Route | Public | All Auth | Planner | Finance | Admin |
|-------|--------|----------|---------|---------|-------|
| `/` | ✅ | | | | |
| `/signin` | ✅ | | | | |
| `/dashboard` | | ✅ | | | |
| `/data-hub` | | ✅ | | | |
| `/forecast` | | ✅ | | | |
| `/alerts` | | ✅ | | | |
| `/inventory` | | ✅ | | | |
| `/consensus` | | ✅ | Edit cells | Approve/Reject | |
| `/scenarios` | | ✅ | | | |
| `/compliance` | | ✅ | | | |
| `/integrations` | | ✅ | | | |
| `/admin` | | | | | ✅ only |

---

## 3. End-to-End Planning Cycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUANTUM OPTIMIZER PLANNING CYCLE                  │
└─────────────────────────────────────────────────────────────────────┘

  PHASE 1 — DATA INGESTION (Data Hub)
  ┌──────────┐   sync    ┌──────────────────────────────────────┐
  │ ERP      │ ────────► │                                      │
  │ CRM      │           │  DataConnector (validate → normalize │
  │ WMS      │           │  → upsert DemandHistory)             │
  │ POS      │           │                                      │
  │ IoT      │           │  Fires: DataIngested event           │
  │ Market   │ ────────► │                                      │
  └──────────┘           └────────────────┬─────────────────────┘
                                          │
                                          ▼
  PHASE 2 — AI DEMAND SENSING (Forecast)
  ┌──────────────────────────────────────────────────────────────────┐
  │  DemandHistory + PromoCalendar + Weather signals                 │
  │                                                                  │
  │  Holt-Winters ──┐                                                │
  │  SARIMA ────────┼─► Ensemble (inverse-MAPE weighted) ──► ForecastResult │
  │  XGBoost ───────┘                                                │
  │                                                                  │
  │  Confidence intervals: 80% (±1.28σ√h) and 95% (±1.96σ√h)       │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  PHASE 3 — CONSENSUS PLANNING (Consensus)
  ┌──────────────────────────────────────────────────────────────────┐
  │  Supply Planner creates PlanVersion (DRAFT)                      │
  │  → Cells seeded from ForecastResult (SKU × week buckets)        │
  │  → Planner edits consensus values inline (pivot grid)           │
  │  → Revenue impact Δ calculated per cell                         │
  │  → Cell-level comments and @mentions                            │
  │  → Planner submits → status: SUBMITTED                          │
  │  → Finance Approver reviews trail and approves/rejects          │
  │  → APPROVED fires PlanApproved event                            │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  PHASE 4 — SUPPLY ACTION (Alerts + Replenishment)
  ┌──────────────────────────────────────────────────────────────────┐
  │  PlanApproved event → triggers supply run                        │
  │  Alerts generated: STOCKOUT_RISK, EXPIRY, OVERSTOCK,            │
  │                    SUPPLIER_DELAY, AI_PLAN_READY                 │
  │  ReplenishmentOrders: AUTO_APPROVED or HUMAN_APPROVED           │
  │  → ERP sync (SAP PO reference)                                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 4. Module Process Flows

### 4.1 Authentication

```
User                    SignInPage              authService.js          Backend
 │                          │                        │                     │
 ├─ enters email/pass ──►  │                        │                     │
 │                          ├─ authService.login() ─►│                     │
 │                          │                        ├─ POST /api/auth/login ►│
 │                          │                        │                     ├─ validate body
 │                          │                        │                     ├─ findUser by email
 │                          │                        │                     ├─ bcrypt.compare (timing-safe)
 │                          │                        │                     ├─ sign JWT (HS256, 15m)
 │                          │                        │                     ├─ write AuditLog
 │                          │                        │◄── { accessToken, user } ─┤
 │                          │                        │                     │
 │                          │   [if backend offline] │                     │
 │                          │                        ├─ mockLogin()        │
 │                          │                        │  (checks DEMO_USERS │
 │                          │                        │   list client-side) │
 │                          │◄─── { accessToken, user } ─┤                │
 │                          │                        │                     │
 │                          ├─ setAuth(user, token) ─► authStore (Zustand + localStorage)
 │                          ├─ navigate('/dashboard')─►│                   │
```

**Token flow:**
- Access token: JWT HS256, 15 min expiry
- Stored: `localStorage` key `qo-auth` (Zustand persist)
- All subsequent API calls: `Authorization: Bearer <token>` header
- 401 response: auto-clears auth and redirects to `/signin`

**Mock fallback:** If the backend server is unreachable (network error), `authService.js` validates against a built-in list of 10 demo users. The mock token carries user info as base64 payload.

---

### 4.2 Data Hub — Ingestion Layer

```
DataHubPage
    │
    ├─ GET /api/integrations/          → connector status tiles (health, lastSync)
    ├─ GET /api/integrations/quality-issues → open data quality issues
    ├─ GET /api/integrations/sync-logs → sync history per connector
    │
    ├─ [Sync Now] → POST /api/integrations/sync { connectorName }
    │                   │
    │           IntegrationsService.triggerSync()
    │                   │
    │           DataConnector lifecycle:
    │           1. connect()      — authenticate with source system
    │           2. fetchData()    — pull records
    │           3. validate()     — check required fields, numeric ranges, date format
    │           4. normalize()    — map source fields → canonical DemandHistory schema
    │           5. upsert()       — write to DemandHistory (@@unique: itemId+locationId+date+channel)
    │           6. logQuality()   — create DataQualityIssue for failed records
    │           7. createSyncLog()— write ConnectorSyncLog (records, quality score, duration)
    │           8. emit DataIngested event → triggers auto-reforecast
    │
    └─ [Resolve Issue] → PATCH /api/integrations/quality-issues/:id/resolve
```

**Connectors:**

| Connector | Source | Protocol |
|-----------|--------|----------|
| ErpConnector | SAP / Oracle ERP | OData / REST |
| CrmConnector | Salesforce / HubSpot | OAuth2 REST |
| WmsConnector | WMS systems | REST API |
| PosConnector | Point-of-sale | Webhook |
| IotConnector | Sensors / MQTT brokers | MQTT |
| MarketDataConnector | Open-Meteo (weather) | REST (free) |

All connectors extend `DataConnector` abstract base class with `withRetry()` (3 attempts, exponential backoff) and `checkHealth()`.

---

### 4.3 AI Demand Forecasting

```
ForecastPage
    │
    ├─ GET /api/forecasts?skuId=&warehouseId=&horizon=
    │       │
    │       ├─ [stored results exist] → return ForecastResult from DB
    │       └─ [none stored] → runForecast() on-demand
    │
    ├─ POST /api/forecasts/run { itemId, locationId, horizon }
    │       │
    │       forecastEngine.runForecast()
    │       │
    │       ├─ Load DemandHistory (fallback: Forecast table → synthetic baseline)
    │       ├─ Fetch PromoCalendar events for period
    │       ├─ Fetch weather signals (Open-Meteo API)
    │       │
    │       ├─ Run 3 models in parallel:
    │       │   ├─ holtWinters(history, horizon)    → ModelResult { forecasts, mape, confidence }
    │       │   ├─ sarima(history, horizon)          → ModelResult
    │       │   └─ xgboostSimulation(history, horizon, weatherSignals) → ModelResult
    │       │
    │       ├─ ensemble() — inverse-MAPE weighted average
    │       │   weight_i = (1/mape_i) / Σ(1/mape_j)
    │       │
    │       ├─ Confidence intervals:
    │       │   lower80 = point - 1.28 × σ × √h
    │       │   upper80 = point + 1.28 × σ × √h
    │       │   lower95 = point - 1.96 × σ × √h
    │       │   upper95 = point + 1.96 × σ × √h
    │       │
    │       └─ Upsert ForecastResult (@@unique: tenantId+itemId+locationId+forecastDate+modelUsed)
    │
    ├─ GET /api/forecasts/accuracy-trend  → ForecastAccuracy records (MAPE, WMAPE, bias, FVA)
    ├─ GET /api/forecasts/model-performance → per-model MAPE comparison
    ├─ GET /api/forecasts/promos           → PromoCalendar events
    ├─ POST /api/forecasts/promos          → create promo event
    └─ PATCH /api/forecasts/:id/override  → override with note (writes AuditLog)

DataIngested event → forecastEngine auto-reforecast hook fires
```

**UI features:** SKU selector, horizon toggle (7/14/30/90 days), CI band toggle (80%/95%/None), DriverCard (top 3 drivers), ModelScoreCard (MAPE per model), inline override panel with required justification note.

---

### 4.4 Consensus Demand Planning

```
ConsensusPage
    │
    ├─ GET /api/consensus?status=        → list PlanVersions
    ├─ GET /api/consensus/npi/analogues  → find similar SKUs for new products
    │
    ├─ [New Version] → POST /api/consensus
    │       │
    │       consensus.service.createPlan()
    │       ├─ generateWeekBuckets(periodStart, periodEnd) → ISO week labels
    │       ├─ Load ForecastResult (ENSEMBLE) for each SKU × week bucket
    │       ├─ Load prior version cells for diff (if baselineId provided)
    │       └─ createMany PlanCells (statForecast = AI value, consensusValue = AI value initially)
    │
    ├─ GET /api/consensus/:id            → PlanVersion + all PlanCells + approval trail
    │
    ├─ [Edit cell] → PATCH /api/consensus/:id/cells { edits: [{cellId, consensusValue}] }
    │       ├─ Validates: plan must be DRAFT
    │       ├─ Updates consensusValue + editedBy + editedAt
    │       └─ Recalculates revenueImpact = (consensusValue - statForecast) × avgPrice
    │
    ├─ [Comment] → POST /api/consensus/cells/:cellId/comments { body }
    │
    ├─ [Submit] → POST /api/consensus/:id/submit
    │       ├─ Status: DRAFT → SUBMITTED
    │       ├─ Creates PlanApproval record (action: SUBMITTED)
    │       └─ Writes AuditLog (PLAN_SUBMITTED)
    │
    └─ [Approve/Reject] → POST /api/consensus/:id/approve|reject { note }
            ├─ Role check: FINANCE or SUPER_ADMIN only
            ├─ Status: SUBMITTED → APPROVED | REJECTED
            ├─ Creates PlanApproval record
            ├─ Writes AuditLog (PLAN_APPROVED | PLAN_REJECTED)
            └─ [APPROVED only] → emits PlanApproved event

Plan status machine:
  DRAFT ──► SUBMITTED ──► APPROVED
                     └──► REJECTED ──► (create new DRAFT revision)
  LOCKED (future: frozen period management)
```

**NPI Module (New Product Introduction):** finds analogous SKUs by category with their avg weekly demand profile, allowing planners to seed phase-in forecasts from a similar product's history.

---

### 4.5 Inventory Management

```
InventoryPage
    │
    ├─ GET /api/inventory?warehouseId=&status=&category=
    │       → Inventory records joined with SKU + Warehouse
    │         Fields: quantity, stockDays, expiryDate, batchNumber
    │
    └─ GET /api/inventory/expiry-risk
            → Items with expiryDate within next 30 days
              sorted by daysToExpiry ascending
```

**Columns:** SKU code/name, warehouse, quantity, stock days, expiry date (heat-coded), batch number, status badge.

**Status logic:**
- `CRITICAL` — stockDays < 7 or expiryDate < 14 days
- `WARNING` — stockDays < 21 or expiryDate < 30 days
- `OK` — all clear

---

### 4.6 Alerts & Exception Management

```
AlertsPage
    │
    ├─ GET /api/alerts?severity=&isResolved=&category=
    │       → Alert records with SKU + Warehouse metadata
    │         Severity: CRITICAL | WARNING | INFO
    │         Category: STOCKOUT_RISK | EXPIRY | OVERSTOCK | SUPPLIER_DELAY | AI_PLAN_READY
    │
    └─ PATCH /api/alerts/:id/resolve
            ├─ Sets isResolved = true, resolvedBy, resolvedAt
            └─ Writes AuditLog (ALERT_RESOLVED)
```

**UI features:** severity filter tabs, bulk resolve, resolved/unresolved toggle, alert count badges per severity.

---

### 4.7 Scenario Planner

```
ScenarioPlannerPage
    │
    ├─ GET /api/scenarios            → list Scenario records
    ├─ POST /api/scenarios           → create new scenario { name, type, parameters }
    │
    └─ POST /api/scenarios/:id/run
            │
            ├─ Scenario types: demand_shock | supply_disruption | promo_uplift | price_change
            ├─ Applies parameter adjustments to baseline forecast
            ├─ Returns simulated results { demandImpact, revenueImpact, stockoutRisk }
            └─ Stores results in Scenario.results (JSON)

UI: Recharts comparison chart (baseline vs scenario), side-by-side KPI diff panel.
```

---

### 4.8 Dashboard

```
DashboardPage
    │
    ├─ GET /api/dashboard/kpis
    │       → { forecastAccuracy, stockoutRisk, inventoryTurnover, onTimeDelivery,
    │           activeAlerts, pendingApprovals, skusMonitored, warehousesActive }
    │
    ├─ GET /api/dashboard/accuracy-trend
    │       → 12-month MAPE trend (from ForecastAccuracy or synthetic fallback)
    │
    └─ GET /api/dashboard/sku-status
            → Top SKUs with status, stock days, forecast confidence
```

**Widgets:** KPI cards (accuracy %, stockout risk %, inventory turnover, OTIF%), accuracy trend area chart, alert feed (last 5 CRITICAL/WARNING), SKU status table, autonomous execution panel (replenishment orders).

---

### 4.9 Admin

```
AdminPage (SUPER_ADMIN only)
    │
    ├─ Tab: User Management
    │       ├─ GET /api/users/              → all users in tenant
    │       └─ (create/edit/deactivate — future)
    │
    ├─ Tab: AI Models
    │       └─ GET /api/forecasts/model-performance → model MAPE comparison
    │
    ├─ Tab: Audit Log
    │       └─ AuditLog records: who, what, when, where (IP), entity, metadata
    │
    └─ Tab: Integrations
            └─ GET /api/integrations/sync-logs → connector sync history
```

---

## 5. Data Architecture

### Core Models

```
Tenant (1) ──── (∞) User
Tenant (1) ──── (∞) SKU
Tenant (1) ──── (∞) Warehouse
SKU    (1) ──── (∞) Inventory  ◄── Warehouse
SKU    (1) ──── (∞) Forecast   ◄── Warehouse  [legacy]
SKU    (1) ──── (∞) Alert      ◄── Warehouse?
User   (1) ──── (∞) AuditLog
```

### Planning Models (Phase 2–3)

```
DemandHistory (itemId + locationId + date + channel @@unique)
    │
    ▼
ForecastResult (tenantId + itemId + locationId + forecastDate + modelUsed @@unique)
    │
    ▼
PlanVersion (DRAFT → SUBMITTED → APPROVED)
    │
    ├── PlanCell (planVersionId + itemId + locationId + periodLabel @@unique)
    │       └── PlanCellComment
    └── PlanApproval (action trail)
```

### Integration Models

```
ConnectorSyncLog  — one record per sync run (success/error, quality score)
DataQualityIssue  — one record per invalid field found during normalization
```

### Enums

| Enum | Values |
|------|--------|
| Role | RETAILER, DISTRIBUTOR_MANAGER, SUPPLY_PLANNER, PRODUCTION_MANAGER, FINANCE, SUPER_ADMIN |
| Industry | PHARMA, FNB, FMCG |
| Severity | CRITICAL, WARNING, INFO |
| AlertCategory | STOCKOUT_RISK, EXPIRY, OVERSTOCK, SUPPLIER_DELAY, AI_PLAN_READY |
| OrderStatus | PENDING, AUTO_APPROVED, HUMAN_APPROVED, OVERRIDDEN, DISPATCHED |
| PlanStatus | DRAFT, SUBMITTED, APPROVED, REJECTED, LOCKED |

---

## 6. API Reference

All API endpoints are prefixed `/api/`. All routes except `/api/auth/*` require `Authorization: Bearer <token>` header. Responses follow `{ success, data, error, meta }` envelope.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | — | Login, returns JWT + user |
| POST | /auth/demo-request | — | Submit demo interest |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | /dashboard/kpis | Platform KPI summary |
| GET | /dashboard/accuracy-trend | 12-month accuracy chart data |
| GET | /dashboard/sku-status | Top SKU status table |

### Forecasts
| Method | Path | Description |
|--------|------|-------------|
| GET | /forecasts | All forecasts (stored-first, live fallback) |
| POST | /forecasts/run | Trigger AI forecast for a SKU |
| GET | /forecasts/accuracy-trend | MAPE trend by model |
| GET | /forecasts/model-performance | Per-model accuracy comparison |
| GET | /forecasts/promos | Promo calendar events |
| POST | /forecasts/promos | Create promo event |
| GET | /forecasts/:skuId | Live forecast for one SKU |
| PATCH | /forecasts/:id/override | Override value with audit note |

### Alerts
| Method | Path | Description |
|--------|------|-------------|
| GET | /alerts | List alerts (filterable) |
| PATCH | /alerts/:id/resolve | Mark alert resolved |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | /inventory | All inventory records |
| GET | /inventory/expiry-risk | Items expiring within 30 days |

### Consensus
| Method | Path | Description |
|--------|------|-------------|
| GET | /consensus | List plan versions |
| POST | /consensus | Create new plan version |
| GET | /consensus/buckets | Preview week buckets for a period |
| GET | /consensus/npi/analogues | Find analogous SKUs by category |
| GET | /consensus/:id | Plan detail with cells |
| PATCH | /consensus/:id/cells | Bulk-save cell edits |
| POST | /consensus/:id/submit | Submit for approval |
| POST | /consensus/:id/approve | Approve (FINANCE/SUPER_ADMIN) |
| POST | /consensus/:id/reject | Reject with note (FINANCE/SUPER_ADMIN) |
| GET | /consensus/cells/:cellId/comments | Get cell comments |
| POST | /consensus/cells/:cellId/comments | Add comment |

### Scenarios
| Method | Path | Description |
|--------|------|-------------|
| GET | /scenarios | List scenarios |
| POST | /scenarios | Create scenario |
| POST | /scenarios/:id/run | Run simulation |

### Integrations
| Method | Path | Description |
|--------|------|-------------|
| GET | /integrations | Connector status list |
| GET | /integrations/quality-issues | Open data quality issues |
| GET | /integrations/sync-logs | Sync history |
| POST | /integrations/sync | Trigger sync for a connector |
| PATCH | /integrations/quality-issues/:id/resolve | Resolve a quality issue |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | /users/me | Current user profile |
| GET | /users | All users in tenant (admin) |

### Infrastructure
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | — | Liveness probe |
| GET | /health/ready | — | Readiness probe (checks DB) |
| GET | /metrics | Internal only | Prometheus metrics |

---

## 7. Event Bus

Internal Node.js EventEmitter (`server/src/events/eventBus.ts`) for decoupled module communication.

| Event | Payload | Triggered by | Consumed by |
|-------|---------|-------------|-------------|
| `DataIngested` | connectorName, sourceType, tenantId, recordCount, qualityScore, timestamp | IntegrationsService after sync | forecastEngine auto-reforecast hook |
| `PlanApproved` | planId, tenantId, approvedBy, timestamp | consensus.service.approvePlan() | Supply engine (future: triggers replenishment run) |
| `ActualsCaptured` | tenantId, periodEnd, recordCount, timestamp | (future: actuals ingestion module) | forecastEngine accuracy computation |

---

## 8. Infrastructure & Deployment

### Frontend (Vercel)
- Deployed from `client/` directory
- Build: `npm run build` → `client/dist/`
- SPA routing: `vercel.json` rewrites all paths to `/index.html`
- Config: `VITE_API_URL` env var (defaults to `http://localhost:3001/api`)

### Backend (Docker)
- Multi-stage Dockerfile in `server/Dockerfile`
- Non-root user (`appuser`), read-only filesystem
- Health check: `GET /health`
- `docker-compose.yml`: api + postgres + redis + nginx, internal network

### CI/CD Pipeline (`.github/workflows/pipeline.yml`)

```
Stage 1 — Pre-flight:   gitleaks secret scan, merge conflict check, lockfile validation
Stage 2 — Quality:      tsc --noEmit, ESLint, Vite build check
Stage 3 — Security:     Semgrep SAST, npm audit, Snyk (optional)
Stage 4 — Build:        Docker multi-stage build, Trivy container scan, GHCR push
Stage 5 — Staging:      Smoke tests, OWASP ZAP baseline scan
Stage 6 — Production:   Manual approval gate, blue/green deploy, post-deploy smoke tests
```

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/validate-env.sh` | Pre-flight env var check with strength validation |
| `scripts/smoke-test.sh` | Post-deploy endpoint + security header verification |
| `scripts/deploy.sh` | Blue/green deploy with health-check gate |
| `scripts/rollback.sh` | One-command rollback by version |
| `scripts/security-audit.sh` | Local scan: gitleaks, npm audit, semgrep, trivy |

---

## 9. Security Controls

| Control | Implementation |
|---------|----------------|
| Auth | JWT HS256, 15-min access token, bcrypt cost 12 |
| Algorithm whitelist | `algorithms: ['HS256']` in jwt.verify — prevents 'none' attack |
| Timing-safe login | Dummy bcrypt compare always runs — prevents user enumeration |
| Rate limiting | 10 req/min auth, 1000/15min API (express-rate-limit) |
| Security headers | Helmet CSP, HSTS (max-age=31536000), X-Frame-Options: DENY, CORP, COEP, COOP |
| CORS | Strict allowlist from env var, no wildcard |
| Input limits | 1MB JSON body limit, Zod schema validation |
| PII scrubbing | Logger middleware redacts password/token/name fields before write |
| Request tracing | UUID v4 X-Request-ID on every request and error response |
| Audit trail | AuditLog written on: login, plan submit/approve/reject, forecast override, alert resolve |
| Multi-tenancy | All DB queries scoped by tenantId from JWT — never from request body |
| Secret scanning | gitleaks in CI + pre-commit hook |
| Dependency audit | npm audit + Snyk in CI, Dependabot weekly |

---

## 10. Changelog

> Append an entry here every time a feature, route, model, or flow changes.

---

### v1.3.0 — 2026-04-10
**DevSecOps Transformation**
- Added rate limiting middleware (auth: 10/min, API: 1000/15min)
- Added X-Request-ID tracing middleware
- Hardened Helmet CSP/HSTS/CORP/COEP headers
- Enhanced logger with PII scrubber
- Login: timing-safe bcrypt, AuditLog write, security event logging
- JWT: explicit HS256 algorithm whitelist in verify
- New routes: `GET /health`, `GET /health/ready`, `GET /metrics`
- New files: `Dockerfile`, `docker-compose.yml`, `nginx/nginx.conf`
- New CI/CD: `.github/workflows/pipeline.yml` (6 stages)
- New docs: `docs/THREAT_MODEL.md`, `docs/SECURITY_RUNBOOK.md`, `docs/INCIDENT_RESPONSE.md`
- New scripts: `validate-env.sh`, `smoke-test.sh`, `deploy.sh`, `rollback.sh`, `security-audit.sh`
- Load tests: `k6/load-test.js` (smoke/load/stress/spike/soak)
- `vercel.json` at repo root with SPA rewrite + explicit build config
- `authService.js`: mock auth fallback when backend offline
- Removed demo credentials from `SignInPage.jsx`
- Added `CREDENTIALS.md`

### v1.2.0 — 2026-04-10
**Phase 3 — Consensus Demand Planning**
- New models: `PlanVersion`, `PlanCell`, `PlanCellComment`, `PlanApproval`, enum `PlanStatus`
- New module: `server/src/modules/consensus/` (service, controller, 10 routes)
- New page: `ConsensusPage.jsx` — pivot grid (SKU × week), inline cell editing, revenue delta, approval drawers
- New hooks: `useConsensus.js` (9 React Query hooks)
- New route: `/consensus` added to App.jsx + Sidebar
- New API: mounted at `/api/consensus`
- NPI module: analogue SKU finder by category
- Plan status machine: DRAFT → SUBMITTED → APPROVED/REJECTED

### v1.1.0 — 2026-04-10
**Phase 2 — AI-Powered Demand Sensing**
- New models: `ForecastResult`, `ForecastAccuracy`, `PromoCalendar`
- New engine: `server/src/modules/forecast/engine/` (models.ts + forecastEngine.ts)
  - Three-model ensemble: Holt-Winters, SARIMA, XGBoost-simulation
  - Inverse-MAPE weighted ensemble
  - Expanding confidence intervals (80% and 95%)
- Replaced `forecast.controller.ts` with 6 real handlers (stored-first, live fallback)
- New promo controller: `promo.controller.ts`
- New routes: `/accuracy-trend`, `/model-performance`, `/promos`
- New hooks: `useForecast.js` (4 React Query hooks)
- Replaced `ForecastPage.jsx` with full AI UI (DriverCard, ModelScoreCard, CI bands, override panel)
- `eventBus.onDataIngested` → auto-reforecast hook

### v1.0.0 — 2026-04-08
**Phase 1 — Initial Platform Build + Data Ingestion Layer**
- Full frontend: Landing, SignIn, Dashboard, Forecast, Alerts, Inventory, Scenarios, Admin pages
- Full backend: auth, dashboard, alerts, users, inventory, forecast, scenarios modules
- Prisma schema: Tenant, User, SKU, Warehouse, Inventory, Forecast, Alert, ReplenishmentOrder, AuditLog, Scenario
- Seed data: 3 tenants (Pharma/FNB/FMCG), 10 users, 50 SKUs, 3 warehouses each
- DataConnector base class + 6 connectors (ERP, CRM, WMS, POS, IoT, Market)
- New models: `DemandHistory`, `ConnectorSyncLog`, `DataQualityIssue`
- New page: `DataHubPage.jsx` — connector health tiles, quality issues drawer, sync logs
- Event bus: `DataIngested`, `PlanApproved`, `ActualsCaptured`
- JWT auth middleware with RBAC (`requireRole`)
- Multi-tenant architecture (all queries scoped by tenantId)
