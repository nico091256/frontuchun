'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  ClipboardList, Search, Filter, User, FileText,
  Calendar, ChevronLeft, ChevronRight, X, RefreshCw,
  Activity, Shield, CheckCircle, XCircle, Clock,
  Zap, Upload, Trash2, AlertTriangle, RotateCcw, Eye,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { FileSpreadsheet, Printer } from 'lucide-react';
import Link from 'next/link';

interface AuditLog {
  id: number;
  actionName: string;
  description: string | null;
  createdAt: string;
  performedBy: {
    id: number;
    fullName: string;
    email: string;
    department: string | null;
    role: string;
  } | null;
  document: {
    id: number;
    docNumber: string;
    title: string;
    docType: string;
    status: string;
  } | null;
}

interface AuditUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department: string | null;
}

const ACTION_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  CREATED:           { label: "Yaratildi",        color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",     border: "border-blue-200 dark:border-blue-500/25",    icon: FileText },
  SUBMITTED:         { label: "Yuborildi",         color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/25", icon: Upload },
  DIRECT_EXECUTION:  { label: "Ijroga o'tdi",      color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/25",  icon: Zap },
  EXECUTED:          { label: "Ijro yakunlandi",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25", icon: CheckCircle },
  RESUBMITTED:       { label: "Qayta yuborildi",   color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/25", icon: RotateCcw },
  UPDATED:           { label: "Tahrirlandi",       color: "text-slate-600 dark:text-slate-400",  bg: "bg-slate-50 dark:bg-slate-800",      border: "border-slate-200 dark:border-slate-700",     icon: Activity },
  COMPLETED:         { label: "Yakunlandi",        color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25", icon: CheckCircle },
  ALL_APPROVED:      { label: "Hammasi tasdiqlandi", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25", icon: CheckCircle },
  ADMIN_CANCEL:      { label: "Bekor qilindi",     color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-500/10",       border: "border-red-200 dark:border-red-500/25",      icon: XCircle },
  FILE_UPLOADED:     { label: "Fayl yuklandi",     color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",     border: "border-blue-200 dark:border-blue-500/25",    icon: Upload },
  FILE_ATTACHED:     { label: "Fayl biriktirildi", color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",     border: "border-blue-200 dark:border-blue-500/25",    icon: Upload },
  FILE_VIEWED:       { label: "Fayl ko'rildi",     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/25", icon: Eye },
  EXECUTOR_VIEWED:   { label: "Ijrochi ko'rib chiqdi", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/25", icon: Eye },
  FILE_DELETED:      { label: "Fayl o'chirildi",   color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-500/10",       border: "border-red-200 dark:border-red-500/25",      icon: Trash2 },
  DEADLINE_EXTENDED: { label: "Muddat uzaytirildi", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/25",  icon: Clock },
  STEP_DEADLINE_EXTENDED: { label: "Bosqich muddati uzaytirildi", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/25", icon: Clock },
  STEP_REASSIGNED:   { label: "Tasdiqlovchi o'zgartirildi", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/25", icon: User },
  ROLLBACK_TO_APPROVAL: { label: "Qaytarildi", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/25", icon: RotateCcw },
};

const getActionMeta = (actionName: string) => {
  if (ACTION_META[actionName]) return ACTION_META[actionName];
  if (actionName.startsWith('APPROVED_STEP_')) return { label: `Tasdiqlandi (${actionName.replace('APPROVED_STEP_', '')} bosqich)`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25", icon: CheckCircle };
  if (actionName.startsWith('REJECTED_STEP_')) return { label: `Rad etildi (${actionName.replace('REJECTED_STEP_', '')} bosqich)`, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/25", icon: XCircle };
  return { label: actionName, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700", icon: AlertTriangle };
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/25',
  INITIATOR: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25',
  APPROVER: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25',
  EXECUTOR: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25',
};
const ROLE_LABELS: Record<string, string> = { ADMIN: 'Admin', INITIATOR: 'Tashabbuskor', APPROVER: 'Tasdiqlovchi', EXECUTOR: 'Ijrochi' };

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AuditUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAction, setSelectedAction] = useState('EXECUTOR_VIEWED');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [availableActions, setAvailableActions] = useState<{ action: string; count: number }[]>([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(selectedUserId && { userId: selectedUserId }),
        ...(selectedAction && { actionName: selectedAction }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await api.get(`/admin/audit-log?${params}`);
      setLogs(res.data.data);
      setTotal(res.data.meta?.total || 0);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedUserId, selectedAction, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.data || [])).catch(() => {});
    api.get('/admin/audit-log/actions').then(res => setAvailableActions(res.data.data || [])).catch(() => {});
  }, []);

  const clearFilters = () => {
    setSearch('');
    setSelectedUserId('');
    setSelectedAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || selectedUserId || selectedAction || dateFrom || dateTo;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2.5">
            <ClipboardList size={22} className="text-violet-500" />
            Faoliyat logi (Audit Trail)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tizimda amalga oshirilgan barcha harakatlar — {total} ta yozuv
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const columns = [
                { header: 'ID', key: (l: any) => l.id },
                { header: 'Amal', key: (l: any) => getActionMeta(l.actionName)?.label || l.actionName },
                { header: 'Tavsifi', key: (l: any) => l.description || '' },
                { header: 'Xodim', key: (l: any) => l.performedBy?.fullName || 'Tizim' },
                { header: 'Bo\'lim', key: (l: any) => l.performedBy?.department || '' },
                { header: 'Hujjat №', key: (l: any) => l.document?.docNumber || '' },
                { header: 'Sana', key: (l: any) => formatDateTime(l.createdAt) },
              ];
              exportToExcel('Audit_Log', columns, logs);
            }}
            className="px-3 py-2 rounded-xl border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>
          <button
            onClick={() => {
              const columns = [
                { header: 'Amal', key: (l: any) => getActionMeta(l.actionName)?.label || l.actionName },
                { header: 'Tavsifi', key: (l: any) => l.description || '' },
                { header: 'Xodim', key: (l: any) => l.performedBy?.fullName || 'Tizim' },
                { header: 'Hujjat №', key: (l: any) => l.document?.docNumber || '' },
                { header: 'Sana', key: (l: any) => formatDateTime(l.createdAt) },
              ];
              exportToPDF('Faoliyat Logi Hisoboti', columns, logs);
            }}
            className="px-3 py-2 rounded-xl border border-violet-500/30 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>PDF</span>
          </button>
          <button
            onClick={fetchLogs}
            className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            Yangilash
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Amal tavsifi, hujjat yoki xodim bo'yicha..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field !pl-10 text-sm py-2 w-full"
            />
          </div>

          {/* User filter */}
          <select
            value={selectedUserId}
            onChange={(e) => { setSelectedUserId(e.target.value); setPage(1); }}
            className="select-field text-sm py-2"
          >
            <option value="">Barcha xodimlar</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>

          {/* Action filter */}
          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
            className="select-field text-sm py-2"
          >
            <option value="EXECUTOR_VIEWED">👁️ Mas'ul ijrochi ko'rgani</option>
            <option value="">Faqat ko'rish amallari (Ijrochi + Fayl)</option>
            <option value="ALL">Barcha amallar</option>
            {availableActions.filter(a => a.action !== 'EXECUTOR_VIEWED').map(a => {
              const meta = getActionMeta(a.action);
              return <option key={a.action} value={a.action}>{meta.label} ({a.count})</option>;
            })}
          </select>

          {/* Date filters */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input-field text-sm py-2 flex-1 min-w-0"
              title="Dan"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input-field text-sm py-2 flex-1 min-w-0"
              title="Gacha"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <Filter size={12} className="text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Filtrlar faol</span>
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Tozalash
            </button>
          </div>
        )}
      </div>

      {/* Log List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner" style={{ width: 30, height: 30 }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ClipboardList size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Faoliyat yozuvlari topilmadi</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-ghost text-xs mt-3">Filtrlarni tozalash</button>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {logs.map((log) => {
              const meta = getActionMeta(log.actionName);
              const IconComp = meta.icon;
              const roleColor = ROLE_COLORS[log.performedBy?.role || ''] || 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
              return (
                <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  {/* Action Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border}`}>
                    <IconComp size={16} className={meta.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}>
                        {meta.label}
                      </span>
                      {log.performedBy && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColor}`}>
                          {ROLE_LABELS[log.performedBy.role] || log.performedBy.role}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {log.description || log.actionName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {/* Performer */}
                      {log.performedBy ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <User size={11} />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{log.performedBy.fullName}</span>
                          {log.performedBy.department && <span>· {log.performedBy.department}</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Shield size={11} /> Tizim
                        </span>
                      )}
                      {/* Document link */}
                      {log.document && (
                        <Link
                          href={`/dashboard/documents/${log.document.id}`}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <FileText size={11} />
                          {log.document.docNumber} — {log.document.title.length > 35 ? log.document.title.slice(0, 35) + '…' : log.document.title}
                        </Link>
                      )}
                      {/* Time */}
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                        <Calendar size={11} />
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} / {total} ta yozuv
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* User Activity Quick Stats (bottom section) */}
      {users.length > 0 && !hasActiveFilters && !loading && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={14} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Xodimlar faolligi (barcha vaqt)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {users.slice(0, 8).map((u) => {
              const rc = ROLE_COLORS[u.role] || '';
              return (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUserId(String(u.id)); setPage(1); }}
                  className="text-left p-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/[0.02] hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-violet-50/40 dark:hover:bg-violet-500/5 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgb(139 92 246 / 0.15)', color: 'rgb(139 92 246)', border: '1px solid rgb(139 92 246 / 0.2)' }}
                    >
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{u.fullName}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${rc}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  {u.department && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">{u.department}</p>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
