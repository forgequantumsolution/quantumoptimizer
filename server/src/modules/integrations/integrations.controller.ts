import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';
import * as service from './integrations.service';

export async function listConnectors(req: AuthRequest, res: Response) {
  try {
    const statuses = await service.getAllConnectorStatuses();
    return successResponse(res, statuses);
  } catch (err) {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch connector statuses', 500);
  }
}

export async function syncConnector(req: AuthRequest, res: Response) {
  try {
    const { connectorName } = req.body as { connectorName: string };
    if (!connectorName) return errorResponse(res, 'VALIDATION_ERROR', 'connectorName is required');
    const tenantId = req.user!.tenantId;
    const result = await service.triggerSync(connectorName, tenantId);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, 'SYNC_ERROR', (err as Error).message, 500);
  }
}

export async function getQualityIssues(req: AuthRequest, res: Response) {
  try {
    const resolved = req.query.resolved !== undefined
      ? req.query.resolved === 'true'
      : undefined;
    const issues = await service.getQualityIssues(req.user!.tenantId, resolved);
    return successResponse(res, issues);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch quality issues', 500);
  }
}

export async function resolveQualityIssue(req: AuthRequest, res: Response) {
  try {
    const issue = await service.resolveQualityIssue(req.params.id as string, req.user!.tenantId);
    return successResponse(res, issue);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to resolve issue', 500);
  }
}

export async function getSyncLogs(req: AuthRequest, res: Response) {
  try {
    const logs = await service.getConnectorSyncLogs(
      req.user!.tenantId,
      req.query.connector as string | undefined
    );
    return successResponse(res, logs);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch sync logs', 500);
  }
}
