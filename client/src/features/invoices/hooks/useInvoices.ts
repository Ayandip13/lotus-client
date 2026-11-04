import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { invoiceService } from '../services/invoiceService';
import { CreateInvoicePayload } from '../types/invoice.types';
import { queryKeys } from '../../../lib/queryKeys';

export const useInvoices = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoiceService.getInvoices(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
};

export const useInvoiceDetails = (id: string) => {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoiceService.getInvoiceById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoiceService.createInvoice(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.relatedEvent) {
        const eventId = typeof data.relatedEvent === 'string' ? data.relatedEvent : (data.relatedEvent as any)._id;
        if (eventId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.events.financials(eventId) });
        }
      }
    },
  });
};

export const useRecordInvoicePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        amount: number;
        paymentMethod: string;
        paymentDate?: string;
        notes?: string;
        assignCashToPartner?: string;
        idempotencyKey?: string;
      };
    }) => invoiceService.recordPayment(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashCustody.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.relatedEvent) {
        const eventId = typeof data.relatedEvent === 'string' ? data.relatedEvent : (data.relatedEvent as any)._id;
        if (eventId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.events.financials(eventId) });
        }
      }
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceService.deleteInvoice(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.invoices.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};
