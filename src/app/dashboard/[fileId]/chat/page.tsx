'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Lock, 
  Info,
  RefreshCw,
  InfoIcon
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ColumnMeta {
  name: string;
  type: string;
}

interface FileRecord {
  id: string;
  file_name: string;
  storage_path: string;
  row_count: number;
  column_count: number;
}

interface AnalysisRecord {
  column_metadata: ColumnMeta[];
  summary_stats: Record<string, unknown>;
}

const supabase = createClient();

export default function AIChatPage() {
  const params = useParams();
  const fileId = params.fileId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // DB context
  const [fileRecord, setFileRecord] = useState<FileRecord | null>(null);
  const [analysisRecord, setAnalysisRecord] = useState<AnalysisRecord | null>(null);
  const [dataset, setDataset] = useState<Record<string, unknown>[]>([]);
  
  // App states
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('free');
  
  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatContext = async () => {
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

        if (fileErr || !file) throw new Error("Could not find dataset context.");
        setFileRecord(file as FileRecord);

        // 3. Fetch analysis details
        const { data: analysis, error: analysisErr } = await supabase
          .from('analyses')
          .select('*')
          .eq('file_id', fileId)
          .single();
        
        if (analysisErr) throw analysisErr;
        setAnalysisRecord(analysis as AnalysisRecord);

        // 4. Download spreadsheet sample data from Supabase storage
        const { data: storageBlob, error: storageErr } = await supabase.storage
          .from('uploads')
          .download(file.storage_path);

        if (!storageErr) {
          const jsonText = await storageBlob.text();
          const rows = JSON.parse(jsonText);
          setDataset(rows as Record<string, unknown>[]);
        }

        // Add welcome message
        setMessages([
          { 
            role: 'assistant', 
            content: `Hello! I have loaded your dataset **${file.file_name}** into my context. 

I can help you analyze trends, summarize statistical distributions, explain columns correlation, or write snippets. What would you like to explore first?` 
          }
        ]);

      } catch (err) {
        const error = err as Error;
        setErrorMsg(error.message || "Failed to load chat parameters.");
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchChatContext();
    }
  }, [fileId]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || generating) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');
    setErrorMsg(null);

    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessageContent }
    ];

    setMessages(updatedMessages);
    setGenerating(true);

    try {
      const response = await fetch('/api/groq/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          schemaMeta: analysisRecord?.column_metadata || [],
          summaryStats: analysisRecord?.summary_stats || {},
          sampleRows: dataset.slice(0, 10) // Pass first 10 rows as sample context
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to generate response.');
      }

      // Read chunk stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Could not initialize response stream.");

      // Add a blank message for the bot response
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let assistantResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const textChunk = (parsed.choices[0]?.delta?.content || '') as string;
              assistantResponse += textChunk;

              // Update the last message in state
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                  role: 'assistant',
                  content: assistantResponse
                };
                return newMsgs;
              });
            } catch {
              // Ignore JSON parse errors for partially-transferred chunks
            }
          }
        }
      }

    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || "An error occurred while streaming response.");
      // Clean up empty bot message if it failed
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-4 bg-background text-text-primary min-h-screen">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-light" />
        <p className="text-xs text-text-muted font-mono tracking-widest uppercase">Opening secure AI pipeline...</p>
      </div>
    );
  }

  // Free Tier Gate Modal
  if (plan === 'free') {
    return (
      <div className="flex-grow flex items-center justify-center p-6 bg-background min-h-screen">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-100px] left-[-100px] w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto text-gold-light">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold tracking-tight">AI Chat is locked</h2>
            <p className="text-xs text-text-muted font-light leading-relaxed">
              Talk to your spreadsheets. Extract forecasts, formulate custom formulas, and ask mathematical questions about your tables using Groq AI Llama-3, available exclusively to Pro members.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link href="/dashboard/settings" className="btn-gold py-3.5 text-xs font-bold uppercase tracking-wider block shadow-lg shadow-gold/10">
              Upgrade to Pro ($5/mo)
            </Link>
            <Link href={`/dashboard/${fileId}`} className="text-xs text-text-muted hover:text-text-primary transition">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 lg:relative lg:inset-auto lg:z-0 flex-grow flex flex-col lg:flex-row h-[100dvh] lg:h-screen w-screen lg:w-auto overflow-hidden bg-background">
      
      {/* Left Sidebar - Data Context reference */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:h-full bg-card lg:border-r border-border justify-between overflow-y-auto shrink-0 animate-fade-in">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/${fileId}`} className="p-2 border border-border rounded-xl hover:bg-card2 text-text-muted hover:text-text-primary transition">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div>
              <h2 className="font-heading text-base font-bold truncate max-w-[160px]">{fileRecord?.file_name}</h2>
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-mono">Dataset Context</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-text-muted pb-2 border-b border-border/50">Columns Schema</div>
            
            <div className="space-y-2">
              {analysisRecord?.column_metadata?.map((col: ColumnMeta, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-card2 border border-border/60">
                  <span className="font-mono text-text-primary truncate max-w-[140px]">{col.name}</span>
                  <span className="text-[8px] uppercase font-bold text-gold-light opacity-85">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-card2/30 border-t border-border text-[10px] text-text-muted font-light flex gap-2">
          <InfoIcon className="w-4 h-4 shrink-0 text-gold-light" />
          <span>The AI analyst has visibility of schema statistics and sample rows from this dataset.</span>
        </div>
      </div>

      {/* Right Content - Streaming Chat Interface */}
      <div className="flex-grow flex flex-col h-full justify-between relative bg-background/50">
        
        {/* Chat Header */}
        <div className="h-16 px-4 md:px-6 border-b border-border flex items-center justify-between bg-card/85 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Link 
              href={`/dashboard/${fileId}`} 
              className="p-2 border border-border rounded-xl hover:bg-card2 text-text-muted hover:text-text-primary transition lg:hidden"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-gold-light" />
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center">
                <span className="text-sm font-semibold">DataLens AI Analyst</span>
                <span className="text-[10px] text-text-muted font-normal lg:hidden truncate max-w-[150px]">
                  {fileRecord?.file_name}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold-light font-bold">
            PRO ACCESS
          </span>
        </div>

        {/* Conversation Box */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 max-w-2xl ${
                m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                m.role === 'user' 
                  ? 'bg-purple/10 border-purple/20 text-purple' 
                  : 'bg-gold/10 border-gold/20 text-gold-light'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`rounded-2xl p-4 text-sm leading-relaxed font-light ${
                m.role === 'user' 
                  ? 'bg-purple/5 border border-purple/10 text-text-primary' 
                  : 'bg-card border border-border text-text-primary whitespace-pre-wrap'
              }`}>
                {m.content ? m.content : <span className="flex gap-1 items-center text-text-muted italic">Thinking<span className="animate-pulse">...</span></span>}
              </div>
            </div>
          ))}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs max-w-sm mx-auto animate-bounce">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 md:p-6 border-t border-border bg-card/85 backdrop-blur-md shrink-0">
          <div className="relative max-w-3xl mx-auto flex items-center gap-3">
            <input
              type="text"
              placeholder={generating ? "Generating insights..." : "Ask AI about column trends, statistics, or outliers..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={generating}
              className="w-full pl-4 pr-14 py-4 bg-card2 border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 text-text-primary placeholder-text-muted/60 disabled:opacity-50"
            />
            
            <button
              type="submit"
              disabled={!inputValue.trim() || generating}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg bg-gold hover:opacity-90 disabled:opacity-30 text-[#080A0F] transition duration-150"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
