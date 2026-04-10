import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { securityLog } from '../config/logger';
import { errorResponse } from '../utils/response';
import type { Request, Response } from 'express';

function rateLimitHandler(req: Request, res: Response) {
  securityLog.rateLimitHit(req.ip || 'unknown', req.path);
  res.setHeader('Retry-After', '60');
  errorResponse(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);
}

/** Strict limiter for authentication endpoints: 10 req/min per IP */
export const authRateLimiter = rateLimit({
  windowMs: env.rateLimits.authWindowMs,
  max: env.rateLimits.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: rateLimitHandler,
  skip: () => env.nodeEnv === 'test',
});

/** General API limiter: 1000 req/15min per IP */
export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimits.apiWindowMs,
  max: env.rateLimits.apiMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: rateLimitHandler,
  skip: () => env.nodeEnv === 'test',
});

/** Heavy operations: 30 req/min per IP */
export const heavyRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: rateLimitHandler,
  skip: () => env.nodeEnv === 'test',
});
