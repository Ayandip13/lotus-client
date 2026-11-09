import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  CalendarDays,
  RefreshCw,
  Clock,
  History,
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
import { cn } from '../../../lib/utils';

export const BookingListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deletingBooking, setDeletingBooking] = useState<BookingEvent | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch bookings using TanStack Query
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.events.list({ page, search: debouncedSearch }),
    queryFn: () =>
      bookingService.getBookings({
        page,
        limit: 50,
        search: debouncedSearch,
        sortBy: 'eventDate',
        sortOrder: 'desc',
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingService.deleteBooking(id),
    onSuccess: () => {
      setDeletingBooking(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deletingBooking) return;
    await deleteMutation.mutateAsync(deletingBooking._id);
  };

  const allBookings = data?.items || [];

  // Filter into Upcoming vs Past based on today's start of day
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const upcoming: BookingEvent[] = [];
    const past: BookingEvent[] = [];

    allBookings.forEach((b) => {
      const eventTime = new Date(b.eventDate).getTime();
      if (eventTime >= today) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    });

    // Upcoming sorted nearest first
    upcoming.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    // Past sorted newest first
    past.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [allBookings, today]);

  // Current list depending on activeTab
  const displayedBookings = useMemo(() => {
    if (activeTab === 'UPCOMING') return upcomingBookings;
    if (activeTab === 'PAST') return pastBookings;
    return allBookings;
  }, [activeTab, upcomingBookings, pastBookings, allBookings]);

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Booking & Events
            </h1>
            {isFetching && !isLoading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Create and manage catering assignments, client contact details, and dates.
          </p>
        </div>

        <Link to="/bookings/new">
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            New Event
          </Button>
        </Link>
      </div>

      {/* 2. Khatabook-Style Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Simple Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-semibold select-none self-start">
          <button
            type="button"
            onClick={() => setActiveTab('UPCOMING')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'UPCOMING'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upcoming ({upcomingBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PAST')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'PAST'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Past Events ({pastBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <span>All ({allBookings.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search event, guest or phone..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-200 h-9 text-xs"
          />
        </div>
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
        <SkeletonTable rows={6} columns={5} />
      ) : displayedBookings.length === 0 ? (
        /* 5. Empty State */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {debouncedSearch
                ? 'No matching events found'
                : activeTab === 'UPCOMING'
                ? 'No upcoming catering events scheduled'
                : activeTab === 'PAST'
                ? 'No past completed events found'
                : 'No catering events yet'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {debouncedSearch
                ? `No records match "${debouncedSearch}". Try searching with a different name or phone number.`
                : 'Start by creating a catering event. You can save with whatever details you have now!'}
            </p>
          </div>

          {!debouncedSearch && (
            <div className="pt-2">
              <Link to="/bookings/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" leftIcon={<Plus className="w-4 h-4" />}>
                  + Create Event
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* 6. Records Layout: Desktop Table & Mobile Cards */
        <div className="space-y-4">
          {/* Desktop View (>= lg) */}
          <div className="hidden lg:block shadow-xs rounded-2xl overflow-hidden border border-slate-200/90 bg-white">
            <BookingTable
              bookings={displayedBookings}
              onDeleteClick={(booking) => setDeletingBooking(booking)}
            />
          </div>

          {/* Mobile & Tablet Card Grid (< lg) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {displayedBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onDeleteClick={(b) => setDeletingBooking(b)}
              />
            ))}
          </div>
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
