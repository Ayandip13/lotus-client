import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardData } from '../services/dashboardService';
import { queryKeys } from '../../../lib/queryKeys';

export const useDashboard = () => {
  return useQuery<DashboardData, Error>({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 1000 * 60, // 1 minute freshness for executive dashboard
  });
};

