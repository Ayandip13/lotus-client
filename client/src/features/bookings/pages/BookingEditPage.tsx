import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BookingFormData } from '../types/booking.types';
import { BookingForm } from '../components/BookingForm';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { SkeletonForm } from '../../../components/ui/Skeleton';
import { useBookingDetails, useUpdateBooking } from '../hooks/useBookings';

export const BookingEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookingDetails(id || '');

  const updateMutation = useUpdateBooking();

  const handleSubmit = async (data: BookingFormData) => {
    if (!id) return;
    try {
      setErrorMessage(null);
      await updateMutation.mutateAsync({ id, data });
      setSuccessMessage('Booking details updated successfully!');

      setTimeout(() => {
        navigate(`/bookings/${id}`);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update booking. Please check input fields.');
    }
  };

  if (isLoading) {
    return <SkeletonForm fields={6} />;
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
        <Alert variant="error" title="Failed to Load Booking">
          <div>{error instanceof Error ? error.message : 'Booking record could not be loaded.'}</div>
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
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          to={`/bookings/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Details</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Catering Booking
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the booking details, scheduled event date, or guest contact information.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <Alert variant="success" title="Saved">
          {successMessage}
        </Alert>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <Alert variant="error" title="Update Failed">
          {errorMessage}
        </Alert>
      )}

      {/* Prefilled Form */}
      <BookingForm
        initialData={{
          title: booking.title,
          eventDate: booking.eventDate,
          eventDetails: booking.eventDetails,
          guestName: booking.guestName,
          guestPhone: booking.guestPhone,
          guestEmail: booking.guestEmail,
          guestAddress: booking.guestAddress,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save Changes"
        cancelHref={`/bookings/${id}`}
      />
    </div>
  );
};
