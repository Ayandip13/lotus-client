import { Router } from 'express';
import { cashCustodyController } from './cashCustody.controller';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validateRequest';
import { createCashMovementSchema, queryCashMovementsSchema } from './cashCustody.schema';

const router = Router();

// All cash custody routes require authentication
router.use(requireAuth, requirePartner);

// Get custody balances for each partner, total cash, and bank reconciliation
router.get('/overview', cashCustodyController.getCustodyOverview);

// Get history of cash movements with filters
router.get('/', validateRequest({ query: queryCashMovementsSchema }), cashCustodyController.getMovements);

// Record a new cash movement
router.post(
  '/movements',
  validateRequest({ body: createCashMovementSchema }),
  cashCustodyController.recordMovement
);

export const cashCustodyRoutes = router;
