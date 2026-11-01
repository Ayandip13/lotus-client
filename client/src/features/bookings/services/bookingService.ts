import { apiClient } from '../../../services/api';
import { ApiResponse } from '../../../types';
import {
  BookingEvent,
  BookingFormData,
  BookingListResponse,
  BookingQueryParams,
} from '../types/booking.types';

export const bookingService = {
  /**
   * Retrieves a paginated list of bookings/events with search filters
   */
  async getBookings(params?: BookingQueryParams): Promise<BookingListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search && params.search.trim() !== '') {
      query.append('search', params.search.trim());
    }
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const endpoint = `/v1/events${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<BookingListResponse>>(endpoint);

    if (!response.data.data) {
      throw new Error('Failed to load bookings data');
    }

    return response.data.data;
  },

  /**
   * Retrieves single booking / event details by ID
   */
  async getBookingById(id: string): Promise<BookingEvent> {
    const response = await apiClient.get<ApiResponse<BookingEvent>>(`/v1/events/${id}`);
    if (!response.data.data) {
      throw new Error('Booking / Event not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new booking / event
   */
  async createBooking(data: BookingFormData): Promise<BookingEvent> {
    const response = await apiClient.post<ApiResponse<BookingEvent>>('/v1/events', data);
    if (!response.data.data) {
      throw new Error('Failed to create booking / event');
    }
    return response.data.data;
  },

  /**
   * Updates an existing booking / event
   */
  async updateBooking(id: string, data: Partial<BookingFormData>): Promise<BookingEvent> {
    const response = await apiClient.put<ApiResponse<BookingEvent>>(`/v1/events/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update booking / event');
    }
    return response.data.data;
  },

  /**
   * Deletes a booking / event (soft deletion on backend)
   */
  async deleteBooking(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/v1/events/${id}`);
  },
};
