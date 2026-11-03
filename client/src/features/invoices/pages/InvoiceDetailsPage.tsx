import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SkeletonDetails } from '../../../components/ui/Skeleton';
import { invoiceService } from '../services/invoiceService';
import { InvoiceItem } from '../types/invoice.types';
import { RecordCustomerPaymentModal } from '../../dues/components/RecordCustomerPaymentModal';
import { apiClient } from '../../../services/api';

export const InvoiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<InvoiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const loadInvoice = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [data, partnersRes] = await Promise.all([
        invoiceService.getInvoiceById(id),
        apiClient.get('/accounts/partners').catch(() => ({ data: { data: [] } })),
      ]);
      setInvoice(data);
      if (partnersRes?.data?.data) {
        setPartners(
          partnersRes.data.data.map((p: any) => ({
            id: p.partnerId || p._id,
            name: p.partnerName || p.name,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = async () => {
    if (!invoice) return;

    const message = `*INVOICE: ${invoice.invoiceNumber}*\n` +
      `Lotus Caterer - Wedding & Event Catering Services\n\n` +
      `*Customer:* ${invoice.customerName}\n` +
      `*Event:* ${invoice.relatedEvent?.title || 'Catering Assignment'}\n` +
      `*Date:* ${new Date(invoice.invoiceDate).toLocaleDateString()}\n` +
      `*Grand Total:* ₹${invoice.grandTotal.toLocaleString()}\n` +
      `*Amount Paid:* ₹${invoice.amountPaid.toLocaleString()}\n` +
      `*Remaining Due:* ₹${invoice.remainingDue.toLocaleString()}\n` +
      `*Status:* ${invoice.paymentStatus}\n\n` +
      `Thank you for choosing Lotus Caterer! For queries, please contact us${invoice.businessDetails?.phone ? ` at ${invoice.businessDetails.phone}` : ''}.`;

    // 1. Try Native Web Share API if supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: message,
          url: window.location.href,
        });
        setShareFeedback('Shared successfully');
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Native share failed, falling back to WhatsApp link:', err);
        }
      }
    }

    // 2. Fallback: Open WhatsApp directly with prefilled text
    const cleanPhone = invoice.customerPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <SkeletonDetails />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-slate-800 font-bold">Invoice Not Found</p>
        <Button className="mt-4" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Action Navigation Header (Hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
              {invoice.paymentStatus === 'PAID' ? (
                <Badge variant="success">PAID</Badge>
              ) : invoice.paymentStatus === 'PARTIALLY_PAID' ? (
                <Badge variant="warning">PARTIALLY PAID</Badge>
              ) : invoice.paymentStatus === 'OVERDUE' ? (
                <Badge variant="danger">OVERDUE</Badge>
              ) : (
                <Badge variant="default">UNPAID</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Created on {new Date(invoice.createdAt).toLocaleDateString()} by{' '}
              {invoice.createdByPartner?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.remainingDue > 0 && (
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <CreditCard className="w-4 h-4" /> Record Payment
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
            onClick={handleWhatsAppShare}
          >
            <Share2 className="w-4 h-4" /> WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {shareFeedback && (
        <div className="print:hidden p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{shareFeedback}</span>
        </div>
      )}

      {/* Printable Invoice Document */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:rounded-none">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                LC
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {invoice.businessDetails?.legalName || 'Lotus Caterer'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              {invoice.businessDetails?.address || 'Kolkata, West Bengal'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Phone: {invoice.businessDetails?.phone || '+91 98300 00000'}
            </p>
            {invoice.businessDetails?.gstin && (
              <p className="text-xs font-semibold text-slate-700 mt-1">
                GSTIN: {invoice.businessDetails.gstin}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold tracking-wider uppercase rounded-full mb-2">
              {invoice.invoiceType === 'GST' ? 'Tax Invoice' : 'Bill of Supply'}
            </span>
            <p className="text-2xl font-black text-slate-900">#{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500 mt-1">
              Invoice Date: <span className="font-semibold text-slate-700">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
            </p>
            {invoice.dueDate && (
              <p className="text-xs text-slate-500 mt-0.5">
                Due Date: <span className="font-semibold text-slate-700">{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </p>
            )}
          </div>
        </div>

        {/* Billed To & Event Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To (Customer):
            </span>
            <p className="text-sm font-bold text-slate-900">{invoice.customerName}</p>
            <p className="text-slate-600 mt-0.5">{invoice.customerPhone}</p>
            {invoice.customerEmail && <p className="text-slate-600">{invoice.customerEmail}</p>}
            {invoice.customerAddress && <p className="text-slate-600 mt-1">{invoice.customerAddress}</p>}
            {invoice.customerGstin && (
              <p className="text-slate-800 font-semibold mt-1">GSTIN: {invoice.customerGstin}</p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Event Details:
            </span>
            <p className="text-sm font-bold text-slate-900">{invoice.relatedEvent?.title || 'Catering Job'}</p>
            <p className="text-slate-600 mt-0.5">
              Event Date: {invoice.relatedEvent ? new Date(invoice.relatedEvent.eventDate).toLocaleDateString() : 'N/A'}
            </p>
            {invoice.relatedEvent?.location && (
              <p className="text-slate-500 mt-0.5">{invoice.relatedEvent.location}</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3 text-center">Qty / Unit</th>
                <th className="py-3 px-3 text-right">Rate</th>
                {invoice.invoiceType === 'GST' && <th className="py-3 px-3 text-right">GST %</th>}
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{it.description}</td>
                  <td className="py-3 px-3 text-center text-slate-600">
                    {it.quantity} {it.unit}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">₹{it.rate.toLocaleString()}</td>
                  {invoice.invoiceType === 'GST' && (
                    <td className="py-3 px-3 text-right text-slate-600">{it.gstRate || 0}%</td>
                  )}
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ₹{it.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start text-xs">
          <div>
            {invoice.notes && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                <span className="font-bold text-slate-700 block mb-1">Notes / Terms:</span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            <div className="text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block mb-1">Bank Payment Details:</span>
              {invoice.businessDetails?.bankAccountNumber ? (
                <>
                  <p>Bank: {invoice.businessDetails.bankName || 'N/A'}</p>
                  <p>A/C No: {invoice.businessDetails.bankAccountNumber}</p>
                  <p>IFSC: {invoice.businessDetails.bankIfsc || 'N/A'}</p>
                </>
              ) : (
                <p className="text-xs italic text-slate-400">
                  (Bank account details not yet configured in business profile)
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{invoice.subtotal.toLocaleString()}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount:</span>
                <span>- ₹{invoice.discount.toLocaleString()}</span>
              </div>
            )}

            {invoice.taxDetails && (
              <>
                {!invoice.taxDetails.isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST:</span>
                      <span>₹{invoice.taxDetails.totalCgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST:</span>
                      <span>₹{invoice.taxDetails.totalSgst.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST:</span>
                    <span>₹{invoice.taxDetails.totalIgst.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-indigo-700 border-t border-slate-200/60 pt-1">
                  <span>Total Tax:</span>
                  <span>₹{invoice.taxDetails.totalTax.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2">
              <span>Grand Total:</span>
              <span>₹{invoice.grandTotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-bold pt-1">
              <span>Amount Paid:</span>
              <span>₹{invoice.amountPaid.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-rose-600 font-black text-sm pt-1 border-t border-slate-200">
              <span>Remaining Balance Due:</span>
              <span>₹{invoice.remainingDue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section (Hidden during print) */}
      <div className="print:hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Recorded Payment History ({invoice.payments.length})
        </h2>

        {invoice.payments.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">No payments recorded yet for this invoice.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Received By Partner</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map((p, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">₹{p.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {p.receivedByPartner?.name || 'Partner'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <RecordCustomerPaymentModal
          dueItem={{
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            totalBillAmount: invoice.grandTotal,
            amountReceived: invoice.amountPaid,
            remainingDue: invoice.remainingDue,
            paymentStatus: invoice.paymentStatus,
            paymentCount: invoice.payments.length,
            isOverdue: false,
          }}
          partners={partners}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => loadInvoice()}
        />
      )}
    </div>
  );
};
