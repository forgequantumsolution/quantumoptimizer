import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';

export async function getInventory(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const inventory = await prisma.inventory.findMany({
      where: { sku: { tenantId } },
      include: { sku: { select: { name: true, category: true, code: true } }, warehouse: { select: { name: true, location: true } } },
      take: 100,
    });
    return successResponse(res, inventory);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch inventory', 500);
  }
}

export async function getExpiryRisk(req: AuthRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const items = await prisma.inventory.findMany({
      where: { expiryDate: { lte: cutoff, gte: new Date() }, sku: { tenantId: req.user!.tenantId } },
      include: { sku: { select: { name: true, category: true } }, warehouse: { select: { name: true } } },
    });
    return successResponse(res, items);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch expiry risk', 500);
  }
}
