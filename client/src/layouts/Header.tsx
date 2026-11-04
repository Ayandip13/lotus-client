import React, { useState } from 'react';
import { Activity, User as UserIcon, LogOut, Edit2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SignOutModal } from '../components/ui/SignOutModal';
import { EditPartnerPhoneModal } from '../features/auth/components/EditPartnerPhoneModal';
import { useAuth } from '../features/auth/context/AuthContext';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { partner, logout } = useAuth();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-3.5 sm:px-6 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Brand Mark */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-sm lg:hidden shrink-0">
            LC
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              Lotus Caterer
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs sm:text-sm text-slate-500 font-normal hidden sm:inline">
              Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Badge variant="success" className="hidden sm:inline-flex gap-1.5 py-1">
            <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>Equal Partner Auth Active</span>
          </Badge>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Authenticated Partner Profile with Phone Edit Trigger */}
          <button
            type="button"
            onClick={() => setIsPhoneModalOpen(true)}
            className="flex items-center gap-2 pl-0.5 sm:pl-1 text-left p-1 rounded-xl hover:bg-slate-100/80 transition-colors group cursor-pointer"
            title="Click to edit your phone number"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-[11px] sm:text-xs shadow-sm group-hover:ring-2 group-hover:ring-slate-900/20 transition-all">
              {partner?.name ? partner.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                <span>{partner?.name || 'Partner Account'}</span>
                <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                {partner?.phone ? (
                  <span>{partner.phone}</span>
                ) : (
                  <span className="text-blue-600 underline">Add phone</span>
                )}
              </div>
            </div>
          </button>

          {/* Logout Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSignOutModalOpen(true)}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-1.5 sm:px-2.5 h-7 sm:h-8 gap-1.5"
            title="Sign Out of Management Portal"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-xs font-medium">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Confirmation Alert Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={logout}
      />

      {/* Edit Own Phone Modal */}
      <EditPartnerPhoneModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />
    </>
  );
};
