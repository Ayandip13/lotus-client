import { Request, Response, NextFunction } from 'express';
import { transactionService } from './transaction.service';
import { sendSuccess } from '../../utils/apiResponse';
import { createTransactionSchema, updateTransactionSchema } from './transaction.schema';

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const partnerId = req.partner!._id;

    // Normalize amount if received as string via multipart form
    const rawBody = { ...req.body };
    if (typeof rawBody.amount === 'string') {
      rawBody.amount = parseFloat(rawBody.amount);
    }

    const validatedData = await createTransactionSchema.parseAsync(rawBody);
    const files = req.files as Express.Multer.File[] | undefined;

    const transaction = await transactionService.createTransaction(partnerId, validatedData, files);
    sendSuccess(res, transaction, 'Financial transaction recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await transactionService.getTransactions(req.query as any);
    sendSuccess(res, result, 'Transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    sendSuccess(res, transaction, 'Transaction details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const partnerId = req.partner!._id;

    const rawBody = { ...req.body };
    if (typeof rawBody.amount === 'string') {
      rawBody.amount = parseFloat(rawBody.amount);
    }

    const validatedData = await updateTransactionSchema.parseAsync(rawBody);
    const files = req.files as Express.Multer.File[] | undefined;

    const transaction = await transactionService.updateTransaction(
      req.params.id,
      partnerId,
      validatedData,
      files
    );
    sendSuccess(res, transaction, 'Transaction updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const partnerId = req.partner!._id;
    await transactionService.deleteTransaction(req.params.id, partnerId);
    sendSuccess(res, null, 'Transaction deleted successfully');
  } catch (error) {
    next(error);
  }
};
