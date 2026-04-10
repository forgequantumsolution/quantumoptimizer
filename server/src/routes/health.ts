import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';

const router = Router();

/** GET /health — liveness probe (is the process running?) */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'local',
    uptime: Math.round(process.uptime()),
  });
});

/** GET /health/ready — readiness probe (are all dependencies reachable?) */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency_ms?: number; error?: string }> = {};
  let overall: 'ok' | 'degraded' | 'down' = 'ok';

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency_ms: Date.now() - dbStart };
  } catch (err) {
    checks.database = { status: 'error', error: 'unreachable' };
    overall = 'down';
  }

  const httpStatus = overall === 'down' ? 503 : 200;
  res.status(httpStatus).json({
    status: overall,
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
