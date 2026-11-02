import { apiClient } from '../../../services/api';
import { InvoiceItem, CreateInvoicePayload } from '../types/invoice.types';
import { PaginationMetadata } from '../../../types';

export const invoiceService = {
  getInvoices: async (params?: {
    page?: number;
    limit?: number;
    invoiceType?: string;
    paymentStatus?: string;
    relatedEvent?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{ items: InvoiceItem[]; pagination: PaginationMetadata }> => {
    const res = await apiClient.get('/invoices', { params });
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

  getInvoiceById: async (id: string): Promise<InvoiceItem> => {
    const res = await apiClient.get(`/invoices/${id}`);
    return res.data.data;
  },

  createInvoice: async (payload: CreateInvoicePayload): Promise<InvoiceItem> => {
    const res = await apiClient.post('/invoices', payload);
    return res.data.data;
  },

  recordPayment: async (
    id: string,
    payload: {
      amount: number;
      paymentMethod: string;
      paymentDate?: string;
      notes?: string;
      assignCashToPartner?: string;
    }
  ): Promise<InvoiceItem> => {
    const res = await apiClient.post(`/invoices/${id}/payments`, payload);
    return res.data.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },
};
