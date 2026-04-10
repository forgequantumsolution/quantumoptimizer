# Quantum Optimizer — Forge Quantum Solution

> Enterprise-grade AI-driven Demand Planning & Supply Chain Forecasting SaaS platform for Pharma, F&B, and FMCG industries.

---

## Project Structure

```
Quantum Optimizer/
├── client/          # React 18 + Tailwind CSS frontend (Vite)
├── server/          # Node.js + Express + TypeScript backend
├── quantum-optimizer.html         # Original HTML design reference
└── quantum-optimizer-prompt.md    # Full-stack specification
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Frontend

```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

### Backend

```bash
cd server
npm install
cp .env .env.local   # configure DATABASE_URL
npx prisma migrate dev
npm run db:seed      # seed demo data
npm run dev          # http://localhost:3001
```

---

## Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@pharma.com | demo1234 | Super Admin |
| planner@pharma.com | demo1234 | Supply Planner |
| retailer@pharma.com | demo1234 | Retailer |
| distributor@pharma.com | demo1234 | Distributor Manager |
| finance@pharma.com | demo1234 | Finance |
| admin@fnb.com | demo1234 | Super Admin (F&B) |
| admin@fmcg.com | demo1234 | Super Admin (FMCG) |

---

## Tech Stack

### Frontend
| Library | Purpose |
|---------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS 3 | Styling with custom brand tokens |
| React Router v6 | Client-side routing |
| TanStack Query | Server state management |
| Zustand | Global client state (auth, toasts) |
| Recharts | Data visualisation |
| Axios | HTTP client |

### Backend
| Library | Purpose |
|---------|---------|
| Express.js | HTTP server |
| TypeScript | Type safety |
| Prisma ORM | Database access (PostgreSQL) |
| JWT | Authentication (access + refresh) |
| bcrypt | Password hashing |
| Winston | Structured logging |
| Helmet + CORS | Security headers |

---

## Pages

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing Page | Public |
| `/signin` | Sign In | Public |
| `/dashboard` | Dashboard | All roles |
| `/forecast` | Demand Forecast | All roles |
| `/alerts` | Alert Management | All roles |
| `/inventory` | Inventory | All roles |
| `/scenarios` | Scenario Planner | Supply Planner+ |
| `/admin` | Administration | Super Admin |

---

## API Endpoints

```
POST   /api/auth/login
POST   /api/auth/demo-request

GET    /api/dashboard/kpis
GET    /api/dashboard/accuracy-trend
GET    /api/dashboard/sku-status

GET    /api/alerts
PATCH  /api/alerts/:id/resolve

GET    /api/forecasts
PATCH  /api/forecasts/:id/override

GET    /api/inventory
GET    /api/inventory/expiry-risk

GET    /api/scenarios
POST   /api/scenarios
POST   /api/scenarios/:id/run

GET    /api/users/me
GET    /api/users
```

---

*Forge Quantum Solution — Quantum Optimizer v1.0*
# quantumoptimizer
