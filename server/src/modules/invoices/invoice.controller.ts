import { Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service';
import { sendSuccess } from '../../utils/apiResponse';

export class InvoiceController {
  createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      const invoice = await invoiceService.createInvoice(partnerId, req.body);
      sendSuccess(res, invoice, 'Invoice created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  recordPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      const invoiceId = req.params.id;
      const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body.idempotencyKey) as string | undefined;
      const paymentData = idempotencyKey ? { ...req.body, idempotencyKey } : req.body;
      const invoice = await invoiceService.recordPayment(invoiceId, partnerId, paymentData);
      sendSuccess(res, invoice, 'Customer payment recorded successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await invoiceService.getInvoices(req.query as any);
      sendSuccess(res, result, 'Invoices retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      sendSuccess(res, invoice, 'Invoice retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getCustomerDues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await invoiceService.getCustomerDues(req.query as any);
      sendSuccess(res, summary, 'Customer dues summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      await invoiceService.deleteInvoice(req.params.id, partnerId);
      sendSuccess(res, null, 'Invoice deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const invoiceController = new InvoiceController();
