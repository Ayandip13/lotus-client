import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  User,
  Phone,
  Mail,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { bookingFormSchema, BookingFormSchema } from '../schemas/booking.schema';
import { BookingFormData } from '../types/booking.types';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';

interface BookingFormProps {
  initialData?: Partial<BookingFormData>;
  onSubmit: (data: BookingFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  cancelHref: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
  cancelHref,
}) => {
  // Format initial date to YYYY-MM-DD for standard date input if given as ISO
  const formattedDate = initialData?.eventDate
    ? new Date(initialData.eventDate).toISOString().split('T')[0]
    : '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormSchema>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      eventDate: formattedDate,
      eventDetails: initialData?.eventDetails || '',
      guestName: initialData?.guestName || '',
      guestPhone: initialData?.guestPhone || '',
      guestEmail: initialData?.guestEmail || '',
      guestAddress: initialData?.guestAddress || '',
    },
  });

  const handleFormSubmit = async (values: BookingFormSchema) => {
    // Convert date string to ISO date
    const isoDate = new Date(values.eventDate).toISOString();
    await onSubmit({
      ...values,
      eventDate: isoDate,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-4xl">
      {/* 1. Event / Booking Specifications */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <CalendarDays className="w-5 h-5 text-slate-700" />
            <CardTitle>Catering Event / Booking Details</CardTitle>
          </div>
          <CardDescription>
            Specify the name, scheduled execution date, and service details for this catering job.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Event / Booking Title *"
              placeholder="e.g. Roy Family Wedding Reception"
              leftIcon={<FileText className="w-4 h-4" />}
              error={errors.title?.message}
              {...register('title')}
            />

            <Input
              label="Event Date *"
              type="date"
              leftIcon={<CalendarDays className="w-4 h-4" />}
              error={errors.eventDate?.message}
              {...register('eventDate')}
            />
          </div>

          <Textarea
            label="Event Details & Notes (Optional)"
            placeholder="e.g. Buffet menu for 350 guests, starters counter, special dessert arrangements..."
            rows={3}
            error={errors.eventDetails?.message}
            {...register('eventDetails')}
          />
        </CardContent>
      </Card>

      {/* 2. Customer & Contact Information */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <User className="w-5 h-5 text-slate-700" />
            <CardTitle>Customer & Contact Details</CardTitle>
          </div>
          <CardDescription>
            Record the client or guest representative details responsible for this catering event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer / Contact Name *"
              placeholder="e.g. Subhashish Roy"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.guestName?.message}
              {...register('guestName')}
            />

            <Input
              label="Contact Phone Number *"
              placeholder="e.g. +91 98300 12345"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.guestPhone?.message}
              {...register('guestPhone')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Email (Optional)"
              type="email"
              placeholder="e.g. guest@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.guestEmail?.message}
              {...register('guestEmail')}
            />

            <div className="md:col-span-1">
              <Textarea
                label="Venue / Contact Address (Optional)"
                placeholder="e.g. Royal Palace Banquet, Salt Lake, Kolkata"
                rows={2}
                error={errors.guestAddress?.message}
                {...register('guestAddress')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Triggers */}
      <div className="flex items-center justify-between pt-2">
        <Link to={cancelHref}>
          <Button variant="outline" type="button" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
