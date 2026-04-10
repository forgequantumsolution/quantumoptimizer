import { Router } from 'express';
import type { Request, Response } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

collectDefaultMetrics({ prefix: 'qo_' });

export const httpRequestsTotal = new Counter({
  name: 'qo_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'qo_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const authAttemptsTotal = new Counter({
  name: 'qo_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['result'],
});

export const rateLimitHitsTotal = new Counter({
  name: 'qo_rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['endpoint'],
});

const router = Router();

/** GET /metrics — Prometheus scrape endpoint (internal only, not exposed publicly) */
router.get('/', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
