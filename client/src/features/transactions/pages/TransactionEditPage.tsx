import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TransactionForm } from '../components/TransactionForm';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { SkeletonForm } from '../../../components/ui/Skeleton';
import { useTransactionDetails, useUpdateTransaction } from '../hooks/useTransactions';

export const TransactionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: transaction,
    isLoading,
    isError,
    error,
    refetch,
  } = useTransactionDetails(id || '');

  const updateMutation = useUpdateTransaction();

  const handleSubmit = async (formData: FormData) => {
    if (!id) return;
    try {
      setErrorMessage(null);
      await updateMutation.mutateAsync({ id, formData });
      setSuccessMessage('Financial transaction updated successfully!');

      setTimeout(() => {
        navigate('/transactions');
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update transaction record.');
    }
  };

  if (isLoading) {
    return <SkeletonForm fields={6} />;
  }

  if (isError || !transaction) {
    return (
      <div className="space-y-4">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Transactions</span>
        </Link>
        <Alert variant="error" title="Transaction Not Found">
          <div>{error instanceof Error ? error.message : 'The transaction record could not be loaded.'}</div>
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
      <div>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Transactions</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Ledger Transaction
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Modify the transaction details, associated partner/event, or append additional receipts.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" title="Saved">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Update Failed">
          {errorMessage}
        </Alert>
      )}

      <TransactionForm
        initialData={transaction}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save Changes"
        cancelHref="/transactions"
      />
    </div>
  );
};
