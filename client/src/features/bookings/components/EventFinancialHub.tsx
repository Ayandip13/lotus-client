import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonStatCard, SkeletonTable } from '../../../components/ui/Skeleton';
import { useEventFinancials } from '../hooks/useBookings';
import { useVendors } from '../../dues/hooks/useDues';
import { usePartnerSummaries } from '../../accounts/hooks/useAccounts';
import { RecordCustomerPaymentModal } from '../../dues/components/RecordCustomerPaymentModal';
import { RecordVendorPaymentModal } from '../../dues/components/RecordVendorPaymentModal';
import { CreateVendorBillModal } from '../../dues/components/CreateVendorBillModal';

interface EventFinancialHubProps {
  eventId: string;
}

export const EventFinancialHub: React.FC<EventFinancialHubProps> = ({ eventId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'invoices' | 'collections' | 'expenses' | 'vendors'>('invoices');

  // Modals
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [selectedVendorDue, setSelectedVendorDue] = useState<any>(null);
  const [isVendorBillModalOpen, setIsVendorBillModalOpen] = useState(false);

  // Queries using centralized TanStack Query hooks
  const { data, isLoading: isFinLoading } = useEventFinancials(eventId);
  const { data: vendors = [], isLoading: isVendorsLoading } = useVendors();
  const { data: rawPartners = [], isLoading: isPartnersLoading } = usePartnerSummaries();

  const loading = isFinLoading || isVendorsLoading || isPartnersLoading;

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
            <Skeleton className="h-8 w-24 rounded-lg" />
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

  const { summary, collections, expenses, invoices, vendorBills } = data;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Event Financial Hub</h2>
          <p className="text-xs text-slate-500">
            Dedicated financials, billings, collections, and supplier dues for this event
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => navigate(`/invoices/new?eventId=${eventId}`)}
          >
            + Create Invoice
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => navigate(`/transactions/new?eventId=${eventId}`)}
          >
            + Record Ledger Entry
          </Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={() => setIsVendorBillModalOpen(true)}
          >
            + Add Vendor Due
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Invoiced</span>
          <p className="text-base font-bold text-slate-900 mt-1">₹{summary.totalInvoiced.toLocaleString()}</p>
        </div>

        <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Amount Collected</span>
          <p className="text-base font-bold text-emerald-700 mt-1">
            ₹{summary.totalAmountCollected.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-200/60 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-rose-800 block">Customer Due</span>
          <p className="text-base font-bold text-rose-600 mt-1">
            ₹{summary.remainingCustomerDue.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">Recorded Expenses</span>
          <p className="text-base font-bold text-amber-700 mt-1">₹{summary.totalExpenses.toLocaleString()}</p>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-200/60 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-indigo-800 block">Vendor Due</span>
          <p className="text-base font-bold text-indigo-700 mt-1">₹{summary.totalVendorDue.toLocaleString()}</p>
        </div>

        <div className="p-3 bg-slate-900 text-white rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-300 block">Net Cashflow</span>
          <p className={`text-base font-black mt-1 ${summary.netCashflow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            ₹{summary.netCashflow.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center gap-1.5 border border-slate-200/60">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          <strong>Accounting Principle:</strong> Net cashflow represents cash collected minus cash expenses. Final profit
          must also account for outstanding vendor payables and partner contributions.
        </span>
      </div>

      {/* Hub Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'collections'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Customer Collections ({collections.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'expenses'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'vendors'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Vendor Payables ({vendorBills.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No invoices issued for this event yet.</p>
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
                    <tr key={inv._id}>
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
                              className="h-7 text-[11px] px-2"
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
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            <Eye className="w-3 h-3" />
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
                    <tr key={c._id}>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(c.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{c.description}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.partner?.name || 'Common Business'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        ₹{c.amount.toLocaleString()}
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
                    <tr key={e._id}>
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
                      <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                        ₹{e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="space-y-3">
          {vendorBills.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No vendor payables associated with this event.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Total Payable</th>
                    <th className="py-2.5 px-3">Paid</th>
                    <th className="py-2.5 px-3 text-rose-600">Remaining Due</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorBills.map((vb: any) => (
                    <tr key={vb._id}>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{vb.vendor?.name}</p>
                        <span className="text-[10px] text-slate-500">{vb.vendor?.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{vb.description}</td>
                      <td className="py-2.5 px-3 font-semibold">₹{vb.totalAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-700">₹{vb.paidAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-600">
                        ₹{vb.remainingAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={vb.status === 'PAID' ? 'success' : 'default'}>{vb.status}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {vb.remainingAmount > 0 && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() =>
                              setSelectedVendorDue({
                                billId: vb._id,
                                vendorName: vb.vendor?.name,
                                description: vb.description,
                                totalPayableAmount: vb.totalAmount,
                                remainingAmount: vb.remainingAmount,
                              })
                            }
                          >
                            Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modals */}
      {selectedInvoiceForPayment && (
        <RecordCustomerPaymentModal
          dueItem={selectedInvoiceForPayment}
          partners={partners}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => setSelectedInvoiceForPayment(null)}
        />
      )}

      {selectedVendorDue && (
        <RecordVendorPaymentModal
          dueItem={selectedVendorDue}
          partners={partners}
          onClose={() => setSelectedVendorDue(null)}
          onSuccess={() => setSelectedVendorDue(null)}
        />
      )}

      {isVendorBillModalOpen && (
        <CreateVendorBillModal
          isOpen={isVendorBillModalOpen}
          vendors={vendors}
          events={[{ id: eventId, title: data?.event?.title || 'This Event' }]}
          defaultEventId={eventId}
          onClose={() => setIsVendorBillModalOpen(false)}
          onSuccess={() => setIsVendorBillModalOpen(false)}
        />
      )}
    </div>
  );
};
