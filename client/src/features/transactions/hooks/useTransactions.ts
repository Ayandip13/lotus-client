import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import { TransactionQueryParams } from '../types/transaction.types';
import { queryKeys } from '../../../lib/queryKeys';

export const useTransactions = (params?: TransactionQueryParams) => {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => transactionService.getTransactions(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
};

export const useTransactionDetails = (id: string) => {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionService.getTransactionById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => transactionService.createTransaction(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
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

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      transactionService.updateTransaction(id, formData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
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

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.transactions.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};

