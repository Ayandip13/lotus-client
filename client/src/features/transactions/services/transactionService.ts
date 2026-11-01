import { apiClient } from '../../../services/api';
import { ApiResponse } from '../../../types';
import {
  Transaction,
  TransactionListResponse,
  TransactionQueryParams,
} from '../types/transaction.types';

export const transactionService = {
  /**
   * Retrieves paginated financial transactions with filtering
   */
  async getTransactions(params?: TransactionQueryParams): Promise<TransactionListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.transactionType) query.append('transactionType', params.transactionType);
    if (params?.paymentSource) query.append('paymentSource', params.paymentSource);
    if (params?.partner) query.append('partner', params.partner);
    if (params?.relatedEvent) query.append('relatedEvent', params.relatedEvent);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search && params.search.trim() !== '') {
      query.append('search', params.search.trim());
    }
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const endpoint = `/v1/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<TransactionListResponse>>(endpoint);

    if (!response.data.data) {
      throw new Error('Failed to retrieve transactions');
    }

    return response.data.data;
  },

  /**
   * Retrieves single transaction details by ID
   */
  async getTransactionById(id: string): Promise<Transaction> {
    const response = await apiClient.get<ApiResponse<Transaction>>(`/v1/transactions/${id}`);
    if (!response.data.data) {
      throw new Error('Transaction record not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new transaction with optional file attachments (multipart/form-data)
   */
  async createTransaction(formData: FormData): Promise<Transaction> {
    const response = await apiClient.post<ApiResponse<Transaction>>('/v1/transactions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.data) {
      throw new Error('Failed to record financial transaction');
    }

    return response.data.data;
  },

  /**
   * Updates an existing transaction with optional additional attachments
   */
  async updateTransaction(id: string, formData: FormData): Promise<Transaction> {
    const response = await apiClient.put<ApiResponse<Transaction>>(`/v1/transactions/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.data) {
      throw new Error('Failed to update financial transaction');
    }

    return response.data.data;
  },

  /**
   * Soft-deletes a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/v1/transactions/${id}`);
  },
};
