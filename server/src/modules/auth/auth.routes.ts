import { Router } from 'express';
import { login, logout, getMe } from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { loginSchema } from './auth.schemas';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';

const router = Router();

// Public Authentication Endpoints
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/logout', logout);

// Protected Partner Session Endpoint
router.get('/me', requireAuth, requirePartner, getMe);

export const authRoutes = router;
