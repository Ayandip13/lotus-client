import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import { UnauthorizedError, ForbiddenError } from '../utils/appError';

/**
 * Extracts and verifies the JWT token from the Authorization header
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token is missing');
    }

    const decoded = authService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Ensures the authenticated user resolves to a valid, active business partner.
 * In accordance with Phase 2 rules, ALL THREE PARTNERS have EQUAL authorization.
 * No Admin/Staff hierarchy exists.
 */
export const requirePartner = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const { user, partner } = await authService.getCurrentPartner(req.user.userId);

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Your user account is inactive');
    }

    if (partner.status !== 'ACTIVE') {
      throw new ForbiddenError('Your partner account is inactive');
    }

    // Attach validated partner identity for downstream request handlers
    req.partner = partner;

    next();
  } catch (error) {
    next(error);
  }
};
