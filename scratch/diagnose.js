const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function diagnose() {
  console.log('--- Database Diagnostics ---');
  const { data: files, error: filesError } = await supabase.from('files').select('*');
  if (filesError) {
    console.error('Failed to query files table:', filesError.message);
  } else {
    console.log(`Found ${files.length} records in files table:`);
    files.forEach(f => {
      console.log(`- File ID: ${f.id}\n  User ID: ${f.user_id}\n  Name: ${f.file_name}\n  Path: ${f.storage_path}\n  Size: ${f.file_size} bytes\n  Created: ${f.created_at}\n`);
    });
  }

  console.log('--- Storage Diagnostics ---');
  // List objects in bucket
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Failed to list buckets:', bucketsError.message);
  } else {
    console.log('Storage Buckets found:');
    buckets.forEach(b => {
      console.log(`- Bucket ID: "${b.name}" (Public: ${b.public})`);
    });
  }

  if (files && files.length > 0) {
    console.log('Checking existence of files in "uploads" bucket:');
    for (const file of files) {
      console.log(`Checking storage path: "${file.storage_path}"`);
      // Since supabase.storage.from('uploads').list() only lists folder contents,
      // we can try downloading the first few bytes of the file to verify existence.
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(file.storage_path, { transform: { width: 1 } }); // download helper
      
      const { data: rawData, error: rawError } = await supabase.storage
        .from('uploads')
        .download(file.storage_path);

      if (rawError) {
        console.error(`  ❌ Failed to retrieve object from storage: ${rawError.message}`);
      } else {
        console.log(`  ✅ Object retrieved successfully from storage! Size: ${rawData.size} bytes`);
      }
    }
  }

  process.exit(0);
}

diagnose();
