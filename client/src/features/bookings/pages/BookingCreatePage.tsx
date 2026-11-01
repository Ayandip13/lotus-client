import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingFormData } from '../types/booking.types';
import { BookingForm } from '../components/BookingForm';
import { Alert } from '../../../components/ui/Alert';

export const BookingCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const created = await bookingService.createBooking(data);
      setSuccessMessage('Booking / Event created successfully!');

      // Short delay for user visual feedback before navigating
      setTimeout(() => {
        navigate(`/bookings/${created._id}`);
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create booking / event. Please check inputs.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bookings</span>
        </Link>
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
        isSubmitting={isSubmitting}
        submitLabel="Create Booking Record"
        cancelHref="/bookings"
      />
    </div>
  );
};
