import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export class DashboardController {
  getDashboardData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await dashboardService.getDashboardData();
      sendSuccess(res, data, 'Dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
