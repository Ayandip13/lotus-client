import React, { useState, useEffect } from 'react';
import { X, Phone, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../context/AuthContext';

interface EditPartnerPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditPartnerPhoneModal: React.FC<EditPartnerPhoneModalProps> = ({ isOpen, onClose }) => {
  const { partner, updatePartnerProfile } = useAuth();

  // All hooks MUST be declared before any early returns (React Rules of Hooks)
  const [phone, setPhone] = useState(partner?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Sync phone state when partner data changes
  useEffect(() => {
    if (partner?.phone) {
      setPhone(partner.phone);
    }
  }, [partner?.phone]);

  if (!isOpen || !partner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone) {
      setError('Phone number is required');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await updatePartnerProfile({ phone: cleanPhone });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update partner phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Update Your Phone Number</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center gap-2.5 p-2.5 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              You are editing contact info for <strong className="font-bold">{partner.name}</strong>.
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Phone number updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number (10 Digits) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              isPhone
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="e.g. 9830012345"
              autoFocus
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Only numbers are allowed, exactly 10 digits.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
              Save Number
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
