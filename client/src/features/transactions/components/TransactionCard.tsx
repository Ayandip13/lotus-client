import React from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Paperclip,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  UserCheck,
  CalendarDays,
} from 'lucide-react';
import { Transaction } from '../types/transaction.types';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatINR, formatDate } from './TransactionTable';

interface TransactionCardProps {
  transaction: Transaction;
  onViewClick: (transaction: Transaction) => void;
  onDeleteClick: (transaction: Transaction) => void;
  onAttachmentClick: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onViewClick,
  onDeleteClick,
  onAttachmentClick,
}) => {
  const renderTypeBadge = (type: Transaction['transactionType']) => {
    switch (type) {
      case 'BUSINESS_INCOME':
        return (
          <Badge variant="success" className="gap-1 font-medium text-[11px] py-0.5">
            <ArrowDownLeft className="w-3 h-3" />
            Income
          </Badge>
        );
      case 'PARTNER_CONTRIBUTION':
        return (
          <Badge variant="default" className="gap-1 font-medium text-[11px] py-0.5 bg-blue-600 text-white border-0">
            <Landmark className="w-3 h-3" />
            Contribution
          </Badge>
        );
      case 'BUSINESS_EXPENSE':
        return (
          <Badge variant="danger" className="gap-1 font-medium text-[11px] py-0.5">
            <ArrowUpRight className="w-3 h-3" />
            Expense
          </Badge>
        );
    }
  };

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header: Date + Type + Amount */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {renderTypeBadge(transaction.transactionType)}
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(transaction.transactionDate)}</span>
              </div>
            </div>
          </div>
          <div
            className={`font-mono font-bold text-base ${
              transaction.transactionType === 'BUSINESS_INCOME'
                ? 'text-emerald-600'
                : transaction.transactionType === 'PARTNER_CONTRIBUTION'
                ? 'text-blue-600'
                : 'text-slate-900'
            }`}
          >
            {transaction.transactionType === 'BUSINESS_INCOME'
              ? `+${formatINR(transaction.amount)}`
              : transaction.transactionType === 'PARTNER_CONTRIBUTION'
              ? `+${formatINR(transaction.amount)}`
              : `-${formatINR(transaction.amount)}`}
          </div>
        </div>

        {/* Description */}
        <div>
          <button
            onClick={() => onViewClick(transaction)}
            className="text-sm font-semibold text-slate-900 hover:text-blue-600 text-left line-clamp-2"
          >
            {transaction.description}
          </button>
        </div>

        {/* Context metadata (Event & Payment source) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
          {transaction.transactionType === 'PARTNER_CONTRIBUTION' && (
            <div className="flex items-center gap-1 text-blue-700 font-medium">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Contributed by: {transaction.partner?.name || 'Partner'}</span>
            </div>
          )}

          {transaction.transactionType === 'BUSINESS_EXPENSE' && (
            <div>
              {transaction.paymentSource === 'PARTNER_PERSONAL' ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Paid by {transaction.partner?.name || 'Partner'}
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Paid from Common Cash
                </span>
              )}
            </div>
          )}

          {transaction.relatedEvent && (
            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[200px]">
                Event: {transaction.relatedEvent.title}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions & Attachment Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div>
            {transaction.attachments && transaction.attachments.length > 0 ? (
              <button
                onClick={() => onAttachmentClick(transaction)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{transaction.attachments.length} Receipt(s)</span>
              </button>
            ) : (
              <span className="text-slate-400 text-xs">No receipts</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewClick(transaction)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <Link
              to={`/transactions/${transaction._id}/edit`}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDeleteClick(transaction)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
