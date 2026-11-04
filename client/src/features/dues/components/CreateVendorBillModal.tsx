import React, { useState } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { useCreateVendorBill } from '../hooks/useDues';
import { VendorItem } from '../types/due.types';

interface CreateVendorBillModalProps {
  isOpen: boolean;
  vendors: VendorItem[];
  events: Array<{ id: string; title: string }>;
  defaultEventId?: string;
  onClose: () => void;
  onSuccess: () => void;
  onAddNewVendor?: () => void;
}

export const CreateVendorBillModal: React.FC<CreateVendorBillModalProps> = ({
  isOpen,
  vendors,
  events,
  defaultEventId,
  onClose,
  onSuccess,
  onAddNewVendor,
}) => {
  if (!isOpen) return null;

  const [vendorId, setVendorId] = useState(vendors[0]?._id || '');
  const [relatedEventId, setRelatedEventId] = useState(defaultEventId || '');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createBillMutation = useCreateVendorBill();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(totalAmount);

    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid bill amount');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description of the purchase or expense');
      return;
    }

    setError(null);

    try {
      await createBillMutation.mutateAsync({
        vendor: vendorId,
        relatedEvent: relatedEventId || undefined,
        billNumber: billNumber.trim() || undefined,
        billDate: new Date(billDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        description: description.trim(),
        totalAmount: parsedAmount,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor payable bill');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record Vendor Payable Bill</h2>
            <p className="text-xs text-slate-500 font-medium">Add supplier liability or purchase due</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <p>
              <strong>Accounting Notice:</strong> Recording this payable creates a vendor liability. It will
              <strong> not</strong> count as a paid business expense until payment is actually recorded.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Vendor <span className="text-rose-500">*</span>
              </label>
              {onAddNewVendor && (
                <button
                  type="button"
                  onClick={onAddNewVendor}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  + Add New Vendor
                </button>
              )}
            </div>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              required
            >
              <option value="">Select Vendor...</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.category.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Related Event (Optional)</label>
              <select
                value={relatedEventId}
                onChange={(e) => setRelatedEventId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">General (No Specific Event)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bill / Invoice # (Optional)</label>
              <Input
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. BILL-921"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Amount Payable (₹) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="e.g. 15000"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Date</label>
              <Input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense / Purchase Description <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 50kg mutton and 30kg rohu fish for banquet"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={createBillMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBillMutation.isPending}>
              {createBillMutation.isPending ? 'Recording...' : 'Create Payable Bill'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
