# Quantum Optimizer — Full-Stack Development Prompt
### React + Tailwind CSS (Frontend) · Node.js (Backend)

---

## 🎯 Project Overview

You are building **Quantum Optimizer** — an enterprise-grade, AI-driven **Demand Planning & Supply Chain Forecasting SaaS platform** for Pharma, F&B, and FMCG industries. The platform serves a multi-tenant, multi-role supply chain network spanning retailers, distributors, manufacturers, supply planners, finance, and super admins.

The platform must be rebuilt from a single-page HTML marketing/product site into a **production-ready full-stack web application** with a React + Tailwind CSS frontend and a Node.js backend.

---

## 🎨 Design System & Brand Identity

### Color Palette (replicate exactly)
```css
--cream:        #f5f2ec   /* Primary background */
--cream2:       #ede9e0   /* Section alternate background */
--cream3:       #e4dfd4   /* Subtle fills */
--white:        #ffffff
--gold:         #b8922a   /* Primary brand accent */
--gold2:        #c9a440   /* Gold hover state */
--gold-light:   #e8c96a   /* Light gold fills */
--dark:         #1a1a14   /* Primary text */
--dark2:        #2c2c22   /* Secondary dark */
--mid:          #5a5a48   /* Muted body text */
--muted:        #8a8a72   /* Labels & captions */
--muted2:       #b0ab98   /* Placeholder text */
--green:        #3a7d5c   /* Success / Healthy */
--green-light:  #e8f4ee   /* Success backgrounds */
--blue:         #2a5a8a   /* Informational */
--blue-light:   #e8f0f8   /* Info backgrounds */
--amber-light:  #fdf3e0   /* Warning backgrounds */
--danger:       #c0392b   /* Critical / Risk */
--danger-light: #fdecea   /* Critical backgrounds */
```

### Typography
- **Display headings:** `Playfair Display` (700, 800) — serif, italic for emphasis
- **Body / descriptions:** `Cormorant Garamond` (400, 500, 600)
- **UI elements / labels:** `DM Sans` (300, 400, 500, 600)
- Import from Google Fonts

### Tailwind Configuration
Extend `tailwind.config.js` to include all brand colors as custom tokens and register the three font families under `fontFamily`.

---

## 🖥️ Frontend — React + Tailwind CSS

### Tech Stack
- **React 18** with functional components and hooks
- **Tailwind CSS 3** with custom config (brand tokens)
- **React Router v6** for client-side routing
- **Axios** for API communication
- **Recharts** for data visualization (bar charts, line charts, accuracy trends)
- **React Query (TanStack Query)** for server state management
- **Zustand** for global client state (auth, user role, toast queue)
- **Framer Motion** for animations and transitions
- **React Hook Form + Zod** for form validation
- **date-fns** for date formatting
- **clsx / tailwind-merge** for conditional class composition

### Project Structure
```
src/
├── components/
│   ├── ui/              # Reusable primitives (Button, Badge, Card, Modal, Toast, Input)
│   ├── layout/          # Navbar, Footer, Sidebar, PageWrapper
│   ├── dashboard/       # KPI cards, mini charts, alert items, SKU table
│   ├── features/        # Feature cards, How-It-Works steps, Role cards
│   └── marketing/       # Hero, KPI strip, Compliance grid, Integrations, CTA
├── pages/
│   ├── LandingPage.jsx
│   ├── SignInPage.jsx
│   ├── DashboardPage.jsx
│   ├── ForecastPage.jsx
│   ├── AlertsPage.jsx
│   ├── InventoryPage.jsx
│   ├── ScenarioPlannerPage.jsx
│   ├── CompliancePage.jsx
│   ├── IntegrationsPage.jsx
│   └── AdminPage.jsx
├── hooks/               # useAuth, useAlerts, useToast, useRoleAccess
├── store/               # Zustand stores
├── services/            # API service modules (auth, forecast, inventory, alerts)
├── utils/               # formatters, cn(), roleGuard
└── constants/           # roles, routes, industry types
```

---

### Page-by-Page UI Specifications

#### 1. Landing Page (`/`)

Rebuild the entire HTML marketing page as a React component tree:

**Navbar (sticky, glassmorphism)**
- Fixed top, `backdrop-blur`, semi-transparent cream background
- Brand: `"Forge "` + `"Quantum"` in gold + `" Solution"`
- Nav links: Product · Features · How It Works · Compliance · Roles (smooth scroll anchors)
- Right CTA: `Sign In` text button + `Get Started` gold button
- On scroll: add drop shadow
- Mobile: hamburger menu, hide nav links

