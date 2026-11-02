import { Request, Response, NextFunction } from 'express';
import { cashCustodyService } from './cashCustody.service';
import { sendSuccess } from '../../utils/apiResponse';

export class CashCustodyController {
  recordMovement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      const movement = await cashCustodyService.recordCashMovement(partnerId, req.body);
      sendSuccess(res, movement, 'Cash movement recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getCustodyOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await cashCustodyService.getCashCustodyOverview();
      sendSuccess(res, overview, 'Cash custody overview retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await cashCustodyService.getCashMovements(req.query as any);
      sendSuccess(res, result, 'Cash movements retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const cashCustodyController = new CashCustodyController();
