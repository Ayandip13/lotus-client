import { apiClient } from '../../../services/api';
import { CashCustodyOverview, CashMovementItem } from '../types/cashCustody.types';
import { PaginationMetadata } from '../../../types';

export const cashCustodyService = {
  getOverview: async (): Promise<CashCustodyOverview> => {
    const res = await apiClient.get('/cash-custody/overview');
    return res.data.data;
  },

  getMovements: async (params?: {
    page?: number;
    limit?: number;
    movementType?: string;
    partner?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{ items: CashMovementItem[]; pagination: PaginationMetadata }> => {
    const res = await apiClient.get('/cash-custody', { params });
    const payload = res.data?.data;
    if (payload && Array.isArray(payload.items)) {
      return {
        items: payload.items,
        pagination: payload.pagination || {
          page: 1,
          limit: 20,
          totalItems: payload.items.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    if (Array.isArray(payload)) {
      return {
        items: payload,
        pagination: res.data?.pagination || {
          page: 1,
          limit: 20,
          totalItems: payload.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return {
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  recordMovement: async (payload: {
    movementType: string;
    amount: number;
    movementDate?: string;
    fromPartner?: string;
    toPartner?: string;
    description: string;
    relatedEvent?: string;
  }): Promise<CashMovementItem> => {
    const res = await apiClient.post('/cash-custody/movements', payload);
    return res.data.data;
  },
};