**Hero Section**
- Two-column grid (left: copy, right: floating dashboard cards)
- Eyebrow badge: `"AI-Powered Supply Chain Optimisation"`
- H1: `"Unified Planning."` + italic gold `"Intelligent Control."`
- Subheading paragraph about the platform
- Two CTA buttons: `Sign In to Platform` (gold) + `Explore Product` (outline)
- 4-cell stats grid below: `12+ AI Planning Modules`, `100% Digital Audit Trail`, `6 Role-based Access Levels`, `21 CFR Part 11 Ready`
- **Right side (decorative, hidden on mobile):** Main dashboard card (Supply Planner View) with KPI tiles, mini bar chart, SKU status table — plus 3 floating cards: Demand Forecast (+38%), Cert Health (96%), Audit Score (92)

**KPI Strip (full-width dark band)**
- 4 metrics: `↑50% Forecast Accuracy`, `↓40% Inventory Cost`, `↓55% Stockout Events`, `↓35% Product Waste`

**Features Section** (`#features`, cream2 background)
- Section eyebrow + H2 + subtext
- 3×2 grid of feature cards with numbered labels:
  1. Self-Learning AI Forecasting
  2. Autonomous Replenishment
  3. Real-Time Demand Sensing
  4. Expiry & Shelf-Life AI
  5. Scenario Planning Studio
  6. Universal ERP Integration
- Cards have hover background transition

**How It Works Section** (`#how`)
- Left: 5 clickable steps (accordion — only active step shows description)
  1. Data Ingestion
  2. AI Demand Modelling
  3. Intelligent Alerting
  4. Autonomous Execution
  5. Continuous Learning
- Right: sticky visual panel that changes content per active step
- Each step visual is a mini UI mockup component (data sources panel, model accuracy bars, alert list, auto-PO stats, accuracy trend chart)
- Active step: gold number + gold title; others: muted

**Compliance Section** (`#compliance`)
- Left: 3-column compliance badge grid (21 CFR Part 11, GMP, ISO 13485, FSSAI, HACCP, GDPR)
- Right: Auth flow visual (4-step process: SSO/SAML → MFA → RBAC JWT → Audit Log) + 4 security feature tiles (AES-256, SSO/SAML 2.0, Full Audit Trail, Data Residency)

**Roles Section** (`#roles`, dark background `#1a1a14`)
- H2 white + gold italic
- 3×2 grid of role cards (glassmorphism on dark):
  1. Retailer
  2. Distributor Manager
  3. Supply Planner
  4. Production Manager
  5. Finance
  6. Super Admin
- Each card: emoji icon, role title, department, description, permission tags

**Industries Section**
- Light cream2 background
- Left: heading + industry cards (Pharma, F&B, FMCG) with tab-like selection
- Right: sticky visual panel showing industry-specific metrics per selected industry

**Integrations Section**
- Grid of integration logos/badges: SAP, Oracle, Microsoft Dynamics, Salesforce, Kafka, AWS, Snowflake, MuleSoft, Google Cloud, Azure
- "API-first architecture" highlight

**Final CTA Section**
- Two-column: left copy + right form
- Form: First Name, Last Name, Company, Industry (select), Role (select), email, phone
- Submit: `"Request a Demo"` gold button
- Toast notification on submit

**Footer**
- Brand name · Copyright · Privacy Policy · Terms of Service links

---

#### 2. Sign In Page (`/signin`)

- Centered card on cream background
- Brand logo/name at top
- Email + Password fields
- `"Sign In"` gold button
- Error display for invalid credentials
- `"Forgot Password?"` link
- Toggle to `"Request Demo"` modal
- On success: redirect to `/dashboard` based on JWT role

---

#### 3. Dashboard Page (`/dashboard`) — Role-aware

This is the main authenticated view. Content adapts per user role.

**Sidebar Navigation**
- Collapsible sidebar with icons + labels
- Links: Dashboard · Forecast · Alerts · Inventory · Scenario Planner · Compliance · Integrations · Admin (Super Admin only)
- User avatar + role badge + logout at bottom

**Dashboard Header**
- Welcome message with user name + role
- Date + last sync timestamp
- Global search bar

**KPI Cards Row (top)**
- Forecast Accuracy: `94.3%`
- Inventory Value: `₹4.2 Cr`
- Auto-Replenished Orders: `1,284`
- Active Alerts: count with severity breakdown

**Alert Feed Panel**
- Color-coded alerts: CRITICAL (red), WARNING (amber), INFO (green)
- Alert format: severity badge + message + action button
- Filter by severity + mark as resolved

**Forecast Accuracy Chart**
- Line/bar chart (Recharts) showing model accuracy trend Jan–Dec
- Three model lines: LSTM (gold), XGBoost (green), Prophet (blue)

