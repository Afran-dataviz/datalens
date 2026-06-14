import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BroadcastBanner from '@/components/BroadcastBanner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Safely grab user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile from DB
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch user subscription details
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .maybeSingle();

  // Check if user is registered in admin role
  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const userProfile = {
    email: user.email || '',
    fullName: profile?.full_name || user.user_metadata?.full_name || 'User',
    avatarUrl: profile?.avatar_url || '',
    plan: subscription?.plan || 'free',
    isAdmin: !!admin,
  };

  return (
    <div className="flex min-h-screen bg-[#080A0F] text-[#F5F0E8] font-body">
      <Sidebar user={userProfile} />
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        <BroadcastBanner />
        {children}
      </div>
    </div>
  );
}
