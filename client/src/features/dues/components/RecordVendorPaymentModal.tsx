import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { dueService } from '../services/dueService';
import { VendorDueItem } from '../types/due.types';

interface RecordVendorPaymentModalProps {
  dueItem: VendorDueItem | null;
  partners: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordVendorPaymentModal: React.FC<RecordVendorPaymentModalProps> = ({
  dueItem,
  partners,
  onClose,
  onSuccess,
}) => {
  if (!dueItem) return null;

  const [amount, setAmount] = useState<string>(dueItem.remainingAmount.toString());
  const [paymentSource, setPaymentSource] = useState<'COMMON_BUSINESS' | 'PARTNER_PERSONAL'>('COMMON_BUSINESS');
  const [paidByPartner, setPaidByPartner] = useState<string>(partners[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deductFromPartnerCash, setDeductFromPartnerCash] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive payment amount');
      return;
    }

    if (parsedAmount > dueItem.remainingAmount) {
      setError(`Payment cannot exceed remaining payable amount of ₹${dueItem.remainingAmount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await dueService.recordVendorPayment(dueItem.billId, {
        amount: parsedAmount,
        paymentSource,
        paidByPartner,
        paymentDate: new Date(paymentDate).toISOString(),
        deductFromPartnerCash: paymentSource === 'COMMON_BUSINESS' && deductFromPartnerCash,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record vendor payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record Vendor Payment</h2>
            <p className="text-xs text-slate-500 font-medium">
              {dueItem.vendorName} • {dueItem.description}
            </p>
          </div>
          <button
            onClick={onClose}
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
              <span className="text-slate-500">Total Payable:</span>
              <p className="font-semibold text-slate-900">₹{dueItem.totalPayableAmount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-500">Remaining Due:</span>
              <p className="font-bold text-rose-600">₹{dueItem.remainingAmount.toLocaleString()}</p>
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
              max={dueItem.remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Funding Source</label>
              <select
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="COMMON_BUSINESS">Common Business Funds</option>
                <option value="PARTNER_PERSONAL">Partner Personal Money</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paying Partner</label>
              <select
                value={paidByPartner}
                onChange={(e) => setPaidByPartner(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
                required
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
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

          {paymentSource === 'COMMON_BUSINESS' && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                id="deductCash"
                checked={deductFromPartnerCash}
                onChange={(e) => setDeductFromPartnerCash(e.target.checked)}
                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-800"
              />
              <label htmlFor="deductCash" className="text-xs text-slate-700 font-medium cursor-pointer">
                Paid in cash from partner's physical cash custody (deducts partner cash-in-hand)
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid cash for raw chicken supply"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
