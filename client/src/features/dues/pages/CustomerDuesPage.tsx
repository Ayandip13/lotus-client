import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Phone,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { dueService } from '../services/dueService';
import { CustomerDuesSummary, CustomerDueItem } from '../types/due.types';
import { RecordCustomerPaymentModal } from '../components/RecordCustomerPaymentModal';
import { apiClient } from '../../../services/api';

export const CustomerDuesPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CustomerDuesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedDue, setSelectedDue] = useState<CustomerDueItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    relatedEvent: '',
    status: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [duesData, partnersRes, eventsRes] = await Promise.all([
        dueService.getCustomerDues({
          customerName: filters.search || undefined,
          relatedEvent: filters.relatedEvent || undefined,
        }),
        apiClient.get('/accounts/partners').catch(() => ({ data: { data: [] } })),
        apiClient.get('/events').catch(() => ({ data: { data: { items: [] } } })),
      ]);

      setSummary(duesData);

      if (partnersRes?.data?.data) {
        setPartners(
          partnersRes.data.data.map((p: any) => ({
            id: p.partnerId || p._id,
            name: p.partnerName || p.name,
          }))
        );
      }

      if (eventsRes?.data?.data?.items) {
        setEvents(
          eventsRes.data.data.items.map((ev: any) => ({
            id: ev._id,
            title: ev.title,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load customer dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.relatedEvent]);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Due Management</h1>
          <p className="text-sm text-slate-500">
            Track outstanding event balances, customer receivables, and payment histories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => navigate('/invoices')}
          >
            <Receipt className="w-4 h-4 mr-1.5" /> View Invoices
          </Button>
          <Button
            className="text-xs"
            onClick={() => navigate('/invoices/new')}
          >
            + Create New Invoice
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Outstanding Due
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-rose-600">
              ₹{summary ? summary.totalCustomerDue.toLocaleString() : '0'}
            </p>
          )}
          <span className="text-xs text-slate-500 mt-1 block">Awaiting customer clearance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue Amount
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-amber-700">
              ₹{summary ? summary.overdueAmount.toLocaleString() : '0'}
            </p>
          )}
          <span className="text-xs text-amber-600 font-medium mt-1 block">
            {loading ? <Skeleton className="h-3 w-24 inline-block" /> : `${summary?.overdueCount || 0} overdue invoices`}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Amount Invoiced
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-slate-900">
              ₹{summary ? summary.totalInvoiced.toLocaleString() : '0'}
            </p>
          )}
          <span className="text-xs text-slate-500 mt-1 block">Across active invoices</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Amount Collected
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-emerald-700">
              ₹{summary ? summary.totalCollected.toLocaleString() : '0'}
            </p>
          )}
          <span className="text-xs text-emerald-600 font-medium mt-1 block">Received into business</span>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <FilterPanel
        configs={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Dues List Table & Responsive Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Outstanding Customer Invoices {loading ? '' : `(${displayedDues.length})`}
          </h2>
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={6} className="border-0 shadow-none rounded-none" />
        ) : displayedDues.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-800 font-semibold text-sm">No Outstanding Customer Dues</p>
            <p className="text-slate-500 text-xs mt-1">
              All active customer invoices are fully settled or match none of your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3">Customer & Event</th>
                  <th className="px-6 py-3">Invoice Details</th>
                  <th className="px-6 py-3">Total Invoiced</th>
                  <th className="px-6 py-3">Received</th>
                  <th className="px-6 py-3 text-rose-600">Remaining Due</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDues.map((item) => (
                  <tr key={item.invoiceId} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{item.customerName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {item.customerPhone}
                        </p>
                        {item.relatedEvent && (
                          <span className="inline-block mt-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.relatedEvent.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">#{item.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">
                        Date: {new Date(item.invoiceDate).toLocaleDateString()}
                      </p>
                      {item.dueDate && (
                        <p
                          className={`text-xs mt-0.5 font-medium ${
                            item.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      ₹{item.totalBillAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-700">
                      ₹{item.amountReceived.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-rose-600">
                      ₹{item.remainingDue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {item.isOverdue ? (
                        <Badge variant="danger">OVERDUE</Badge>
                      ) : item.paymentStatus === 'PARTIALLY_PAID' ? (
                        <Badge variant="warning">PARTIALLY PAID</Badge>
                      ) : (
                        <Badge variant="default">UNPAID</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => {
                            setSelectedDue(item);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Record Payment
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2"
                          onClick={() => navigate(`/invoices/${item.invoiceId}`)}
                          title="View Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
      {isPaymentModalOpen && selectedDue && (
        <RecordCustomerPaymentModal
          dueItem={selectedDue}
          partners={partners}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedDue(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
