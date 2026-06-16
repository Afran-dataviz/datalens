/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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

    let jsonText = await storageBlob.text();
    let rows = JSON.parse(jsonText);
    console.log(`[Analyze API] Successfully loaded dataset. Total rows: ${rows.length}`);

    // 4. Reduce payload size / handle large datasets
    let isMobileLimit = false;
    let warning: string | null = null;
    const originalLength = rows.length;
    
    if (isMobile && rows.length > 100) {
      console.log(`[Analyze API Mobile] Truncating dataset size from ${originalLength} to 100 rows for mobile optimization.`);
      rows = rows.slice(0, 100);
      isMobileLimit = true;
      warning = "Mobile limit: Showing first 100 rows for performance.";
    } else if (rows.length > 50000) {
      console.log(`[Analyze API] Truncating very large dataset from ${originalLength} to 5,000 rows.`);
      rows = rows.slice(0, 5000);
      warning = "Very large dataset. Showing first 5,000 rows.";
    } else if (rows.length > 10000) {
      console.log(`[Analyze API] Truncating large dataset from ${originalLength} to 10,000 rows.`);
      rows = rows.slice(0, 10000);
      warning = "Large dataset detected. Showing first 10,000 rows for performance.";
    }

    const responsePayload = {
      file,
      analysis,
      dataset: rows,
      totalRows: originalLength,
      isMobileLimit,
      warning
    };

    // Clean up large variables
    jsonText = '';
    rows = null;

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
