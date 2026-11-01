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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';

interface TransactionTableProps {
  transactions: Transaction[];
  onViewClick: (transaction: Transaction) => void;
  onDeleteClick: (transaction: Transaction) => void;
  onAttachmentClick: (transaction: Transaction) => void;
}

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onViewClick,
  onDeleteClick,
  onAttachmentClick,
}) => {
  const renderTypeBadge = (type: Transaction['transactionType']) => {
    switch (type) {
      case 'BUSINESS_INCOME':
        return (
          <Badge variant="success" className="gap-1 font-medium text-xs">
            <ArrowDownLeft className="w-3 h-3" />
            Income
          </Badge>
        );
      case 'PARTNER_CONTRIBUTION':
        return (
          <Badge variant="default" className="gap-1 font-medium text-xs bg-blue-600 text-white border-0">
            <Landmark className="w-3 h-3" />
            Contribution
          </Badge>
        );
      case 'BUSINESS_EXPENSE':
        return (
          <Badge variant="danger" className="gap-1 font-medium text-xs">
            <ArrowUpRight className="w-3 h-3" />
            Expense
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const renderPaymentSource = (tx: Transaction) => {
    if (tx.transactionType === 'PARTNER_CONTRIBUTION') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-medium text-blue-900">
            {tx.partner?.name || 'Contributing Partner'}
          </span>
        </div>
      );
    }

    if (tx.transactionType === 'BUSINESS_EXPENSE') {
      if (tx.paymentSource === 'PARTNER_PERSONAL') {
        return (
          <div className="space-y-0.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Partner Paid
            </span>
            <div className="text-xs text-slate-700 font-medium truncate max-w-[150px]">
              {tx.partner?.name || 'Personal funds'}
            </div>
          </div>
        );
      }
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Common Cash
        </span>
      );
    }

    // BUSINESS_INCOME
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Common Acct
      </span>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[14%]">Date</TableHead>
          <TableHead className="w-[14%]">Type</TableHead>
          <TableHead className="w-[28%]">Description & Event</TableHead>
          <TableHead className="w-[14%]">Payment Source</TableHead>
          <TableHead className="w-[14%] text-right">Amount</TableHead>
          <TableHead className="w-[8%] text-center">Receipt</TableHead>
          <TableHead className="w-[8%] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableEmptyState message="No financial transactions match your filter criteria." colSpan={7} />
        ) : (
          transactions.map((tx) => (
            <TableRow key={tx._id} className="group">
              {/* 1. Date */}
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatDate(tx.transactionDate)}</span>
                </div>
              </TableCell>

              {/* 2. Type */}
              <TableCell>{renderTypeBadge(tx.transactionType)}</TableCell>

              {/* 3. Description & Event */}
              <TableCell>
                <div>
                  <button
                    onClick={() => onViewClick(tx)}
                    className="font-medium text-slate-900 hover:text-blue-600 transition-colors text-left line-clamp-1 text-sm"
                  >
                    {tx.description}
                  </button>
                  {tx.relatedEvent && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-normal truncate max-w-[200px]">
                        Event: {tx.relatedEvent.title}
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* 4. Payment Source */}
              <TableCell>{renderPaymentSource(tx)}</TableCell>

              {/* 5. Amount */}
              <TableCell className="text-right">
                <span
                  className={`font-semibold font-mono text-sm ${
                    tx.transactionType === 'BUSINESS_INCOME'
                      ? 'text-emerald-600'
                      : tx.transactionType === 'PARTNER_CONTRIBUTION'
                      ? 'text-blue-600'
                      : 'text-slate-900'
                  }`}
                >
                  {tx.transactionType === 'BUSINESS_INCOME'
                    ? `+${formatINR(tx.amount)}`
                    : tx.transactionType === 'PARTNER_CONTRIBUTION'
                    ? `+${formatINR(tx.amount)}`
                    : `-${formatINR(tx.amount)}`}
                </span>
              </TableCell>

              {/* 6. Attachments */}
              <TableCell className="text-center">
                {tx.attachments && tx.attachments.length > 0 ? (
                  <button
                    onClick={() => onAttachmentClick(tx)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                    title={`View ${tx.attachments.length} attached receipt(s)`}
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>{tx.attachments.length}</span>
                  </button>
                ) : (
                  <span className="text-slate-300 text-xs">—</span>
                )}
              </TableCell>

              {/* 7. Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onViewClick(tx)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="View Transaction Details"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="sr-only">View</span>
                  </button>

                  <Link
                    to={`/transactions/${tx._id}/edit`}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit Transaction"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="sr-only">Edit</span>
                  </Link>

                  <button
                    onClick={() => onDeleteClick(tx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
