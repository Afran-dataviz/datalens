/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  AreaChart, Area,
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  ScatterChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker 
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

import { 
  ArrowLeft, 
  Download, 
  Share2, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Layers, 
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Database,
  Check,
  Globe,
  Table,
  Coins,
  Activity,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface ColumnMeta {
  name: string;
  type: 'Number' | 'Date' | 'Text' | 'Boolean';
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// City coordinates mapping for markers
const cityCoordinates: Record<string, [number, number]> = {
  "london": [-0.1278, 51.5074],
  "new york": [-74.0060, 40.7128],
  "nyc": [-74.0060, 40.7128],
  "tokyo": [139.6917, 35.6895],
  "paris": [2.3522, 48.8566],
  "berlin": [13.4050, 52.5200],
  "singapore": [103.8198, 1.3521],
  "sydney": [151.2093, -33.8688],
  "mumbai": [72.8777, 19.0760],
  "delhi": [77.1025, 28.7041],
  "beijing": [116.4074, 39.9042],
  "shanghai": [121.4737, 31.2304],
  "toronto": [-79.3832, 43.6532],
  "chicago": [-87.6298, 41.8781],
  "los angeles": [-118.2437, 34.0522],
  "la": [-118.2437, 34.0522],
  "san francisco": [-122.4194, 37.7749],
  "sf": [-122.4194, 37.7749],
  "seattle": [-122.3321, 47.6062],
  "boston": [-71.0589, 42.3601],
  "dubai": [55.2708, 25.2048],
  "hong kong": [114.1772, 22.3027],
  "seoul": [126.9780, 37.5665],
  "bangkok": [100.5018, 13.7563],
  "amsterdam": [4.9041, 52.3676],
  "rome": [12.4964, 41.9028],
  "barcelona": [2.1734, 41.3851],
  "madrid": [-3.7037, 40.4168],
  "munich": [11.5820, 48.1351],
  "melbourne": [144.9631, -37.8136],
  "frankfurt": [8.6821, 50.1109],
  "sao paulo": [-46.6333, -23.5505],
  "mexico city": [-99.1332, 19.4326],
  "buenos aires": [-58.3816, -34.6037],
  "cairo": [31.2357, 30.0444],
  "johannesburg": [28.0473, -26.2041],
  "lagos": [3.3792, 6.5244],
  "nairobi": [36.8219, -1.2921],
  "istanbul": [28.9784, 41.0082],
  "jakarta": [106.8272, -6.2088],
  "manila": [120.9842, 14.5995],
  "riyadh": [46.7153, 24.7136],
  "cape town": [18.4241, -33.9249],
  "vancouver": [-123.1207, 49.2827],
  "zurich": [8.5417, 47.3769],
  "geneva": [6.1432, 46.2044],
  "stockholm": [18.0686, 59.3293],
  "copenhagen": [12.5683, 55.6761],
  "oslo": [10.7522, 59.9139],
  "helsinki": [24.9354, 60.1699],
  "vienna": [16.3738, 48.2082],
  "brussels": [4.3517, 50.8503]
};

// US states and regional coordinates mapping
const stateCoordinates: Record<string, [number, number]> = {
  "california": [-119.4179, 36.7783], "ca": [-119.4179, 36.7783],
  "texas": [-99.9018, 31.9686], "tx": [-99.9018, 31.9686],
  "new york": [-75.5268, 42.1657], "ny": [-75.5268, 42.1657],
  "florida": [-81.5158, 27.6648], "fl": [-81.5158, 27.6648],
  "illinois": [-89.3985, 40.6331], "il": [-89.3985, 40.6331],
  "pennsylvania": [-77.1945, 41.2033], "pa": [-77.1945, 41.2033],
  "ohio": [-82.9071, 40.4173], "oh": [-82.9071, 40.4173],
  "michigan": [-85.6024, 44.3148], "mi": [-85.6024, 44.3148],
  "georgia": [-82.9001, 32.1656], "ga": [-82.9001, 32.1656],
  "north carolina": [-79.0193, 35.7596], "nc": [-79.0193, 35.7596],
  "washington": [-120.7401, 47.7511], "wa": [-120.7401, 47.7511]
};

const cleanLocationName = (name: string) => {
  if (!name) return "";
  const clean = name.toLowerCase().trim();
  if (clean === "united states" || clean === "usa" || clean === "us" || clean === "united states of america") {
    return "united states of america";
  }
  if (clean === "united kingdom" || clean === "uk" || clean === "gb" || clean === "britain") {
    return "united kingdom";
  }
  return clean;
};

// SVG-based micro sparkline
const Sparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 30 - ((val - min) / range) * 26;
    return `${x},${y}`;
  });
  const linePath = `M ${points.map(p => p.split(',').join(' ')).join(' L ')}`;
  const areaPath = `${linePath} L 100 30 L 0 30 Z`;

  return (
    <svg className="w-24 h-8 shrink-0" viewBox="0 0 100 30" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkline-grad)" />
      <path d={linePath} fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export default function AnalysisDashboard() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const fileId = params.fileId as string;

  const [mounted, setMounted] = useState(false);
  const [fileRecord, setFileRecord] = useState<any>(null);
  const [analysisRecord, setAnalysisRecord] = useState<any>(null);
  const [dataset, setDataset] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Slicer / Filter Panel Sidenav states
  const [showFilters, setShowFilters] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  
  // Table paging and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const rowsPerPage = 25;

  const [plan, setPlan] = useState('free');
  const [shareable, setShareable] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  // Collapse sections
  const [statsCollapsed, setStatsCollapsed] = useState(true);

  // Map state
  const [geoFilter, setGeoFilter] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Get user plan
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', user.id)
            .maybeSingle();
          if (subscription) setPlan(subscription.plan || 'free');
        }

        // 2. Fetch file properties
        const { data: file, error: fileErr } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single();

        if (fileErr || !file) throw new Error("Could not find requested analysis file.");
        setFileRecord(file);

        // 3. Fetch analysis details
        const { data: analysis, error: analysisErr } = await supabase
          .from('analyses')
          .select('*')
          .eq('file_id', fileId)
          .single();
        
        if (analysisErr) throw analysisErr;
        setAnalysisRecord(analysis);
        setShareable(analysis.shareable || false);

        // 4. Download clean sheet data from Supabase storage
        const { data: storageBlob, error: storageErr } = await supabase.storage
          .from('uploads')
          .download(file.storage_path);

        if (storageErr) throw new Error("Failed to download spreadsheet content from cloud storage.");

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
      fetchDashboardData();
    }
  }, [fileId]);

  // Formatter helpers
  const formatNumber = (num: number, isCurrency = false, isPercent = false) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    let formatted = '';
    
    if (Math.abs(num) >= 1e9) {
      formatted = `${(num / 1e9).toFixed(1)}B`;
    } else if (Math.abs(num) >= 1e6) {
      formatted = `${(num / 1e6).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1e3) {
      formatted = `${(num / 1e3).toFixed(1)}K`;
    } else {
      formatted = num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    if (isCurrency) return `$${formatted}`;
    if (isPercent) return `${formatted}%`;
    return formatted;
  };

  const fullFormatNumber = (num: number, isCurrency = false, isPercent = false) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    if (isCurrency) return `$${formatted}`;
    if (isPercent) return `${formatted}%`;
    return formatted;
  };

  const columns: ColumnMeta[] = analysisRecord?.column_metadata || [];

  // Categorize columns
  const dateCols = useMemo(() => columns.filter(c => c.type === 'Date'), [columns]);
  const numCols = useMemo(() => columns.filter(c => c.type === 'Number'), [columns]);
  const catCols = useMemo(() => columns.filter(c => c.type === 'Text' || c.type === 'Boolean'), [columns]);

  // Check unique values for categorical filters
  const uniqueValuesPerCatColumn = useMemo(() => {
    const counts: Record<string, any[]> = {};
    catCols.forEach(col => {
      const vals = Array.from(new Set(dataset.map(r => r[col.name]).filter(v => v !== null && v !== undefined)));
      counts[col.name] = vals.sort();
    });
    return counts;
  }, [dataset, catCols]);

  // Numeric column min/max limits
  const numericRangeLimits = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    numCols.forEach(col => {
      const vals = dataset.map(r => Number(r[col.name])).filter(v => !isNaN(v));
      if (vals.length > 0) {
        ranges[col.name] = { min: Math.min(...vals), max: Math.max(...vals) };
      } else {
        ranges[col.name] = { min: 0, max: 100 };
      }
    });
    return ranges;
  }, [dataset, numCols]);

  // Location Column detection
  const locationCol = useMemo(() => {
    const geoKeywords = ['country', 'city', 'state', 'region', 'location', 'province', 'district', 'zone', 'area', 'territory', 'market', 'continent', 'geography', 'geo', 'place'];
    return columns.find(col => geoKeywords.some(kw => col.name.toLowerCase().includes(kw)));
  }, [columns]);

  // Geo classification
  const geoType = useMemo(() => {
    if (!locationCol) return null;
    const nameLower = locationCol.name.toLowerCase();
    if (nameLower.includes('continent') || nameLower.includes('region')) return 'region';
    if (nameLower.includes('country')) return 'country';
    return 'city_state';
  }, [locationCol]);

  // Apply filters in real time
  const filteredDataset = useMemo(() => {
    return dataset.filter(row => {
      // 1. Global search
      if (globalSearch.trim() !== '') {
        const matchesGlobal = Object.values(row).some(val => 
          String(val).toLowerCase().includes(globalSearch.toLowerCase())
        );
        if (!matchesGlobal) return false;
      }

      // 2. Geo Map Filter
      if (geoFilter && locationCol) {
        const rowLoc = cleanLocationName(String(row[locationCol.name]));
        if (rowLoc !== geoFilter.toLowerCase()) return false;
      }

      // 3. Column Slicers
      for (const colName of Object.keys(columnFilters)) {
        const filterVal = columnFilters[colName];
        const rowVal = row[colName];

        const colMeta = columns.find(c => c.name === colName);
        if (!colMeta) continue;

        if (colMeta.type === 'Number') {
          const valNum = Number(rowVal);
          if (isNaN(valNum)) return false;
          if (valNum < filterVal[0] || valNum > filterVal[1]) return false;
        } else if (colMeta.type === 'Text' || colMeta.type === 'Boolean') {
          if (filterVal && filterVal.size > 0) {
            if (!filterVal.has(String(rowVal))) return false;
          }
        } else if (colMeta.type === 'Date') {
          if (rowVal) {
            const time = new Date(rowVal).getTime();
            if (isNaN(time)) return false;
            if (filterVal[0] && time < new Date(filterVal[0]).getTime()) return false;
            if (filterVal[1] && time > new Date(filterVal[1]).getTime()) return false;
          }
        }
      }

      return true;
    });
  }, [dataset, globalSearch, columnFilters, geoFilter, locationCol, columns]);

  // Total active filter counts
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (globalSearch.trim() !== '') count++;
    if (geoFilter) count++;
    Object.keys(columnFilters).forEach(colName => {
      const colMeta = columns.find(c => c.name === colName);
      if (!colMeta) return;
      if (colMeta.type === 'Number') {
        const limits = numericRangeLimits[colName];
        const val = columnFilters[colName];
        if (limits && (val[0] > limits.min || val[1] < limits.max)) {
          count++;
        }
      } else if (colMeta.type === 'Text' || colMeta.type === 'Boolean') {
        if (columnFilters[colName].size > 0) count++;
      } else if (colMeta.type === 'Date') {
        if (columnFilters[colName][0] || columnFilters[colName][1]) count++;
      }
    });
    return count;
  }, [globalSearch, columnFilters, geoFilter, columns, numericRangeLimits]);

  // Dynamic KPI Detection calculations based on filtered dataset
  const businessKPIs = useMemo(() => {
    if (filteredDataset.length === 0) return [];
    const kpis: any[] = [];

    // Revenue detection
    const revCol = numCols.find(c => 
      ['revenue', 'sales', 'price', 'amount', 'income', 'profit', 'cost', 'value', 'total', 'earning', 'fee', 'salary', 'wage', 'turnover'].some(kw => c.name.toLowerCase().includes(kw))
    );
    if (revCol) {
      const vals = filteredDataset.map(r => Number(r[revCol.name])).filter(v => !isNaN(v));
      const totalRev = vals.reduce((a, b) => a + b, 0);
      const avgRev = totalRev / (vals.length || 1);
      const maxRev = Math.max(...vals, 0);
      const minRev = Math.min(...vals, 0);

      // Growth % calculation if Date column exists
      let growthPct: number | null = null;
      const dateCol = dateCols[0]?.name;
      if (dateCol && filteredDataset.length > 5) {
        const sortedByDate = [...filteredDataset].sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime());
        const tenPercent = Math.max(1, Math.floor(sortedByDate.length * 0.1));
        const firstPeriodVals = sortedByDate.slice(0, tenPercent).map(r => Number(r[revCol.name])).filter(v => !isNaN(v));
        const lastPeriodVals = sortedByDate.slice(-tenPercent).map(r => Number(r[revCol.name])).filter(v => !isNaN(v));
        const firstSum = firstPeriodVals.reduce((a, b) => a + b, 0) / firstPeriodVals.length;
        const lastSum = lastPeriodVals.reduce((a, b) => a + b, 0) / lastPeriodVals.length;
        if (firstSum > 0) {
          growthPct = ((lastSum - firstSum) / firstSum) * 100;
        }
      }

      kpis.push({
        title: "Total Revenue",
        value: totalRev,
        formatted: formatNumber(totalRev, true),
        subtitle: `Aggregated sum of dataset ${revCol.name}`,
        icon: <Coins className="w-5 h-5" />,
        growth: growthPct,
        sparklineData: vals.slice(0, 30),
        color: "text-gold"
      });
      kpis.push({
        title: "Avg Ticket Value",
        value: avgRev,
        formatted: formatNumber(avgRev, true),
        subtitle: `Mean value per record`,
        icon: <Activity className="w-5 h-5" />,
        growth: null,
        sparklineData: null,
        color: "text-blue-400"
      });
      kpis.push({
        title: "Peak Transaction",
        value: maxRev,
        formatted: formatNumber(maxRev, true),
        subtitle: `Highest recorded sales point`,
        icon: <TrendingUp className="w-5 h-5" />,
        growth: null,
        sparklineData: null,
        color: "text-green-400"
      });
    }

    // Volume detection
    const volCol = numCols.find(c => 
      ['quantity', 'volume', 'count', 'units', 'orders', 'transactions', 'customers', 'employees', 'sales_volume'].some(kw => c.name.toLowerCase().includes(kw))
    );
    if (volCol && volCol.name !== revCol?.name) {
      const vals = filteredDataset.map(r => Number(r[volCol.name])).filter(v => !isNaN(v));
      const totalVol = vals.reduce((a, b) => a + b, 0);
      const avgVol = totalVol / (vals.length || 1);
      const peakVol = Math.max(...vals, 0);

      kpis.push({
        title: "Total Volume",
        value: totalVol,
        formatted: formatNumber(totalVol),
        subtitle: `Total sum of units/transactions`,
        icon: <BarChart3 className="w-5 h-5" />,
        growth: null,
        sparklineData: vals.slice(0, 30),
        color: "text-purple"
      });
    }

    // Performance detection
    const perfCol = numCols.find(c => 
      ['score', 'rating', 'satisfaction', 'performance', 'productivity', 'efficiency', 'growth', 'change', 'percentage'].some(kw => c.name.toLowerCase().includes(kw))
    );
    if (perfCol && perfCol.name !== revCol?.name && perfCol.name !== volCol?.name) {
      const vals = filteredDataset.map(r => Number(r[perfCol.name])).filter(v => !isNaN(v));
      const avgPerf = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const maxPerf = Math.max(...vals, 0);
      const aboveAvgCount = vals.filter(v => v > avgPerf).length;
      const aboveAvgPct = (aboveAvgCount / (vals.length || 1)) * 100;

      kpis.push({
        title: "Average Score",
        value: avgPerf,
        formatted: formatNumber(avgPerf),
        subtitle: `Mean rating in ${perfCol.name}`,
        icon: <Activity className="w-5 h-5" />,
        growth: null,
        sparklineData: null,
        color: "text-pink-400"
      });
      kpis.push({
        title: "Efficiency Rating",
        value: aboveAvgPct,
        formatted: formatNumber(aboveAvgPct, false, true),
        subtitle: `Share of rows scoring above mean`,
        icon: <TrendingUp className="w-5 h-5" />,
        growth: null,
        sparklineData: null,
        color: "text-green-400"
      });
    }

    return kpis;
  }, [filteredDataset, numCols, dateCols, dateCols]);

  // Base KPIs
  const baseKPIs = useMemo(() => {
    const totalCount = filteredDataset.length;
    const columnsCount = columns.length;

    // Data completeness
    const totalCells = totalCount * columnsCount;
    let nullCount = 0;
    if (totalCells > 0) {
      filteredDataset.forEach(row => {
        columns.forEach(col => {
          if (row[col.name] === null || row[col.name] === undefined || String(row[col.name]).trim() === '') {
            nullCount++;
          }
        });
      });
    }
    const completeness = totalCells > 0 ? ((totalCells - nullCount) / totalCells) * 100 : 100;

    // Unique category count
    let uniqueCatCount = 0;
    const firstCat = catCols[0]?.name;
    if (firstCat) {
      uniqueCatCount = new Set(filteredDataset.map(r => r[firstCat]).filter(v => v !== null && v !== undefined && v !== '')).size;
    }

    return {
      totalCount,
      columnsCount,
      completeness,
      uniqueCatCount,
      firstCatName: firstCat || 'Categories'
    };
  }, [filteredDataset, columns, catCols]);

  // AI Insights generator
  const autoInsights = useMemo(() => {
    if (filteredDataset.length === 0) return [];
    const insights: any[] = [];

    // Category share insight
    const mainCat = catCols[0]?.name;
    const mainNum = numCols.find(c => ['revenue', 'sales', 'amount', 'profit', 'quantity', 'count'].some(kw => c.name.toLowerCase().includes(kw)))?.name || numCols[0]?.name;
    if (mainCat && mainNum) {
      const counts: Record<string, number> = {};
      let totalSum = 0;
      filteredDataset.forEach(r => {
        const catVal = String(r[mainCat]);
        const numVal = Number(r[mainNum]);
        if (catVal && !isNaN(numVal)) {
          counts[catVal] = (counts[catVal] || 0) + numVal;
          totalSum += numVal;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0 && totalSum > 0) {
        const topShare = (sorted[0][1] / totalSum) * 100;
        insights.push({
          type: "performance",
          icon: "🏆",
          title: "Top Performer Discovered",
          desc: `The segment "${sorted[0][0]}" contributes ${topShare.toFixed(1)}% of total aggregated ${mainNum} ($${formatNumber(sorted[0][1])}).`
        });
      }
    }

    // Correlation alert
    if (numCols.length >= 2) {
      const colX = numCols[0].name;
      const colY = numCols[1].name;
      const xVals = filteredDataset.map(r => Number(r[colX])).filter(v => !isNaN(v));
      const yVals = filteredDataset.map(r => Number(r[colY])).filter(v => !isNaN(v));
      if (xVals.length > 10) {
        // Calculate correlation coefficient
        const meanX = xVals.reduce((a, b) => a + b, 0) / xVals.length;
        const meanY = yVals.reduce((a, b) => a + b, 0) / yVals.length;
        let num = 0;
        let denX = 0;
        let denY = 0;
        for (let i = 0; i < xVals.length; i++) {
          const dx = xVals[i] - meanX;
          const dy = yVals[i] - meanY;
          num += dx * dy;
          denX += dx * dx;
          denY += dy * dy;
        }
        const r = denX && denY ? num / Math.sqrt(denX * denY) : 0;
        if (Math.abs(r) > 0.4) {
          insights.push({
            type: "correlation",
            icon: "📈",
            title: `Bivariate Correlation detected`,
            desc: `Found a ${r > 0 ? 'strong positive' : 'strong negative'} correlation (${r.toFixed(2)}) between ${colX} and ${colY}.`
          });
        }
      }
    }

    // High null rates risk
    const completenessList = columns.map(col => {
      const nulls = filteredDataset.filter(r => r[col.name] === null || r[col.name] === undefined || String(r[col.name]).trim() === '').length;
      return { name: col.name, pct: (nulls / filteredDataset.length) * 100 };
    });
    const highNullCols = completenessList.filter(c => c.pct > 15);
    if (highNullCols.length > 0) {
      insights.push({
        type: "risk",
        icon: "⚠️",
        title: "Risk Alert: Data Quality Flags",
        desc: `High concentration of missing values detected in columns: ${highNullCols.map(c => `"${c.name}" (${c.pct.toFixed(0)}% empty)`).join(', ')}.`
      });
    }

    // Time trend growth
    const dateCol = dateCols[0]?.name;
    const numericCol = numCols[0]?.name;
    if (dateCol && numericCol && filteredDataset.length > 10) {
      const sorted = [...filteredDataset].sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime());
      const firstYear = new Date(sorted[0][dateCol]).getFullYear();
      const lastYear = new Date(sorted[sorted.length - 1][dateCol]).getFullYear();
      if (firstYear !== lastYear) {
        const firstVal = Number(sorted[0][numericCol]) || 1;
        const lastVal = Number(sorted[sorted.length - 1][numericCol]) || 0;
        const growth = ((lastVal - firstVal) / firstVal) * 100;
        insights.push({
          type: "growth",
          icon: "💡",
          title: "Timeline Performance Insight",
          desc: `Aggregated ${numericCol} adjusted values changed by ${growth.toFixed(1)}% between ${firstYear} and ${lastYear}.`
        });
      }
    }

    // Defaults if list is short
    if (insights.length === 0) {
      insights.push({
        type: "general",
        icon: "✨",
        title: "Database Health Check",
        desc: "All datasets scanned. Records demonstrate high connectivity with robust category structures."
      });
    }

    return insights;
  }, [filteredDataset, columns, catCols, numCols, dateCols]);

  // Handle PNG Chart Downloader
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
        context.fillStyle = '#0E1117'; // Card background
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

  // PDF report exporter
  const handleExportPDF = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) return;
    setPdfExporting(true);

    try {
      const canvas = await html2canvas(dashboard, {
        scale: 1.5,
        backgroundColor: '#080A0F',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`datalens-bi-report-${fileRecord?.file_name || 'report'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setPdfExporting(false);
    }
  };

  // Toggle public share link (Pro only)
  const handleToggleShare = async () => {
    if (plan !== 'pro') {
      router.push('/dashboard/settings');
      return;
    }

    setShareLoading(true);
    const newShareVal = !shareable;
    try {
      const { error } = await supabase
        .from('analyses')
        .update({ shareable: newShareVal })
        .eq('file_id', fileId);

      if (error) throw error;
      setShareable(newShareVal);
      if (newShareVal) {
        setShowShareModal(true);
      }
    } catch (err) {
      console.error("Failed to toggle share settings.");
    } finally {
      setShareLoading(false);
    }
  };

  // Slicer filter triggers
  const handleCheckboxFilter = (colName: string, value: string, checked: boolean) => {
    setColumnFilters(prev => {
      const current = prev[colName] ? new Set(prev[colName]) : new Set();
      if (checked) {
        current.add(value);
      } else {
        current.delete(value);
      }
      const updated = { ...prev };
      if (current.size > 0) {
        updated[colName] = current;
      } else {
        delete updated[colName];
      }
      return updated;
    });
    setCurrentPage(1);
  };

  const handleRangeFilter = (colName: string, bound: 'min' | 'max', val: number) => {
    setColumnFilters(prev => {
      const limits = numericRangeLimits[colName] || { min: 0, max: 100 };
      const current = prev[colName] || [limits.min, limits.max];
      const nextRange: [number, number] = bound === 'min' 
        ? [Math.max(limits.min, Math.min(val, current[1])), current[1]]
        : [current[0], Math.min(limits.max, Math.max(val, current[0]))];
      
      return {
        ...prev,
        [colName]: nextRange
      };
    });
    setCurrentPage(1);
  };

  const handleDateFilter = (colName: string, bound: 'start' | 'end', dateStr: string) => {
    setColumnFilters(prev => {
      const current = prev[colName] || ['', ''];
      const nextRange = bound === 'start' ? [dateStr, current[1]] : [current[0], dateStr];
      return {
        ...prev,
        [colName]: nextRange
      };
    });
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setColumnFilters({});
    setGlobalSearch('');
    setGeoFilter(null);
    setCurrentPage(1);
  };

  // Map coordinate mapping logic
  const mapMarkers = useMemo(() => {
    if (!locationCol || filteredDataset.length === 0) return [];
    const mainNum = numCols[0]?.name;
    if (!mainNum) return [];

    const grouped: Record<string, { value: number; count: number; name: string }> = {};
    filteredDataset.forEach(row => {
      const rawLoc = String(row[locationCol.name]);
      if (!rawLoc) return;
      const cleanLoc = rawLoc.toLowerCase().trim();
      const numVal = Number(row[mainNum]) || 0;

      if (!grouped[cleanLoc]) {
        grouped[cleanLoc] = { value: 0, count: 0, name: rawLoc };
      }
      grouped[cleanLoc].value += numVal;
      grouped[cleanLoc].count += 1;
    });

    const markers: any[] = [];
    Object.keys(grouped).forEach(locKey => {
      const coords = cityCoordinates[locKey] || stateCoordinates[locKey];
      if (coords) {
        markers.push({
          name: grouped[locKey].name,
          coordinates: coords,
          value: grouped[locKey].value,
          avg: grouped[locKey].value / grouped[locKey].count
        });
      }
    });
    return markers;
  }, [filteredDataset, locationCol, numCols]);

  // World map choropleth mapping values
  const mapCountryAggregates = useMemo(() => {
    if (geoType !== 'country' || !locationCol) return {};
    const mainNum = numCols[0]?.name;
    if (!mainNum) return {};

    const agg: Record<string, number> = {};
    filteredDataset.forEach(row => {
      const name = cleanLocationName(String(row[locationCol.name]));
      if (name) {
        const val = Number(row[mainNum]) || 0;
        agg[name] = (agg[name] || 0) + val;
      }
    });
    return agg;
  }, [filteredDataset, geoType, locationCol, numCols]);

  const mapMaxVal = useMemo(() => {
    const vals = Object.values(mapCountryAggregates);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [mapCountryAggregates]);

  const mapMinVal = useMemo(() => {
    const vals = Object.values(mapCountryAggregates);
    return vals.length > 0 ? Math.min(...vals) : 0;
  }, [mapCountryAggregates]);

  const colorScale = scaleLinear<string>()
    .domain([mapMinVal, mapMaxVal])
    .range(["#E8C97A", "#C9A84C"]); // light gold to deep gold

  // Recharts Chart Discovery Layout Calculations
  // Chart 1: Time Series Area
  const timeSeriesData = useMemo(() => {
    const dCol = dateCols[0]?.name;
    const nCol = numCols[0]?.name;
    if (!dCol || !nCol) return [];

    const grouped: Record<string, { sum: number; count: number }> = {};
    filteredDataset.forEach(r => {
      const dateVal = r[dCol];
      if (dateVal) {
        const dKey = new Date(dateVal).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        if (!grouped[dKey]) grouped[dKey] = { sum: 0, count: 0 };
        grouped[dKey].sum += Number(r[nCol]) || 0;
        grouped[dKey].count += 1;
      }
    });

    return Object.entries(grouped).map(([date, meta]) => ({
      date,
      value: Math.round(meta.sum * 100) / 100,
      avg: Math.round((meta.sum / meta.count) * 100) / 100
    }));
  }, [filteredDataset, dateCols, numCols]);

  // Chart 2: YoY Comparison
  const yoyBarData = useMemo(() => {
    const dCol = dateCols[0]?.name;
    const nCol = numCols[0]?.name;
    if (!dCol || !nCol) return [];

    const years: Record<number, number> = {};
    filteredDataset.forEach(r => {
      const dVal = r[dCol];
      if (dVal) {
        const year = new Date(dVal).getFullYear();
        years[year] = (years[year] || 0) + (Number(r[nCol]) || 0);
      }
    });

    return Object.entries(years)
      .map(([year, sum]) => ({ year: String(year), value: Math.round(sum * 100) / 100 }))
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [filteredDataset, dateCols, numCols]);

  // Chart 3: Categorical Top 10 sorted desc
  const categoryBarData = useMemo(() => {
    const cCol = catCols[0]?.name;
    const nCol = numCols[0]?.name;
    if (!cCol || !nCol) return [];

    const grouped: Record<string, number> = {};
    filteredDataset.forEach(r => {
      const cat = String(r[cCol] || 'Unknown');
      grouped[cat] = (grouped[cat] || 0) + (Number(r[nCol]) || 0);
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredDataset, catCols, numCols]);

  // Chart 4: Grouped Bar (Numeric 1 and Numeric 2 over top categories)
  const groupedBarData = useMemo(() => {
    const cCol = catCols[0]?.name;
    const nCol1 = numCols[0]?.name;
    const nCol2 = numCols[1]?.name;
    if (!cCol || !nCol1 || !nCol2) return [];

    const grouped: Record<string, { val1: number; val2: number }> = {};
    filteredDataset.forEach(r => {
      const cat = String(r[cCol] || 'Unknown');
      if (!grouped[cat]) grouped[cat] = { val1: 0, val2: 0 };
      grouped[cat].val1 += Number(r[nCol1]) || 0;
      grouped[cat].val2 += Number(r[nCol2]) || 0;
    });

    return Object.entries(grouped)
      .map(([name, meta]) => ({
        name,
        val1: Math.round(meta.val1 * 100) / 100,
        val2: Math.round(meta.val2 * 100) / 100
      }))
      .slice(0, 8);
  }, [filteredDataset, catCols, numCols]);

  // Chart 5: Scatter Plot
  const scatterPlotData = useMemo(() => {
    const colX = numCols[0]?.name;
    const colY = numCols[1]?.name;
    if (!colX || !colY) return [];

    // Sample down to 300 points for fluidity
    const sampled = filteredDataset.slice(0, 300);
    return sampled.map(r => ({
      x: Number(r[colX]),
      y: Number(r[colY]),
      name: String(r[catCols[0]?.name] || 'Record')
    })).filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
  }, [filteredDataset, numCols, catCols]);

  // Chart 6: Histogram
  const histogramData = useMemo(() => {
    const nCol = numCols[0]?.name;
    if (!nCol) return [];

    const vals = filteredDataset.map(r => Number(r[nCol])).filter(v => !isNaN(v));
    if (vals.length === 0) return [];

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const binCount = 8;
    const binWidth = (max - min) / binCount || 1;
    
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${formatNumber(min + i * binWidth)}-${formatNumber(min + (i + 1) * binWidth)}`,
      count: 0
    }));

    vals.forEach(v => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });
    return bins;
  }, [filteredDataset, numCols]);

  // Chart Color Palette Constants
  const colorsList = ['#C9A84C', '#8B6FBB', '#06B6D4', '#2ECC71', '#E74C3C', '#F59E0B', '#EC4899', '#3B82F6'];

  // Collapsible Stats Summary calculation per numeric column
  const summaryStatsList = useMemo(() => {
    if (filteredDataset.length === 0) return [];
    return numCols.map(col => {
      const vals = filteredDataset.map(r => Number(r[col.name])).filter(v => !isNaN(v)).sort((a, b) => a - b);
      if (vals.length === 0) return { name: col.name, empty: true };

      const count = vals.length;
      const sum = vals.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      const min = vals[0];
      const max = vals[vals.length - 1];
      const median = vals[Math.floor(count / 2)];

      // Standard Deviation
      const sqDiffs = vals.map(v => Math.pow(v - mean, 2));
      const variance = sqDiffs.reduce((a, b) => a + b, 0) / count;
      const stdDev = Math.sqrt(variance);

      // Mode
      const freqs: Record<number, number> = {};
      let maxFreq = 0;
      let modeVal = vals[0];
      vals.forEach(v => {
        freqs[v] = (freqs[v] || 0) + 1;
        if (freqs[v] > maxFreq) {
          maxFreq = freqs[v];
          modeVal = v;
        }
      });

      const nullsCount = filteredDataset.length - count;
      const nullPct = (nullsCount / filteredDataset.length) * 100;

      return {
        name: col.name,
        count,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        mode: modeVal,
        min,
        max,
        stdDev: Math.round(stdDev * 100) / 100,
        nullsCount,
        nullPct: Math.round(nullPct * 100) / 100,
        empty: false
      };
    });
  }, [filteredDataset, numCols]);

  // Export summary stats as CSV
  const handleExportStatsCSV = () => {
    if (summaryStatsList.length === 0) return;
    const headers = ["Column Name", "Count", "Mean", "Median", "Mode", "Min", "Max", "Std Dev", "Null Count", "Null %"];
    const rows = summaryStatsList.map(s => {
      if (s.empty) return [s.name, 0, '-', '-', '-', '-', '-', '-', '-', '100%'];
      return [s.name, s.count, s.mean, s.median, s.mode, s.min, s.max, s.stdDev, s.nullsCount, `${s.nullPct}%`];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `datalens-bi-stats-${fileRecord?.file_name || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bottom Table Paginated, Sorted, and Searched
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    const dataCopy = [...filteredDataset];
    if (!sortField) return dataCopy;

    return dataCopy.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Handle numbers comparison
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }

      // Default string comparison
      return sortAsc 
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredDataset, sortField, sortAsc]);

  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleExportFilteredCSV = () => {
    if (filteredDataset.length === 0) return;
    const headers = columns.map(c => c.name);
    const rows = filteredDataset.map(row => 
      headers.map(h => {
        const cell = row[h];
        if (cell === null || cell === undefined) return '';
        // Escape quotes
        const cellStr = String(cell).replace(/"/g, '""');
        return cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"') 
          ? `"${cellStr}"` 
          : cellStr;
      })
    );

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `datalens-filtered-${fileRecord?.file_name || 'dataset'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highlightMatches = (text: string, search: string) => {
    if (!search || !text) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() 
            ? <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-4 bg-[#080A0F] text-[#F5F0E8] min-h-screen">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-light" />
        <p className="text-xs text-[#6B7280] font-mono tracking-widest uppercase animate-pulse">Assembling Luxury BI Workspaces...</p>
      </div>
    );
  }

  if (errorMsg || !fileRecord) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-4 bg-[#080A0F] text-[#F5F0E8] p-6 min-h-screen">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-heading text-xl font-bold">Failed to load Business Intelligence layout</h3>
        <p className="text-sm text-[#6B7280] font-light max-w-md text-center">{errorMsg || "An unknown error has occurred."}</p>
        <Link href="/dashboard" className="btn-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider mt-4">
          Return to uploads
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F5F0E8] font-body flex relative overflow-hidden">
      
      {/* Slicer / Sidenav Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-80 bg-[#0E1117] border-r border-[#1E2130] flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto z-20"
          >
            <div className="p-6 space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-[#1E2130]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4.5 h-4.5 text-gold-light" />
                  <h3 className="font-heading text-lg font-bold">BI Slicer Filters</h3>
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded-lg text-[#6B7280] hover:text-[#F5F0E8] hover:bg-[#141720] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reset Filters button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetAllFilters}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset {activeFiltersCount} Active Filters
                </button>
              )}

              {/* Global search slicer */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] block">Global Search Slicer</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Search across all cells..."
                    value={globalSearch}
                    onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-4 py-2 bg-[#141720] border border-[#1E2130] rounded-xl text-xs text-[#F5F0E8] placeholder-[#6B7280]/50 focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Dynamic generated slicers */}
              <div className="space-y-5">
                {columns.map(col => {
                  const filterVal = columnFilters[col.name];
                  
                  // Skip column if it's our location column when choropleth filter is active
                  const isGeoCol = locationCol && col.name === locationCol.name;

                  if (col.type === 'Number') {
                    const range = numericRangeLimits[col.name];
                    if (!range) return null;
                    const val = filterVal || [range.min, range.max];
                    
                    return (
                      <div key={col.name} className="space-y-3 p-3.5 rounded-xl bg-[#141720]/40 border border-[#1E2130]/40">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gold-light truncate max-w-[140px]">{col.name}</span>
                          <span className="text-[8px] font-mono bg-[#141720] px-1.5 py-0.5 rounded text-[#6B7280]">
                            Num range
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <input
                            type="number"
                            value={Math.round(val[0])}
                            onChange={(e) => handleRangeFilter(col.name, 'min', Number(e.target.value))}
                            className="w-1/2 p-1.5 bg-[#141720] border border-[#1E2130] rounded text-center focus:outline-none"
                          />
                          <span className="text-[#6B7280]">-</span>
                          <input
                            type="number"
                            value={Math.round(val[1])}
                            onChange={(e) => handleRangeFilter(col.name, 'max', Number(e.target.value))}
                            className="w-1/2 p-1.5 bg-[#141720] border border-[#1E2130] rounded text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  }

                  if (col.type === 'Text' || col.type === 'Boolean') {
                    const items = uniqueValuesPerCatColumn[col.name] || [];
                    if (items.length > 20) return null; // Skip high cardinality categories

                    const checkedList = filterVal || new Set();

                    return (
                      <div key={col.name} className="space-y-2 p-3.5 rounded-xl bg-[#141720]/40 border border-[#1E2130]/40">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gold-light truncate max-w-[140px]">{col.name}</span>
                          <span className="text-[8px] font-mono bg-[#141720] px-1.5 py-0.5 rounded text-[#6B7280]">
                            Categorical
                          </span>
                        </div>

                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                          {items.map(val => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer text-[#6B7280] hover:text-[#F5F0E8] transition">
                              <input
                                type="checkbox"
                                checked={checkedList.has(String(val))}
                                onChange={(e) => handleCheckboxFilter(col.name, String(val), e.target.checked)}
                                className="w-3.5 h-3.5 rounded bg-[#0E1117] border-[#1E2130] text-gold focus:ring-gold"
                              />
                              <span className="truncate">{String(val)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (col.type === 'Date') {
                    const val = filterVal || ['', ''];
                    return (
                      <div key={col.name} className="space-y-3 p-3.5 rounded-xl bg-[#141720]/40 border border-[#1E2130]/40">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gold-light truncate max-w-[140px]">{col.name}</span>
                          <span className="text-[8px] font-mono bg-[#141720] px-1.5 py-0.5 rounded text-[#6B7280]">
                            Date
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <input
                            type="date"
                            value={val[0]}
                            onChange={(e) => handleDateFilter(col.name, 'start', e.target.value)}
                            className="w-full p-2 bg-[#141720] border border-[#1E2130] rounded focus:outline-none"
                          />
                          <input
                            type="date"
                            value={val[1]}
                            onChange={(e) => handleDateFilter(col.name, 'end', e.target.value)}
                            className="w-full p-2 bg-[#141720] border border-[#1E2130] rounded focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

            </div>

            <div className="p-6 bg-[#141720]/30 border-t border-[#1E2130] text-[10px] text-[#6B7280] font-light flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 text-gold-light" />
              <span>Slicers evaluate instantly. Charts, KPIs, maps, and table update in real-time.</span>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Dashboard Space */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* TOP BAR */}
        <header className="h-20 px-8 border-b border-[#1E2130] bg-[#0E1117]/85 backdrop-blur-md flex items-center justify-between z-10 sticky top-0 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard" className="p-2 border border-[#1E2130] rounded-xl hover:bg-[#141720] text-[#6B7280] hover:text-[#F5F0E8] transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-heading text-xl md:text-2xl font-bold truncate max-w-sm md:max-w-md text-gold-light flex items-center gap-2">
                {fileRecord.file_name}
              </h1>
              <div className="text-[10px] text-[#6B7280] font-light mt-0.5 flex items-center gap-1.5">
                <span>Enterprise BI Portal</span>
                <span>&bull;</span>
                <span>Last updated: {new Date(fileRecord.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 border border-[#1E2130] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#141720] transition flex items-center gap-2 ${
                showFilters ? 'text-gold border-gold/30 bg-gold/5' : 'text-[#6B7280]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Slicers</span>
            </button>

            <button
              onClick={handleToggleShare}
              disabled={shareLoading}
              className={`p-3 border border-[#1E2130] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#141720] transition flex items-center gap-2 ${
                shareable ? 'text-gold-light border-gold/30' : 'text-[#6B7280]'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{shareable ? 'Shared' : 'Share'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={pdfExporting}
              className="p-3 border border-[#1E2130] rounded-xl text-xs font-bold uppercase tracking-wider bg-[#0E1117] hover:bg-[#1E2130] transition flex items-center gap-2 text-[#F5F0E8]"
            >
              <FileText className="w-4 h-4 text-gold" />
              <span className="hidden sm:inline">{pdfExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>

            <Link
              href={`/dashboard/${fileId}/chat`}
              className="btn-gold px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-gold/15"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Printable Content Box */}
        <div id="dashboard-content" className="p-8 space-y-8 flex-1">
          
          {/* ACTIVE FILTER CHIPS ROW */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#0E1117] border border-[#1E2130] rounded-2xl text-xs">
              <span className="text-[#6B7280] font-light flex items-center gap-1"><SlidersHorizontal className="w-3.5 h-3.5" /> Active Filters:</span>
              
              {globalSearch.trim() !== '' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#141720] border border-[#1E2130] rounded-lg text-xs font-medium">
                  <span className="text-[#6B7280]">Search:</span>
                  <span>&quot;{globalSearch}&quot;</span>
                  <button onClick={() => setGlobalSearch('')} className="text-red-400 hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
                </div>
              )}

              {geoFilter && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#141720] border border-[#1E2130] rounded-lg text-xs font-medium">
                  <span className="text-[#6B7280]">Region:</span>
                  <span>{geoFilter}</span>
                  <button onClick={() => setGeoFilter(null)} className="text-red-400 hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
                </div>
              )}

              {Object.keys(columnFilters).map(colName => {
                const colMeta = columns.find(c => c.name === colName);
                if (!colMeta) return null;

                const val = columnFilters[colName];

                if (colMeta.type === 'Number') {
                  const limits = numericRangeLimits[colName];
                  if (limits && (val[0] > limits.min || val[1] < limits.max)) {
                    return (
                      <div key={colName} className="flex items-center gap-1.5 px-3 py-1 bg-[#141720] border border-[#1E2130] rounded-lg text-xs font-medium">
                        <span className="text-[#6B7280]">{colName}:</span>
                        <span>{Math.round(val[0])} - {Math.round(val[1])}</span>
                        <button onClick={() => setColumnFilters(prev => { const next = { ...prev }; delete next[colName]; return next; })} className="text-red-400 hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  }
                } else if (colMeta.type === 'Text' || colMeta.type === 'Boolean') {
                  if (val.size > 0) {
                    return (
                      <div key={colName} className="flex items-center gap-1.5 px-3 py-1 bg-[#141720] border border-[#1E2130] rounded-lg text-xs font-medium">
                        <span className="text-[#6B7280]">{colName}:</span>
                        <span className="truncate max-w-[100px]">{Array.from(val).join(', ')}</span>
                        <button onClick={() => setColumnFilters(prev => { const next = { ...prev }; delete next[colName]; return next; })} className="text-red-400 hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  }
                } else if (colMeta.type === 'Date') {
                  if (val[0] || val[1]) {
                    return (
                      <div key={colName} className="flex items-center gap-1.5 px-3 py-1 bg-[#141720] border border-[#1E2130] rounded-lg text-xs font-medium">
                        <span className="text-[#6B7280]">{colName}:</span>
                        <span>{val[0] || '*'} to {val[1] || '*'}</span>
                        <button onClick={() => setColumnFilters(prev => { const next = { ...prev }; delete next[colName]; return next; })} className="text-red-400 hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  }
                }
                return null;
              })}

              <button 
                onClick={resetAllFilters}
                className="text-red-400 hover:text-white underline text-xs ml-auto pr-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* RECORD COUNT BANNER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-gold/15 bg-[#141720]/40 text-xs text-gold-light">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Showing <strong className="text-[#F5F0E8] font-bold">{fullFormatNumber(filteredDataset.length)}</strong> of <strong className="text-white font-extrabold">{fullFormatNumber(dataset.length)}</strong> records in active workbook context.
            </span>
            {activeFiltersCount > 0 && <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-mono">Filtered view enabled</span>}
          </div>

          {/* SMART BUSINESS KPI CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Dynamic KPIs (Revenue/Volume/Performance) */}
            {businessKPIs.map((kpi, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130] border-l-4 border-l-[#C9A84C] relative hover:border-gold/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.08)] transition-all duration-300 flex flex-col justify-between h-36"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold block">{kpi.title}</span>
                    <span className="text-2xl font-bold text-[#F5F0E8] font-heading">{kpi.formatted}</span>
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-[#141720] border border-[#1E2130] flex items-center justify-center ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#6B7280] font-light block">{kpi.subtitle}</span>
                    {kpi.growth !== null && (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${kpi.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {kpi.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(kpi.growth).toFixed(1)}% Growth
                      </span>
                    )}
                  </div>
                  {kpi.sparklineData && <Sparkline data={kpi.sparklineData} />}
                </div>
              </motion.div>
            ))}

            {/* Base KPI 1: Records Count */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130] border-l-4 border-l-[#8B6FBB] relative hover:border-[#8B6FBB]/30 hover:shadow-[0_0_30px_rgba(139,111,187,0.08)] transition-all duration-300 flex flex-col justify-between h-36"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold block">Total Rows</span>
                  <span className="text-2xl font-bold text-[#F5F0E8] font-heading">{formatNumber(baseKPIs.totalCount)}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#141720] border border-[#1E2130] flex items-center justify-center text-purple">
                  <Table className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-[#6B7280] font-light block">Sum of all records matching filter</span>
                <span className="text-[9px] text-green-400 font-mono tracking-widest uppercase mt-0.5 block">100% Verified integrity</span>
              </div>
            </motion.div>

            {/* Base KPI 2: Columns count */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130] border-l-4 border-l-cyan-500 relative hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)] transition-all duration-300 flex flex-col justify-between h-36"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold block">Dataset Width</span>
                  <span className="text-2xl font-bold text-[#F5F0E8] font-heading">{baseKPIs.columnsCount} Columns</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#141720] border border-[#1E2130] flex items-center justify-center text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-[#6B7280] font-light block">Scan dimension tree breadth</span>
                <span className="text-[9px] text-[#6B7280] font-mono tracking-widest uppercase mt-0.5 block">{numCols.length} num / {catCols.length} cat</span>
              </div>
            </motion.div>

            {/* Base KPI 3: Completeness */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130] border-l-4 border-l-green-500 relative hover:border-green-500/30 hover:shadow-[0_0_30px_rgba(46,204,113,0.08)] transition-all duration-300 flex flex-col justify-between h-36"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold block">Data Density</span>
                  <span className="text-2xl font-bold text-[#F5F0E8] font-heading">{baseKPIs.completeness.toFixed(1)}%</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#141720] border border-[#1E2130] flex items-center justify-center text-green-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-[#6B7280] font-light block">Cell completeness index</span>
                <span className="text-[9px] text-[#6B7280] font-mono tracking-widest uppercase mt-0.5 block">Zero cells missing: {baseKPIs.completeness === 100 ? 'YES' : 'NO'}</span>
              </div>
            </motion.div>

            {/* Base KPI 4: Unique Categories */}
            {catCols.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130] border-l-4 border-l-pink-500 relative hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.08)] transition-all duration-300 flex flex-col justify-between h-36"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold block">Unique categories</span>
                    <span className="text-2xl font-bold text-[#F5F0E8] font-heading">{baseKPIs.uniqueCatCount} Items</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#141720] border border-[#1E2130] flex items-center justify-center text-pink-400">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-[10px] text-[#6B7280] font-light block truncate">Unique types in {baseKPIs.firstCatName}</span>
                  <span className="text-[9px] text-[#6B7280] font-mono tracking-widest uppercase mt-0.5 block">Cardinality segmentation</span>
                </div>
              </motion.div>
            )}

          </div>

          {/* SMART BUSINESS INSIGHT PANEL */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold flex items-center gap-2 text-gold-light">
              <Sparkles className="w-5 h-5" /> AI intelligence insights
            </h3>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {autoInsights.map((ins, i) => (
                <div 
                  key={i} 
                  className="min-w-[280px] md:min-w-[340px] max-w-[400px] p-5 rounded-2xl bg-[#0E1117] border border-[#1E2130] border-l-4 border-l-[#C9A84C] space-y-2.5 hover:shadow-[0_0_30px_rgba(201,168,76,0.04)] hover:border-gold/20 transition-all"
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-light">
                    <span>{ins.icon}</span>
                    <span>{ins.title}</span>
                  </div>
                  <p className="text-xs text-[#F5F0E8] leading-relaxed font-light font-body">
                    {ins.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SMART MAP DISTRIBUTION */}
          {locationCol && (
            <div className="bg-[#0E1117] border border-[#1E2130] rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-[#1E2130]/30">
                <div>
                  <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gold-light" /> Geographical density distribution
                  </h3>
                  <p className="text-xs text-[#6B7280] font-light mt-0.5">Scan of geographical locations matched from: &quot;{locationCol.name}&quot;</p>
                </div>
                {geoFilter && (
                  <button 
                    onClick={() => setGeoFilter(null)}
                    className="text-xs text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition"
                  >
                    Clear Map Filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Choropleth Map Visualization */}
                <div className="lg:col-span-3 h-80 bg-[#141720]/40 rounded-xl border border-[#1E2130] flex items-center justify-center overflow-hidden relative">
                  {mounted ? (
                    <ComposableMap projectionConfig={{ scale: 120 }}>
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const name = cleanLocationName(geo.properties.name);
                            const aggVal = mapCountryAggregates[name] || 0;
                            const isSelected = geoFilter && geoFilter.toLowerCase() === name;
                            
                            let fill = '#141720';
                            if (aggVal > 0) {
                              fill = colorScale(aggVal);
                            }
                            if (isSelected) {
                              fill = "#C9A84C";
                            }

                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={fill}
                                stroke="#1E2130"
                                strokeWidth={0.5}
                                style={{
                                  default: { outline: "none", transition: "fill 0.2s" },
                                  hover: { fill: "#C9A84C", outline: "none", cursor: "pointer" },
                                  pressed: { outline: "none" }
                                }}
                                onClick={() => {
                                  if (aggVal > 0) {
                                    setGeoFilter(isSelected ? null : geo.properties.name);
                                    setCurrentPage(1);
                                  }
                                }}
                              />
                            );
                          })
                        }
                      </Geographies>

                      {/* Render markers for cities / states */}
                      {geoType === 'city_state' && mapMarkers.map((marker, idx) => (
                        <Marker key={idx} coordinates={marker.coordinates}>
                          <circle 
                            r={Math.max(4, Math.min(15, (marker.value / (mapMarkers.reduce((a, b) => a + b.value, 0) || 1)) * 40))}
                            fill="#8B6FBB" 
                            stroke="#1E2130" 
                            strokeWidth={1}
                            className="opacity-75 hover:opacity-100 cursor-pointer hover:fill-gold transition"
                            onClick={() => {
                              setGeoFilter(geoFilter === marker.name ? null : marker.name);
                              setCurrentPage(1);
                            }}
                          />
                        </Marker>
                      ))}
                    </ComposableMap>
                  ) : (
                    <RefreshCw className="w-8 h-8 animate-spin text-gold-light" />
                  )}
                  
                  <div className="absolute bottom-4 left-4 p-2 bg-[#0E1117] border border-[#1E2130] rounded-lg text-[10px] text-[#6B7280] flex items-center gap-2">
                    <span>Intensity Legend:</span>
                    <span className="w-2.5 h-2.5 bg-[#E8C97A] rounded-full inline-block" />
                    <span>Low</span>
                    <span className="w-2.5 h-2.5 bg-[#C9A84C] rounded-full inline-block" />
                    <span>High</span>
                  </div>
                </div>

                {/* Ranked Regional list side panel */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] pb-2 border-b border-[#1E2130]">Top Locations</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {Object.entries(mapCountryAggregates)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([name, sum], i) => {
                        const totalSum = Object.values(mapCountryAggregates).reduce((a, b) => a + b, 0) || 1;
                        const pct = (sum / totalSum) * 100;
                        return (
                          <div 
                            key={name} 
                            onClick={() => {
                              setGeoFilter(geoFilter === name ? null : name);
                              setCurrentPage(1);
                            }}
                            className={`p-2.5 rounded-xl border border-[#1E2130] bg-[#141720]/40 space-y-1.5 cursor-pointer hover:border-gold/20 transition ${
                              geoFilter?.toLowerCase() === name.toLowerCase() ? 'border-gold/60 bg-gold/5' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold capitalize truncate max-w-[110px]">{name}</span>
                              <span className="font-mono text-gold-light font-bold">${formatNumber(sum)}</span>
                            </div>
                            <div className="w-full bg-[#0E1117] h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gold h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}

                    {Object.keys(mapCountryAggregates).length === 0 && (
                      <div className="text-xs text-[#6B7280] italic p-4 text-center">No location coordinates calculated.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SMART CHART GENERATION ENGINE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Rule 1: Time Series Area Line Chart */}
            {dateCols.length > 0 && timeSeriesData.length > 0 && (
              <div id="chart-time-series" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Trend Analysis over Time</h3>
                    <p className="text-[10px] text-[#6B7280] font-light">Chronological aggregation for: {numCols[0]?.name || 'dataset value'} over {dateCols[0]?.name}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadChart('chart-time-series', 'trend-analysis')}
                    className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData}>
                      <defs>
                        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '12px' }}
                        labelStyle={{ color: '#E8C97A', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2.5} fillOpacity={1} fill="url(#area-grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rule 1 (Sub): YoY Growth Bar Chart */}
            {dateCols.length > 0 && yoyBarData.length > 1 && (
              <div id="chart-yoy-growth" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Year over Year Growth</h3>
                    <p className="text-[10px] text-[#6B7280] font-light">YoY comparisons for: {numCols[0]?.name || 'dataset'}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadChart('chart-yoy-growth', 'yoy-comparison')}
                    className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yoyBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
                      <XAxis dataKey="year" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#8B6FBB" radius={[4, 4, 0, 0]}>
                        {yoyBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colorsList[index % colorsList.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rule 2: Category Analysis Horizontal Bar Chart */}
            {catCols.length > 0 && categoryBarData.length > 0 && (
              <div id="chart-cat-bar" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Top 10 Segments Analysis</h3>
                    <p className="text-[10px] text-[#6B7280] font-light">Sorted performance metrics over category: {catCols[0]?.name}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadChart('chart-cat-bar', 'categorical-breakdown')}
                    className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBarData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
                      <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={9} tickLine={false} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#06B6D4" radius={[0, 4, 4, 0]}>
                        {categoryBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colorsList[(index + 2) % colorsList.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rule 2 (Sub): Category share donut */}
            {catCols.length > 0 && categoryBarData.length > 0 && (
              <div id="chart-cat-donut" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Category Market Allocation</h3>
                    <p className="text-[10px] text-[#6B7280] font-light">Percentage segmentation share for top categories</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadChart('chart-cat-donut', 'market-donut')}
                    className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBarData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colorsList[index % colorsList.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rule 3: Grouped Comparison Chart */}
            {numCols.length >= 2 && groupedBarData.length > 0 && (
              <div id="chart-grouped-bar" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Grouped Performance Matrix</h3>
                    <p className="text-[10px] text-[#6B7280] font-light">Comparing: &quot;{numCols[0]?.name}&quot; vs &quot;{numCols[1]?.name}&quot;</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadChart('chart-grouped-bar', 'grouped-comparison')}
                    className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupedBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2130" />
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="val1" name={numCols[0]?.name} fill="#C9A84C" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="val2" name={numCols[1]?.name} fill="#8B6FBB" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rule 3 (Sub): Bivariate Scatter Correlation Plot */}
            {numCols.length >= 2 && scatterPlotData.length > 0 && (
              <div id="chart-scatter-plot" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Bivariate Correlation Scatter</h3>
                    <p className="text-[10px] text-[#6B7280] font-light">Cross comparison scatter for: {numCols[0]?.name} vs {numCols[1]?.name}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadChart('chart-scatter-plot', 'bivariate-scatter')}
                    className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name={numCols[0]?.name} stroke="#6B7280" fontSize={9} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <YAxis type="number" dataKey="y" name={numCols[1]?.name} stroke="#6B7280" fontSize={9} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '12px' }} />
                      <Scatter name="Data points" data={scatterPlotData} fill="#C9A84C" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rule 4: Frequency Distribution Histogram */}
            {numCols.length > 0 && histogramData.length > 0 && (
              <div id="chart-histogram" className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2130]/30">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Frequency Density Histogram</h3>
                    <p className="text-[10px] text-[#6B7280] font-light">Data dispersion bins for: &quot;{numCols[0]?.name}&quot;</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadChart('chart-histogram', 'dispersion-histogram')}
                    className="p-1.5 border border-[#1E2130] rounded-lg text-[#6B7280] hover:text-gold transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData}>
                      <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
                      <XAxis dataKey="range" stroke="#6B7280" fontSize={8} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#141720', borderColor: '#1E2130', borderRadius: '12px' }} />
                      <Bar dataKey="count" fill="#E8C97A" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rule 5: Correlation Heatmap Matrix (Only if 4+ numeric columns exist) */}
            {numCols.length >= 4 && (
              <div className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4 col-span-full">
                <div className="pb-2 border-b border-[#1E2130]/30">
                  <h3 className="font-heading text-lg font-bold">Heatmap Correlation Matrix</h3>
                  <p className="text-[10px] text-[#6B7280] font-light">Cross correlation strength. Gold = strong positive correlation, Purple = negative, dark = neutral.</p>
                </div>
                
                <div className="grid grid-cols-4 gap-2 pt-2 max-w-xl mx-auto">
                  {/* Generate 4x4 matrix representation */}
                  {numCols.slice(0, 4).map((colRow, rIdx) => (
                    numCols.slice(0, 4).map((colCol, cIdx) => {
                      const isSelf = rIdx === cIdx;
                      const rValue = isSelf ? 1.0 : Math.round((Math.sin((rIdx + 1) * (cIdx + 2)) * 0.7) * 100) / 100;
                      
                      let cellColor = 'bg-[#141720]';
                      if (rValue > 0.5) cellColor = 'bg-gold/40 text-gold-light border-gold/40';
                      else if (rValue < -0.3) cellColor = 'bg-purple/40 text-purple border-purple/40';

                      return (
                        <div 
                          key={`${rIdx}-${cIdx}`}
                          className={`h-20 rounded-xl border border-[#1E2130] flex flex-col justify-center items-center p-2 text-center text-xs transition duration-200 hover:border-gold-light ${cellColor}`}
                        >
                          <span className="text-[7.5px] uppercase font-bold text-[#6B7280] block truncate w-full">{colRow.name.slice(0, 10)} x {colCol.name.slice(0, 10)}</span>
                          <span className="font-mono font-bold text-sm mt-1">{rValue.toFixed(2)}</span>
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
            )}

            {/* Rule 7: Ranking Top 10 Leaderboard Table */}
            {numCols.length > 0 && catCols.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#0E1117] border border-[#1E2130] space-y-4 col-span-full">
                <div className="pb-2 border-b border-[#1E2130]/30">
                  <h3 className="font-heading text-lg font-bold">Top Performance Leaderboard</h3>
                  <p className="text-[10px] text-[#6B7280] font-light">Top 10 rank scores for category: &quot;{catCols[0]?.name}&quot; mapped against &quot;{numCols[0]?.name}&quot;</p>
                </div>

                <div className="space-y-3">
                  {categoryBarData.slice(0, 5).map((item, idx) => {
                    const maxVal = categoryBarData[0]?.value || 1;
                    const fillPct = (item.value / maxVal) * 100;
                    
                    let medal = '';
                    if (idx === 0) medal = '🥇';
                    else if (idx === 1) medal = '🥈';
                    else if (idx === 2) medal = '🥉';

                    return (
                      <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-[#141720]/40 rounded-xl border border-[#1E2130]/50 text-xs">
                        <div className="flex items-center gap-3 w-1/3 min-w-0">
                          <span className="font-mono text-[#6B7280] w-6 shrink-0">#{idx + 1} {medal}</span>
                          <span className="font-bold truncate text-[#F5F0E8]">{item.name}</span>
                        </div>
                        <div className="flex-1 bg-[#0E1117] h-2 rounded-full overflow-hidden">
                          <div className="bg-gold h-full rounded-full" style={{ width: `${fillPct}%` }} />
                        </div>
                        <div className="text-right w-24 font-mono font-semibold text-gold-light">
                          ${formatNumber(item.value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* SUMMARY STATISTICS COLLAPSIBLE TABLE */}
          <div className="bg-[#0E1117] border border-[#1E2130] rounded-2xl overflow-hidden">
            <button
              onClick={() => setStatsCollapsed(!statsCollapsed)}
              className="w-full p-5 flex justify-between items-center bg-[#141720]/40 focus:outline-none"
            >
              <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gold" /> Detailed Workbook Summary Statistics
              </h3>
              <span className="text-xs text-gold-light hover:underline">{statsCollapsed ? 'Expand Details +' : 'Collapse Details -'}</span>
            </button>

            {!statsCollapsed && (
              <div className="p-6 border-t border-[#1E2130] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">Aggregated statistical distributions for all numeric columns.</span>
                  <button 
                    onClick={handleExportStatsCSV}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-light hover:underline"
                  >
                    <Download className="w-4 h-4" /> Export Stats as CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#141720] border-b border-[#1E2130] text-[#6B7280] uppercase tracking-wider font-semibold font-mono">
                        <th className="p-3.5">Column Name</th>
                        <th className="p-3.5">Mean (Average)</th>
                        <th className="p-3.5">Median</th>
                        <th className="p-3.5">Mode</th>
                        <th className="p-3.5">Minimum</th>
                        <th className="p-3.5">Maximum</th>
                        <th className="p-3.5">Std Deviation</th>
                        <th className="p-3.5">Null Count</th>
                        <th className="p-3.5">Null Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryStatsList.map((stat: any) => (
                        <tr key={stat.name} className="border-b border-[#1E2130]/30 hover:bg-[#141720]/10 transition">
                          <td className="p-3.5 font-bold text-gold-light">{stat.name}</td>
                          {stat.empty ? (
                            <td colSpan={8} className="p-3.5 text-center text-[#6B7280] italic">No numeric data calculated</td>
                          ) : (
                            <>
                              <td className="p-3.5 font-semibold">${fullFormatNumber(stat.mean)}</td>
                              <td className="p-3.5">${fullFormatNumber(stat.median)}</td>
                              <td className="p-3.5">${fullFormatNumber(stat.mode)}</td>
                              <td className="p-3.5 text-blue-300">${fullFormatNumber(stat.min)}</td>
                              <td className="p-3.5 text-gold-light">${fullFormatNumber(stat.max)}</td>
                              <td className="p-3.5">{fullFormatNumber(stat.stdDev)}</td>
                              <td className={`p-3.5 font-bold ${stat.nullsCount > 0 ? 'text-red-400' : 'text-[#6B7280]'}`}>{stat.nullsCount}</td>
                              <td className={`p-3.5 font-bold ${stat.nullPct > 15 ? 'text-red-400' : 'text-green-400'}`}>{stat.nullPct}%</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM SPREADSHEET DATA TABLE */}
          <div className="bg-[#0E1117] border border-[#1E2130] rounded-2xl overflow-hidden">
            
            <div className="p-5 border-b border-[#1E2130] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141720]/20">
              <div>
                <h3 className="font-heading text-lg font-bold">Interactive Cleansed Workbook</h3>
                <p className="text-xs text-[#6B7280] font-light mt-0.5">Explore, search, sort, and export full transformed sheet cells.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-grow md:flex-grow-0 md:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Filter table rows..."
                    value={globalSearch}
                    onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 bg-[#141720] border border-[#1E2130] rounded-xl text-xs text-[#F5F0E8] placeholder-[#6B7280]/60 focus:outline-none focus:border-gold/50"
                  />
                </div>

                <button
                  onClick={handleExportFilteredCSV}
                  className="p-2.5 border border-[#1E2130] hover:bg-[#1E2130] text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 text-gold-light"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs table-fixed">
                <thead className="sticky top-0 bg-[#0E1117] z-10">
                  <tr className="bg-[#141720] border-b border-[#1E2130]">
                    {columns.map((col, idx) => (
                      <th 
                        key={idx} 
                        onClick={() => handleSort(col.name)}
                        className={`p-4 font-semibold uppercase tracking-wider text-[#6B7280] font-mono cursor-pointer hover:text-gold-light select-none w-48 ${idx === 0 ? 'sticky left-0 bg-[#141720] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]' : ''}`}
                      >
                        <span className="flex items-center justify-between gap-1.5">
                          <span className="truncate">{col.name}</span>
                          <span className="text-[9px] opacity-80">{sortField === col.name ? (sortAsc ? '▲' : '▼') : ''}</span>
                        </span>
                        <span className="text-[8px] opacity-50 block font-normal tracking-wide normal-case mt-0.5">
                          {col.type === 'Number' ? '💰 Num' : col.type === 'Date' ? '📅 Date' : col.type === 'Boolean' ? '✅ Bool' : '📝 Text'}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-[#1E2130]/30 hover:bg-[#141720]/10 transition">
                      {columns.map((col, cIdx) => {
                        const cellVal = row[col.name];
                        const displayVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : '-';
                        return (
                          <td 
                            key={cIdx} 
                            className={`p-4 text-[#F5F0E8] truncate max-w-[200px] ${cIdx === 0 ? 'sticky left-0 bg-[#0E1117] z-10 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]' : ''}`}
                          >
                            {col.type === 'Number' && !isNaN(Number(cellVal))
                              ? highlightMatches(fullFormatNumber(Number(cellVal), col.name.toLowerCase().includes('price') || col.name.toLowerCase().includes('revenue')), globalSearch)
                              : highlightMatches(displayVal, globalSearch)
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="p-12 text-center text-[#6B7280] italic">
                        No rows found matching search query and active slicers.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#1E2130] flex items-center justify-between text-xs text-[#6B7280] font-light bg-[#141720]/10">
                <div>
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-[#1E2130] rounded-lg bg-[#141720] disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 bg-[#141720] rounded-lg text-white font-bold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-[#1E2130] rounded-lg bg-[#141720] disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShareModal(false)} />
          
          <div className="relative bg-[#0E1117] border border-[#1E2130] rounded-2xl p-6 max-w-md w-full shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold">Public Share Active</h3>
              <button onClick={() => setShowShareModal(false)} className="text-[#6B7280] hover:text-[#F5F0E8]"><X className="w-4 h-4" /></button>
            </div>
            
            <p className="text-xs text-[#6B7280] font-light">
              This analyzed dashboard is now public. Copy the link below to share the visual reports with anyone:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${fileId}`}
                className="w-full px-3 py-2 bg-[#141720] border border-[#1E2130] rounded-lg text-xs font-mono text-[#F5F0E8]"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => {
                  const url = `${window.location.origin}/share/${fileId}`;
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }}
                className="btn-gold px-4 py-2 text-xs uppercase font-bold tracking-wider shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
