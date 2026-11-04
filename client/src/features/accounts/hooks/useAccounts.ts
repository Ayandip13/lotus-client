import { useQuery } from '@tanstack/react-query';
import { accountService } from '../services/accountService';
import { queryKeys } from '../../../lib/queryKeys';

export const useOverallSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: queryKeys.accounts.summary({ startDate, endDate }),
    queryFn: () => accountService.getOverallSummary(startDate, endDate),
    staleTime: 1000 * 60 * 2,
  });
};

export const usePartnerSummaries = () => {
  return useQuery({
    queryKey: queryKeys.accounts.partners(),
    queryFn: () => accountService.getPartnerSummaries(),
    staleTime: 1000 * 60 * 2,
  });
};

export const usePartnerDetails = (partnerId: string) => {
  return useQuery({
    queryKey: queryKeys.accounts.partnerDetail(partnerId),
    queryFn: () => accountService.getPartnerDetails(partnerId),
    enabled: Boolean(partnerId),
    staleTime: 1000 * 60 * 2,
  });
};

export const useDateWiseHistory = (dateString: string) => {
  return useQuery({
    queryKey: queryKeys.accounts.dateWise(dateString),
    queryFn: () => accountService.getDateWiseHistory(dateString),
    enabled: Boolean(dateString),
    staleTime: 1000 * 60 * 2,
  });
};

