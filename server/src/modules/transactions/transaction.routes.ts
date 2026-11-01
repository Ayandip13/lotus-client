import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from './transaction.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { queryTransactionsSchema } from './transaction.schema';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';
import { uploadAttachments } from '../../middleware/upload.middleware';

const router = Router();

// All ledger routes require active partner authentication
router.use(requireAuth, requirePartner);

router.post('/', uploadAttachments.array('attachments', 5), createTransaction);
router.get('/', validateRequest({ query: queryTransactionsSchema }), getTransactions);
router.get('/:id', getTransactionById);
router.put('/:id', uploadAttachments.array('attachments', 5), updateTransaction);
router.delete('/:id', deleteTransaction);

export const transactionRoutes = router;
