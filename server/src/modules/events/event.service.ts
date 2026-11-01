import mongoose, { Types } from 'mongoose';
import { Event, IEvent } from './event.model';
import { CreateEventInput, UpdateEventInput, QueryEventsInput } from './event.schema';
import { BadRequestError, NotFoundError } from '../../utils/appError';
import { PaginationMetadata } from '../../types/api.types';

export interface PaginatedEventsResult {
  items: IEvent[];
  pagination: PaginationMetadata;
}

export class EventService {
  /**
   * Creates a new booking / event record.
   * Creator identity is strictly derived from the authenticated partner session.
   */
  async createEvent(
    partnerId: string | Types.ObjectId,
    data: CreateEventInput
  ): Promise<IEvent> {
    const event = new Event({
      title: data.title,
      eventDate: new Date(data.eventDate),
      eventDetails: data.eventDetails ? data.eventDetails.trim() : undefined,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail && data.guestEmail.trim() !== '' ? data.guestEmail.trim() : undefined,
      guestAddress: data.guestAddress && data.guestAddress.trim() !== '' ? data.guestAddress.trim() : undefined,
      createdByPartner: partnerId,
    });

    await event.save();
    return event.populate('createdByPartner', 'name email phone');
  }

  /**
   * Retrieves paginated bookings / events with optional search filters.
   */
  async getEvents(query: QueryEventsInput): Promise<PaginatedEventsResult> {
    const { page, limit, search, sortBy, sortOrder } = query;

    const filter: Record<string, any> = { isDeleted: false };

    if (search && search.trim() !== '') {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      filter.$or = [
        { title: searchRegex },
        { guestName: searchRegex },
        { guestPhone: searchRegex },
      ];
    }

    const totalItems = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const skip = (page - 1) * limit;

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy || 'eventDate';

    const items = await Event.find(filter)
      .sort({ [sortField]: sortDirection, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdByPartner', 'name email phone')
      .lean();

    return {
      items: items as unknown as IEvent[],
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single booking / event details by ID.
   */
  async getEventById(id: string): Promise<IEvent> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid event ID format');
    }

    const event = await Event.findOne({ _id: id, isDeleted: false })
      .populate('createdByPartner', 'name email phone');

    if (!event) {
      throw new NotFoundError('Booking/event not found');
    }

    return event;
  }

  /**
   * Updates an existing booking / event.
   */
  async updateEvent(
    id: string,
    _partnerId: string | Types.ObjectId,
    data: UpdateEventInput
  ): Promise<IEvent> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid event ID format');
    }

    const event = await Event.findOne({ _id: id, isDeleted: false });
    if (!event) {
      throw new NotFoundError('Booking/event not found');
    }

    if (data.title !== undefined) event.title = data.title;
    if (data.eventDate !== undefined) event.eventDate = new Date(data.eventDate);
    if (data.eventDetails !== undefined) {
      event.eventDetails = data.eventDetails.trim() !== '' ? data.eventDetails.trim() : undefined;
    }
    if (data.guestName !== undefined) event.guestName = data.guestName;
    if (data.guestPhone !== undefined) event.guestPhone = data.guestPhone;
    if (data.guestEmail !== undefined) {
      event.guestEmail = data.guestEmail.trim() !== '' ? data.guestEmail.trim() : undefined;
    }
    if (data.guestAddress !== undefined) {
      event.guestAddress = data.guestAddress.trim() !== '' ? data.guestAddress.trim() : undefined;
    }

    await event.save();
    return event.populate('createdByPartner', 'name email phone');
  }

  /**
   * Soft-deletes a booking / event, recording the deleting partner.
   */
  async deleteEvent(id: string, partnerId: string | Types.ObjectId): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid event ID format');
    }

    const event = await Event.findOne({ _id: id, isDeleted: false });
    if (!event) {
      throw new NotFoundError('Booking/event not found');
    }

    event.isDeleted = true;
    event.deletedAt = new Date();
    event.deletedByPartner = partnerId as any;

    await event.save();
  }
}

export const eventService = new EventService();
