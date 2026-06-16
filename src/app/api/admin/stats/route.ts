/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // 1. Authenticate user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[Admin Stats API] Unauthorized: No active user session.');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorize admin
    const adminSupabase = createAdminClient();
    const { data: adminRecord, error: adminErr } = await adminSupabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminErr || !adminRecord) {
      console.log(`[Admin Stats API] Forbidden: User ${user.id} is not an administrator.`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`[Admin Stats API] Fetching admin statistics...`);

    // 3. Query total users
    const { count: totalUsers, error: usersErr } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (usersErr) throw usersErr;

    // 4. Query pro users
    const { count: proUsers, error: proErr } = await adminSupabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'pro');
    if (proErr) throw proErr;

    // 5. Query files count
    const { count: totalFiles, error: filesErr } = await adminSupabase
      .from('files')
      .select('*', { count: 'exact', head: true });
    if (filesErr) throw filesErr;

    // 6. Query total storage
    const { data: storageData, error: storageErr } = await adminSupabase
      .from('files')
      .select('file_size');
    if (storageErr) throw storageErr;

    const totalStorage = storageData?.reduce((acc: number, curr: any) => acc + (curr.file_size || 0), 0) || 0;

    console.log('[Admin Stats API Success] Retained stats data:', {
      totalUsers,
      proUsers,
      totalFiles,
      totalStorage
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      proUsers: proUsers || 0,
      totalFiles: totalFiles || 0,
      totalStorage,
    });
  } catch (error: any) {
    console.error('[Admin Stats API Error] Exception:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
