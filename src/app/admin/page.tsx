import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient();
  
  // Safely grab user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Admin check using SUPABASE_SERVICE_ROLE_KEY to bypass RLS
  const adminSupabase = createAdminClient();
  const { data: adminCheck } = await adminSupabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminCheck) {
    redirect('/dashboard');
  }

  return <AdminDashboardClient />;
}
