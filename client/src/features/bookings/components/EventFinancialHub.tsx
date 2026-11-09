import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonStatCard, SkeletonTable } from '../../../components/ui/Skeleton';
import { useEventFinancials } from '../hooks/useBookings';
import { usePartnerSummaries } from '../../accounts/hooks/useAccounts';
import { RecordCustomerPaymentModal } from '../../dues/components/RecordCustomerPaymentModal';

interface EventFinancialHubProps {
  eventId: string;
}

export const EventFinancialHub: React.FC<EventFinancialHubProps> = ({ eventId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'invoices' | 'collections' | 'expenses'>('invoices');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);

  const { data, isLoading: isFinLoading } = useEventFinancials(eventId);
  const { data: rawPartners = [], isLoading: isPartnersLoading } = usePartnerSummaries();

  const loading = isFinLoading || isPartnersLoading;

  const partners = rawPartners.map((p: any) => ({
    id: p.partnerId || p._id,
    name: p.partnerName || p.name,
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={4} columns={5} className="border-0 shadow-none rounded-none" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, collections, expenses, invoices } = data;
  const netCashflow = (summary.totalAmountCollected || 0) - (summary.totalExpenses || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Event Financials & Invoices</h2>
          <p className="text-xs text-slate-500">
            Track invoices, customer payments, and event expenses in one simple place
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={() => navigate(`/invoices/new?eventId=${eventId}`)}
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            + New Invoice
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate(`/transactions/new?type=INCOME&eventId=${eventId}`)}
          >
            <ArrowDownRight className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            + Record Income
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={() => navigate(`/transactions/new?type=EXPENSE&eventId=${eventId}`)}
          >
            <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-rose-600" />
            + Record Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Invoiced</span>
          <p className="text-lg font-bold text-slate-900 mt-1">₹{summary.totalInvoiced.toLocaleString()}</p>
        </div>

        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Amount Collected</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">
            + ₹{summary.totalAmountCollected.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-rose-800 block">Customer Due</span>
          <p className="text-lg font-bold text-rose-600 mt-1">
            ₹{summary.remainingCustomerDue.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 bg-slate-900 text-white rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-300 block">Net Balance</span>
          <p className={`text-lg font-black mt-1 ${netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netCashflow >= 0 ? '+ ' : ''}₹{netCashflow.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hub Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'collections'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Payments Received ({collections.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Expenses ({expenses.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-500 mb-2">No invoices created for this event yet.</p>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => navigate(`/invoices/new?eventId=${eventId}`)}
              >
                + Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Paid</th>
                    <th className="py-2.5 px-3 text-rose-600">Remaining Due</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv: any) => (
                    <tr key={inv._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">₹{inv.grandTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">
                        ₹{inv.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-rose-600 font-bold">
                        ₹{inv.remainingDue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={inv.paymentStatus === 'PAID' ? 'success' : 'default'}>
                          {inv.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.remainingDue > 0 && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() =>
                                setSelectedInvoiceForPayment({
                                  invoiceId: inv._id,
                                  invoiceNumber: inv.invoiceNumber,
                                  customerName: inv.customerName,
                                  totalBillAmount: inv.grandTotal,
                                  remainingDue: inv.remainingDue,
                                })
                              }
                            >
                              Collect
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
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
      )}

      {activeTab === 'collections' && (
        <div className="space-y-3">
          {collections.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No payment collections recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Received By</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collections.map((c: any) => (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(c.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{c.description}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.partner?.name || 'Common Business'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        + ₹{c.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No expenses recorded for this event yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Payment Source</th>
                    <th className="py-2.5 px-3">Partner</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e: any) => (
                    <tr key={e._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(e.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{e.description}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {e.paymentSource === 'COMMON_BUSINESS' ? 'Common Business' : 'Partner Personal'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{e.partner?.name || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        - ₹{e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Collection Modal */}
      {selectedInvoiceForPayment && (
        <RecordCustomerPaymentModal
          dueItem={selectedInvoiceForPayment}
          partners={partners}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => setSelectedInvoiceForPayment(null)}
        />
      )}
    </div>
  );
};
