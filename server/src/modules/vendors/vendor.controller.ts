import { Request, Response, NextFunction } from 'express';
import { vendorService } from './vendor.service';
import { sendSuccess } from '../../utils/apiResponse';

export class VendorController {
  // Vendor Directory
  createVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      const vendor = await vendorService.createVendor(partnerId, req.body);
      sendSuccess(res, vendor, 'Vendor created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendors = await vendorService.getVendors(req.query as any);
      sendSuccess(res, vendors, 'Vendors retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getVendorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await vendorService.getVendorById(req.params.id);
      sendSuccess(res, vendor, 'Vendor retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await vendorService.updateVendor(req.params.id, req.body);
      sendSuccess(res, vendor, 'Vendor updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await vendorService.deleteVendor(req.params.id);
      sendSuccess(res, null, 'Vendor deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Vendor Bills & Dues
  createVendorBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      const bill = await vendorService.createVendorBill(partnerId, req.body);
      sendSuccess(res, bill, 'Vendor bill created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getVendorBills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await vendorService.getVendorBills(req.query as any);
      sendSuccess(res, result, 'Vendor bills retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getVendorBillById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bill = await vendorService.getVendorBillById(req.params.id);
      sendSuccess(res, bill, 'Vendor bill retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  recordBillPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body.idempotencyKey) as string | undefined;
      const paymentData = idempotencyKey ? { ...req.body, idempotencyKey } : req.body;
      const bill = await vendorService.recordBillPayment(req.params.id, partnerId, paymentData);
      sendSuccess(res, bill, 'Vendor payment recorded successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getVendorDues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dues = await vendorService.getVendorDues(req.query as any);
      sendSuccess(res, dues, 'Vendor dues summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteVendorBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      await vendorService.deleteVendorBill(req.params.id, partnerId);
      sendSuccess(res, null, 'Vendor bill deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  updateVendorBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partnerId = req.partner!._id;
      const bill = await vendorService.updateVendorBill(req.params.id, partnerId, req.body);
      sendSuccess(res, bill, 'Vendor bill updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const vendorController = new VendorController();
