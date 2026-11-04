import { Router } from 'express';
import { invoiceController } from './invoice.controller';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordInvoicePaymentSchema,
  queryInvoicesSchema,
} from './invoice.schema';

const router = Router();

// All invoice routes require authenticated partner
router.use(requireAuth, requirePartner);

// Customer dues summary
router.get('/dues', invoiceController.getCustomerDues);

// List invoices with filtering & pagination
router.get('/', validateRequest({ query: queryInvoicesSchema }), invoiceController.getInvoices);

// Create new invoice
router.post('/', validateRequest({ body: createInvoiceSchema }), invoiceController.createInvoice);

// Get single invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// Record payment against invoice
router.post(
  '/:id/payments',
  validateRequest({ body: recordInvoicePaymentSchema }),
  invoiceController.recordPayment
);

// Delete invoice
router.delete('/:id', invoiceController.deleteInvoice);

// Update invoice
router.put('/:id', validateRequest({ body: updateInvoiceSchema }), invoiceController.updateInvoice);

export const invoiceRoutes = router;
