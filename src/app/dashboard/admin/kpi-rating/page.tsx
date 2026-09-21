'use client';
import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { UserKpiEntry } from '@/types';
import { roleLabels } from '@/lib/utils';
import {
  TrendingUp, Users, Trophy, Search, X,
  FileText, ShieldCheck, Zap, Award, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, Clock, Target, Medal,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  green:  '#10b981',
  amber:  '#f59e0b',
  sky:    '#38bdf8',
  rose:   '#f43f5e',
  violet: '#a78bfa',
};

function getRatingLabel(rate: number) {
  if (rate >= 90) return { label: 'A+', full: "A+ — Ajoyib",                    color: COLORS.green  };
  if (rate >= 80) return { label: 'A',  full: "A — Yaxshi",                     color: COLORS.green  };
  if (rate >= 70) return { label: 'B',  full: "B — O'rtacha yuqori",            color: COLORS.sky    };
  if (rate >= 60) return { label: 'C',  full: "C — O'rtacha",                   color: COLORS.amber  };
  return              { label: 'D',  full: "D — Takomillashtirish kerak",    color: COLORS.rose   };
}

function MiniDonut({ rate, color, size = 56 }: { rate: number; color: string; size?: number }) {
  const data = [{ value: rate }, { value: 100 - rate }];
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={size * 0.33} outerRadius={size * 0.46}
            startAngle={90} endAngle={-270}
            paddingAngle={2} dataKey="value" strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? color : 'rgba(148,163,184,0.12)'} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none font-bold"
        style={{ fontSize: size * 0.24, color }}
      >
        {rate}%
      </div>
    </div>
  );
}

function DetailDonut({ rate, color, size = 110 }: { rate: number; color: string; size?: number }) {
  const data = [{ value: rate }, { value: 100 - rate }];
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={size * 0.34} outerRadius={size * 0.46}
            startAngle={90} endAngle={-270}
            paddingAngle={2} dataKey="value" strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? color : 'rgba(148,163,184,0.10)'} />
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

function PodiumCard({ entry, rank, onClick }: { entry: UserKpiEntry; rank: 1|2|3; onClick: () => void }) {
  const rating = getRatingLabel(entry.kpi.overallRate);
  const medals = {
    1: { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/40', icon: '🥇' },
    2: { bg: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/40', icon: '🥈' },
    3: { bg: 'from-amber-700/20 to-amber-800/10', border: 'border-amber-700/40', icon: '🥉' },
  };
  const m = medals[rank];
  return (
    <button
      onClick={onClick}
      className={`glass-card p-5 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-b ${m.bg} border ${m.border} w-full`}
    >
      <div className="text-3xl mb-2">{m.icon}</div>
      <div className="flex justify-center mb-3">
        <MiniDonut rate={entry.kpi.overallRate} color={rating.color} size={64} />
      </div>
      <p className="font-bold text-sm text-[rgb(var(--text-primary))] truncate">{entry.user.fullName}</p>
      <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 truncate">
        {entry.user.department || roleLabels[entry.user.role] || entry.user.role}
      </p>
      <div className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: `${rating.color}15`, color: rating.color }}>
        {rating.full}
      </div>
    </button>
  );
}

