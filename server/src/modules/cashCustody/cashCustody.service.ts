import { Types } from 'mongoose';
import { CashMovement, ICashMovement, CashMovementType, AccountChannel } from './cashCustody.model';
import { Partner } from '../partners/partner.model';
import { Event } from '../events/event.model';
import { Transaction } from '../transactions/transaction.model';
import { CreateCashMovementInput, QueryCashMovementsInput } from './cashCustody.schema';
import { AccountService } from '../accounts/account.service';
import { BadRequestError, NotFoundError } from '../../utils/appError';
import { PaginationMetadata } from '../../types/api.types';

export interface PartnerCashBalance {
  partnerId: string;
  partnerName: string;
  partnerEmail?: string;
  partnerPhone?: string;
  cashInHand: number;
  cashInHandPaise: number;
}

export interface CashCustodyOverview {
  partners: PartnerCashBalance[];
  totalBusinessCashInHand: number;
  totalBusinessCashInHandPaise: number;
  commonBusinessBankBalance: number;
  commonBusinessTotalBalance: number;
}

export class CashCustodyService {
  private accountService = new AccountService();

  /**
   * Calculates current cash custody for a specific partner in paise.
   */
  async getPartnerCashBalancePaise(partnerId: string | Types.ObjectId): Promise<number> {
    const pId = new Types.ObjectId(partnerId.toString());

    // Incoming cash to partner
    const incomingResult = await CashMovement.aggregate([
      {
        $match: {
          isDeleted: false,
          toPartner: pId,
          movementType: {
            $in: ['CASH_INCOME_ASSIGNED', 'PARTNER_HANDOVER', 'BANK_WITHDRAWAL', 'OPENING_BALANCE'],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalIncomingPaise: { $sum: '$amountPaise' },
        },
      },
    ]);

    // Outgoing cash from partner
    const outgoingResult = await CashMovement.aggregate([
      {
        $match: {
          isDeleted: false,
          fromPartner: pId,
          movementType: {
            $in: ['PARTNER_HANDOVER', 'BANK_DEPOSIT', 'CASH_EXPENSE'],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOutgoingPaise: { $sum: '$amountPaise' },
        },
      },
    ]);

    const incoming = incomingResult[0]?.totalIncomingPaise || 0;
    const outgoing = outgoingResult[0]?.totalOutgoingPaise || 0;

    return incoming - outgoing;
  }

  /**
   * Records a cash custody movement with strict non-negative balance enforcement.
   */
  async recordCashMovement(
    creatorPartnerId: string | Types.ObjectId,
    data: CreateCashMovementInput
  ): Promise<ICashMovement> {
    const amountPaise = Math.round(data.amount * 100);

    // 1. Verify fromPartner if supplied
    let fromPartnerDoc = null;
    if (data.fromPartner) {
      fromPartnerDoc = await Partner.findById(data.fromPartner);
      if (!fromPartnerDoc || fromPartnerDoc.status !== 'ACTIVE') {
        throw new BadRequestError('Source partner not found or is inactive');
      }
    }

    // 2. Verify toPartner if supplied
    let toPartnerDoc = null;
    if (data.toPartner) {
      toPartnerDoc = await Partner.findById(data.toPartner);
      if (!toPartnerDoc || toPartnerDoc.status !== 'ACTIVE') {
        throw new BadRequestError('Destination partner not found or is inactive');
      }
    }

    // 3. Verify event if supplied
    if (data.relatedEvent && data.relatedEvent.trim() !== '') {
      const event = await Event.findOne({ _id: data.relatedEvent, isDeleted: false });
      if (!event) {
        throw new BadRequestError('Referenced event not found');
      }
    }

    // 4. Non-negative cash balance enforcement on outgoing movements
    if (
      data.fromPartner &&
      ['PARTNER_HANDOVER', 'BANK_DEPOSIT', 'CASH_EXPENSE'].includes(data.movementType)
    ) {
      const currentBalancePaise = await this.getPartnerCashBalancePaise(data.fromPartner);
      if (currentBalancePaise < amountPaise) {
        const availableRupees = (currentBalancePaise / 100).toFixed(2);
        throw new BadRequestError(
          `Insufficient cash custody: ${fromPartnerDoc?.name || 'Partner'} holds ₹${availableRupees}, but attempted to move/spend ₹${data.amount}`
        );
      }
    }

    // 5. Determine source and destination account channels
    let sourceAccount: AccountChannel = 'PARTNER_CUSTODY';
    let destinationAccount: AccountChannel = 'PARTNER_CUSTODY';

    switch (data.movementType) {
      case 'CASH_INCOME_ASSIGNED':
        sourceAccount = 'CUSTOMER';
        destinationAccount = 'PARTNER_CUSTODY';
        break;
      case 'PARTNER_HANDOVER':
        sourceAccount = 'PARTNER_CUSTODY';
        destinationAccount = 'PARTNER_CUSTODY';
        break;
      case 'BANK_DEPOSIT':
        sourceAccount = 'PARTNER_CUSTODY';
        destinationAccount = 'BANK';
        break;
      case 'BANK_WITHDRAWAL':
        sourceAccount = 'BANK';
        destinationAccount = 'PARTNER_CUSTODY';
        break;
      case 'CASH_EXPENSE':
        sourceAccount = 'PARTNER_CUSTODY';
        destinationAccount = 'EXPENSE';
        break;
      case 'OPENING_BALANCE':
        sourceAccount = 'PARTNER_CUSTODY';
        destinationAccount = 'PARTNER_CUSTODY';
        break;
    }

    const movement = new CashMovement({
      movementType: data.movementType,
      amount: data.amount,
      amountPaise,
      movementDate: new Date(data.movementDate || Date.now()),
      fromPartner: data.fromPartner ? new Types.ObjectId(data.fromPartner) : undefined,
      toPartner: data.toPartner ? new Types.ObjectId(data.toPartner) : undefined,
      sourceAccount,
      destinationAccount,
      description: data.description,
      relatedEvent: data.relatedEvent ? new Types.ObjectId(data.relatedEvent) : undefined,
      createdByPartner: creatorPartnerId,
      isDeleted: false,
    });

    await movement.save();

    // Synchronize ledger for direct cash expenses that reduce common business funds
    try {
      if (data.movementType === 'CASH_EXPENSE') {
        const transaction = new Transaction({
          transactionType: 'BUSINESS_EXPENSE',
          amount: data.amount,
          amountPaise,
          transactionDate: new Date(data.movementDate || Date.now()),
          description: data.description,
          paymentSource: 'COMMON_BUSINESS',
          partner: data.fromPartner ? new Types.ObjectId(data.fromPartner) : undefined,
          relatedEvent: data.relatedEvent ? new Types.ObjectId(data.relatedEvent) : undefined,
          relatedCashMovement: movement._id,
          createdByPartner: creatorPartnerId,
          attachments: [],
          isDeleted: false,
        });
        await transaction.save();
        movement.relatedTransaction = transaction._id as any;
        await movement.save();
      }
    } catch (txError) {
      // Compensating rollback: delete created movement if transaction creation fails
      await CashMovement.findByIdAndDelete(movement._id);
      throw txError;
    }

    return movement;
  }

  /**
   * Retrieves partner-wise business cash custody breakdown and bank balance reconciliation.
   */
  async getCashCustodyOverview(): Promise<CashCustodyOverview> {
    const activePartners = await Partner.find({ status: 'ACTIVE' }).sort({ name: 1 });

    let totalPhysicalCashPaise = 0;
    const partnerBalances: PartnerCashBalance[] = [];

    for (const partner of activePartners) {
      const balancePaise = await this.getPartnerCashBalancePaise(partner._id);
      totalPhysicalCashPaise += balancePaise;

      partnerBalances.push({
        partnerId: partner._id.toString(),
        partnerName: partner.name,
        partnerEmail: partner.email,
        partnerPhone: partner.phone,
        cashInHand: Math.round((balancePaise / 100) * 100) / 100,
        cashInHandPaise: balancePaise,
      });
    }

    // Aggregate total baseline opening physical cash across all non-deleted OPENING_BALANCE movements
    const openingResult = await CashMovement.aggregate([
      {
        $match: {
          isDeleted: false,
          movementType: 'OPENING_BALANCE',
        },
      },
      {
        $group: {
          _id: null,
          totalOpeningPaise: { $sum: '$amountPaise' },
        },
      },
    ]);
    const totalOpeningCashPaise = openingResult[0]?.totalOpeningPaise || 0;

    // Fetch operational ledger net from central accounting service (Income + Contributions - Expenses)
    const overallSummary = await this.accountService.getOverallFinancialSummary();
    const operationalLedgerBalancePaise = Math.round(overallSummary.commonBusinessBalance * 100);

    // Total Business Liquid Funds = Baseline Opening Cash + Operational Ledger Net
    const commonBusinessTotalBalancePaise = totalOpeningCashPaise + operationalLedgerBalancePaise;
    const commonBusinessTotalBalance = Math.round((commonBusinessTotalBalancePaise / 100) * 100) / 100;
    const totalBusinessCashInHand = Math.round((totalPhysicalCashPaise / 100) * 100) / 100;

    // Common Bank Balance = Total Business Liquid Funds - Total Physical Cash in Hand
    const commonBusinessBankBalance =
      Math.round(((commonBusinessTotalBalancePaise - totalPhysicalCashPaise) / 100) * 100) / 100;

    return {
      partners: partnerBalances,
      totalBusinessCashInHand,
      totalBusinessCashInHandPaise: totalPhysicalCashPaise,
      commonBusinessBankBalance,
      commonBusinessTotalBalance,
    };
  }

  /**
   * Retrieves cash movements history with filtering and pagination.
   */
  async getCashMovements(
    query: QueryCashMovementsInput
  ): Promise<{ items: ICashMovement[]; pagination: PaginationMetadata }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.movementType) {
      filter.movementType = query.movementType;
    }

    if (query.partner) {
      const partnerId = new Types.ObjectId(query.partner);
      filter.$or = [{ fromPartner: partnerId }, { toPartner: partnerId }];
    }

    if (query.startDate || query.endDate) {
      filter.movementDate = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        filter.movementDate.$gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.movementDate.$lte = end;
      }
    }

    if (query.search && query.search.trim() !== '') {
      filter.description = new RegExp(query.search.trim(), 'i');
    }

    const sortField = query.sortBy || 'movementDate';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [items, totalItems] = await Promise.all([
      CashMovement.find(filter)
        .populate('fromPartner', 'name email phone')
        .populate('toPartner', 'name email phone')
        .populate('createdByPartner', 'name email')
        .populate('relatedEvent', 'title eventDate')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      CashMovement.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: items as unknown as ICashMovement[],
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
}

export const cashCustodyService = new CashCustodyService();
