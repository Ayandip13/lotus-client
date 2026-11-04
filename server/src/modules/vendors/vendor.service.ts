import { Types } from 'mongoose';
import { Vendor, IVendor } from './vendor.model';
import { VendorBill, IVendorBill, IVendorPaymentRecord } from './vendorBill.model';
import { Event } from '../events/event.model';
import { Partner } from '../partners/partner.model';
import { Transaction } from '../transactions/transaction.model';
import { CashMovement } from '../cashCustody/cashCustody.model';
import {
  CreateVendorInput,
  UpdateVendorInput,
  CreateVendorBillInput,
  UpdateVendorBillInput,
  RecordVendorPaymentInput,
  QueryVendorBillsInput,
} from './vendor.schema';
import { BadRequestError, NotFoundError } from '../../utils/appError';
import { PaginationMetadata } from '../../types/api.types';

export interface VendorDueItem {
  billId: string;
  billNumber?: string;
  billDate: Date;
  dueDate?: Date;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  category: string;
  relatedEvent?: {
    id: string;
    title: string;
    eventDate: Date;
  };
  description: string;
  totalPayableAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: string;
  paymentCount: number;
  isOverdue: boolean;
}

export interface VendorDuesSummary {
  totalVendorDue: number;
  totalPayable: number;
  totalPaid: number;
  overdueCount: number;
  overdueAmount: number;
  dues: VendorDueItem[];
}

export class VendorService {
  /**
   * Creates a new vendor directory entry.
   */
  async createVendor(partnerId: string | Types.ObjectId, data: CreateVendorInput): Promise<IVendor> {
    const existing = await Vendor.findOne({ phone: data.phone, isDeleted: false });
    if (existing) {
      throw new BadRequestError(`Vendor with phone ${data.phone} already exists (${existing.name})`);
    }

    const vendor = new Vendor({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      category: data.category,
      address: data.address || undefined,
      bankDetails: data.bankDetails || undefined,
      status: 'ACTIVE',
      createdByPartner: partnerId,
      isDeleted: false,
    });

    await vendor.save();
    return vendor;
  }

