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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Cash Custody & Reconciliation
            </h1>
            {isFetching && !loading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="text-sm text-slate-500">
            Track individual partner cash-in-hand, cash handovers, bank deposits, and withdrawals
          </p>
        </div>
        <div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Record Cash Movement
          </Button>
        </div>
      </div>

      {/* Aggregate Balance Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500">Total Business Physical Cash</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              ₹{(overview?.totalBusinessCashInHand || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400">Sum of cash held across all 3 partners</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500">Common Business Bank Balance</span>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">
              ₹{(overview?.commonBusinessBankBalance || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400">Bank accounts funds derived from ledger</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-300">Total Business Liquid Assets</span>
            <p className="text-2xl font-extrabold text-white mt-1">
              ₹{(overview?.commonBusinessTotalBalance || (overview?.totalBusinessCashInHand || 0) + (overview?.commonBusinessBankBalance || 0)).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-300">Physical Cash in Hand + Bank Balance</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3 Partners Cash Breakdown */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Partner-Wise Physical Cash Custody
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-28" />
                </div>
              ))
            : overview?.partners?.map((partner) => (
                <div
                  key={partner.partnerId}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{partner.partnerName}</h3>
                      <p className="text-xs text-slate-500">{partner.partnerPhone || 'Partner in Charge'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {partner.partnerName?.charAt(0) || 'P'}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Verified Cash-in-Hand:</span>
                    <span className="text-xl font-extrabold font-mono text-emerald-700">
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
