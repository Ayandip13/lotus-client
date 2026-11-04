import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { BookingQueryParams, BookingFormData } from '../types/booking.types';
import { queryKeys } from '../../../lib/queryKeys';
import { apiClient } from '../../../services/api';

export const useBookings = (params?: BookingQueryParams) => {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => bookingService.getBookings(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
};

export const useBookingDetails = (id: string) => {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => bookingService.getBookingById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
};

export const useEventFinancials = (id: string) => {
  return useQuery({
    queryKey: queryKeys.events.financials(id),
    queryFn: async () => {
      const res = await apiClient.get(`/events/${id}/financials`);
      return res.data?.data;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookingFormData) => bookingService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookingFormData> }) =>
      bookingService.updateBooking(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingService.deleteBooking(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};
