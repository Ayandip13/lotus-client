import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { TransactionForm } from '../components/TransactionForm';
import { Alert } from '../../../components/ui/Alert';

export const TransactionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await transactionService.createTransaction(formData);
      setSuccessMessage('Financial transaction recorded successfully!');

      setTimeout(() => {
        navigate('/transactions');
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record transaction. Please verify entries.');
      setIsSubmitting(false);
    }
  };

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
          Record Financial Transaction
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter operational business income, partner fund contribution, or an expense with receipt attachments.
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
      <TransactionForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Record In Ledger"
        cancelHref="/transactions"
      />
    </div>
  );
};
