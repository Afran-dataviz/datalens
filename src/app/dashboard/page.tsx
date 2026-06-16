/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  Sparkles, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  X,
  RefreshCw,
  Database,
  ArrowRight,
  Info,
  AlertCircle
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface ColumnMeta {
  name: string;
  type: 'Number' | 'Date' | 'Text' | 'Boolean';
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User/Plan state
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState('free');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [cleaningStats, setCleaningStats] = useState<any>(null);

  // Wizard options state
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [removeEmptyRows, setRemoveEmptyRows] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [caseStandard, setCaseStandard] = useState<'none' | 'upper' | 'lower' | 'title'>('none');
  const [missingMethods, setMissingMethods] = useState<Record<string, 'drop' | 'mean' | 'mode' | 'custom'>>({});
  const [customFills, setCustomFills] = useState<Record<string, string>>({});
  const [columnRenames, setColumnRenames] = useState<Record<string, string>>({});
  const [deletedColumns, setDeletedColumns] = useState<Record<string, boolean>>({});
  const [typeCasts, setTypeCasts] = useState<Record<string, 'Text' | 'Number' | 'Date' | 'Boolean'>>({});
  const [dateField, setDateField] = useState('');
  const [extractDateParts, setExtractDateParts] = useState(false);

  // Save/Upload loading state
  const [saving, setSaving] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // 1. Detect success parameter in URL query
        const searchParams = new URLSearchParams(window.location.search);
        const hasSuccessParam = searchParams.get('success') === 'true';
        
        // 2. Fetch subscription status from database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .maybeSingle();
          
        let currentPlan = 'free';
        if (subscription && subscription.plan === 'pro' && subscription.status === 'active') {
          currentPlan = 'pro';
        }
        
        if (currentPlan === 'pro') {
          setPlan('pro');
          if (hasSuccessParam) {
            setSuccessToast("Welcome to Pro!");
            // Clean URL parameter
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          // If free (e.g. webhook failed or didn't process fast enough), do fallback check from Stripe API
          console.log('[Dashboard] Local DB subscription shows free. Checking Stripe API status fallback...');
          try {
            const res = await fetch('/api/stripe/check-status');
            if (res.ok) {
              const statusData = await res.json();
              if (statusData.plan === 'pro') {
                currentPlan = 'pro';
                setPlan('pro');
                // Dispatch custom event to notify Sidebar layout immediately
                window.dispatchEvent(new CustomEvent('subscription-updated', { detail: { plan: 'pro' } }));
                
                if (hasSuccessParam) {
                  setSuccessToast("Welcome to Pro!");
                } else {
                  setSuccessToast("Restored subscription status from Stripe successfully!");
                }
                router.refresh();
              } else {
                setPlan('free');
              }
            } else {
              setPlan('free');
            }
          } catch (err) {
            console.error('[Dashboard Fallback Error] Stripe status query failed:', err);
            setPlan('free');
          }
          
          if (hasSuccessParam) {
            // Clean URL parameter even if the lookup didn't succeed
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    };
    fetchUser();
  }, []);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setErrorMsg(null);
    const isPro = plan === 'pro';
    const sizeLimit = isPro ? 50 : 5; // 5MB free, 50MB pro
    const fileSizeMB = selectedFile.size / (1024 * 1024);

    if (fileSizeMB > sizeLimit) {
      if (!isPro) {
        setErrorMsg("Upgrade to Pro for files up to 50MB");
      } else {
        setErrorMsg("File size exceeds maximum limit of 50MB.");
      }
      return;
    }

    setFile(selectedFile);
    parseFileContent(selectedFile);
  };

  const parseFileContent = (fileToParse: File) => {
    setParsing(true);
    const ext = fileToParse.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(fileToParse, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          inferSchema(results.data);
        },
        error: (err) => {
          setErrorMsg(`CSV Parse Error: ${err.message}`);
          setParsing(false);
        }
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          inferSchema(json);
        } catch (err) {
          setErrorMsg('Failed to read Excel file. Make sure the structure is correct.');
          setParsing(false);
        }
      };
      reader.readAsArrayBuffer(fileToParse);
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const rows = Array.isArray(json) ? json : [json];
          inferSchema(rows);
        } catch (err) {
          setErrorMsg('Failed to parse JSON file. Ensure it is a valid JSON array.');
          setParsing(false);
        }
      };
      reader.readAsText(fileToParse);
    } else {
      setErrorMsg('Unsupported file extension. Renders CSV, XLSX, XLS, and JSON.');
      setParsing(false);
    }
  };

  const inferSchema = (data: any[]) => {
    if (!data || data.length === 0) {
      setErrorMsg('The spreadsheet file appears to have no row values.');
      setParsing(false);
      return;
    }

    // Capture first row keys
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    // Auto detect types
    const inferred: ColumnMeta[] = keys.map((key) => {
      // Look at column values
      let type: ColumnMeta['type'] = 'Text';
      const values = data.map(r => r[key]).filter(v => v !== null && v !== undefined);
      
      if (values.length > 0) {
        const sample = values[0];
        
        if (typeof sample === 'number') {
          type = 'Number';
        } else if (typeof sample === 'boolean') {
          type = 'Boolean';
        } else if (typeof sample === 'string') {
          // Date check
          const date = Date.parse(sample);
          const isDateLike = /^\d{4}[-/.]\d{2}[-/.]\d{2}/.test(sample) || /^\d{2}[-/.]\d{2}[-/.]\d{4}/.test(sample);
          if (!isNaN(date) && isDateLike) {
            type = 'Date';
          }
        }
      }
      return { name: key, type };
    });

    setColumns(inferred);
    setParsedData(data);
    setParsing(false);
    
    // Set initial configuration parameters
    const initialCasts: Record<string, ColumnMeta['type']> = {};
    const initialRenames: Record<string, string> = {};
    const initialDels: Record<string, boolean> = {};
    const initialMethods: Record<string, 'drop' | 'mean' | 'mode' | 'custom'> = {};

    inferred.forEach((col) => {
      initialCasts[col.name] = col.type;
      initialRenames[col.name] = col.name;
      initialDels[col.name] = false;
      initialMethods[col.name] = 'drop';
    });

    setTypeCasts(initialCasts);
    setColumnRenames(initialRenames);
    setDeletedColumns(initialDels);
    setMissingMethods(initialMethods);
  };

  const resetUpload = () => {
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setErrorMsg(null);
  };

  // Perform client-side data cleansing
  const runDataCleaning = () => {
    let cleaned = [...parsedData];
    const beforeCount = cleaned.length;

    // 1. Basic Cleaning
    if (removeDuplicates) {
      const seen = new Set();
      cleaned = cleaned.filter((row) => {
        const str = JSON.stringify(row);
        if (seen.has(str)) return false;
        seen.add(str);
        return true;
      });
    }

    if (removeEmptyRows) {
      cleaned = cleaned.filter((row) => {
        return Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '');
      });
    }

    if (trimWhitespace) {
      cleaned = cleaned.map((row) => {
        const newRow: any = {};
        Object.keys(row).forEach((key) => {
          const val = row[key];
          newRow[key] = typeof val === 'string' ? val.trim() : val;
        });
        return newRow;
      });
    }

    if (caseStandard !== 'none') {
      cleaned = cleaned.map((row) => {
        const newRow: any = {};
        Object.keys(row).forEach((key) => {
          const val = row[key];
          if (typeof val === 'string') {
            if (caseStandard === 'upper') newRow[key] = val.toUpperCase();
            else if (caseStandard === 'lower') newRow[key] = val.toLowerCase();
            else if (caseStandard === 'title') {
              newRow[key] = val.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            }
          } else {
            newRow[key] = val;
          }
        });
        return newRow;
      });
    }

    // 2. Missing values per column
    columns.forEach((col) => {
      const method = missingMethods[col.name];
      const customVal = customFills[col.name];

      // Find mean/mode if required
      let meanVal = 0;
      let modeVal: any = null;

      if (method === 'mean') {
        const nums = cleaned.map(r => Number(r[col.name])).filter(v => !isNaN(v) && v !== null && v !== undefined);
        if (nums.length > 0) {
          meanVal = nums.reduce((a, b) => a + b, 0) / nums.length;
        }
      } else if (method === 'mode') {
        const freqs: Record<string, number> = {};
        let maxFreq = 0;
        cleaned.forEach(r => {
          const val = r[col.name];
          if (val !== null && val !== undefined) {
            freqs[val] = (freqs[val] || 0) + 1;
            if (freqs[val] > maxFreq) {
              maxFreq = freqs[val];
              modeVal = val;
            }
          }
        });
      }

      cleaned = cleaned.filter((row) => {
        const val = row[col.name];
        if (val === null || val === undefined || String(val).trim() === '') {
          if (method === 'drop') {
            return false;
          } else if (method === 'mean') {
            row[col.name] = meanVal;
          } else if (method === 'mode') {
            row[col.name] = modeVal;
          } else if (method === 'custom' && customVal) {
            row[col.name] = col.type === 'Number' ? Number(customVal) : customVal;
          }
        }
        return true;
      });
    });

    // 3. Columns mapping (renames and drops)
    cleaned = cleaned.map((row) => {
      const newRow: any = {};
      columns.forEach((col) => {
        if (!deletedColumns[col.name]) {
          const renamedKey = columnRenames[col.name] || col.name;
          const originalVal = row[col.name];
          
          // Type casting
          const castTo = typeCasts[col.name];
          let finalVal = originalVal;
          if (originalVal !== null && originalVal !== undefined) {
            if (castTo === 'Number') finalVal = Number(originalVal);
            else if (castTo === 'Boolean') finalVal = Boolean(originalVal);
            else if (castTo === 'Text') finalVal = String(originalVal);
            else if (castTo === 'Date') {
              const d = new Date(originalVal);
              finalVal = isNaN(d.getTime()) ? originalVal : d.toISOString();
            }
          }
          newRow[renamedKey] = finalVal;
        }
      });
      return newRow;
    });

    // 4. Date extract parts
    if (dateField && extractDateParts) {
      cleaned = cleaned.map((row) => {
        const originalKey = columnRenames[dateField] || dateField;
        const dateVal = row[originalKey];
        if (dateVal) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            row[`${originalKey}_Year`] = d.getFullYear();
            row[`${originalKey}_Month`] = d.getMonth() + 1;
            row[`${originalKey}_Day`] = d.getDate();
          }
        }
        return row;
      });
    }

    const afterCount = cleaned.length;
    setCleaningStats({
      rowsBefore: beforeCount,
      rowsAfter: afterCount,
      deleted: beforeCount - afterCount,
    });

    setParsedData(cleaned);
    
    // Update schemas
    const updatedMeta: ColumnMeta[] = [];
    columns.forEach((col) => {
      if (!deletedColumns[col.name]) {
        const renamedKey = columnRenames[col.name] || col.name;
        updatedMeta.push({
          name: renamedKey,
          type: typeCasts[col.name]
        });
      }
    });

    if (dateField && extractDateParts) {
      const originalKey = columnRenames[dateField] || dateField;
      updatedMeta.push({ name: `${originalKey}_Year`, type: 'Number' });
      updatedMeta.push({ name: `${originalKey}_Month`, type: 'Number' });
      updatedMeta.push({ name: `${originalKey}_Day`, type: 'Number' });
    }

    setColumns(updatedMeta);
    setWizardStep(5); // Show clean stats step
  };

  // Create tables rows / statistics and upload to Supabase Storage
  const handleSaveAndAnalyze = async () => {
    if (!user || parsedData.length === 0) return;
    setSaving(true);
    
    let fileInserted = false;
    let fileId = '';

    try {
      // 1. Calculate summary statistics (to store in analyses table)
      const summaryStats: Record<string, any> = {};
      columns.forEach((col) => {
        if (col.type === 'Number') {
          const vals = parsedData.map(r => Number(r[col.name])).filter(v => !isNaN(v));
          if (vals.length > 0) {
            const sorted = [...vals].sort((a, b) => a - b);
            const sum = vals.reduce((a, b) => a + b, 0);
            const mean = sum / vals.length;
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const median = sorted[Math.floor(sorted.length / 2)];
            
            // Standard deviation
            const sqDiffs = vals.map(v => Math.pow(v - mean, 2));
            const stdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / vals.length);
            
            summaryStats[col.name] = {
              mean: Math.round(mean * 100) / 100,
              median: Math.round(median * 100) / 100,
              min,
              max,
              stdDev: Math.round(stdDev * 100) / 100,
              nullCount: parsedData.length - vals.length
            };
          }
        } else {
          // Categorical counts
          const counts: Record<string, number> = {};
          let nullCount = 0;
          parsedData.forEach(r => {
            const val = r[col.name];
            if (val === null || val === undefined || val === '') {
              nullCount++;
            } else {
              counts[String(val)] = (counts[String(val)] || 0) + 1;
            }
          });
          
          summaryStats[col.name] = {
            nullCount,
            uniqueCount: Object.keys(counts).length,
            topCategories: Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count]) => ({ name, count }))
          };
        }
      });

      fileId = crypto.randomUUID();
      const storagePath = `${user.id}/${fileId}/data.json`;
      const jsonContent = JSON.stringify(parsedData);

      // 2. Upload parsed cleaned data to our secure API route first
      // We upload the data array as a JSON string to enforce server-side plan limits
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storagePath,
          fileContent: jsonContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload dataset.');
      }

      // 3. Insert record in `files` table after successful upload
      const { error: fileError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          user_id: user.id,
          file_name: file?.name || 'parsed_dataset.json',
          file_type: file?.name.split('.').pop() || 'json',
          file_size: file?.size || jsonContent.length,
          storage_path: storagePath,
          row_count: parsedData.length,
          column_count: columns.length
        });

      if (fileError) throw fileError;
      fileInserted = true;

      // 4. Create record in `analyses` table
      const cleaningOptions = {
        removeDuplicates,
        removeEmptyRows,
        trimWhitespace,
        caseStandard,
        dateField
      };

      const { error: analysisError } = await supabase
        .from('analyses')
        .insert({
          file_id: fileId,
          user_id: user.id,
          cleaning_options: cleaningOptions,
          column_metadata: columns,
          summary_stats: summaryStats,
          chart_config: {}
        });

      if (analysisError) throw analysisError;

      // Redirect to specific analyzed file page
      router.push(`/dashboard/${fileId}`);
      router.refresh();
      
    } catch (err: any) {
      if (fileInserted) {
        await supabase.from('files').delete().eq('id', fileId);
      }
      setErrorMsg(err.message || 'Failed to save analysis properties.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12 w-full space-y-8 md:space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-border gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
            Upload Dataset <span className="text-[10px] uppercase font-mono tracking-widest text-text-muted font-normal">SaaS Suite</span>
          </h1>
          <p className="text-xs md:text-sm text-text-muted font-light mt-1">
            Feed any CSV, Excel, or JSON sheet to correct fields, clean duplicate structures, and preview schema trees.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <ThemeToggle className="hidden md:flex" />
          
          {plan === 'free' && (
            <div className="flex items-center gap-3 bg-gold/5 border border-gold/15 px-4 py-2.5 rounded-xl text-xs text-gold-light w-full md:w-auto">
              <Info className="w-4.5 h-4.5 shrink-0" />
              <span>Plan limit: <strong className="font-bold text-text-primary">5MB</strong>. Upgrade to unlock <strong className="font-bold text-text-primary">50MB</strong>.</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-error hover:text-text-primary"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Upload Drop Zone */}
      {parsedData.length === 0 && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 md:p-16 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-6 ${
            dragActive 
              ? 'border-gold bg-gold/5 shadow-2xl shadow-gold/5' 
              : 'border-border bg-card hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.02]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls, .json"
            className="hidden"
          />
          
          <div className="w-16 h-16 rounded-2xl bg-card2 border border-border flex items-center justify-center text-gold shadow-md">
            {parsing ? <RefreshCw className="w-7 h-7 animate-spin text-gold-light" /> : <Upload className="w-7 h-7" />}
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-base md:text-lg font-bold">
              {parsing ? 'Parsing Spreadsheet...' : 'Select or drag your file'}
            </h3>
            <p className="text-[11px] md:text-xs text-text-muted font-light max-w-sm">
              Supports CSV, Microsoft Excel (XLS, XLSX), or JSON arrays. No data leaves your computer during parsing.
            </p>
          </div>
        </div>
      )}

      {/* Parsed Preview Table & Action Controls */}
      {parsedData.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-5 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm truncate max-w-xs">{file?.name || 'Imported Sheet'}</h4>
                <p className="text-xs text-text-muted font-light mt-1">
                  Rows: <strong className="text-text-primary">{parsedData.length}</strong> &bull; Columns: <strong className="text-text-primary">{columns.length}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={resetUpload}
                className="w-full sm:w-auto px-5 py-3 border border-border bg-card2 text-xs font-bold uppercase tracking-wider rounded-xl text-red-400 hover:bg-red-500/5 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Reset
              </button>
              <button 
                onClick={() => setShowWizard(true)}
                className="w-full sm:w-auto btn-gold px-6 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
              >
                <Sparkles className="w-4 h-4" /> Open Cleaning Wizard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Schema Metadata tree */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
            <h3 className="font-heading text-base md:text-lg font-bold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-gold-light" /> Inferred Schema Columns
            </h3>
            
            <div className="flex flex-wrap gap-3">
              {columns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card2 border border-border text-xs">
                  <span className="font-bold text-text-primary">{col.name}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    col.type === 'Number' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    col.type === 'Date' ? 'bg-purple/10 text-purple border border-purple/20' :
                    col.type === 'Boolean' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-card text-text-muted border border-border'
                  }`}>
                    {col.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* preview Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border">
              <h3 className="font-heading text-base md:text-lg font-bold">Data Preview (First 20 Rows)</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-card2 border-b border-border">
                    {columns.map((col, idx) => (
                      <th 
                        key={idx} 
                        className={`p-4 text-xs font-semibold uppercase tracking-wider text-text-muted font-mono whitespace-nowrap ${
                          idx === 0 ? 'sticky left-0 bg-card2 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]' : ''
                        }`}
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 20).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-border/30 hover:bg-card2/10 transition">
                      {columns.map((col, cIdx) => (
                        <td 
                          key={cIdx} 
                          className={`p-4 text-xs text-text-primary truncate max-w-[200px] ${
                            cIdx === 0 ? 'sticky left-0 bg-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]' : ''
                          }`}
                        >
                          {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : <span className="text-text-muted italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cleaning Wizard Slide-over Modal */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!saving) setShowWizard(false); }}
              className="absolute inset-0 bg-black"
            />

            {/* Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col justify-between shadow-2xl z-10"
            >
              
              {/* Wizard Header */}
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-light" />
                  <h3 className="font-heading text-xl font-bold">Data Cleaning Wizard</h3>
                </div>
                <button 
                  onClick={() => setShowWizard(false)}
                  disabled={saving}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-card2 transition disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Steps indicators */}
              <div className="px-6 py-4 bg-card2/50 border-b border-border flex items-center justify-between text-xs font-semibold text-text-muted overflow-x-auto whitespace-nowrap">
                {["Basic", "Missing Values", "Columns", "Dates", "Verify"].map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      wizardStep === i + 1 
                        ? 'bg-gold text-background font-bold' 
                        : wizardStep > i + 1 
                          ? 'bg-gold/10 text-gold-light border border-gold/30' 
                          : 'bg-card2 text-text-muted border border-border'
                    }`}>
                      {wizardStep > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span className={wizardStep === i + 1 ? 'text-text-primary' : ''}>{n}</span>
                    {i < 4 && <ChevronRight className="w-3.5 h-3.5 text-border" />}
                  </div>
                ))}
              </div>

              {/* Wizard Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* STEP 1: Basic Operations */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-heading text-lg font-bold">Basic Correction Parameters</h4>
                      <p className="text-xs text-text-muted font-light">Select standard clean operations to run across the entire sheet layout.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card2/50 cursor-pointer hover:border-gold/30 transition">
                        <input
                          type="checkbox"
                          checked={removeDuplicates}
                          onChange={(e) => setRemoveDuplicates(e.target.checked)}
                          className="w-4 h-4 rounded text-gold bg-card border-border focus:ring-gold"
                        />
                        <div>
                          <div className="text-sm font-semibold">Remove Duplicate Rows</div>
                          <div className="text-[10px] text-text-muted mt-0.5">Identifies identical cell chains and retains only the first instance.</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card2/50 cursor-pointer hover:border-gold/30 transition">
                        <input
                          type="checkbox"
                          checked={removeEmptyRows}
                          onChange={(e) => setRemoveEmptyRows(e.target.checked)}
                          className="w-4 h-4 rounded text-gold bg-card border-border focus:ring-gold"
                        />
                        <div>
                          <div className="text-sm font-semibold">Remove Completely Empty Rows</div>
                          <div className="text-[10px] text-text-muted mt-0.5">Drops rows containing nothing but nulls, tabs, or whitespaces.</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card2/50 cursor-pointer hover:border-gold/30 transition">
                        <input
                          type="checkbox"
                          checked={trimWhitespace}
                          onChange={(e) => setTrimWhitespace(e.target.checked)}
                          className="w-4 h-4 rounded text-gold bg-card border-border focus:ring-gold"
                        />
                        <div>
                          <div className="text-sm font-semibold">Trim Trailing Whitespaces</div>
                          <div className="text-[10px] text-text-muted mt-0.5">Removes double spaces, starting tabs, or trailing breaks from strings.</div>
                        </div>
                      </label>

                      <div className="space-y-2 p-4 rounded-xl border border-border bg-card2/50">
                        <div className="text-sm font-semibold">Standardise Text Case</div>
                        <div className="text-[10px] text-text-muted mb-2">Re-formats all string values into a consistent capitalization.</div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {['none', 'upper', 'lower', 'title'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCaseStandard(c as any)}
                              className={`py-2 text-[10px] uppercase font-bold tracking-wider rounded border transition ${
                                caseStandard === c 
                                  ? 'border-gold text-gold bg-gold/5' 
                                  : 'border-border text-text-muted hover:text-text-primary hover:border-border/80'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Missing Values */}
                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-heading text-lg font-bold">Interpolation of Missing Values</h4>
                      <p className="text-xs text-text-muted font-light">Determine actions when a cell is blank or null. Configure per column:</p>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {columns.map((col) => (
                        <div key={col.name} className="p-4 rounded-xl border border-border bg-card2/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate">{col.name}</span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-card text-text-muted border border-border rounded">
                              {col.type}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {(col.type === 'Number' ? ['drop', 'mean', 'mode', 'custom'] : ['drop', 'mode', 'custom']).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMissingMethods(prev => ({ ...prev, [col.name]: m as any }))}
                                className={`py-1.5 text-[9px] uppercase font-bold tracking-wider rounded border transition ${
                                  missingMethods[col.name] === m 
                                    ? 'border-gold text-gold bg-gold/5' 
                                    : 'border-border text-text-muted hover:text-text-primary'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>

                          {missingMethods[col.name] === 'custom' && (
                            <input
                              type="text"
                              placeholder="Insert replacement value"
                              value={customFills[col.name] || ''}
                              onChange={(e) => setCustomFills(prev => ({ ...prev, [col.name]: e.target.value }))}
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs focus:outline-none focus:border-gold/50 text-text-primary"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: Column Management */}
                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-heading text-lg font-bold">Column Fields & Cast Mappings</h4>
                      <p className="text-xs text-text-muted font-light">Rename keys, delete columns, or cast types to standard formats.</p>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {columns.map((col) => (
                        <div 
                          key={col.name} 
                          className={`p-4 rounded-xl border transition-opacity ${
                            deletedColumns[col.name] ? 'opacity-40 border-red-500/20 bg-red-500/[0.02]' : 'border-border bg-card2/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={deletedColumns[col.name] || false}
                                onChange={(e) => setDeletedColumns(prev => ({ ...prev, [col.name]: e.target.checked }))}
                                className="w-3.5 h-3.5 rounded text-red-500 bg-card border-border focus:ring-red-500"
                              />
                              <span className={deletedColumns[col.name] ? 'text-red-400 line-through' : ''}>Delete Column</span>
                            </label>
                            
                            <span className="text-[10px] text-text-muted">Original: <strong className="text-text-primary font-mono">{col.name}</strong></span>
                          </div>

                          {!deletedColumns[col.name] && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] text-text-muted uppercase tracking-wider">Rename Column Key</label>
                                <input
                                  type="text"
                                  value={columnRenames[col.name] || ''}
                                  onChange={(e) => setColumnRenames(prev => ({ ...prev, [col.name]: e.target.value }))}
                                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs focus:outline-none focus:border-gold/50 text-text-primary"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] text-text-muted uppercase tracking-wider">Casting Data Type</label>
                                <select
                                  value={typeCasts[col.name] || col.type}
                                  onChange={(e) => setTypeCasts(prev => ({ ...prev, [col.name]: e.target.value as any }))}
                                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs focus:outline-none focus:border-gold/50 text-text-primary"
                                >
                                  <option value="Text">Text</option>
                                  <option value="Number">Number</option>
                                  <option value="Date">Date</option>
                                  <option value="Boolean">Boolean</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: Date Formatting */}
                {wizardStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-heading text-lg font-bold">Standardise Date Metrics</h4>
                      <p className="text-xs text-text-muted font-light">Auto-detect values, map into standard ISO strings, or parse subfields.</p>
                    </div>

                    <div className="space-y-4 p-4 rounded-xl border border-border bg-card2/30">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Select Main Date Column</label>
                        <select
                          value={dateField}
                          onChange={(e) => setDateField(e.target.value)}
                          className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-xs focus:outline-none focus:border-gold/50 text-text-primary"
                        >
                          <option value="">-- No Date Selected --</option>
                          {columns.filter(c => !deletedColumns[c.name]).map((col) => (
                            <option key={col.name} value={col.name}>{col.name}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-text-muted">We will auto-format strings inside this field into ISO dates (e.g. 2026-06-14T00:00:00Z).</p>
                      </div>

                      {dateField && (
                        <label className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/50 cursor-pointer hover:border-gold/30 transition">
                          <input
                            type="checkbox"
                            checked={extractDateParts}
                            onChange={(e) => setExtractDateParts(e.target.checked)}
                            className="w-4 h-4 rounded text-gold bg-card border-border focus:ring-gold mt-0.5"
                          />
                          <div>
                            <div className="text-sm font-semibold">Extract Sub-Date Fields</div>
                            <div className="text-[10px] text-text-muted mt-0.5">Creates new columns for Year, Month, and Day (e.g. [ColumnName]_Year, etc.) which is excellent for charts groupings.</div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 5: Clean Results Verify */}
                {wizardStep === 5 && cleaningStats && (
                  <div className="space-y-6 text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto text-success">
                      <Check className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-heading text-2xl font-bold">Data Cleaned Successfully!</h4>
                      <p className="text-xs text-text-muted font-light">All operations have run client-side. Compare the metrics below:</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-left pt-6">
                      <div className="p-4 rounded-xl bg-card2 border border-border">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Rows Before</div>
                        <div className="text-xl font-bold">{cleaningStats.rowsBefore}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-card2 border border-border">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Rows Cleansed</div>
                        <div className="text-xl font-bold text-gold">{cleaningStats.rowsAfter}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-card2 border border-red-500/10 bg-red-500/[0.01]">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Dropped Rows</div>
                        <div className="text-xl font-bold text-red-400">{cleaningStats.deleted}</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Wizard Footer */}
              <div className="p-6 border-t border-border bg-card2/20 flex justify-between items-center">
                
                {wizardStep < 5 ? (
                  <>
                    <button
                      type="button"
                      disabled={wizardStep === 1 || saving}
                      onClick={() => setWizardStep(wizardStep - 1)}
                      className="px-4 py-2.5 text-xs font-semibold tracking-wider uppercase border border-border rounded-xl hover:bg-card2 transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed text-text-primary"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {wizardStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => setWizardStep(wizardStep + 1)}
                        className="btn-gold px-5 py-2.5 text-xs tracking-wider uppercase font-bold flex items-center gap-1.5"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={runDataCleaning}
                        className="btn-gold px-6 py-2.5 text-xs tracking-wider uppercase font-bold flex items-center gap-2 shadow-lg shadow-gold/15"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" /> Clean My Data
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2.5 text-xs font-semibold tracking-wider uppercase border border-border rounded-xl hover:bg-card2 transition flex items-center gap-1.5 disabled:opacity-30 text-text-primary"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-configure
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveAndAnalyze}
                      className="btn-gold px-6 py-2.5 text-xs tracking-wider uppercase font-bold flex items-center gap-2 shadow-lg shadow-gold/15"
                    >
                      {saving ? 'Uploading Analysis...' : (
                        <>
                          Save & Analyze Dashboard <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </>
                )}

              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30 text-success shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check className="w-5 h-5 shrink-0" />
          <div className="font-semibold text-sm">{successToast}</div>
          <button 
            onClick={() => setSuccessToast(null)} 
            className="ml-4 p-1 hover:bg-success/5 rounded transition text-success/70 hover:text-success"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
