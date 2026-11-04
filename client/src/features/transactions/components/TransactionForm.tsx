import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ArrowLeft,
  Save,
  Building2,
  Paperclip,
  X,
  Upload,
} from 'lucide-react';
import { transactionFormSchema, TransactionFormSchema } from '../schemas/transaction.schema';
import { TransactionAttachment, TransactionType, PaymentSource } from '../types/transaction.types';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { useAuth } from '../../auth/context/AuthContext';
import { usePartnerSummaries } from '../../accounts/hooks/useAccounts';
import { useBookings } from '../../bookings/hooks/useBookings';

interface TransactionFormProps {
  initialData?: any;
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  cancelHref: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
  cancelHref,
}) => {
  const { partner: currentPartner } = useAuth();

  // Queries to populate dropdowns using centralized query hooks
  const { data: partners = [] } = usePartnerSummaries();
  const { data: eventsData } = useBookings({ limit: 100 });

  const events = eventsData?.items || [];

  // Local file attachment state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Format initial date for <input type="date" />
  const initialDateStr = initialData?.transactionDate
    ? new Date(initialData.transactionDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactionType: initialData?.transactionType || 'BUSINESS_EXPENSE',
      amount: initialData?.amount || ('' as unknown as number),
      transactionDate: initialDateStr,
      description: initialData?.description || '',
      paymentSource: initialData?.paymentSource || 'COMMON_BUSINESS',
      partner: initialData?.partner || currentPartner?.id || '',
      relatedEvent: initialData?.relatedEvent || '',
    },
  });

  const watchedType = watch('transactionType') as TransactionType;
  const watchedPaymentSource = watch('paymentSource') as PaymentSource;

  // Auto-default partner when switching to partner personal or contribution if not set
  useEffect(() => {
    if (watchedType === 'PARTNER_CONTRIBUTION' && !watch('partner') && currentPartner?.id) {
      setValue('partner', currentPartner.id);
    }
  }, [watchedType, currentPartner, setValue, watch]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    const validFiles: File[] = [];

    for (const file of filesArray) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setFileError(`Invalid format for "${file.name}". Only JPEG, PNG, or WebP images are allowed.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds the 5MB maximum file size limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (selectedFiles.length + validFiles.length > 5) {
      setFileError('Maximum 5 bill/receipt attachments permitted per transaction.');
      return;
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Create object URLs for previews
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (values: TransactionFormSchema) => {
    const formData = new FormData();
    formData.append('transactionType', values.transactionType);
    formData.append('amount', values.amount.toString());
    formData.append('transactionDate', new Date(values.transactionDate).toISOString());
    formData.append('description', values.description);

    if (values.transactionType === 'BUSINESS_EXPENSE') {
      formData.append('paymentSource', values.paymentSource);
      if (values.paymentSource === 'PARTNER_PERSONAL' && values.partner) {
        formData.append('partner', values.partner);
      }
    } else if (values.transactionType === 'PARTNER_CONTRIBUTION') {
      formData.append('paymentSource', 'COMMON_BUSINESS');
      if (values.partner) {
        formData.append('partner', values.partner);
      }
    } else if (values.transactionType === 'BUSINESS_INCOME') {
      formData.append('paymentSource', 'COMMON_BUSINESS');
    }

    if (values.relatedEvent && values.relatedEvent.trim() !== '') {
      formData.append('relatedEvent', values.relatedEvent);
    }

    // Append newly selected files
    selectedFiles.forEach((file) => {
      formData.append('attachments', file);
    });

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* 1. Transaction Type & Primary Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-700" />
            <span>Transaction Type & Amount</span>
          </CardTitle>
          <CardDescription>
            Select how this transaction affects common business funds or partner records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Type Radios / Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Transaction Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  watchedType === 'BUSINESS_EXPENSE'
                    ? 'border-rose-500 bg-rose-50/40 text-rose-950 font-medium'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Business Expense</span>
                  <input
                    type="radio"
                    value="BUSINESS_EXPENSE"
                    {...register('transactionType')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  Operational costs (groceries, decor, labor, overhead)
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  watchedType === 'BUSINESS_INCOME'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-medium'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Business Income</span>
                  <input
                    type="radio"
                    value="BUSINESS_INCOME"
                    {...register('transactionType')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  Customer payments, booking advances, or event settlements
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  watchedType === 'PARTNER_CONTRIBUTION'
                    ? 'border-blue-500 bg-blue-50/40 text-blue-950 font-medium'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Partner Contribution</span>
                  <input
                    type="radio"
                    value="PARTNER_CONTRIBUTION"
                    {...register('transactionType')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  Personal money injected by a partner into the business pool
                </span>
              </label>
            </div>
            {errors.transactionType && (
              <p className="text-xs text-rose-600 mt-1">{errors.transactionType.message}</p>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Amount (₹ in INR)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 5000"
                error={errors.amount?.message}
                {...register('amount', { valueAsNumber: true })}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Precision is strictly preserved and calculated in whole paise internally.
              </p>
            </div>

            <div>
              <Input
                label="Transaction Date"
                type="date"
                error={errors.transactionDate?.message}
                {...register('transactionDate')}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Standard Asia/Kolkata business date of occurrence.
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Transaction Description / Purpose"
              placeholder="e.g. Purchased 20kg Basmati rice and spices from market, or Advance payment for Mukherjee wedding"
              error={errors.description?.message}
              {...register('description')}
              rows={2}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Accounting Source, Partner & Event Association */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span>Accounting Attribution</span>
          </CardTitle>
          <CardDescription>
            Specify payment source and optional catering event linkage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conditional: Payment Source for Expenses */}
          {watchedType === 'BUSINESS_EXPENSE' && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                How was this expense paid? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer ${
                    watchedPaymentSource === 'COMMON_BUSINESS'
                      ? 'border-slate-800 bg-white shadow-sm font-medium'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value="COMMON_BUSINESS"
                    {...register('paymentSource')}
                    className="mt-0.5 text-slate-900 focus:ring-slate-800"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">
                      Common Business Account
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Deducted immediately from common available business cash pool.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer ${
                    watchedPaymentSource === 'PARTNER_PERSONAL'
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm font-medium'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value="PARTNER_PERSONAL"
                    {...register('paymentSource')}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-purple-900 block">
                      Partner Personally Paid
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Paid from partner's personal pocket. Does NOT reduce common cash pool.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Conditional: Partner Selector */}
          {(watchedType === 'PARTNER_CONTRIBUTION' ||
            (watchedType === 'BUSINESS_EXPENSE' && watchedPaymentSource === 'PARTNER_PERSONAL')) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {watchedType === 'PARTNER_CONTRIBUTION'
                  ? 'Contributing Partner'
                  : 'Partner Who Personally Paid'} <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('partner')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Select Partner --</option>
                {partners.map((p) => (
                  <option key={p.partnerId} value={p.partnerId}>
                    {p.partnerName} {p.partnerPhone ? `(${p.partnerPhone})` : ''}
                  </option>
                ))}
              </select>
              {errors.partner && (
                <p className="text-xs text-rose-600 mt-1">{errors.partner.message}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                All three partners have equal administrative rights. You may record contributions or expenses on behalf of any partner.
              </p>
            </div>
          )}

          {/* Related Event Association (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Related Event / Booking <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              {...register('relatedEvent')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="">-- General Business (No Specific Event) --</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} — {new Date(ev.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({ev.guestName})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Linking an event attributes this income or expense to that specific catering job.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Bills & Receipt Pictures Attachment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-slate-700" />
            <span>Bill & Receipt Images</span>
          </CardTitle>
          <CardDescription>
            Attach pictures of physical receipts, grocery vouchers, vendor bills, or bank payment receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-6 text-center transition-colors">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="text-sm font-medium text-slate-700">
              <label
                htmlFor="file-upload"
                className="text-blue-600 hover:text-blue-800 cursor-pointer font-semibold underline underline-offset-2"
              >
                Upload receipt pictures
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />{' '}
              or choose from device
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPEG, PNG, or WebP up to 5MB each (Max 5 files).
            </p>
          </div>

          {fileError && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {fileError}
            </p>
          )}

          {/* Newly Selected Previews */}
          {filePreviews.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Selected for Upload ({filePreviews.length})
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group"
                  >
                    <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={preview}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-1.5 text-[10px] text-slate-600 truncate">
                      {selectedFiles[index]?.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 shadow transition-opacity"
                      title="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Attachments in Edit Mode */}
          {initialData?.attachments && initialData.attachments.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Previously Attached Receipts ({initialData.attachments.length})
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {initialData.attachments.map((att: TransactionAttachment) => (
                  <div
                    key={att._id}
                    className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
                  >
                    <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={att.url}
                        alt={att.originalName || 'Receipt'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-1.5 text-[10px] text-slate-600 truncate">
                      {att.originalName || 'Existing attachment'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link to={cancelHref}>
          <Button type="button" variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="sm"
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
