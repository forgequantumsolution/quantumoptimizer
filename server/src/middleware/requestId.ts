import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Attaches a UUID v4 X-Request-ID to every request and response.
 * Downstream code logs this ID so requests can be correlated across services.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}
