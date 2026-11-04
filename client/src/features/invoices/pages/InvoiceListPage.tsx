import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Eye,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { InvoiceItem } from '../types/invoice.types';
import { RecordCustomerPaymentModal } from '../../dues/components/RecordCustomerPaymentModal';
import { useInvoices } from '../hooks/useInvoices';
import { useBookings } from '../../bookings/hooks/useBookings';
import { usePartnerSummaries } from '../../accounts/hooks/useAccounts';

export const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

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

  // Queries
  const { data, isLoading, isFetching } = useInvoices({
    page,
    limit: 15,
    search: filters.search || undefined,
    invoiceType: filters.invoiceType || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    relatedEvent: filters.relatedEvent || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const { data: eventsData } = useBookings({ limit: 100 });
  const { data: partnersData = [] } = usePartnerSummaries();

  const invoices: InvoiceItem[] = Array.isArray(data?.items) ? data.items : [];
  const totalPages = data?.pagination?.totalPages || 1;

  const events = (eventsData?.items || []).map((ev: any) => ({
    id: ev._id,
    title: ev.title,
  }));

  const partners = partnersData.map((p: any) => ({
    id: p.partnerId || p._id,
    name: p.partnerName || p.name,
  }));

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Invoices</h1>
            {isFetching && !isLoading && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>
          <p className="text-sm text-slate-500">
            Generate and manage customer-facing GST and Non-GST catering invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/invoices/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        configs={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Invoices Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No bills match your current filters. Create a new catering invoice or clear filters.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/invoices/new')}>
              + Create First Invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client / Event</th>
                  <th className="py-3 px-4">Issue / Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {inv.invoiceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{inv.customerName}</span>
                      <span className="text-[11px] text-slate-400">
                        {inv.customerPhone} {inv.relatedEvent?.title ? `• ${inv.relatedEvent.title}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</span>
                      {inv.dueDate && (
                        <span className="block text-[10px] text-slate-400">
                          Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ₹{inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-medium block">
                        ₹{inv.amountPaid.toLocaleString()}
                      </span>
                      {inv.remainingDue > 0 && (
                        <span className="text-rose-700 font-semibold block text-[11px]">
                          Due: ₹{inv.remainingDue.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.paymentStatus === 'PAID' && <Badge variant="success">PAID</Badge>}
                      {inv.paymentStatus === 'PARTIALLY_PAID' && (
                        <Badge variant="warning">PARTIAL</Badge>
                      )}
                      {inv.paymentStatus === 'UNPAID' && <Badge variant="danger">UNPAID</Badge>}
                      {inv.paymentStatus === 'OVERDUE' && (
                        <Badge variant="danger" className="animate-pulse">
                          OVERDUE
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.remainingDue > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] px-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Collect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => navigate(`/invoices/${inv._id}`)}
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

      {/* Record Payment Modal */}
      {selectedInvoiceForPayment && (
        <RecordCustomerPaymentModal
          isOpen={Boolean(selectedInvoiceForPayment)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          partners={partners}
          onSuccess={() => setSelectedInvoiceForPayment(null)}
        />
      )}
    </div>
  );
};
