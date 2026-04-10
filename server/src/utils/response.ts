import { Response } from 'express';

export function successResponse(res: Response, data: unknown, meta?: object, status = 200) {
  return res.status(status).json({ success: true, data, meta: meta || null, error: null });
}

export function errorResponse(res: Response, code: string, message: string, status = 400) {
  return res.status(status).json({ success: false, data: null, error: { code, message } });
}
