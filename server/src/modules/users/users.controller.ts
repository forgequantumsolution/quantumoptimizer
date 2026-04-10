import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, tenantId: true, department: true, lastLogin: true },
    });
    return successResponse(res, user);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch profile', 500);
  }
}

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.user!.tenantId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLogin: true },
    });
    return successResponse(res, users);
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch users', 500);
  }
}
