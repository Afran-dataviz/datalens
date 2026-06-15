'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-9 h-9 ${className}`} />;
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === 'light' ? 'dark' : 'light')}
      className={`w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-text-primary hover:border-gold/30 hover:text-gold transition shrink-0 ${className}`}
      aria-label="Toggle visual theme"
    >
      {currentTheme === 'light' ? (
        <Moon className="w-4.5 h-4.5" />
      ) : (
        <Sun className="w-4.5 h-4.5" />
      )}
    </button>
  );
}
