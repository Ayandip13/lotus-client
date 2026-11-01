import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  PieChart,
  X,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../features/auth/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    name: 'Foundation & Status',
    href: '/',
    icon: LayoutDashboard,
    badge: 'Phase 1',
    badgeVariant: 'success' as const,
  },
  {
    name: 'Partner Accounts',
    href: '/partners',
    icon: Users,
    badge: 'Equal Access',
    badgeVariant: 'success' as const,
  },
  {
    name: 'Bookings & Events',
    href: '/bookings',
    icon: CalendarDays,
    badge: 'Active',
    badgeVariant: 'success' as const,
  },
  {
    name: 'Income & Expenses',
    href: '/transactions',
    icon: Receipt,
    badge: 'Phase 4',
    badgeVariant: 'neutral' as const,
  },
  {
    name: 'Financial Overview',
    href: '/overview',
    icon: PieChart,
    badge: 'Phase 5',
    badgeVariant: 'neutral' as const,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { partner, user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200/80 shadow-sm transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold shadow-sm">
              LC
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Lotus Caterer</h1>
              <p className="text-[11px] font-medium text-slate-500">Management System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            System Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? 'default' : item.badgeVariant}
                        className={isActive ? 'bg-slate-800 text-white border-0' : ''}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Info / Active Partner & Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{partner?.name || 'Partner Account'}</span>
            </div>
            {user && (
              <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Equal 3-Partner authorization active.
          </div>
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
