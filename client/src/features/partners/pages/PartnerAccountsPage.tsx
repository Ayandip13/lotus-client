import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Landmark,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  Paperclip,
  RefreshCw,
  Eye,
  Plus,
} from 'lucide-react';
import { Transaction, TransactionAttachment } from '../../transactions/types/transaction.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatINR, formatDate } from '../../transactions/components/TransactionTable';
import { TransactionDetailsModal } from '../../transactions/components/TransactionDetailsModal';
import { AttachmentViewerModal } from '../../transactions/components/AttachmentViewerModal';
import { usePartnerSummaries, usePartnerDetails } from '../../accounts/hooks/useAccounts';

export const PartnerAccountsPage: React.FC = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [inspectTx, setInspectTx] = useState<Transaction | null>(null);
  const [inspectAttachment, setInspectAttachment] = useState<TransactionAttachment | null>(null);

  // 1. Fetch all 3 partners' financial summaries using centralized hook
  const {
    data: partnerSummaries = [],
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    isFetching,
  } = usePartnerSummaries();

  // Set default selected partner once loaded
  React.useEffect(() => {
    if (partnerSummaries.length > 0 && !selectedPartnerId) {
      setSelectedPartnerId(partnerSummaries[0].partnerId);
    }
  }, [partnerSummaries, selectedPartnerId]);

  // 2. Fetch selected partner's detailed transaction history
  const {
    data: partnerDetails,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
  } = usePartnerDetails(selectedPartnerId || '');

  const selectedPartnerSummary = partnerSummaries.find(
    (p) => p.partnerId === selectedPartnerId
  );

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Partner Financial Accounts
            </h1>
            <Badge variant="success">Equal 3-Partner System</Badge>
            {isFetching && !isSummaryLoading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track individual partner capital contributions, personally paid operational expenses, and audit histories.
          </p>
        </div>

        <Link to="/transactions/new">
          <Button size="md" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm text-xs" leftIcon={<Plus className="w-4 h-4" />}>
            + Record Entry
          </Button>
        </Link>
      </div>

      {/* 2. Accounting Scope Boundary Notice */}
      <Alert variant="warning" title="Strict Financial Policy Notice">
        In accordance with confirmed business rules, individual personal wallet balances, partner-to-partner transfers, and final profit settlements are strictly NOT computed or displayed. Displayed totals represent historical money contributed and business expenses personally covered.
      </Alert>

      {/* 3. Partner Cards Overview Grid */}
      {isSummaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isSummaryError ? (
        <Alert variant="error" title="Error loading partner accounts">
          {(summaryError as Error)?.message || 'Failed to retrieve partner summaries.'}
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {partnerSummaries.map((partner) => {
            const isSelected = partner.partnerId === selectedPartnerId;
            return (
              <div
                key={partner.partnerId}
                onClick={() => setSelectedPartnerId(partner.partnerId)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/10'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {partner.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{partner.partnerName}</h3>
                      <p className="text-[11px] text-slate-500">
                        {partner.partnerPhone || 'Equal Partner'}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="text-[10px]">
                      Selected
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-600" />
                      <span>Total Contributed:</span>
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatINR(partner.totalContributions)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                      <span>Personally Paid:</span>
                    </span>
                    <span className="font-mono font-bold text-purple-700">
                      {formatINR(partner.totalPersonallyPaidExpenses)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{partner.transactionCount} associated ledger entries</span>
                  <span className="font-medium text-blue-600">Click to view log →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Detailed Transaction History for Selected Partner */}
      {selectedPartnerSummary && (
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-700" />
                  <span>Ledger History for {selectedPartnerSummary.partnerName}</span>
                </CardTitle>
                <CardDescription>
                  Audit list of all capital contributions and personally covered expenditures by this partner.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600 text-white border-0">
                  Contributed: {formatINR(selectedPartnerSummary.totalContributions)}
                </Badge>
                <Badge variant="outline">
                  Paid: {formatINR(selectedPartnerSummary.totalPersonallyPaidExpenses)}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isDetailsLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : isDetailsError ? (
              <div className="p-6">
                <Alert variant="error" title="Error loading partner details">
                  {(detailsError as Error)?.message || 'Failed to retrieve partner records.'}
                </Alert>
              </div>
            ) : !partnerDetails?.transactions || partnerDetails.transactions.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                No contributions or personally paid expenses recorded yet for {selectedPartnerSummary.partnerName}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {partnerDetails.transactions.map((tx: Transaction) => (
                  <div
                    key={tx._id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {tx.transactionType === 'PARTNER_CONTRIBUTION' ? (
                          <Badge variant="default" className="gap-1 text-[11px] py-0.5 bg-blue-600 text-white border-0">
                            <Landmark className="w-3 h-3" />
                            Contribution
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="gap-1 text-[11px] py-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            Personally Paid Expense
                          </Badge>
                        )}

                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(tx.transactionDate)}</span>
                        </span>

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
                          <span>Associated Catering Event: {tx.relatedEvent.title}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold text-base ${
                            tx.transactionType === 'PARTNER_CONTRIBUTION'
                              ? 'text-blue-600'
                              : 'text-purple-700'
                          }`}
                        >
                          {tx.transactionType === 'PARTNER_CONTRIBUTION' ? '+' : ''}
                          {formatINR(tx.amount)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Audit by {tx.createdByPartner?.name || 'Partner'}
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
