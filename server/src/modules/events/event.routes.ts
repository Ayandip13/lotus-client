import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from './event.controller';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
} from './event.schema';
import { requireAuth, requirePartner } from '../../middleware/auth.middleware';

const router = Router();

// All booking & event management routes require active authenticated partner status
router.use(requireAuth, requirePartner);

router.post('/', validateRequest({ body: createEventSchema }), createEvent);
router.get('/', validateRequest({ query: queryEventsSchema }), getEvents);
router.get('/:id', getEventById);
router.put('/:id', validateRequest({ body: updateEventSchema }), updateEvent);
router.delete('/:id', deleteEvent);

export const eventRoutes = router;
