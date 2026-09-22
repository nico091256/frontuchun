'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import api, { getFileUrl } from '@/lib/api';
import { Document } from '@/types';
import {
  ArrowLeft, FileText, Download, Send, CheckCircle, XCircle,
  Clock, User, Calendar, AlertTriangle, MessageSquare, Upload, Zap,
  Paperclip, FileSpreadsheet, FileImage, CheckCircle2, RotateCcw, Trash2,
  Building2, Reply, Link as LinkIcon, FolderDown,
} from 'lucide-react';
import {
  statusConfig, priorityConfig, stepStatusConfig, docTypeConfig,
  formatDate, formatDateTime, getDeadlineStatus, formatFileSize,
  fixEncoding, getFileTypeMeta,
} from '@/lib/utils';
import toast from 'react-hot-toast';
import Portal from '@/components/common/Portal';

interface AttachmentCardProps {
  cardTitle: string;
  badgeLabel: string;
  theme?: 'violet' | 'cyan';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  emptyText?: string;
  canUpload?: boolean;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function AttachmentCard({
  cardTitle,
  badgeLabel,
  theme = 'violet',
  fileUrl,
  fileName,
  fileSize,
  emptyText,
  canUpload,
  onUpload,
}: AttachmentCardProps) {
  const cleanName = fixEncoding(fileName);
  const meta = getFileTypeMeta(cleanName);
  const isViolet = theme === 'violet';

  const renderIcon = () => {
    switch (meta.type) {
      case 'excel':
        return <FileSpreadsheet size={17} className={meta.iconText} />;
      case 'image':
        return <FileImage size={17} className={meta.iconText} />;
      default:
        return <FileText size={17} className={meta.iconText} />;
    }
  };

  return (
    <div className={`glass-card p-4 sm:p-5 transition-all duration-200 ${
      isViolet ? '' : 'border-slate-200 dark:border-emerald-500/20'
    }`}>
      {/* Header with zero wrapping */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {isViolet ? (
            <Paperclip size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
            {cardTitle}
          </h3>
        </div>
        <span
          className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold tracking-wide uppercase whitespace-nowrap shrink-0 border ${
            isViolet
              ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25'
          }`}
        >
          {badgeLabel}
        </span>
      </div>

      {fileUrl ? (
        <a
          href={getFileUrl(fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
            isViolet
              ? 'border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-slate-700'
              : 'border-slate-200 dark:border-emerald-500/20 bg-slate-50/60 dark:bg-emerald-500/[0.03] hover:bg-emerald-50/40 dark:hover:bg-emerald-500/[0.08] hover:border-emerald-300 dark:hover:border-emerald-500/40'
          }`}
        >
          {/* File Format Badge */}
          <div
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border ${meta.badgeBg} ${meta.badgeBorder}`}
          >
            {renderIcon()}
            <span className={`text-[8px] font-extrabold tracking-tight leading-none mt-0.5 ${meta.badgeText}`}>
              {meta.ext}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-white truncate transition-colors"
              title={cleanName || 'Fayl'}
            >
              {cleanName || 'Biriktirilgan fayl'}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {fileSize ? (
                <>
                  <span>{formatFileSize(fileSize)}</span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                </>
              ) : null}
              <span className={`transition-colors font-medium ${isViolet ? 'group-hover:text-slate-900 dark:group-hover:text-slate-200' : 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300'}`}>
                Yuklab olish
              </span>
            </div>
          </div>

          {/* Download Action Icon */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 ${
              isViolet
                ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-400 dark:hover:bg-white/[0.1] dark:hover:text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-white/[0.04] dark:border-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200'
            }`}
          >
            <Download size={14} />
          </div>
        </a>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center bg-slate-50/50 dark:bg-white/[0.01]">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {emptyText || 'Fayl biriktirilmagan'}
          </p>
          {canUpload && (
            <label className="btn-ghost text-xs mt-2.5 py-1 px-3 cursor-pointer inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300">
              <Upload size={12} /> Fayl biriktirish
              <input
                type="file"
                className="hidden"
                onChange={onUpload}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [comment, setComment] = useState('');
  const [executionNote, setExecutionNote] = useState('');
  const [executionFile, setExecutionFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  // Admin Superpowers state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showForceApproveModal, setShowForceApproveModal] = useState(false);
  const [adminTargetStep, setAdminTargetStep] = useState<number | null>(null);
  const [approversList, setApproversList] = useState<{id: number, fullName: string, department: string}[]>([]);
  const [selectedApproverId, setSelectedApproverId] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [deadlineTargetType, setDeadlineTargetType] = useState<'DOCUMENT'|'STEP'>('DOCUMENT');

  // User Profile Modal state
  const [profileTargetId, setProfileTargetId] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (profileTargetId) {
      setProfileLoading(true);
      api.get(`/users/${profileTargetId}`)
        .then(res => setProfileData(res.data.data))
        .catch(() => toast.error('Profilni yuklashda xatolik'))
        .finally(() => setProfileLoading(false));
    } else {
      setProfileData(null);
    }
  }, [profileTargetId]);

  const [notFound, setNotFound] = useState(false);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${id}`);
      setDocument(response.data.data);
      setNotFound(false);
    } catch (err: unknown) {
      const errorData = err as { response?: { status?: number; data?: { message?: string } } };
      if (errorData?.response?.status === 404) {
        setDocument(null);
        setNotFound(true);
      } else {
        toast.error(errorData?.response?.data?.message || 'Hujjatni yuklashda xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentPendingStep = (document?.status === 'IN_APPROVAL' || document?.status === 'EXPIRED')
    ? [...(document?.approvalSteps || [])]
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .find(s => s.stepStatus === 'PENDING')
    : null;

  const myPendingStep = currentPendingStep?.approverId === user?.id ? currentPendingStep : null;

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/documents/${id}/submit`);
      toast.success('Hujjat tasdiqlashga yuborildi!');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!confirm('Hujjatni qayta yuborishni tasdiqlaysizmi?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/documents/${id}/resubmit`);
      toast.success('Hujjat qayta tasdiqlashga yuborildi!');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminRollback = async () => {
    if (!confirm('Hujjatni tasdiqlash jarayoniga qaytarishni tasdiqlaysizmi? Navbatdagi tasdiqlovchilar uchun ruxsat qayta ochiladi.')) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/documents/${id}/rollback-to-approval`);
      toast.success('Hujjat tasdiqlash jarayoniga qaytarildi!');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminDelete = async () => {
    if (!confirm('Hujjatni butunlay o\'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo\'lmaydi!')) return;
    setActionLoading(true);
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Hujjat muvaffaqiyatli o\'chirildi');
      useNotificationStore.getState().fetchNotifications();
      router.push('/dashboard/documents');
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik yuz berdi');
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Hujjatni yopishni tasdiqlaysizmi?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/documents/${id}/close`);
      toast.success('Hujjat yakunlandi!');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!executionNote.trim() || executionNote.trim().length < 5) {
      toast.error('Ijro izohi kamida 5 ta belgi bo\'lishi kerak');
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('executionNote', executionNote.trim());
      if (executionFile) formData.append('executionFile', executionFile);
      await api.patch(`/documents/${id}/execute`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Ijro muvaffaqiyatli yakunlandi! ✅');
      setShowExecuteModal(false);
      setExecutionNote('');
      setExecutionFile(null);
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!myPendingStep && !currentStep) return;
    setActionLoading(true);
    try {
      await api.post(`/approvals/${myPendingStep?.id || currentStep}/approve`, { comment });
      toast.success('Tasdiqlandi! ✅');
      setShowApproveModal(false);
      setComment('');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!myPendingStep && !currentStep) return;
    if (comment.trim().length < 10) {
      toast.error('Izoh kamida 10 ta belgi bo\'lishi kerak');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/approvals/${myPendingStep?.id || currentStep}/reject`, { comment });
      toast.success('Rad etildi ❌');
      setShowRejectModal(false);
      setComment('');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // --- ADMIN ACTIONS ---
  const fetchApprovers = async () => {
    try {
      const res = await api.get('/users/approvers');
      setApproversList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminCancel = async () => {
    setActionLoading(true);
    try {
      await api.post(`/admin/documents/${id}/cancel`);
      toast.success('Hujjat bekor qilindi (Revoked)');
      setShowCancelModal(false);
      fetchDocument();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminForceApprove = async () => {
    if (!adminTargetStep) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/steps/${adminTargetStep}/force-approve`);
      toast.success('Majburiy tasdiqlandi');
      setShowForceApproveModal(false);
      fetchDocument();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminReassign = async () => {
    if (!adminTargetStep || !selectedApproverId) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/steps/${adminTargetStep}/reassign`, { newApproverId: selectedApproverId });
      toast.success('Tasdiqlovchi almashtirildi');
      setShowReassignModal(false);
      fetchDocument();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminDeadline = async () => {
    if (!newDeadlineDate) return;
    setActionLoading(true);
    try {
      if (deadlineTargetType === 'DOCUMENT') {
        await api.patch(`/admin/documents/${id}/deadline`, { deadline: new Date(newDeadlineDate).toISOString() });
      } else {
        await api.patch(`/admin/steps/${adminTargetStep}/deadline`, { deadline: new Date(newDeadlineDate).toISOString() });
      }
      toast.success('Muddat uzaytirildi');
      setShowDeadlineModal(false);
      fetchDocument();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitialFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      await api.post(`/documents/${id}/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Dastlabki fayl muvaffaqiyatli biriktirildi! 📄');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Fayl yuklashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdditionalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      await api.post(`/documents/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Yangi fayl biriktirildi! 📄');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Fayl yuklashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Haqiqatan ham ushbu biriktirilgan faylni o\'chirmoqchimisiz?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/documents/${id}/attachments/${attachmentId}`);
      toast.success('Fayl muvaffaqiyatli o\'chirildi');
      fetchDocument();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Faylni o\'chirishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // Fayl ko'rildi — boshliqqa bildirishnoma (bir seansda bir marta)
  const handleViewAttachment = (attachmentId: number, fileUrl: string) => {
    const sessionKey = `file_viewed_${attachmentId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      api.post(`/documents/${id}/attachments/${attachmentId}/view`).catch(() => {});
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };
  // ---------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (notFound || !document) {
    return (
      <div className="text-center py-16 animate-fade-in max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.25)]">
          <FileText size={32} />
        </div>
        <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1.5">Hujjat topilmadi</h2>
        <p className="text-sm text-[rgb(var(--text-muted))] mb-6 leading-relaxed">
          Ushbu hujjat mavjud emas yoki tizimdan o&apos;chirib yuborilgan bo&apos;lishi mumkin.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost">
            <ArrowLeft size={16} /> Orqaga
          </button>
          <button onClick={() => router.push('/dashboard/documents')} className="btn-primary">
            Hujjatlar ro&apos;yxati
          </button>
        </div>
      </div>
    );
  }

  const sc = statusConfig[document.status];
  const pc = priorityConfig[document.priority];
  const dt = docTypeConfig[document.docType || 'INTERNAL'];
  const deadline = getDeadlineStatus(document.overallDeadline);

  return (
    <div className="animate-fade-in space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={() => router.back()} className="btn-ghost p-2 shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="doc-badge font-bold">{document.docNumber}</span>
              {document.senderDocNumber && (
                <span className="doc-badge font-bold bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/40">
                  № {document.senderDocNumber}
                </span>
              )}
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${dt.bg} ${dt.color} ${dt.border}`}>
                <span>{dt.icon}</span>
                <span>{dt.shortLabel}</span>
              </span>
              <span className={`badge ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                <span className={`text-xs ${pc.color}`}>{pc.label}</span>
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[rgb(var(--text-primary))] leading-snug">{fixEncoding(document.title)}</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {document.docType === 'INCOMING' && (
            <button
              onClick={() => router.push(`/dashboard/documents/new?docType=OUTGOING&replyTo=${document.id}`)}
              className="btn-ghost flex items-center gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30"
              title="Ushbu kiruvchi xatga chiquvchi javob xati tayyorlash"
            >
              <Reply size={15} />
              Javob xati yozish
            </button>
          )}
          {user?.role === 'ADMIN' && (document.status === 'IN_APPROVAL' || document.status === 'EXPIRED') && (
            <>
              <button onClick={() => { setDeadlineTargetType('DOCUMENT'); setShowDeadlineModal(true); }} disabled={actionLoading} className="btn-ghost mr-2" style={{ color: 'rgb(251 191 36)' }}>
                <Clock size={15} />
                Muddatni o'zgartirish
              </button>
              <button onClick={() => setShowCancelModal(true)} disabled={actionLoading} className="btn-danger mr-2">
                <AlertTriangle size={15} />
                Jarayonni bekor qilish
              </button>
            </>
          )}

          {document.status === 'DRAFT' && document.creatorId === user?.id && (
            <>
              <button onClick={() => router.push(`/dashboard/documents/${id}/edit`)} disabled={actionLoading} className="btn-ghost">
                Tahrirlash
              </button>
              <button onClick={handleSubmit} disabled={actionLoading} className="btn-primary">
                <Send size={15} />
                Yuborish
              </button>
            </>
          )}
          {document.status === 'REJECTED' && document.creatorId === user?.id && (
            <button onClick={handleResubmit} disabled={actionLoading} className="btn-primary">
              <Send size={15} />
              Qayta yuborish
            </button>
          )}
          {document.status === 'IN_EXECUTION' && (
            (document.executorId && document.executorId === user?.id) || 
            (!document.executorId && document.creatorId === user?.id) || 
            user?.role === 'ADMIN'
          ) && (
            <button onClick={() => setShowExecuteModal(true)} disabled={actionLoading} className="btn-primary"
              style={{ background: 'linear-gradient(135deg, rgb(var(--secondary)), rgb(0 180 200))', boxShadow: '0 4px 15px rgb(var(--secondary) / 0.4)' }}
            >
              <Zap size={15} />
              Ijroni Yakunlash
            </button>
          )}

          {user?.role === 'ADMIN' && document.status === 'IN_EXECUTION' && (
            <button
              onClick={handleAdminRollback}
              disabled={actionLoading}
              className="btn-ghost flex items-center gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30"
              title="Tasdiqlash jarayoniga qaytarish"
            >
              <RotateCcw size={15} />
              Tasdiqlashga qaytarish
            </button>
          )}

          {(user?.role === 'ADMIN' || (document.creatorId === user?.id && ['DRAFT', 'REJECTED'].includes(document.status))) && (
            <button
              onClick={handleAdminDelete}
              disabled={actionLoading}
              className="btn-ghost flex items-center gap-1.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10"
              title="Hujjatni o'chirish"
            >
              <Trash2 size={15} />
              O'chirish
            </button>
          )}
          {myPendingStep && (
            <>
              <button
                onClick={() => { setCurrentStep(myPendingStep.id); setShowRejectModal(true); }}
                className="btn-danger"
                disabled={actionLoading}
              >
                <XCircle size={15} />
                Rad etish
              </button>
              <button
                onClick={() => { setCurrentStep(myPendingStep.id); setShowApproveModal(true); }}
                className="btn-primary"
                disabled={actionLoading}
              >
                <CheckCircle size={15} />
                Tasdiqlash
              </button>
            </>
          )}
        </div>
      </div>

      {document.status === 'EXPIRED' && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>Ushbu hujjatning muddati o&apos;tgan. Muddat uzaytirilsa, tasdiqlash jarayoni davom etadi.</span>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                setDeadlineTargetType('DOCUMENT');
                setNewDeadlineDate(document.overallDeadline ? new Date(document.overallDeadline).toISOString().split('T')[0] : '');
                setShowDeadlineModal(true);
              }}
              className="btn-primary text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700 flex-shrink-0"
            >
              <Clock size={13} /> Muddatni uzaytirish
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Main Content */}
        <div className="md:col-span-2 space-y-5">
          {/* Hujjat Rekvizitlari Card (Jurnal ma'lumotlari) */}
          {document.docType === 'INCOMING' && (
            <div className="glass-card p-5 border-sky-500/20 dark:border-sky-500/25 bg-sky-500/[0.02]">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-base">📥</span>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                    Kiruvchi xat rekvizitlari
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20">
                  Ro&apos;yxat jurnali
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Yuboruvchi tashkilot (Kimdan kelgan):</p>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                    {document.senderOrg || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Xat raqami (Chiquvchi №):</p>
                  <p className="font-semibold text-slate-900 dark:text-white font-mono">
                    {document.senderDocNumber || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Xat sanasi (Yuborilgan sana):</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(document.senderDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ro&apos;yxatga olingan sana:</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(document.createdAt)}
                  </p>
                </div>

                {document.resolution && (
                  <div className="sm:col-span-2 pt-2.5 mt-1 border-t border-slate-100 dark:border-white/[0.06]">
                    <p className="text-xs text-sky-700 dark:text-sky-400 font-semibold mb-1">Rahbar rezolyutsiyasi / Ko&apos;rsatma:</p>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-white/[0.03] p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] italic">
                      &ldquo;{fixEncoding(document.resolution)}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {document.docType === 'OUTGOING' && (
            <div className="glass-card p-5 border-amber-500/20 dark:border-amber-500/25 bg-amber-500/[0.02]">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-base">📤</span>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Chiquvchi xat rekvizitlari
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                  Ro&apos;yxat jurnali
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Qabul qiluvchi tashkilot (Kimga):</p>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    {document.recipientOrg || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Yetkazish usuli:</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {document.deliveryMethod || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Chiquvchi xat raqami (Bizning Chiquvchi №):</p>
                  <p className="font-semibold text-slate-900 dark:text-white font-mono">
                    {document.docNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Yuborilgan sana:</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(document.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bog'langan Hujjatlar (Asos xat yoki Javob xatlari) */}
          {(document.parentDoc || (document.childDocs && document.childDocs.length > 0)) && (
            <div className="glass-card p-5 border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                <LinkIcon size={14} className="text-slate-600 dark:text-slate-400 shrink-0" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Bog&apos;langan hujjatlar zanjiri
                </h2>
              </div>

              {/* Asos kiruvchi xat */}
              {document.parentDoc && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    Ushbu chiquvchi xat quyidagi kiruvchi xatga asosan tuzilgan:
                  </p>
                  <div
                    onClick={() => router.push(`/dashboard/documents/${document.parentDoc!.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-sky-500/25 bg-slate-50/70 dark:bg-sky-500/[0.05] hover:bg-slate-100 dark:hover:bg-sky-500/[0.1] cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">📥</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
                            {document.parentDoc.docNumber}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                          {document.parentDoc.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-sky-700 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                      Ko&apos;rish →
                    </span>
                  </div>
                </div>
              )}

              {/* Ushbu xatga berilgan javob xatlari */}
              {document.childDocs && document.childDocs.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    Ushbu xatga yuborilgan javob xatlari ({document.childDocs.length}):
                  </p>
                  <div className="space-y-2">
                    {document.childDocs.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => router.push(`/dashboard/documents/${child.id}`)}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-amber-500/25 bg-slate-50/70 dark:bg-amber-500/[0.05] hover:bg-slate-100 dark:hover:bg-amber-500/[0.1] cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">📤</span>
                          <div className="min-w-0">
                            <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                              {child.docNumber}
                            </span>
                            <p className="text-xs font-medium text-slate-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                              {child.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {formatDate(child.createdAt)}
                          </span>
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                            Ko&apos;rish →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Tavsif</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {fixEncoding(document.description)}
            </p>
          </div>

          {/* Approval Chain */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Tasdiqlash zanjiri</h2>
            {(document.approvalSteps || []).length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-slate-50/70 dark:bg-cyan-500/[0.04]">
                <Zap size={20} className="text-slate-400 dark:text-cyan-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Tasdiqlash talab etilmagan</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ushbu hujjat tasdiqlovchilarsiz to&apos;g&apos;ridan-to&apos;g&apos;ri ijroga yo&apos;naltirilgan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(document.approvalSteps || []).map((step, index) => {
                  const ss = stepStatusConfig[step.stepStatus];
                  const isCurrentUser = step.approverId === user?.id;
                  return (
                    <div key={step.id} className="approval-step">
                      <div
                        className="step-circle"
                        style={{
                          background: step.stepStatus === 'APPROVED' ? 'rgb(52 211 153 / 0.15)' :
                            step.stepStatus === 'REJECTED' ? 'rgb(248 113 113 / 0.15)' :
                            step.stepStatus === 'PENDING' ? 'rgb(251 191 36 / 0.15)' : 'rgb(var(--bg-elevated))',
                          borderColor: step.stepStatus === 'APPROVED' ? 'rgb(52 211 153 / 0.5)' :
                            step.stepStatus === 'REJECTED' ? 'rgb(248 113 113 / 0.5)' :
                            step.stepStatus === 'PENDING' ? 'rgb(251 191 36 / 0.5)' : 'rgb(var(--border))',
                          color: step.stepStatus === 'APPROVED' ? 'rgb(16 185 129)' :
                            step.stepStatus === 'REJECTED' ? 'rgb(239 68 68)' :
                            step.stepStatus === 'PENDING' ? 'rgb(217 119 6)' : 'rgb(var(--text-muted))',
                        }}
                      >
                        {step.stepStatus === 'APPROVED' ? '✓' :
                          step.stepStatus === 'REJECTED' ? '✕' : step.stepOrder}
                      </div>
                      <div
                        className="flex-1 p-4 rounded-xl"
                        style={{
                          background: isCurrentUser && step.stepStatus === 'PENDING'
                            ? 'rgb(251 191 36 / 0.05)'
                            : 'rgb(var(--bg-elevated) / 0.5)',
                          border: `1px solid ${isCurrentUser && step.stepStatus === 'PENDING'
                            ? 'rgb(251 191 36 / 0.25)'
                            : 'rgb(var(--border))'}`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span onClick={() => setProfileTargetId(step.approverId)} className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer hover:underline hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{step.approver.fullName}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {step.approver.department ? `(${step.approver.department})` : ''}
                              </span>
                            </div>
                            {step.stepDeadline && (
                              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                                <Clock size={11} className="inline mr-1" />
                                Muddat: {formatDate(step.stepDeadline)}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-semibold ${ss?.color || ''}`}>
                            {ss?.icon || ''} {ss?.label || step.stepStatus}
                          </span>
                        </div>

                        {step.comment && (
                          <div
                            className="mt-3 p-3 rounded-lg text-xs"
                            style={{ background: 'rgb(var(--bg-base))', border: '1px solid rgb(var(--border))' }}
                          >
                            <MessageSquare size={11} className="inline mr-1.5 text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300">{step.comment}</span>
                          </div>
                        )}

                        {step.actionDate && (
                          <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">
                            {formatDateTime(step.actionDate)}
                          </p>
                        )}

                        {user?.role === 'ADMIN' && step.stepStatus === 'PENDING' && (
                          <div className="flex gap-2 mt-2 justify-end">
                            <button 
                              onClick={() => { setAdminTargetStep(step.id); fetchApprovers(); setShowReassignModal(true); }}
                              className="text-xs py-1 px-2.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 font-medium"
                            >
                              Boshqaga o'tkazish
                            </button>
                            <button 
                              onClick={() => { setAdminTargetStep(step.id); setShowForceApproveModal(true); }}
                              className="text-xs py-1 px-2.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 font-medium"
                            >
                              Majburiy tasdiqlash
                            </button>
                            <button 
                              onClick={() => { setAdminTargetStep(step.id); setDeadlineTargetType('STEP'); setShowDeadlineModal(true); }}
                              className="text-xs py-1 px-2.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 font-medium"
                            >
                              Sana
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          {document.history && document.history.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">Harakat tarixi</h2>
              <div className="space-y-4">
                {document.history.map((h) => (
                  <div key={h.id} className="timeline-item">
                    <div
                      className="timeline-dot bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:bg-violet-500/20 dark:border-violet-500/40 dark:text-violet-300"
                    >
                      <div className="w-2 h-2 rounded-full mx-auto bg-amber-600 dark:bg-violet-400" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{h.description || h.actionName}</p>
                      <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                        {h.performedBy?.fullName || 'Tizim'} • {formatDateTime(h.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Meta */}
        <div className="space-y-4">
          {/* Info Card */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Ma'lumotlar</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Yaratuvchi</p>
                  <p onClick={() => setProfileTargetId(document.creatorId)} className="text-slate-900 dark:text-white font-medium cursor-pointer hover:underline hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{document.creator?.fullName || '—'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{document.creator?.department || '—'}</p>
                </div>
              </div>

              {document.executor && (
                <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mas'ul ijrochi</p>
                    <p onClick={() => setProfileTargetId(document.executorId!)} className="text-slate-900 dark:text-white font-medium cursor-pointer hover:underline hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{document.executor.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{document.executor.department || 'Bo\'limsiz'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Yaratilgan</p>
                  <p className="text-slate-900 dark:text-white">{formatDateTime(document.createdAt)}</p>
                </div>
              </div>

              {document.overallDeadline && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Umumiy muddat</p>
                      <p className={`font-medium ${deadline.color}`}>{formatDate(document.overallDeadline)}</p>
                      <p className={`text-xs ${deadline.color}`}>{deadline.label}</p>
                    </div>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setDeadlineTargetType('DOCUMENT');
                        setNewDeadlineDate(document.overallDeadline ? new Date(document.overallDeadline).toISOString().split('T')[0] : '');
                        setShowDeadlineModal(true);
                      }}
                      className="text-xs py-1 px-2.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 font-medium flex-shrink-0 border border-amber-200 dark:border-amber-500/25"
                    >
                      Sana
                    </button>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Kategoriya</p>
                <span className="badge bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {document.category}
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Attachment List or Single Attachment */}
          {document.attachments && document.attachments.length > 0 ? (
            <div className="glass-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                    Biriktirilgan fayllar
                  </h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold tracking-wide uppercase whitespace-nowrap shrink-0 border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {document.attachments.length} ta fayl
                </span>
              </div>

              <div className="space-y-2">
                {document.attachments.map((att, idx) => {
                  const cleanName = fixEncoding(att.fileName);
                  const meta = getFileTypeMeta(cleanName);
                  const fullUrl = getFileUrl(att.fileUrl);
                  return (
                    <div
                      key={att.id}
                      className="group relative flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 border ${meta.badgeBg} ${meta.badgeBorder}`}
                      >
                        <FileText size={15} className={meta.iconText} />
                        <span className={`text-[7px] font-extrabold leading-none mt-0.5 ${meta.badgeText}`}>
                          {meta.ext}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleViewAttachment(att.id, fullUrl)}
                          className="text-xs font-medium text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-white truncate block hover:underline text-left w-full"
                          title={cleanName}
                        >
                          {cleanName || `Fayl #${idx + 1}`}
                        </button>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFileSize(att.fileSize)} • {att.fileType === 'MAIN' ? 'Asosiy' : att.fileType === 'EXECUTION' ? 'Ijro natijasi' : 'Ilova'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleViewAttachment(att.id, fullUrl)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:text-white dark:hover:bg-white/10 transition-all"
                          title="Ko'rish / Yuklab olish"
                        >
                          <Download size={13} />
                        </button>
                        {(user?.role === 'ADMIN' || document.creatorId === user?.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all"
                            title="O'chirish"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(user?.role === 'ADMIN' || document.creatorId === user?.id) && (
                <label className="btn-ghost text-xs mt-3 w-full py-2 cursor-pointer flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-white/15 hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/[0.05]">
                  <Upload size={13} /> Yangi fayl biriktirish
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAdditionalFileUpload}
                  />
                </label>
              )}
            </div>
          ) : (
            <AttachmentCard
              cardTitle="Biriktirilgan fayl"
              badgeLabel="Asosiy"
              theme="violet"
              fileUrl={document.fileUrl}
              fileName={document.fileName}
              fileSize={document.fileSize}
              emptyText="Hujjat yaratilganda fayl biriktirilmagan"
              canUpload={user?.role === 'ADMIN' || document.creatorId === user?.id}
              onUpload={handleInitialFileUpload}
            />
          )}

          {/* 2. Ijro javob fayli (agar mavjud bo'lsa) */}
          {document.executionFileUrl && (
            <AttachmentCard
              cardTitle="Ijro javob fayli"
              badgeLabel="Natija"
              theme="cyan"
              fileUrl={document.executionFileUrl}
              fileName={document.executionFileName}
              emptyText="Javob hujjati mavjud emas"
            />
          )}

          {/* 3. Ijro natijasi va izohi */}
          {document.executionNote && (
            <div className="glass-card p-5 border-slate-200 dark:border-emerald-500/20 bg-slate-50/60 dark:bg-emerald-950/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Ijro natijasi</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {fixEncoding(document.executionNote)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgb(52 211 153 / 0.15)' }}>
                  <CheckCircle size={20} style={{ color: 'rgb(52 211 153)' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Hujjatni tasdiqlash</h3>
                  <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>Ixtiyoriy izoh qoldiring</p>
                </div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field resize-none mb-5"
                rows={4}
                placeholder="Izoh (ixtiyoriy)..."
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowApproveModal(false)} className="btn-ghost">Bekor</button>
                <button onClick={handleApprove} disabled={actionLoading} className="btn-primary">
                  {actionLoading ? <div className="spinner w-4 h-4" /> : '✓ Tasdiqlash'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgb(248 113 113 / 0.15)' }}>
                  <XCircle size={20} style={{ color: 'rgb(248 113 113)' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Hujjatni rad etish</h3>
                  <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>Rad etish sababini kiriting (majburiy)</p>
                </div>
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs"
                style={{ background: 'rgb(248 113 113 / 0.08)', border: '1px solid rgb(248 113 113 / 0.2)', color: 'rgb(248 113 113)' }}
              >
                <AlertTriangle size={13} />
                Rad etilgach hujjat yaratuvchiga qaytariladi
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field resize-none mb-5"
                rows={4}
                placeholder="Rad etish sababi (kamida 10 ta belgi)..."
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowRejectModal(false)} className="btn-ghost">Bekor</button>
                <button onClick={handleReject} disabled={actionLoading} className="btn-danger">
                  {actionLoading ? <div className="spinner w-4 h-4" /> : '✕ Rad etish'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
      {/* Execute Modal — Ijroni Yakunlash */}
      {showExecuteModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowExecuteModal(false)}>
            <div
              className="modal-content"
              style={{ maxWidth: '560px', borderColor: 'rgb(var(--secondary) / 0.4)', boxShadow: '0 24px 80px rgb(0 0 0 / 0.6), 0 0 40px rgb(var(--secondary) / 0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--secondary) / 0.2), rgb(0 180 200 / 0.1))', border: '1px solid rgb(var(--secondary) / 0.4)', boxShadow: '0 0 20px rgb(var(--secondary) / 0.3)' }}
                >
                  <Zap size={22} style={{ color: 'rgb(var(--secondary))' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ijroni Yakunlash</h3>
                  <p className="text-xs text-slate-400">Hujjat bo&apos;yicha yakuniy hisobot va fayllarni biriktiring</p>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ijro hisoboti / Izoh <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={executionNote}
                    onChange={(e) => setExecutionNote(e.target.value)}
                    className="input-field resize-none"
                    rows={4}
                    placeholder="Qilingan ishlar yuzasidan batafsil hisobot (kamida 5 ta belgi)..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Natijaviy hujjat yoki hisobot fayli <span className="text-slate-500 font-normal">(ixtiyoriy)</span>
                  </label>
                  <div
                    className="relative rounded-xl p-6 text-center cursor-pointer transition-all duration-300"
                    style={{
                      background: isDragging ? 'rgb(var(--secondary) / 0.08)' : 'rgb(var(--bg-overlay) / 0.6)',
                      border: `2px dashed ${isDragging ? 'rgb(var(--secondary))' : 'rgb(var(--border-hover))'}`,
                      boxShadow: isDragging ? '0 0 20px rgb(var(--secondary) / 0.2)' : 'none',
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) setExecutionFile(file);
                    }}
                    onClick={() => window.document.getElementById('exec-file-input')?.click()}
                  >
                    <input
                      id="exec-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={(e) => setExecutionFile(e.target.files?.[0] || null)}
                    />
                    {executionFile ? (
                      (() => {
                        const meta = getFileTypeMeta(executionFile.name);
                        return (
                          <div className="flex items-center justify-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border ${meta.badgeBg} ${meta.badgeBorder}`}>
                              <FileText size={16} className={meta.iconText} />
                              <span className={`text-[8px] font-extrabold leading-none mt-0.5 ${meta.badgeText}`}>{meta.ext}</span>
                            </div>
                            <div className="text-left min-w-0 max-w-xs">
                              <p className="text-sm text-white font-medium truncate">{executionFile.name}</p>
                              <p className="text-xs text-slate-400">
                                {(executionFile.size / 1024).toFixed(1)} KB •{' '}
                                <span
                                  className="cursor-pointer text-red-400 hover:underline font-medium"
                                  onClick={(e) => { e.stopPropagation(); setExecutionFile(null); }}
                                >
                                  O&apos;chirish
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div>
                        <Upload size={24} className="mx-auto mb-2" style={{ color: 'rgb(var(--text-muted))' }} />
                        <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                          Faylni bu yerga tashlang yoki <span style={{ color: 'rgb(var(--secondary))' }}>tanlash uchun bosing</span>
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>PDF, Word, Excel — max 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowExecuteModal(false); setExecutionNote(''); setExecutionFile(null); }}
                  className="btn-ghost"
                >
                  Bekor
                </button>
                <button
                  onClick={handleExecute}
                  disabled={actionLoading || executionNote.trim().length < 5}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, rgb(var(--secondary)), rgb(0 180 200))',
                    boxShadow: '0 4px 20px rgb(var(--secondary) / 0.4)',
                    opacity: executionNote.trim().length < 5 ? 0.5 : 1,
                  }}
                >
                  {actionLoading ? <div className="spinner w-4 h-4" /> : <><Zap size={15} /> Ijroni Yakunlash</>}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Admin Modals */}
      {showReassignModal && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
            <div className="glass-card w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tasdiqlovchini almashtirish</h3>
              <p className="text-sm text-slate-400 mb-4">Yangi tasdiqlovchini tanlang:</p>
              <select
                value={selectedApproverId}
                onChange={(e) => setSelectedApproverId(e.target.value)}
                className="input-field mb-6"
              >
                <option value="">-- Tanlang --</option>
                {approversList.map(a => (
                  <option key={a.id} value={a.id}>{a.fullName} ({a.department})</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button onClick={() => setShowReassignModal(false)} className="btn-ghost flex-1">Bekor qilish</button>
                <button onClick={handleAdminReassign} className="btn-primary flex-1">Almashtirish</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showDeadlineModal && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
            <div className="glass-card w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-white mb-4">Muddatni uzaytirish</h3>
              <p className="text-sm text-slate-400 mb-4">Yangi muddatni kiriting:</p>
              <input
                type="datetime-local"
                value={newDeadlineDate}
                onChange={(e) => setNewDeadlineDate(e.target.value)}
                className="input-field mb-6"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowDeadlineModal(false)} className="btn-ghost flex-1">Bekor qilish</button>
                <button onClick={handleAdminDeadline} className="btn-primary flex-1">Saqlash</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showCancelModal && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
            <div className="glass-card w-full max-w-sm p-6 text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-bold text-white mb-2">Hujjatni bekor qilish</h3>
              <p className="text-sm text-slate-400 mb-6">Ushbu jarayon butunlay to'xtatiladi. Tasdiqlaysizmi?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="btn-ghost flex-1">Yo'q</button>
                <button onClick={handleAdminCancel} className="btn-danger flex-1">Ha, bekor qilish</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showForceApproveModal && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
            <div className="glass-card w-full max-w-sm p-6 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
              <h3 className="text-lg font-bold text-white mb-2">Majburiy tasdiqlash</h3>
              <p className="text-sm text-slate-400 mb-6">Ushbu bosqich admin tomonidan majburiy tasdiqlanadi. Tasdiqlaysizmi?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowForceApproveModal(false)} className="btn-ghost flex-1">Bekor qilish</button>
                <button onClick={handleAdminForceApprove} className="btn-primary flex-1">Tasdiqlash</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* User Profile Modal */}
      {profileTargetId && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4" onClick={() => setProfileTargetId(null)}>
            <div className="glass-card w-full max-w-sm p-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => setProfileTargetId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
              
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="spinner mb-4" style={{ width: 30, height: 30 }} />
                  <p className="text-sm text-slate-400">Ma'lumotlar yuklanmoqda...</p>
                </div>
              ) : profileData ? (
                <div className="text-center pt-4">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold shadow-xl"
                    style={{ background: 'linear-gradient(135deg, rgb(139 92 246 / 0.2), rgb(99 102 241 / 0.2))', color: 'rgb(167 139 250)', border: '1px solid rgb(139 92 246 / 0.3)' }}
                  >
                    {profileData.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{profileData.fullName}</h3>
                  <p className="text-sm text-indigo-400 font-medium mb-6">{profileData.position || 'Lavozim kiritilmagan'}</p>
                  
                  <div className="space-y-3 text-left bg-white/5 rounded-xl p-4 border border-white/10">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Bo'lim</p>
                      <p className="text-sm text-white font-medium">{profileData.department || 'Bo\'limsiz'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Telefon raqam</p>
                      <p className="text-sm text-white font-medium">{profileData.phone || 'Kiritilmagan'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Email manzili</p>
                      <p className="text-sm text-white font-medium">{profileData.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <AlertTriangle size={40} className="mx-auto mb-3 text-red-400 opacity-80" />
                  <p className="text-sm text-slate-300">Foydalanuvchi ma'lumotlari topilmadi</p>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
