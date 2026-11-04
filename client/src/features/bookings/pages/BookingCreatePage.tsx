import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingFormData } from '../types/booking.types';
import { BookingForm } from '../components/BookingForm';
import { Alert } from '../../../components/ui/Alert';
import { useCreateBooking } from '../hooks/useBookings';

export const BookingCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createMutation = useCreateBooking();

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setErrorMessage(null);
      const newBooking = await createMutation.mutateAsync(data);
      setSuccessMessage('Booking record created successfully!');

      setTimeout(() => {
        navigate(`/bookings/${newBooking._id}`);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create booking. Please verify all required fields.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          New Catering Booking / Event
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Record a new customer reservation, guest contact information, and event date.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <Alert variant="error" title="Creation Failed">
          {errorMessage}
        </Alert>
      )}

      {/* Reusable Form Component */}
      <BookingForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Create Booking Record"
        cancelHref="/bookings"
      />
    </div>
  );
};
