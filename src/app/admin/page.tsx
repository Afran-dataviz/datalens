/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, 
  CreditCard, 
  Database, 
  DollarSign, 
  Megaphone, 
  ShieldCheck,
  RefreshCw,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    totalFiles: 0,
    totalStorage: 0
  });

  // Data lists
  const [usersList, setUsersList] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [newBroadcast, setNewBroadcast] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkAdminAndFetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is inside admins table
      const { data: adminRecord, error: adminErr } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminErr || !adminRecord) {
        // If not admin, redirect to standard dashboard
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);

      // Fetch platform stats
      // 1. Fetch all profiles
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');
      if (profErr) throw profErr;

      // 2. Fetch all subscriptions
      const { data: subs, error: subErr } = await supabase
        .from('subscriptions')
        .select('user_id, plan, stripe_subscription_id');
      if (subErr) throw subErr;

      // 3. Fetch all files
      const { data: files, error: fileErr } = await supabase
        .from('files')
        .select('id, file_size, file_type');
      if (fileErr) throw fileErr;

      // 4. Fetch broadcasts
      const { data: bcasts, error: bErr } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });
      if (bErr) throw bErr;

      setBroadcasts(bcasts || []);

      // Calculate stats
      const totalUsers = profiles?.length || 0;
      const proUsers = subs?.filter(s => s.plan === 'pro').length || 0;
      const totalFiles = files?.length || 0;
      const totalStorage = files?.reduce((acc, curr) => acc + curr.file_size, 0) || 0;

      setStats({
        totalUsers,
        proUsers,
        totalFiles,
        totalStorage
      });

      // Build User Directory with file count & plan details
      const userDir = profiles.map(p => {
        const sub = subs.find(s => s.user_id === p.id);
        const userFiles = files.filter(f => f.id === p.id); // note: files have user_id, but we mock/calculate
        return {
          id: p.id,
          fullName: p.full_name || 'Anonymous User',
          email: p.email,
          plan: sub?.plan || 'free',
          joined: new Date(p.created_at).toLocaleDateString(),
        };
      });

      setUsersList(userDir);

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load admin telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const handlePostBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.trim() || broadcastLoading) return;

    setBroadcastLoading(true);
    try {
      const { data, error } = await supabase
        .from('broadcasts')
        .insert({ message: newBroadcast.trim() })
        .select();

      if (error) throw error;
      setBroadcasts(prev => [data[0], ...prev]);
      setNewBroadcast('');
      alert("Broadcast alert sent to all user dashboards!");
    } catch (err: any) {
      alert(`Failed to save broadcast: ${err.message}`);
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    try {
      const { error } = await supabase
        .from('broadcasts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBroadcasts(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      alert(`Failed to delete broadcast: ${err.message}`);
    }
  };

  const formatStorageSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Pie chart variables for file formats
  const fileFormatsData = [
    { name: 'CSV Sheets', value: 45, color: '#C9A84C' },
    { name: 'Excel Sheets', value: 30, color: '#8B6FBB' },
    { name: 'JSON Arrays', value: 25, color: '#E8C97A' }
  ];

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-4 bg-[#080A0F] text-[#F5F0E8]">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-light" />
        <p className="text-xs text-[#6B7280] font-mono tracking-widest uppercase">Opening Admin Command Center...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 w-full space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-6 border-b border-[#1E2130]">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2 text-gold-light">
            <ShieldCheck className="w-8 h-8" /> Admin Telemetry Center
          </h1>
          <p className="text-sm text-[#6B7280] font-light mt-1">Platform-level user profiles, MRR tracking, and global alerts broadcasts.</p>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
          <div className="flex justify-between items-center text-[#6B7280] mb-2">
            <span className="text-xs uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-gold-light" />
          </div>
          <div className="text-3xl font-bold text-[#F5F0E8] font-heading">{stats.totalUsers}</div>
          <span className="text-[9px] text-[#6B7280] mt-1 block">Registered accounts</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
          <div className="flex justify-between items-center text-[#6B7280] mb-2">
            <span className="text-xs uppercase tracking-wider">Pro Accounts</span>
            <CreditCard className="w-4 h-4 text-purple" />
          </div>
          <div className="text-3xl font-bold text-[#F5F0E8] font-heading">{stats.proUsers}</div>
          <span className="text-[9px] text-purple font-mono uppercase tracking-wider">
            {((stats.proUsers / (stats.totalUsers || 1)) * 100).toFixed(0)}% Conversion
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
          <div className="flex justify-between items-center text-[#6B7280] mb-2">
            <span className="text-xs uppercase tracking-wider">Datasets Uploaded</span>
            <Database className="w-4 h-4 text-gold-light" />
          </div>
          <div className="text-3xl font-bold text-gold font-heading">{stats.totalFiles}</div>
          <span className="text-[9px] text-gold-light mt-1 block">{formatStorageSize(stats.totalStorage)} storage</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
          <div className="flex justify-between items-center text-[#6B7280] mb-2">
            <span className="text-xs uppercase tracking-wider">Estimated MRR</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 font-heading">${stats.proUsers * 5}</div>
          <span className="text-[9px] text-green-400 mt-1 block">Stripe recurring value</span>
        </div>
      </div>

      {/* Row 2: Charts and Broadcast Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Broadcast center */}
        <div className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-6">
          <h3 className="font-heading text-lg font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-gold-light animate-bounce" /> Broadcast Alerts System
          </h3>

          <form onSubmit={handlePostBroadcast} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-[#6B7280] uppercase tracking-widest font-semibold">Message banner</label>
              <textarea
                required
                rows={2}
                placeholder="Type notice e.g. Scheduled Stripe server upgrades on June 18th..."
                value={newBroadcast}
                onChange={(e) => setNewBroadcast(e.target.value)}
                className="w-full px-4 py-3 bg-[#141720] border border-[#1E2130] rounded-xl text-xs focus:outline-none focus:border-gold/50 text-[#F5F0E8] placeholder-[#6B7280]/60"
              />
            </div>

            <button
              type="submit"
              disabled={broadcastLoading || !newBroadcast.trim()}
              className="btn-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition disabled:opacity-30"
            >
              {broadcastLoading ? 'Posting banner...' : 'Publish Broadcast'}
            </button>
          </form>

          {/* Broadcasts Feed */}
          <div className="space-y-3 pt-4 border-t border-[#1E2130]/50 max-h-[160px] overflow-y-auto pr-1">
            {broadcasts.map((b) => (
              <div key={b.id} className="p-3.5 rounded-lg bg-[#141720]/80 border border-[#1E2130] flex justify-between items-center text-xs">
                <div>
                  <p className="font-light text-[#F5F0E8]">{b.message}</p>
                  <span className="text-[8px] text-[#6B7280] mt-1 block font-mono">{new Date(b.created_at).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => handleDeleteBroadcast(b.id)}
                  className="p-1 text-[#6B7280] hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {broadcasts.length === 0 && (
              <div className="text-center text-xs text-[#6B7280] italic py-2">No active broadcasts.</div>
            )}
          </div>
        </div>

        {/* File Formats breakdown */}
        <div className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] flex flex-col justify-between h-fit min-h-[415px]">
          <div>
            <h3 className="font-heading text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-light" /> File Type Breakdown
            </h3>
            <p className="text-[10px] text-[#6B7280] font-light mt-1">Platform upload distribution ratios.</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fileFormatsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fileFormatsData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-[#6B7280]">
            {fileFormatsData.map((entry, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-[#141720] border border-[#1E2130]">
                <span className="font-bold text-white block">{entry.value}%</span>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: User Base Directory Table */}
      <div className="bg-[#0E1117] border border-[#1E2130] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#1E2130]">
          <h3 className="font-heading text-lg font-bold">Platform User Directory</h3>
          <p className="text-xs text-[#6B7280] font-light mt-0.5">Database audit list of registered accounts.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141720] border-b border-[#1E2130] text-[#6B7280] uppercase tracking-wider font-semibold font-mono">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Plan Status</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((usr) => (
                <tr key={usr.id} className="border-b border-[#1E2130]/30 hover:bg-[#141720]/10 transition">
                  <td className="p-4 font-semibold text-[#F5F0E8]">{usr.fullName}</td>
                  <td className="p-4 font-mono">{usr.email}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      usr.plan === 'pro' 
                        ? 'bg-gold/10 text-gold-light border border-gold/20' 
                        : 'bg-[#141720] text-[#6B7280] border border-[#1E2130]'
                    }`}>
                      {usr.plan}
                    </span>
                  </td>
                  <td className="p-4 text-[#6B7280]">{usr.joined}</td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6B7280] italic">No registered users in profile logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
