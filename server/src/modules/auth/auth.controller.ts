import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { successResponse, errorResponse } from '../../utils/response';
import { securityLog, logger } from '../../config/logger';

export async function login(req: Request, res: Response) {
  const ip = req.ip || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Email and password required');
    }

    // Constant-time lookup to prevent user enumeration via timing
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always run bcrypt compare to prevent timing-based user enumeration
    const dummyHash = '$2b$12$invalidhashfortimingnormalization000000000000000000000';
    const validPassword = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !user.isActive || !validPassword) {
      securityLog.loginFailure(email, ip, ua, !user ? 'user_not_found' : !user.isActive ? 'account_inactive' : 'invalid_password');
      return errorResponse(res, 'UNAUTHORIZED', 'Invalid credentials', 401);
    }

    // Sign with explicit algorithm whitelist — never allow 'none'
    const payload = { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
      expiresIn: env.jwt.accessExpiry as any,
      algorithm: env.jwt.algorithm,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ip,
        metadata: { userAgent: ua },
      },
    }).catch((e) => logger.warn('Audit log write failed', { error: e.message }));

    securityLog.loginSuccess(user.id, ip, ua);

    return successResponse(res, {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (err) {
    logger.error('login error', { ip, error: (err as Error).message });
    return errorResponse(res, 'INTERNAL_ERROR', 'Login failed', 500);
  }
}

export async function demoRequest(req: Request, res: Response) {
  try {
    // In production, send email; here just acknowledge
    return successResponse(res, { message: 'Demo request received. We will contact you shortly.' });
  } catch {
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to submit demo request', 500);
  }
}
