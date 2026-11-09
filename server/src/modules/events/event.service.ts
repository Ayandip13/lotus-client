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
    const parsedDate = data.eventDate && !isNaN(Date.parse(data.eventDate))
      ? new Date(data.eventDate)
      : new Date();

    const title = data.title && data.title.trim() !== ''
      ? data.title.trim()
      : `Catering Event - ${parsedDate.toLocaleDateString('en-IN')}`;

    const guestName = data.guestName && data.guestName.trim() !== ''
      ? data.guestName.trim()
      : 'Guest';

    const event = new Event({
      title,
      eventDate: parsedDate,
      eventDetails: data.eventDetails && data.eventDetails.trim() !== '' ? data.eventDetails.trim() : undefined,
      guestName,
      guestPhone: data.guestPhone && data.guestPhone.trim() !== '' ? data.guestPhone.trim() : '',
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

  /**
   * Retrieves comprehensive event-wise financial overview, collections, expenses, invoices, and vendor dues.
   */
  async getEventFinancialOverview(eventId: string) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new BadRequestError('Invalid event ID format');
    }

    const event = await Event.findOne({ _id: eventId, isDeleted: false }).populate(
      'createdByPartner',
      'name email phone'
    );
    if (!event) {
      throw new NotFoundError('Booking/event not found');
    }

    const { Transaction } = await import('../transactions/transaction.model');
    const { Invoice } = await import('../invoices/invoice.model');
    const { VendorBill } = await import('../vendors/vendorBill.model');

    const [transactions, invoices, vendorBills] = await Promise.all([
      Transaction.find({ relatedEvent: event._id, isDeleted: false })
        .populate('partner', 'name email phone')
        .populate('createdByPartner', 'name')
        .sort({ transactionDate: -1 })
        .lean(),
      Invoice.find({ relatedEvent: event._id, isDeleted: false })
        .populate('createdByPartner', 'name')
        .populate('payments.receivedByPartner', 'name')
        .sort({ invoiceDate: -1 })
        .lean(),
      VendorBill.find({ relatedEvent: event._id, isDeleted: false })
        .populate('vendor', 'name phone category')
        .populate('createdByPartner', 'name')
        .populate('paymentHistory.paidByPartner', 'name')
        .sort({ billDate: -1 })
        .lean(),
    ]);

    let totalCollectedPaise = 0;
    let totalExpensesPaise = 0;
    let totalInvoicedPaise = 0;
    let totalCustomerDuePaise = 0;
    let totalVendorDuePaise = 0;

    const collections = transactions.filter((t: any) => t.transactionType === 'BUSINESS_INCOME');
    const expenses = transactions.filter((t: any) => t.transactionType === 'BUSINESS_EXPENSE');
    const contributions = transactions.filter((t: any) => t.transactionType === 'PARTNER_CONTRIBUTION');

    for (const c of collections) {
      totalCollectedPaise += c.amountPaise || Math.round(c.amount * 100);
    }

    for (const e of expenses) {
      totalExpensesPaise += e.amountPaise || Math.round(e.amount * 100);
    }

    for (const inv of invoices) {
      totalInvoicedPaise += inv.grandTotalPaise || Math.round(inv.grandTotal * 100);
      totalCustomerDuePaise += inv.remainingDuePaise || Math.round(inv.remainingDue * 100);
    }

    for (const vb of vendorBills) {
      totalVendorDuePaise += vb.remainingAmountPaise || Math.round(vb.remainingAmount * 100);
    }

    return {
      event,
      summary: {
        totalInvoiced: Math.round((totalInvoicedPaise / 100) * 100) / 100,
        totalAmountCollected: Math.round((totalCollectedPaise / 100) * 100) / 100,
        remainingCustomerDue: Math.round((totalCustomerDuePaise / 100) * 100) / 100,
        totalExpenses: Math.round((totalExpensesPaise / 100) * 100) / 100,
        totalVendorDue: Math.round((totalVendorDuePaise / 100) * 100) / 100,
        netCashflow: Math.round(((totalCollectedPaise - totalExpensesPaise) / 100) * 100) / 100,
      },
      collections,
      expenses,
      contributions,
      invoices,
      vendorBills,
    };
  }
}

export const eventService = new EventService();

