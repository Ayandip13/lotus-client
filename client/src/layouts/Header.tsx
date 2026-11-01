import React from 'react';
import { Menu, Activity, User } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-900">
            Lotus Caterer Management
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-xs sm:text-sm text-slate-500 font-normal">
            Foundation Workspace
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="success" className="hidden sm:inline-flex gap-1.5 py-1">
          <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>Foundation Ready</span>
        </Badge>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User / Partner Account Avatar Placeholder */}
        <div className="flex items-center gap-2 pl-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">Partner Account</div>
            <div className="text-[10px] text-slate-500">Auth in Phase 2</div>
          </div>
        </div>
      </div>
    </header>
  );
};
