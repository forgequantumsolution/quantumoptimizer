import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';
import { logger } from '../../config/logger';
import {
  EDITOR_ROLES, APPROVER_ROLES,
  listPlans, createPlan, getPlanWithCells,
  upsertCells, submitPlan, approvePlan, rejectPlan,
  getCellComments, addCellComment,
  findAnalogueSKUs, generateWeekBuckets,
} from './consensus.service';

// ─── Plan list & create ───────────────────────────────────────────────────────

export async function getPlans(req: AuthRequest, res: Response) {
  try {
    const { status } = req.query as { status?: string };
    const plans = await listPlans(req.user!.tenantId, status);
    return successResponse(res, plans);
  } catch (err) {
    logger.error('getPlans error', err);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch plans', 500);
  }
}

export async function postCreatePlan(req: AuthRequest, res: Response) {
  try {
    if (!EDITOR_ROLES.includes(req.user!.role)) {
      return errorResponse(res, 'FORBIDDEN', 'Only Supply Planners can create plans', 403);
    }
    const { name, periodStart, periodEnd, baselineId, locationId } = req.body as {
      name: string;
      periodStart: string;
      periodEnd: string;
      baselineId?: string;
      locationId: string;
    };
    if (!name?.trim() || !periodStart || !periodEnd || !locationId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'name, periodStart, periodEnd and locationId are required');
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Invalid period range');
    }

    const plan = await createPlan(req.user!.tenantId, req.user!.id, {
      name: name.trim(),
      periodStart: start,
      periodEnd: end,
      baselineId,
      locationId,
    });
    return successResponse(res, plan, undefined, 201);
  } catch (err) {
    logger.error('postCreatePlan error', err);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to create plan', 500);
  }
}

// ─── Plan detail ──────────────────────────────────────────────────────────────

export async function getPlan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { itemId, period } = req.query as { itemId?: string; period?: string };
    const result = await getPlanWithCells(id, req.user!.tenantId, itemId, period);
    if (!result) return errorResponse(res, 'NOT_FOUND', 'Plan not found', 404);
    return successResponse(res, result);
  } catch (err) {
    logger.error('getPlan error', err);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch plan', 500);
  }
}

// ─── Week buckets preview ─────────────────────────────────────────────────────

export async function getWeekBuckets(req: AuthRequest, res: Response) {
  try {
    const { periodStart, periodEnd } = req.query as { periodStart: string; periodEnd: string };
    if (!periodStart || !periodEnd) {
      return errorResponse(res, 'VALIDATION_ERROR', 'periodStart and periodEnd required');
    }
    const buckets = generateWeekBuckets(new Date(periodStart), new Date(periodEnd));
    return successResponse(res, buckets);
  } catch (err) {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to generate buckets', 500);
  }
}

// ─── Cell editing ─────────────────────────────────────────────────────────────

export async function patchCells(req: AuthRequest, res: Response) {
  try {
    if (!EDITOR_ROLES.includes(req.user!.role)) {
      return errorResponse(res, 'FORBIDDEN', 'Only Supply Planners can edit cells', 403);
    }
    const { id } = req.params as { id: string };
    const { edits } = req.body as { edits: { cellId: string; consensusValue: number }[] };
    if (!Array.isArray(edits) || edits.length === 0) {
      return errorResponse(res, 'VALIDATION_ERROR', 'edits array is required');
    }
    for (const e of edits) {
      if (!e.cellId || typeof e.consensusValue !== 'number' || e.consensusValue < 0) {
        return errorResponse(res, 'VALIDATION_ERROR', 'Each edit needs cellId and non-negative consensusValue');
      }
    }
    const result = await upsertCells(id, req.user!.tenantId, req.user!.id, edits);
    return successResponse(res, result);
  } catch (err: any) {
    if (err.message?.includes('DRAFT')) return errorResponse(res, 'CONFLICT', err.message);
    logger.error('patchCells error', err);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to save cells', 500);
  }
}

// ─── Approval workflow ────────────────────────────────────────────────────────

export async function postSubmit(req: AuthRequest, res: Response) {
  try {
    if (!EDITOR_ROLES.includes(req.user!.role)) {
      return errorResponse(res, 'FORBIDDEN', 'Only Supply Planners can submit plans', 403);
    }
    const { id } = req.params as { id: string };
    const u = req.user!;
    const plan = await submitPlan(id, u.tenantId, u.id, u.email, `${(u as any).firstName || ''} ${(u as any).lastName || ''}`.trim() || u.email);
    return successResponse(res, plan);
  } catch (err: any) {
    if (err.message?.includes('DRAFT')) return errorResponse(res, 'CONFLICT', err.message);
    logger.error('postSubmit error', err);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to submit plan', 500);
  }
}

export async function postApprove(req: AuthRequest, res: Response) {
  try {
    if (!APPROVER_ROLES.includes(req.user!.role)) {
      return errorResponse(res, 'FORBIDDEN', 'Only Finance approvers can approve plans', 403);
    }
    const { id } = req.params as { id: string };
    const { note } = req.body as { note?: string };
    const u = req.user!;
    const plan = await approvePlan(id, u.tenantId, u.id, u.email, `${(u as any).firstName || ''} ${(u as any).lastName || ''}`.trim() || u.email, note);
    return successResponse(res, plan);
  } catch (err: any) {
    if (err.message?.includes('SUBMITTED')) return errorResponse(res, 'CONFLICT', err.message);
    logger.error('postApprove error', err);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to approve plan', 500);
  }
}

export async function postReject(req: AuthRequest, res: Response) {
  try {
    if (!APPROVER_ROLES.includes(req.user!.role)) {
      return errorResponse(res, 'FORBIDDEN', 'Only Finance approvers can reject plans', 403);
    }
    const { id } = req.params as { id: string };
    const { note } = req.body as { note?: string };
    if (!note?.trim()) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Rejection note is required');
    }
    const u = req.user!;
    const plan = await rejectPlan(id, u.tenantId, u.id, u.email, `${(u as any).firstName || ''} ${(u as any).lastName || ''}`.trim() || u.email, note.trim());
    return successResponse(res, plan);
  } catch (err: any) {
    if (err.message?.includes('SUBMITTED')) return errorResponse(res, 'CONFLICT', err.message);
    logger.error('postReject error', err);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to reject plan', 500);
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getCellCommentsHandler(req: AuthRequest, res: Response) {
  try {
    const { cellId } = req.params as { cellId: string };
    const comments = await getCellComments(cellId);
    return successResponse(res, comments);
  } catch (err) {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch comments', 500);
  }
}

export async function postCellComment(req: AuthRequest, res: Response) {
  try {
    const { cellId } = req.params as { cellId: string };
    const { body } = req.body as { body: string };
    const u = req.user!;
    const comment = await addCellComment(
      cellId, u.id, u.email,
      `${(u as any).firstName || ''} ${(u as any).lastName || ''}`.trim() || u.email,
      body,
    );
    return successResponse(res, comment, undefined, 201);
  } catch (err: any) {
    if (err.message?.includes('required')) return errorResponse(res, 'VALIDATION_ERROR', err.message);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to add comment', 500);
  }
}

// ─── NPI analogues ────────────────────────────────────────────────────────────

export async function getAnalogues(req: AuthRequest, res: Response) {
  try {
    const { category, excludeItemId } = req.query as { category?: string; excludeItemId?: string };
    if (!category) return errorResponse(res, 'VALIDATION_ERROR', 'category is required');
    const analogues = await findAnalogueSKUs(req.user!.tenantId, category, excludeItemId);
    return successResponse(res, analogues);
  } catch (err) {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to find analogues', 500);
  }
}
