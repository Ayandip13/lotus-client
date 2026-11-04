import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { VendorDueItem } from '../types/due.types';
import { RecordVendorPaymentModal } from '../components/RecordVendorPaymentModal';
import { CreateVendorBillModal } from '../components/CreateVendorBillModal';
import { CreateVendorModal } from '../components/CreateVendorModal';
import { useVendorDues, useVendors } from '../hooks/useDues';
import { useBookings } from '../../bookings/hooks/useBookings';
import { usePartnerSummaries } from '../../accounts/hooks/useAccounts';

export const VendorDuesPage: React.FC = () => {
  // Modals state
  const [selectedDue, setSelectedDue] = useState<VendorDueItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    vendor: '',
    relatedEvent: '',
    status: '',
  });

  // Queries
  const { data: summary, isLoading: isSummaryLoading, isFetching } = useVendorDues({
    vendor: filters.vendor || undefined,
    relatedEvent: filters.relatedEvent || undefined,
  });

  const { data: vendors = [], isLoading: isVendorsLoading } = useVendors();
  const { data: eventsData, isLoading: isEventsLoading } = useBookings({ limit: 100 });
  const { data: rawPartners = [], isLoading: isPartnersLoading } = usePartnerSummaries();

  const loading = isSummaryLoading || isVendorsLoading || isEventsLoading || isPartnersLoading;

  const events = (eventsData?.items || []).map((ev: any) => ({
    id: ev._id,
    title: ev.title,
  }));

  const partners = rawPartners.map((p: any) => ({
    id: p.partnerId || p._id,
    name: p.partnerName || p.name,
  }));

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', vendor: '', relatedEvent: '', status: '' });
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'vendor',
      label: 'Supplier / Vendor',
      type: 'select',
      options: vendors.map((v) => ({ label: v.name, value: v._id })),
      placeholder: 'All Vendors',
    },
    {
      key: 'relatedEvent',
      label: 'Event',
      type: 'select',
      options: events.map((ev) => ({ label: ev.title, value: ev.id })),
      placeholder: 'All Catering Events',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Unpaid', value: 'UNPAID' },
        { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
        { label: 'Overdue', value: 'OVERDUE' },
      ],
      placeholder: 'All Dues',
    },
  ];

  const displayedDues =
    summary?.dues?.filter((due) => {
      if (!filters.status) return true;
      if (filters.status === 'OVERDUE') return due.isOverdue;
      return due.status === filters.status;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Vendor Payable & Bill Dues
            </h1>
            {isFetching && !loading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="text-sm text-slate-500">
            Track operational bills, raw material payables, and settle supplier invoices
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Building2 className="w-4 h-4 text-slate-600" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm"
            onClick={() => setIsCreateVendorModalOpen(true)}
          >
            Add Vendor
          </Button>
          <Button
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm"
            onClick={() => setIsCreateBillModalOpen(true)}
          >
            Record Vendor Bill
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-28" />
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-36" />
            </div>
          ))
        ) : (
          <>
            <div className="p-3 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider truncate">
                Total Vendor Payable
              </span>
              <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 truncate">
                ₹{(summary?.totalVendorDue || 0).toLocaleString()}
              </p>
              <span className="text-[9.5px] sm:text-[11px] text-slate-400 block mt-0.5 sm:mt-1 truncate">
                Across {summary?.dues?.length || 0} active supplier bills
              </span>
            </div>

            <div className="p-3 sm:p-5 bg-rose-50/60 border border-rose-200/80 rounded-xl sm:rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs uppercase font-bold text-rose-800 tracking-wider truncate">
                  Overdue Payables
                </span>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
              </div>
              <p className="text-lg sm:text-2xl font-black text-rose-700 mt-1 truncate">
                ₹{(summary?.overdueAmount || 0).toLocaleString()}
              </p>
              <span className="text-[9.5px] sm:text-[11px] text-rose-600/80 block mt-0.5 sm:mt-1 truncate">
                {summary?.overdueCount || 0} bills past payment due date
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 sm:p-5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl sm:rounded-2xl shadow-sm flex flex-col justify-between">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-indigo-800 tracking-wider truncate">
                Total Billed Expenses
              </span>
              <p className="text-lg sm:text-2xl font-black text-indigo-700 mt-1 truncate">
                ₹{(summary?.totalPayable || 0).toLocaleString()}
              </p>
              <span className="text-[9.5px] sm:text-[11px] text-indigo-600/80 block mt-0.5 sm:mt-1 truncate">
                Paid: ₹{(summary?.totalPaid || 0).toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        configs={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Dues Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : displayedDues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Zero Outstanding Vendor Dues</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All supplier bills and ingredient expenses have been settled in full.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Bill # / Description</th>
                  <th className="py-3 px-4">Linked Event</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance Payable</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedDues.map((item) => (
                  <tr
                    key={item.billId}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      item.isOverdue ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{item.vendorName}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-slate-800 block">
                        {item.billNumber || 'No Bill #' }
                      </span>
                      <span className="text-[11px] text-slate-500 truncate max-w-xs block">
                        {item.description}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {item.relatedEvent?.title || 'General Catering Operational'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">₹{item.totalPayableAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700 font-medium">
                      ₹{item.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                      ₹{item.remainingAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.dueDate ? (
                        <div className="flex items-center gap-1">
                          <span
                            className={
                              item.isOverdue ? 'text-rose-700 font-bold' : 'text-slate-600'
                            }
                          >
                            {new Date(item.dueDate).toLocaleDateString('en-IN')}
                          </span>
                          {item.isOverdue && (
                            <Badge variant="danger" className="text-[10px] py-0 px-1.5 ml-1">
                              OVERDUE
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Immediate</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2.5 border-rose-300 text-rose-800 hover:bg-rose-50"
                        onClick={() => {
                          setSelectedDue(item);
                          setIsPaymentModalOpen(true);
                        }}
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Settle Payment
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedDue && (
        <RecordVendorPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedDue(null);
          }}
          bill={{
            _id: selectedDue.billId,
            vendor: { name: selectedDue.vendorName },
            billNumber: selectedDue.billNumber,
            description: selectedDue.description,
            balanceDue: selectedDue.remainingAmount,
          }}
          partners={partners}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setSelectedDue(null);
          }}
        />
      )}

      {/* Create Vendor Bill Modal */}
      <CreateVendorBillModal
        isOpen={isCreateBillModalOpen}
        onClose={() => setIsCreateBillModalOpen(false)}
        vendors={vendors}
        events={events}
        onSuccess={() => setIsCreateBillModalOpen(false)}
      />

      {/* Create Vendor Directory Modal */}
      <CreateVendorModal
        isOpen={isCreateVendorModalOpen}
        onClose={() => setIsCreateVendorModalOpen(false)}
        onSuccess={() => setIsCreateVendorModalOpen(false)}
      />
    </div>
  );
};
