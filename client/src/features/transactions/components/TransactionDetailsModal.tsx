import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Calendar,
  CreditCard,
  UserCheck,
  CalendarDays,
  Paperclip,
  ShieldCheck,
  Edit3,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Transaction, TransactionAttachment } from '../types/transaction.types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatINR, formatDate } from './TransactionTable';
import { AttachmentViewerModal } from './AttachmentViewerModal';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const [selectedAttachment, setSelectedAttachment] = useState<TransactionAttachment | null>(null);

  if (!isOpen || !transaction) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
        <div
          className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-900">Transaction Details</span>
              <Badge
                variant={
                  transaction.transactionType === 'BUSINESS_INCOME'
                    ? 'success'
                    : transaction.transactionType === 'PARTNER_CONTRIBUTION'
                    ? 'default'
                    : 'danger'
                }
                className={
                  transaction.transactionType === 'PARTNER_CONTRIBUTION'
                    ? 'bg-blue-600 text-white border-0'
                    : ''
                }
              >
                {transaction.transactionType.replace('_', ' ')}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* Amount & Key Metrics banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Transaction Amount
                </span>
                <div
                  className={`text-2xl font-bold font-mono mt-0.5 ${
                    transaction.transactionType === 'BUSINESS_INCOME'
                      ? 'text-emerald-600'
                      : transaction.transactionType === 'PARTNER_CONTRIBUTION'
                      ? 'text-blue-600'
                      : 'text-slate-900'
                  }`}
                >
                  {formatINR(transaction.amount)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{formatDate(transaction.transactionDate)}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Description / Purpose
              </h4>
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {transaction.description}
              </p>
            </div>

            {/* Financial Accounting Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Source / Account */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment / Account Route</span>
                </div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {transaction.paymentSource === 'COMMON_BUSINESS' ? (
                    <span className="text-slate-800">Common Business Account</span>
                  ) : (
                    <span className="text-purple-700">Partner Personal Funds</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {transaction.paymentSource === 'COMMON_BUSINESS'
                    ? 'Transacted directly through common business cash pool.'
                    : 'Paid directly from partner personal pocket. Excluded from common cash deduction.'}
                </p>
              </div>

              {/* Partner Context */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Associated Partner</span>
                </div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {transaction.partner ? (
                    <span className="text-slate-900 font-semibold">{transaction.partner.name}</span>
                  ) : (
                    <span className="text-slate-400 italic">None (Common business entry)</span>
                  )}
                </div>
                {transaction.partner && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {transaction.transactionType === 'PARTNER_CONTRIBUTION'
                      ? 'Contributing partner credited for fund injection.'
                      : 'Partner who personally covered this business expense.'}
                  </p>
                )}
              </div>
            </div>

            {/* Related Event / Catering Job */}
            {transaction.relatedEvent && (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Linked Catering Job / Event</span>
                  </div>
                  <Link
                    to={`/bookings/${transaction.relatedEvent._id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                  >
                    <span>View Booking</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {transaction.relatedEvent.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Guest: {transaction.relatedEvent.guestName} ({transaction.relatedEvent.guestPhone})
                </div>
              </div>
            )}

            {/* Attachments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Bills & Receipts ({transaction.attachments?.length || 0})</span>
                </h4>
              </div>

              {transaction.attachments && transaction.attachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {transaction.attachments.map((att, idx) => (
                    <button
                      key={att._id || idx}
                      onClick={() => setSelectedAttachment(att)}
                      className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 hover:border-blue-400 transition-all text-left"
                    >
                      <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={att.url}
                          alt={att.originalName || `Receipt ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-2 text-xs">
                        <p className="font-medium text-slate-800 truncate" title={att.originalName}>
                          {att.originalName || `Attachment #${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {(att.fileSize / 1024).toFixed(0)} KB • Click to inspect
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                  No bill or receipt pictures attached to this ledger transaction.
                </div>
              )}
            </div>

            {/* Audit & Partner Stamps */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Recorded by partner:{' '}
                  <strong className="text-slate-800">
                    {transaction.createdByPartner?.name || 'Partner'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Entry timestamp: {new Date(transaction.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <Link
              to={`/transactions/${transaction._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </Link>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Attachment Fullscreen Viewer Lightbox */}
      <AttachmentViewerModal
        attachment={selectedAttachment}
        isOpen={Boolean(selectedAttachment)}
        onClose={() => setSelectedAttachment(null)}
      />
    </>
  );
};
