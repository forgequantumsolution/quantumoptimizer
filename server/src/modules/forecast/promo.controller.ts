import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';

export async function getPromos(req: AuthRequest, res: Response) {
  try {
    const promos = await prisma.promoCalendar.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { startDate: 'desc' },
      take: 50,
    });
    return successResponse(res, promos);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch promos', 500);
  }
}

export async function createPromo(req: AuthRequest, res: Response) {
  try {
    const { name, startDate, endDate, upliftPct, itemId, locationId, channel } = req.body as {
      name: string; startDate: string; endDate: string;
      upliftPct?: number; itemId?: string; locationId?: string; channel?: string;
    };
    if (!name || !startDate || !endDate) {
      return errorResponse(res, 'VALIDATION_ERROR', 'name, startDate and endDate are required');
    }
    const promo = await prisma.promoCalendar.create({
      data: {
        tenantId: req.user!.tenantId,
        name, itemId, locationId, channel: channel || 'ALL',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        upliftPct: upliftPct || 0,
        createdBy: req.user!.id,
      },
    });
    return successResponse(res, promo, undefined, 201);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to create promo', 500);
  }
}
