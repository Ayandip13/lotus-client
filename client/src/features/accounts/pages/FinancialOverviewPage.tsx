import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Wallet,
  Calendar,
  CreditCard,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Info,
  CalendarDays,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Skeleton, SkeletonStatCard } from '../../../components/ui/Skeleton';
import { formatINR } from '../../transactions/components/TransactionTable';
import { useOverallSummary, usePartnerSummaries } from '../hooks/useAccounts';
import { useAuth } from '../../auth/context/AuthContext';
import { EditPartnerPhoneModal } from '../../auth/components/EditPartnerPhoneModal';
import { Edit2 } from 'lucide-react';

export const FinancialOverviewPage: React.FC = () => {
  const { partner: currentPartner } = useAuth();
  const [isEditPhoneModalOpen, setIsEditPhoneModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Overall Summary Query
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    isFetching,
  } = useOverallSummary(startDate || undefined, endDate || undefined);

  // 2. Partner Summaries Query
  const { data: partnerSummaries = [] } = usePartnerSummaries();

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Financial Overview & Accounts
            </h1>
            <Badge variant="success">Centralized Ledger</Badge>
            {isFetching && !isSummaryLoading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time business fund balance, cumulative income, expenditures, and partner accounts derived from the single financial ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/transactions/new">
            <Button size="sm" variant="primary">
              Record Transaction
            </Button>
          </Link>
          <Link to="/transactions">
            <Button size="sm" variant="outline">
              View All Entries
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Date Filtering Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-slate-600 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Period:</span>
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800"
          />
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilter}
              className="text-rose-600 hover:text-rose-800 font-medium ml-1"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/transactions/date-wise"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Date-Wise Expense History →</span>
          </Link>
        </div>
      </div>

      {/* 3. Provisional Accounting Disclosure Banner */}
      <Alert variant="info" title="Provisional Accounting Rules & Transparency">
        <div className="space-y-1 text-xs leading-relaxed">
          <p>
            <strong>Common Business Balance Formula:</strong> (Total Business Income + Total Partner Contributions) - Common Account Expenses.
          </p>
          <p>
            • Partner contributions increase available common funds but are strictly <em>not</em> business revenue.
          </p>
          <p>
            • Expenses personally paid by a partner are recorded under total business operational expenses, but do <em>not</em> reduce common business cash.
          </p>
          <p>
            • Common Business Balance represents available operational funds, not net business profit. Final profit distribution formulas remain pending confirmation (Question Q6).
          </p>
        </div>
      </Alert>

      {/* 4. Primary Financial Metrics Cards */}
      {isSummaryLoading ? (
        <div className="space-y-6">
          <div className="space-y-2.5 sm:space-y-4">
            <SkeletonStatCard />
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-72" />
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : isSummaryError || !summary ? (
        <Alert variant="error" title="Error loading financial summary">
          {(summaryError as Error)?.message || 'Failed to calculate account balances.'}
        </Alert>
      ) : (
        <>
          <div className="space-y-2.5 sm:space-y-4">
            {/* Common Business Balance Card (Featured Top Full-Width on Mobile) */}
            <Card className="border-l-4 border-l-slate-900 bg-slate-900 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3.5 sm:p-6">
                <CardTitle className="text-[11px] sm:text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Common Business Balance
                </CardTitle>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </CardHeader>
              <CardContent className="p-3.5 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  {formatINR(summary.commonBusinessBalance)}
                </div>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-300">
                  Available common operational cash pool
                </p>
              </CardContent>
            </Card>

            {/* Income, Expenses & Contributions in the SAME ROW on mobile */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {/* Total Business Income */}
              <Card className="border-l-2 sm:border-l-4 border-l-emerald-500 flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-1 p-2 sm:p-4">
                  <CardTitle className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                    Income
                  </CardTitle>
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </CardHeader>
                <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-xs sm:text-xl font-bold font-mono text-emerald-600 truncate">
                    {formatINR(summary.totalBusinessIncome)}
                  </div>
                  <p className="mt-0.5 text-[9px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
                    Revenue from catering jobs & events
                  </p>
                </CardContent>
              </Card>

              {/* Total Business Expenses */}
              <Card className="border-l-2 sm:border-l-4 border-l-rose-500 flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-1 p-2 sm:p-4">
                  <CardTitle className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                    Expenses
                  </CardTitle>
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                </CardHeader>
                <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-xs sm:text-xl font-bold font-mono text-slate-900 truncate">
                    {formatINR(summary.totalBusinessExpenses)}
                  </div>
                  <p className="mt-0.5 text-[9px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
                    All operational expenditures (Common + Personal)
                  </p>
                </CardContent>
              </Card>

              {/* Total Partner Contributions */}
              <Card className="border-l-2 sm:border-l-4 border-l-blue-500 flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-1 p-2 sm:p-4">
                  <CardTitle className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                    Contributions
                  </CardTitle>
                  <Landmark className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                </CardHeader>
                <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-xs sm:text-xl font-bold font-mono text-blue-600 truncate">
                    {formatINR(summary.totalPartnerContributions)}
                  </div>
                  <p className="mt-0.5 text-[9px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
                    Personal money injected into business funds
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 5. Expense Breakdown & Account Source Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <span>Expense Breakdown by Payment Route</span>
                </CardTitle>
                <CardDescription>
                  Comparison between expenses paid from common business cash vs personally paid.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">
                      Paid from Common Business Account
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Directly subtracted from common cash pool
                    </div>
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {formatINR(summary.commonAccountExpenses)}
                  </div>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-purple-900">
                      Personally Paid by Partners
                    </div>
                    <div className="text-[11px] text-purple-700">
                      Excluded from common cash pool deduction
                    </div>
                  </div>
                  <div className="text-base font-bold font-mono text-purple-900">
                    {formatINR(summary.partnerPersonallyPaidExpenses)}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Cumulative Expenses:</span>
                  <span className="font-bold font-mono text-slate-800">
                    {formatINR(summary.totalBusinessExpenses)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Ledger Breakdown & Balance Proof */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-600" />
                  <span>Common Cash Balance Mathematical Proof</span>
                </CardTitle>
                <CardDescription>
                  Audit reconciliation verifying no arithmetic leakage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Total Business Revenue (+)</span>
                  <span className="font-mono font-medium text-emerald-600">
                    +{formatINR(summary.totalBusinessIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Total Partner Contributions (+)</span>
                  <span className="font-mono font-medium text-blue-600">
                    +{formatINR(summary.totalPartnerContributions)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Common Business Expenditures (-)</span>
                  <span className="font-mono font-medium text-rose-600">
                    -{formatINR(summary.commonAccountExpenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 pt-3 font-semibold text-sm border-t border-slate-200">
                  <span className="text-slate-900">Computed Common Business Balance (=)</span>
                  <span className="font-mono text-emerald-700">
                    {formatINR(summary.commonBusinessBalance)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 6. Partner Accounts Summary Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-700" />
                  <span>Partner Financial Accounts</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Individual partner contributions and personally paid business expenses.
                </p>
              </div>
              <Link
                to="/partners"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                <span>Full Partner Accounts View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {partnerSummaries.map((ps) => {
                const isMe = currentPartner?.id === ps.partnerId || (currentPartner as any)?._id === ps.partnerId;
                return (
                  <Card key={ps.partnerId} className="hover:border-slate-300 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{ps.partnerName}</span>
                          {isMe && (
                            <span className="text-[10px] bg-slate-900 text-white font-semibold px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          {ps.transactionCount} entries
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <CardDescription className="text-xs">
                          {ps.partnerPhone || 'No phone set'}
                        </CardDescription>
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => setIsEditPhoneModalOpen(true)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Phone</span>
                          </button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs pt-2">
                      <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                        <span className="text-slate-600">Contributed to Pool:</span>
                        <span className="font-mono font-bold text-blue-700">
                          {formatINR(ps.totalContributions)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center justify-between">
                        <span className="text-slate-600">Paid Personally:</span>
                        <span className="font-mono font-bold text-purple-700">
                          {formatINR(ps.totalPersonallyPaidExpenses)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Edit Own Phone Modal */}
          <EditPartnerPhoneModal
            isOpen={isEditPhoneModalOpen}
            onClose={() => setIsEditPhoneModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
