import { Router } from 'express';
import {
  getOverallSummary,
  getPartnerSummaries,
  getPartnerDetails,
  getDateWiseHistory,
} from './account.controller';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';

const router = Router();

// All accounting overview routes require active partner authorization
router.use(requireAuth, requirePartner);

router.get('/summary', getOverallSummary);
router.get('/partners', getPartnerSummaries);
router.get('/partners/:partnerId', getPartnerDetails);
router.get('/date-wise', getDateWiseHistory);

export const accountRoutes = router;
