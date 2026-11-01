import mongoose, { Types } from 'mongoose';
import { Transaction } from '../transactions/transaction.model';
import { Partner } from '../partners/partner.model';

export interface FinancialSummaryResult {
  totalBusinessIncome: number;
  totalBusinessExpenses: number;
  totalPartnerContributions: number;
  commonBusinessBalance: number;
  commonAccountExpenses: number;
  partnerPersonallyPaidExpenses: number;
  currency: string;
}

export interface PartnerFinancialSummary {
  partnerId: string;
  partnerName: string;
  partnerEmail?: string;
  partnerPhone?: string;
  totalContributions: number;
  totalPersonallyPaidExpenses: number;
  transactionCount: number;
}

export interface DateWiseFinancialResult {
  targetDate: string; // YYYY-MM-DD
  totalTransactions: number;
  totalExpenses: number;
  commonAccountExpenses: number;
  partnerPaidExpenses: number;
  totalIncome: number;
  totalContributions: number;
  transactions: any[];
}

export class AccountService {
  /**
   * Calculates overall business financial overview from the centralized ledger.
   * All sums use integer paise to eliminate floating-point precision inaccuracies.
   */
  async getOverallFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummaryResult> {
    const matchFilter: Record<string, any> = { isDeleted: false };

    if (startDate || endDate) {
      matchFilter.transactionDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchFilter.transactionDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.transactionDate.$lte = end;
      }
    }

