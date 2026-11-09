import { Types } from 'mongoose';
import { Invoice, IInvoice, IInvoiceLineItem, IInvoicePaymentRecord, IBusinessSnapshot } from './invoice.model';
import { Event } from '../events/event.model';
import { Transaction } from '../transactions/transaction.model';
import { CashMovement } from '../cashCustody/cashCustody.model';
import { Partner } from '../partners/partner.model';
import { CreateInvoiceInput, UpdateInvoiceInput, RecordInvoicePaymentInput, QueryInvoicesInput } from './invoice.schema';
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
    const prefix = `LC-${currentYear}-`;
    const lastInvoice = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .lean();

    let nextSeq = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/^LC-\d{4}-(\d+)$/);
      if (match && match[1]) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }
    return `LC-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Creates a new customer invoice (GST or Non-GST) with strict line-item calculations.
   */
  async createInvoice(partnerId: string | Types.ObjectId, data: CreateInvoiceInput): Promise<IInvoice> {
    let event = null;
    if (data.relatedEvent && data.relatedEvent.trim() !== '') {
      event = await Event.findOne({ _id: data.relatedEvent, isDeleted: false });
      if (!event) {
        throw new BadRequestError('Referenced event was not found or is deleted');
      }
    }

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

    // Business details: use provided input or configured env vars; do not inject fake bank details
    const defaultBusinessDetails: IBusinessSnapshot = {
      legalName: data.businessDetails?.legalName || process.env.BUSINESS_LEGAL_NAME || 'Lotus Caterer',
      address: data.businessDetails?.address || process.env.BUSINESS_ADDRESS || 'Kolkata, West Bengal',
      phone: data.businessDetails?.phone || process.env.BUSINESS_PHONE || '+91 98300 00000',
      email: data.businessDetails?.email || process.env.BUSINESS_EMAIL || 'contact@lotuscaterer.com',
      gstin: data.businessDetails?.gstin || process.env.BUSINESS_GSTIN || '',
      pan: data.businessDetails?.pan || process.env.BUSINESS_PAN || '',
      bankName: data.businessDetails?.bankName || process.env.BUSINESS_BANK_NAME || '',
      bankAccountNumber: data.businessDetails?.bankAccountNumber || process.env.BUSINESS_BANK_ACCOUNT || '',
      bankIfsc: data.businessDetails?.bankIfsc || process.env.BUSINESS_BANK_IFSC || '',
      bankBranch: data.businessDetails?.bankBranch || process.env.BUSINESS_BANK_BRANCH || '',
    };

    let invoice: IInvoice | null = null;
    let attempts = 0;

    while (attempts < 5) {
      attempts++;
      const invoiceNumber = await this.generateInvoiceNumber();

      try {
        invoice = new Invoice({
          invoiceNumber,
          invoiceType: data.invoiceType || 'NON_GST',
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          customerName: data.customerName && data.customerName.trim() !== '' ? data.customerName.trim() : 'Customer',
          customerPhone: data.customerPhone ? data.customerPhone.trim() : '',
          customerEmail: data.customerEmail || undefined,
          customerAddress: data.customerAddress || undefined,
          customerGstin: data.customerGstin || undefined,
          relatedEvent: event ? event._id : undefined,
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
        break;
      } catch (err: any) {
        if (err.code === 11000 && err.keyPattern?.invoiceNumber && attempts < 5) {
          continue; // Retry with next sequence number on concurrency collision
        }
        throw err;
      }
    }

    if (!invoice) {
      throw new BadRequestError('Failed to generate unique invoice sequence');
    }

    return invoice;
  }

  /**
   * Records a payment received from customer against an invoice.
   * Atomically connects to centralized financial ledger as BUSINESS_INCOME with compensating rollback.
   */
  async recordPayment(
    invoiceId: string,
    partnerId: string | Types.ObjectId,
    data: RecordInvoicePaymentInput
  ): Promise<IInvoice> {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new BadRequestError('Invalid invoice ID format');
    }

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

    // 1. Idempotency Key check: if an idempotency key was supplied and was already processed, return existing invoice
    if (data.idempotencyKey) {
      const existingPayment = invoice.payments.find((p) => p.idempotencyKey === data.idempotencyKey);
      if (existingPayment) {
        return invoice;
      }
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

    let createdTransaction: any = null;
    let createdCashMovement: any = null;

    try {
      // 1. Create centralized financial transaction as BUSINESS_INCOME
      createdTransaction = new Transaction({
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
      await createdTransaction.save();

      // 2. If cash payment, record cash custody movement
      if (data.paymentMethod === 'CASH' && assignedPartnerId) {
        createdCashMovement = new CashMovement({
          movementType: 'CASH_INCOME_ASSIGNED',
          amount: data.amount,
          amountPaise: paymentPaise,
          movementDate: new Date(data.paymentDate || Date.now()),
          toPartner: assignedPartnerId,
          sourceAccount: 'CUSTOMER',
          destinationAccount: 'PARTNER_CUSTODY',
          description: `Cash received from customer for invoice ${invoice.invoiceNumber}`,
          relatedEvent: invoice.relatedEvent,
          relatedTransaction: createdTransaction._id,
          createdByPartner: partnerId,
          isDeleted: false,
        });
        await createdCashMovement.save();

        createdTransaction.relatedCashMovement = createdCashMovement._id;
        await createdTransaction.save();
      }

      // 3. Update invoice payment records and balances
      const paymentRecord: IInvoicePaymentRecord = {
        amount: data.amount,
        amountPaise: paymentPaise,
        paymentDate: new Date(data.paymentDate || Date.now()),
        paymentMethod: data.paymentMethod,
        transactionRef: createdTransaction._id,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
        receivedByPartner: (assignedPartnerId || partnerId) as any,
        recordedAt: new Date(),
      };

      invoice.payments.push(paymentRecord);
      invoice.amountPaidPaise += paymentPaise;
      invoice.amountPaid = Math.round((invoice.amountPaidPaise / 100) * 100) / 100;
      invoice.remainingDuePaise = Math.max(0, invoice.grandTotalPaise - invoice.amountPaidPaise);
      invoice.remainingDue = Math.round((invoice.remainingDuePaise / 100) * 100) / 100;

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
    } catch (saveError) {
      // Compensating rollback on failure
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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid invoice ID format');
    }

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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid invoice ID format');
    }

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

  /**
   * Updates an existing invoice (when unpaid or recalculates grand total)
   */
  async updateInvoice(
    id: string,
    partnerId: string | Types.ObjectId,
    data: UpdateInvoiceInput
  ): Promise<IInvoice> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid invoice ID format');
    }

    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) {
      throw new NotFoundError('Invoice not found or has been deleted');
    }

    if (data.customerName !== undefined) invoice.customerName = data.customerName;
    if (data.customerPhone !== undefined) invoice.customerPhone = data.customerPhone;
    if (data.customerEmail !== undefined) invoice.customerEmail = data.customerEmail;
    if (data.customerAddress !== undefined) invoice.customerAddress = data.customerAddress;
    if (data.customerGstin !== undefined) invoice.customerGstin = data.customerGstin;
    if (data.invoiceDate !== undefined) invoice.invoiceDate = new Date(data.invoiceDate);
    if (data.dueDate !== undefined) invoice.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    if (data.invoiceType !== undefined) invoice.invoiceType = data.invoiceType;
    if (data.notes !== undefined) invoice.notes = data.notes;
    if (data.relatedEvent !== undefined) invoice.relatedEvent = data.relatedEvent as any;

    if (data.businessDetails) {
      invoice.businessDetails = {
        ...invoice.businessDetails,
        ...data.businessDetails,
      };
    }

    // If line items or discount changed, recalculate
    if (data.items || data.discount !== undefined || data.isInterState !== undefined) {
      const itemsToUse = data.items || invoice.items;
      const isInterState = data.isInterState !== undefined ? data.isInterState : (invoice.taxDetails?.isInterState ?? false);
      let subtotal = 0;
      let subtotalPaise = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      const processedItems: IInvoiceLineItem[] = itemsToUse.map((item: any) => {
        const amount = Math.round(item.quantity * item.rate * 100) / 100;
        const amountPaise = Math.round(amount * 100);
        subtotal += amount;
        subtotalPaise += amountPaise;

        let itemCgst = 0;
        let itemSgst = 0;
        let itemIgst = 0;

        if (invoice.invoiceType === 'GST' && item.gstRate && item.gstRate > 0) {
          const itemTax = Math.round(((amount * item.gstRate) / 100) * 100) / 100;
          if (isInterState) {
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

      const totalTax = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
      const totalTaxPaise = Math.round(totalTax * 100);

      const discount = data.discount !== undefined ? data.discount : invoice.discount;
      if (discount > subtotal) {
        throw new BadRequestError('Discount cannot exceed the subtotal amount');
      }

      const grandTotal = Math.round((subtotal - discount + totalTax) * 100) / 100;
      const grandTotalPaise = Math.round(grandTotal * 100);

      if (invoice.amountPaid > grandTotal) {
        throw new BadRequestError('Updated grand total cannot be less than the already collected amount');
      }

      const remainingDue = Math.round((grandTotal - invoice.amountPaid) * 100) / 100;
      const remainingDuePaise = Math.round(remainingDue * 100);

      invoice.items = processedItems as any;
      invoice.subtotal = subtotal;
      invoice.subtotalPaise = subtotalPaise;
      invoice.taxDetails =
        invoice.invoiceType === 'GST'
          ? {
              isInterState,
              totalCgst,
              totalSgst,
              totalIgst,
              totalTax,
              totalTaxPaise,
            }
          : undefined;
      invoice.discount = discount;
      invoice.discountPaise = Math.round(discount * 100);
      invoice.grandTotal = grandTotal;
      invoice.grandTotalPaise = grandTotalPaise;
      invoice.remainingDue = remainingDue;
      invoice.remainingDuePaise = remainingDuePaise;

      if (remainingDue === 0 && invoice.amountPaid > 0) {
        invoice.paymentStatus = 'PAID';
      } else if (invoice.amountPaid > 0) {
        invoice.paymentStatus = 'PARTIALLY_PAID';
      } else {
        invoice.paymentStatus = 'UNPAID';
      }
    }

    await invoice.save();
    return invoice;
  }
}

export const invoiceService = new InvoiceService();
