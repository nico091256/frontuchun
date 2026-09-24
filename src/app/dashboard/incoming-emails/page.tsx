'use client';

import { useState, useEffect } from 'react';
import {
  getIncomingEmails,
  assignIncomingEmail,
  syncIncomingEmails,
  IncomingEmailDocument,
  getFileUrl,
} from '@/lib/api';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Inbox,
  RefreshCw,
  Search,
  UserCheck,
  Eye,
  Paperclip,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  Mail,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface UserOption {
  id: number;
  fullName: string;
  email: string;
  department?: string | null;
  position?: string | null;
  role: string;
}

export default function IncomingEmailsPage() {
  const { user } = useAuthStore();
  const [emails, setEmails] = useState<IncomingEmailDocument[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<IncomingEmailDocument | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignForm, setAssignForm] = useState({
    executorId: '',
    overallDeadline: '',
    resolution: '',
    priority: 'NORMAL',
  });

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await getIncomingEmails({
        status: statusFilter,
        search: searchTerm,
        page,
        limit: 15,
      });

      if (res.success) {
        setEmails(res.data || []);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCount(res.meta.total || 0);
        }
      }
    } catch (error) {
      console.error('Error loading incoming emails:', error);
      toast.error("Kiruvchi xatlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmails();
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncIncomingEmails();
      toast.success("Pochta qutilarini tekshirish ishga tushirildi");
      setTimeout(() => {
        fetchEmails();
      }, 2000);
    } catch (err) {
      toast.error("Sinxronlashda xatolik");
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAssignModal = (doc: IncomingEmailDocument) => {
    setSelectedDoc(doc);
    setAssignForm({
      executorId: doc.executor?.id ? String(doc.executor.id) : '',
      overallDeadline: doc.overallDeadline ? doc.overallDeadline.split('T')[0] : '',
      resolution: doc.resolution || '',
      priority: doc.priority || 'NORMAL',
    });
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!assignForm.executorId) {
      toast.error("Mas'ul ijrochini tanlang");
      return;
    }

    try {
      setAssigning(true);
      const res = await assignIncomingEmail(selectedDoc.id, {
        executorId: parseInt(assignForm.executorId, 10),
        overallDeadline: assignForm.overallDeadline || undefined,
        resolution: assignForm.resolution || undefined,
        priority: assignForm.priority,
      });

      if (res.success) {
        toast.success("Xat ijroga muvaffaqiyatli yo'naltirildi va ijrochiga xabar yuborildi! 🚀");
        setAssignModalOpen(false);
        fetchEmails();
      }
    } catch (err: any) {
      console.error('Assign error:', err);
      toast.error(err.response?.data?.message || "Ijroga yo'naltirishda xatolik");
    } finally {
      setAssigning(false);
    }
  };

  // Stats calculation
  const pendingCount = emails.filter((e) => e.status === 'INCOMING_PENDING').length;
  const executionCount = emails.filter((e) => e.status === 'IN_EXECUTION').length;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Top Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
        bg-white dark:bg-slate-900/60
        border border-black/[0.08] dark:border-slate-800
        p-6 rounded-2xl backdrop-blur-md shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Inbox size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Kiruvchi Email Xatlar</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gmail va Yandex pochtalaridan kelgan xatlarni ko'rib chiqish va ijroga yo'naltirish
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-amber-500/10 hover:bg-amber-500/20
            border border-amber-500/30
            text-amber-600 dark:text-amber-400
            font-medium text-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? "Tekshirilmoqda..." : "Pochtalarni Yangilash"}</span>
        </button>
      </div>

      {/* ── Stats Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-black/[0.08] dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400/90 font-medium">Tayinlash kutilmoqda</div>
          </div>
        </div>

        {/* In Execution */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-black/[0.08] dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{executionCount}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ijroga biriktirilgan</div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-black/[0.08] dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Inbox size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jami qabul qilingan xatlar</div>
          </div>
        </div>
      </div>

      {/* ── Filter and Search Bar ───────────────────── */}
      <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-black/[0.08] dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'Barchasi' },
            { id: 'INCOMING_PENDING', label: 'Tayinlash Kutilmoqda' },
            { id: 'IN_EXECUTION', label: 'Ijroda' },
            { id: 'COMPLETED', label: 'Yakunlangan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Xat mavzusi, jo'natuvchi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs
              bg-slate-50 dark:bg-slate-950/60
              border border-black/[0.1] dark:border-slate-800
              rounded-xl
              text-slate-900 dark:text-white
              placeholder-slate-400 dark:placeholder-slate-500
              focus:outline-none focus:border-amber-500 transition-colors"
          />
        </form>
      </div>

      {/* ── Main Table ──────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-black/[0.08] dark:border-slate-800 overflow-hidden backdrop-blur-md shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-amber-500" />
            <p className="text-sm">Kiruvchi email xatlar yuklanmoqda...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Mail size={40} className="text-slate-300 dark:text-slate-600" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">Hech qanday kiruvchi xat topilmadi</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              Email qutilarini tekshirish uchun yuqoridagi "Pochtalarni Yangilash" tugmasini bosing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider
                  text-slate-500 dark:text-slate-400
                  bg-slate-50 dark:bg-slate-950/40">
                  <th className="py-3.5 px-4">Jo'natuvchi & Raqami</th>
                  <th className="py-3.5 px-4">Xat Mavzusi</th>
                  <th className="py-3.5 px-4">Kelgan Sanasi</th>
                  <th className="py-3.5 px-4">Ilovalar</th>
                  <th className="py-3.5 px-4">Holati</th>
                  <th className="py-3.5 px-4">Mas'ul Ijrochi</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-slate-800/60 text-xs">
                {emails.map((doc) => {
                  const isPending = doc.status === 'INCOMING_PENDING';
                  const isExecution = doc.status === 'IN_EXECUTION';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3.5 px-4 font-medium max-w-[200px]">
                        <div className="font-semibold text-amber-600 dark:text-amber-400 truncate">{doc.senderOrg || "Noma'lum Jo'natuvchi"}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{doc.docNumber}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {doc.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Calendar size={13} />
                          <span>{doc.senderDate ? new Date(doc.senderDate).toLocaleDateString('uz-UZ') : new Date(doc.createdAt).toLocaleDateString('uz-UZ')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {doc.attachments && doc.attachments.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-medium">
                            <Paperclip size={12} />
                            {doc.attachments.length} ta fayl
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-[11px]">Ilovalarsiz</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
                            <AlertCircle size={12} />
                            Tayinlash kutilmoqda
                          </span>
                        ) : isExecution ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
                            <Clock size={12} />
                            Ijroda
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                            <CheckCircle2 size={12} />
                            {doc.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {doc.executor ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px]">
                              {doc.executor.fullName.charAt(0)}
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 text-xs font-medium">{doc.executor.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-500/80 font-medium italic text-[11px]">Biriktirilmagan</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setViewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg
                              bg-slate-100 dark:bg-slate-800
                              hover:bg-slate-200 dark:hover:bg-slate-700
                              text-slate-500 dark:text-slate-300
                              hover:text-slate-900 dark:hover:text-white
                              transition-colors"
                            title="Xatni o'qish va fayllarni ko'rish"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => handleOpenAssignModal(doc)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all duration-200 active:scale-95"
                          >
                            <UserCheck size={14} />
                            <span>{doc.executor ? "Qayta Yo'naltirish" : "Ijroga Yo'naltirish"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
          <div>Jami: {totalCount} ta xat</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg
                bg-white dark:bg-slate-800
                border border-black/[0.1] dark:border-slate-700
                disabled:opacity-40
                hover:bg-slate-50 dark:hover:bg-slate-700
                text-slate-700 dark:text-white transition-colors"
            >
              Oldingisi
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg
                bg-white dark:bg-slate-800
                border border-black/[0.1] dark:border-slate-700
                disabled:opacity-40
                hover:bg-slate-50 dark:hover:bg-slate-700
                text-slate-700 dark:text-white transition-colors"
            >
              Keyingisi
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW EMAIL MODAL ─────────────────────────── */}
      {viewModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-black/[0.08] dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-black/[0.07] dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Kiruvchi Email Tafsilotlari</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Raqam: #{selectedDoc.docNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-black/[0.07] dark:border-slate-800/80">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block">Jo'natuvchi Email:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedDoc.senderOrg}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block">Kelgan Vaqti:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedDoc.senderDate ? new Date(selectedDoc.senderDate).toLocaleString('uz-UZ') : new Date(selectedDoc.createdAt).toLocaleString('uz-UZ')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block mb-1">Xat Mavzusi:</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-black/[0.07] dark:border-slate-800">
                  {selectedDoc.title}
                </div>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block mb-1">Xat Matni:</span>
                <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-black/[0.07] dark:border-slate-800 text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedDoc.description}
                </div>
              </div>

              {/* Attachments */}
              {selectedDoc.attachments && selectedDoc.attachments.length > 0 && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block mb-2">
                    Biriktirilgan Fayllar ({selectedDoc.attachments.length} ta):
                  </span>
                  <div className="space-y-2">
                    {selectedDoc.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={getFileUrl(att.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl
                          bg-slate-100 dark:bg-slate-800/60
                          hover:bg-slate-200 dark:hover:bg-slate-800
                          border border-black/[0.06] dark:border-slate-700/60
                          transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip size={16} className="text-amber-500" />
                          <span className="font-medium text-slate-700 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {att.fileName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-black/[0.07] dark:border-slate-700">
                          Yuklab olish ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/[0.07] dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl
                  bg-slate-200 dark:bg-slate-800
                  hover:bg-slate-300 dark:hover:bg-slate-700
                  text-slate-700 dark:text-slate-300
                  font-medium text-xs transition-colors"
              >
                Yopish
              </button>

              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenAssignModal(selectedDoc);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-colors"
              >
                Ijroga Yo'naltirish →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN TO EXECUTION MODAL ───────────────── */}
      {assignModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-black/[0.08] dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-black/[0.07] dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Ijroga Yo'naltirish</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hujjat: #{selectedDoc.docNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {/* Select Executor */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mas'ul Ijrochi Xodim <span className="text-amber-500">*</span>
                </label>
                <select
                  required
                  value={assignForm.executorId}
                  onChange={(e) => setAssignForm({ ...assignForm, executorId: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs
                    bg-slate-50 dark:bg-slate-950
                    border border-black/[0.1] dark:border-slate-800
                    rounded-xl
                    text-slate-900 dark:text-white
                    focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="">-- Xodimni Tanlang --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.department || u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ijro Muddate (Deadline)
                  </label>
                  <input
                    type="date"
                    value={assignForm.overallDeadline}
                    onChange={(e) => setAssignForm({ ...assignForm, overallDeadline: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs
                      bg-slate-50 dark:bg-slate-950
                      border border-black/[0.1] dark:border-slate-800
                      rounded-xl
                      text-slate-900 dark:text-white
                      focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Muhimlik Darajasi
                  </label>
                  <select
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs
                      bg-slate-50 dark:bg-slate-950
                      border border-black/[0.1] dark:border-slate-800
                      rounded-xl
                      text-slate-900 dark:text-white
                      focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="LOW">Past</option>
                    <option value="NORMAL">O'rtacha (Normal)</option>
                    <option value="HIGH">Yuqori</option>
                    <option value="URGENT">Shoshilinch (Urgent)</option>
                  </select>
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Rahbar Rezolyutsiyasi / Ko'rsatmasi
                </label>
                <textarea
                  rows={3}
                  placeholder="Masalan: Ushbu xat bo'yicha tegishli javob loyihasini 3 kun ichida tayyorlang..."
                  value={assignForm.resolution}
                  onChange={(e) => setAssignForm({ ...assignForm, resolution: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs
                    bg-slate-50 dark:bg-slate-950
                    border border-black/[0.1] dark:border-slate-800
                    rounded-xl
                    text-slate-900 dark:text-white
                    placeholder-slate-400 dark:placeholder-slate-600
                    focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl
                    bg-slate-200 dark:bg-slate-800
                    hover:bg-slate-300 dark:hover:bg-slate-700
                    text-slate-700 dark:text-slate-300
                    text-xs font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} />
                  <span>{assigning ? "Yo'naltirilmoqda..." : "Topshiriqni Yuborish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
