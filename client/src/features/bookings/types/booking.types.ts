import { PaginationMetadata } from '../../../types';

export interface CreatorPartner {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface BookingEvent {
  _id: string;
  title: string;
  eventDate: string;
  eventDetails?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestAddress?: string;
  createdByPartner: CreatorPartner;
  createdAt: string;
  updatedAt: string;
}

export interface BookingListResponse {
  items: BookingEvent[];
  pagination: PaginationMetadata;
}

export interface BookingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'eventDate' | 'createdAt' | 'title' | 'guestName';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingFormData {
  title: string;
  eventDate: string;
  eventDetails?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestAddress?: string;
}
