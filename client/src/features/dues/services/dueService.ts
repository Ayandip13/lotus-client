import { apiClient } from '../../../services/api';
import { CustomerDuesSummary, VendorDuesSummary, VendorItem } from '../types/due.types';

export const dueService = {
  // Customer Dues
  getCustomerDues: async (params?: { relatedEvent?: string; customerName?: string }): Promise<CustomerDuesSummary> => {
    const res = await apiClient.get('/invoices/dues', { params });
    return res.data.data;
  },

  recordCustomerPayment: async (
    invoiceId: string,
    payload: {
      amount: number;
      paymentMethod: string;
      paymentDate?: string;
      notes?: string;
      assignCashToPartner?: string;
      idempotencyKey?: string;
    }
  ) => {
    const key =
      payload.idempotencyKey ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-cust-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    const res = await apiClient.post(
      `/invoices/${invoiceId}/payments`,
      { ...payload, idempotencyKey: key },
      { headers: { 'Idempotency-Key': key } }
    );
    return res.data.data;
  },

  // Vendor Dues & Directory
  getVendorDues: async (params?: { vendor?: string; relatedEvent?: string }): Promise<VendorDuesSummary> => {
    const res = await apiClient.get('/vendors/dues', { params });
    return res.data.data;
  },

  getVendors: async (params?: { search?: string; category?: string }): Promise<VendorItem[]> => {
    const res = await apiClient.get('/vendors', { params });
    return res.data.data;
  },

  createVendor: async (payload: {
    name: string;
    phone: string;
    email?: string;
    category: string;
    address?: string;
    bankDetails?: string;
  }): Promise<VendorItem> => {
    const res = await apiClient.post('/vendors', payload);
    return res.data.data;
  },

  createVendorBill: async (payload: {
    vendor: string;
    relatedEvent?: string;
    billNumber?: string;
    billDate: string;
    dueDate?: string;
    description: string;
    totalAmount: number;
  }) => {
    const res = await apiClient.post('/vendors/bills', payload);
    return res.data.data;
  },

  recordVendorPayment: async (
    billId: string,
    payload: {
      amount: number;
      paymentSource: 'COMMON_BUSINESS' | 'PARTNER_PERSONAL';
      paidByPartner?: string;
      paymentDate?: string;
      notes?: string;
      deductFromPartnerCash?: boolean;
      idempotencyKey?: string;
    }
  ) => {
    const key =
      payload.idempotencyKey ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-vend-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    // Pass idempotencyKey safely in body so CORS preflights never block on custom headers
    const res = await apiClient.post(`/vendors/bills/${billId}/payments`, {
      ...payload,
      idempotencyKey: key,
    });
    return res.data.data;
  },

  getVendorBillById: async (billId: string) => {
    const res = await apiClient.get(`/vendors/bills/${billId}`);
    return res.data.data;
  },

  deleteVendorBill: async (billId: string): Promise<void> => {
    await apiClient.delete(`/vendors/bills/${billId}`);
  },

  updateVendorBill: async (
    billId: string,
    payload: {
      vendor?: string;
      relatedEvent?: string;
      billNumber?: string;
      billDate?: string;
      dueDate?: string;
      description?: string;
      totalAmount?: number;
    }
  ) => {
    const res = await apiClient.put(`/vendors/bills/${billId}`, payload);
    return res.data.data;
  },
};
