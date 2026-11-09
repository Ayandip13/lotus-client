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
  MapPin,
  Save,
  ArrowLeft,
  CheckCircle2,
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
    : new Date().toISOString().split('T')[0];

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
    // Convert date string safely to ISO date
    const isoDate = values.eventDate && !isNaN(Date.parse(values.eventDate))
      ? new Date(values.eventDate).toISOString()
      : new Date().toISOString();

    await onSubmit({
      ...values,
      title: values.title || '',
      eventDate: isoDate,
      guestName: values.guestName || '',
      guestPhone: values.guestPhone || '',
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 max-w-3xl">
      {/* Friendly Khatabook Helper Note */}
      <div className="flex items-center gap-2 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-emerald-800 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Quick Save:</strong> All fields are optional. Enter whatever details you have now, and update anytime later.
        </span>
      </div>

      {/* 1. Event Specifications */}
      <Card className="border-slate-200/90 shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-base font-bold">Event Information</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Event name, scheduled date, and menu notes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Input
              label="Event Name (Optional)"
              placeholder="e.g. Roy Wedding Reception"
              leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
              error={errors.title?.message}
              {...register('title')}
            />

            <Input
              label="Event Date (Optional)"
              type="date"
              leftIcon={<CalendarDays className="w-4 h-4 text-slate-400" />}
              error={errors.eventDate?.message}
              {...register('eventDate')}
            />
          </div>

          <Textarea
            label="Menu Notes / Event Details (Optional)"
            placeholder="e.g. 500 pax, Fish Fry, Basanti Pulao, Mutton Kasha, Rasomalai..."
            rows={3}
            error={errors.eventDetails?.message}
            {...register('eventDetails')}
          />
        </CardContent>
      </Card>

      {/* 2. Customer Contact */}
      <Card className="border-slate-200/90 shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <User className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-base font-bold">Client / Guest Details</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Contact person, mobile number, and event address
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Input
              label="Customer Name (Optional)"
              placeholder="e.g. Subhashish Roy"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              error={errors.guestName?.message}
              {...register('guestName')}
            />

            <Input
              type="tel"
              label="Phone Number (Optional)"
              placeholder="e.g. 9830012345"
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              error={errors.guestPhone?.message}
              {...register('guestPhone')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. client@gmail.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              error={errors.guestEmail?.message}
              {...register('guestEmail')}
            />

            <Input
              label="Venue / Address (Optional)"
              placeholder="e.g. Swabhumi The Heritage Plaza, Kolkata"
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              error={errors.guestAddress?.message}
              {...register('guestAddress')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Triggers */}
      <div className="flex items-center justify-between pt-2">
        <Link to={cancelHref}>
          <Button variant="outline" type="button" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-sm"
          leftIcon={<Save className="w-4 h-4" />}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
