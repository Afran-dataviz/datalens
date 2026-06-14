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
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  user: {
    email: string;
    fullName: string;
    avatarUrl: string;
    plan: string;
    isAdmin: boolean;
  };
}

export default function Sidebar({ user }: SidebarProps) {
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
    <aside 
      className={`bg-[#0E1117] border-r border-[#1E2130] flex flex-col justify-between transition-all duration-300 relative ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Trigger Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-[#141720] border border-[#1E2130] text-gold-light hover:text-gold flex items-center justify-center z-40"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#1E2130]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold tracking-wide text-gold-light">
              D{collapsed ? '' : <span className="text-[#F5F0E8] font-heading">ataLens</span>}
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition group ${
                  isActive 
                    ? 'bg-gold/10 border border-gold/20 text-gold-light font-bold' 
                    : 'text-[#6B7280] hover:text-[#F5F0E8] hover:bg-[#141720]'
                }`}
              >
                <div className={`${isActive ? 'text-gold-light' : 'text-[#6B7280] group-hover:text-gold-light'}`}>
                  {item.icon}
                </div>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile / Footer section */}
      <div className="p-4 border-t border-[#1E2130] space-y-4">
        {/* User Card */}
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.fullName} 
              className="w-10 h-10 rounded-full border border-gold/20 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#141720] border border-[#1E2130] flex items-center justify-center text-gold-light font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate leading-tight">{user.fullName}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
                  user.plan === 'pro' 
                    ? 'bg-gold/10 text-gold-light border border-gold/20' 
                    : 'bg-[#141720] text-[#6B7280] border border-[#1E2130]'
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
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
      
    </aside>
  );
}
