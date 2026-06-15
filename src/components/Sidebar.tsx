/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Upload, 
  FileSpreadsheet, 
  Settings, 
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  user: {
    email: string;
    fullName: string;
    avatarUrl: string;
    plan: string;
    isAdmin: boolean;
  };
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: "Upload & Clean", icon: <Upload className="w-5 h-5" />, href: "/dashboard" },
    { name: "My Files", icon: <FileSpreadsheet className="w-5 h-5" />, href: "/dashboard/files" },
    { name: "Settings", icon: <Settings className="w-5 h-5" />, href: "/dashboard/settings" },
  ];

  if (user.isAdmin) {
    menuItems.push({
      name: "Admin Panel",
      icon: <ShieldAlert className="w-5 h-5" />,
      href: "/admin"
    });
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <aside 
        className={`fixed md:sticky top-0 bottom-0 left-0 z-40 bg-card border-r border-border flex flex-col justify-between transition-all duration-300 h-screen ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Collapse Trigger Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute top-6 -right-3 w-6 h-6 rounded-full bg-card2 border border-border text-gold-light hover:text-gold items-center justify-center z-40"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div>
          {/* Brand Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold tracking-wide text-gold-light">
                D{collapsed ? '' : <span className="text-text-primary font-heading">ataLens</span>}
              </span>
            </Link>

            {/* Mobile Close Button */}
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-card2 md:hidden"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => onClose && onClose()}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition group ${
                    isActive 
                      ? 'bg-gold/10 border border-gold/20 text-gold-light font-bold' 
                      : 'text-text-muted hover:text-text-primary hover:bg-card2'
                  }`}
                >
                  <div className={`${isActive ? 'text-gold-light' : 'text-text-muted group-hover:text-gold-light'}`}>
                    {item.icon}
                  </div>
                  {(!collapsed || mobileOpen) && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile / Footer section */}
        <div className="p-4 border-t border-border space-y-4">
          {/* User Card */}
          <div className={`flex items-center gap-3 ${(collapsed && !mobileOpen) ? 'justify-center' : ''}`}>
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.fullName} 
                className="w-10 h-10 rounded-full border border-gold/20 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-card2 border border-border flex items-center justify-center text-gold-light font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate leading-tight">{user.fullName}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
                    user.plan === 'pro' 
                      ? 'bg-gold/10 text-gold-light border border-gold/20' 
                      : 'bg-card2 text-text-muted border border-border'
                  }`}>
                    {user.plan}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition ${(collapsed && !mobileOpen) ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
        
      </aside>
    </>
  );
}