function KpiDetailCard({
  title, subtitle, rate, color, icon: Icon, rows,
}: {
  title: string; subtitle: string; rate: number; color: string;
  icon: React.ElementType;
  rows: { label: string; value: number; valueColor?: string; icon?: React.ElementType }[];
}) {
  return (
    <div className="glass-card p-4 space-y-3" style={{ borderColor: `${color}25` }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">{title}</p>
          <p className="text-[10px] text-[rgb(var(--text-muted))]">{subtitle}</p>
        </div>
      </div>
      <div className="flex justify-center">
        <DetailDonut rate={rate} color={color} size={80} />
      </div>
      <div className="space-y-1.5">
        {rows.map(({ label, value, valueColor, icon: RowIcon }) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-[rgb(var(--text-muted))]">{label}</span>
            <span className="font-bold flex items-center gap-1" style={{ color: valueColor || 'rgb(var(--text-primary))' }}>
              {RowIcon && <RowIcon size={10} />}{value}
            </span>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-[rgb(var(--text-muted))]">Samaradorlik</span>
          <span style={{ color }} className="font-semibold">{rate}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${rate}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function KpiDetailModal({ entry, onClose }: { entry: UserKpiEntry; onClose: () => void }) {
  const { user, kpi } = entry;
  const rating = getRatingLabel(kpi.overallRate);
  const overallColor = rating.color;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
        style={{ background: 'rgb(var(--bg-elevated))', borderColor: `${overallColor}30` }}>
        <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold"
              style={{ background: `${overallColor}20`, color: overallColor }}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[rgb(var(--text-primary))]">{user.fullName}</h2>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                {user.position || roleLabels[user.role] || user.role}
                {user.department && ` · ${user.department}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-[rgb(var(--text-muted))]">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <DetailDonut rate={kpi.overallRate} color={overallColor} size={120} />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs text-[rgb(var(--text-muted))] mb-1">Umumiy samaradorlik indeksi</p>
              <p className="text-4xl font-black mb-1" style={{ color: overallColor }}>{kpi.overallRate}%</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${overallColor}15`, color: overallColor }}>
                <Award size={12} />{rating.full}
              </div>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-2">
                Tashabbuskor, Tasdiqlovchi va Ijrochi rollaridagi o&apos;rtacha ko&apos;rsatkich
              </p>
            </div>
            <div className="flex sm:flex-col gap-3 sm:gap-2">
              {[
                { label: 'Tashabbuskor', rate: kpi.creator.successRate,  color: COLORS.violet, icon: FileText   },
                { label: 'Tasdiqlovchi', rate: kpi.approver.onTimeRate,  color: COLORS.sky,    icon: ShieldCheck },
                { label: 'Ijrochi',      rate: kpi.executor.onTimeRate,  color: COLORS.green,  icon: Zap         },
              ].map(({ label, rate: r, color, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <span className="text-[rgb(var(--text-muted))]">{label}</span>
                  <span className="font-bold ml-auto" style={{ color }}>{r}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
          <KpiDetailCard
            title="Tashabbuskor" subtitle="Hujjat yaratish sifati"
            rate={kpi.creator.successRate} color={COLORS.violet} icon={FileText}
            rows={[
              { label: 'Jami yaratilgan', value: kpi.creator.totalCreated, valueColor: undefined },
              { label: 'Rad etilgan', value: kpi.creator.totalRejected, valueColor: COLORS.rose },
              { label: 'Muvaffaqiyatli', value: kpi.creator.totalCreated - kpi.creator.totalRejected, valueColor: COLORS.green },
            ]}
          />
          <KpiDetailCard
            title="Tasdiqlovchi" subtitle="Vaqtida tasdiqlash"
            rate={kpi.approver.onTimeRate} color={COLORS.sky} icon={ShieldCheck}
            rows={[
              { label: 'Jami bosqichlar', value: kpi.approver.totalSteps, valueColor: undefined },
              { label: "O'z vaqtida", value: kpi.approver.onTime, valueColor: COLORS.green, icon: CheckCircle2 },
              { label: 'Kechikkan', value: kpi.approver.late, valueColor: COLORS.rose, icon: XCircle },
            ]}
          />
          <KpiDetailCard
            title="Ijrochi" subtitle="Topshiriqlarni bajarish"
            rate={kpi.executor.onTimeRate} color={COLORS.green} icon={Zap}
            rows={[
              { label: 'Jami bajarilgan', value: kpi.executor.totalExecutions, valueColor: undefined },
              { label: "O'z vaqtida", value: kpi.executor.onTime, valueColor: COLORS.green, icon: CheckCircle2 },
              { label: 'Kechikkan', value: kpi.executor.late, valueColor: COLORS.rose, icon: Clock },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

type SortKey = 'overall' | 'creator' | 'approver' | 'executor';
type SortDir = 'asc' | 'desc';

export default function AdminKpiRatingPage() {
  const [entries, setEntries] = useState<UserKpiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserKpiEntry | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    api.get('/kpi/users')
      .then(res => setEntries(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const roles = ['ALL', 'INITIATOR', 'APPROVER', 'EXECUTOR', 'ADMIN'];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.user.fullName.toLowerCase().includes(q) ||
        e.user.email.toLowerCase().includes(q) ||
        (e.user.department || '').toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'ALL') list = list.filter(e => e.user.role === roleFilter);
    const getVal = (e: UserKpiEntry): number => {
      if (sortKey === 'overall')  return e.kpi.overallRate;
      if (sortKey === 'creator')  return e.kpi.creator.successRate;
      if (sortKey === 'approver') return e.kpi.approver.onTimeRate;
      return e.kpi.executor.onTimeRate;
    };
    list.sort((a, b) => sortDir === 'desc' ? getVal(b) - getVal(a) : getVal(a) - getVal(b));
    return list;
  }, [entries, search, roleFilter, sortKey, sortDir]);

  const top3 = entries.slice(0, 3);
  const avgOverall = entries.length ? Math.round(entries.reduce((s, e) => s + e.kpi.overallRate, 0) / entries.length) : 0;
  const aPlus = entries.filter(e => e.kpi.overallRate >= 90).length;
  const needImprovement = entries.filter(e => e.kpi.overallRate < 60).length;

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={12} className="opacity-20" />;
    return sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[rgb(var(--text-muted))]">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>KPI reytingi yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <Trophy size={24} className="text-amber-500" />
            Xodimlar KPI Reytingi
          </h1>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
            Barcha xodimlarning samaradorlik ko&apos;rsatkichlari — real vaqtda
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-muted))]">
          <Users size={14} />{entries.length} nafar xodim
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Jami xodimlar',    value: entries.length,    icon: Users,      color: COLORS.sky    },
          { label: "O'rtacha KPI",     value: `${avgOverall}%`,  icon: TrendingUp, color: COLORS.violet },
          { label: 'A+ baholilar',     value: aPlus,             icon: Medal,      color: COLORS.amber  },
          { label: 'Takomillashtirish kerak', value: needImprovement, icon: Target, color: COLORS.rose },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3" style={{ borderColor: `${color}25` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--text-muted))]">{label}</p>
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-3">
            🏆 Top 3 — Eng yaxshi xodimlar
          </p>
          <div className="grid grid-cols-3 gap-4">
            {top3.map((e, i) => (
              <PodiumCard key={e.user.id} entry={e} rank={(i+1) as 1|2|3} onClick={() => setSelected(e)} />
            ))}
          </div>
        </div>
      )}

      {/* Qidiruv & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
            style={{ background: 'rgb(var(--bg-elevated))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-primary))' }}
            placeholder="Ism, email, bo'lim bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {roles.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                roleFilter === r
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:border-amber-500/30 hover:text-amber-400'
              }`}>
              {r === 'ALL' ? 'Barchasi' : (roleLabels[r] || r)}
            </button>
          ))}
        </div>
      </div>

      {/* Jadval */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">Xodim</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                    style={{ color: sortKey === 'overall' ? COLORS.amber : 'rgb(var(--text-muted))' }}
                    onClick={() => handleSort('overall')}>
                  <span className="flex items-center justify-center gap-1">Umumiy <SortIcon k="overall" /></span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-violet-400 transition-colors hidden md:table-cell"
                    style={{ color: sortKey === 'creator' ? COLORS.violet : 'rgb(var(--text-muted))' }}
                    onClick={() => handleSort('creator')}>
                  <span className="flex items-center justify-center gap-1">Tashabbuskor <SortIcon k="creator" /></span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-sky-400 transition-colors hidden md:table-cell"
                    style={{ color: sortKey === 'approver' ? COLORS.sky : 'rgb(var(--text-muted))' }}
                    onClick={() => handleSort('approver')}>
                  <span className="flex items-center justify-center gap-1">Tasdiqlovchi <SortIcon k="approver" /></span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-emerald-400 transition-colors hidden md:table-cell"
                    style={{ color: sortKey === 'executor' ? COLORS.green : 'rgb(var(--text-muted))' }}
                    onClick={() => handleSort('executor')}>
                  <span className="flex items-center justify-center gap-1">Ijrochi <SortIcon k="executor" /></span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">Baho</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">Amal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[rgb(var(--text-muted))] text-sm">
                    Xodimlar topilmadi
                  </td>
                </tr>
              )}
              {filtered.map((entry, idx) => {
                const rating = getRatingLabel(entry.kpi.overallRate);
                const isTop = idx < 3 && !search && roleFilter === 'ALL';
                return (
                  <tr key={entry.user.id}
                    className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer"
                    style={{ borderColor: 'rgb(var(--border))' }}
                    onClick={() => setSelected(entry)}>
                    <td className="px-4 py-3">
                      {isTop
                        ? <span className="text-base">{['🥇','🥈','🥉'][idx]}</span>
                        : <span className="text-xs font-bold text-[rgb(var(--text-muted))]">{idx + 1}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${rating.color}20`, color: rating.color }}>
                          {entry.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--text-primary))] text-xs">{entry.user.fullName}</p>
                          <p className="text-[10px] text-[rgb(var(--text-muted))]">
                            {entry.user.department || (roleLabels[entry.user.role] || entry.user.role)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <MiniDonut rate={entry.kpi.overallRate} color={rating.color} size={48} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="text-xs font-bold" style={{ color: COLORS.violet }}>{entry.kpi.creator.successRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="text-xs font-bold" style={{ color: COLORS.sky }}>{entry.kpi.approver.onTimeRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="text-xs font-bold" style={{ color: COLORS.green }}>{entry.kpi.executor.onTimeRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: `${rating.color}15`, color: rating.color }}>
                        {rating.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(entry); }}
                        className="px-3 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:scale-105"
                        style={{ borderColor: `${rating.color}40`, color: rating.color, background: `${rating.color}08` }}>
                        Ko&apos;rish
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Eslatma */}
      <div className="glass-card p-4 flex items-start gap-3"
        style={{ borderColor: `${COLORS.amber}25`, background: `${COLORS.amber}06` }}>
        <Target size={15} className="mt-0.5 shrink-0" style={{ color: COLORS.amber }} />
        <p className="text-xs text-[rgb(var(--text-secondary))]">
          <span className="font-semibold" style={{ color: COLORS.amber }}>Eslatma:</span>{' '}
          KPI ko&apos;rsatkichlari haqiqiy ish kunlari bo&apos;yicha hisoblanadi. Umumiy baho —
          Tashabbuskor, Tasdiqlovchi va Ijrochi rollaridagi o&apos;rtacha ko&apos;rsatkich.
          Jadvalni saralash uchun ustun sarlavhasiga bosing.
        </p>
      </div>

      {selected && <KpiDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
