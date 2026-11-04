import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  transactionDescription: string;
  amountFormatted: string;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  transactionDescription,
  amountFormatted,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="modal-title" className="text-base font-semibold text-slate-900">
                  Delete Financial Transaction?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm removal from active ledger calculations
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to remove this ledger entry:
            </p>
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900 text-sm">
                "{transactionDescription}"
              </div>
              <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                Amount: {amountFormatted}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800">
              ℹ️ In accordance with financial audit standards, this transaction will be soft-deleted. The record remains in the audit log but is immediately excluded from ledger calculations.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onConfirm}
              isLoading={isDeleting}
              disabled={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
