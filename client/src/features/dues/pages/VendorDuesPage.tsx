import React, { useState, useEffect } from 'react';
import {
  Truck,
  FileText,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Phone,
  Building2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton, SkeletonTable } from '../../../components/ui/Skeleton';
import { FilterPanel, FilterConfig } from '../../../components/ui/FilterPanel';
import { dueService } from '../services/dueService';
import { VendorDuesSummary, VendorDueItem, VendorItem } from '../types/due.types';
import { RecordVendorPaymentModal } from '../components/RecordVendorPaymentModal';
import { CreateVendorBillModal } from '../components/CreateVendorBillModal';
import { CreateVendorModal } from '../components/CreateVendorModal';
import { apiClient } from '../../../services/api';

export const VendorDuesPage: React.FC = () => {
  const [summary, setSummary] = useState<VendorDuesSummary | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedDue, setSelectedDue] = useState<VendorDueItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<Record<string, string>>({
    vendor: '',
    relatedEvent: '',
    category: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [duesData, vendorsList, eventsRes, partnersRes] = await Promise.all([
        dueService.getVendorDues({
          vendor: filters.vendor || undefined,
          relatedEvent: filters.relatedEvent || undefined,
        }),
        dueService.getVendors(),
        apiClient.get('/events').catch(() => ({ data: { data: { items: [] } } })),
        apiClient.get('/accounts/partners').catch(() => ({ data: { data: [] } })),
      ]);

      setSummary(duesData);
      setVendors(Array.isArray(vendorsList) ? vendorsList : []);

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
      console.error('Failed to load vendor dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.vendor, filters.relatedEvent]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ vendor: '', relatedEvent: '', category: '' });
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'vendor',
      label: 'Vendor',
      type: 'select',
      options: vendors.map((v) => ({ label: v.name, value: v._id })),
      placeholder: 'All Vendors',
    },
    {
      key: 'relatedEvent',
      label: 'Event',
      type: 'select',
      options: events.map((ev) => ({ label: ev.title, value: ev.id })),
      placeholder: 'All Events',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Groceries & Spices', value: 'GROCERIES_SPICES' },
        { label: 'Meat & Fish', value: 'MEAT_FISH' },
        { label: 'Vegetables', value: 'VEGETABLES' },
        { label: 'Dairy & Sweets', value: 'DAIRY_SWEETS' },
        { label: 'Labor & Staff', value: 'LABOR_STAFF' },
        { label: 'Cooking Gas', value: 'COOKING_GAS' },
      ],
      placeholder: 'All Categories',
    },
  ];

  const displayedDues =
    summary?.dues?.filter((due) => {
      if (!filters.category) return true;
      return due.category === filters.category;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Due Management</h1>
          <p className="text-sm text-slate-500">
            Track supplier payables, purchase liabilities, and partial vendor settlements
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
            Record Payable Bill
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Vendor Due
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-rose-600">
              ₹{summary ? summary.totalVendorDue.toLocaleString() : '0'}
            </p>
          )}
          <span className="text-xs text-slate-500 mt-1 block">Pending payment to suppliers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue Bills
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
            {loading ? <Skeleton className="h-3 w-24 inline-block" /> : `${summary?.overdueCount || 0} bills past due date`}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Billed
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-slate-900">
              ₹{summary ? summary.totalPayable.toLocaleString() : '0'}
            </p>
          )}
          <span className="text-xs text-slate-500 mt-1 block">Total supplier purchases</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Paid Out
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-emerald-700">
              ₹{summary ? summary.totalPaid.toLocaleString() : '0'}
            </p>
          )}
          <span className="text-xs text-emerald-600 font-medium mt-1 block">Cleared and recorded in ledger</span>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        configs={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Dues List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Outstanding Vendor Bills {loading ? '' : `(${displayedDues.length})`}
          </h2>
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={6} className="border-0 shadow-none rounded-none" />
        ) : displayedDues.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-800 font-semibold text-sm">No Outstanding Vendor Dues</p>
            <p className="text-slate-500 text-xs mt-1">
              All supplier obligations are settled or match none of your active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3">Vendor & Category</th>
                  <th className="px-6 py-3">Purchase Details</th>
                  <th className="px-6 py-3">Total Payable</th>
                  <th className="px-6 py-3">Paid</th>
                  <th className="px-6 py-3 text-rose-600">Remaining Payable</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDues.map((item) => (
                  <tr key={item.billId} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{item.vendorName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {item.vendorPhone}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-semibold tracking-wider uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{item.description}</p>
                      {item.billNumber && (
                        <p className="text-xs text-slate-500 mt-0.5">Bill #: {item.billNumber}</p>
                      )}
                      {item.relatedEvent && (
                        <p className="text-xs text-blue-600 font-medium mt-0.5">
                          Event: {item.relatedEvent.title}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        Date: {new Date(item.billDate).toLocaleDateString()}
                        {item.dueDate && (
                          <span
                            className={`ml-2 ${
                              item.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                            }`}
                          >
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      ₹{item.totalPayableAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-700">
                      ₹{item.amountPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-rose-600">
                      ₹{item.remainingAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {item.isOverdue ? (
                        <Badge variant="danger">OVERDUE</Badge>
                      ) : item.status === 'PARTIALLY_PAID' ? (
                        <Badge variant="warning">PARTIALLY PAID</Badge>
                      ) : (
                        <Badge variant="default">UNPAID</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
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
        <RecordVendorPaymentModal
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

      {/* Create Bill Modal */}
      {isCreateBillModalOpen && (
        <CreateVendorBillModal
          isOpen={isCreateBillModalOpen}
          vendors={vendors}
          events={events}
          onClose={() => setIsCreateBillModalOpen(false)}
          onSuccess={() => {
            loadData();
          }}
          onAddNewVendor={() => {
            setIsCreateBillModalOpen(false);
            setIsCreateVendorModalOpen(true);
          }}
        />
      )}

      {/* Create Vendor Modal */}
      {isCreateVendorModalOpen && (
        <CreateVendorModal
          isOpen={isCreateVendorModalOpen}
          onClose={() => setIsCreateVendorModalOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
