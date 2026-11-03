import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingEvent } from '../types/booking.types';
import { BookingTable } from '../components/BookingTable';
import { BookingCard } from '../components/BookingCard';
import { DeleteBookingModal } from '../components/DeleteBookingModal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { SkeletonTable } from '../../../components/ui/Skeleton';

export const BookingListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deletingBooking, setDeletingBooking] = useState<BookingEvent | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch bookings using TanStack Query
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['bookings', { page, search: debouncedSearch }],
    queryFn: () =>
      bookingService.getBookings({
        page,
        limit: 10,
        search: debouncedSearch,
        sortBy: 'eventDate',
        sortOrder: 'desc',
      }),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingService.deleteBooking(id),
    onSuccess: () => {
      setDeletingBooking(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deletingBooking) return;
    await deleteMutation.mutateAsync(deletingBooking._id);
  };

  const bookings = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Catering Bookings & Events
            </h1>
            {isFetching && !isLoading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Maintain independent records of catering jobs, guest details, and execution dates.
          </p>
        </div>

        <Link to="/bookings/new">
          <Button leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto shadow-sm">
            New Booking / Event
          </Button>
        </Link>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Input
            placeholder="Search by event title, guest name, or phone number..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-200"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear
          </Button>
        )}
      </div>

      {/* 3. Error Banner */}
      {isError && (
        <Alert variant="error" title="Failed to Load Bookings">
          <div>{error instanceof Error ? error.message : 'An error occurred while communicating with the server.'}</div>
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-7">
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* 4. Loading Skeleton */}
      {isLoading ? (
        <SkeletonTable rows={6} columns={6} />
      ) : bookings.length === 0 ? (
        /* 5. Empty State */
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {debouncedSearch ? 'No matching bookings found' : 'No catering bookings yet'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {debouncedSearch
              ? `No records match "${debouncedSearch}". Try searching with a different name or phone number.`
              : 'Start logging upcoming catering assignments, client requirements, and contact details.'}
          </p>
          {!debouncedSearch && (
            <div className="mt-5">
              <Link to="/bookings/new">
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Booking
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* 6. Records Layout: Desktop Table & Mobile Cards */
        <div className="space-y-4">
          {/* Desktop View (>= lg) */}
          <div className="hidden lg:block shadow-sm">
            <BookingTable
              bookings={bookings}
              onDeleteClick={(booking) => setDeletingBooking(booking)}
            />
          </div>

          {/* Mobile & Tablet Card Grid (< lg) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onDeleteClick={(b) => setDeletingBooking(b)}
              />
            ))}
          </div>

          {/* 7. Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <div>
                Showing page <span className="font-semibold text-slate-900">{pagination.page}</span>{' '}
                of <span className="font-semibold text-slate-900">{pagination.totalPages}</span>{' '}
                ({pagination.totalItems} total {pagination.totalItems === 1 ? 'record' : 'records'})
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={!pagination.hasPrevPage}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <DeleteBookingModal
        isOpen={!!deletingBooking}
        onClose={() => setDeletingBooking(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
        bookingTitle={deletingBooking?.title || ''}
      />
    </div>
  );
};
