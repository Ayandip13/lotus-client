import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Receipt,
  CheckCircle2,
  CreditCard,
  Eye,
  Phone,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { CustomerDueItem } from '../types/due.types';
import { RecordCustomerPaymentModal } from '../components/RecordCustomerPaymentModal';
import { useCustomerDues } from '../hooks/useDues';
import { usePartnerSummaries } from '../../accounts/hooks/useAccounts';
import { useBookings } from '../../bookings/hooks/useBookings';

export const CustomerDuesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDue, setSelectedDue] = useState<CustomerDueItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    relatedEvent: '',
    status: '',
  });

  // Queries
  const { data: summary, isLoading: loading, isFetching } = useCustomerDues({
    customerName: filters.search || undefined,
    relatedEvent: filters.relatedEvent || undefined,
  });

  const { data: rawPartners = [] } = usePartnerSummaries();
  const { data: eventsData } = useBookings({ limit: 100 });

  const partners = rawPartners.map((p: any) => ({
    id: p.partnerId || p._id,
    name: p.partnerName || p.name,
  }));

  const events = (eventsData?.items || []).map((ev: any) => ({
    id: ev._id,
    title: ev.title,
  }));

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', relatedEvent: '', status: '' });
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Customer Name',
      type: 'text',
      placeholder: 'Search customer name...',
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

  // Client-side status filtering if needed
  const displayedDues =
    summary?.dues?.filter((due) => {
      if (!filters.status) return true;
      if (filters.status === 'OVERDUE') return due.isOverdue;
      return due.paymentStatus === filters.status;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Due Management</h1>
            {isFetching && !loading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="text-sm text-slate-500">
            Track outstanding event balances, customer receivables, and payment histories
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Receipt className="w-4 h-4 text-slate-600" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm"
            onClick={() => navigate('/invoices')}
          >
            View Invoices
          </Button>
          <Button
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm"
            onClick={() => navigate('/invoices/new')}
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
            </div>
          ))
        ) : (
          <>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs uppercase font-bold text-slate-500">Total Customer Due</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                ₹{(summary?.totalCustomerDue || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Across {summary?.dues?.length || 0} active unpaid / partial invoices
              </span>
            </div>

            <div className="p-5 bg-rose-50/60 border border-rose-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-rose-800">Overdue Customer Receivables</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-rose-700 mt-1">
                ₹{(summary?.overdueAmount || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-rose-600/80 block mt-1">
                {summary?.overdueCount || 0} invoices past payment due date
              </span>
            </div>

            <div className="p-5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl shadow-sm">
              <span className="text-xs uppercase font-bold text-emerald-800">Total Invoiced Amount</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                ₹{(summary?.totalInvoiced || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600/80 block mt-1">
                Cumulative revenue booked for filtered events
              </span>
            </div>

            <div className="p-5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl shadow-sm">
              <span className="text-xs uppercase font-bold text-indigo-800">Collected Amount</span>
              <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                ₹{(summary?.totalCollected || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-indigo-600/80 block mt-1">
                Received & verified via ledger entries
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
            <h3 className="text-base font-bold text-slate-900">Zero Outstanding Dues</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All client payments are currently up to date. No pending customer collections.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Client Details</th>
                  <th className="py-3 px-4">Associated Event</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedDues.map((item) => (
                  <tr
                    key={item.invoiceId}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      item.isOverdue ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{item.customerName}</span>
                      <a
                        href={`tel:${item.customerPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-mono"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        {item.customerPhone}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {item.relatedEvent?.title || 'General Catering Job'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono">₹{item.totalBillAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700 font-medium">
                      ₹{item.amountReceived.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                      ₹{item.remainingDue.toLocaleString()}
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                          onClick={() => {
                            setSelectedDue(item);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          Record Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => navigate(`/invoices/${item.invoiceId}`)}
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </div>
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
        <RecordCustomerPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedDue(null);
          }}
          invoice={{
            _id: selectedDue.invoiceId,
            invoiceNumber: selectedDue.invoiceNumber,
            customerName: selectedDue.customerName,
            balanceDue: selectedDue.remainingDue,
          }}
          partners={partners}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setSelectedDue(null);
          }}
        />
      )}
    </div>
  );
};
