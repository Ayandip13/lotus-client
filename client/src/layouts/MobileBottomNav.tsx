import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  Clock,
  LayoutGrid,
  Truck,
  FileText,
  Wallet,
  Users,
  PieChart,
  X,
  ChevronRight,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../features/auth/context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { partner, user, logout } = useAuth();
  const pathname = location.pathname;

  const [isDuesSheetOpen, setIsDuesSheetOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Close sheets whenever route changes
  useEffect(() => {
    setIsDuesSheetOpen(false);
    setIsMoreSheetOpen(false);
  }, [pathname]);

  // Handle escape key to close bottom sheets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDuesSheetOpen(false);
        setIsMoreSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when a bottom sheet is open
  useEffect(() => {
    if (isDuesSheetOpen || isMoreSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDuesSheetOpen, isMoreSheetOpen]);

  // Tab definitions
  const isHomeActive = pathname === '/';
  const isEventsActive = pathname.startsWith('/bookings');
  const isTransactionsActive = pathname.startsWith('/transactions');
  const isDuesActive = pathname.startsWith('/dues');
  const isMoreActive = ['/cash-custody', '/invoices', '/partners', '/overview'].some((p) =>
    pathname.startsWith(p)
  );

  const handleTabClick = (tabId: string) => {
    if (tabId === 'home') {
      setIsDuesSheetOpen(false);
      setIsMoreSheetOpen(false);
      navigate('/');
    } else if (tabId === 'events') {
      setIsDuesSheetOpen(false);
      setIsMoreSheetOpen(false);
      navigate('/bookings');
    } else if (tabId === 'transactions') {
      setIsDuesSheetOpen(false);
      setIsMoreSheetOpen(false);
      navigate('/transactions');
    } else if (tabId === 'dues') {
      setIsMoreSheetOpen(false);
      setIsDuesSheetOpen((prev) => !prev);
    } else if (tabId === 'more') {
      setIsDuesSheetOpen(false);
      setIsMoreSheetOpen((prev) => !prev);
    }
  };

  const duesOptions = [
    {
      title: 'Customer Dues',
      subtitle: 'Receivables & outstanding event balances',
      href: '/dues/customers',
      badge: 'Receivables',
      badgeVariant: 'warning' as const,
      icon: Clock,
      iconColor: 'text-purple-600 bg-purple-50',
      isActive: pathname.startsWith('/dues/customers'),
    },
    {
      title: 'Vendor Dues',
      subtitle: 'Payables & outstanding supplier bills',
      href: '/dues/vendors',
      badge: 'Payables',
      badgeVariant: 'warning' as const,
      icon: Truck,
      iconColor: 'text-orange-600 bg-orange-50',
      isActive: pathname.startsWith('/dues/vendors'),
    },
  ];

  const moreModules = [
    {
      title: 'Invoices & Billing',
      subtitle: 'GST and Non-GST client invoices & payments',
      href: '/invoices',
      badge: 'GST / Non-GST',
      badgeVariant: 'success' as const,
      icon: FileText,
      iconColor: 'text-emerald-600 bg-emerald-50',
      isActive: pathname.startsWith('/invoices'),
    },
    {
      title: 'Cash Custody',
      subtitle: 'Physical cash-in-hand tracking & bank handovers',
      href: '/cash-custody',
      badge: 'Cash-in-Hand',
      badgeVariant: 'success' as const,
      icon: Wallet,
      iconColor: 'text-sky-600 bg-sky-50',
      isActive: pathname.startsWith('/cash-custody'),
    },
    {
      title: 'Partner Accounts',
      subtitle: 'Equal partner contributions & personal expense audit',
      href: '/partners',
      badge: 'Equal Access',
      badgeVariant: 'success' as const,
      icon: Users,
      iconColor: 'text-indigo-600 bg-indigo-50',
      isActive: pathname.startsWith('/partners'),
    },
    {
      title: 'Financial Overview',
      subtitle: 'Comprehensive financial reports & account balances',
      href: '/overview',
      badge: 'Reports',
      badgeVariant: 'success' as const,
      icon: PieChart,
      iconColor: 'text-blue-600 bg-blue-50',
      isActive: pathname.startsWith('/overview'),
    },
  ];

  return (
    <>
      {/* 1. Backdrop Overlay for Bottom Sheets */}
      {(isDuesSheetOpen || isMoreSheetOpen) && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in duration-150"
          onClick={() => {
            setIsDuesSheetOpen(false);
            setIsMoreSheetOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* 2. Dues Hub Bottom Sheet */}
      {isDuesSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dues & Receivables Hub"
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white border-t border-slate-200/80 shadow-2xl p-4 sm:p-5 lg:hidden animate-in slide-in-from-bottom duration-200"
        >
          {/* Grab Handle */}
          <div className="mx-auto h-1 w-12 rounded-full bg-slate-300 mb-3" />

          {/* Sheet Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Dues Management Hub</h2>
              <p className="text-xs text-slate-500">Access customer receivables and vendor payables</p>
            </div>
            <button
              onClick={() => setIsDuesSheetOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close Dues Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dues Options */}
          <div className="space-y-2.5 mb-6">
            {duesOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.title}
                  onClick={() => {
                    setIsDuesSheetOpen(false);
                    navigate(opt.href);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all',
                    opt.isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50 active:bg-slate-100'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs',
                        opt.isActive ? 'bg-white/10 text-white' : opt.iconColor
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{opt.title}</span>
                      </div>
                      <p
                        className={cn(
                          'text-xs mt-0.5 truncate',
                          opt.isActive ? 'text-slate-300' : 'text-slate-500'
                        )}
                      >
                        {opt.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={opt.isActive ? 'default' : opt.badgeVariant}
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5',
                        opt.isActive ? 'bg-white/20 text-white border-0' : ''
                      )}
                    >
                      {opt.badge}
                    </Badge>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4',
                        opt.isActive ? 'text-slate-400' : 'text-slate-300'
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. More Modules Bottom Sheet */}
      {isMoreSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Additional Modules"
          className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white border-t border-slate-200/80 shadow-2xl p-4 sm:p-5 lg:hidden animate-in slide-in-from-bottom duration-200"
        >
          {/* Grab Handle */}
          <div className="mx-auto h-1 w-12 rounded-full bg-slate-300 mb-3" />

          {/* Sheet Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Additional Modules</h2>
              <p className="text-xs text-slate-500">Lotus Caterer operational & financial records</p>
            </div>
            <button
              onClick={() => setIsMoreSheetOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modules List */}
          <div className="space-y-2 mb-6">
            {moreModules.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    navigate(item.href);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                    item.isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50 active:bg-slate-100'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs',
                        item.isActive ? 'bg-white/10 text-white' : item.iconColor
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold truncate block">{item.title}</span>
                      <p
                        className={cn(
                          'text-[11px] truncate',
                          item.isActive ? 'text-slate-300' : 'text-slate-500'
                        )}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={item.isActive ? 'default' : item.badgeVariant}
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5',
                        item.isActive ? 'bg-white/20 text-white border-0' : ''
                      )}
                    >
                      {item.badge}
                    </Badge>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4',
                        item.isActive ? 'text-slate-400' : 'text-slate-300'
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer User Info & Sign Out */}
          <div className="pt-3 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 rounded-b-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{partner?.name || 'Partner Account'}</span>
              </div>
              {user && (
                <span className="text-[10px] text-slate-500 font-mono">@{user.username}</span>
              )}
            </div>
            <button
              onClick={() => {
                setIsMoreSheetOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Fixed Bottom Tab Bar (5 Primary Destinations) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] lg:hidden pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          {/* Tab 1: Home */}
          <button
            onClick={() => handleTabClick('home')}
            className={cn(
              'group flex flex-col items-center justify-center h-full py-1 text-center transition-all select-none',
              isHomeActive
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-600 active:text-slate-800 font-medium'
            )}
            aria-label="Executive Dashboard"
          >
            <div
              className={cn(
                'flex items-center justify-center h-7 w-10 rounded-full transition-all',
                isHomeActive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] tracking-tight mt-0.5 leading-none">Home</span>
          </button>

          {/* Tab 2: Events */}
          <button
            onClick={() => handleTabClick('events')}
            className={cn(
              'group flex flex-col items-center justify-center h-full py-1 text-center transition-all select-none',
              isEventsActive
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-600 active:text-slate-800 font-medium'
            )}
            aria-label="Bookings & Events"
          >
            <div
              className={cn(
                'flex items-center justify-center h-7 w-10 rounded-full transition-all',
                isEventsActive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
              )}
            >
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] tracking-tight mt-0.5 leading-none">Events</span>
          </button>

          {/* Tab 3: Transactions */}
          <button
            onClick={() => handleTabClick('transactions')}
            className={cn(
              'group flex flex-col items-center justify-center h-full py-1 text-center transition-all select-none',
              isTransactionsActive
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-600 active:text-slate-800 font-medium'
            )}
            aria-label="Transactions Ledger"
          >
            <div
              className={cn(
                'flex items-center justify-center h-7 w-10 rounded-full transition-all',
                isTransactionsActive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
              )}
            >
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] tracking-tight mt-0.5 leading-none">Transactions</span>
          </button>

          {/* Tab 4: Dues (Hub) */}
          <button
            onClick={() => handleTabClick('dues')}
            className={cn(
              'group flex flex-col items-center justify-center h-full py-1 text-center transition-all select-none',
              isDuesActive || isDuesSheetOpen
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-600 active:text-slate-800 font-medium'
            )}
            aria-label="Dues Hub"
            aria-expanded={isDuesSheetOpen}
          >
            <div
              className={cn(
                'flex items-center justify-center h-7 w-10 rounded-full transition-all',
                isDuesActive || isDuesSheetOpen ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
              )}
            >
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] tracking-tight mt-0.5 leading-none">Dues</span>
          </button>

          {/* Tab 5: More */}
          <button
            onClick={() => handleTabClick('more')}
            className={cn(
              'group flex flex-col items-center justify-center h-full py-1 text-center transition-all select-none',
              isMoreActive || isMoreSheetOpen
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-600 active:text-slate-800 font-medium'
            )}
            aria-label="More Modules"
            aria-expanded={isMoreSheetOpen}
          >
            <div
              className={cn(
                'flex items-center justify-center h-7 w-10 rounded-full transition-all',
                isMoreActive || isMoreSheetOpen ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] tracking-tight mt-0.5 leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

