import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';

export async function getAlerts(req: AuthRequest, res: Response) {
  try {
    const severity = req.query.severity as string | undefined;
    const resolved = req.query.resolved as string | undefined;
    const where: Record<string, unknown> = {};
    if (severity) where.severity = severity;
    if (resolved !== undefined) where.isResolved = resolved === 'true';
    const alerts = await prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
    return successResponse(res, alerts);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch alerts', 500);
  }
}

export async function resolveAlert(req: AuthRequest, res: Response) {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id as string },
      data: { isResolved: true, resolvedBy: req.user!.id, resolvedAt: new Date() },
    });
    return successResponse(res, alert);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to resolve alert', 500);
  }
}
