import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, FileText, ArrowLeftRight, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export const MobileBottomNav: React.FC = () => {
  const navTabs = [
    {
      name: 'Events',
      href: '/bookings',
      icon: CalendarDays,
    },
    {
      name: 'Billing',
      href: '/invoices',
      icon: FileText,
    },
    {
      name: 'Income & Expenses',
      href: '/transactions',
      icon: ArrowLeftRight,
    },
    {
      name: 'Partners',
      href: '/partners',
      icon: Users,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] lg:hidden"
    >
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.name}
              to={tab.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1.5 px-1 transition-colors select-none relative',
                  isActive
                    ? 'text-emerald-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'p-1 rounded-xl transition-all',
                      isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
                  </div>
                  <span className="text-[11px] leading-tight mt-0.5 text-center truncate max-w-full">
                    {tab.name}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-600" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
