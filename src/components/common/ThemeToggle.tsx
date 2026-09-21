'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useUiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-transparent flex items-center justify-center opacity-0 ${className}`}
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Mavzuni o'zgartirish (hozirda: ${isDark ? 'Qorong\'i' : 'Yorug\''})`}
      title={`Mavzuni o'zgartirish: ${isDark ? 'Yorug\' rejimga o\'tish' : 'Qorong\'i rejimga o\'tish'}`}
      className={`relative group inline-flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 ${
        isDark
          ? 'bg-[#181A1F] border-white/10 hover:border-amber-400/40 text-amber-400'
          : 'bg-white border-slate-200 hover:border-amber-500/50 shadow-sm text-amber-600 hover:bg-amber-50/50'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun
            size={18}
            className="transition-transform duration-500 transform rotate-0 hover:rotate-90 text-amber-400"
          />
        ) : (
          <Moon
            size={18}
            className="transition-transform duration-500 transform -rotate-12 hover:rotate-0 text-slate-700 group-hover:text-amber-600"
          />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium pr-1">
          {isDark ? "Yorug' rejim" : "Qorong'i rejim"}
        </span>
      )}
    </button>
  );
}
