'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import BroadcastBanner from '@/components/BroadcastBanner';
import ThemeToggle from '@/components/ThemeToggle';
import { Menu } from 'lucide-react';

interface DashboardContainerProps {
  user: {
    email: string;
    fullName: string;
    avatarUrl: string;
    plan: string;
    isAdmin: boolean;
  };
  children: React.ReactNode;
}

export default function DashboardContainer({ user, children }: DashboardContainerProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-text-primary font-body overflow-hidden">
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <Sidebar 
        user={user} 
        mobileOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto relative">
        
        {/* Mobile Header Bar */}
        <header className="flex md:hidden items-center justify-between h-16 px-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 border border-border rounded-xl text-text-primary hover:text-gold-light transition"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-heading text-lg font-bold tracking-wide text-gold-light">
              DataLens
            </span>
          </div>
          <ThemeToggle />
        </header>

        <BroadcastBanner />
        <div className="flex-grow overflow-y-auto flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
