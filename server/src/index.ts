import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';

dotenv.config();

import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter';

// Feature routes
import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import alertsRoutes from './modules/alerts/alerts.routes';
import usersRoutes from './modules/users/users.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import forecastRoutes from './modules/forecast/forecast.routes';
import scenariosRoutes from './modules/scenarios/scenarios.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import consensusRoutes from './modules/consensus/consensus.routes';
import supplyRoutes from './modules/supply/supply.routes';

// Event bus wiring
import { eventBus } from './events/eventBus';
import { generateSupplyPlan } from './modules/supply/supply.service';

// Infrastructure routes
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';

const app = express();

// ─── 1. Security headers (Helmet with hardened CSP) ───────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", 'data:', 'https:'],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'"],
      objectSrc:      ["'none'"],
      frameAncestors: ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// Additional headers Helmet doesn't cover
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  next();
});

// ─── 2. Request ID (must be early so all logs carry it) ───────────────────────
app.use(requestIdMiddleware);

// ─── 3. CORS — strict allowlist, no wildcard ──────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = env.frontendUrl.split(',').map((u) => u.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400,
}));

// ─── 4. Body parsing with size limits ─────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── 5. HTTP request logging (structured, no sensitive headers) ───────────────
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (msg) => logger.info(msg.trim(), { type: 'http' }) },
  skip: (req) => req.path === '/health' || req.path === '/metrics',
}));

// ─── 6. Global API rate limiter ───────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── 7. Infrastructure endpoints (no auth required, before /api routes) ───────
app.use('/health', healthRoutes);
// Metrics endpoint — in production, restrict to internal network via nginx
app.use('/metrics', metricsRoutes);

// ─── 8. Auth routes with strict rate limit ────────────────────────────────────
app.use('/api/auth', authRateLimiter, authRoutes);

// ─── 9. Feature routes (all protected by authenticate() in their own routers) ─
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/alerts',       alertsRoutes);
app.use('/api/users',        usersRoutes);
app.use('/api/inventory',    inventoryRoutes);
app.use('/api/forecasts',    forecastRoutes);
app.use('/api/scenarios',    scenariosRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/consensus',    consensusRoutes);
app.use('/api/supply',       supplyRoutes);

// ─── 10. 404 handler ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// ─── 11. Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ─── Event bus listeners ──────────────────────────────────────────────────────
// When a demand plan is approved, auto-generate a supply plan
eventBus.onPlanApproved(async (event) => {
  logger.info('[EventBus] PlanApproved received — generating supply plan', { planId: event.planId });
  try {
    await generateSupplyPlan(event.tenantId, event.planId, event.approvedBy);
    logger.info('[EventBus] Supply plan auto-generated', { demandPlanId: event.planId });
  } catch (err: any) {
    logger.error('[EventBus] Failed to auto-generate supply plan', { error: err.message });
  }
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const server = app.listen(env.port, () => {
  logger.info('Quantum Optimizer API started', {
    port: env.port,
    env: env.nodeEnv,
    version: process.env.APP_VERSION || 'local',
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — graceful shutdown');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});

export default app;
