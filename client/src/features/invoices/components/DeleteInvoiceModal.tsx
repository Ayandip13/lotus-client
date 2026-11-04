import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface DeleteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  invoiceNumber: string;
  customerName: string;
}

export const DeleteInvoiceModal: React.FC<DeleteInvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  invoiceNumber,
  customerName,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-invoice-modal-title"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="delete-invoice-modal-title" className="text-base font-bold text-slate-900">
                  Delete Invoice #{invoiceNumber}?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Confirm permanent removal of customer billing record
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
              Are you sure you want to delete invoice{' '}
              <span className="font-semibold text-slate-900">"{invoiceNumber}"</span> issued to{' '}
              <span className="font-semibold text-slate-900">{customerName}</span>?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200/70 mt-3 leading-relaxed">
              <strong>Notice:</strong> Invoices with recorded payments cannot be deleted. Any uncollected dues linked to this invoice will be removed from customer balances.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
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
              className="gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

