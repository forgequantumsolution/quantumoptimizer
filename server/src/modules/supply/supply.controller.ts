import { Request, Response } from 'express';
import {
  listSupplyPlans,
  getSupplyPlanDetail,
  generateSupplyPlan,
  updateSupplyRows,
  releaseSupplyPlan,
  listWorkCenters,
  listProductionOrders,
  updateProductionOrderStatus,
  rescheduleProductionOrder,
  listReplenishmentOrders,
  approveReplenishmentOrder,
  dispatchReplenishmentOrder,
  getCapacityUtilisation,
  SUPPLY_PLANNER_ROLES,
  SUPPLY_APPROVER_ROLES,
} from './supply.service';
import { successResponse, errorResponse } from '../../utils/response';

// ─── Supply Plans ─────────────────────────────────────────────────────────────

export async function getSupplyPlans(req: Request, res: Response) {
  try {
    const { status } = req.query as { status?: string };
    const plans = await listSupplyPlans(req.user!.tenantId, status);
    return successResponse(res, plans);
  } catch (err: any) {
    return errorResponse(res, 'FETCH_FAILED', err.message, 500);
  }
}

export async function postGeneratePlan(req: Request, res: Response) {
  if (!SUPPLY_PLANNER_ROLES.includes(req.user!.role)) {
    return errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', 403);
  }
  const { demandPlanId, name } = req.body as { demandPlanId: string; name?: string };
  if (!demandPlanId) return errorResponse(res, 'VALIDATION', 'demandPlanId is required', 400);
  try {
    const plan = await generateSupplyPlan(req.user!.tenantId, demandPlanId, req.user!.id, name);
    return successResponse(res, plan, 201);
  } catch (err: any) {
    return errorResponse(res, 'GENERATE_FAILED', err.message, 500);
  }
}

export async function getSupplyPlan(req: Request, res: Response) {
  try {
    const plan = await getSupplyPlanDetail(req.params.id, req.user!.tenantId);
    return successResponse(res, plan);
  } catch (err: any) {
    const status = err.code === 'NOT_FOUND' ? 404 : 500;
    return errorResponse(res, err.code ?? 'FETCH_FAILED', err.message, status);
  }
}

export async function patchSupplyRows(req: Request, res: Response) {
  if (!SUPPLY_PLANNER_ROLES.includes(req.user!.role)) {
    return errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', 403);
  }
  const { edits } = req.body as { edits: { rowId: string; plannedProduction?: number; plannedPurchase?: number }[] };
  if (!Array.isArray(edits) || edits.length === 0) {
    return errorResponse(res, 'VALIDATION', 'edits array is required', 400);
  }
  try {
    const result = await updateSupplyRows(req.params.id, req.user!.tenantId, edits, req.user!.id);
    return successResponse(res, result);
  } catch (err: any) {
    const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'LOCKED' ? 409 : 500;
    return errorResponse(res, err.code ?? 'UPDATE_FAILED', err.message, status);
  }
}

export async function postReleasePlan(req: Request, res: Response) {
  if (!SUPPLY_APPROVER_ROLES.includes(req.user!.role)) {
    return errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', 403);
  }
  try {
    const plan = await releaseSupplyPlan(req.params.id, req.user!.tenantId, req.user!.id);
    return successResponse(res, plan);
  } catch (err: any) {
    const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'INVALID_STATUS' ? 409 : 500;
    return errorResponse(res, err.code ?? 'RELEASE_FAILED', err.message, status);
  }
}

// ─── Work Centers ─────────────────────────────────────────────────────────────

export async function getWorkCenters(req: Request, res: Response) {
  try {
    const wcs = await listWorkCenters(req.user!.tenantId);
    return successResponse(res, wcs);
  } catch (err: any) {
    return errorResponse(res, 'FETCH_FAILED', err.message, 500);
  }
}

export async function getCapacity(req: Request, res: Response) {
  const { week } = req.query as { week?: string };
  try {
    const data = await getCapacityUtilisation(req.user!.tenantId, week ?? '');
    return successResponse(res, data);
  } catch (err: any) {
    return errorResponse(res, 'FETCH_FAILED', err.message, 500);
  }
}

// ─── Production Orders ────────────────────────────────────────────────────────

export async function getProductionOrders(req: Request, res: Response) {
  const { supplyPlanId } = req.query as { supplyPlanId?: string };
  try {
    const orders = await listProductionOrders(req.user!.tenantId, supplyPlanId);
    return successResponse(res, orders);
  } catch (err: any) {
    return errorResponse(res, 'FETCH_FAILED', err.message, 500);
  }
}

export async function patchProductionStatus(req: Request, res: Response) {
  if (!SUPPLY_PLANNER_ROLES.includes(req.user!.role)) {
    return errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', 403);
  }
  const { status } = req.body as { status: string };
  if (!status) return errorResponse(res, 'VALIDATION', 'status is required', 400);
  try {
    const order = await updateProductionOrderStatus(req.params.orderId, req.user!.tenantId, status);
    return successResponse(res, order);
  } catch (err: any) {
    return errorResponse(res, 'UPDATE_FAILED', err.message, 500);
  }
}

export async function patchReschedule(req: Request, res: Response) {
  if (!SUPPLY_PLANNER_ROLES.includes(req.user!.role)) {
    return errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', 403);
  }
  const { startDate, endDate } = req.body as { startDate: string; endDate: string };
  if (!startDate || !endDate) return errorResponse(res, 'VALIDATION', 'startDate and endDate are required', 400);
  try {
    const order = await rescheduleProductionOrder(
      req.params.orderId,
      req.user!.tenantId,
      new Date(startDate),
      new Date(endDate),
    );
    return successResponse(res, order);
  } catch (err: any) {
    return errorResponse(res, 'RESCHEDULE_FAILED', err.message, 500);
  }
}

// ─── Replenishment Orders ─────────────────────────────────────────────────────

export async function getReplenishmentOrders(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  try {
    const orders = await listReplenishmentOrders(req.user!.tenantId, status);
    return successResponse(res, orders);
  } catch (err: any) {
    return errorResponse(res, 'FETCH_FAILED', err.message, 500);
  }
}

export async function postApproveReplenishment(req: Request, res: Response) {
  if (!SUPPLY_APPROVER_ROLES.includes(req.user!.role)) {
    return errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', 403);
  }
  try {
    const order = await approveReplenishmentOrder(req.params.orderId, req.user!.tenantId, req.user!.id);
    return successResponse(res, order);
  } catch (err: any) {
    return errorResponse(res, 'APPROVE_FAILED', err.message, 500);
  }
}

export async function postDispatchReplenishment(req: Request, res: Response) {
  if (!SUPPLY_APPROVER_ROLES.includes(req.user!.role)) {
    return errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', 403);
  }
  const { erpRef } = req.body as { erpRef?: string };
  try {
    const order = await dispatchReplenishmentOrder(req.params.orderId, req.user!.tenantId, erpRef);
    return successResponse(res, order);
  } catch (err: any) {
    return errorResponse(res, 'DISPATCH_FAILED', err.message, 500);
  }
}
