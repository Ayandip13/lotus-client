import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Receipt,
  FileCheck2,
  AlertCircle,
  Eye,
  Edit3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { InvoiceType } from '../types/invoice.types';
import { useCreateInvoice, useUpdateInvoice, useInvoiceDetails } from '../hooks/useInvoices';
import { useBookings } from '../../bookings/hooks/useBookings';

interface LineItemForm {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  gstRate: number;
}

export const InvoiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const { data: existingInvoice } = useInvoiceDetails(id || '');
  const { data: bookingsData } = useBookings({ limit: 100 });
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'form' or 'preview'
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');

  // Form Fields (all optional, with safe defaults)
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

  // Business Details (Lotus Caterer defaults)
  const [businessName, setBusinessName] = useState('Lotus Caterer');
  const [businessAddress, setBusinessAddress] = useState('Kolkata, West Bengal');
  const [businessPhone, setBusinessPhone] = useState('+91 98300 00000');
  const [businessGstin, setBusinessGstin] = useState('');

  // Items (default to 1 catering line item)
  const [items, setItems] = useState<LineItemForm[]>([
    { description: 'Catering Services', quantity: 1, unit: 'event', rate: 0, gstRate: 5 },
  ]);

  const events = (bookingsData?.items || []).map((ev: any) => ({
    id: ev._id,
    title: ev.title,
    clientName: ev.guestName || ev.clientName,
    clientPhone: ev.guestPhone || ev.clientPhone,
  }));

  useEffect(() => {
    if (isEditMode && existingInvoice) {
      setInvoiceType(existingInvoice.invoiceType);
      setIsInterState(existingInvoice.taxDetails?.isInterState ?? false);
      setInvoiceDate(new Date(existingInvoice.invoiceDate).toISOString().split('T')[0]);
      if (existingInvoice.dueDate) {
        setDueDate(new Date(existingInvoice.dueDate).toISOString().split('T')[0]);
      }
      setCustomerName(existingInvoice.customerName || '');
      setCustomerPhone(existingInvoice.customerPhone || '');
      setCustomerEmail(existingInvoice.customerEmail || '');
      setCustomerAddress(existingInvoice.customerAddress || '');
      setCustomerGstin(existingInvoice.customerGstin || '');
      setDiscount(existingInvoice.discount || 0);
      setNotes(existingInvoice.notes || '');

      const evId = typeof existingInvoice.relatedEvent === 'object'
        ? (existingInvoice.relatedEvent as any)?._id || (existingInvoice.relatedEvent as any)?.id
        : existingInvoice.relatedEvent;
      if (evId) setRelatedEvent(evId);

      if (existingInvoice.businessDetails) {
        if (existingInvoice.businessDetails.legalName) setBusinessName(existingInvoice.businessDetails.legalName);
        if (existingInvoice.businessDetails.address) setBusinessAddress(existingInvoice.businessDetails.address);
        if (existingInvoice.businessDetails.phone) setBusinessPhone(existingInvoice.businessDetails.phone);
        if (existingInvoice.businessDetails.gstin) setBusinessGstin(existingInvoice.businessDetails.gstin);
      }

      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setItems(
          existingInvoice.items.map((it: any) => ({
            description: it.description,
            quantity: it.quantity,
            unit: it.unit || 'plates',
            rate: it.rate,
            gstRate: it.gstRate || 0,
          }))
        );
      }
    }
  }, [isEditMode, existingInvoice]);

  useEffect(() => {
    if (!isEditMode && eventIdParam && events.length > 0 && !relatedEvent) {
      const preselected = events.find((e: any) => e.id === eventIdParam);
      if (preselected) {
        setRelatedEvent(preselected.id);
        if (preselected.clientName && !customerName) setCustomerName(preselected.clientName);
        if (preselected.clientPhone && !customerPhone) setCustomerPhone(preselected.clientPhone);
      }
    }
  }, [events, eventIdParam, relatedEvent, isEditMode]);

  const handleEventChange = (eventId: string) => {
    setRelatedEvent(eventId);
    if (eventId) {
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        if (ev.clientName && !customerName) setCustomerName(ev.clientName);
        if (ev.clientPhone && !customerPhone) setCustomerPhone(ev.clientPhone);
      }
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: 'Catering Item', quantity: 1, unit: 'plates', rate: 0, gstRate: invoiceType === 'GST' ? 5 : 0 },
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

  // Safe Calculations
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const rt = Number(item.rate) || 0;
    const lineAmount = qty * rt;
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
  const safeDiscount = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const grandTotal = Math.max(0, subtotal - safeDiscount + totalTax);

  const selectedEventObj = events.find((e) => e.id === relatedEvent);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Clean customer values with graceful fallbacks
    const fallbackCustomerName = customerName.trim() || (selectedEventObj?.clientName ? selectedEventObj.clientName : 'Customer');
    const cleanCustomerPhone = customerPhone.replace(/\D/g, '') || (selectedEventObj?.clientPhone ? selectedEventObj.clientPhone.replace(/\D/g, '') : '');

    // Ensure at least one line item exists with valid numbers
    const validItems = items.map((it) => ({
      description: it.description.trim() || 'Catering Services',
      quantity: Math.max(0.01, Number(it.quantity) || 1),
      unit: it.unit.trim() || 'plates',
      rate: Math.max(0, Number(it.rate) || 0),
      gstRate: invoiceType === 'GST' ? Number(it.gstRate) || 0 : 0,
    }));

    try {
      if (isEditMode && id) {
        await updateInvoiceMutation.mutateAsync({
          id,
          payload: {
            invoiceType,
            invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            customerName: fallbackCustomerName,
            customerPhone: cleanCustomerPhone,
            customerEmail: customerEmail.trim() || undefined,
            customerAddress: customerAddress.trim() || undefined,
            customerGstin: customerGstin.trim() || undefined,
            relatedEvent: relatedEvent || undefined,
            items: validItems,
            discount: safeDiscount,
            isInterState: invoiceType === 'GST' ? isInterState : false,
            businessDetails: {
              legalName: businessName.trim() || 'Lotus Caterer',
              address: businessAddress.trim(),
              phone: businessPhone.trim(),
              gstin: businessGstin.trim() || undefined,
            },
            notes: notes.trim() || undefined,
          },
        });
        navigate(`/invoices/${id}`);
        return;
      }

      const created = await createInvoiceMutation.mutateAsync({
        invoiceType,
        invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        customerName: fallbackCustomerName,
        customerPhone: cleanCustomerPhone,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        relatedEvent: relatedEvent || undefined,
        items: validItems,
        discount: safeDiscount,
        isInterState: invoiceType === 'GST' ? isInterState : false,
        businessDetails: {
          legalName: businessName.trim() || 'Lotus Caterer',
          address: businessAddress.trim(),
          phone: businessPhone.trim(),
          gstin: businessGstin.trim() || undefined,
        },
        notes: notes.trim() || undefined,
      });

      navigate(`/invoices/${created._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <h1 className="text-xl font-bold text-slate-900">
              {isEditMode ? `Edit Invoice #${existingInvoice?.invoiceNumber || ''}` : 'New Bill & Invoice'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditMode ? 'Modify bill details and preview changes' : 'Quick, zero-hassle catering bill generation'}
            </p>
          </div>
        </div>

        {/* Form vs Preview Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'form'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Info
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'preview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </button>
        </div>
      </div>

      {/* Khatabook Zero-Friction Helper Banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950">
          <span className="font-bold">Zero-Blocker Invoicing:</span> All fields are completely optional. Save whatever details you have now, and you can edit or share the bill directly from the preview at any time.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* VIEW MODE 1: EDIT FORM */}
      {viewMode === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Type Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Invoice Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setInvoiceType('NON_GST')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  invoiceType === 'NON_GST'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Non-GST Bill (Simple)</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard catering bill without tax components.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setInvoiceType('GST')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  invoiceType === 'GST'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-700">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">GST Tax Invoice</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Includes GST breakdown (CGST/SGST/IGST) and GSTIN.
                  </p>
                </div>
              </div>
            </div>

            {invoiceType === 'GST' && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
                <span className="text-xs font-semibold text-slate-700">GST Jurisdiction:</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="radio"
                    name="taxJurisdiction"
                    checked={!isInterState}
                    onChange={() => setIsInterState(false)}
                    className="text-emerald-600 focus:ring-emerald-600"
                  />
                  Intra-State (CGST 50% + SGST 50%)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="radio"
                    name="taxJurisdiction"
                    checked={isInterState}
                    onChange={() => setIsInterState(true)}
                    className="text-emerald-600 focus:ring-emerald-600"
                  />
                  Inter-State (IGST 100%)
                </label>
              </div>
            )}
          </div>

          {/* Customer & Event Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Customer & Event Information (Optional)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Catering Event
                </label>
                <select
                  value={relatedEvent}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                >
                  <option value="">-- No Event (Standalone Bill) --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date
                </label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Client Name
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Ghosh"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Phone #
                </label>
                <Input
                  type="tel"
                  isPhone
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9830012345"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Venue</label>
                <Input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="City, Area"
                />
              </div>

              {invoiceType === 'GST' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer GSTIN</label>
                  <Input
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value)}
                    placeholder="19XXXXX0000X1Z5"
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
              <Button type="button" size="sm" variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-800" onClick={addItem}>
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTotal = (item.quantity || 0) * (item.rate || 0);
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
                        placeholder="e.g. Wedding Reception Buffet"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Quantity</label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="md:col-span-2">
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
                        step="1"
                        min="0"
                        value={item.rate}
                        onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {invoiceType === 'GST' && (
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">GST %</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItem(idx, 'gstRate', parseFloat(e.target.value) || 0)}
                          className="w-full h-10 px-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                    )}

                    <div className={`${invoiceType === 'GST' ? 'md:col-span-1' : 'md:col-span-2'} flex items-center justify-between`}>
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
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary & Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, advance received notes, etc."
                />
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 h-7 px-2 text-right rounded border border-slate-300 text-xs"
                  />
                </div>

                {invoiceType === 'GST' && (
                  <div className="flex justify-between text-indigo-700">
                    <span>Tax (GST):</span>
                    <span className="font-semibold">₹{totalTax.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Preview Invoice
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="text-xs" onClick={() => navigate('/invoices')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {isEditMode
                    ? updateInvoiceMutation.isPending ? 'Saving...' : 'Update & Preview Bill'
                    : createInvoiceMutation.isPending ? 'Saving...' : 'Save & Preview Bill'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* VIEW MODE 2: FINAL INVOICE PREVIEW */}
      {viewMode === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    LC
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {businessName || 'Lotus Caterer'}
                  </h2>
                </div>
                {businessAddress && <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{businessAddress}</p>}
                {businessPhone && <p className="text-xs text-slate-500 mt-1">Phone: {businessPhone}</p>}
                {invoiceType === 'GST' && businessGstin && (
                  <p className="text-xs font-semibold text-slate-700 mt-1">GSTIN: {businessGstin}</p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wider uppercase rounded-full mb-2">
                  {invoiceType === 'GST' ? 'Tax Invoice (Preview)' : 'Bill of Supply (Preview)'}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Date: <span className="font-semibold text-slate-700">{invoiceDate}</span>
                </p>
                {dueDate && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Due: <span className="font-semibold text-slate-700">{dueDate}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Billed To & Event (Hiding empty fields cleanly) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Billed To:
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {customerName || selectedEventObj?.clientName || 'Customer'}
                </p>
                {customerPhone && <p className="text-slate-600 mt-0.5">{customerPhone}</p>}
                {customerEmail && <p className="text-slate-600 mt-0.5">{customerEmail}</p>}
                {customerAddress && <p className="text-slate-600 mt-1">{customerAddress}</p>}
                {invoiceType === 'GST' && customerGstin && (
                  <p className="text-slate-800 font-semibold mt-1">GSTIN: {customerGstin}</p>
                )}
              </div>

              {selectedEventObj && (
                <div className="sm:text-right">
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Event Details:
                  </span>
                  <p className="text-sm font-bold text-slate-900">{selectedEventObj.title}</p>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="py-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Item Description</th>
                    <th className="py-3 px-3 text-center">Qty / Unit</th>
                    <th className="py-3 px-3 text-right">Rate</th>
                    {invoiceType === 'GST' && <th className="py-3 px-3 text-right">GST %</th>}
                    <th className="py-3 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const lTotal = (it.quantity || 0) * (it.rate || 0);
                    const lTax = invoiceType === 'GST' && it.gstRate ? (lTotal * it.gstRate) / 100 : 0;
                    return (
                      <tr key={idx}>
                        <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {it.description || 'Catering Services'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">₹{it.rate.toLocaleString()}</td>
                        {invoiceType === 'GST' && (
                          <td className="py-3 px-3 text-right text-slate-600">{it.gstRate || 0}%</td>
                        )}
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          ₹{(lTotal + lTax).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start text-xs">
              <div>
                {notes && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Notes / Terms:</span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString()}</span>
                </div>

                {safeDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount:</span>
                    <span>- ₹{safeDiscount.toLocaleString()}</span>
                  </div>
                )}

                {invoiceType === 'GST' && (
                  <div className="flex justify-between font-semibold text-indigo-700 border-t border-slate-200/60 pt-1">
                    <span>Total Tax:</span>
                    <span>₹{totalTax.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar from Preview */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <Button
              type="button"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => setViewMode('form')}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              Continue Editing
            </Button>

            <Button
              type="button"
              disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              onClick={() => handleSubmit()}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEditMode
                ? updateInvoiceMutation.isPending ? 'Saving...' : 'Confirm & Save Changes'
                : createInvoiceMutation.isPending ? 'Saving...' : 'Confirm & Save Invoice'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
