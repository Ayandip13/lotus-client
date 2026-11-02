import { Router } from 'express';
import { vendorController } from './vendor.controller';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createVendorSchema,
  updateVendorSchema,
  createVendorBillSchema,
  recordVendorPaymentSchema,
  queryVendorBillsSchema,
} from './vendor.schema';

const router = Router();

// All vendor routes require authentication
router.use(requireAuth, requirePartner);

// Dues summary endpoint
router.get('/dues', vendorController.getVendorDues);

// Bills endpoints
router.get('/bills', validateRequest({ query: queryVendorBillsSchema }), vendorController.getVendorBills);
router.post('/bills', validateRequest({ body: createVendorBillSchema }), vendorController.createVendorBill);
router.get('/bills/:id', vendorController.getVendorBillById);
router.post(
  '/bills/:id/payments',
  validateRequest({ body: recordVendorPaymentSchema }),
  vendorController.recordBillPayment
);
router.delete('/bills/:id', vendorController.deleteVendorBill);

// Vendor directory endpoints
router.get('/', vendorController.getVendors);
router.post('/', validateRequest({ body: createVendorSchema }), vendorController.createVendor);
router.get('/:id', vendorController.getVendorById);
router.patch('/:id', validateRequest({ body: updateVendorSchema }), vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

export const vendorRoutes = router;
