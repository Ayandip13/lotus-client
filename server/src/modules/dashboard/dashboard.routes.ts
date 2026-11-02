import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';

const router = Router();

// Dashboard requires authentication
router.use(requireAuth, requirePartner);

router.get('/', dashboardController.getDashboardData);

export const dashboardRoutes = router;