**SKU Status Table**
- Columns: SKU Name, Category, Stock Days, Status badge, Forecast Demand, Actions
- Status badges: Healthy (green), Reorder (amber), Critical (red)
- Inline action: `Approve Replenishment` button
- Filterable + sortable + paginated

**Autonomous Execution Panel**
- Count of auto-executed POs this week
- Auto-approval % vs human override %
- Audit trail link

---

#### 4. Alerts Page (`/alerts`)

- Full alert management view
- Filter bar: severity, category, date range, warehouse/location
- Alert cards with full detail + resolution workflow
- Bulk resolve action

---

#### 5. Forecast Page (`/forecast`)

- SKU-level demand forecast viewer
- Date range picker (1 day to 52 weeks horizon)
- Forecast chart with confidence band
- Edit mode: allow planner to override AI forecast with manual input + justification
- Export to CSV button

---

#### 6. Inventory Page (`/inventory`)

- Multi-location inventory table
- Expiry tracking: days-to-expiry heat column
- Slow-mover analysis view
- Transfer recommendation panel

---

#### 7. Scenario Planner Page (`/scenarios`)

- Create new scenario: name, type (promotion / disruption / new product / seasonal)
- Configure parameters: uplift %, affected SKUs, date range
- Run simulation → show AI-projected impact (chart + table)
- Save / compare scenarios

---

#### 8. Admin Page (`/admin`) — Super Admin only

- User management table: invite, edit role, deactivate
- Tenant configuration panel
- SSO + MFA settings
- Integration connection status
- AI model management: retrain trigger, model accuracy log

---

### Reusable UI Components

Build these as atomic components:

```
<Button variant="gold|outline|ghost|danger" size="sm|md|lg" />
<Badge variant="ok|warn|risk|info|muted" />
<Card className="..." />
<Modal isOpen onClose title>...</Modal>
<Toast message severity duration />
<Input label placeholder error />
<Select label options />
<KPICard value label subtext trend />
<AlertItem severity title message timestamp onResolve />
<StepAccordion steps activeIndex onSelect />
<RoleCard icon title dept desc permissions[] />
<FeatureCard number title desc />
<ComplianceBadge label icon />
<MiniBarChart data color />
<AccuracyTrendChart data />
```

---

## 🔧 Backend — Node.js

### Tech Stack
- **Node.js 20+** with **Express.js**
- **TypeScript** (recommended) or plain JS
- **PostgreSQL** via **Prisma ORM**
- **Redis** for session caching and rate limiting
- **JSON Web Tokens (JWT)** for auth (access + refresh token pattern)
- **bcrypt** for password hashing
- **Zod** for request validation
- **Winston** for structured logging
- **node-cron** for scheduled jobs (forecast retraining simulation, alert checks)
- **Multer** for file uploads (CSV import)
- **Socket.io** for real-time alert push (optional but recommended)

---

### Project Structure
```
src/
├── config/            # env, database, redis, logger
├── middleware/        # auth, rbac, rateLimiter, errorHandler, requestLogger
├── modules/
│   ├── auth/          # routes, controller, service, schema
│   ├── users/
│   ├── tenants/
│   ├── forecast/
│   ├── inventory/
│   ├── alerts/
│   ├── replenishment/
│   ├── scenarios/
│   ├── integrations/
│   ├── audit/
│   └── admin/
├── jobs/              # cron jobs (forecastJob, alertCheckJob, modelRetrainJob)
├── utils/             # response, pagination, dateUtils
└── types/             # global TypeScript types
```

---

### Database Schema (Prisma)

Design the following models:

