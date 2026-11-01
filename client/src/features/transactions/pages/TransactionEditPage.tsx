import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { TransactionForm } from '../components/TransactionForm';
import { Alert } from '../../../components/ui/Alert';

export const TransactionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: transaction,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getTransactionById(id!),
    enabled: Boolean(id),
  });

  const handleSubmit = async (formData: FormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await transactionService.updateTransaction(id, formData);
      setSuccessMessage('Financial transaction updated successfully!');

      setTimeout(() => {
        navigate('/transactions');
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update transaction.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Loading transaction record...</p>
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className="space-y-4">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ledger</span>
        </Link>
        <Alert variant="error" title="Error Loading Record">
          {(error as Error)?.message || 'Financial transaction record not found.'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ledger</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Financial Transaction
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Modify ledger record details or attach additional receipt pictures.
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
        <Alert variant="error" title="Update Failed">
          {errorMessage}
        </Alert>
      )}

      {/* Reusable Form */}
      <TransactionForm
        initialData={{
          _id: transaction._id,
          transactionType: transaction.transactionType,
          amount: transaction.amount,
          transactionDate: transaction.transactionDate,
          description: transaction.description,
          paymentSource: transaction.paymentSource,
          partner: transaction.partner?._id,
          relatedEvent: transaction.relatedEvent?._id,
          attachments: transaction.attachments,
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
        cancelHref="/transactions"
      />
    </div>
  );
};
