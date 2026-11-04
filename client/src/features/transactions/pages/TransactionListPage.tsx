import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Calendar,
  X,
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { accountService } from '../../accounts/services/accountService';
import {
  Transaction,
  TransactionType,
  PaymentSource,
  TransactionAttachment,
} from '../types/transaction.types';
import { TransactionTable, formatINR } from '../components/TransactionTable';
import { TransactionCard } from '../components/TransactionCard';
import { DeleteTransactionModal } from '../components/DeleteTransactionModal';
import { TransactionDetailsModal } from '../components/TransactionDetailsModal';
import { AttachmentViewerModal } from '../components/AttachmentViewerModal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { SkeletonTable } from '../../../components/ui/Skeleton';

export const TransactionListPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & State
  const [activeTab, setActiveTab] = useState<'ALL' | TransactionType>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<'' | PaymentSource>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [detailsTransaction, setDetailsTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [inspectAttachment, setInspectAttachment] = useState<TransactionAttachment | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when any filter changes
  const handleTabChange = (tab: 'ALL' | TransactionType) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Fetch partner options for filter dropdown
  const { data: partners = [] } = useQuery({
    queryKey: queryKeys.accounts.partners(),
    queryFn: () => accountService.getPartnerSummaries(),
  });

  // Query transactions
  const queryParams = {
    page,
    limit: 15,
    search: debouncedSearch,
    transactionType: activeTab !== 'ALL' ? activeTab : undefined,
    partner: selectedPartner || undefined,
    paymentSource: selectedPaymentSource || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: 'transactionDate' as const,
    sortOrder: 'desc' as const,
  };

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: queryKeys.transactions.list(queryParams),
    queryFn: () => transactionService.getTransactions(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      setDeletingTransaction(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    await deleteMutation.mutateAsync(deletingTransaction._id);
  };

  const clearFilters = () => {
    setActiveTab('ALL');
    setSearch('');
    setSelectedPartner('');
    setSelectedPaymentSource('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const transactions = data?.items || [];
  const pagination = data?.pagination;

  const hasActiveFilters =
    activeTab !== 'ALL' ||
    search.trim() !== '' ||
    selectedPartner !== '' ||
    selectedPaymentSource !== '' ||
    startDate !== '' ||
    endDate !== '';

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Income & Expense Ledger
            </h1>
            {isFetching && !isLoading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
            Centralized financial transactions, partner contributions, and operational expenses with receipt attachments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/transactions/new" className="w-full sm:w-auto">
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto shadow-sm">
              Record Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Transaction Category Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none pb-px text-xs sm:text-sm">
        <button
          onClick={() => handleTabChange('ALL')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          All Ledger Entries
        </button>
        <button
          onClick={() => handleTabChange('BUSINESS_INCOME')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'BUSINESS_INCOME'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          <span>Business Income</span>
        </button>
        <button
          onClick={() => handleTabChange('BUSINESS_EXPENSE')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'BUSINESS_EXPENSE'
              ? 'border-rose-600 text-rose-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
          <span>Business Expenses</span>
        </button>
        <button
          onClick={() => handleTabChange('PARTNER_CONTRIBUTION')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'PARTNER_CONTRIBUTION'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          <span>Partner Contributions</span>
        </button>
      </div>

      {/* 3. Search & Advanced Filtering Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2.5 sm:space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
          {/* Text Search */}
          <div className="sm:col-span-12 md:col-span-6">
            <Input
              placeholder="Search by description or transaction note..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-slate-200 text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>

          {/* Partner & Payment Source Filters side-by-side on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:col-span-12 md:col-span-6">
            <select
              value={selectedPartner}
              onChange={(e) => {
                setSelectedPartner(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 h-9 sm:h-[38px] truncate"
            >
              <option value="">All Partners</option>
              {partners.map((p) => (
                <option key={p.partnerId} value={p.partnerId}>
                  {p.partnerName}
                </option>
              ))}
            </select>

            <select
              value={selectedPaymentSource}
              onChange={(e) => {
                setSelectedPaymentSource(e.target.value as PaymentSource);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 h-9 sm:h-[38px] truncate"
            >
              <option value="">All Routes</option>
              <option value="COMMON_BUSINESS">Common Account</option>
              <option value="PARTNER_PERSONAL">Partner Personal</option>
            </select>
          </div>
        </div>

        {/* Date Range Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-500 font-medium text-[11px] sm:text-xs shrink-0">Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full min-w-0 flex-1 rounded-md border border-slate-300 px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs text-slate-800"
            />
            <span className="text-slate-400 text-[11px] shrink-0">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full min-w-0 flex-1 rounded-md border border-slate-300 px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs text-slate-800"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium text-xs shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Error State */}
      {isError && (
        <Alert
          variant="error"
          title="Failed to load ledger transactions"
        >
          {(error as Error)?.message || 'An error occurred while communicating with the server.'}
        </Alert>
      )}

      {/* 5. Transactions Listing: Desktop Table & Mobile Cards */}
      {isLoading ? (
        <SkeletonTable rows={6} columns={6} />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <TransactionTable
              transactions={transactions}
              onViewClick={(tx) => setDetailsTransaction(tx)}
              onDeleteClick={(tx) => setDeletingTransaction(tx)}
              onAttachmentClick={(tx) => {
                if (tx.attachments && tx.attachments.length > 0) {
                  setInspectAttachment(tx.attachments[0]);
                }
              }}
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {transactions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-sm text-slate-500">
                No financial transactions match your filter criteria.
              </div>
            ) : (
              transactions.map((tx) => (
                <TransactionCard
                  key={tx._id}
                  transaction={tx}
                  onViewClick={(t) => setDetailsTransaction(t)}
                  onDeleteClick={(t) => setDeletingTransaction(t)}
                  onAttachmentClick={(t) => {
                    if (t.attachments && t.attachments.length > 0) {
                      setInspectAttachment(t.attachments[0]);
                    }
                  }}
                />
              ))
            )}
          </div>

          {/* 6. Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-sm shadow-sm">
              <div className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-800">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
                </span>{' '}
                of <span className="font-semibold text-slate-800">{pagination.totalItems}</span> entries
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={pagination.page <= 1 || isFetching}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page >= pagination.totalPages || isFetching}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      <TransactionDetailsModal
        transaction={detailsTransaction}
        isOpen={Boolean(detailsTransaction)}
        onClose={() => setDetailsTransaction(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
        transactionDescription={deletingTransaction?.description || ''}
        amountFormatted={deletingTransaction ? formatINR(deletingTransaction.amount) : ''}
      />

      {/* Single Attachment Viewer Lightbox */}
      <AttachmentViewerModal
        attachment={inspectAttachment}
        isOpen={Boolean(inspectAttachment)}
        onClose={() => setInspectAttachment(null)}
      />
    </div>
  );
};
