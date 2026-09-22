'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import api, { getFileUrl } from '@/lib/api';
import { Document, DocumentStatus, Priority, DocumentType } from '@/types';
import {
  FileText, Plus, Search, ChevronLeft, ChevronRight,
  Eye, Trash2, Paperclip, Download, X, Clock, Building2,
} from 'lucide-react';
import {
  statusConfig, priorityConfig, docTypeConfig, formatDate,
  getDeadlineStatus, fixEncoding, hasPermission,
} from '@/lib/utils';
import toast from 'react-hot-toast';

const docTypeTabs: { value: DocumentType | ''; label: string; icon: string; desc: string }[] = [
  { value: '', label: 'Barchasi', icon: '📑', desc: 'Barcha aylanmadagi hujjatlar' },
  { value: 'INCOMING', label: 'Kiruvchi xatlar', icon: '📥', desc: 'Tashqi tashkilotlardan kelgan xatlar' },
  { value: 'OUTGOING', label: 'Chiquvchi xatlar', icon: '📤', desc: 'Tashqariga yuborilgan rasmiy xatlar' },
  { value: 'INTERNAL', label: 'Ichki hujjatlar', icon: '📄', desc: 'Xizmat xatlari va ichki arizalar' },
];

const statusTabs: { value: DocumentStatus | ''; label: string; icon?: string }[] = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'IN_APPROVAL', label: 'Tasdiqlashda', icon: '⏳' },
  { value: 'APPROVED', label: 'Tasdiqlandi', icon: '✅' },
  { value: 'IN_EXECUTION', label: 'Ijroda', icon: '⚙️' },
  { value: 'COMPLETED', label: 'Yakunlangan', icon: '🏁' },
  { value: 'EXPIRED', label: 'Muddati o\'tgan', icon: '⚠️' },
  { value: 'REJECTED', label: 'Rad etildi', icon: '❌' },
  { value: 'DRAFT', label: 'Qoralama', icon: '📝' },
];

