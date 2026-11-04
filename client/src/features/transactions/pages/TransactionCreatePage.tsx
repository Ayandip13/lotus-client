import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionForm } from '../components/TransactionForm';
import { Alert } from '../../../components/ui/Alert';
import { useCreateTransaction } from '../hooks/useTransactions';

export const TransactionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createMutation = useCreateTransaction();

  const handleSubmit = async (formData: FormData) => {
    try {
      setErrorMessage(null);
      await createMutation.mutateAsync(formData);
      setSuccessMessage('Financial transaction recorded into ledger successfully!');

      setTimeout(() => {
        navigate('/transactions');
      }, 500);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to record transaction. Please verify amount and required fields.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Record Ledger Transaction
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Post an operational expense, client catering payment, or partner capital deposit.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Entry Failed">
          {errorMessage}
        </Alert>
      )}

      <TransactionForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Record Transaction"
        cancelHref="/transactions"
      />
    </div>
  );
};
