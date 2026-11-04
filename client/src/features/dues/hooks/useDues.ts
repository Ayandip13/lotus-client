import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dueService } from '../services/dueService';
import { queryKeys } from '../../../lib/queryKeys';

// Customer Dues
export const useCustomerDues = (params?: { relatedEvent?: string; customerName?: string; search?: string; status?: string }) => {
  return useQuery({
    queryKey: queryKeys.dues.customer(params),
    queryFn: () => dueService.getCustomerDues(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useRecordCustomerPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: string;
      payload: {
        amount: number;
        paymentMethod: string;
        paymentDate?: string;
        notes?: string;
        assignCashToPartner?: string;
        idempotencyKey?: string;
      };
    }) => dueService.recordCustomerPayment(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashCustody.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};

// Vendor Dues
export const useVendorDues = (params?: { vendor?: string; relatedEvent?: string; search?: string; status?: string }) => {
  return useQuery({
    queryKey: queryKeys.dues.vendor(params),
    queryFn: () => dueService.getVendorDues(params),
    staleTime: 1000 * 60 * 2,
  });
};

// Vendors Directory
export const useVendors = (params?: { search?: string; category?: string }) => {
  return useQuery({
    queryKey: queryKeys.vendors.list(params),
    queryFn: () => dueService.getVendors(params),
    staleTime: 1000 * 60 * 5, // 5 minutes freshness for master vendor directory
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      phone: string;
      email?: string;
      category: string;
      address?: string;
      bankDetails?: string;
    }) => dueService.createVendor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() });
    },
  });
};

export const useCreateVendorBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      vendor: string;
      relatedEvent?: string;
      billNumber?: string;
      billDate: string;
      dueDate?: string;
      description: string;
      totalAmount: number;
    }) => dueService.createVendorBill(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dues.vendor() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.bills() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (variables.relatedEvent) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.financials(variables.relatedEvent) });
      }
    },
  });
};

export const useRecordVendorPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      billId,
      payload,
    }: {
      billId: string;
      payload: {
        amount: number;
        paymentSource: 'COMMON_BUSINESS' | 'PARTNER_PERSONAL';
        paidByPartner?: string;
        paymentDate?: string;
        notes?: string;
        deductFromPartnerCash?: boolean;
        idempotencyKey?: string;
      };
    }) => dueService.recordVendorPayment(billId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dues.vendor() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.bills() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashCustody.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};
