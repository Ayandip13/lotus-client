import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Eye,
  Paperclip,
} from 'lucide-react';
import { accountService } from '../services/accountService';
import { Transaction, TransactionAttachment } from '../../transactions/types/transaction.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { formatINR } from '../../transactions/components/TransactionTable';
import { TransactionDetailsModal } from '../../transactions/components/TransactionDetailsModal';
import { AttachmentViewerModal } from '../../transactions/components/AttachmentViewerModal';

export const DateWiseExpensePage: React.FC = () => {
  // Default to today's date in local YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [expensesOnly, setExpensesOnly] = useState<boolean>(true);

  // Modals state
  const [inspectTx, setInspectTx] = useState<Transaction | null>(null);
  const [inspectAttachment, setInspectAttachment] = useState<TransactionAttachment | null>(null);

  const {
    data: dateData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['date-wise-history', selectedDate],
    queryFn: () => accountService.getDateWiseHistory(selectedDate),
    enabled: Boolean(selectedDate),
  });

  const allTransactions = dateData?.transactions || [];
  const displayedTransactions = expensesOnly
    ? allTransactions.filter((tx) => tx.transactionType === 'BUSINESS_EXPENSE')
    : allTransactions;

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation */}
      <div>
        <Link
          to="/overview"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Financial Overview</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Date-Wise Expense History
              </h1>
              {isFetching && !isLoading && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Inspect specific daily expenditures, paying partners, and event attributions for any given date.
            </p>
          </div>
          <Link to="/transactions/new">
            <Button size="sm" variant="primary">
              Record Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Date Selection Bar & Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Select Date:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <span className="text-xs text-slate-400">(Asia/Kolkata Business Date)</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={expensesOnly}
              onChange={(e) => setExpensesOnly(e.target.checked)}
              className="rounded text-slate-900 focus:ring-slate-900"
            />
            <span>Filter only business expenses</span>
          </label>
        </div>
      </div>

      {/* 3. Daily Aggregate Cards */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Retrieving daily ledger entries...</p>
        </div>
      ) : isError || !dateData ? (
        <Alert variant="error" title="Error loading daily entries">
          {(error as Error)?.message || 'Failed to retrieve date-wise ledger records.'}
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Daily Expenses */}
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Expenses on {selectedDate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-rose-600">
                  {formatINR(dateData.totalExpenses)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cumulative daily expenditure across all payment routes
                </p>
              </CardContent>
            </Card>

            {/* Paid from Common Account */}
            <Card className="border-l-4 border-l-slate-800">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Paid From Common Cash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {formatINR(dateData.commonAccountExpenses)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Common business cash outflow on this date
                </p>
              </CardContent>
            </Card>

            {/* Paid Personally by Partners */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Partner Personally Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-purple-700">
                  {formatINR(dateData.partnerPaidExpenses)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Covered directly from partner personal pockets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 4. Transactions List for Selected Date */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Ledger Records for {selectedDate}
                  </CardTitle>
                  <CardDescription>
                    {displayedTransactions.length} transaction(s) recorded on this calendar day.
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {expensesOnly ? 'Showing Expenses' : 'Showing All Types'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {displayedTransactions.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No {expensesOnly ? 'expenses' : 'transactions'} recorded on {selectedDate}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayedTransactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              tx.transactionType === 'BUSINESS_EXPENSE'
                                ? 'bg-rose-50 text-rose-700'
                                : tx.transactionType === 'BUSINESS_INCOME'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {tx.transactionType.replace('_', ' ')}
                          </span>

                          {tx.paymentSource === 'PARTNER_PERSONAL' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Paid by {tx.partner?.name || 'Partner'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Common Cash
                            </span>
                          )}

                          {tx.attachments && tx.attachments.length > 0 && (
                            <button
                              onClick={() => setInspectAttachment(tx.attachments[0])}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200"
                              title="Click to view receipt"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{tx.attachments.length} receipt</span>
                            </button>
                          )}
                        </div>

                        <p className="font-semibold text-slate-900">{tx.description}</p>

                        {tx.relatedEvent && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-slate-400" />
                            <span>Linked Event: {tx.relatedEvent.title}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <div className="font-mono font-bold text-base text-slate-900">
                            {formatINR(tx.amount)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Recorded by {tx.createdByPartner?.name || 'Partner'}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectTx(tx)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Details & Attachment Modals */}
      <TransactionDetailsModal
        transaction={inspectTx}
        isOpen={Boolean(inspectTx)}
        onClose={() => setInspectTx(null)}
      />

      <AttachmentViewerModal
        attachment={inspectAttachment}
        isOpen={Boolean(inspectAttachment)}
        onClose={() => setInspectAttachment(null)}
      />
    </div>
  );
};
