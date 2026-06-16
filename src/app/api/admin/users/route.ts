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
      console.log('[Admin Users API] Unauthorized: No active user session.');
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
      console.log(`[Admin Users API] Forbidden: User ${user.id} is not an administrator.`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`[Admin Users API] Fetching admin user directories...`);

    // 3. Fetch all profiles
    const { data: profiles, error: profErr } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, created_at');
    if (profErr) throw profErr;

    // 4. Fetch all subscriptions
    const { data: subs, error: subErr } = await adminSupabase
      .from('subscriptions')
      .select('user_id, plan');
    if (subErr) throw subErr;

    // 5. Fetch all files to compute counts per user
    const { data: files, error: fileErr } = await adminSupabase
      .from('files')
      .select('user_id');
    if (fileErr) throw fileErr;

    // Build map of user_id to file count
    const fileCountMap: Record<string, number> = {};
    files?.forEach((f: any) => {
      if (f.user_id) {
        fileCountMap[f.user_id] = (fileCountMap[f.user_id] || 0) + 1;
      }
    });

    // Combine profiles, subscriptions, and file counts
    const users = (profiles || []).map((p: any) => {
      const sub = subs?.find((s: any) => s.user_id === p.id);
      return {
        id: p.id,
        name: p.full_name || 'Anonymous User',
        email: p.email,
        plan: sub?.plan || 'free',
        fileCount: fileCountMap[p.id] || 0,
        joinedDate: p.created_at,
      };
    });

    console.log(`[Admin Users API Success] Loaded ${users.length} users successfully.`);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('[Admin Users API Error] Exception:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
