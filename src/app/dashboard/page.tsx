'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { DocumentStats, DocumentType, Document } from '@/types';
import { FileText, CheckCircle, XCircle, Clock, AlertCircle, PlusCircle, ArrowRight, TrendingUp, Building2 } from 'lucide-react';
import { formatDate, docTypeConfig } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<unknown[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Faqat ADMIN bosh sahifani ko'radi. Boshqa rollar o'z ish maydoniga yo'naltiriladi.
    if (user.role !== 'ADMIN') {
      if (user.role === 'APPROVER') {
        router.replace('/dashboard/approvals');
      } else {
        router.replace('/dashboard/documents');
      }
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, docsRes, approvalsRes] = await Promise.all([
          api.get('/documents/stats'),
          api.get('/documents?limit=5'),
          api.get('/approvals/my'),
        ]);
        setStats(statsRes.data.data);
        setRecentDocs(docsRes.data.data);
        setPendingApprovals(approvalsRes.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  const statCards = [
    { label: 'Jami hujjatlar', value: stats?.total ?? 0, icon: FileText, color: 'violet', gradient: 'from-violet-500/20 to-violet-500/5' },
    { label: 'Tasdiqlashda', value: stats?.inApproval ?? 0, icon: Clock, color: 'amber', gradient: 'from-amber-500/20 to-amber-500/5' },
    { label: 'Tasdiqlandi', value: stats?.approved ?? 0, icon: CheckCircle, color: 'emerald', gradient: 'from-emerald-500/20 to-emerald-500/5' },
    { label: 'Rad etildi', value: stats?.rejected ?? 0, icon: XCircle, color: 'red', gradient: 'from-red-500/20 to-red-500/5' },
    { label: 'Yakunlandi', value: stats?.completed ?? 0, icon: TrendingUp, color: 'blue', gradient: 'from-blue-500/20 to-blue-500/5' },
    { label: 'Muddati o\'tdi', value: stats?.expired ?? 0, icon: AlertCircle, color: 'orange', gradient: 'from-orange-500/20 to-orange-500/5' },
  ];

  const colorMap: Record<string, string> = {
    violet: 'rgb(139 92 246)',
    amber: 'rgb(251 191 36)',
    emerald: 'rgb(52 211 153)',
    red: 'rgb(248 113 113)',
    blue: 'rgb(96 165 250)',
    orange: 'rgb(251 146 60)',
  };

  if (loading || (user && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">
            Xush kelibsiz, {user?.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
            {user?.department} • {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {(user?.role === 'INITIATOR' || user?.role === 'ADMIN') && (
          <Link href="/dashboard/documents/new" className="btn-primary shrink-0">
            <PlusCircle size={16} />
            Yangi hujjat
          </Link>
        )}
      </div>

      {/* Correspondence Logbook Stream Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/documents?docType=INCOMING"
          className="glass-card p-5 border-sky-500/30 hover:border-sky-500/60 bg-sky-500/[0.04] hover:bg-sky-500/[0.08] transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-sky-500/15 border border-sky-500/25 shrink-0 group-hover:scale-105 transition-transform">
              📥
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">Kiruvchi xatlar</p>
              <div className="text-2xl font-bold text-white mt-0.5">
                {stats?.byDocType?.incoming ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Tashkilotlardan kelgan</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-sky-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </Link>

        <Link
          href="/dashboard/documents?docType=OUTGOING"
          className="glass-card p-5 border-amber-500/30 hover:border-amber-500/60 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-amber-500/15 border border-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
              📤
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Chiquvchi xatlar</p>
              <div className="text-2xl font-bold text-white mt-0.5">
                {stats?.byDocType?.outgoing ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Tashkilotlarga yuborilgan</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </Link>

        <Link
          href="/dashboard/documents?docType=INTERNAL"
          className="glass-card p-5 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-500/15 border border-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
              📄
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Ichki hujjatlar</p>
              <div className="text-2xl font-bold text-white mt-0.5">
                {stats?.byDocType?.internal ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Ichki buyruq va xizmat</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const color = colorMap[card.color];
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: color + '20', border: `1px solid ${color}30` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-1">{card.value}</div>
              <div className="text-sm text-[rgb(var(--text-muted))]">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-6">Statuslar bo'yicha</h2>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Tasdiqlashda', value: stats.inApproval, color: '#f59e0b' },
                      { name: 'Ijroda', value: stats.inExecution, color: '#3b82f6' },
                      { name: 'Tasdiqlandi', value: stats.approved, color: '#10b981' },
                      { name: 'Rad etildi', value: stats.rejected, color: '#ef4444' },
                      { name: 'Yakunlandi', value: stats.completed, color: '#8b5cf6' },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[{ name: 'Tasdiqlashda', value: stats.inApproval, color: '#f59e0b' },
                      { name: 'Ijroda', value: stats.inExecution, color: '#3b82f6' },
                      { name: 'Tasdiqlandi', value: stats.approved, color: '#10b981' },
                      { name: 'Rad etildi', value: stats.rejected, color: '#ef4444' },
                      { name: 'Yakunlandi', value: stats.completed, color: '#8b5cf6' }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgb(var(--bg-surface))',
                      border: '1px solid rgb(var(--border))',
                      color: 'rgb(var(--text-primary))',
                      borderRadius: '12px',
                      boxShadow: 'var(--card-shadow)',
                    }}
                    itemStyle={{ color: 'rgb(var(--text-primary))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-base font-semibold mb-6" style={{ color: 'rgb(var(--text-primary))' }}>
              Kategoriyalar bo'yicha
            </h2>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'rgb(var(--text-muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgb(var(--text-muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(217, 119, 6, 0.06)' }}
                    contentStyle={{
                      background: 'rgb(var(--bg-surface))',
                      border: '1px solid rgb(var(--border))',
                      color: 'rgb(var(--text-primary))',
                      borderRadius: '12px',
                      boxShadow: 'var(--card-shadow)',
                    }}
                    itemStyle={{ color: 'rgb(var(--text-primary))' }}
                  />
                  <Bar dataKey="value" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Two column layout for lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              So'nggi hujjatlar
            </h2>
            <Link href="/dashboard/documents" className="text-xs hover:underline" style={{ color: 'rgb(var(--primary))' }}>
              Barchasi →
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'rgb(var(--text-muted))' }}>
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Hujjatlar mavjud emas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(recentDocs as Array<Document>).map((doc) => {
                const dt = docTypeConfig[doc.docType || 'INTERNAL'];
                const org = doc.senderOrg || doc.recipientOrg;
                return (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group border border-transparent hover:border-[rgb(var(--border))]"
                    style={{ background: 'rgb(var(--bg-elevated))' }}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base border ${dt.bg} ${dt.border}`}
                    >
                      {dt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-300">{doc.docNumber}</span>
                        {org && (
                          <span className="text-[11px] text-amber-400/90 truncate flex items-center gap-1">
                            <Building2 size={11} className="shrink-0" />
                            {org}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium truncate text-white mt-0.5">{doc.title}</div>
                      <div className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                        {dt.shortLabel} • {formatDate(doc.createdAt)}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'rgb(var(--text-muted))' }} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Approvals (Approver / Admin) */}
        {(user?.role === 'APPROVER' || user?.role === 'ADMIN') && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                Mening tasdiqlashlarim
              </h2>
              <span
                className="badge"
                style={{
                  background: 'rgba(217, 119, 6, 0.12)',
                  color: '#D97706',
                  borderColor: 'rgba(217, 119, 6, 0.3)',
                }}
              >
                {pendingApprovals.length} kutmoqda
              </span>
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'rgb(var(--text-muted))' }}>
                <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Barcha tasdiqlashlar yakunlandi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user?.role === 'ADMIN' ? (
                  // Admin: API returns Document[]
                  (pendingApprovals as Array<{
                    id: number;
                    docNumber: string;
                    title: string;
                    creator: { fullName: string };
                    approvalSteps: Array<{ stepOrder: number; stepStatus: string }>;
                  }>).slice(0, 4).map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/dashboard/documents/${doc.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group border border-transparent hover:border-[rgb(var(--border))]"
                      style={{
                        background: 'rgb(var(--bg-elevated))',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: 'rgba(217, 119, 6, 0.2)', color: '#D97706' }}
                      >
                        {doc.approvalSteps?.find(s => s.stepStatus === 'PENDING')?.stepOrder ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>{doc.title}</div>
                        <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                          {doc.creator.fullName} • {doc.docNumber}
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'rgb(var(--text-muted))' }} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))
                ) : (
                  // Regular user: API returns ApprovalStep[]
                  (pendingApprovals as Array<{
                    id: number;
                    stepOrder: number;
                    stepDeadline?: string;
                    document: { id: number; docNumber: string; title: string; creator: { fullName: string } };
                  }>).slice(0, 4).map((step) => step.document ? (
                    <Link
                      key={step.id}
                      href={`/dashboard/documents/${step.document.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group border border-transparent hover:border-[rgb(var(--border))]"
                      style={{
                        background: 'rgb(var(--bg-elevated))',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: 'rgba(217, 119, 6, 0.2)', color: '#D97706' }}
                      >
                        #{step.stepOrder}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>{step.document.title}</div>
                        <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                          {step.document.creator.fullName} • {step.stepDeadline ? formatDate(step.stepDeadline) : 'Muddat yo\'q'}
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'rgb(var(--text-muted))' }} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : null)
                )}
              </div>
            )}
            <Link href="/dashboard/approvals" className="btn-ghost w-full mt-4 text-sm py-2">
              Barchasini ko'rish
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
