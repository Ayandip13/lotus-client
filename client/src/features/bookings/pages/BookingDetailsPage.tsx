import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Edit3,
  Trash2,
  FileText,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { DeleteBookingModal } from '../components/DeleteBookingModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';
import { SkeletonDetails } from '../../../components/ui/Skeleton';
import { EventFinancialHub } from '../components/EventFinancialHub';

export const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.events.detail(id || ''),
    queryFn: () => bookingService.getBookingById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => bookingService.deleteBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      navigate('/bookings');
    },
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return <SkeletonDetails />;
  }

  if (isError || !booking) {
    return (
      <div className="space-y-4">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bookings</span>
        </Link>
        <Alert variant="error" title="Booking Not Found">
          <div>{error instanceof Error ? error.message : 'The requested booking could not be loaded.'}</div>
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-7">
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header with Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Bookings</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {booking.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="neutral" className="gap-1 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDate(booking.eventDate)}</span>
            </Badge>
            <Badge variant="success" className="gap-1 py-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Logged by {booking.createdByPartner?.name || 'Partner'}</span>
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link to={`/bookings/${booking._id}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
              Edit Booking
            </Button>
          </Link>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* 2. Content Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2 spans): Event Details & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold">Event Description & Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {booking.eventDetails ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {booking.eventDetails}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No additional notes or menu specifications recorded for this booking.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Audit Stamp & Partner Tracking */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold">Audit & Record History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Created by Partner</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {booking.createdByPartner?.name || 'Partner Account'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Record Created</span>
                <span className="font-mono text-slate-700">{formatTimestamp(booking.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Last Modified</span>
                <span className="font-mono text-slate-700">{formatTimestamp(booking.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column (1 span): Guest & Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold">Guest & Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">
                  Guest Name
                </span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">
                  {booking.guestName}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">
                  Contact Number
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href={`tel:${booking.guestPhone}`}
                    className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline"
                  >
                    {booking.guestPhone}
                  </a>
                </div>
              </div>

              {booking.guestEmail && (
                <div>
                  <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">
                    Email Address
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <a
                      href={`mailto:${booking.guestEmail}`}
                      className="text-sm text-slate-700 hover:underline truncate"
                    >
                      {booking.guestEmail}
                    </a>
                  </div>
                </div>
              )}

              {booking.guestAddress && (
                <div>
                  <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">
                    Venue / Address
                  </span>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {booking.guestAddress}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dedicated Event Financial Hub */}
      <EventFinancialHub eventId={booking._id} />

      {/* Delete Confirmation Modal */}
      <DeleteBookingModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        isDeleting={deleteMutation.isPending}
        bookingTitle={booking.title}
      />
    </div>
  );
};
