'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { KpiData } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  TrendingUp, CheckCircle2, XCircle, Clock, FileText,
  Award, Target, Zap, ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Donut chart uchun yordamchi komponent
function KpiDonut({ rate, color, size = 120 }: { rate: number; color: string; size?: number }) {
  const data = [
    { value: rate },
    { value: 100 - rate },
  ];
  const colors = [color, 'rgba(148,163,184,0.15)'];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.47}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ fontSize: size * 0.22 }}
      >
        <span className="font-bold" style={{ color }}>{rate}%</span>
      </div>
    </div>
  );
}

// Rang gradelari
const COLORS = {
  green: '#10b981',
  amber: '#f59e0b',
  sky: '#38bdf8',
  rose: '#f43f5e',
  violet: '#a78bfa',
};

export default function KpiPage() {
  const { user } = useAuthStore();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/kpi/personal')
      .then((res) => setKpi(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[rgb(var(--text-muted))]">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>KPI yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!kpi) {
    return (
      <div className="flex items-center justify-center h-64 text-[rgb(var(--text-muted))]">
        <span>Ma&apos;lumotlarni olishda xatolik yuz berdi.</span>
      </div>
    );
  }

  // Umumiy samaradorlik = Tasdiqlovchi va Ijrochi o'rtacha ko'rsatkichi
  const overallRate = kpi.overallRate ?? 100;
  const overallColor = overallRate >= 80 ? COLORS.green : overallRate >= 60 ? COLORS.amber : COLORS.rose;

  const getRatingLabel = (rate: number) => {
    if (rate >= 90) return { label: 'A+ — Ajoyib', color: COLORS.green };
    if (rate >= 80) return { label: 'A — Yaxshi', color: COLORS.green };
    if (rate >= 70) return { label: 'B — O\'rtacha yuqori', color: COLORS.sky };
    if (rate >= 60) return { label: 'C — O\'rtacha', color: COLORS.amber };
    return { label: 'D — Takomillashtirish kerak', color: COLORS.rose };
  };

  const overall = getRatingLabel(overallRate);

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <TrendingUp size={24} className="text-amber-500" />
            KPI va Samaradorlik
          </h1>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
            {user?.fullName} — Shaxsiy ko&apos;rsatkichlar (Hisoblash ish kunlari bo&apos;yicha)
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{
            background: `${overall.color}15`,
            color: overall.color,
            borderColor: `${overall.color}40`,
          }}
        >
          <Award size={13} />
          {overall.label}
        </div>
      </div>

      {/* Umumiy KPI kartasi */}
      <div
        className="glass-card p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${overallColor}08 0%, transparent 60%)`,
          borderColor: `${overallColor}30`,
        }}
      >
        {/* bg decoration */}
        <div
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-5 pointer-events-none"
          style={{ background: overallColor }}
        />
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <KpiDonut rate={overallRate} color={overallColor} size={130} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm text-[rgb(var(--text-muted))] mb-1">Umumiy samaradorlik indeksi</p>
            <p className="text-4xl font-black mb-2" style={{ color: overallColor }}>{overallRate}%</p>
            <p className="text-sm font-semibold" style={{ color: overallColor }}>{overall.label}</p>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-2">
              Tasdiqlovchi va Ijrochi rollaridagi o&apos;rtacha ko&apos;rsatkich
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4 text-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[rgb(var(--border))]">
            {[
              { label: 'Tasdiqlovchi', rate: kpi.approver.onTimeRate, color: COLORS.sky, icon: ShieldCheck },
              { label: 'Ijrochi', rate: kpi.executor.onTimeRate, color: COLORS.green, icon: Zap },
            ].map(({ label, rate, color, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-1">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-base sm:text-lg font-bold" style={{ color }}>{rate}%</span>
                <span className="text-[11px] sm:text-xs text-[rgb(var(--text-muted))] whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2 ta asosiy karta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* 2. Tasdiqlovchi (Approver) */}
        <div className="glass-card p-5 space-y-4" style={{ borderColor: `${COLORS.sky}25` }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${COLORS.sky}15` }}>
              <ShieldCheck size={18} style={{ color: COLORS.sky }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Tasdiqlovchi</p>
              <p className="text-xs text-[rgb(var(--text-muted))]">Vaqtida tasdiqlash</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <KpiDonut rate={kpi.approver.onTimeRate} color={COLORS.sky} size={90} />
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-xs">
                <span className="text-[rgb(var(--text-muted))]">Jami bosqichlar</span>
                <span className="font-bold text-[rgb(var(--text-primary))]">{kpi.approver.totalSteps}</span>
              </div>
              <div className="flex justify-between text-xs items-center gap-1">
                <span className="text-[rgb(var(--text-muted))]">O&apos;z vaqtida</span>
                <span className="font-bold flex items-center gap-1" style={{ color: COLORS.green }}>
                  <CheckCircle2 size={11} />{kpi.approver.onTime}
                </span>
              </div>
              <div className="flex justify-between text-xs items-center gap-1">
                <span className="text-[rgb(var(--text-muted))]">Kechikkan</span>
                <span className="font-bold flex items-center gap-1" style={{ color: COLORS.rose }}>
                  <XCircle size={11} />{kpi.approver.late}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[rgb(var(--text-muted))]">O&apos;z vaqtida bajarish</span>
              <span className="font-semibold" style={{ color: COLORS.sky }}>{kpi.approver.onTimeRate}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${kpi.approver.onTimeRate}%`, background: COLORS.sky }}
              />
            </div>
          </div>
        </div>

        {/* 3. Ijrochi (Executor) */}
        <div className="glass-card p-5 space-y-4" style={{ borderColor: `${COLORS.green}25` }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${COLORS.green}15` }}>
              <Zap size={18} style={{ color: COLORS.green }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Ijrochi</p>
              <p className="text-xs text-[rgb(var(--text-muted))]">Topshiriqlarni bajarish</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <KpiDonut rate={kpi.executor.onTimeRate} color={COLORS.green} size={90} />
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-xs">
                <span className="text-[rgb(var(--text-muted))]">Jami bajarilgan</span>
                <span className="font-bold text-[rgb(var(--text-primary))]">{kpi.executor.totalExecutions}</span>
              </div>
              <div className="flex justify-between text-xs items-center gap-1">
                <span className="text-[rgb(var(--text-muted))]">O&apos;z vaqtida</span>
                <span className="font-bold flex items-center gap-1" style={{ color: COLORS.green }}>
                  <CheckCircle2 size={11} />{kpi.executor.onTime}
                </span>
              </div>
              <div className="flex justify-between text-xs items-center gap-1">
                <span className="text-[rgb(var(--text-muted))]">Kechikkan</span>
                <span className="font-bold flex items-center gap-1" style={{ color: COLORS.rose }}>
                  <Clock size={11} />{kpi.executor.late}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[rgb(var(--text-muted))]">O&apos;z vaqtida bajarish</span>
              <span className="font-semibold" style={{ color: COLORS.green }}>{kpi.executor.onTimeRate}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${kpi.executor.onTimeRate}%`, background: COLORS.green }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Qo'shimcha ma'lumot */}
      <div
        className="glass-card p-4 flex items-start gap-3"
        style={{ borderColor: `${COLORS.amber}25`, background: `${COLORS.amber}06` }}
      >
        <Target size={16} className="mt-0.5 shrink-0" style={{ color: COLORS.amber }} />
        <div className="text-xs text-[rgb(var(--text-secondary))]">
          <span className="font-semibold" style={{ color: COLORS.amber }}>Eslatma:</span>{' '}
          KPI ko&apos;rsatkichlari haqiqiy ish kunlari bo&apos;yicha hisoblanadi. Tasdiqlash muddati{' '}
          <code className="text-xs bg-white/10 px-1 rounded">stepDeadline</code> ga, ijro muddati esa{' '}
          <code className="text-xs bg-white/10 px-1 rounded">overallDeadline</code> ga nisbatan o&apos;lchanadi.
        </div>
      </div>
    </div>
  );
}
