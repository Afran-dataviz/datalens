import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardContainer from '@/components/DashboardContainer';

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
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const activePlan = (subscription?.plan === 'pro' && subscription?.status === 'active') ? 'pro' : 'free';

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
    plan: activePlan,
    isAdmin: !!admin,
  };

  return (
    <DashboardContainer user={userProfile}>
      {children}
    </DashboardContainer>
  );
}
