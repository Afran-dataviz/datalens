/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  FileSpreadsheet, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Search,
  Eye,
  AlertCircle
} from 'lucide-react';

export default function MyFilesPage() {
  const supabase = createClient();

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [plan, setPlan] = useState('free');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get plan
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle();
      if (subscription) setPlan(subscription.plan || 'free');

      // Fetch files
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch files list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDeleteFile = async (id: string, storagePath: string) => {
    if (!confirm("Are you sure you want to delete this dataset? This will remove all cleaning histories and associated AI chats.")) return;
    setErrorMsg(null);

    try {
      // 1. Delete from storage
      const { error: storageErr } = await supabase.storage
        .from('uploads')
        .remove([storagePath]);

      if (storageErr) {
        console.warn("Storage deletion warning: file may not exist in bucket.");
      }

      // 2. Delete from database (Cascade deletes analyses automatically)
      const { error: dbErr } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbErr) throw dbErr;

      // Refresh list
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete file.");
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const filteredFiles = files.filter(f => 
    f.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12 w-full space-y-6 md:space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-border gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">My Datasets</h1>
          <p className="text-xs md:text-sm text-text-muted font-light mt-1">Manage and access your parsed data visualizations.</p>
        </div>

        <Link href="/dashboard" className="w-full sm:w-auto btn-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0">
          Upload New File <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Plan limit warning banner */}
      {plan === 'free' && files.length >= 1 && (
        <div className="p-4 md:p-5 rounded-2xl border border-gold bg-gold/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-semibold text-gold-light text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Free plan storage limit reached
            </h4>
            <p className="text-xs text-text-muted font-light leading-relaxed max-w-xl">
              You are currently on the Free tier. You can keep <strong className="text-text-primary">1 active dataset</strong>. To upload more sheets and save multiple historical dashboards, upgrade to DataLens Pro.
            </p>
          </div>

          <Link href="/dashboard/settings" className="w-full md:w-auto btn-gold px-6 py-3 text-xs font-bold uppercase tracking-wider block text-center shrink-0 shadow-lg shadow-gold/15">
            Upgrade to Pro
          </Link>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-gold-light" />
          <p className="text-xs text-text-muted font-mono tracking-widest uppercase">Fetching file index...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {files.length > 0 && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-gold/50 text-text-primary placeholder-text-muted/60 bg-clip-padding"
              />
            </div>
          )}

          {/* Empty State */}
          {filteredFiles.length === 0 && (
            <div className="border border-dashed border-border rounded-2xl p-8 md:p-16 text-center text-text-muted italic flex flex-col items-center justify-center gap-4">
              <FileSpreadsheet className="w-10 h-10 text-gold-light opacity-50" />
              <div className="space-y-1">
                <div className="text-sm font-semibold not-italic text-text-primary">No spreadsheets found</div>
                <div className="text-xs font-light">
                  {searchTerm ? 'Try a different filter query.' : 'Upload your first CSV/Excel file to see it here.'}
                </div>
              </div>
            </div>
          )}

          {filteredFiles.length > 0 && (
            <>
              {/* Mobile List View (visible on screen sizes < 640px) */}
              <div className="space-y-3 block sm:hidden">
                {filteredFiles.map((f) => (
                  <div key={f.id} className="card-luxury p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-sm text-text-primary truncate" title={f.file_name}>
                          {f.file_name}
                        </h3>
                        <p className="text-[10px] text-text-muted font-light mt-0.5">
                          Rows: {f.row_count} &bull; Size: {formatBytes(f.file_size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link 
                        href={`/dashboard/${f.id}`}
                        aria-label="View dataset"
                        className="w-11 h-11 border border-border bg-card2 hover:bg-border text-text-primary rounded-xl flex items-center justify-center transition"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDeleteFile(f.id, f.storage_path)}
                        aria-label="Delete dataset"
                        className="w-11 h-11 border border-red-500/10 hover:bg-red-500/5 text-red-400 rounded-xl flex items-center justify-center transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/Tablet Grid View (hidden on mobile) */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map((f) => (
                  <div key={f.id} className="card-luxury p-6 flex flex-col justify-between h-52">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-card2 border border-border rounded text-text-muted">
                          {f.file_type}
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-base mt-4 text-text-primary truncate max-w-[200px]" title={f.file_name}>
                        {f.file_name}
                      </h3>
                      
                      <p className="text-[10px] text-text-muted font-light mt-1">
                        Rows: {f.row_count} &bull; Cols: {f.column_count} &bull; Size: {formatBytes(f.file_size)}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-border/30 mt-4">
                      <Link 
                        href={`/dashboard/${f.id}`}
                        className="flex-grow py-2 border border-border bg-card2 hover:bg-border text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition text-text-primary"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      <button 
                        onClick={() => handleDeleteFile(f.id, f.storage_path)}
                        className="px-3 py-2 border border-red-500/10 hover:bg-red-500/5 text-red-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
