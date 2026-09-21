'use client';
import { useEffect, useState } from 'react';
import DiscoverLogo from './DiscoverLogo';

interface DiscoverSplashProps {
  onFinish?: () => void;
  minDuration?: number;
}

export default function DiscoverSplash({
  onFinish,
  minDuration = 1400,
}: DiscoverSplashProps) {
  const [stage, setStage] = useState<'animating' | 'fading' | 'hidden'>('animating');

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setStage('fading');
    }, minDuration);

    const finishTimer = setTimeout(() => {
      setStage('hidden');
      if (onFinish) onFinish();
    }, minDuration + 500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  if (stage === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ease-out ${
        stage === 'fading' ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ background: 'rgb(var(--bg-base))' }}
    >
      {/* Ambient background light */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none opacity-80"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(227, 30, 36, 0.05) 50%, transparent 70%)',
        }}
      />

      {/* Center animated brand container */}
      <div className="relative flex flex-col items-center select-none text-[rgb(var(--text-primary))]">
        {/* Animated Emblem & Logo */}
        <div className="relative animate-di-pulse">
          <div
            className="p-4 transition-all duration-700"
            style={{
              filter: 'drop-shadow(0 0 35px rgba(245, 158, 11, 0.35))',
            }}
          >
            <DiscoverLogo height={64} />
          </div>
        </div>

        {/* Brand Slogan */}
        <div className="mt-4 flex items-center gap-2 overflow-hidden">
          <span
            className="text-[11px] font-semibold tracking-[0.35em] uppercase animate-di-tracking text-amber-600 dark:text-amber-400"
          >
            Building The Future
          </span>
        </div>

        {/* Elegant Gold Progress Line */}
        <div className="w-44 h-[2px] mt-6 bg-slate-300 dark:bg-white/[0.08] rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent animate-di-sweep" />
        </div>
      </div>

      <style jsx>{`
        @keyframes diPulse {
          0% {
            transform: scale(0.92);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.02);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes diTracking {
          0% {
            letter-spacing: 0.1em;
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            letter-spacing: 0.35em;
            opacity: 0.9;
            transform: translateY(0);
          }
        }
        @keyframes diSweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-di-pulse {
          animation: diPulse 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-di-tracking {
          animation: diTracking 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .animate-di-sweep {
          animation: diSweep 1.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
