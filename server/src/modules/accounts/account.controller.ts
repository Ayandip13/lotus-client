import { Request, Response, NextFunction } from 'express';
import { accountService } from './account.service';
import { sendSuccess } from '../../utils/apiResponse';

export const getOverallSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const summary = await accountService.getOverallFinancialSummary(startDate, endDate);
    sendSuccess(res, summary, 'Overall financial summary calculated successfully');
  } catch (error) {
    next(error);
  }
};

export const getPartnerSummaries = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const summaries = await accountService.getPartnerWiseSummaries();
    sendSuccess(res, summaries, 'Partner financial summaries calculated successfully');
  } catch (error) {
    next(error);
  }
};

export const getPartnerDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const details = await accountService.getPartnerFinancialDetails(req.params.partnerId);
    sendSuccess(res, details, 'Partner financial details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getDateWiseHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dateString = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const result = await accountService.getDateWiseFinancialHistory(dateString);
    sendSuccess(res, result, 'Date-wise financial history retrieved successfully');
  } catch (error) {
    next(error);
  }
};