    const aggregation = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          // 1. Business Income (excludes partner contributions)
          incomePaise: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'BUSINESS_INCOME'] }, '$amountPaise', 0],
            },
          },
          // 2. Partner Contributions (funds injected into common business, not revenue)
          contributionsPaise: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'PARTNER_CONTRIBUTION'] }, '$amountPaise', 0],
            },
          },
          // 3. Expenses paid using Common Business funds
          commonExpensesPaise: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$transactionType', 'BUSINESS_EXPENSE'] },
                    { $eq: ['$paymentSource', 'COMMON_BUSINESS'] },
                  ],
                },
                '$amountPaise',
                0,
              ],
            },
          },
          // 4. Expenses personally paid by a partner (not deducted from common business cash)
          partnerPaidExpensesPaise: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$transactionType', 'BUSINESS_EXPENSE'] },
                    { $eq: ['$paymentSource', 'PARTNER_PERSONAL'] },
                  ],
                },
                '$amountPaise',
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = aggregation[0] || {
      incomePaise: 0,
      contributionsPaise: 0,
      commonExpensesPaise: 0,
      partnerPaidExpensesPaise: 0,
    };

    const incomePaise = stats.incomePaise || 0;
    const contributionsPaise = stats.contributionsPaise || 0;
    const commonExpensesPaise = stats.commonExpensesPaise || 0;
    const partnerPaidExpensesPaise = stats.partnerPaidExpensesPaise || 0;

    // Total Business Expenses includes both payment sources
    const totalExpensesPaise = commonExpensesPaise + partnerPaidExpensesPaise;

    // Common Business Balance = Income + Partner Contributions - Common Account Expenses
    const commonBusinessBalancePaise = incomePaise + contributionsPaise - commonExpensesPaise;

    return {
      totalBusinessIncome: incomePaise / 100,
      totalBusinessExpenses: totalExpensesPaise / 100,
      totalPartnerContributions: contributionsPaise / 100,
      commonBusinessBalance: commonBusinessBalancePaise / 100,
      commonAccountExpenses: commonExpensesPaise / 100,
      partnerPersonallyPaidExpenses: partnerPaidExpensesPaise / 100,
      currency: 'INR',
    };
  }

  /**
   * Computes partner-wise financial aggregates for all three partners.
   */
  async getPartnerWiseSummaries(): Promise<PartnerFinancialSummary[]> {
    const partners = await Partner.find({ status: 'ACTIVE' }).sort({ createdAt: 1 }).lean();

    const partnerSummaries: PartnerFinancialSummary[] = [];

    for (const p of partners) {
      const partnerId = p._id as Types.ObjectId;

      const agg = await Transaction.aggregate([
        {
          $match: {
            isDeleted: false,
            partner: partnerId,
          },
        },
        {
          $group: {
            _id: null,
            totalContributionsPaise: {
              $sum: {
                $cond: [{ $eq: ['$transactionType', 'PARTNER_CONTRIBUTION'] }, '$amountPaise', 0],
              },
            },
            totalPersonallyPaidPaise: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$transactionType', 'BUSINESS_EXPENSE'] },
                      { $eq: ['$paymentSource', 'PARTNER_PERSONAL'] },
                    ],
                  },
                  '$amountPaise',
                  0,
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const data = agg[0] || { totalContributionsPaise: 0, totalPersonallyPaidPaise: 0, count: 0 };

      partnerSummaries.push({
        partnerId: partnerId.toString(),
        partnerName: p.name,
        partnerEmail: p.email,
        partnerPhone: p.phone,
        totalContributions: (data.totalContributionsPaise || 0) / 100,
        totalPersonallyPaidExpenses: (data.totalPersonallyPaidPaise || 0) / 100,
        transactionCount: data.count || 0,
      });
    }

    return partnerSummaries;
  }

  /**
   * Retrieves individual partner's financial history and linked transactions.
   */
  async getPartnerFinancialDetails(partnerId: string) {
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID format');
    }

    const partnerDoc = await Partner.findById(partnerId);
    if (!partnerDoc) {
      throw new Error('Partner not found');
    }

    const transactions = await Transaction.find({
      isDeleted: false,
      partner: new Types.ObjectId(partnerId),
    })
      .sort({ transactionDate: -1 })
      .populate([
        { path: 'relatedEvent', select: 'title eventDate guestName' },
        { path: 'createdByPartner', select: 'name' },
      ])
      .lean();

    let contributionsPaise = 0;
    let personalExpensesPaise = 0;

    for (const tx of transactions) {
      if (tx.transactionType === 'PARTNER_CONTRIBUTION') {
        contributionsPaise += tx.amountPaise;
      } else if (tx.transactionType === 'BUSINESS_EXPENSE' && tx.paymentSource === 'PARTNER_PERSONAL') {
        personalExpensesPaise += tx.amountPaise;
      }
    }

    return {
      partner: {
        id: partnerDoc._id,
        name: partnerDoc.name,
        email: partnerDoc.email,
        phone: partnerDoc.phone,
        status: partnerDoc.status,
      },
      summary: {
        totalContributions: contributionsPaise / 100,
        totalPersonallyPaidExpenses: personalExpensesPaise / 100,
        transactionCount: transactions.length,
      },
      transactions,
    };
  }

  /**
   * Retrieves date-specific transactions and expenses for the specified calendar date.
   */
  async getDateWiseFinancialHistory(dateString: string): Promise<DateWiseFinancialResult> {
    const cleanDateStr = dateString.split('T')[0];
    const parts = cleanDateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error('Invalid date string format. Use YYYY-MM-DD');
    }
    const [year, month, day] = parts;

    // Boundary covering Asia/Kolkata timezone (UTC+5:30) and UTC for the target calendar date
    const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const startOfIstDay = new Date(utcMidnight.getTime() - 5.5 * 3600 * 1000);
    const endOfUtcDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const transactions = await Transaction.find({
      isDeleted: false,
      transactionDate: { $gte: startOfIstDay, $lte: endOfUtcDay },
    })
      .sort({ createdAt: -1 })
      .populate([
        { path: 'partner', select: 'name email phone' },
        { path: 'relatedEvent', select: 'title eventDate guestName guestPhone' },
        { path: 'createdByPartner', select: 'name' },
      ])
      .lean();

    let totalExpensesPaise = 0;
    let commonExpensesPaise = 0;
    let partnerPaidExpensesPaise = 0;
    let incomePaise = 0;
    let contributionsPaise = 0;

    for (const tx of transactions) {
      if (tx.transactionType === 'BUSINESS_EXPENSE') {
        totalExpensesPaise += tx.amountPaise;
        if (tx.paymentSource === 'COMMON_BUSINESS') {
          commonExpensesPaise += tx.amountPaise;
        } else if (tx.paymentSource === 'PARTNER_PERSONAL') {
          partnerPaidExpensesPaise += tx.amountPaise;
        }
      } else if (tx.transactionType === 'BUSINESS_INCOME') {
        incomePaise += tx.amountPaise;
      } else if (tx.transactionType === 'PARTNER_CONTRIBUTION') {
        contributionsPaise += tx.amountPaise;
      }
    }

    return {
      targetDate: cleanDateStr,
      totalTransactions: transactions.length,
      totalExpenses: totalExpensesPaise / 100,
      commonAccountExpenses: commonExpensesPaise / 100,
      partnerPaidExpenses: partnerPaidExpensesPaise / 100,
      totalIncome: incomePaise / 100,
      totalContributions: contributionsPaise / 100,
      transactions,
    };
  }
}

export const accountService = new AccountService();
