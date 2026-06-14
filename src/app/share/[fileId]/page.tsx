/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Download, 
  Search,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface ColumnMeta {
  name: string;
  type: 'Number' | 'Date' | 'Text' | 'Boolean';
}

export default function PublicShareDashboard() {
  const params = useParams();
  const supabase = createClient();
  const fileId = params.fileId as string;

  const [fileRecord, setFileRecord] = useState<any>(null);
  const [analysisRecord, setAnalysisRecord] = useState<any>(null);
  const [dataset, setDataset] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Table search & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setLoading(true);
        // 1. Fetch analysis details first to check share status (Uses public policy check)
        const { data: analysis, error: analysisErr } = await supabase
          .from('analyses')
          .select('*')
          .eq('file_id', fileId)
          .single();
        
        if (analysisErr || !analysis) {
          throw new Error("This dashboard has not been shared publicly by the owner.");
        }

        if (!analysis.shareable) {
          throw new Error("This dashboard is currently marked as private.");
        }

        setAnalysisRecord(analysis);

        // 2. Fetch file properties
        const { data: file, error: fileErr } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single();

        if (fileErr || !file) throw new Error("Could not find dataset context.");
        setFileRecord(file);

        // 3. Download data from storage (Uses read-only public storage bypass or public read)
        // Since original file uploads have storage path, we can fetch it via anon client
        const { data: storageBlob, error: storageErr } = await supabase.storage
          .from('uploads')
          .download(file.storage_path);

        if (storageErr) throw new Error("Failed to download spreadsheet content from storage.");

        const jsonText = await storageBlob.text();
        const rows = JSON.parse(jsonText);
        setDataset(rows);

      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load dashboard parameters.");
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchSharedData();
    }
  }, [fileId]);

  const handleDownloadChart = (containerId: string, filename: string) => {
    const element = document.getElementById(containerId);
    const svg = element?.querySelector('svg');
    if (!svg) return;

    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = (svg.clientWidth || 600) * 2;
      canvas.height = (svg.clientHeight || 300) * 2;
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.fillStyle = '#0E1117';
        context.fillRect(0, 0, svg.clientWidth || 600, svg.clientHeight || 300);
        context.drawImage(image, 0, 0);
        
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `${filename}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#080A0F] text-[#F5F0E8]">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-light" />
        <p className="text-xs text-[#6B7280] font-mono tracking-widest uppercase">Fetching public report...</p>
      </div>
    );
  }

  if (errorMsg || !fileRecord) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#080A0F] text-[#F5F0E8] p-6">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="font-heading text-lg font-bold">Access Denied</h3>
        <p className="text-sm text-[#6B7280] font-light max-w-sm text-center">{errorMsg || "This link is invalid or expired."}</p>
        <Link href="/" className="btn-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider mt-4">
          Go to Homepage
        </Link>
      </div>
    );
  }

  const cols: ColumnMeta[] = analysisRecord?.column_metadata || [];
  const dateCols = cols.filter(c => c.type === 'Date');
  const catCols = cols.filter(c => c.type === 'Text');

  // Chart 1: Date Trend
  let lineChartData: any[] = [];
  const primaryDateCol = dateCols[0]?.name;
  if (primaryDateCol) {
    const counts: Record<string, number> = {};
    dataset.forEach(r => {
      const rawDate = r[primaryDateCol];
      if (rawDate) {
        const dStr = new Date(rawDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        counts[dStr] = (counts[dStr] || 0) + 1;
      }
    });
    lineChartData = Object.entries(counts).map(([date, count]) => ({ date, count }));
  }

  // Chart 2: Category distribution
  let catChartData: any[] = [];
  const primaryCatCol = catCols[0]?.name;
  if (primaryCatCol) {
    const freqs: Record<string, number> = {};
    dataset.forEach(r => {
      const val = r[primaryCatCol];
      if (val) freqs[val] = (freqs[val] || 0) + 1;
    });
    catChartData = Object.entries(freqs)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  const COLORS = ['#C9A84C', '#8B6FBB', '#E8C97A', '#9B84C4', '#D4AF37', '#A08CC4'];

  // Table Logic
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredData = dataset.filter(row => {
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    
    return sortAsc ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F5F0E8] font-body">
      
      {/* Public Header */}
      <header className="border-b border-[#1E2130] bg-[#0E1117] h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl font-bold tracking-wide text-gold-light">
            Data<span className="text-[#F5F0E8]">Lens</span>
          </span>
          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold">
            Public Report
          </span>
        </div>
        <Link href="/" className="text-xs text-[#6B7280] hover:text-[#F5F0E8] transition">
          Build your own →
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        
        <div>
          <h1 className="font-heading text-3xl font-bold">{fileRecord.file_name}</h1>
          <p className="text-xs text-[#6B7280] font-light mt-1">Shared visual report dashboard.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
            <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Total Rows</div>
            <div className="text-2xl font-bold font-heading">{fileRecord.row_count}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
            <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Columns</div>
            <div className="text-2xl font-bold font-heading">{fileRecord.column_count}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
            <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Casting Types</div>
            <div className="text-2xl font-bold text-gold font-heading">{cols.length}</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130]">
            <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Status</div>
            <div className="text-2xl font-bold text-purple font-heading">Verified</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {primaryDateCol && lineChartData.length > 0 && (
            <div id="pub-date-chart" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                <h3 className="font-heading text-lg font-bold">Trend Analysis</h3>
                <button onClick={() => handleDownloadChart('pub-date-chart', 'trend')} className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold-light transition">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
                    <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '10px' }} />
                    <Line type="monotone" dataKey="count" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill: '#C9A84C' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {primaryCatCol && catChartData.length > 0 && (
            <div id="pub-cat-chart" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                <h3 className="font-heading text-lg font-bold">Category Distribution</h3>
                <button onClick={() => handleDownloadChart('pub-cat-chart', 'category')} className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold-light transition">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '10px' }} />
                    <Bar dataKey="count" fill="#8B6FBB" radius={[4, 4, 0, 0]}>
                      {catChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

        {/* Data Table */}
        <div className="bg-[#0E1117] border border-[#1E2130] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#1E2130] flex justify-between items-center">
            <h3 className="font-heading text-lg font-bold">Sheet Explorer</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search rows..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-1.5 bg-[#141720] border border-[#1E2130] rounded-xl text-xs focus:outline-none focus:border-gold/50 text-[#F5F0E8]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141720] border-b border-[#1E2130]">
                  {cols.map((col, idx) => (
                    <th key={idx} onClick={() => handleSort(col.name)} className="p-4 font-semibold uppercase tracking-wider text-[#6B7280] font-mono cursor-pointer hover:text-gold-light select-none">
                      {col.name} {sortField === col.name ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[#1E2130]/30 hover:bg-[#141720]/10 transition">
                    {cols.map((col, cIdx) => (
                      <td key={cIdx} className="p-4 text-[#F5F0E8] truncate max-w-[200px]">
                        {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-[#1E2130] flex items-center justify-between text-xs text-[#6B7280] font-light">
              <div>
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-[#1E2130] rounded-lg bg-[#141720] disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border border-[#1E2130] rounded-lg bg-[#141720] disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}

// Inline refresh icon helper
function RefreshCw(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
