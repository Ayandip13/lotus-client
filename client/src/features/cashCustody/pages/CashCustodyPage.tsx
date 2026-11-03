import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building,
  ArrowRightLeft,
  Plus,
  Coins,
  History,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { cashCustodyService } from '../services/cashCustodyService';
import { CashCustodyOverview, CashMovementItem } from '../types/cashCustody.types';
import { RecordCashMovementModal } from '../components/RecordCashMovementModal';
import { apiClient } from '../../../services/api';

export const CashCustodyPage: React.FC = () => {
  const [overview, setOverview] = useState<CashCustodyOverview | null>(null);
  const [movements, setMovements] = useState<CashMovementItem[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    movementType: '',
    partner: '',
    startDate: '',
    endDate: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, movementsRes, eventsRes] = await Promise.all([
        cashCustodyService.getOverview(),
        cashCustodyService.getMovements({
          page,
          limit: 15,
          search: filters.search || undefined,
          movementType: filters.movementType || undefined,
          partner: filters.partner || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
        apiClient.get('/events').catch(() => ({ data: { data: { items: [] } } })),
      ]);

      setOverview(overviewData);
      setMovements(Array.isArray(movementsRes?.items) ? movementsRes.items : []);
      setTotalPages(movementsRes?.pagination?.totalPages || 1);

      if (eventsRes?.data?.data?.items) {
        setEvents(
          eventsRes.data.data.items.map((ev: any) => ({
            id: ev._id,
            title: ev.title,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load cash custody:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filters]);

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
      options: overview?.partners.map((p) => ({ label: p.partnerName, value: p.partnerId })) || [],
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
        return <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50">HANDOVER</Badge>;
      case 'BANK_DEPOSIT':
        return <Badge variant="default" className="bg-blue-600">BANK DEPOSIT</Badge>;
      case 'BANK_WITHDRAWAL':
        return <Badge variant="warning">BANK WITHDRAWAL</Badge>;
      case 'CASH_EXPENSE':
        return <Badge variant="danger">CASH EXPENSE</Badge>;
      case 'CASH_INCOME_ASSIGNED':
        return <Badge variant="success">INCOME ASSIGNED</Badge>;
      case 'OPENING_BALANCE':
        return <Badge variant="outline">OPENING BALANCE</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partner Cash Custody</h1>
          <p className="text-sm text-slate-500">
            Track physical business cash-in-hand held by each partner, handovers, and bank reconciliation
          </p>
        </div>
        <Button
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          Record Cash Movement
        </Button>
      </div>

      {/* Explanatory Notice */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex items-start gap-3">
        <div className="p-2 bg-white/10 rounded-xl">
          <Coins className="w-5 h-5 text-amber-300" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-white text-sm">Business Cash Custody Principle</p>
          <p className="text-slate-300 leading-relaxed">
            These figures represent <strong>physical business cash</strong> currently held in the physical custody of each
            partner for day-to-day procurement, vendor cash settlements, and event operations. Personal funds and personal
            expenses remain strictly separated.
          </p>
        </div>
      </div>

      {/* Partner Cash Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            ))
          : overview?.partners.map((partner, index) => (
              <div
                key={partner.partnerId}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Partner {index + 1} Custody
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-xs">
                    {partner.partnerName.charAt(0)}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">{partner.partnerName}</h3>
                <p className="text-xs text-slate-500 mb-4">{partner.partnerPhone || partner.partnerEmail || 'Active Partner'}</p>
                <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Physical Cash:</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{partner.cashInHand.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* Reconciled Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
              Total Physical Cash Held by Partners
            </span>
            {loading ? (
              <Skeleton className="h-9 w-36 bg-slate-700 my-1" />
            ) : (
              <p className="text-3xl font-black text-amber-300">
                ₹{overview ? overview.totalBusinessCashInHand.toLocaleString() : '0'}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">Sum of cash across all 3 partners</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <Wallet className="w-7 h-7 text-amber-300" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Common Business Bank Account Balance
            </span>
            {loading ? (
              <Skeleton className="h-9 w-36 my-1" />
            ) : (
              <p className="text-3xl font-black text-blue-700">
                ₹{overview ? overview.commonBusinessBankBalance.toLocaleString() : '0'}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">Bank account funds (separate from cash custody)</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl">
            <Building className="w-7 h-7 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <FilterPanel
        configs={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Cash Movement Audit History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cash Movement & Handover History {loading ? '' : `(${(movements || []).length})`}
            </h2>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={5} className="border-0 shadow-none rounded-none" />
        ) : !movements || movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs py-10">
            No cash movements match the active filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Movement Type</th>
                  <th className="px-6 py-3">Channel / Parties</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(movements || []).map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(m.movementDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{getMovementBadge(m.movementType)}</td>
                    <td className="px-6 py-4 text-xs">
                      {m.fromPartner && m.toPartner ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <span>{m.fromPartner.name}</span>
                          <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                          <span>{m.toPartner.name}</span>
                        </div>
                      ) : m.fromPartner ? (
                        <span className="font-medium text-slate-800">From: {m.fromPartner.name}</span>
                      ) : m.toPartner ? (
                        <span className="font-medium text-slate-800">To: {m.toPartner.name}</span>
                      ) : (
                        <span className="text-slate-400">Common Business</span>
                      )}
                      {m.relatedEvent && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Event: {m.relatedEvent.title}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 max-w-xs">{m.description}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ₹{m.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Movement Modal */}
      {isModalOpen && overview && (
        <RecordCashMovementModal
          isOpen={isModalOpen}
          partners={overview.partners}
          events={events}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
};
