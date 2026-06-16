'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, X } from 'lucide-react';

const safeStorage = {
  get: (key: string) => {
    try { return localStorage.getItem(key); } 
    catch { return null; }
  },
  set: (key: string, value: string) => {
    try { localStorage.setItem(key, value); } 
    catch { }
  }
};

interface Broadcast {
  id: string;
  message: string;
  created_at: string;
}

export default function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchLatestBroadcast = async () => {
      try {
        const { data, error } = await supabase
          .from('broadcasts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          // Check if dismissed locally
          const lastDismissedId = safeStorage.get('datalens_dismissed_broadcast_id');
          if (lastDismissedId !== data.id) {
            setBroadcast(data as Broadcast);
            setDismissed(false);
          }
        }
      } catch {
        // Silent error fallback
      }
    };

    fetchLatestBroadcast();
  }, []);

  const handleDismiss = () => {
    if (broadcast) {
      safeStorage.set('datalens_dismissed_broadcast_id', broadcast.id);
      setDismissed(true);
    }
  };

  if (dismissed || !broadcast) return null;

  return (
    <div className="bg-gradient-to-r from-gold/15 via-gold/5 to-gold/15 border-b border-gold/30 text-gold-light py-3 px-6 flex items-center justify-between gap-4 z-50 animate-fadeIn">
      <div className="flex items-center gap-3 max-w-4xl mx-auto w-full text-center justify-center text-xs font-semibold">
        <Megaphone className="w-4.5 h-4.5 shrink-0 animate-pulse text-gold" />
        <span>{broadcast.message}</span>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1 hover:bg-gold/10 rounded transition text-gold-light"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
