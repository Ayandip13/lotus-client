import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  ArrowLeftRight,
  Users,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SignOutModal } from '../components/ui/SignOutModal';
import { useAuth } from '../features/auth/context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    name: 'Booking & Events',
    href: '/bookings',
    icon: CalendarDays,
    description: 'Upcoming & past catering jobs',
  },
  {
    name: 'Invoice & Billing',
    href: '/invoices',
    icon: FileText,
    description: 'Bills, GST/Non-GST & PDFs',
  },
  {
    name: 'Income & Expenses',
    href: '/transactions',
    icon: ArrowLeftRight,
    description: 'Daily cash in & cash out',
  },
  {
    name: 'Partner Accounts',
    href: '/partners',
    icon: Users,
    description: 'Contributions & balances',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { partner, user, logout } = useAuth();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside
        className={cn(
          'hidden lg:flex lg:static lg:translate-x-0 w-64 xl:w-72 shrink-0 flex-col bg-white border-r border-slate-200/90 shadow-sm print:hidden'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm">
              LC
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Lotus Caterer</h1>
              <p className="text-[11px] font-medium text-slate-500">Business Khata</p>
            </div>
          </div>
        </div>

        {/* 4 Primary Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-6 space-y-2">
          <div className="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Primary Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all select-none',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-200/60'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-tight truncate">{item.name}</div>
                      <div
                        className={cn(
                          'text-[11px] font-normal truncate mt-0.5',
                          isActive ? 'text-emerald-700/80' : 'text-slate-400'
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Partner Info & Sign Out Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{partner?.name || 'Partner Account'}</span>
            </div>
            {user && (
              <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Equal access across all 3 partners.
          </p>
          <button
            type="button"
            onClick={() => setIsSignOutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Confirmation Alert Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={() => {
          onClose?.();
          logout();
        }}
      />
    </>
  );
};
