/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    console.log('[Analyze API] GET request received.');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      console.error('[Analyze API Error] Missing fileId parameter.');
      return NextResponse.json({ error: "Missing fileId parameter." }, { status: 400 });
    }

    // Detect mobile device from User-Agent header or query param
    const userAgent = request.headers.get('user-agent') || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const clientIsMobileParam = searchParams.get('isMobile') === 'true';
    const isMobile = isMobileUA || clientIsMobileParam;

    console.log(`[Analyze API] User Agent: "${userAgent}". Detected Mobile: ${isMobile} (UA: ${isMobileUA}, ClientParam: ${clientIsMobileParam})`);

    const adminSupabase = createAdminClient();

    // 1. Fetch file record from Supabase
    console.log(`[Analyze API] Querying file metadata for ID: ${fileId}`);
    const { data: file, error: fileErr } = await adminSupabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileErr || !file) {
      console.error('[Analyze API Error] File not found in database:', fileErr?.message);
      return NextResponse.json({ error: "Could not find requested analysis file." }, { status: 404 });
    }

    // 2. Fetch analysis record
    console.log(`[Analyze API] Querying analysis record for file: ${fileId}`);
    const { data: analysis, error: analysisErr } = await adminSupabase
      .from('analyses')
      .select('*')
      .eq('file_id', fileId)
      .single();

    if (analysisErr) {
      console.error('[Analyze API Error] Analysis record not found:', analysisErr.message);
      return NextResponse.json({ error: "Analysis properties not found." }, { status: 404 });
    }

    // 3. Download JSON dataset from Supabase Storage
    console.log(`[Analyze API] Downloading dataset blob from storage path: ${file.storage_path}`);
    const { data: storageBlob, error: storageErr } = await adminSupabase.storage
      .from('uploads')
      .download(file.storage_path);

    if (storageErr) {
      console.error('[Analyze API Error] Storage download failed:', storageErr.message);
      return NextResponse.json({ error: "Failed to download spreadsheet content from storage." }, { status: 500 });
    }

    const jsonText = await storageBlob.text();
    let rows = JSON.parse(jsonText);
    console.log(`[Analyze API] Successfully loaded dataset. Total rows: ${rows.length}`);

    // 4. Reduce payload size on mobile (first 100 rows)
    let isMobileLimit = false;
    const originalLength = rows.length;
    if (isMobile && rows.length > 100) {
      console.log(`[Analyze API Mobile] Truncating dataset size from ${originalLength} to 100 rows for mobile optimization.`);
      rows = rows.slice(0, 100);
      isMobileLimit = true;
    }

    return NextResponse.json({
      file,
      analysis,
      dataset: rows,
      totalRows: originalLength,
      isMobileLimit
    });

  } catch (error: any) {
    console.error('[Analyze API Global Error] Exception:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
