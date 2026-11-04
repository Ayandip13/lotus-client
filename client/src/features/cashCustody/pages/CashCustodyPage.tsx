import React, { useState } from 'react';
import {
  Wallet,
  Building,
  ArrowRightLeft,
  Plus,
  Coins,
  History,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { CashMovementItem } from '../types/cashCustody.types';
import { RecordCashMovementModal } from '../components/RecordCashMovementModal';
import { useCashCustodyOverview, useCashMovements } from '../hooks/useCashCustody';
import { useBookings } from '../../bookings/hooks/useBookings';

export const CashCustodyPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    movementType: '',
    partner: '',
    startDate: '',
    endDate: '',
  });

  // Queries
  const { data: overview, isLoading: isOverviewLoading, isFetching: isOverviewFetching } = useCashCustodyOverview();
  const { data: movementsData, isLoading: isMovementsLoading, isFetching: isMovementsFetching } = useCashMovements({
    page,
    limit: 15,
    search: filters.search || undefined,
    movementType: filters.movementType || undefined,
    partner: filters.partner || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const { data: eventsData, isLoading: isEventsLoading } = useBookings({ limit: 100 });

  const loading = isOverviewLoading || isMovementsLoading || isEventsLoading;
  const isFetching = isOverviewFetching || isMovementsFetching;

  const movements: CashMovementItem[] = Array.isArray(movementsData?.items) ? movementsData.items : [];
  const totalPages = movementsData?.pagination?.totalPages || 1;

  const events = (eventsData?.items || []).map((ev: any) => ({
    id: ev._id,
    title: ev.title,
  }));

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setPage(1);
    setFilters({ search: '', movementType: '', partner: '', startDate: '', endDate: '' });
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search description...',
    },
    {
      key: 'movementType',
      label: 'Movement Type',
      type: 'select',
      options: [
        { label: 'Partner Handover', value: 'PARTNER_HANDOVER' },
        { label: 'Bank Deposit', value: 'BANK_DEPOSIT' },
        { label: 'Bank Withdrawal', value: 'BANK_WITHDRAWAL' },
        { label: 'Cash Expense', value: 'CASH_EXPENSE' },
        { label: 'Income Assigned', value: 'CASH_INCOME_ASSIGNED' },
        { label: 'Opening Balance', value: 'OPENING_BALANCE' },
      ],
      placeholder: 'All Types',
    },
    {
      key: 'partner',
      label: 'Partner',
      type: 'select',
      options:
        overview?.partners && overview.partners.length > 0
          ? overview.partners.map((p) => ({ label: p.partnerName, value: p.partnerId }))
          : [
              { label: 'Partner 1', value: '6ae74e7f83df4e2c4c410093' },
              { label: 'Partner 2', value: '6ae74e7f83df4e2c4c41009b' },
              { label: 'Partner 3', value: '6ae74e8083df4e2c4c4100a1' },
            ],
      placeholder: 'All Partners',
    },
    {
      key: 'startDate',
      label: 'From Date',
      type: 'date',
    },
    {
      key: 'endDate',
      label: 'To Date',
      type: 'date',
    },
  ];

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'PARTNER_HANDOVER':
        return <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50/50">Partner Handover</Badge>;
      case 'BANK_DEPOSIT':
        return <Badge variant="success">Bank Deposit</Badge>;
      case 'BANK_WITHDRAWAL':
        return <Badge variant="warning">Bank Withdrawal</Badge>;
      case 'CASH_EXPENSE':
        return <Badge variant="danger">Cash Expense</Badge>;
      case 'CASH_INCOME_ASSIGNED':
        return <Badge variant="default">Income Assigned</Badge>;
      case 'OPENING_BALANCE':
        return <Badge variant="default">Opening Balance</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Cash Custody & Reconciliation
            </h1>
            {isFetching && !loading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
            Track individual partner cash-in-hand, cash handovers, bank deposits, and withdrawals
          </p>
        </div>
        <div>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="w-full sm:w-auto gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Record Cash Movement
          </Button>
        </div>
      </div>

      {/* Aggregate Balance Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider truncate">
              Physical Cash
            </span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-2xl font-black text-emerald-700 truncate tracking-tight">
              ₹{(overview?.totalBusinessCashInHand || 0).toLocaleString()}
            </p>
            <span className="text-[9.5px] sm:text-[11px] text-slate-400 block mt-0.5 truncate">
              Across all 3 partners
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider truncate">
              Bank Balance
            </span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-2xl font-black text-indigo-700 truncate tracking-tight">
              ₹{(overview?.commonBusinessBankBalance || 0).toLocaleString()}
            </p>
            <span className="text-[9.5px] sm:text-[11px] text-slate-400 block mt-0.5 truncate">
              Common bank account
            </span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-300 tracking-wider block">
              Total Business Liquid Assets
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              ₹{(overview?.commonBusinessTotalBalance || (overview?.totalBusinessCashInHand || 0) + (overview?.commonBusinessBankBalance || 0)).toLocaleString()}
            </p>
            <span className="text-[9.5px] sm:text-[11px] text-slate-400 block mt-0.5">
              Physical Cash in Hand + Bank Balance
            </span>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* 3 Partners Cash Breakdown */}
      <div>
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 sm:mb-3">
          Partner-Wise Physical Cash Custody
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-32" />
                  <Skeleton className="h-5 sm:h-8 w-14 sm:w-28" />
                </div>
              ))
            : overview?.partners?.map((partner) => (
                <div
                  key={partner.partnerId}
                  className="p-2.5 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-base font-bold text-slate-900 truncate">{partner.partnerName}</h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate">{partner.partnerPhone || 'Partner'}</p>
                    </div>
                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] sm:text-sm shrink-0">
                      {partner.partnerName?.charAt(0) || 'P'}
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100">
                    <span className="text-[9.5px] sm:text-xs text-slate-400 font-medium block truncate">Cash-in-Hand:</span>
                    <span className="text-xs sm:text-xl font-black font-mono text-emerald-700 block truncate mt-0.5">
                      ₹{(partner.cashInHand || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        configs={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Audit Log of Cash Movements */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Cash Movements & Handover Audit Log</h2>
          </div>
          <span className="text-xs text-slate-400">Chronological history with running balances</span>
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : movements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Cash Movements Recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No cash transactions or partner handovers match the selected filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From Partner / Source</th>
                  <th className="py-3 px-4">To Partner / Destination</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Description / Linked Event</th>
                  <th className="py-3 px-4">Audit Partner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      {new Date(m.movementDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">{getMovementBadge(m.movementType)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {m.fromPartner?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {m.toPartner?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ₹{m.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <span className="block text-slate-900 font-medium">{m.description}</span>
                      {m.relatedEvent?.title && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          Event: {m.relatedEvent.title}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {m.createdByPartner?.name || 'Partner'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Movement Modal */}
      <RecordCashMovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partners={overview?.partners || []}
        events={events}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
};
