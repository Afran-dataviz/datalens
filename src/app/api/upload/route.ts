/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

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

    // 5. Add file size check & row limit check before processing
    let parsedContent = JSON.parse(fileContent);
    let warning: string | null = null;
    if (parsedContent.length > 50000) {
      parsedContent = parsedContent.slice(0, 5000);
      warning = "Very large dataset. Showing first 5,000 rows.";
    } else if (parsedContent.length > 10000) {
      parsedContent = parsedContent.slice(0, 10000);
      warning = "Large dataset detected. Showing first 10,000 rows for performance.";
    }

    const finalFileContent = JSON.stringify(parsedContent);
    
    // Measure byte length of final fileContent string
    const sizeInBytes = Buffer.byteLength(finalFileContent, 'utf-8');

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
    const buffer = Buffer.from(finalFileContent, 'utf-8');

    const { error: uploadError } = await adminSupabase.storage
      .from('uploads')
      .upload(storagePath, buffer, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: true
      });

    // Clean up large variables
    parsedContent = null;

    if (uploadError) {
      return NextResponse.json(
        { error: `Cloud Storage Upload Failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, size: sizeInBytes, warning });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
