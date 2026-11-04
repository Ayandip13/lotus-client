import { apiClient } from '../../../services/api';
import { ApiResponse } from '../../../types';

export interface DashboardFinancialOverview {
  totalBusinessIncome: number;
  totalBusinessExpenses: number;
  commonBusinessBankBalance: number;
  totalBusinessCashInHand: number;
  totalCustomerDue: number;
  totalVendorDue: number;
}

export interface DashboardPartnerCashOverview {
  partners: Array<{
    partnerId: string;
    partnerName: string;
    partnerPhone?: string;
    cashInHand: number;
  }>;
  totalBusinessCashInHand: number;
  commonBusinessBankBalance: number;
}

export interface DashboardDueOverview {
  customerDue: {
    totalDue: number;
    overdueCount: number;
    overdueAmount: number;
  };
  vendorDue: {
    totalDue: number;
    overdueCount: number;
    overdueAmount: number;
  };
}

export interface DashboardData {
  upcomingEvents: any[];
  financialOverview: DashboardFinancialOverview;
  partnerCashOverview: DashboardPartnerCashOverview;
  dueOverview: DashboardDueOverview;
  recentActivity: any[];
}

export const dashboardService = {
  /**
   * Retrieves high-level dashboard metrics with robust fallback
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const res = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('/dashboard route returned error or unavailable, falling back to aggregate queries:', err);
    }

    // Graceful fallback: Reconstruct dashboard view from available core endpoints
    const [summaryRes, eventsRes, transRes] = await Promise.all([
      apiClient.get<ApiResponse<any>>('/accounts/summary').catch(() => null),
      apiClient.get<ApiResponse<any>>('/events?limit=5').catch(() => null),
      apiClient.get<ApiResponse<any>>('/transactions?limit=5').catch(() => null),
    ]);

    const acc = summaryRes?.data?.data || {};
    return {
      financialOverview: {
        totalBusinessIncome: acc.totalBusinessIncome || 0,
        totalBusinessExpenses: acc.totalBusinessExpenses || 0,
        commonBusinessBankBalance: acc.commonBusinessBankBalance || 0,
        totalBusinessCashInHand: acc.totalBusinessCashInHand || 0,
        totalCustomerDue: 0,
        totalVendorDue: 0,
      },
      upcomingEvents: eventsRes?.data?.data?.items || eventsRes?.data?.data?.events || [],
      partnerCashOverview: {
        partners: [],
        totalBusinessCashInHand: acc.totalBusinessCashInHand || 0,
        commonBusinessBankBalance: acc.commonBusinessBankBalance || 0,
      },
      dueOverview: {
        customerDue: { totalDue: 0, overdueCount: 0, overdueAmount: 0 },
        vendorDue: { totalDue: 0, overdueCount: 0, overdueAmount: 0 },
      },
      recentActivity: transRes?.data?.data?.items || transRes?.data?.data?.transactions || [],
    };
  },
};

