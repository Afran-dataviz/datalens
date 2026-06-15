import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request payload
    const { storagePath, fileContent } = await request.json();
    if (!storagePath || !fileContent) {
      return NextResponse.json({ error: 'Missing storagePath or fileContent' }, { status: 400 });
    }

    // 3. Security check: prevent directory traversal & unauthorized overwrites.
    // Ensure the storage path is locked to the user's specific folder.
    const userFolderPrefix = `${user.id}/`;
    if (!storagePath.startsWith(userFolderPrefix)) {
      return NextResponse.json({ error: 'Forbidden storage path' }, { status: 403 });
    }

    // 4. Query user's plan from subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      return NextResponse.json({ error: 'Failed to verify subscription plan' }, { status: 500 });
    }

    const plan = subscription?.plan || 'free';

    // 5. Measure byte length of the fileContent string
    const sizeInBytes = Buffer.byteLength(fileContent, 'utf-8');

    // 6. Enforce plan-based size limits
    const isPro = plan === 'pro';
    const maxFreeLimit = 5242880; // 5MB
    const maxProLimit = 52428800; // 50MB

    if (!isPro && sizeInBytes > maxFreeLimit) {
      return NextResponse.json(
        { error: 'Upgrade to Pro for files up to 50MB' },
        { status: 400 }
      );
    }

    if (isPro && sizeInBytes > maxProLimit) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 50MB' },
        { status: 400 }
      );
    }

    // 7. Perform the upload using Supabase Admin Client
    const adminSupabase = createAdminClient();
    const buffer = Buffer.from(fileContent, 'utf-8');

    const { error: uploadError } = await adminSupabase.storage
      .from('uploads')
      .upload(storagePath, buffer, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Cloud Storage Upload Failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, size: sizeInBytes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
