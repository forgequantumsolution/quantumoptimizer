import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';

export async function getScenarios(req: AuthRequest, res: Response) {
  try {
    const scenarios = await prisma.scenario.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, scenarios);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch scenarios', 500);
  }
}

export async function createScenario(req: AuthRequest, res: Response) {
  try {
    const { name, type, parameters } = req.body;
    const scenario = await prisma.scenario.create({
      data: { name, type, parameters, tenantId: req.user!.tenantId, createdBy: req.user!.id },
    });
    return successResponse(res, scenario, undefined, 201);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to create scenario', 500);
  }
}

export async function runScenario(req: AuthRequest, res: Response) {
  try {
    const scenario = await prisma.scenario.findFirst({ where: { id: req.params.id as string, tenantId: req.user!.tenantId } });
    if (!scenario) return errorResponse(res, 'NOT_FOUND', 'Scenario not found', 404);
    const params = scenario.parameters as Record<string, unknown>;
    const uplift = (params.uplift as number) || 20;
    const results = {
      projectedDemandChange: `+${uplift}%`,
      estimatedRevenuImpact: `₹${(uplift * 12000).toLocaleString()}`,
      stockoutRisk: uplift > 30 ? 'HIGH' : 'MEDIUM',
      recommendedInventoryIncrease: `${Math.round(uplift * 1.5)}%`,
    };
    const updated = await prisma.scenario.update({ where: { id: req.params.id as string }, data: { results } });
    return successResponse(res, updated);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to run scenario', 500);
  }
}