```prisma
model Tenant {
  id           String   @id @default(cuid())
  name         String
  industry     Industry
  ssoConfig    Json?
  mfaRequired  Boolean  @default(true)
  dataRegion   String
  users        User[]
  skus         SKU[]
  warehouses   Warehouse[]
  createdAt    DateTime @default(now())
}

model User {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String
  firstName  String
  lastName   String
  role       Role
  department String?
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  isActive   Boolean  @default(true)
  lastLogin  DateTime?
  auditLogs  AuditLog[]
  createdAt  DateTime @default(now())
}

model SKU {
  id           String   @id @default(cuid())
  code         String
  name         String
  category     String
  unit         String
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  inventory    Inventory[]
  forecasts    Forecast[]
  alerts       Alert[]
}

model Inventory {
  id            String    @id @default(cuid())
  skuId         String
  sku           SKU       @relation(fields: [skuId], references: [id])
  warehouseId   String
  warehouse     Warehouse @relation(fields: [warehouseId], references: [id])
  quantity      Float
  stockDays     Float
  expiryDate    DateTime?
  batchNumber   String?
  updatedAt     DateTime  @updatedAt
}

model Forecast {
  id           String   @id @default(cuid())
  skuId        String
  sku          SKU      @relation(fields: [skuId], references: [id])
  warehouseId  String
  forecastDate DateTime
  horizon      Int      // days
  demandValue  Float
  confidence   Float    // 0-1
  modelUsed    String   // LSTM | XGBoost | Prophet | Ensemble
  isOverridden Boolean  @default(false)
  overrideVal  Float?
  overrideBy   String?
  overrideNote String?
  createdAt    DateTime @default(now())
}

model Alert {
  id           String      @id @default(cuid())
  skuId        String?
  sku          SKU?        @relation(fields: [skuId], references: [id])
  warehouseId  String?
  severity     Severity    // CRITICAL | WARNING | INFO
  category     AlertCategory
  title        String
  message      String
  isResolved   Boolean     @default(false)
  resolvedBy   String?
  resolvedAt   DateTime?
  createdAt    DateTime    @default(now())
}

model ReplenishmentOrder {
  id           String   @id @default(cuid())
  skuId        String
  warehouseId  String
  quantity     Float
  isAutomatic  Boolean
  status       OrderStatus // PENDING | AUTO_APPROVED | HUMAN_APPROVED | OVERRIDDEN | DISPATCHED
  approvedBy   String?
  erpRef       String?   // SAP/Oracle PO reference
  createdAt    DateTime  @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String
  metadata  Json?
  ip        String?
  createdAt DateTime @default(now())
}

model Warehouse {
  id        String      @id @default(cuid())
  name      String
  location  String
  region    String
  tenantId  String
  tenant    Tenant      @relation(fields: [tenantId], references: [id])
  inventory Inventory[]
}

enum Role {
  RETAILER
  DISTRIBUTOR_MANAGER
  SUPPLY_PLANNER
  PRODUCTION_MANAGER
  FINANCE
  SUPER_ADMIN
}

enum Industry {
  PHARMA
  FNB
  FMCG
}

enum Severity {
  CRITICAL
  WARNING
  INFO
}

enum AlertCategory {
  STOCKOUT_RISK
  EXPIRY
  OVERSTOCK
  SUPPLIER_DELAY
  AI_PLAN_READY
}

enum OrderStatus {
  PENDING
  AUTO_APPROVED
  HUMAN_APPROVED
  OVERRIDDEN
  DISPATCHED
}
```

---

### API Routes

#### Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/login` | Email + password → JWT access + refresh token |
| POST | `/refresh` | Rotate refresh token |
| POST | `/logout` | Invalidate refresh token |
| POST | `/demo-request` | Submit demo request form (public) |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Verify token + set new password |

#### Users (`/api/users`) — Auth required
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me` | Current user profile |
| PATCH | `/me` | Update profile |
| GET | `/` | List users in tenant (Admin+) |
| POST | `/invite` | Invite new user (Super Admin) |
| PATCH | `/:id/role` | Change user role (Super Admin) |
| PATCH | `/:id/deactivate` | Deactivate user (Super Admin) |

#### Forecasts (`/api/forecasts`) — Auth required
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List forecasts (filter: skuId, warehouseId, horizon, date) |
| GET | `/:skuId` | Forecast detail for SKU |
| PATCH | `/:id/override` | Manual override (Supply Planner+) |
| POST | `/trigger-retrain` | Trigger model retrain job (Super Admin) |

#### Inventory (`/api/inventory`) — Auth required
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Inventory across all warehouses |
| GET | `/expiry-risk` | Items expiring within N days |
| GET | `/slow-movers` | Slow-moving SKU report |
| GET | `/:skuId` | Inventory per SKU across locations |

#### Alerts (`/api/alerts`) — Auth required
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List alerts (filter: severity, category, resolved) |
| PATCH | `/:id/resolve` | Resolve alert |
| POST | `/bulk-resolve` | Bulk resolve |

#### Replenishment (`/api/replenishment`) — Auth required
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Replenishment orders list |
| PATCH | `/:id/approve` | Human approve order |
| PATCH | `/:id/override` | Override auto-approved order |
| GET | `/audit-trail` | Autonomous action audit log |

#### Scenarios (`/api/scenarios`) — Supply Planner+
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List saved scenarios |
| POST | `/` | Create scenario |
| POST | `/:id/run` | Run simulation |
| GET | `/:id/results` | Get simulation results |
| DELETE | `/:id` | Delete scenario |

#### Dashboard (`/api/dashboard`) — Auth required
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/kpis` | Top-line KPI metrics for current user's scope |
| GET | `/accuracy-trend` | Model accuracy chart data |
| GET | `/sku-status` | SKU status summary table |

