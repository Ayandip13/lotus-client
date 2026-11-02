import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Receipt,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { invoiceService } from '../services/invoiceService';
import { InvoiceType } from '../types/invoice.types';
import { apiClient } from '../../../services/api';

interface LineItemForm {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  gstRate: number;
}

export const InvoiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<Array<{ id: string; title: string; clientName?: string; clientPhone?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('NON_GST');
  const [isInterState, setIsInterState] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [relatedEvent, setRelatedEvent] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Business Details (Configurable, defaults to Lotus Caterer)
  const [businessName, setBusinessName] = useState('Lotus Caterer');
  const [businessAddress, setBusinessAddress] = useState('Kolkata, West Bengal');
  const [businessPhone, setBusinessPhone] = useState('+91 98300 00000');
  const [businessGstin, setBusinessGstin] = useState('');

  // Items
  const [items, setItems] = useState<LineItemForm[]>([
    { description: 'Buffet Catering Services', quantity: 150, unit: 'plates', rate: 450, gstRate: 5 },
  ]);

  useEffect(() => {
    apiClient
      .get('/events')
      .then((res) => {
        if (res.data?.data?.items) {
          const list = res.data.data.items.map((ev: any) => ({
            id: ev._id,
            title: ev.title,
            clientName: ev.guestName || ev.clientName,
            clientPhone: ev.guestPhone || ev.clientPhone,
          }));
          setEvents(list);
          if (list.length > 0) {
            const preselected = eventIdParam ? list.find((e: any) => e.id === eventIdParam) : null;
            const target = preselected || list[0];
            setRelatedEvent(target.id);
            if (target.clientName) setCustomerName(target.clientName);
            if (target.clientPhone) setCustomerPhone(target.clientPhone);
          }
        }
      })
      .catch((err) => console.error('Failed to load events:', err));
  }, [eventIdParam]);

  const handleEventChange = (eventId: string) => {
    setRelatedEvent(eventId);
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      if (ev.clientName) setCustomerName(ev.clientName);
      if (ev.clientPhone) setCustomerPhone(ev.clientPhone);
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unit: 'plates', rate: 0, gstRate: invoiceType === 'GST' ? 5 : 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItemForm, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Calculations
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  items.forEach((item) => {
    const lineAmount = (item.quantity || 0) * (item.rate || 0);
    subtotal += lineAmount;

    if (invoiceType === 'GST' && item.gstRate) {
      const itemTax = (lineAmount * item.gstRate) / 100;
      if (isInterState) {
        totalIgst += itemTax;
      } else {
        totalCgst += itemTax / 2;
        totalSgst += itemTax / 2;
      }
    }
  });

  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = Math.max(0, subtotal - (discount || 0) + totalTax);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Customer name and phone number are required');
      return;
    }

    if (!relatedEvent) {
      setError('Please select an associated catering event');
      return;
    }

    if (items.some((it) => !it.description.trim() || it.quantity <= 0 || it.rate < 0)) {
      setError('All bill items must have valid description, positive quantity and non-negative rate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await invoiceService.createInvoice({
        invoiceType,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        relatedEvent,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: it.quantity,
          unit: it.unit || 'plates',
          rate: it.rate,
          gstRate: invoiceType === 'GST' ? it.gstRate : 0,
        })),
        discount: discount || 0,
        isInterState: invoiceType === 'GST' ? isInterState : false,
        businessDetails: {
          legalName: businessName.trim(),
          address: businessAddress.trim(),
          phone: businessPhone.trim(),
          gstin: businessGstin.trim() || undefined,
        },
        notes: notes.trim() || undefined,
      });

      navigate(`/invoices/${created._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
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
          <h1 className="text-xl font-bold text-slate-900">Create New Invoice</h1>
          <p className="text-xs text-slate-500">Generate professional GST or Non-GST customer bill</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Type Selector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Invoice Format Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setInvoiceType('NON_GST')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                invoiceType === 'NON_GST'
                  ? 'border-slate-900 bg-slate-50/80 ring-2 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Non-GST Invoice</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard catering bill without tax components or GSTIN requirements.
                </p>
              </div>
            </div>

            <div
              onClick={() => setInvoiceType('GST')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                invoiceType === 'GST'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">GST Tax Invoice</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tax invoice supporting configurable line-item rates, CGST/SGST/IGST, and GSTIN.
                </p>
              </div>
            </div>
          </div>

          {invoiceType === 'GST' && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
              <span className="text-xs font-semibold text-slate-700">Tax Application:</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="radio"
                  name="taxJurisdiction"
                  checked={!isInterState}
                  onChange={() => setIsInterState(false)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                Intra-State (CGST 50% + SGST 50%)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="radio"
                  name="taxJurisdiction"
                  checked={isInterState}
                  onChange={() => setIsInterState(true)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                Inter-State (IGST 100%)
              </label>
            </div>
          )}
        </div>

        {/* Primary Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Invoice & Customer Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associated Catering Event <span className="text-rose-500">*</span>
              </label>
              <select
                value={relatedEvent}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Somnath Sen"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Contact # <span className="text-rose-500">*</span>
              </label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9830011111"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email</label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Address</label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Address line, City, PIN"
              />
            </div>

            {invoiceType === 'GST' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer GSTIN (Optional)</label>
                <Input
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="e.g. 19BBBBB1111B1Z2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bill Items Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bill Items ({items.length})
            </h2>
            <Button type="button" size="sm" variant="outline" className="text-xs gap-1" onClick={addItem}>
              <Plus className="w-3.5 h-3.5" /> Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const lineTotal = item.quantity * item.rate;
              let taxAmount = 0;
              if (invoiceType === 'GST' && item.gstRate) {
                taxAmount = (lineTotal * item.gstRate) / 100;
              }

              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Item Description
                    </label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="e.g. Premium Buffet Dinner"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Quantity</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unit</label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      placeholder="plates"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Rate (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.rate}
                      onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  {invoiceType === 'GST' && (
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">GST %</label>
                      <select
                        value={item.gstRate}
                        onChange={(e) => updateItem(idx, 'gstRate', parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                  )}

                  <div className={`${invoiceType === 'GST' ? 'md:col-span-2' : 'md:col-span-3'} flex items-center justify-between`}>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Total</label>
                      <p className="font-bold text-slate-900 text-sm">
                        ₹{(lineTotal + taxAmount).toLocaleString()}
                      </p>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button type="button" size="sm" variant="outline" className="text-xs" onClick={addItem}>
            + Add Another Item
          </Button>
        </div>

        {/* Calculations & Business Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes & Business Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Invoice Notes & Terms
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Thank you for choosing Lotus Caterer. Payment terms: 50% advance, balance on event completion."
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Configurable Business Header:</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Business Name"
                />
                <Input
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="Business Phone"
                />
              </div>
              <Input
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Business Address"
              />
              {invoiceType === 'GST' && (
                <Input
                  value={businessGstin}
                  onChange={(e) => setBusinessGstin(e.target.value)}
                  placeholder="Company GSTIN"
                />
              )}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Payment Summary
            </h2>

            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-600">Discount (₹):</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-28 h-8 px-2 text-right rounded-lg border border-slate-300 text-sm focus:ring-slate-900"
              />
            </div>

            {invoiceType === 'GST' && (
              <>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-slate-600">Total CGST:</span>
                      <span className="font-medium text-slate-800">₹{totalCgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-slate-600">Total SGST:</span>
                      <span className="font-medium text-slate-800">₹{totalSgst.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-slate-600">Total IGST:</span>
                    <span className="font-medium text-slate-800">₹{totalIgst.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-1 border-t border-slate-100">
                  <span className="text-slate-600">Total Tax:</span>
                  <span className="font-semibold text-indigo-700">₹{totalTax.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-lg font-extrabold pt-2 border-t-2 border-slate-900 text-slate-900">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? 'Creating...' : 'Generate & Save Invoice'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
