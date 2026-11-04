import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { useCreateVendor } from '../hooks/useDues';

interface CreateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateVendorModal: React.FC<CreateVendorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('GROCERIES_SPICES');
  const [address, setAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createVendorMutation = useCreateVendor();

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim() || !cleanPhone) {
      setError('Vendor name and contact phone are required');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }

    setError(null);

    try {
      await createVendorMutation.mutateAsync({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        category,
        address: address.trim() || undefined,
        bankDetails: bankDetails.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register vendor');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Add New Vendor</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3.5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Das Fish Supply"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <Input
                type="tel"
                isPhone
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g. 9830012345"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="GROCERIES_SPICES">Groceries & Spices</option>
                <option value="MEAT_FISH">Meat & Fish</option>
                <option value="VEGETABLES">Vegetables</option>
                <option value="DAIRY_SWEETS">Dairy & Sweets</option>
                <option value="CROCKERY_UTENSILS">Crockery & Utensils</option>
                <option value="LABOR_STAFF">Labor & Service Staff</option>
                <option value="DECOR_FLORAL">Decor & Floral</option>
                <option value="COOKING_GAS">Cooking Gas (LPG)</option>
                <option value="TRANSPORTATION">Transportation</option>
                <option value="OTHER">Other Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address (Optional)</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Posta Bazar, Kolkata"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bank / UPI Details (Optional)</label>
            <Textarea
              rows={2}
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="Account Number, IFSC code, or UPI ID"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-xs py-1 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={createVendorMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVendorMutation.isPending}>
              {createVendorMutation.isPending ? 'Saving...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