#### Admin (`/api/admin`) — Super Admin only
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/tenants` | All tenants |
| PATCH | `/tenants/:id` | Update tenant config |
| GET | `/model-logs` | AI model training history |
| GET | `/audit-logs` | Full system audit log |
| GET | `/integrations` | Integration connection status |

---

### Middleware

```javascript
// 1. Auth middleware — verifies JWT, attaches req.user
// 2. RBAC middleware — checks role permissions per route
// 3. Tenant scope — enforces data isolation per tenantId
// 4. Rate limiter — Redis-backed, per IP + per user
// 5. Audit logger — writes to AuditLog on mutating requests
// 6. Error handler — standardised error response format
// 7. Request logger — Winston structured logs
```

### RBAC Permission Matrix

| Route Category | Retailer | Distributor | Planner | Production | Finance | Super Admin |
|----------------|----------|-------------|---------|------------|---------|-------------|
| Dashboard KPIs | Own store | Assigned stores | All | All | All (financial) | All |
| Forecast view | ❌ | Read | Read + Override | Read | Read | Full |
| Inventory | Own store | Assigned | All | All | All | All |
| Alerts | Own | Assigned | All | All | All | All |
| Replenishment approve | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Scenario planner | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Admin panel | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### Background Jobs (node-cron)

```javascript
// forecastJob     — runs every 6 hours: pull latest POS data, regenerate forecasts
// alertCheckJob   — runs every 15 min: check inventory vs. thresholds, create alerts
// autoReplenish   — runs every 1 hour: evaluate replenishment rules, fire auto-POs
// modelRetrain    — runs weekly: trigger model accuracy recalculation
// expiryCheck     — runs daily at 06:00: flag items expiring within 7/14/30 days
```

---

### Response Format (standardised)

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 142
  },
  "error": null
}
```

Error response:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You do not have permission to perform this action."
  }
}
```

---

## 🔐 Security Requirements

- All passwords hashed with **bcrypt** (salt rounds: 12)
- JWT access tokens expire in **8 hours**; refresh tokens expire in **30 days**
- Refresh tokens stored in **Redis** (revokable)
- CORS configured with explicit allowed origins
- Helmet.js for HTTP security headers
- SQL injection protection via Prisma parameterized queries
- XSS protection on all user inputs via Zod schemas
- Rate limiting: 100 req/15 min per IP (unauthenticated), 1000/15 min (authenticated)
- All mutating actions written to `AuditLog` (21 CFR Part 11 compliance)
- Multi-tenant data isolation enforced at ORM layer (all queries scoped by `tenantId`)

---

## 🚀 Development Setup

### Environment Variables (`.env`)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/quantum_optimizer

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRY=8h
JWT_REFRESH_EXPIRY=30d

# Frontend
FRONTEND_URL=http://localhost:5173

# Email (for demo requests / password reset)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<pass>
FROM_EMAIL=noreply@forgequantum.com
```

### Scripts
```json
{
  "dev": "nodemon src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "db:migrate": "prisma migrate dev",
  "db:seed": "ts-node prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

### Seed Data
Create seed script that generates:
- 1 tenant per industry (Pharma, F&B, FMCG)
- One user per role per tenant
- 50 SKUs per tenant with realistic names
- Inventory records across 3 warehouses per tenant
- 14 days of historical forecasts
- Sample alerts (3 CRITICAL, 7 WARNING, 10 INFO)
- Sample replenishment orders (mix of auto/manual)

---

## ✅ Acceptance Criteria

- [ ] Landing page pixel-accurate to the original HTML design, fully responsive
- [ ] Authentication flow: login → role-based dashboard redirect
- [ ] Dashboard KPIs and charts populated from API (not hardcoded)
- [ ] Role-based access enforced both in UI (hide/show) and API (403 on violation)
- [ ] Forecast override by Supply Planner writes to DB and logs to audit trail
- [ ] Alert resolution flow: mark resolved → disappears from active list
- [ ] Autonomous replenishment approval/override flow functional
- [ ] Scenario planner: create → run → view results
- [ ] Super Admin: invite user, change role, view full audit log
- [ ] All API responses use standardised format
- [ ] Real-time alert push via Socket.io (new critical alert appears without refresh)
- [ ] Mobile responsive (sidebar collapses, nav hamburger, cards stack)
- [ ] 21 CFR Part 11: every mutating API action appended to AuditLog

---

*Forge Quantum Solution — Quantum Optimizer Full-Stack Specification v1.0*
