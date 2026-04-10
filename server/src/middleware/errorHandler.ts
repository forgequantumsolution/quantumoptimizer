import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Global error handler.
 * Logs full context server-side; never exposes stack traces, file paths,
 * or DB errors to the client.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId || 'unknown';

  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    // Only log stacks in non-production to prevent info disclosure
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });

  if (res.headersSent) return;

  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      requestId,
    },
  });
}
