'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Document, ApprovalStep } from '@/types';
import { CheckCircle2, Clock, ArrowRight, FileText, Shield, PlayCircle, UserCheck, CheckCheck, CheckSquare, Square, FileSpreadsheet, Printer } from 'lucide-react';
import { formatDate, priorityConfig, statusConfig } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { BulkActionBar } from '@/components/common/BulkActionBar';

type TabType = 'in_approval' | 'approved' | 'in_execution' | 'completed';

export default function ApprovalsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [inApprovalDocs, setInApprovalDocs] = useState<Document[]>([]);
  const [approvedDocs, setApprovedDocs] = useState<Document[]>([]);
  const [inExecutionDocs, setInExecutionDocs] = useState<Document[]>([]);
  const [completedDocs, setCompletedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection & Bulk Action state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkApproveLoading, setBulkApproveLoading] = useState(false);

  // Tab holatini URL yoki sessionStorage dan olish
  const [tab, setTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('tab') as TabType;
      const validTabs: TabType[] = ['in_approval', 'approved', 'in_execution', 'completed'];
      if (fromUrl && validTabs.includes(fromUrl)) return fromUrl;
      const fromStorage = sessionStorage.getItem('approvals_active_tab') as TabType;
      if (fromStorage && validTabs.includes(fromStorage)) return fromStorage;
    }
    return 'in_approval';
  });

  const changeTab = (newTab: TabType) => {
    setTab(newTab);
    setSelectedIds([]);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('approvals_active_tab', newTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (docs: any[]) => {
    if (selectedIds.length === docs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(docs.map(d => d.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const confirmApprove = window.confirm(`Siz rostdan ham tanlangan ${selectedIds.length} ta hujjatni ommaviy tasdiqlamoqchimisiz?`);
    if (!confirmApprove) return;

    setBulkApproveLoading(true);
    try {
      const stepIdsToApprove: number[] = [];
      inApprovalDocs.forEach(d => {
        if (selectedIds.includes(d.id)) {
          const pStep = d.approvalSteps?.find((s: any) => s.stepStatus === 'PENDING' && (isAdmin || s.approverId === user?.id));
          if (pStep) stepIdsToApprove.push(pStep.id);
        }
      });

      if (stepIdsToApprove.length === 0) {
        alert("Siz tasdiqlashingiz kerak bo'lgan kutilayotgan bosqichlar topilmadi");
        return;
      }

      await api.post('/approvals/bulk-approve', { stepIds: stepIdsToApprove, comment: 'Ommaviy tasdiqlandi' });
      alert(`${stepIdsToApprove.length} ta hujjat muvaffaqiyatli tasdiqlandi!`);
      setSelectedIds([]);
      const res = await api.get('/approvals/tabs');
      setInApprovalDocs(res.data.data.inApproval || []);
      setApprovedDocs(res.data.data.approved || []);
      setInExecutionDocs(res.data.data.inExecution || []);
      setCompletedDocs(res.data.data.completed || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Ommaviy tasdiqlashda xatolik");
    } finally {
      setBulkApproveLoading(false);
    }
  };

  const handleExportExcel = (docs: any[]) => {
    const docsToExport = selectedIds.length > 0
      ? docs.filter(d => selectedIds.includes(d.id))
      : docs;

    const columns = [
      { header: 'Hujjat №', key: (d: any) => d.docNumber },
      { header: 'Hujjat Nomi', key: (d: any) => d.title },
      { header: 'Holati', key: (d: any) => statusConfig[d.status as keyof typeof statusConfig]?.label || d.status },
      { header: 'Ustuvorlik', key: (d: any) => priorityConfig[d.priority as keyof typeof priorityConfig]?.label || d.priority },
      { header: 'Yaratuvchi', key: (d: any) => d.creator?.fullName || '' },
      { header: 'Bo\'lim', key: (d: any) => d.creator?.department || '' },
      { header: 'Ijrochi', key: (d: any) => d.executor?.fullName || '' },
      { header: 'Yaratilgan Sana', key: (d: any) => formatDate(d.createdAt) },
    ];

    exportToExcel(`Tasdiqlashlar_${tab}`, columns, docsToExport);
  };

  const handleExportPDF = (docs: any[]) => {
    const docsToExport = selectedIds.length > 0
      ? docs.filter(d => selectedIds.includes(d.id))
      : docs;

    const columns = [
      { header: 'Hujjat №', key: (d: any) => d.docNumber },
      { header: 'Hujjat Nomi', key: (d: any) => d.title },
      { header: 'Holati', key: (d: any) => statusConfig[d.status as keyof typeof statusConfig]?.label || d.status },
      { header: 'Yaratuvchi', key: (d: any) => d.creator?.fullName || '' },
      { header: 'Ijrochi', key: (d: any) => d.executor?.fullName || '' },
      { header: 'Sana', key: (d: any) => formatDate(d.createdAt) },
    ];

    exportToPDF('Tasdiqlashlar Hisoboti', columns, docsToExport);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('tab') as TabType;
      const validTabs: TabType[] = ['in_approval', 'approved', 'in_execution', 'completed'];

      if (fromUrl && validTabs.includes(fromUrl)) {
        setTab(fromUrl);
        sessionStorage.setItem('approvals_active_tab', fromUrl);
      } else {
        const fromStorage = sessionStorage.getItem('approvals_active_tab') as TabType;
        if (fromStorage && validTabs.includes(fromStorage)) {
          setTab(fromStorage);
          const url = new URL(window.location.href);
          url.searchParams.set('tab', fromStorage);
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/approvals/tabs');
        const data = res.data.data;
        setInApprovalDocs(data.inApproval || []);
        setApprovedDocs(data.approved || []);
        setInExecutionDocs(data.inExecution || []);
        setCompletedDocs(data.completed || []);
      } catch (err) {
        console.error('Approvals fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const currentDocs =
    tab === 'in_approval'
      ? inApprovalDocs
      : tab === 'approved'
      ? approvedDocs
      : tab === 'in_execution'
      ? inExecutionDocs
      : completedDocs;

  const tabsConfig = [
    {
      id: 'in_approval' as TabType,
      label: 'Tasdiqlashda',
      icon: Clock,
      count: inApprovalDocs.length,
      badgeColor: 'rgb(245 158 11)',
      badgeBg: 'rgb(245 158 11 / 0.15)',
    },
    {
      id: 'approved' as TabType,
      label: 'Tasdiqlangan',
      icon: CheckCircle2,
      count: approvedDocs.length,
      badgeColor: 'rgb(52 211 153)',
      badgeBg: 'rgb(52 211 153 / 0.15)',
    },
    {
      id: 'in_execution' as TabType,
      label: 'Ijroda',
      icon: PlayCircle,
      count: inExecutionDocs.length,
      badgeColor: 'rgb(96 165 250)',
      badgeBg: 'rgb(96 165 250 / 0.15)',
    },
    {
      id: 'completed' as TabType,
      label: 'Yakunlangan',
      icon: CheckCheck,
      count: completedDocs.length,
      badgeColor: 'rgb(168 85 247)',
      badgeBg: 'rgb(168 85 247 / 0.15)',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">Tasdiqlashlar</h1>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Hujjatlar harakati va tasdiqlash jarayonlari nazorati
          </p>
        </div>

        <div>
          {isAdmin ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 px-3 py-1.5 rounded-full font-medium">
              <Shield size={14} className="text-violet-600 dark:text-violet-400" />
              <span>Admin: Barcha hujjatlar ko&apos;rsatilmoqda</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-medium">
              <UserCheck size={14} className="text-slate-500 dark:text-slate-400" />
              <span>Faqat sizga biriktirilgan hujjatlar</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex gap-1.5 p-1.5 rounded-xl w-max sm:w-fit border border-[rgb(var(--border))]" style={{ background: 'rgb(var(--bg-elevated))' }}>
          {tabsConfig.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => changeTab(t.id)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                  color: isActive ? '#D97706' : 'rgb(var(--text-secondary))',
                  border: isActive ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid transparent',
                }}
              >
                <Icon size={14} className="shrink-0" />
                <span className="inline-block">{t.label}</span>
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: isActive ? 'rgba(217, 119, 6, 0.25)' : t.badgeBg,
                    color: isActive ? '#D97706' : t.badgeColor,
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Export & Select All Bar */}
        {currentDocs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSelectAll(currentDocs)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              {selectedIds.length === currentDocs.length ? <CheckSquare size={14} className="text-amber-500" /> : <Square size={14} />}
              <span>{selectedIds.length === currentDocs.length ? 'Tanlovni bekor qilish' : 'Barchasini tanlash'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportExcel(currentDocs)}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportPDF(currentDocs)}
              className="px-3 py-1.5 rounded-xl border border-violet-500/30 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-3 relative">
        {currentDocs.length === 0 ? (
          <div className="glass-card p-12 text-center" style={{ color: 'rgb(var(--text-muted))' }}>
            <FileText size={42} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="font-semibold mb-1 text-base" style={{ color: 'rgb(var(--text-primary))' }}>
              {tab === 'in_approval'
                ? 'Tasdiqlashda hujjat yo‘q'
                : tab === 'approved'
                ? 'Tasdiqlangan hujjat yo‘q'
                : tab === 'in_execution'
                ? 'Ijroda hujjat yo‘q'
                : 'Yakunlangan hujjat yo‘q'}
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
              {isAdmin
                ? 'Hozirda ushbu holatdagi hujjatlar mavjud emas'
                : 'Sizga biriktirilgan ushbu holatdagi hujjatlar topilmadi'}
            </p>
          </div>
        ) : (
          currentDocs.map((doc) => {
            const pc = doc.priority ? priorityConfig[doc.priority as keyof typeof priorityConfig] : priorityConfig.NORMAL;
            const sc = statusConfig[doc.status as keyof typeof statusConfig];
            const currentPending = doc.approvalSteps?.find((s: any) => s.stepStatus === 'PENDING');
            const isMyTurn = currentPending?.approverId === user?.id;
            const isMyExecution = doc.executorId === user?.id;
            const isSelected = selectedIds.includes(doc.id);

            return (
              <div
                key={doc.id}
                className={`glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group transition-all hover:border-amber-500/30 ${
                  isSelected ? 'border-amber-500/60 bg-amber-500/[0.04]' : ''
                }`}
              >
                {/* Checkbox button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(doc.id);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare size={20} className="text-amber-500" />
                  ) : (
                    <Square size={20} className="text-slate-400 dark:text-slate-600" />
                  )}
                </button>

                {/* Icon box based on tab */}
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      tab === 'approved'
                        ? 'rgb(52 211 153 / 0.15)'
                        : tab === 'in_execution'
                        ? 'rgb(96 165 250 / 0.15)'
                        : tab === 'completed'
                        ? 'rgba(217, 119, 6, 0.15)'
                        : 'rgb(251 191 36 / 0.15)',
                    border: `1px solid ${
                      tab === 'approved'
                        ? 'rgb(52 211 153 / 0.3)'
                        : tab === 'in_execution'
                        ? 'rgb(96 165 250 / 0.3)'
                        : tab === 'completed'
                        ? 'rgba(217, 119, 6, 0.3)'
                        : 'rgb(251 191 36 / 0.3)'
                    }`,
                  }}
                >
                  <FileText
                    size={20}
                    style={{
                      color:
                        tab === 'approved'
                          ? 'rgb(52 211 153)'
                          : tab === 'in_execution'
                          ? 'rgb(96 165 250)'
                          : tab === 'completed'
                          ? '#D97706'
                          : 'rgb(251 191 36)',
                    }}
                  />
                </Link>

                {/* Main details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="doc-badge font-mono text-xs font-bold">
                      {doc.docNumber}
                    </span>

                    {doc.senderDocNumber && (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40">
                        № {doc.senderDocNumber}
                      </span>
                    )}

                    <div className="flex items-center gap-1 ml-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                      <span className={`text-xs ${pc.color}`}>{pc.label}</span>
                    </div>

                    {isMyTurn && tab === 'in_approval' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⚡ Sizning navbatingiz
                      </span>
                    )}

                    {isMyExecution && tab === 'in_execution' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        👤 Siz ijrochisiz
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-[rgb(var(--text-primary))] truncate text-sm sm:text-base group-hover:text-[rgb(var(--primary))] transition-colors">
                    {doc.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[rgb(var(--text-muted))]">
                    {doc.senderOrg && (
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">
                        Kimdan: {doc.senderOrg}
                      </span>
                    )}

                    {doc.recipientOrg && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Kimga: {doc.recipientOrg}
                      </span>
                    )}

                    <span>
                      Yaratuvchi: <span className="text-[rgb(var(--text-secondary))] font-medium">{doc.creator?.fullName || '—'}</span> ({doc.creator?.department || '—'})
                    </span>

                    {doc.executor && (
                      <span>
                        • Ijrochi: <span className="text-blue-400 font-medium">{doc.executor.fullName}</span>
                      </span>
                    )}
                  </div>

                  {/* Contextual status info */}
                  {tab === 'in_approval' && currentPending && (
                    <p className="text-xs mt-1 font-medium" style={{ color: 'rgb(251 191 36)' }}>
                      ⏳ {currentPending.stepOrder}-bosqich kutilmoqda: {currentPending.approver?.fullName || 'Belgilanmagan'}
                    </p>
                  )}

                  {tab === 'approved' && (
                    <p className="text-xs mt-1 text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Barcha tasdiqlash bosqichlaridan muvaffaqiyatli o&apos;tgan
                    </p>
                  )}

                  {tab === 'in_execution' && (
                    <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                      <span className="text-blue-400 font-medium">
                        ⚙️ Ijro jarayonida
                      </span>
                      {doc.overallDeadline && (
                        <span className="text-slate-400">
                          ⏰ Yakuniy muddat: <span className="text-slate-200">{formatDate(doc.overallDeadline)}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {tab === 'completed' && (
                    <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                      <span className="text-violet-400 font-medium flex items-center gap-1">
                        <CheckCheck size={13} /> Hujjat ijrosi to‘liq yakunlangan
                      </span>
                      {doc.completedAt && (
                        <span className="text-slate-400">
                          • Yakunlangan sana: <span className="text-slate-200">{formatDate(doc.completedAt)}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side */}
                <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${sc?.bg || ''} ${sc?.color || ''}`}>
                    {sc?.icon} {sc?.label}
                  </span>
                  <p className="text-xs mt-2 text-[rgb(var(--text-muted))]">
                    {formatDate(doc.createdAt)}
                  </p>
                </div>

                <ArrowRight
                  size={16}
                  className="hidden sm:block flex-shrink-0 text-[rgb(var(--text-muted))] group-hover:translate-x-1 group-hover:text-[rgb(var(--primary))] transition-all"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={currentDocs.length}
        onClear={() => setSelectedIds([])}
        onSelectAll={() => toggleSelectAll(currentDocs)}
        isAllSelected={selectedIds.length === currentDocs.length && currentDocs.length > 0}
        onBulkApprove={tab === 'in_approval' ? handleBulkApprove : undefined}
        onExportExcel={() => handleExportExcel(currentDocs)}
        onExportPDF={() => handleExportPDF(currentDocs)}
        approveLoading={bulkApproveLoading}
        approveLabel="Barchasini tasdiqlash"
      />
    </div>
  );
}
