'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DocumentStats } from '@/types';
import {
  BarChart2, CheckCircle, XCircle, Clock,
  FileText, AlertCircle, Award,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents/stats')
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!stats) return null;

  const total = stats.total || 1;
  const completion = ((stats.completed / total) * 100).toFixed(1);
  const rejection = ((stats.rejected / total) * 100).toFixed(1);
  const expiry = ((stats.expired / total) * 100).toFixed(1);

  const bars = [
    { label: 'Qoralama', value: stats.draft, color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' },
    { label: 'Tasdiqlashda', value: stats.inApproval, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    { label: 'Tasdiqlandi', value: stats.approved, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
    { label: 'Yakunlandi', value: stats.completed, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Rad etildi', value: stats.rejected, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    { label: 'Muddati o\'tdi', value: stats.expired, color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  ];

  const maxVal = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">Hisobotlar</h1>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Tizim statistikasi va analitika
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Umumiy hujjatlar',
            value: stats.total,
            icon: FileText,
            color: 'rgb(var(--primary))',
            sub: 'Barcha vaqt uchun',
          },
          {
            title: 'Muvaffaqiyat darajasi',
            value: `${completion}%`,
            icon: Award,
            color: '#10B981',
            sub: `${stats.completed} yakunlandi`,
          },
          {
            title: 'Rad etish darajasi',
            value: `${rejection}%`,
            icon: XCircle,
            color: '#EF4444',
            sub: `${stats.rejected} rad etildi`,
          },
          {
            title: 'Muddat o\'tish',
            value: `${expiry}%`,
            icon: AlertCircle,
            color: '#F97316',
            sub: `${stats.expired} muddati o'tdi`,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="stat-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}20` }}
                >
                  <Icon size={17} style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">{kpi.value}</div>
              <div className="text-sm font-medium text-[rgb(var(--text-primary))] mb-0.5">{kpi.title}</div>
              <div className="text-xs text-[rgb(var(--text-muted))]">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Bar Chart — Professional Light/Dark Adaptive Progress Bars */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]">
            <BarChart2 size={18} />
          </div>
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">Holat bo'yicha taqsimot</h2>
        </div>

        <div className="space-y-4">
          {bars.map((bar) => {
            const width = total > 0 && bar.value > 0 ? (bar.value / maxVal) * 100 : 0;
            return (
              <div key={bar.label}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-[rgb(var(--text-secondary))]">{bar.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[rgb(var(--text-primary))]">{bar.value}</span>
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      ({total > 0 ? ((bar.value / total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
                {/* Clean, soft adaptive track — never solid pitch-black */}
                <div className="h-2.5 rounded-full overflow-hidden bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${width}%`,
                      background: bar.color,
                      boxShadow: width > 0 ? `0 0 10px ${bar.color}60` : 'none',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-5">Hujjat holat dinamikasi</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {bars.map((bar, index) => (
            <div key={bar.label} className="flex items-center gap-2 flex-shrink-0">
              <div
                className="px-5 py-3 rounded-xl text-center min-w-[110px] border"
                style={{ background: bar.bg, borderColor: `${bar.color}35` }}
              >
                <div className="text-2xl font-bold mb-1" style={{ color: bar.color }}>
                  {bar.value}
                </div>
                <div className="text-xs font-medium text-[rgb(var(--text-secondary))]">{bar.label}</div>
              </div>
              {index < bars.length - 1 && (
                <div className="text-[rgb(var(--text-muted))] text-sm font-bold">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
