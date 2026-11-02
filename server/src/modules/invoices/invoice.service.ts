import { Types } from 'mongoose';
import { Invoice, IInvoice, IInvoiceLineItem, IInvoicePaymentRecord, IBusinessSnapshot } from './invoice.model';
import { Event } from '../events/event.model';
import { Transaction } from '../transactions/transaction.model';
import { CashMovement } from '../cashCustody/cashCustody.model';
import { Partner } from '../partners/partner.model';
import { CreateInvoiceInput, RecordInvoicePaymentInput, QueryInvoicesInput } from './invoice.schema';
import { BadRequestError, NotFoundError } from '../../utils/appError';
import { PaginationMetadata } from '../../types/api.types';

export interface CustomerDueItem {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  customerName: string;
  customerPhone: string;
  relatedEvent?: {
    id: string;
    title: string;
    eventDate: Date;
  };
  totalBillAmount: number;
  amountReceived: number;
  remainingDue: number;
  paymentStatus: string;
  paymentCount: number;
  isOverdue: boolean;
}

export interface CustomerDuesSummary {
  totalCustomerDue: number;
  totalInvoiced: number;
  totalCollected: number;
  overdueCount: number;
  overdueAmount: number;
  dues: CustomerDueItem[];
}

export class InvoiceService {
  /**
   * Generates a unique invoice sequence number (e.g. LC-2026-0001)
   */
  private async generateInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await Invoice.countDocuments();
    const sequence = String(count + 1).padStart(4, '0');
    return `LC-${currentYear}-${sequence}`;
  }

  /**
   * Creates a new customer invoice (GST or Non-GST) with strict line-item calculations.
   */
  async createInvoice(partnerId: string | Types.ObjectId, data: CreateInvoiceInput): Promise<IInvoice> {
    const event = await Event.findOne({ _id: data.relatedEvent, isDeleted: false });
    if (!event) {
      throw new BadRequestError('Referenced event was not found or is deleted');
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    let subtotal = 0;
    let subtotalPaise = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;
    let totalTaxPaise = 0;

    const computedItems: IInvoiceLineItem[] = data.items.map((item) => {
      const amount = Math.round(item.quantity * item.rate * 100) / 100;
      const amountPaise = Math.round(amount * 100);
      subtotal += amount;
      subtotalPaise += amountPaise;

      let itemCgst = 0;
      let itemSgst = 0;
      let itemIgst = 0;

      if (data.invoiceType === 'GST' && item.gstRate && item.gstRate > 0) {
        const itemTax = Math.round(((amount * item.gstRate) / 100) * 100) / 100;
        if (data.isInterState) {
          itemIgst = itemTax;
        } else {
          itemCgst = Math.round((itemTax / 2) * 100) / 100;
          itemSgst = Math.round((itemTax / 2) * 100) / 100;
        }
      }

      const itemTotal = Math.round((amount + itemCgst + itemSgst + itemIgst) * 100) / 100;

      totalCgst += itemCgst;
      totalSgst += itemSgst;
      totalIgst += itemIgst;

      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'plates',
        rate: item.rate,
        amount,
        amountPaise,
        gstRate: item.gstRate || 0,
        cgstAmount: itemCgst,
        sgstAmount: itemSgst,
        igstAmount: itemIgst,
        totalAmount: itemTotal,
      };
    });

    totalTax = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
    totalTaxPaise = Math.round(totalTax * 100);

    const discount = data.discount || 0;
    const discountPaise = Math.round(discount * 100);

    if (discount > subtotal) {
      throw new BadRequestError('Discount cannot exceed the subtotal amount');
    }

    const grandTotal = Math.round((subtotal - discount + totalTax) * 100) / 100;
    const grandTotalPaise = Math.round(grandTotal * 100);

    const defaultBusinessDetails: IBusinessSnapshot = {
      legalName: data.businessDetails?.legalName || 'Lotus Caterer',
      address: data.businessDetails?.address || 'Kolkata, West Bengal',
      phone: data.businessDetails?.phone || '+91 98300 00000',
      email: data.businessDetails?.email || 'contact@lotuscaterer.com',
      gstin: data.businessDetails?.gstin || '',
      pan: data.businessDetails?.pan || '',
      bankName: data.businessDetails?.bankName || 'State Bank of India',
      bankAccountNumber: data.businessDetails?.bankAccountNumber || '38920194821',
      bankIfsc: data.businessDetails?.bankIfsc || 'SBIN0001234',
      bankBranch: data.businessDetails?.bankBranch || 'Kolkata Main Branch',
    };

    const invoice = new Invoice({
      invoiceNumber,
      invoiceType: data.invoiceType,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      customerAddress: data.customerAddress || undefined,
      customerGstin: data.customerGstin || undefined,
      relatedEvent: event._id,
      items: computedItems,
      subtotal,
      subtotalPaise,
      discount,
      discountPaise,
      taxDetails:
        data.invoiceType === 'GST'
          ? {
              isInterState: !!data.isInterState,
              totalCgst,
              totalSgst,
              totalIgst,
              totalTax,
              totalTaxPaise,
            }
          : undefined,
      grandTotal,
      grandTotalPaise,
      amountPaid: 0,
      amountPaidPaise: 0,
      remainingDue: grandTotal,
      remainingDuePaise: grandTotalPaise,
      paymentStatus: 'UNPAID',
      payments: [],
      businessDetails: defaultBusinessDetails,
      notes: data.notes,
      createdByPartner: partnerId,
      isDeleted: false,
    });

    await invoice.save();
    return invoice;
  }

  /**
   * Records a payment received from customer against an invoice.
   * Atomically connects to centralized financial ledger as BUSINESS_INCOME.
   */
  async recordPayment(
    invoiceId: string,
    partnerId: string | Types.ObjectId,
    data: RecordInvoicePaymentInput
  ): Promise<IInvoice> {
    const invoice = await Invoice.findOne({ _id: invoiceId, isDeleted: false });
    if (!invoice) {
      throw new NotFoundError('Invoice not found or has been deleted');
    }

    const paymentPaise = Math.round(data.amount * 100);

    // Prevent overpayment
    if (paymentPaise > invoice.remainingDuePaise) {
      throw new BadRequestError(
        `Payment amount (₹${data.amount}) exceeds remaining due (₹${invoice.remainingDue})`
      );
    }

    // Verify cash assignment partner if cash payment
    let assignedPartnerId: Types.ObjectId | undefined;
    if (data.paymentMethod === 'CASH') {
      const partnerToAssign = data.assignCashToPartner || partnerId;
      const partnerDoc = await Partner.findById(partnerToAssign);
      if (!partnerDoc || partnerDoc.status !== 'ACTIVE') {
        throw new BadRequestError('Assigned cash custody partner not found or is inactive');
      }
      assignedPartnerId = partnerDoc._id as Types.ObjectId;
    }

    // 1. Create centralized financial transaction as BUSINESS_INCOME
    const transaction = new Transaction({
      transactionType: 'BUSINESS_INCOME',
      amount: data.amount,
      amountPaise: paymentPaise,
      transactionDate: new Date(data.paymentDate || Date.now()),
      description: `Customer payment received for ${invoice.invoiceNumber} (${invoice.customerName})`,
      paymentSource: 'COMMON_BUSINESS',
      relatedEvent: invoice.relatedEvent,
      relatedInvoice: invoice._id,
      partner: assignedPartnerId || partnerId,
      createdByPartner: partnerId,
      attachments: [],
      isDeleted: false,
    });
    await transaction.save();

    // 2. If cash payment, record cash custody movement
    if (data.paymentMethod === 'CASH' && assignedPartnerId) {
      const cashMovement = new CashMovement({
        movementType: 'CASH_INCOME_ASSIGNED',
        amount: data.amount,
        amountPaise: paymentPaise,
        movementDate: new Date(data.paymentDate || Date.now()),
        toPartner: assignedPartnerId,
        sourceAccount: 'CUSTOMER',
        destinationAccount: 'PARTNER_CUSTODY',
        description: `Cash received from customer for invoice ${invoice.invoiceNumber}`,
        relatedEvent: invoice.relatedEvent,
        relatedTransaction: transaction._id,
        createdByPartner: partnerId,
        isDeleted: false,
      });
      await cashMovement.save();

      transaction.relatedCashMovement = cashMovement._id as any;
      await transaction.save();
    }

    // 3. Update invoice payment records and balances
    const paymentRecord: IInvoicePaymentRecord = {
      amount: data.amount,
      amountPaise: paymentPaise,
      paymentDate: new Date(data.paymentDate || Date.now()),
      paymentMethod: data.paymentMethod,
      transactionRef: transaction._id as any,
      notes: data.notes,
      receivedByPartner: (assignedPartnerId || partnerId) as any,
      recordedAt: new Date(),
    };

    invoice.payments.push(paymentRecord);
    invoice.amountPaidPaise += paymentPaise;
    invoice.amountPaid = Math.round(invoice.amountPaidPaise / 100 * 100) / 100;
    invoice.remainingDuePaise = Math.max(0, invoice.grandTotalPaise - invoice.amountPaidPaise);
    invoice.remainingDue = Math.round(invoice.remainingDuePaise / 100 * 100) / 100;

    if (invoice.remainingDuePaise === 0) {
      invoice.paymentStatus = 'PAID';
    } else if (invoice.amountPaidPaise > 0) {
      invoice.paymentStatus = 'PARTIALLY_PAID';
    } else {
      invoice.paymentStatus = 'UNPAID';
    }

    // Check overdue condition
    if (
      invoice.remainingDuePaise > 0 &&
      invoice.dueDate &&
      new Date(invoice.dueDate).getTime() < Date.now()
    ) {
      invoice.paymentStatus = 'OVERDUE';
    }

    await invoice.save();
    return invoice;
  }

  /**
   * Retrieves list of invoices with filtering and pagination.
   */
  async getInvoices(query: QueryInvoicesInput): Promise<{ items: IInvoice[]; pagination: PaginationMetadata }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.invoiceType) {
      filter.invoiceType = query.invoiceType;
    }

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query.relatedEvent) {
      filter.relatedEvent = query.relatedEvent;
    }

    if (query.startDate || query.endDate) {
      filter.invoiceDate = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        filter.invoiceDate.$gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { invoiceNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'invoiceDate';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [items, totalItems] = await Promise.all([
      Invoice.find(filter)
        .populate('relatedEvent', 'title eventDate guestCount location clientName')
        .populate('createdByPartner', 'name email phone')
        .populate('payments.receivedByPartner', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: items as unknown as IInvoice[],
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
   * Retrieves single invoice by ID with fully populated relations.
   */
  async getInvoiceById(id: string): Promise<IInvoice> {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false })
      .populate('relatedEvent', 'title eventDate eventType guestCount location clientName clientPhone clientEmail')
      .populate('createdByPartner', 'name email phone')
      .populate('payments.receivedByPartner', 'name email')
      .populate('payments.transactionRef', 'transactionType amount transactionDate description');

    if (!invoice) {
      throw new NotFoundError('Invoice not found or has been deleted');
    }
    return invoice;
  }

  /**
   * Aggregates customer outstanding dues across all events/invoices.
   */
  async getCustomerDues(query?: { relatedEvent?: string; customerName?: string }): Promise<CustomerDuesSummary> {
    const filter: Record<string, any> = {
      isDeleted: false,
      remainingDuePaise: { $gt: 0 },
    };

    if (query?.relatedEvent) {
      filter.relatedEvent = query.relatedEvent;
    }

    if (query?.customerName && query.customerName.trim() !== '') {
      filter.customerName = new RegExp(query.customerName.trim(), 'i');
    }

    const invoices = await Invoice.find(filter)
      .populate('relatedEvent', 'title eventDate')
      .sort({ dueDate: 1, invoiceDate: -1 })
      .lean();

    const now = Date.now();
    let totalCustomerDuePaise = 0;
    let totalInvoicedPaise = 0;
    let totalCollectedPaise = 0;
    let overdueCount = 0;
    let overdueAmountPaise = 0;

    const dues: CustomerDueItem[] = invoices.map((inv: any) => {
      const isOverdue = inv.dueDate && new Date(inv.dueDate).getTime() < now && inv.remainingDuePaise > 0;
      totalCustomerDuePaise += inv.remainingDuePaise;
      totalInvoicedPaise += inv.grandTotalPaise;
      totalCollectedPaise += inv.amountPaidPaise;

      if (isOverdue) {
        overdueCount += 1;
        overdueAmountPaise += inv.remainingDuePaise;
      }

      return {
        invoiceId: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        relatedEvent: inv.relatedEvent
          ? {
              id: inv.relatedEvent._id.toString(),
              title: inv.relatedEvent.title,
              eventDate: inv.relatedEvent.eventDate,
            }
          : undefined,
        totalBillAmount: inv.grandTotal,
        amountReceived: inv.amountPaid,
        remainingDue: inv.remainingDue,
        paymentStatus: isOverdue ? 'OVERDUE' : inv.paymentStatus,
        paymentCount: inv.payments?.length || 0,
        isOverdue: !!isOverdue,
      };
    });

    return {
      totalCustomerDue: Math.round(totalCustomerDuePaise / 100 * 100) / 100,
      totalInvoiced: Math.round(totalInvoicedPaise / 100 * 100) / 100,
      totalCollected: Math.round(totalCollectedPaise / 100 * 100) / 100,
      overdueCount,
      overdueAmount: Math.round(overdueAmountPaise / 100 * 100) / 100,
      dues,
    };
  }

  /**
   * Soft-deletes an invoice.
   */
  async deleteInvoice(id: string, partnerId: string | Types.ObjectId): Promise<void> {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) {
      throw new NotFoundError('Invoice not found or has already been deleted');
    }

    if (invoice.payments && invoice.payments.length > 0) {
      throw new BadRequestError('Cannot delete an invoice that has payments recorded against it. Cancel payments first.');
    }

    invoice.isDeleted = true;
    invoice.deletedAt = new Date();
    invoice.deletedByPartner = partnerId as any;
    await invoice.save();
  }
}

export const invoiceService = new InvoiceService();
