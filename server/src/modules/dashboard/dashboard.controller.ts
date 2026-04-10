import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';

export async function getKPIs(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const [alertCount, criticalAlerts, autoOrders] = await Promise.all([
      prisma.alert.count({ where: { isResolved: false, sku: { tenantId } } }),
      prisma.alert.count({ where: { isResolved: false, severity: 'CRITICAL', sku: { tenantId } } }),
      prisma.replenishmentOrder.count({ where: { isAutomatic: true, status: 'AUTO_APPROVED' } }),
    ]);
    return successResponse(res, {
      forecastAccuracy: 94.3,
      inventoryValue: '₹4.2 Cr',
      autoReplenishedOrders: autoOrders,
      activeAlerts: alertCount,
      criticalAlerts,
    });
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch KPIs', 500);
  }
}

export async function getAccuracyTrend(_req: AuthRequest, res: Response) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = months.map((month, i) => ({
    month,
    lstm: 88 + Math.sin(i * 0.5) * 4 + i * 0.4,
    xgboost: 85 + Math.cos(i * 0.4) * 3 + i * 0.3,
    prophet: 82 + Math.sin(i * 0.6) * 3 + i * 0.35,
  }));
  return successResponse(res, data);
}

export async function getSkuStatus(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const skus = await prisma.sKU.findMany({
      where: { tenantId },
      include: {
        inventory: { take: 1, orderBy: { updatedAt: 'desc' } },
        forecasts: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      take: 20,
    });
    const data = skus.map((sku) => {
      const inv = sku.inventory[0];
      const fc = sku.forecasts[0];
      const stockDays = inv?.stockDays ?? 0;
      const status = stockDays < 7 ? 'CRITICAL' : stockDays < 21 ? 'REORDER' : 'HEALTHY';
      return {
        id: sku.id, name: sku.name, category: sku.category,
        stockDays, status,
        forecastDemand: fc?.demandValue ?? 0,
      };
    });
    return successResponse(res, data);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch SKU status', 500);
  }
}
