import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { cashCustodyService } from '../services/cashCustodyService';
import { queryKeys } from '../../../lib/queryKeys';

export const useCashCustodyOverview = () => {
  return useQuery({
    queryKey: queryKeys.cashCustody.overview(),
    queryFn: () => cashCustodyService.getOverview(),
    staleTime: 1000 * 60, // 1 minute freshness for cash custody overview
  });
};

export const useCashMovements = (params?: {
  page?: number;
  limit?: number;
  movementType?: string;
  partner?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.cashCustody.movements(params),
    queryFn: () => cashCustodyService.getMovements(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
};

export const useRecordCashMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      movementType: string;
      amount: number;
      movementDate?: string;
      fromPartner?: string;
      toPartner?: string;
      description: string;
      relatedEvent?: string;
    }) => cashCustodyService.recordMovement(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashCustody.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (variables.relatedEvent) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.financials(variables.relatedEvent) });
      }
    },
  });
};

