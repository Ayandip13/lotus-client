import { Router } from 'express';
import { login, logout, getMe, updateMe } from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { loginSchema, updateProfileSchema } from './auth.schemas';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';

const router = Router();

// Public Authentication Endpoints
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/logout', logout);

// Protected Partner Session Endpoint
router.get('/me', requireAuth, requirePartner, getMe);
router.patch('/me', requireAuth, requirePartner, validateRequest({ body: updateProfileSchema }), updateMe);

export const authRoutes = router;
