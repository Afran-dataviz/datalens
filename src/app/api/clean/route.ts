/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rows } = await request.json();
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Missing rows array' }, { status: 400 });
    }

    // Process data in chunks of 1000 rows
    const cleaned: any[] = [];
    const chunkSize = 1000;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      
      const processedChunk = chunk.filter((row: any) => {
        return row !== null && row !== undefined;
      });

      cleaned.push(...processedChunk);
    }

    // Add file size check / row limit check before processing
    let warning: string | null = null;
    let finalCleaned = cleaned;
    if (cleaned.length > 50000) {
      finalCleaned = cleaned.slice(0, 5000);
      warning = "Very large dataset. Showing first 5,000 rows.";
    } else if (cleaned.length > 10000) {
      finalCleaned = cleaned.slice(0, 10000);
      warning = "Large dataset detected. Showing first 10,000 rows for performance.";
    }

    // Clean up large variables
    const result = { success: true, rows: finalCleaned, warning };
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
