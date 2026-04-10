# Quantum Optimizer — Software Overview

> **Comprehensive reference** covering software architecture, module structure, data models, API design, process flows, security, deployment, and development standards.
> Last updated: 2026-04-10 | Platform Version: 1.4.0

---

## Table of Contents

1. [Product Summary](#1-product-summary)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Software Architecture](#4-software-architecture)
   - 4.1 [High-Level Architecture Diagram](#41-high-level-architecture-diagram)
   - 4.2 [Frontend Architecture](#42-frontend-architecture)
   - 4.3 [Backend Architecture](#43-backend-architecture)
   - 4.4 [Database Architecture](#44-database-architecture)
   - 4.5 [Multi-Tenancy Design](#45-multi-tenancy-design)
   - 4.6 [Event-Driven Design](#46-event-driven-design)
5. [Module Reference](#5-module-reference)
   - 5.1 [Auth](#51-auth)
   - 5.2 [Dashboard](#52-dashboard)
   - 5.3 [Data Hub (Integrations)](#53-data-hub-integrations)
   - 5.4 [AI Demand Forecasting](#54-ai-demand-forecasting)
   - 5.5 [Consensus Demand Planning](#55-consensus-demand-planning)
   - 5.6 [Supply Planning](#56-supply-planning)
   - 5.7 [Inventory Management](#57-inventory-management)
   - 5.8 [Alerts & Exceptions](#58-alerts--exceptions)
   - 5.9 [Scenario Planner](#59-scenario-planner)
   - 5.10 [Admin](#510-admin)
6. [Frontend Pages & Components](#6-frontend-pages--components)
7. [Data Models](#7-data-models)
8. [API Design](#8-api-design)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Security Architecture](#10-security-architecture)
11. [Planning Cycle — End-to-End Flow](#11-planning-cycle--end-to-end-flow)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Development Standards](#14-development-standards)
15. [Environment Configuration](#15-environment-configuration)
16. [Demo Accounts](#16-demo-accounts)
17. [Roadmap](#17-roadmap)

---

## 1. Product Summary

**Quantum Optimizer** is an enterprise-grade, multi-tenant SaaS platform for **AI-powered Demand Planning and Supply Chain Optimization**, built by Forge Quantum Solutions.

It implements a **Kinaxis Rapid Response–inspired** collaborative planning cycle across four phases:

| Phase | Module | Output |
|-------|--------|--------|
| 1 — Data Ingestion | Data Hub | Normalized demand history |
| 2 — AI Demand Sensing | Forecast | Ensemble forecasts with confidence intervals |
| 3 — Collaborative Planning | Consensus | Approved demand plan (S&OP) |
| 4 — Supply Execution | Supply Planning | MRP rows, production orders, replenishment orders |

**Target Industries:** Pharmaceutical, Food & Beverage, FMCG
**Deployment Model:** Frontend on Vercel (CDN), Backend on Docker/self-hosted

---

## 2. Technology Stack

### Frontend

| Concern | Technology | Version |
|---------|-----------|---------|
| Framework | React | 19 |
| Build tool | Vite | 8 |
| Styling | Tailwind CSS | 3 |
| Routing | React Router DOM | v7 |
| Server state | TanStack Query (React Query) | v5 |
| Client state | Zustand (with persist middleware) | latest |
| HTTP client | Native `fetch` (wrapped in hooks) | — |
| Charts | Recharts | latest |

### Backend

| Concern | Technology | Version |
|---------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Express | 5 |
| Language | TypeScript | 5 |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 16 |
| Auth | jsonwebtoken (HS256) | latest |
| Password | bcrypt (cost 12) | latest |
| Logging | Winston (structured JSON) | latest |
| HTTP security | Helmet | latest |
| Rate limiting | express-rate-limit | latest |
| Metrics | prom-client (Prometheus) | latest |
| Request tracing | uuid (X-Request-ID) | latest |

### Infrastructure

| Concern | Technology |
|---------|-----------|
| Frontend hosting | Vercel (static + SPA rewrite) |
| Backend container | Docker (multi-stage Alpine) |
| Reverse proxy | Nginx (TLS 1.3, security headers) |
| Orchestration | Docker Compose |
| CI/CD | GitHub Actions (6-stage pipeline) |
| Secret scanning | Gitleaks, detect-secrets |
| SAST | Semgrep |
| Dependency audit | npm audit, Snyk |
| Container scanning | Trivy |
| Load testing | k6 |

---

## 3. Repository Structure

```
quantumoptimizer/
│
├── client/                         # React SPA (deployed to Vercel)
│   ├── src/
│   │   ├── pages/                  # Route-level page components (10 pages)
│   │   ├── components/
│   │   │   ├── layout/             # AppLayout, Sidebar
│   │   │   └── ui/                 # Button, Input, Card, Badge, Toast, Modal, KPICard, ...
│   │   ├── hooks/                  # React Query hooks per module
│   │   ├── services/               # authService.js, api.js (axios instance)
│   │   ├── store/                  # Zustand stores (authStore, toastStore)
│   │   ├── constants/              # ROLES, ROUTES enums
│   │   ├── utils/                  # cn() utility
│   │   └── App.jsx                 # Root router + QueryClient
│   ├── index.html
│   └── vite.config.js
│
├── server/                         # Express API
│   ├── prisma/
│   │   ├── schema.prisma           # All models + enums (single source of truth)
│   │   └── seed.ts                 # Demo data (3 tenants, 10 users, 50 SKUs)
│   ├── src/
│   │   ├── index.ts                # App entry — middleware stack, route registration, event listeners
│   │   ├── config/
│   │   │   ├── env.ts              # Env validation + typed config object
│   │   │   ├── database.ts         # Prisma client singleton
│   │   │   └── logger.ts           # Winston + PII scrubber + securityLog helpers
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT verify (HS256 whitelist), requireRole()
│   │   │   ├── errorHandler.ts     # Global Express error handler
│   │   │   ├── rateLimiter.ts      # auth / api / heavy rate limiters
│   │   │   └── requestId.ts        # X-Request-ID UUID v4
│   │   ├── modules/                # Feature modules (one folder per domain)
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── forecast/
│   │   │   │   └── engine/         # ML model implementations
│   │   │   ├── consensus/
│   │   │   ├── supply/
│   │   │   ├── inventory/
│   │   │   ├── alerts/
│   │   │   ├── scenarios/
│   │   │   ├── integrations/
│   │   │   │   ├── base/           # DataConnector abstract class
│   │   │   │   └── connectors/     # ERP, CRM, WMS, POS, IoT, MarketData
│   │   │   └── users/
│   │   ├── events/
│   │   │   └── eventBus.ts         # AppEventBus (Node EventEmitter wrapper)
│   │   ├── routes/
│   │   │   ├── health.ts           # GET /health, GET /health/ready
│   │   │   └── metrics.ts          # GET /metrics (Prometheus)
│   │   └── utils/
│   │       └── response.ts         # successResponse(), errorResponse() helpers
│
├── nginx/
│   └── nginx.conf                  # TLS 1.3, security headers, attack path blocking
├── .github/
│   └── workflows/
│       └── pipeline.yml            # 6-stage CI/CD pipeline
├── k6/
│   └── load-test.js                # Smoke / load / stress / spike / soak scenarios
├── scripts/
│   ├── validate-env.sh             # Pre-deploy env check
│   ├── smoke-test.sh               # Post-deploy smoke test
│   ├── deploy.sh                   # Blue/green deploy script
│   ├── rollback.sh                 # One-command rollback
│   └── security-audit.sh          # Combined security scan runner
├── docs/
│   ├── THREAT_MODEL.md             # STRIDE threat model (15 threats)
│   ├── SECURITY_RUNBOOK.md         # Security incident procedures
│   └── INCIDENT_RESPONSE.md       # IR playbook
├── Dockerfile                      # Multi-stage Alpine (builder → runtime)
├── docker-compose.yml              # Full stack with DB, Redis, API, Nginx
├── vercel.json                     # SPA rewrite + build config for Vercel
├── .env.example                    # Documented env variable template
├── .gitignore                      # Comprehensive (excludes .env*, secrets)
├── .pre-commit-config.yaml         # Gitleaks + detect-secrets hooks
├── CREDENTIALS.md                  # Demo account credentials (10 accounts)
├── PROCESS_FLOW.md                 # Living process flow document
└── SOFTWARE_OVERVIEW.md            # This document
```

---

## 4. Software Architecture

### 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUANTUM OPTIMIZER PLATFORM                         │
└─────────────────────────────────────────────────────────────────────────────┘

   Browser / PWA
   ┌──────────────────────────────────────────┐
   │           React SPA (Vite)               │
   │                                          │
   │  Pages → Hooks → TanStack Query          │
   │              │                           │
   │  Zustand (auth, toast state)             │
   │              │                           │
   │  authService.js (real + mock fallback)   │
   └────────────────────┬─────────────────────┘
                        │ HTTPS (Bearer JWT)
                        ▼
   ┌──────────────────────────────────────────┐
   │            Nginx (Reverse Proxy)          │
   │   TLS 1.3 · Rate limit · Path blocking   │
   └────────────────────┬─────────────────────┘
                        │
                        ▼
   ┌──────────────────────────────────────────┐
   │          Express 5 API (TypeScript)       │
   │                                          │
   │  Middleware Stack:                        │
   │    Helmet (CSP, HSTS, CORP, COEP)        │
   │    X-Request-ID                          │
   │    CORS (strict allowlist)               │
   │    Body parser (1mb limit)               │
   │    Morgan (structured HTTP logs)         │
   │    Rate limiters (auth / api / heavy)    │
   │                                          │
   │  Feature Modules:                        │
   │    /auth  /dashboard  /forecasts         │
   │    /consensus  /supply  /inventory       │
   │    /alerts  /scenarios  /integrations    │
   │    /users  /health  /metrics             │
   │                                          │
   │  Event Bus (Node EventEmitter):           │
   │    DataIngested → re-forecast            │
   │    PlanApproved → generate supply plan   │
   │    ActualsCaptured → accuracy recalc     │
   └────────────┬─────────────────────────────┘
                │ Prisma (connection pool)
                ▼
   ┌──────────────────────────────────────────┐
   │          PostgreSQL 16                    │
   │   30+ models · multi-tenant scoping       │
   │   Indexed for query performance           │
   └──────────────────────────────────────────┘
```

### 4.2 Frontend Architecture

**Pattern:** Feature-based organization with a clear data-fetching layer

```
App.jsx (QueryClientProvider + BrowserRouter)
  │
  ├── ProtectedRoute (reads isAuthenticated from authStore)
  │
  └── Pages (route-level components)
        │
        ├── AppLayout (Sidebar + top bar)
        │
        ├── Custom Hooks (useXxx.js per module)
        │     ├── Wraps TanStack Query (useQuery / useMutation)
        │     ├── Reads auth token from Zustand authStore
        │     └── Calls apiFetch() with Authorization header
        │
        └── UI Components (client/src/components/ui/)
              Stateless: Button, Input, Card, Badge, Modal, Toast,
                         KPICard, AlertItem, Select
```

**State management:**
- **Server state:** TanStack Query — caches API responses, handles loading/error/stale states, auto-invalidates on mutations
- **Auth state:** Zustand `authStore` — persisted to `localStorage` key `qo-auth` (user object + JWT token)
- **Toast/notifications:** Zustand `toastStore` — ephemeral, not persisted

**Mock auth fallback:**  
`authService.js` tries the real backend first. On network error (no `err.response`), it validates credentials against a hardcoded `DEMO_USERS` array that mirrors the database seed exactly. Generates a `demo.{base64payload}.signature` mock token. Allows full offline demo on Vercel.

### 4.3 Backend Architecture

**Pattern:** Module-per-domain with explicit separation of concerns

```
server/src/index.ts  (application entry point)
  │
  ├── Middleware stack (registered in order)
  │     1. Helmet (security headers)
  │     2. requestIdMiddleware (X-Request-ID)
  │     3. CORS (origin allowlist from env)
  │     4. Body parser (JSON, 1mb limit)
  │     5. Morgan (HTTP access logs → Winston)
  │     6. apiRateLimiter (global /api routes)
  │
  ├── Route registration
  │     /health, /metrics   → infrastructure (no auth)
  │     /api/auth           → authRateLimiter + authRoutes
  │     /api/*              → feature routes (each module applies authenticate() internally)
  │
  └── Event bus listeners
        eventBus.onPlanApproved → generateSupplyPlan()

Each module folder contains:
  ├── *.routes.ts      Express Router, middleware applied here
  ├── *.controller.ts  Thin HTTP layer: parse → validate → call service → respond
  └── *.service.ts     Business logic, Prisma queries, mock fallback, event emissions
```

**Response envelope** (consistent across all endpoints):
```json
{ "success": true,  "data": { ... },    "error": null }
{ "success": false, "data": null, "error": { "code": "VALIDATION", "message": "..." } }
```

### 4.4 Database Architecture

**ORM:** Prisma v7 with PrismaPg adapter
**Database:** PostgreSQL 16
**Schema file:** `server/prisma/schema.prisma` (single source of truth for all models)

**Domain groupings:**

| Domain | Models |
|--------|--------|
| Identity | Tenant, User, AuditLog |
| Product/Location | SKU, Warehouse, Inventory |
| Demand signals | DemandHistory, PromoCalendar |
| Forecasting | ForecastResult, ForecastAccuracy, Forecast (legacy) |
| Alerts | Alert |
| Consensus planning | PlanVersion, PlanCell, PlanCellComment, PlanApproval |
| Supply planning | SupplyPlan, SupplyPlanRow, WorkCenter, BillOfMaterials, ProductionOrder, ReplenishmentOrderV2 |
| Integrations | ConnectorSyncLog, DataQualityIssue |
| Scenarios | Scenario |

**Performance indexes added:**
- `User(tenantId, isActive)`, `User(tenantId, role)` — tenant-scoped user lookups
- `Alert(isResolved, severity)`, `Alert(createdAt)` — alert filtering/sorting
- `PlanVersion(tenantId, status)`, `PlanVersion(tenantId, createdAt)` — plan list queries
- `PlanCell(planVersionId, itemId)`, `PlanCell(planVersionId, periodLabel)` — grid load
- `SupplyPlan(tenantId, status)`, `SupplyPlan(tenantId, demandPlanId)` — supply plan queries
- `SupplyPlanRow(supplyPlanId, itemId)`, `SupplyPlanRow(supplyPlanId, periodLabel)` — MRP grid
- `ProductionOrder(tenantId, status)`, `ProductionOrder(workCenterId, startDate)` — Gantt
- `DemandHistory(tenantId, itemId)`, `DemandHistory(tenantId, date)` — time-series reads

### 4.5 Multi-Tenancy Design

All user data is scoped by `tenantId` — enforced at **two levels**:

1. **JWT level:** `tenantId` is embedded in the access token at login and extracted by `authenticate()` middleware. Users cannot forge a different `tenantId`.

2. **Query level:** Every Prisma query that returns business data includes `where: { tenantId: req.user!.tenantId }`. This means even if JWT validation were bypassed, a different tenant's data cannot be returned.

**Three tenants in demo:**
| Tenant | Industry | Domain |
|--------|----------|--------|
| MedCore Pharma Ltd. | PHARMA | `tenant-pharma` |
| FreshBite Foods Ltd. | FNB | `tenant-fnb` |
| EverFresh Consumer Goods | FMCG | `tenant-fmcg` |

### 4.6 Event-Driven Design

`server/src/events/eventBus.ts` wraps Node's `EventEmitter` with typed interfaces:

```
Event: DataIngested
  Emitter:  integrations.service.ts (after successful connector sync)
  Listener: forecast module (triggers re-forecast for affected SKUs)
  Payload:  { connectorName, sourceType, tenantId, recordCount, qualityScore, timestamp }

Event: PlanApproved
  Emitter:  consensus.service.ts (approvePlan function)
  Listener: server/src/index.ts (auto-generates supply plan)
  Payload:  { planId, tenantId, approvedBy, timestamp }

Event: ActualsCaptured
  Emitter:  (future — actuals ingestion pipeline)
  Listener: forecast module (triggers accuracy recalculation)
  Payload:  { tenantId, periodEnd, recordCount, timestamp }
```

---

## 5. Module Reference

### 5.1 Auth

**Files:** `server/src/modules/auth/`
**Routes:** `POST /api/auth/login`, `POST /api/auth/demo-request`

**Login flow:**
1. Validate request body (email, password)
2. Look up user by email (tenantId included in result)
3. **Timing-safe compare:** `bcrypt.compare()` runs even for non-existent users (against dummy hash) to prevent user enumeration via response time
4. On success: sign JWT (HS256, 15min expiry), write AuditLog, emit `securityLog.loginSuccess`
5. On failure: emit `securityLog.loginFailure`, return generic 401

**Security measures:**
- bcrypt cost factor: 12
- JWT expiry: 15 minutes (reduced from 8h)
- Algorithm whitelist: `HS256` only in `jwt.verify`
- Rate limit: 10 requests/minute on `/api/auth`
- AuditLog written on every login attempt

---

### 5.2 Dashboard

**Files:** `server/src/modules/dashboard/`
**Routes:** `GET /api/dashboard/kpis`, `GET /api/dashboard/accuracy-trend`, `GET /api/dashboard/sku-status`
**Page:** `DashboardPage.jsx`

Aggregates cross-module KPIs for the authenticated tenant:
- Active alerts count, critical alerts, overstock/stockout SKU counts
- MAPE trend over the past 8 weeks (from ForecastAccuracy)
- SKU status list (stock days, alert flags)

---

### 5.3 Data Hub (Integrations)

**Files:** `server/src/modules/integrations/`
**Routes:** `/api/integrations/*`
**Page:** `DataHubPage.jsx`

**Connector framework:**

```
DataConnector (abstract base class)
  ├── extract()       pull records from source
  ├── validate()      schema and type checks
  ├── normalize()     map to DemandHistory shape
  └── load()          Prisma upsert with @@unique constraint

Connectors:
  ErpConnector       → sales orders, invoices
  CrmConnector       → customer/sales rep data
  WmsConnector       → warehouse movements
  PosConnector       → point-of-sale actuals
  IotConnector       → sensor/cold-chain readings
  MarketDataConnector → market share, pricing indices
```

Each sync run:
1. Runs extract → validate → normalize → load pipeline
2. Captures data quality issues (`DataQualityIssue` model) for any field-level failures
3. Writes a `ConnectorSyncLog` record (records total/inserted, quality score 0–100, duration)
4. Emits `DataIngested` event on success

---

### 5.4 AI Demand Forecasting

**Files:** `server/src/modules/forecast/`, `server/src/modules/forecast/engine/`
**Routes:** `/api/forecasts/*`
**Page:** `ForecastPage.jsx`

**Three-model ensemble:**

| Model | Algorithm | Strengths |
|-------|-----------|-----------|
| Holt-Winters | Triple exponential smoothing | Trend + seasonality |
| SARIMA | Seasonal ARIMA | Statistical stationarity |
| XGBoost | Gradient boosting simulation | Non-linear patterns, promo effects |

**Ensemble method:** Inverse-MAPE weighting — models with lower historical error get higher weight.

**Confidence intervals:**
- 80%: ±1.28σ√h (σ = model residual std dev, h = horizon)
- 95%: ±1.96σ√h

**Promo calendar:** `PromoCalendar` model stores uplift % events. PromoCalendar events within forecast horizon are applied as multipliers to the point forecast.

**Override:** Supply planners can override any forecast value with a justification note. Override is stored on `ForecastResult.overrideValue` and tracked with `overrideBy`, `overrideNote`, `overrideAt`.

---

### 5.5 Consensus Demand Planning

**Files:** `server/src/modules/consensus/`
**Routes:** `/api/consensus/*` (10 endpoints)
**Page:** `ConsensusPage.jsx`
**Hooks:** `useConsensus.js` (9 hooks)

**Plan status machine:**
```
DRAFT → SUBMITTED → APPROVED
                  → REJECTED → (can create new DRAFT)
APPROVED → LOCKED  (after supply plan generated)
```

**Pivot grid:** Each plan version seeds `PlanCell` rows for every (SKU, location, ISO week) combination from the approved `ForecastResult` rows. Planners edit `consensusValue` inline; revenue impact is recalculated on each save: `(consensusValue − statForecast) × avgPrice`.

**NPI analogue finder:** `GET /api/consensus/npi/analogues?category=X` returns SKUs in the same category with their average weekly demand — used as reference when planning new product introductions.

**Approval trail:** Every status transition creates a `PlanApproval` record (userId, email, name, action, note, timestamp) for tamper-evident audit.

---

### 5.6 Supply Planning

**Files:** `server/src/modules/supply/`
**Routes:** `/api/supply/*` (13 endpoints)
**Page:** `SupplyPlanningPage.jsx`
**Hooks:** `useSupplyPlanning.js` (13 hooks)

**Trigger:** Automatically initiated by the `PlanApproved` event. Can also be manually triggered via `POST /api/supply`.

**MRP Engine (per SKU × location × week):**
```
Net Requirement  = max(0, DemandQty + SafetyStock − OpeningStock)
SafetyStock      = DemandQty × 0.25   (25% coverage buffer)
PlannedProd      = ceil(NetReq / 100) × 100   (lot sizing: nearest 100)
ClosingStock     = OpeningStock + PlannedProd + PlannedPurchase − DemandQty
CoverageDays     = ClosingStock / (DemandQty / 7)
```

**Three UI tabs:**
- **MRP Grid:** SKU × week pivot with inline editing of Planned Production and Planned Purchase
- **Production Board:** Gantt chart of production orders per work center, with status transitions and rescheduling
- **Orders:** Replenishment order list with Approve / Dispatch workflow

**Plan lifecycle:**
```
DRAFT → RELEASED → LOCKED
```

---

### 5.7 Inventory Management

**Files:** `server/src/modules/inventory/`
**Routes:** `/api/inventory/*`
**Page:** `InventoryPage.jsx`

Tracks current stock levels per SKU per warehouse:
- `Inventory.quantity` — current on-hand units
- `Inventory.stockDays` — days of cover at current burn rate
- `Inventory.expiryDate` — for pharma/FNB batch expiry tracking
- `Inventory.batchNumber` — lot/batch reference

Key views:
- Stock levels grid (SKU × warehouse)
- Expiry risk list (items expiring within 30 days)
- Stockout risk (stock days < safety threshold)

---

### 5.8 Alerts & Exceptions

**Files:** `server/src/modules/alerts/`
**Routes:** `/api/alerts/*`
**Page:** `AlertsPage.jsx`

**Alert categories:**

| Category | Trigger |
|----------|---------|
| `STOCKOUT_RISK` | Projected stock days < safety threshold |
| `EXPIRY` | Batch expiry within 30 days |
| `OVERSTOCK` | Stock days > overstock threshold |
| `SUPPLIER_DELAY` | Replenishment order overdue |
| `AI_PLAN_READY` | New forecast ready for consensus review |

**Severity levels:** `CRITICAL`, `WARNING`, `INFO`

Alerts are resolved with `resolvedBy` + `resolvedAt` tracking. Bulk-resolve is supported.

---

### 5.9 Scenario Planner

**Files:** `server/src/modules/scenarios/`
**Routes:** `/api/scenarios/*`
**Page:** `ScenarioPlannerPage.jsx`

What-if simulations run in an isolated sandbox (does not modify live planning data):

| Scenario Type | Parameter |
|---------------|-----------|
| `DEMAND_SHOCK` | ± % demand change for a category |
| `SUPPLY_DISRUPTION` | Days of lost supply for a region |
| `PROMO_UPLIFT` | Promo uplift % for a SKU group |
| `PRICE_CHANGE` | Price elasticity impact |

Results stored as JSON in `Scenario.results` for comparison. UI shows KPI deltas (revenue, service level, inventory value) using Recharts bar/line charts.

---

### 5.10 Admin

**Files:** `server/src/modules/users/`
**Page:** `AdminPage.jsx`
**Access:** `SUPER_ADMIN` role only

Four tabs:
- **User Management:** All users in tenant (create/edit/deactivate — future)
- **AI Models:** Model MAPE comparison via `GET /api/forecasts/model-performance`
- **Audit Log:** Full `AuditLog` history (who, what, when, IP, entity)
- **Integrations:** Connector sync history via `GET /api/integrations/sync-logs`

---

## 6. Frontend Pages & Components

### Pages

| Page | Route | Auth Required | Description |
|------|-------|---------------|-------------|
| LandingPage | `/` | No | Marketing page, demo request form |
| SignInPage | `/signin` | No | JWT login form, toast feedback |
| DashboardPage | `/dashboard` | Yes | KPI cards, accuracy trend, alert feed |
| ForecastPage | `/forecast` | Yes | AI model comparison, CI bands, override panel |
| AlertsPage | `/alerts` | Yes | Exception list, severity filters, bulk resolve |
| InventoryPage | `/inventory` | Yes | Stock grid, expiry risk list |
| ConsensusPage | `/consensus` | Yes | Pivot grid, approval workflow, comments, NPI finder |
| SupplyPlanningPage | `/supply-planning` | Yes | MRP grid, production board (Gantt), orders |
| ScenarioPlannerPage | `/scenarios` | Yes | What-if simulation builder, KPI comparison |
| DataHubPage | `/data-hub` | Yes | Connector health tiles, quality issues, sync logs |
| AdminPage | `/admin` | SUPER_ADMIN | Users, models, audit log, integrations |
| Compliance | `/compliance` | Yes | (placeholder — future) |
| Integrations | `/integrations` | Yes | (placeholder — future) |

### Shared UI Components (`client/src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button` | Variants: gold (primary), outline, ghost. Sizes: xs, sm, md, lg |
| `Input` | Labelled text input, supports error state |
| `Select` | Dropdown with label |
| `Card` | White rounded container, optional header |
| `Badge` | Small status/category pill |
| `Modal` | Centered overlay dialog |
| `Toast` / `ToastContainer` | Ephemeral notification (success/error/info) |
| `KPICard` | Metric with title, value, trend arrow, delta % |
| `AlertItem` | Single alert row with severity icon and resolve action |

### Layout Components (`client/src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Wraps authenticated pages — Sidebar + main content area |
| `Sidebar` | Collapsible nav (collapsed: 64px, expanded: 240px), role-gated Admin link |

---

## 7. Data Models

### Identity & Tenancy

```
Tenant
  id · name · industry (PHARMA/FNB/FMCG) · ssoConfig · mfaRequired · dataRegion

User
  id · email (unique) · password (bcrypt) · firstName · lastName
  role (RETAILER/DISTRIBUTOR_MANAGER/SUPPLY_PLANNER/PRODUCTION_MANAGER/FINANCE/SUPER_ADMIN)
  tenantId · isActive · lastLogin
  @@index([tenantId, isActive])
  @@index([tenantId, role])

AuditLog
  id · userId → User · action · entity · entityId · metadata (JSON) · ip · createdAt
```

### Product & Location

```
SKU
  id · code · name · category · unit · tenantId → Tenant

Warehouse
  id · name · location · region · tenantId → Tenant

Inventory
  id · skuId → SKU · warehouseId → Warehouse
  quantity · stockDays · expiryDate? · batchNumber?
```

### Demand & Forecast

```
DemandHistory
  id · tenantId · itemId · locationId · date · quantity · revenue · channel · promoFlag · source
  @@unique([itemId, locationId, date, channel])

ForecastResult
  id · tenantId · itemId · locationId · forecastDate · horizon
  pointForecast · lower80 · upper80 · lower95 · upper95
  modelUsed (HOLT_WINTERS/SARIMA/XGBOOST/ENSEMBLE) · confidenceScore
  isOverridden · overrideValue · overrideBy · overrideNote · overrideAt
  @@unique([tenantId, itemId, locationId, forecastDate, modelUsed])

ForecastAccuracy
  id · tenantId · itemId · locationId · modelUsed · periodEnd
  mape · wmape · bias · fva · sampleSize

PromoCalendar
  id · tenantId · itemId? · locationId? · name · startDate · endDate · upliftPct · channel
```

### Consensus Planning

```
PlanVersion  (status: DRAFT → SUBMITTED → APPROVED/REJECTED → LOCKED)
  id · tenantId · name · periodStart · periodEnd · status · baselineId?
  createdBy · submittedAt? · submittedBy? · reviewedAt? · reviewedBy? · reviewNote?

PlanCell  @@unique([planVersionId, itemId, locationId, periodLabel])
  id · planVersionId → PlanVersion · itemId · locationId · periodLabel (ISO week)
  statForecast · consensusValue · priorValue? · revenueImpact?
  editedBy? · editedAt?

PlanCellComment
  id · cellId → PlanCell · userId · userEmail · userName · body

PlanApproval
  id · planVersionId → PlanVersion · action (SUBMITTED/APPROVED/REJECTED)
  userId · userEmail · userName · note?
```

### Supply Planning

```
SupplyPlan  (status: DRAFT → RELEASED → LOCKED)
  id · tenantId · name · demandPlanId (→ PlanVersion) · status
  planStart · planEnd · createdBy · releasedBy? · releasedAt?

SupplyPlanRow  @@unique([supplyPlanId, itemId, locationId, periodLabel])
  id · supplyPlanId → SupplyPlan · itemId · locationId · periodLabel
  demandQty · openingStock · safetyStock · plannedProduction · plannedPurchase
  closingStock · coverageDays · isEdited · editedBy? · editedAt?

WorkCenter
  id · tenantId · name · capacityPerDay · efficiencyPct

BillOfMaterials  @@unique([tenantId, parentId, childId])
  id · tenantId · parentId (finished good SKU) · childId (component SKU) · quantity · leadTimeDays

ProductionOrder  (status: PLANNED → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELLED)
  id · tenantId · supplyPlanId? → SupplyPlan · itemId
  workCenterId → WorkCenter · quantity · startDate · endDate · status · createdBy

ReplenishmentOrderV2  (status: PENDING → AUTO_APPROVED/HUMAN_APPROVED → DISPATCHED)
  id · tenantId · supplyPlanId? · itemId · locationId · quantity
  isAutomatic · status · approvedBy? · erpRef?
```

### Integration

```
ConnectorSyncLog
  id · tenantId · connectorName · sourceType
  recordsTotal · recordsInserted · qualityIssues · qualityScore · durationMs · status

DataQualityIssue
  id · tenantId · source · sourceType · recordId · field · issueType · rawValue · resolved

Alert
  id · skuId? → SKU · warehouseId? · severity · category · title · message
  isResolved · resolvedBy? · resolvedAt?
  @@index([isResolved, severity])
  @@index([createdAt])
```

---

## 8. API Design

### Conventions

- All routes prefixed `/api/`
- Auth: `Authorization: Bearer <JWT>` header
- Response envelope: `{ success, data, error }`
- Error shape: `{ code: "SNAKE_CASE", message: "Human readable" }`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Validation), 401 (Unauth), 403 (Forbidden), 404 (Not found), 409 (Conflict/wrong state), 500 (Internal)
- Tenant isolation: every endpoint reads `req.user.tenantId` from JWT — never from request body

### Endpoint Summary

| Prefix | Endpoints | Auth |
|--------|-----------|------|
| `/api/auth` | POST /login, POST /demo-request | None (rate limited) |
| `/api/dashboard` | GET /kpis, /accuracy-trend, /sku-status | Any role |
| `/api/forecasts` | GET /, GET /:skuId, POST /run, PATCH /:id/override, GET /accuracy-trend, GET /model-performance, GET /promos, POST /promos | Any role |
| `/api/alerts` | GET /, POST /, PATCH /:id/resolve | Any role |
| `/api/inventory` | GET /, GET /:id, GET /expiry-risk | Any role |
| `/api/scenarios` | GET /, POST /, POST /:id/run | Any role |
| `/api/consensus` | GET /, POST /, GET /buckets, GET /npi/analogues, GET /:id, PATCH /:id/cells, POST /:id/submit, POST /:id/approve, POST /:id/reject, GET /cells/:cellId/comments, POST /cells/:cellId/comments | Role-gated |
| `/api/supply` | GET /, POST /, GET /work-centers, GET /capacity, GET /production-orders, GET /replenishment, GET /:id, PATCH /:id/rows, POST /:id/release, PATCH /production-orders/:id/status, PATCH /production-orders/:id/reschedule, POST /replenishment/:id/approve, POST /replenishment/:id/dispatch | Role-gated |
| `/api/integrations` | GET /, GET /quality-issues, GET /sync-logs, POST /sync, PATCH /quality-issues/:id/resolve | Any role |
| `/api/users` | GET / | SUPER_ADMIN |
| `/health` | GET /, GET /ready | None |
| `/metrics` | GET / | Internal network (Nginx restricted) |

---

## 9. Authentication & Authorization

### JWT Flow

```
POST /api/auth/login
  → { accessToken, user }
  → stored in localStorage (key: qo-auth via Zustand persist)

Subsequent requests:
  Authorization: Bearer <accessToken>
  → authenticate() middleware verifies:
      - Header present and starts with "Bearer "
      - jwt.verify(token, secret, { algorithms: ['HS256'] })
      - Attaches req.user = { id, email, role, tenantId }
```

**Token properties:**
- Algorithm: HS256 (explicit whitelist prevents algorithm confusion attacks)
- Expiry: 15 minutes
- Claims: `{ id, email, role, tenantId, exp }`

### Role-Based Access Control

```
requireRole(...roles) middleware — applied per route as needed

Role hierarchy (from least to most privileged):
  RETAILER < DISTRIBUTOR_MANAGER < PRODUCTION_MANAGER < FINANCE < SUPPLY_PLANNER < SUPER_ADMIN

Inline role checks in services (for business logic gates):
  EDITOR_ROLES = ['SUPPLY_PLANNER', 'SUPER_ADMIN']         — consensus cell editing
  APPROVER_ROLES = ['FINANCE', 'SUPER_ADMIN']               — consensus approval
  SUPPLY_PLANNER_ROLES = ['SUPPLY_PLANNER', 'PRODUCTION_MANAGER', 'SUPER_ADMIN']
  SUPPLY_APPROVER_ROLES = ['SUPPLY_PLANNER', 'SUPER_ADMIN'] — supply plan release
```

---

## 10. Security Architecture

### Layers of Defence

| Layer | Control | Implementation |
|-------|---------|----------------|
| Network | TLS 1.3 only | Nginx ssl_protocols |
| HTTP headers | CSP, HSTS, CORP, COEP, COOP | Helmet hardened config |
| CORS | Strict allowlist | `env.frontendUrl` checked on every request |
| Rate limiting | auth: 10/min, api: 1000/15min, heavy: 30/min | express-rate-limit |
| Authentication | JWT HS256, 15min expiry | jsonwebtoken + algorithm whitelist |
| Password storage | bcrypt cost 12 | bcrypt |
| Timing attacks | Dummy hash for non-existent users | auth.controller.ts |
| Input validation | Body parser 1mb limit, field validation in controllers | express + manual |
| Tenant isolation | tenantId from JWT, all queries scoped | Every Prisma query |
| Audit trail | AuditLog on every write action | auth + consensus + supply modules |
| PII protection | PII scrubber in Winston logger | logger.ts scrubPII() |
| Request tracing | X-Request-ID UUID v4 | requestId middleware |
| Secret scanning | Gitleaks + detect-secrets (pre-commit + CI) | .pre-commit-config.yaml |
| SAST | Semgrep (CI) | pipeline.yml |
| Dependency audit | npm audit + Snyk (CI) | pipeline.yml |
| Container scanning | Trivy (CI) | pipeline.yml |
| DAST | OWASP ZAP baseline scan (staging CI) | pipeline.yml |

### Security Documents

| Document | Location |
|----------|----------|
| STRIDE Threat Model (15 threats) | `docs/THREAT_MODEL.md` |
| Security Runbook | `docs/SECURITY_RUNBOOK.md` |
| Incident Response Playbook | `docs/INCIDENT_RESPONSE.md` |

---

## 11. Planning Cycle — End-to-End Flow

```
1. DATA INGESTION
   ─────────────
   External source (ERP/CRM/WMS/POS/IoT/Market) 
     → POST /api/integrations/sync
     → DataConnector.run(): extract → validate → normalize → load
     → DemandHistory upserted (@@unique prevents duplicates)
     → ConnectorSyncLog written
     → DataIngested event emitted

2. AI DEMAND SENSING
   ─────────────────
   DataIngested event → forecast engine triggered
     → Holt-Winters, SARIMA, XGBoost models run per SKU × location
     → Inverse-MAPE ensemble combines outputs
     → ForecastResult upserted (point, lower80, upper80, lower95, upper95)
     → ForecastAccuracy updated (MAPE, WMAPE, bias, FVA)
     → Alert AI_PLAN_READY created

3. CONSENSUS PLANNING (S&OP)
   ──────────────────────────
   Supply Planner: POST /api/consensus → PlanVersion (DRAFT) created
     → Cells seeded from ForecastResult (statForecast = immutable AI value)
   
   Planner edits cells inline (pivot grid)
     → PATCH /api/consensus/:id/cells
     → revenueImpact = (consensusValue − statForecast) × avgPrice
     → Cell-level comments via POST /api/consensus/cells/:cellId/comments
   
   Planner submits: POST /api/consensus/:id/submit
     → status: DRAFT → SUBMITTED
     → PlanApproval record (action: SUBMITTED)
     → AuditLog
   
   Finance Approver: POST /api/consensus/:id/approve
     → status: SUBMITTED → APPROVED
     → PlanApproval record (action: APPROVED)
     → PlanApproved event emitted

4. SUPPLY PLANNING (MRP/MPS/DRP)
   ──────────────────────────────
   PlanApproved event → generateSupplyPlan() auto-triggered
     → Load approved PlanVersion cells (demand quantities)
     → Load current Inventory (opening stock)
     → MRP engine: per SKU × location × week:
         NetReq = max(0, Demand + SafetyStock − OpeningStock)
         PlannedProd = ceil(NetReq / 100) × 100
         ClosingStock = Opening + Prod + Purchase − Demand
     → SupplyPlan (DRAFT) + SupplyPlanRows created in DB
   
   Supply Planner reviews MRP Grid, adjusts rows
     → PATCH /api/supply/:id/rows
   
   Reviews Production Board (Gantt), updates order statuses
     → PATCH /api/supply/production-orders/:id/status
   
   Approves replenishment orders
     → POST /api/supply/replenishment/:id/approve
     → POST /api/supply/replenishment/:id/dispatch (ERP erpRef attached)
   
   Releases plan
     → POST /api/supply/:id/release → status: RELEASED
```

---

## 12. Infrastructure & Deployment

### Vercel (Frontend)

`vercel.json` at repo root:
```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "installCommand": "cd client && npm install",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The `rewrites` rule ensures React Router's client-side routing works — all paths return `index.html` and React handles routing.

### Docker (Backend)

**Multi-stage `Dockerfile`:**
1. `builder` stage: Alpine + Node 20, installs deps, compiles TypeScript
2. `runtime` stage: fresh Alpine, copies compiled output, creates non-root `appuser`, uses `dumb-init` for signal handling

**`docker-compose.yml`:** Full stack:
- `postgres` — PostgreSQL 16 (internal network only)
- `redis` — Redis (internal network only)
- `api` — Express API (read-only filesystem + tmpfs for /tmp, `no-new-privileges: true`, resource limits)
- `nginx` — Reverse proxy (ports 80/443 exposed)

### Nginx

`nginx/nginx.conf`:
- TLS 1.3 only (`ssl_protocols TLSv1.3`)
- All security headers (matches Helmet on API side)
- Attack path blocking (`/.env`, `/admin`, `/.git`, `/wp-*`)
- `/metrics` restricted to internal network (not public)

---

## 13. CI/CD Pipeline

`.github/workflows/pipeline.yml` — 6 stages:

| Stage | Jobs | Tools |
|-------|------|-------|
| 1. Preflight | Secret scanning | Gitleaks |
| 2. Quality | TypeScript compile, ESLint, Vite build | tsc, eslint, vite |
| 3. Security | SAST, dependency audit, Snyk | Semgrep, npm audit, Snyk |
| 4. Build | Docker build, container scan | Docker, Trivy |
| 5. Staging | Smoke test, DAST | smoke-test.sh, OWASP ZAP |
| 6. Production | Manual approval gate, blue/green deploy | deploy.sh |

**SLO thresholds (k6 load tests):**
- p95 response time < 500ms
- Error rate < 1%
- Scenarios: smoke / load (50 VU) / stress (200 VU) / spike (500 VU burst) / soak (30min)

---

## 14. Development Standards

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files (server) | kebab-case | `consensus.service.ts` |
| Files (client) | PascalCase pages, camelCase hooks | `ConsensusPage.jsx`, `useConsensus.js` |
| Database models | PascalCase | `PlanVersion` |
| API routes | kebab-case | `/api/supply/work-centers` |
| Env vars | SCREAMING_SNAKE_CASE | `JWT_ACCESS_SECRET` |
| React components | PascalCase | `StatusBadge` |
| Hooks | camelCase, `use` prefix | `useSupplyPlanning` |

### Code Patterns

**Controller (thin):**
```typescript
export async function patchCells(req, res) {
  // 1. Role check
  if (!EDITOR_ROLES.includes(req.user!.role)) return errorResponse(res, 'FORBIDDEN', ...);
  // 2. Validate input
  if (!Array.isArray(edits)) return errorResponse(res, 'VALIDATION', ...);
  // 3. Delegate to service
  const result = await upsertCells(req.params.id, req.user!.tenantId, edits, req.user!.id);
  // 4. Respond
  return successResponse(res, result);
}
```

**Service (business logic + mock fallback):**
```typescript
export async function listThings(tenantId: string) {
  try {
    const rows = await prisma.thing.findMany({ where: { tenantId } });
    if (rows.length === 0) return MOCK_THINGS.filter(t => t.tenantId === tenantId);
    return rows;
  } catch {
    return MOCK_THINGS.filter(t => t.tenantId === tenantId);
  }
}
```

**Hook (React Query):**
```javascript
export function useThings() {
  return useQuery({
    queryKey: ['things'],
    queryFn: () => apiFetch('/api/things'),
    staleTime: 30_000,
  });
}
```

### Security Rules

1. Never put `tenantId` in the request body for filtering — always use `req.user.tenantId` from JWT
2. Always validate request body before calling service functions
3. Use `successResponse()` and `errorResponse()` helpers — never raw `res.json()`
4. Log security events via `securityLog.*` (loginSuccess, loginFailure, tokenInvalid)
5. New env vars must be added to `.env.example` and `REQUIRED_IN_PRODUCTION` if critical

---

## 15. Environment Configuration

Full variable reference in `.env.example`. Minimum required for development:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/quantumoptimizer
JWT_ACCESS_SECRET=dev_secret_change_before_production
JWT_REFRESH_SECRET=dev_refresh_change_before_production
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

Required in production (missing any will crash the server on startup):
- `DATABASE_URL`
- `JWT_ACCESS_SECRET` (must NOT be `dev_secret`)
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`

---

## 16. Demo Accounts

All accounts use password `demo1234`. See `CREDENTIALS.md` for full table.

| Role | Email | Tenant |
|------|-------|--------|
| Super Admin | admin@pharma.com | MedCore Pharma Ltd. |
| Supply Planner | planner@pharma.com | MedCore Pharma Ltd. |
| Finance Approver | finance@pharma.com | MedCore Pharma Ltd. |
| Production Manager | production@pharma.com | MedCore Pharma Ltd. |
| Distributor Manager | distributor@pharma.com | MedCore Pharma Ltd. |
| Retailer | retailer@pharma.com | MedCore Pharma Ltd. |
| Super Admin | admin@fnb.com | FreshBite Foods Ltd. |
| Supply Planner | planner@fnb.com | FreshBite Foods Ltd. |
| Super Admin | admin@fmcg.com | EverFresh Consumer Goods |
| Supply Planner | planner@fmcg.com | EverFresh Consumer Goods |

**Note:** When the backend is offline (Vercel demo), login uses client-side mock auth. The mock token is a base64-encoded payload — sufficient for demo, not a real JWT.

---

## 17. Roadmap

| Phase | Module | Status |
|-------|--------|--------|
| Phase 1 | Data Ingestion + Platform Foundation | ✅ Complete |
| Phase 2 | AI Demand Forecasting | ✅ Complete |
| Phase 3 | Consensus Demand Planning (S&OP) | ✅ Complete |
| Phase 4 | Concurrent Supply Planning (MRP/MPS/DRP) | ✅ Complete |
| Phase 5 | Exception Management & Scenario Analysis | Planned |
| Phase 6 | Approved Plan & Release (frozen zones, sign-off workflow) | Planned |
| Phase 7 | Execution Monitoring & Feedback Loop (OTIF%, actuals) | Planned |
| Phase 8 | Platform Quality (Redis caching, >80% test coverage, pagination) | Planned |

**Pending items:**
- JWT storage migration: `localStorage` → HttpOnly cookie (security hardening)
- Compliance page: dedicated implementation (currently placeholder)
- Integrations page: dedicated implementation (currently placeholder)
- CHANGELOG.md, TESTING.md, MIGRATION.md delivery documents
- Supplier collaboration portal (Phase 7)
- Real-time notifications (WebSocket or SSE for alert delivery)
