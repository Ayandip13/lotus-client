import { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service';
import { sendSuccess } from '../../utils/apiResponse';

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const partnerId = req.partner!._id;
    const event = await eventService.createEvent(partnerId, req.body);
    sendSuccess(res, event, 'Booking/event created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await eventService.getEvents(req.query as any);
    sendSuccess(res, result, 'Bookings/events retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await eventService.getEventById(req.params.id);
    sendSuccess(res, event, 'Booking/event retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const partnerId = req.partner!._id;
    const event = await eventService.updateEvent(req.params.id, partnerId, req.body);
    sendSuccess(res, event, 'Booking/event updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const partnerId = req.partner!._id;
    await eventService.deleteEvent(req.params.id, partnerId);
    sendSuccess(res, null, 'Booking/event deleted successfully');
  } catch (error) {
    next(error);
  }
};
