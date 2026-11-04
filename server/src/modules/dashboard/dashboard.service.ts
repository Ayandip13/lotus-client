import { Event } from '../events/event.model';
import { Transaction } from '../transactions/transaction.model';
import { AccountService } from '../accounts/account.service';
import { cashCustodyService } from '../cashCustody/cashCustody.service';
import { invoiceService } from '../invoices/invoice.service';
import { vendorService } from '../vendors/vendor.service';

export class DashboardService {
  private accountService = new AccountService();

  /**
   * Compiles executive dashboard data matching all Phase 5 specifications.
   */
  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      upcomingEvents,
      overallFinancials,
      cashCustodyOverview,
      customerDues,
      vendorDues,
      recentTransactions,
    ] = await Promise.all([
      // 1. Upcoming Events (Chronological order)
      Event.find({
        isDeleted: false,
        eventDate: { $gte: today },
      })
        .sort({ eventDate: 1 })
        .limit(6)
        .select('title eventDate guestName guestPhone guestEmail guestAddress eventDetails')
        .lean(),

      // 2. Financial Overview from centralized ledger
      this.accountService.getOverallFinancialSummary(),

      // 3. Partner Cash Overview & Bank balance reconciliation
      cashCustodyService.getCashCustodyOverview(),

      // 4. Customer Dues
      invoiceService.getCustomerDues(),

      // 5. Vendor Dues
      vendorService.getVendorDues(),

      // 6. Recent Activity
      Transaction.find({ isDeleted: false })
        .populate('partner', 'name')
        .populate('relatedEvent', 'title')
        .populate('relatedInvoice', 'invoiceNumber')
        .populate('relatedVendorBill', 'billNumber')
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return {
      upcomingEvents,
      financialOverview: {
        totalBusinessIncome: overallFinancials.totalBusinessIncome,
        totalBusinessExpenses: overallFinancials.totalBusinessExpenses,
        commonBusinessBankBalance: cashCustodyOverview.commonBusinessBankBalance,
        totalBusinessCashInHand: cashCustodyOverview.totalBusinessCashInHand,
        totalCustomerDue: customerDues.totalCustomerDue,
        totalVendorDue: vendorDues.totalVendorDue,
      },
      partnerCashOverview: {
        partners: cashCustodyOverview.partners,
        totalBusinessCashInHand: cashCustodyOverview.totalBusinessCashInHand,
        commonBusinessBankBalance: cashCustodyOverview.commonBusinessBankBalance,
      },
      dueOverview: {
        customerDue: {
          totalDue: customerDues.totalCustomerDue,
          overdueCount: customerDues.overdueCount,
          overdueAmount: customerDues.overdueAmount,
        },
        vendorDue: {
          totalDue: vendorDues.totalVendorDue,
          overdueCount: vendorDues.overdueCount,
          overdueAmount: vendorDues.overdueAmount,
        },
      },
      recentActivity: recentTransactions,
    };
  }
}

export const dashboardService = new DashboardService();
