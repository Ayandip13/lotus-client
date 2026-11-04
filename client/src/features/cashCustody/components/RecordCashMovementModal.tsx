import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { useRecordCashMovement } from '../hooks/useCashCustody';
import { PartnerCashBalance, CashMovementType } from '../types/cashCustody.types';

interface RecordCashMovementModalProps {
  isOpen: boolean;
  partners: PartnerCashBalance[];
  events: Array<{ id: string; title: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordCashMovementModal: React.FC<RecordCashMovementModalProps> = ({
  isOpen,
  partners,
  events,
  onClose,
  onSuccess,
}) => {
  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const [movementType, setMovementType] = useState<CashMovementType>('PARTNER_HANDOVER');
  const [fromPartner, setFromPartner] = useState<string>(partners[0]?.partnerId || '');
  const [toPartner, setToPartner] = useState<string>(partners[1]?.partnerId || '');
  const [amount, setAmount] = useState<string>('');
  const [movementDate, setMovementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [relatedEvent, setRelatedEvent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const movementMutation = useRecordCashMovement();

  // Keep fromPartner and toPartner synchronized when partners prop loads
  useEffect(() => {
    if (partners && partners.length > 0) {
      if (!fromPartner || !partners.some(p => p.partnerId === fromPartner)) {
        setFromPartner(partners[0].partnerId);
      }
      if (!toPartner || !partners.some(p => p.partnerId === toPartner)) {
        setToPartner(partners[1]?.partnerId || partners[0].partnerId);
      }
    }
  }, [partners, fromPartner, toPartner]);

  const selectedFromPartner = partners.find((p) => p.partnerId === fromPartner);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (!description.trim()) {
      setError('Please describe the purpose of this cash movement');
      return;
    }

    if (
      ['PARTNER_HANDOVER', 'BANK_DEPOSIT', 'CASH_EXPENSE'].includes(movementType) &&
      selectedFromPartner &&
      parsedAmount > selectedFromPartner.cashInHand
    ) {
      setError(
        `Insufficient cash custody: ${selectedFromPartner.partnerName} holds ₹${selectedFromPartner.cashInHand.toLocaleString()}, but attempted to transfer/spend ₹${parsedAmount.toLocaleString()}`
      );
      return;
    }

    if (movementType === 'PARTNER_HANDOVER' && fromPartner === toPartner) {
      setError('From Partner and To Partner cannot be the same person');
      return;
    }

    setError(null);

    try {
      await movementMutation.mutateAsync({
        movementType,
        amount: parsedAmount,
        movementDate: new Date(movementDate).toISOString(),
        fromPartner: ['PARTNER_HANDOVER', 'BANK_DEPOSIT', 'CASH_EXPENSE'].includes(movementType)
          ? fromPartner
          : undefined,
        toPartner: ['PARTNER_HANDOVER', 'BANK_WITHDRAWAL', 'CASH_INCOME_ASSIGNED', 'OPENING_BALANCE'].includes(
          movementType
        )
          ? toPartner
          : undefined,
        description: description.trim(),
        relatedEvent: relatedEvent || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message || 'Failed to record cash movement';
      const detailMsg = err.details?.map((d: any) => d.message).join(', ') || err.response?.data?.error?.details?.map((d: any) => d.message).join(', ');
      setError(detailMsg ? `${serverMsg}: ${detailMsg}` : serverMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header (Sticky) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Record Business Cash Movement</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Physical cash custody and handover management</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-[11px] sm:text-xs leading-relaxed">
              Strictly tracks <strong>physical business cash</strong> held by partners. Partner-to-partner transfers and
              bank transfers shift custody channels without creating duplicate income or expenses.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Movement Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as any)}
              className="w-full h-9 sm:h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="PARTNER_HANDOVER">Partner-to-Partner Cash Handover</option>
              <option value="BANK_DEPOSIT">Deposit Cash into Business Bank Account</option>
              <option value="BANK_WITHDRAWAL">Withdraw Cash from Business Bank Account</option>
              <option value="CASH_EXPENSE">Direct Cash Expense by Partner</option>
              <option value="CASH_INCOME_ASSIGNED">Assign Cash Received to Partner</option>
              <option value="OPENING_BALANCE">Opening Cash Balance Allocation</option>
            </select>
          </div>

          {/* Conditional Partner Selectors */}
          {['PARTNER_HANDOVER', 'BANK_DEPOSIT', 'CASH_EXPENSE'].includes(movementType) && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {movementType === 'PARTNER_HANDOVER' ? 'Handing Over (From Partner)' : 'Spending/Depositing Partner'}
                </label>
                {selectedFromPartner && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-600">
                    Available Custody: ₹{selectedFromPartner.cashInHand.toLocaleString()}
                  </span>
                )}
              </div>
              <select
                value={fromPartner}
                onChange={(e) => setFromPartner(e.target.value)}
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-800"
                required
              >
                {partners.map((p) => (
                  <option key={p.partnerId} value={p.partnerId}>
                    {p.partnerName} (Holds: ₹{p.cashInHand.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {['PARTNER_HANDOVER', 'BANK_WITHDRAWAL', 'CASH_INCOME_ASSIGNED', 'OPENING_BALANCE'].includes(
            movementType
          ) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {movementType === 'PARTNER_HANDOVER' ? 'Receiving Partner (To Partner)' : 'Receiving Cash Partner'}
              </label>
              <select
                value={toPartner}
                onChange={(e) => setToPartner(e.target.value)}
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-800"
                required
              >
                {partners.map((p) => (
                  <option key={p.partnerId} value={p.partnerId}>
                    {p.partnerName} (Currently holds: ₹{p.cashInHand.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Date</label>
              <Input
                type="date"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Related Event (Optional)</label>
            <select
              value={relatedEvent}
              onChange={(e) => setRelatedEvent(e.target.value)}
              className="w-full h-9 sm:h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-800"
            >
              <option value="">General Cash Movement (No Event)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Reason <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Handover of event collection for morning fish market purchase"
              required
            />
          </div>

          {/* Footer (Actions) */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={movementMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={movementMutation.isPending} className="gap-2">
              {movementMutation.isPending ? 'Recording...' : 'Record Cash Movement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
