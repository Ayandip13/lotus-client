import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Building,
  Wallet,
  AlertTriangle,
  Truck,
  ArrowRight,
  Clock,
  Phone,
  Receipt,
  User,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Skeleton, SkeletonStatCard } from '../components/ui/Skeleton';
import { useAuth } from '../features/auth/context/AuthContext';
import { apiClient } from '../services/api';

interface DashboardData {
  upcomingEvents: any[];
  financialOverview: {
    totalBusinessIncome: number;
    totalBusinessExpenses: number;
    commonBusinessBankBalance: number;
    totalBusinessCashInHand: number;
    totalCustomerDue: number;
    totalVendorDue: number;
  };
  partnerCashOverview: {
    partners: Array<{
      partnerId: string;
      partnerName: string;
      partnerPhone?: string;
      cashInHand: number;
    }>;
    totalBusinessCashInHand: number;
    commonBusinessBankBalance: number;
  };
  dueOverview: {
    customerDue: {
      totalDue: number;
      overdueCount: number;
      overdueAmount: number;
    };
    vendorDue: {
      totalDue: number;
      overdueCount: number;
      overdueAmount: number;
    };
  };
  recentActivity: any[];
}

export const DashboardShellPage: React.FC = () => {
  const { partner, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/dashboard');
      setData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err?.message || 'Failed to connect to executive dashboard service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>

        {/* 4 Metrics Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Split Section Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-16" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>

        {/* Cash Custody Overview Skeletons */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <Alert variant="error" title="Dashboard Data Unavailable">
          <p className="text-sm">
            {error || 'Unable to retrieve dashboard figures. The backend service may be restarting or unreachable.'}
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={loadDashboard}>
              Retry Connection
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const {
    financialOverview = {
      totalBusinessIncome: 0,
      totalBusinessExpenses: 0,
      commonBusinessBankBalance: 0,
      totalBusinessCashInHand: 0,
      totalCustomerDue: 0,
      totalVendorDue: 0,
    },
    upcomingEvents = [],
    partnerCashOverview = { partners: [], totalBusinessCashInHand: 0, commonBusinessBankBalance: 0 },
    dueOverview = {
      customerDue: { totalDue: 0, overdueCount: 0, overdueAmount: 0 },
      vendorDue: { totalDue: 0, overdueCount: 0, overdueAmount: 0 },
    },
    recentActivity = [],
  } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Lotus Caterer Management Hub
            </h1>
            <Badge variant="success">Phase 5 Operational</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <strong className="text-slate-800">{partner?.name || 'Partner'}</strong> ({user ? `@${user.username}` : ''}). Equal 3-partner financial custody session active.
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            size="md"
            variant="outline"
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm font-medium"
            onClick={() => navigate('/invoices/new')}
          >
            New Invoice
          </Button>
          <Button
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-initial justify-center shadow-sm font-medium"
            onClick={() => navigate('/transactions/new')}
          >
            Record Transaction
          </Button>
        </div>
      </div>

      {/* SECTION B: FINANCIAL OVERVIEW (6 Independent Financial Cards - No misleading combination) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Executive Financial Overview
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Distinct Account Balances</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* 1. Total Business Income */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Income
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-emerald-700">
              ₹{financialOverview.totalBusinessIncome.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total business revenue</span>
          </div>

          {/* 2. Total Business Expenses */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-rose-600">
              ₹{financialOverview.totalBusinessExpenses.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">All business outflows</span>
          </div>

          {/* 3. Bank Account Balance */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Bank Balance
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-blue-700">
              ₹{financialOverview.commonBusinessBankBalance.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Common bank account</span>
          </div>

          {/* 4. Physical Cash Held */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer hover:border-slate-300 transition" onClick={() => navigate('/cash-custody')}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Physical Cash
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-amber-700">
              ₹{financialOverview.totalBusinessCashInHand.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Held across 3 partners</span>
          </div>

          {/* 5. Customer Outstanding Due */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer hover:border-slate-300 transition" onClick={() => navigate('/dues/customers')}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Customer Due
              </span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-purple-700">
              ₹{financialOverview.totalCustomerDue.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Receivable from clients</span>
          </div>

          {/* 6. Vendor Outstanding Due */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer hover:border-slate-300 transition" onClick={() => navigate('/dues/vendors')}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Vendor Due
              </span>
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-orange-700">
              ₹{financialOverview.totalVendorDue.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Payable to suppliers</span>
          </div>
        </div>
      </div>

      {/* SECTION C & D: PARTNER CASH CUSTODY & DUE OVERVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section C: Partner Cash Custody Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Partner Physical Cash Custody
              </h2>
            </div>
            <button
              onClick={() => navigate('/cash-custody')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              Manage Cash <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(partnerCashOverview?.partners || []).map((p, idx) => (
              <div key={p.partnerId} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Partner {idx + 1}
                </span>
                <p className="font-bold text-slate-900 text-sm truncate">{p.partnerName}</p>
                <p className="text-lg font-black text-slate-900 mt-2">
                  ₹{p.cashInHand.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500 block mt-0.5">Physical Cash</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between">
            <span className="text-slate-300">Total Business Cash Custody:</span>
            <span className="font-bold text-amber-300 text-sm">
              ₹{(partnerCashOverview?.totalBusinessCashInHand ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Section D: Due Management Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Outstanding Due Overview
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Customer & Vendor Dues</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Due Card */}
            <div
              className="p-4 bg-purple-50/50 border border-purple-200/70 rounded-xl cursor-pointer hover:bg-purple-50 transition"
              onClick={() => navigate('/dues/customers')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-900">Customer Dues</span>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-purple-800">
                ₹{(dueOverview?.customerDue?.totalDue ?? 0).toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-700">
                <span className="px-1.5 py-0.5 bg-purple-100 rounded font-semibold text-[10px]">
                  {dueOverview?.customerDue?.overdueCount ?? 0} Overdue
                </span>
                <span>(₹{(dueOverview?.customerDue?.overdueAmount ?? 0).toLocaleString()})</span>
              </div>
            </div>

            {/* Vendor Due Card */}
            <div
              className="p-4 bg-orange-50/50 border border-orange-200/70 rounded-xl cursor-pointer hover:bg-orange-50 transition"
              onClick={() => navigate('/dues/vendors')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-900">Vendor Dues</span>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-black text-orange-800">
                ₹{(dueOverview?.vendorDue?.totalDue ?? 0).toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-700">
                <span className="px-1.5 py-0.5 bg-orange-100 rounded font-semibold text-[10px]">
                  {dueOverview?.vendorDue?.overdueCount ?? 0} Overdue
                </span>
                <span>(₹{(dueOverview?.vendorDue?.overdueAmount ?? 0).toLocaleString()})</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Click on any card to view detailed payment histories, filter by partner or event, and record partial settlements.
          </p>
        </div>
      </div>

      {/* SECTION A: UPCOMING EVENTS (Chronological Order) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Upcoming Catering Events ({upcomingEvents.length})
            </h2>
          </div>
          <button
            onClick={() => navigate('/bookings')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            All Bookings <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(!upcomingEvents || upcomingEvents.length === 0) ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No upcoming events found on or after today.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(upcomingEvents || []).map((ev) => (
              <div
                key={ev._id}
                onClick={() => navigate(`/bookings/${ev._id}`)}
                className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{ev.title}</h3>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                    {new Date(ev.eventDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.guestName || ev.clientName || 'Guest'}</span>
                  </p>
                  {(ev.guestPhone || ev.clientPhone) && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.guestPhone || ev.clientPhone}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Open Financial Hub</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION E: RECENT ACTIVITY (Ledger Transactions & Records) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Financial Transactions & Activity
            </h2>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            All Ledger Records <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(!recentActivity || recentActivity.length === 0) ? (
          <p className="text-xs text-slate-500 py-6 text-center">No recent financial transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Partner</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(recentActivity || []).map((t: any) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(t.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {t.transactionType === 'BUSINESS_INCOME' ? (
                        <Badge variant="success">INCOME</Badge>
                      ) : t.transactionType === 'BUSINESS_EXPENSE' ? (
                        <Badge variant="danger">EXPENSE</Badge>
                      ) : (
                        <Badge variant="outline">CONTRIBUTION</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{t.description}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.partner?.name || 'Common'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
