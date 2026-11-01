import mongoose, { Types } from 'mongoose';
import { Transaction, ITransaction, ITransactionAttachment } from './transaction.model';
import { Partner } from '../partners/partner.model';
import { Event } from '../events/event.model';
import { CreateTransactionInput, UpdateTransactionInput, QueryTransactionsInput } from './transaction.schema';
import { storageService, StorageFilePayload } from '../../services/storage';
import { BadRequestError, NotFoundError } from '../../utils/appError';
import { PaginationMetadata } from '../../types/api.types';

export interface PaginatedTransactionsResult {
  items: ITransaction[];
  pagination: PaginationMetadata;
}

export class TransactionService {
  /**
   * Creates a centralized financial transaction.
   * Creator partner is strictly derived from the authenticated session.
   */
  async createTransaction(
    creatorPartnerId: string | Types.ObjectId,
    data: CreateTransactionInput,
    files?: Express.Multer.File[]
  ): Promise<ITransaction> {
    // 1. Verify partner if provided
    if (data.partner && data.partner.trim() !== '') {
      const partnerDoc = await Partner.findById(data.partner);
      if (!partnerDoc || partnerDoc.status !== 'ACTIVE') {
        throw new BadRequestError('Specified partner not found or is inactive');
      }
    }

    // 2. Verify related event if provided
    if (data.relatedEvent && data.relatedEvent.trim() !== '') {
      const eventDoc = await Event.findOne({ _id: data.relatedEvent, isDeleted: false });
      if (!eventDoc) {
        throw new BadRequestError('Specified catering event / booking was not found');
      }
    }

    // 3. Normalize paymentSource
    let resolvedPaymentSource = data.paymentSource || 'COMMON_BUSINESS';
    if (data.transactionType === 'BUSINESS_INCOME' || data.transactionType === 'PARTNER_CONTRIBUTION') {
      resolvedPaymentSource = 'COMMON_BUSINESS';
    }

    // 4. Handle file uploads with cleanup on failure
    const uploadedAttachments: ITransactionAttachment[] = [];
    const publicIdsToCleanup: string[] = [];

    try {
      if (files && files.length > 0) {
        for (const file of files) {
          const payload: StorageFilePayload = {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          };
          const uploadResult = await storageService.uploadFile(payload, 'receipts');
          publicIdsToCleanup.push(uploadResult.publicId);

          uploadedAttachments.push({
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
            originalName: uploadResult.originalName,
            uploadedByPartner: creatorPartnerId as any,
            uploadedAt: new Date(),
          });
        }
      }

      // 5. Construct and save transaction
      const transaction = new Transaction({
        transactionType: data.transactionType,
        amount: data.amount,
        amountPaise: Math.round(data.amount * 100),
        transactionDate: new Date(data.transactionDate),
        description: data.description.trim(),
        paymentSource: resolvedPaymentSource,
        partner: data.partner && data.partner.trim() !== '' ? data.partner : undefined,
        relatedEvent: data.relatedEvent && data.relatedEvent.trim() !== '' ? data.relatedEvent : undefined,
        attachments: uploadedAttachments,
        createdByPartner: creatorPartnerId,
      });

      await transaction.save();

      return await transaction.populate([
        { path: 'partner', select: 'name email phone status' },
        { path: 'relatedEvent', select: 'title eventDate guestName guestPhone' },
        { path: 'createdByPartner', select: 'name email phone' },
        { path: 'attachments.uploadedByPartner', select: 'name' },
      ]);
    } catch (error) {
      // Clean up orphaned uploaded files
      for (const publicId of publicIdsToCleanup) {
        try {
          await storageService.deleteFile(publicId);
        } catch {
          // Ignore deletion error in cleanup
        }
      }
      throw error;
    }
  }

