import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { errorResponse } from '../utils/response';
import { securityLog } from '../config/logger';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; tenantId: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return errorResponse(res, 'UNAUTHORIZED', 'No token provided', 401);
  }
  const token = header.slice(7);
  try {
    // Explicit algorithm whitelist prevents 'none' algorithm attack
    const payload = jwt.verify(token, env.jwt.accessSecret, {
      algorithms: [env.jwt.algorithm],
    }) as AuthRequest['user'];
    req.user = payload;
    next();
  } catch (err) {
    const reason = err instanceof jwt.TokenExpiredError ? 'token_expired' : 'token_invalid';
    securityLog.tokenInvalid(req.ip || 'unknown', reason);
    return errorResponse(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'FORBIDDEN', 'You do not have permission to perform this action.', 403);
    }
    next();
  };
}
