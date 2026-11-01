import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';
import { UnauthorizedError } from '../../utils/appError';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Stateless token authorization: client discards token on logout
    sendSuccess(res, { loggedOut: true }, 'Logged out successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      throw new UnauthorizedError('Authentication session not found');
    }

    const { user, partner } = await authService.getCurrentPartner(req.user.userId);

    const payload = {
      user: {
        id: user._id.toString(),
        username: user.username,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      partner: {
        id: partner._id.toString(),
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        status: partner.status,
      },
    };

    sendSuccess(res, payload, 'Current partner session retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
