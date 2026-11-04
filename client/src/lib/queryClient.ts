import { QueryClient } from '@tanstack/react-query';

/**
 * Central QueryClient for Lotus Caterer Management System
 * Configured with enterprise resilience, proper staleTime vs gcTime policies,
 * and intelligent retry guards.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes default freshness
      gcTime: 1000 * 60 * 10,   // 10 minutes inactive cache retention
      retry: (failureCount, error: any) => {
        // Never retry client authentication/authorization or bad request errors (4xx)
        const status = error?.statusCode || error?.response?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Mutations should not retry automatically to prevent duplicate records
    },
  },
});
