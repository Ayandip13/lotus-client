import { apiClient } from '../../../services/api';
import { ApiResponse } from '../../../types';
import {
  FinancialSummary,
  PartnerFinancialSummary,
  DateWiseFinancialResult,
} from '../../transactions/types/transaction.types';

export const accountService = {
  /**
   * Fetches overall business financial summary
   */
  async getOverallSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    const endpoint = `/v1/accounts/summary${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<FinancialSummary>>(endpoint);

    if (!response.data.data) {
      throw new Error('Failed to retrieve financial summary');
    }

    return response.data.data;
  },

  /**
   * Fetches partner-wise financial aggregates for all three partners
   */
  async getPartnerSummaries(): Promise<PartnerFinancialSummary[]> {
    const response = await apiClient.get<ApiResponse<PartnerFinancialSummary[]>>('/v1/accounts/partners');
    if (!response.data.data) {
      throw new Error('Failed to retrieve partner financial summaries');
    }
    return response.data.data;
  },

  /**
   * Fetches specific partner's financial history and linked transactions
   */
  async getPartnerDetails(partnerId: string) {
    const response = await apiClient.get<ApiResponse<any>>(`/v1/accounts/partners/${partnerId}`);
    if (!response.data.data) {
      throw new Error('Failed to retrieve partner financial details');
    }
    return response.data.data;
  },

  /**
   * Fetches date-wise expenses and transactions for a selected calendar date
   */
  async getDateWiseHistory(dateString: string): Promise<DateWiseFinancialResult> {
    const response = await apiClient.get<ApiResponse<DateWiseFinancialResult>>(
      `/v1/accounts/date-wise?date=${encodeURIComponent(dateString)}`
    );
    if (!response.data.data) {
      throw new Error('Failed to retrieve date-wise financial history');
    }
    return response.data.data;
  },
};