  /**
   * Retrieves all active vendors.
   */
  async getVendors(query?: { search?: string; category?: string }): Promise<IVendor[]> {
    const filter: Record<string, any> = { isDeleted: false };
    if (query?.category) {
      filter.category = query.category;
    }
    if (query?.search && query.search.trim() !== '') {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { phone: regex }];
    }
    return Vendor.find(filter).sort({ name: 1 });
  }

  /**
   * Retrieves a single vendor by ID.
   */
  async getVendorById(id: string): Promise<IVendor> {
    const vendor = await Vendor.findOne({ _id: id, isDeleted: false });
    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }
    return vendor;
  }

  /**
   * Updates an existing vendor.
   */
  async updateVendor(id: string, data: UpdateVendorInput): Promise<IVendor> {
    const vendor = await Vendor.findOne({ _id: id, isDeleted: false });
    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }

    if (data.name) vendor.name = data.name;
    if (data.phone) vendor.phone = data.phone;
    if (data.email !== undefined) vendor.email = data.email || undefined;
    if (data.category) vendor.category = data.category;
    if (data.address !== undefined) vendor.address = data.address || undefined;
    if (data.bankDetails !== undefined) vendor.bankDetails = data.bankDetails || undefined;
    if (data.status) vendor.status = data.status;

    await vendor.save();
    return vendor;
  }

  /**
   * Soft-deletes a vendor if there are no unpaid bills.
   */
  async deleteVendor(id: string): Promise<void> {
    const vendor = await Vendor.findOne({ _id: id, isDeleted: false });
    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }

    const activeBills = await VendorBill.countDocuments({
      vendor: id,
      isDeleted: false,
      remainingAmountPaise: { $gt: 0 },
    });
    if (activeBills > 0) {
      throw new BadRequestError('Cannot delete vendor with outstanding payable bills');
    }

    vendor.isDeleted = true;
    await vendor.save();
  }

  /**
   * Records a vendor bill / payable obligation.
   * IMPORTANT: Does NOT create an expense in the ledger yet because no money has moved!
   */
  async createVendorBill(partnerId: string | Types.ObjectId, data: CreateVendorBillInput): Promise<IVendorBill> {
    const vendor = await Vendor.findOne({ _id: data.vendor, isDeleted: false });
    if (!vendor) {
      throw new BadRequestError('Referenced vendor does not exist');
    }

    if (data.relatedEvent && data.relatedEvent.trim() !== '') {
      const event = await Event.findOne({ _id: data.relatedEvent, isDeleted: false });
      if (!event) {
        throw new BadRequestError('Referenced event does not exist');
      }
    }

    const totalAmountPaise = Math.round(data.totalAmount * 100);

    const bill = new VendorBill({
      billNumber: data.billNumber || undefined,
      vendor: vendor._id,
      relatedEvent: data.relatedEvent ? new Types.ObjectId(data.relatedEvent) : undefined,
      billDate: new Date(data.billDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      description: data.description,
      totalAmount: data.totalAmount,
      totalAmountPaise,
      paidAmount: 0,
      paidAmountPaise: 0,
      remainingAmount: data.totalAmount,
      remainingAmountPaise: totalAmountPaise,
      status: 'UNPAID',
      paymentHistory: [],
      attachments: [],
      createdByPartner: partnerId,
      isDeleted: false,
    });

    await bill.save();
    return bill;
  }

  /**
   * Records a payment against a vendor bill.
   * Atomically integrates into the centralized financial ledger as a BUSINESS_EXPENSE.
   */
  async recordBillPayment(
    billId: string,
    recordedByPartnerId: string | Types.ObjectId,
    data: RecordVendorPaymentInput
  ) {
    if (!Types.ObjectId.isValid(billId)) {
      throw new BadRequestError('Invalid vendor bill ID format');
    }

    const bill = await VendorBill.findOne({ _id: billId, isDeleted: false }).populate('vendor', 'name');
    if (!bill) {
      throw new NotFoundError('Vendor bill not found or is deleted');
    }

    const paymentPaise = Math.round(data.amount * 100);

    // Prevent overpayment
    if (paymentPaise > bill.remainingAmountPaise) {
      throw new BadRequestError(
        `Payment amount (₹${data.amount}) exceeds remaining payable due (₹${bill.remainingAmount})`
      );
    }

    // 1. Idempotency Key check: if an idempotency key was supplied and was already processed, return existing bill
    if (data.idempotencyKey) {
      const existingPayment = bill.paymentHistory.find((p) => p.idempotencyKey === data.idempotencyKey);
      if (existingPayment) {
        return bill;
      }
    }

    const payingPartnerId = data.paidByPartner || recordedByPartnerId;
    const partner = await Partner.findById(payingPartnerId);
    if (!partner || partner.status !== 'ACTIVE') {
      throw new BadRequestError('Paying partner not found or is inactive');
    }

    const vendorName = (bill.vendor as any)?.name || 'Vendor';

    let createdTransaction: any = null;
    let createdCashMovement: any = null;

    try {
      // 1. Centralized financial ledger integration: record BUSINESS_EXPENSE
      createdTransaction = new Transaction({
        transactionType: 'BUSINESS_EXPENSE',
        amount: data.amount,
        amountPaise: paymentPaise,
        transactionDate: new Date(data.paymentDate || Date.now()),
        description: `Vendor payment: ${vendorName} - ${bill.description}`,
        paymentSource: data.paymentSource,
        partner: partner._id,
        relatedEvent: bill.relatedEvent,
        relatedVendorBill: bill._id,
        createdByPartner: recordedByPartnerId,
        attachments: [],
        isDeleted: false,
      });
      await createdTransaction.save();

      // 2. If paid using physical cash held by partner, log cash custody movement
      if (data.deductFromPartnerCash) {
        createdCashMovement = new CashMovement({
          movementType: 'CASH_EXPENSE',
          amount: data.amount,
          amountPaise: paymentPaise,
          movementDate: new Date(data.paymentDate || Date.now()),
          fromPartner: partner._id,
          sourceAccount: 'PARTNER_CUSTODY',
          destinationAccount: 'EXPENSE',
          description: `Cash paid to vendor ${vendorName} for bill`,
          relatedEvent: bill.relatedEvent,
          relatedTransaction: createdTransaction._id,
          createdByPartner: recordedByPartnerId,
          isDeleted: false,
        });
        await createdCashMovement.save();

        createdTransaction.relatedCashMovement = createdCashMovement._id;
        await createdTransaction.save();
      }

      // 3. Update VendorBill balances and payment history
      const paymentRecord: IVendorPaymentRecord = {
        amount: data.amount,
        amountPaise: paymentPaise,
        paymentDate: new Date(data.paymentDate || Date.now()),
        paymentSource: data.paymentSource,
        paidByPartner: partner._id as any,
        transactionRef: createdTransaction._id,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
        recordedAt: new Date(),
      };

      bill.paymentHistory.push(paymentRecord);
      bill.paidAmountPaise += paymentPaise;
      bill.paidAmount = Math.round((bill.paidAmountPaise / 100) * 100) / 100;
      bill.remainingAmountPaise = Math.max(0, bill.totalAmountPaise - bill.paidAmountPaise);
      bill.remainingAmount = Math.round((bill.remainingAmountPaise / 100) * 100) / 100;

      if (bill.remainingAmountPaise === 0) {
        bill.status = 'PAID';
      } else if (bill.paidAmountPaise > 0) {
        bill.status = 'PARTIALLY_PAID';
      } else {
        bill.status = 'UNPAID';
      }

      if (
        bill.remainingAmountPaise > 0 &&
        bill.dueDate &&
        new Date(bill.dueDate).getTime() < Date.now()
      ) {
        bill.status = 'OVERDUE';
      }

      await bill.save();
      return bill;
    } catch (saveError) {
      if (createdCashMovement) {
        await CashMovement.findByIdAndDelete(createdCashMovement._id);
      }
      if (createdTransaction) {
        await Transaction.findByIdAndDelete(createdTransaction._id);
      }
      throw saveError;
    }
  }

  /**
   * Retrieves vendor bills with filtering and pagination.
   */
  async getVendorBills(query: QueryVendorBillsInput): Promise<{ items: IVendorBill[]; pagination: PaginationMetadata }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.vendor) {
      filter.vendor = query.vendor;
    }

    if (query.relatedEvent) {
      filter.relatedEvent = query.relatedEvent;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.startDate || query.endDate) {
      filter.billDate = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        filter.billDate.$gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.billDate.$lte = end;
      }
    }

    if (query.search && query.search.trim() !== '') {
      filter.description = new RegExp(query.search.trim(), 'i');
    }

    const sortField = query.sortBy || 'billDate';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [items, totalItems] = await Promise.all([
      VendorBill.find(filter)
        .populate('vendor', 'name phone category')
        .populate('relatedEvent', 'title eventDate guestCount')
        .populate('createdByPartner', 'name email phone')
        .populate('paymentHistory.paidByPartner', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      VendorBill.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: items as unknown as IVendorBill[],
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
   * Retrieves single vendor bill by ID.
   */
  async getVendorBillById(id: string): Promise<IVendorBill> {
    const bill = await VendorBill.findOne({ _id: id, isDeleted: false })
      .populate('vendor', 'name phone email category address bankDetails')
      .populate('relatedEvent', 'title eventDate guestCount location clientName')
      .populate('createdByPartner', 'name email phone')
      .populate('paymentHistory.paidByPartner', 'name email')
      .populate('paymentHistory.transactionRef', 'transactionType amount transactionDate paymentSource');

    if (!bill) {
      throw new NotFoundError('Vendor bill not found or is deleted');
    }
    return bill;
  }

  /**
   * Aggregates vendor outstanding payables/dues across all events and vendors.
   */
  async getVendorDues(query?: { vendor?: string; relatedEvent?: string }): Promise<VendorDuesSummary> {
    const filter: Record<string, any> = {
      isDeleted: false,
      remainingAmountPaise: { $gt: 0 },
    };

    if (query?.vendor) {
      filter.vendor = query.vendor;
    }

    if (query?.relatedEvent) {
      filter.relatedEvent = query.relatedEvent;
    }

    const bills = await VendorBill.find(filter)
      .populate('vendor', 'name phone category')
      .populate('relatedEvent', 'title eventDate')
      .sort({ dueDate: 1, billDate: -1 })
      .lean();

    const now = Date.now();
    let totalVendorDuePaise = 0;
    let totalPayablePaise = 0;
    let totalPaidPaise = 0;
    let overdueCount = 0;
    let overdueAmountPaise = 0;

    const dues: VendorDueItem[] = bills.map((bill: any) => {
      const isOverdue = bill.dueDate && new Date(bill.dueDate).getTime() < now && bill.remainingAmountPaise > 0;
      totalVendorDuePaise += bill.remainingAmountPaise;
      totalPayablePaise += bill.totalAmountPaise;
      totalPaidPaise += bill.paidAmountPaise;

      if (isOverdue) {
        overdueCount += 1;
        overdueAmountPaise += bill.remainingAmountPaise;
      }

      return {
        billId: bill._id.toString(),
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        dueDate: bill.dueDate,
        vendorId: bill.vendor?._id?.toString() || '',
        vendorName: bill.vendor?.name || 'Unknown Vendor',
        vendorPhone: bill.vendor?.phone || '',
        category: bill.vendor?.category || 'OTHER',
        relatedEvent: bill.relatedEvent
          ? {
              id: bill.relatedEvent._id.toString(),
              title: bill.relatedEvent.title,
              eventDate: bill.relatedEvent.eventDate,
            }
          : undefined,
        description: bill.description,
        totalPayableAmount: bill.totalAmount,
        amountPaid: bill.paidAmount,
        remainingAmount: bill.remainingAmount,
        status: isOverdue ? 'OVERDUE' : bill.status,
        paymentCount: bill.paymentHistory?.length || 0,
        isOverdue: !!isOverdue,
      };
    });

    return {
      totalVendorDue: Math.round(totalVendorDuePaise / 100 * 100) / 100,
      totalPayable: Math.round(totalPayablePaise / 100 * 100) / 100,
      totalPaid: Math.round(totalPaidPaise / 100 * 100) / 100,
      overdueCount,
      overdueAmount: Math.round(overdueAmountPaise / 100 * 100) / 100,
      dues,
    };
  }

  /**
   * Soft-deletes a vendor bill if no payments have been made against it.
   */
  async deleteVendorBill(id: string, partnerId: string | Types.ObjectId): Promise<void> {
    const bill = await VendorBill.findOne({ _id: id, isDeleted: false });
    if (!bill) {
      throw new NotFoundError('Vendor bill not found or is already deleted');
    }

    if (bill.paymentHistory && bill.paymentHistory.length > 0) {
      throw new BadRequestError('Cannot delete a bill that has recorded payments against it');
    }

    bill.isDeleted = true;
    bill.deletedAt = new Date();
    bill.deletedByPartner = partnerId as any;
    await bill.save();
  }

  /**
   * Updates an existing vendor bill.
   */
  async updateVendorBill(
    id: string,
    partnerId: string | Types.ObjectId,
    data: UpdateVendorBillInput
  ): Promise<IVendorBill> {
    const bill = await VendorBill.findOne({ _id: id, isDeleted: false });
    if (!bill) {
      throw new NotFoundError('Vendor bill not found or is already deleted');
    }

    if (data.vendor) {
      const vendorExists = await Vendor.findOne({ _id: data.vendor, isDeleted: false });
      if (!vendorExists) {
        throw new BadRequestError('Specified vendor not found or is deleted');
      }
      bill.vendor = data.vendor as any;
    }

    if (data.relatedEvent !== undefined) {
      if (data.relatedEvent && data.relatedEvent.trim() !== '') {
        const eventExists = await Event.findOne({ _id: data.relatedEvent, isDeleted: false });
        if (!eventExists) {
          throw new BadRequestError('Specified event not found or is deleted');
        }
        bill.relatedEvent = data.relatedEvent as any;
      } else {
        bill.relatedEvent = undefined as any;
      }
    }

    if (data.billNumber !== undefined) bill.billNumber = data.billNumber.trim() || undefined;
    if (data.billDate !== undefined) bill.billDate = new Date(data.billDate);
    if (data.dueDate !== undefined) bill.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    if (data.description !== undefined) bill.description = data.description.trim();

    if (data.totalAmount !== undefined) {
      const newTotalPaise = Math.round(data.totalAmount * 100);
      if (newTotalPaise < bill.paidAmountPaise) {
        throw new BadRequestError('Updated bill amount cannot be less than the already settled amount');
      }
      bill.totalAmount = data.totalAmount;
      bill.totalAmountPaise = newTotalPaise;
      bill.remainingAmountPaise = newTotalPaise - bill.paidAmountPaise;
      bill.remainingAmount = Math.round(bill.remainingAmountPaise / 100 * 100) / 100;

      if (bill.remainingAmountPaise === 0 && bill.paidAmountPaise > 0) {
        bill.status = 'PAID';
      } else if (bill.paidAmountPaise > 0) {
        bill.status = 'PARTIALLY_PAID';
      } else {
        bill.status = 'UNPAID';
      }
    }

    await bill.save();
    return bill;
  }
}

export const vendorService = new VendorService();
