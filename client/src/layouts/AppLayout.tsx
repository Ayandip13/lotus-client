import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 print:bg-white print:min-h-0">
      {/* Desktop Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible min-w-0">
        <Header onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8 pb-24 sm:pb-28 lg:pb-8 print:p-0 print:overflow-visible print:bg-white">
          <div className="mx-auto max-w-7xl print:max-w-none print:w-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Fixed Bottom Navigation (< lg screens) */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