  /**
   * Retrieves paginated transactions with comprehensive filtering.
   */
  async getTransactions(query: QueryTransactionsInput): Promise<PaginatedTransactionsResult> {
    const {
      page,
      limit,
      transactionType,
      paymentSource,
      partner,
      relatedEvent,
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    } = query;

    const filter: Record<string, any> = { isDeleted: false };

    if (transactionType) {
      filter.transactionType = transactionType;
    }

    if (paymentSource) {
      filter.paymentSource = paymentSource;
    }

    if (partner) {
      filter.partner = partner;
    }

    if (relatedEvent) {
      filter.relatedEvent = relatedEvent;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.transactionDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.description = new RegExp(sanitized, 'i');
    }

    const totalItems = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const skip = (page - 1) * limit;

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy || 'transactionDate';

    const items = await Transaction.find(filter)
      .sort({ [sortField]: sortDirection, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: 'partner', select: 'name email phone status' },
        { path: 'relatedEvent', select: 'title eventDate guestName guestPhone' },
        { path: 'createdByPartner', select: 'name email phone' },
        { path: 'attachments.uploadedByPartner', select: 'name' },
      ])
      .lean();

    return {
      items: items as unknown as ITransaction[],
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
   * Retrieves single transaction details by ID.
   */
  async getTransactionById(id: string): Promise<ITransaction> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid transaction ID format');
    }

    const transaction = await Transaction.findOne({ _id: id, isDeleted: false }).populate([
      { path: 'partner', select: 'name email phone status' },
      { path: 'relatedEvent', select: 'title eventDate guestName guestPhone' },
      { path: 'createdByPartner', select: 'name email phone' },
      { path: 'attachments.uploadedByPartner', select: 'name' },
    ]);

    if (!transaction) {
      throw new NotFoundError('Transaction record not found');
    }

    return transaction;
  }

  /**
   * Updates an existing transaction.
   */
  async updateTransaction(
    id: string,
    _partnerId: string | Types.ObjectId,
    data: UpdateTransactionInput,
    newFiles?: Express.Multer.File[]
  ): Promise<ITransaction> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid transaction ID format');
    }

    const transaction = await Transaction.findOne({ _id: id, isDeleted: false });
    if (!transaction) {
      throw new NotFoundError('Transaction record not found');
    }

    if (data.amount !== undefined) {
      transaction.amount = data.amount;
      transaction.amountPaise = Math.round(data.amount * 100);
    }

    if (data.transactionDate !== undefined) {
      transaction.transactionDate = new Date(data.transactionDate);
    }

    if (data.description !== undefined) {
      transaction.description = data.description.trim();
    }

    if (data.paymentSource !== undefined) {
      transaction.paymentSource = data.paymentSource;
    }

    if (data.partner !== undefined) {
      if (data.partner && data.partner.trim() !== '') {
        const partnerDoc = await Partner.findById(data.partner);
        if (!partnerDoc || partnerDoc.status !== 'ACTIVE') {
          throw new BadRequestError('Specified partner not found or is inactive');
        }
        transaction.partner = new Types.ObjectId(data.partner);
      } else {
        transaction.partner = undefined;
      }
    }

    if (data.relatedEvent !== undefined) {
      if (data.relatedEvent && data.relatedEvent.trim() !== '') {
        const eventDoc = await Event.findOne({ _id: data.relatedEvent, isDeleted: false });
        if (!eventDoc) {
          throw new BadRequestError('Specified event was not found');
        }
        transaction.relatedEvent = new Types.ObjectId(data.relatedEvent);
      } else {
        transaction.relatedEvent = undefined;
      }
    }

    // Upload any new files and append to attachments
    if (newFiles && newFiles.length > 0) {
      for (const file of newFiles) {
        const payload: StorageFilePayload = {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        };
        const uploadResult = await storageService.uploadFile(payload, 'receipts');
        transaction.attachments.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          originalName: uploadResult.originalName,
          uploadedByPartner: _partnerId as any,
          uploadedAt: new Date(),
        });
      }
    }

    await transaction.save();

    return await transaction.populate([
      { path: 'partner', select: 'name email phone status' },
      { path: 'relatedEvent', select: 'title eventDate guestName guestPhone' },
      { path: 'createdByPartner', select: 'name email phone' },
      { path: 'attachments.uploadedByPartner', select: 'name' },
    ]);
  }

  /**
   * Soft-deletes a transaction, preserving audit history.
   */
  async deleteTransaction(id: string, deletingPartnerId: string | Types.ObjectId): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid transaction ID format');
    }

    const transaction = await Transaction.findOne({ _id: id, isDeleted: false });
    if (!transaction) {
      throw new NotFoundError('Transaction record not found');
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    transaction.deletedByPartner = deletingPartnerId as any;

    await transaction.save();
  }
}

export const transactionService = new TransactionService();