const priorityOptions: { value: Priority | ''; label: string }[] = [
  { value: '', label: 'Barcha ustuvorlik' },
  { value: 'LOW', label: 'Past ustuvorlik' },
  { value: 'NORMAL', label: 'Oddiy ustuvorlik' },
  { value: 'HIGH', label: 'Yuqori ustuvorlik' },
  { value: 'URGENT', label: 'Shoshilinch' },
];

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats] = useState<{
    total: number;
    byDocType?: { incoming: number; outgoing: number; internal: number };
  } | null>(null);

  // Document type tab state
  const [docType, setDocTypeState] = useState<DocumentType | ''>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('type') as DocumentType | '';
      if (fromUrl) return fromUrl;
      const fromStorage = sessionStorage.getItem('documents_active_doctype') as DocumentType | '';
      if (fromStorage) return fromStorage;
    }
    return '';
  });

  // Status tabini URL yoki sessionStorage dan olish
  const [status, setStatusState] = useState<DocumentStatus | ''>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('status') as DocumentStatus | '';
      if (fromUrl) return fromUrl;
      const fromStorage = sessionStorage.getItem('documents_active_status') as DocumentStatus | '';
      if (fromStorage) return fromStorage;
    }
    return '';
  });

  const handleDocTypeChange = (newType: DocumentType | '') => {
    setDocTypeState(newType);
    setPage(1);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('documents_active_doctype', newType);
      const url = new URL(window.location.href);
      if (newType) {
        url.searchParams.set('type', newType);
      } else {
        url.searchParams.delete('type');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleStatusChange = (newStatus: DocumentStatus | '') => {
    setStatusState(newStatus);
    setPage(1);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('documents_active_status', newStatus);
      const url = new URL(window.location.href);
      if (newStatus) {
        url.searchParams.set('status', newStatus);
      } else {
        url.searchParams.delete('status');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/documents/stats');
      setStats(res.data.data);
    } catch {
      // stats error fallback
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (docType) params.set('docType', docType);
      params.set('page', String(page));
      params.set('limit', '10');

      const response = await api.get(`/documents?${params}`);
      setDocuments(response.data.data);
      setMeta(response.data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // URL da search parametri o'zgarganda (Navbar orqali qidiruv berilganda) search state ni yangilash
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || '';
    setSearch(q);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority, docType, page]);

  const handleDelete = async (id: number) => {
    if (!confirm('Hujjatni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Hujjat o\'chirildi');
      fetchDocuments();
      fetchStats();
      useNotificationStore.getState().fetchNotifications();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const hasActiveFilters = Boolean(search || priority || status || docType);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tight">Hujjatlar Reestri</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.3)] font-semibold">
              Jami: {meta.total} ta
            </span>
          </div>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
            Kiruvchi, chiquvchi va ichki xatlarning yagona ro&apos;yxatga olish jurnali va ijro monitoringi
          </p>
        </div>

        {(user?.role === 'ADMIN' || hasPermission(user, 'DOC_CREATE')) && (
          <Link
            href="/dashboard/documents/new"
            className="btn-primary flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Yangi hujjat ro&apos;yxatga olish</span>
          </Link>
        )}
      </div>

      {/* Main Document Type Tabs (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {docTypeTabs.map((tab) => {
          const active = docType === tab.value;
          let count = stats?.total || 0;
          if (tab.value === 'INCOMING') count = stats?.byDocType?.incoming || 0;
          else if (tab.value === 'OUTGOING') count = stats?.byDocType?.outgoing || 0;
          else if (tab.value === 'INTERNAL') count = stats?.byDocType?.internal || 0;

          return (
            <button
              key={tab.value}
              onClick={() => handleDocTypeChange(tab.value)}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                active
                  ? 'bg-[rgb(var(--bg-surface))] border-[rgb(var(--primary))] shadow-md shadow-[rgb(var(--primary)/0.08)] ring-1 ring-[rgb(var(--primary)/0.3)]'
                  : 'bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] hover:bg-[rgb(var(--bg-elevated))]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                <span className="text-lg sm:text-xl">{tab.icon}</span>
                <span
                  className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                    active
                      ? 'bg-[rgb(var(--primary))] text-black font-extrabold'
                      : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))]'
                  }`}
                >
                  {count} ta
                </span>
              </div>
              <div>
                <p className={`text-xs sm:text-sm font-bold leading-tight ${active ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--text-primary))]'}`}>
                  {tab.label}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] mt-0.5 line-clamp-1">
                  {tab.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Status Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-[rgb(var(--border))] text-xs no-scrollbar min-w-0">
        {statusTabs.map((tab) => {
          const active = status === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.35)] shadow-sm font-semibold'
                  : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] border border-transparent'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card p-2.5 sm:p-3 flex flex-col sm:flex-row items-center gap-2.5 border border-[rgb(var(--border))]">
        {/* Search input */}
        <div className="relative w-full flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[rgb(var(--text-muted))]"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Hujjat nomi, raqami yoki tashkilot..."
            className="input-field !pl-10 !pr-9 !py-2.5 rounded-xl text-xs sm:text-sm w-full"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as Priority | '');
              setPage(1);
            }}
            className="select-field !py-2.5 px-3 rounded-xl text-xs sm:text-sm flex-1 sm:w-44"
          >
            {priorityOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">
                {o.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setPriority('');
                handleStatusChange('');
                handleDocTypeChange('');
              }}
              className="text-xs text-[rgb(var(--text-muted))] hover:text-rose-500 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 transition-all whitespace-nowrap shrink-0"
              title="Barcha filtrlarni tozalash"
            >
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Main Table View — Exactly reflecting the physical register logbook */}
      <div className="glass-card overflow-hidden border border-[rgb(var(--border))]">
        {loading ? (
          <div className="flex items-center justify-center h-56">
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText size={44} className="mx-auto mb-3 text-[rgb(var(--text-muted))]" />
            <p className="font-semibold text-base text-[rgb(var(--text-primary))]">Hech qanday hujjat topilmadi</p>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-1 max-w-sm mx-auto">
              Qidiruv so&apos;rovini yoki tanlangan turni o&apos;zgartirib ko&apos;ring
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('');
                  setPriority('');
                  handleStatusChange('');
                  handleDocTypeChange('');
                }}
                className="btn-ghost text-xs mt-4 py-1.5 px-3"
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>
        ) : (
          <div className="w-full">

            {/* ── MOBILE CARD VIEW (< 640px) ── */}
            <div className="mobile-card-list sm:hidden">
              {documents.map((doc, idx) => {
                const sc = statusConfig[doc.status];
                const dt = doc.docType || 'INTERNAL';
                const dtc = docTypeConfig[dt] || docTypeConfig.INTERNAL;
                const itemNumber = (page - 1) * 10 + idx + 1;
                const totalAttachments = (doc.attachments?.length || 0) + (doc.fileUrl ? 1 : 0);
                const org = dt === 'INCOMING' ? doc.senderOrg
                  : dt === 'OUTGOING' ? doc.recipientOrg
                  : doc.creator?.department;
                return (
                  <div
                    key={doc.id}
                    className="mobile-doc-card"
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                  >
                    {/* satir 1: raqam + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-[rgb(var(--text-muted))] shrink-0">#{itemNumber}</span>
                        <span className="doc-badge font-mono text-[11px] truncate max-w-[110px]">{doc.docNumber}</span>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${dtc.bg} ${dtc.color} ${dtc.border}`}>
                          <span>{dtc.icon}</span><span>{dtc.shortLabel}</span>
                        </span>
                      </div>
                      <span className={`badge ${sc.bg} ${sc.color} text-[10px] font-semibold py-0.5 px-2 shrink-0 whitespace-nowrap`}>
                        {sc.icon && <span className="mr-0.5">{sc.icon}</span>}{sc.label}
                      </span>
                    </div>
                    {/* satir 2: sarlavha */}
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))] line-clamp-2 leading-snug">
                      {fixEncoding(doc.title)}
                    </p>
                    {/* satir 3: tashkilot + sana */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[rgb(var(--text-muted))]">
                      {org && (
                        <div className="flex items-center gap-1 min-w-0">
                          <Building2 size={11} className="shrink-0" />
                          <span className="truncate">{org}</span>
                        </div>
                      )}
                      <span className="shrink-0">{formatDate(doc.createdAt)}</span>
                    </div>
                    {/* satir 4: kategoriya + amallar */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[rgb(var(--border))]">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] font-medium truncate max-w-[100px]">
                          {doc.category}
                        </span>
                        {totalAttachments > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-semibold shrink-0">
                            <Paperclip size={10} /> {totalAttachments}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {doc.fileUrl && (
                          <a href={getFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-cyan-500 border border-[rgb(var(--border))] transition-all"
                            title="Yuklab olish">
                            <Download size={13} />
                          </a>
                        )}
                        {(user?.role === 'ADMIN' || hasPermission(user, 'DOC_DELETE') ||
                          (doc.creatorId === user?.id && ['DRAFT', 'REJECTED'].includes(doc.status))) && (
                          <button onClick={() => handleDelete(doc.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-rose-500 border border-[rgb(var(--border))] transition-all"
                            title="O'chirish">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DESKTOP TABLE VIEW (>= 640px) ── */}
            <div className="hidden sm:block table-responsive">
              <table className="data-table w-full text-xs sm:text-sm" style={{ minWidth: '780px' }}>
                <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider bg-[rgb(var(--bg-elevated)/0.5)]">
                  <th className="py-3 px-2 w-[4%] text-center">№</th>
                  <th className="py-3 px-3 w-[18%]">Hujjat raqamlari</th>
                  <th className="py-3 px-3 w-[18%]">Tashkilot</th>
                  <th className="py-3 px-3 w-[28%]">Qisqacha mazmuni</th>
                  <th className="py-3 px-3 w-[9%] whitespace-nowrap">Sana</th>
                  <th className="py-3 px-3 w-[13%]">Mas&apos;ul / Ijrochi</th>
                  <th className="py-3 px-3 w-[10%]">Holat</th>
                  <th className="py-3 px-3 w-[8%] text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {documents.map((doc, idx) => {
                  const sc = statusConfig[doc.status];
                  const dt = doc.docType || 'INTERNAL';
                  const dtc = docTypeConfig[dt] || docTypeConfig.INTERNAL;
                  const itemNumber = (page - 1) * 10 + idx + 1;
                  const totalAttachments = (doc.attachments?.length || 0) + (doc.fileUrl ? 1 : 0);

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                      className="cursor-pointer group hover:bg-[rgb(var(--bg-elevated)/0.6)] transition-colors"
                    >
                      {/* 1. Tartib raqami (№) */}
                      <td className="py-3 px-2 text-center font-mono text-xs font-semibold text-[rgb(var(--text-muted))]">
                        {itemNumber}
                      </td>

                      {/* 2. Hujjat raqamlari (Bizning № + Tashkilot Chiquvchi №) */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="doc-badge font-mono font-bold text-[11px] whitespace-nowrap">
                              {doc.docNumber}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border font-semibold whitespace-nowrap ${dtc.bg} ${dtc.color} ${dtc.border}`}
                            >
                              <span>{dtc.icon}</span>
                              <span>{dtc.shortLabel}</span>
                            </span>
                          </div>

                          {/* Yuboruvchi xat raqami badge */}
                          {dt === 'INCOMING' && doc.senderDocNumber && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 w-fit whitespace-nowrap shrink-0 shadow-xs" title="Chiquvchi xat raqami">
                              <span className="text-sky-600 dark:text-sky-400 font-extrabold">№</span>
                              <span className="whitespace-nowrap text-sky-900 dark:text-sky-100">{doc.senderDocNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Tashkilot (Kimdan / Kimga) */}
                      <td className="py-3 px-3">
                        {dt === 'INCOMING' ? (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--text-primary))]">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">Kimdan</span>
                              <span className="truncate">{doc.senderOrg || 'Noma\'lum tashkilot'}</span>
                            </div>
                            {doc.senderDate && (
                              <span className="text-xs text-[rgb(var(--text-muted))] pl-1">
                                Sana: {formatDate(doc.senderDate)}
                              </span>
                            )}
                          </div>
                        ) : dt === 'OUTGOING' ? (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--text-primary))]">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">Kimga</span>
                              <span className="truncate">{doc.recipientOrg || 'Noma\'lum tashkilot'}</span>
                            </div>
                            {doc.deliveryMethod && (
                              <span className="text-xs text-[rgb(var(--text-muted))] truncate pl-1">
                                {doc.deliveryMethod}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--text-primary))]">
                              <Building2 size={13} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{doc.creator?.department || 'Discover Invest'}</span>
                            </div>
                            <span className="text-xs text-[rgb(var(--text-muted))] pl-1">Ichki xizmat</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Qisqacha mazmuni */}
                      <td className="py-3 px-3 min-w-0">
                        <div className="flex flex-col gap-1 max-w-full">
                          <p className="font-semibold text-xs sm:text-sm text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--primary))] transition-colors line-clamp-1">
                            {fixEncoding(doc.title)}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] px-2 py-0.5 rounded bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] font-medium">
                              {doc.category}
                            </span>

                            {totalAttachments > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-semibold shrink-0">
                                <Paperclip size={10} /> {totalAttachments} ta fayl
                              </span>
                            )}

                            {doc.parentDoc && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-medium shrink-0">
                                🔗 Javob xati ({doc.parentDoc.docNumber})
                              </span>
                            )}
                          </div>

                          {doc.resolution && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 italic line-clamp-1 mt-0.5 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15">
                              Ko&apos;rsatma: &quot;{doc.resolution}&quot;
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 5. Sana */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-xs text-[rgb(var(--text-secondary))] font-medium">
                          {formatDate(doc.createdAt)}
                        </span>
                      </td>

                      {/* 6. Mas'ul / Ijrochi */}
                      <td className="py-3 px-3 min-w-0">
                        {doc.executor ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center shrink-0">
                              {doc.executor.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[rgb(var(--text-primary))] truncate">
                                {doc.executor.fullName}
                              </p>
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                Ijrochi
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/20 font-bold text-xs flex items-center justify-center shrink-0">
                              {doc.creator?.fullName?.charAt(0).toUpperCase() || '—'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[rgb(var(--text-primary))] truncate">
                                {doc.creator?.fullName || '—'}
                              </p>
                              <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">
                                {doc.creator?.department || 'Mas\'ul'}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 7. Holat */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`badge ${sc.bg} ${sc.color} text-[11px] font-semibold py-1 px-2.5 shadow-xs`}>
                          {sc.icon && <span className="mr-1">{sc.icon}</span>}
                          {sc.label}
                        </span>
                      </td>

                      {/* 8. Amallar */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {doc.fileUrl && (
                            <a
                              href={getFileUrl(doc.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-cyan-500 hover:bg-cyan-500/15 border border-[rgb(var(--border))] transition-all"
                              title="Faylni yuklash"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <Link
                            href={`/dashboard/documents/${doc.id}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-amber-500 hover:bg-amber-500/15 border border-[rgb(var(--border))] transition-all"
                            title="Ko'rish"
                          >
                            <Eye size={14} />
                          </Link>
                          {(user?.role === 'ADMIN' ||
                            hasPermission(user, 'DOC_DELETE') ||
                            (doc.creatorId === user?.id && ['DRAFT', 'REJECTED'].includes(doc.status))) && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] hover:text-rose-500 hover:bg-rose-500/15 border border-[rgb(var(--border))] transition-all"
                                title="O'chirish"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-[rgb(var(--border))]">
            <span className="hidden sm:block text-xs text-[rgb(var(--text-muted))]">
              {meta.total} tadan {(page - 1) * 10 + 1}–{Math.min(page * 10, meta.total)} ko&apos;rsatilmoqda
            </span>
            <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-ghost py-1.5 px-2.5 text-xs disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.25)]">
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-ghost py-1.5 px-2.5 text-xs disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
