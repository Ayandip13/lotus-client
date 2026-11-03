import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Eye,
  CreditCard,
  Clock,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { invoiceService } from '../services/invoiceService';
import { InvoiceItem } from '../types/invoice.types';
import { apiClient } from '../../../services/api';
import { RecordCustomerPaymentModal } from '../../dues/components/RecordCustomerPaymentModal';

export const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);

  // Filter state
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    invoiceType: '',
    paymentStatus: '',
    relatedEvent: '',
    startDate: '',
    endDate: '',
  });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const [res, eventsRes, partnersRes] = await Promise.all([
        invoiceService.getInvoices({
          page,
          limit: 15,
          search: filters.search || undefined,
          invoiceType: filters.invoiceType || undefined,
          paymentStatus: filters.paymentStatus || undefined,
          relatedEvent: filters.relatedEvent || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
        apiClient.get('/events').catch(() => ({ data: { data: { items: [] } } })),
        apiClient.get('/accounts/partners').catch(() => ({ data: { data: [] } })),
      ]);

      setInvoices(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(res?.pagination?.totalPages || 1);

      if (eventsRes?.data?.data?.items) {
        setEvents(
          eventsRes.data.data.items.map((ev: any) => ({
            id: ev._id,
            title: ev.title,
          }))
        );
      }

      if (partnersRes?.data?.data) {
        setPartners(
          partnersRes.data.data.map((p: any) => ({
            id: p.partnerId || p._id,
            name: p.partnerName || p.name,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setPage(1);
    setFilters({
      search: '',
      invoiceType: '',
      paymentStatus: '',
      relatedEvent: '',
      startDate: '',
      endDate: '',
    });
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search invoice # or customer...',
    },
    {
      key: 'invoiceType',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'GST Invoice', value: 'GST' },
        { label: 'Non-GST Invoice', value: 'NON_GST' },
      ],
      placeholder: 'All Types',
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Paid', value: 'PAID' },
        { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
        { label: 'Unpaid', value: 'UNPAID' },
        { label: 'Overdue', value: 'OVERDUE' },
      ],
      placeholder: 'All Statuses',
    },
    {
      key: 'relatedEvent',
      label: 'Event',
      type: 'select',
      options: events.map((ev) => ({ label: ev.title, value: ev.id })),
      placeholder: 'All Events',
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Invoices</h1>
          <p className="text-sm text-slate-500">
            Generate and manage customer-facing GST and Non-GST catering invoices
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm"
            onClick={() => navigate('/dues/customers')}
          >
            Customer Dues
          </Button>
          <Button
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm"
            onClick={() => navigate('/invoices/new')}
          >
            Create New Invoice
          </Button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <FilterPanel
        configs={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} columns={6} className="border-0 shadow-none rounded-none" />
        ) : !invoices || invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-800 font-semibold text-sm">No Invoices Found</p>
            <p className="text-slate-500 text-xs mt-1">
              Create an invoice for an upcoming catering event to begin billing.
            </p>
            <Button
              size="sm"
              className="mt-4 text-xs"
              onClick={() => navigate('/invoices/new')}
            >
              + Create First Invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3">Invoice # & Date</th>
                  <th className="px-6 py-3">Customer & Event</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Grand Total</th>
                  <th className="px-6 py-3">Paid Amount</th>
                  <th className="px-6 py-3 text-rose-600">Remaining Due</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoices || []).map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </p>
                      {inv.dueDate && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{inv.customerName}</p>
                      <p className="text-xs text-slate-500">{inv.customerPhone}</p>
                      {inv.relatedEvent && (
                        <span className="inline-block mt-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {inv.relatedEvent.title}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {inv.invoiceType === 'GST' ? (
                        <Badge variant="default" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          GST ({inv.taxDetails?.totalTax ? `₹${inv.taxDetails.totalTax.toLocaleString()}` : '0%'})
                        </Badge>
                      ) : (
                        <Badge variant="outline">NON-GST</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-700">
                      ₹{inv.amountPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-rose-600">
                      ₹{inv.remainingDue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {inv.paymentStatus === 'PAID' ? (
                        <Badge variant="success">PAID</Badge>
                      ) : inv.paymentStatus === 'PARTIALLY_PAID' ? (
                        <Badge variant="warning">PARTIALLY PAID</Badge>
                      ) : inv.paymentStatus === 'OVERDUE' ? (
                        <Badge variant="danger">OVERDUE</Badge>
                      ) : (
                        <Badge variant="default">UNPAID</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.remainingDue > 0 && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => {
                              setSelectedInvoiceForPayment({
                                invoiceId: inv._id,
                                invoiceNumber: inv.invoiceNumber,
                                customerName: inv.customerName,
                                totalBillAmount: inv.grandTotal,
                                remainingDue: inv.remainingDue,
                              });
                            }}
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2"
                          onClick={() => navigate(`/invoices/${inv._id}`)}
                          title="View & Print Invoice"
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

      {/* Record Payment Modal */}
      {selectedInvoiceForPayment && (
        <RecordCustomerPaymentModal
          dueItem={selectedInvoiceForPayment}
          partners={partners}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => loadInvoices()}
        />
      )}
    </div>
  );
};
