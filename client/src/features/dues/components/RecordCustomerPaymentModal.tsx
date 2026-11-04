import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { useRecordCustomerPayment } from '../hooks/useDues';

interface RecordCustomerPaymentModalProps {
  isOpen?: boolean;
  dueItem?: any;
  invoice?: any;
  partners: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordCustomerPaymentModal: React.FC<RecordCustomerPaymentModalProps> = ({
  isOpen = true,
  dueItem,
  invoice,
  partners,
  onClose,
  onSuccess,
}) => {
  // Support either dueItem or invoice prop for seamless backwards-compatibility
  const target = dueItem || invoice;
  if (!isOpen || !target) return null;

  const invoiceId = target.invoiceId || target._id;
  const invoiceNumber = target.invoiceNumber || 'INV';
  const customerName = target.customerName || 'Customer';
  const remainingDue =
    typeof target.remainingDue === 'number'
      ? target.remainingDue
      : typeof target.balanceDue === 'number'
      ? target.balanceDue
      : 0;
  const totalBilled =
    typeof target.totalBillAmount === 'number'
      ? target.totalBillAmount
      : typeof target.grandTotal === 'number'
      ? target.grandTotal
      : remainingDue;

  const [amount, setAmount] = useState<string>(remainingDue.toString());
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [assignCashToPartner, setAssignCashToPartner] = useState<string>(partners[0]?.id || '');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const paymentMutation = useRecordCustomerPayment();

  // Function to generate a new cryptographic or timestamped UUID
  const createNewIdempotencyKey = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `idemp-cust-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Stable idempotency key across retries for the active payment session
  const [idempotencyKey, setIdempotencyKey] = useState<string>(createNewIdempotencyKey);

  useEffect(() => {
    if (target) {
      setIdempotencyKey(createNewIdempotencyKey());
      setAmount(remainingDue.toString());
      setError(null);
    }
  }, [invoiceId]);

  const handleClose = () => {
    setIdempotencyKey(createNewIdempotencyKey());
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive payment amount');
      return;
    }

    if (parsedAmount > remainingDue) {
      setError(`Payment cannot exceed the remaining due amount of ₹${remainingDue.toLocaleString()}`);
      return;
    }

    setError(null);

    try {
      await paymentMutation.mutateAsync({
        invoiceId,
        payload: {
          amount: parsedAmount,
          paymentMethod,
          paymentDate: new Date(paymentDate).toISOString(),
          notes: notes.trim() || undefined,
          assignCashToPartner: paymentMethod === 'CASH' ? assignCashToPartner : undefined,
          idempotencyKey,
        },
      });
      setIdempotencyKey(createNewIdempotencyKey());
      onSuccess();
      onClose();
    } catch (err: any) {
      // Keep the same idempotencyKey so that retrying resubmits the same logical payment
      setError(err.message || 'Failed to record customer payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record Customer Payment</h2>
            <p className="text-xs text-slate-500 font-medium">
              Invoice #{invoiceNumber} • {customerName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Total Invoiced:</span>
              <p className="font-semibold text-slate-900">₹{totalBilled.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-500">Remaining Due:</span>
              <p className="font-bold text-rose-600">₹{remainingDue.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="BANK_TRANSFER">Bank Transfer / IMPS / NEFT</option>
                <option value="UPI">UPI Payment</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Physical Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 animate-fadeIn">
              <label className="block text-xs font-bold text-amber-900">
                Assign Physical Cash Custody To Partner: <span className="text-rose-500">*</span>
              </label>
              <select
                value={assignCashToPartner}
                onChange={(e) => setAssignCashToPartner(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-amber-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-amber-800 leading-tight">
                Physical cash received will be added directly to this partner's verified cash-in-hand custody balance.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received advance 50% for wedding reception"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={handleClose} disabled={paymentMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={paymentMutation.isPending} className="gap-2">
              {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
