import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../features/auth/context/AuthContext';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { partner, user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-end">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 id="signout-modal-title" className="text-base font-bold text-slate-900">
            Confirm Sign Out?
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Are you sure you want to end your active partner session?
          </p>

          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">
              Active Session
            </span>
            <div className="font-semibold text-slate-900 mt-0.5">
              {partner?.name || 'Partner Account'} {user ? `(@${user.username})` : ''}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 justify-center h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="flex-1 justify-center h-9 text-xs shadow-sm"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

