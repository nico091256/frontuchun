'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { User, Priority, DocumentType, Document } from '@/types';
import {
  ArrowLeft, Plus, Trash2, Upload, X, Calendar, AlertCircle, FileText, Zap,
  Building2, Send, Inbox, FileCheck, CheckCircle2, Link as LinkIcon,
} from 'lucide-react';
import { getFileTypeMeta, formatFileSize, docTypeConfig } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ApproverEntry {
  approverId: number;
  approverName: string;
  stepDeadline: string;
}

const categories = ['Umumiy', 'Moliya', 'Jihoz so\'rovi', 'Yuridik', 'Texnik', 'HR', 'Boshqa'];

const deliveryMethods = [
  'E-xat / Elektron tizim orqali',
  'Kuryerlik xizmati orqali',
  'Pochta aloqasi orqali',
  'Qo\'ldan / Shaxsan topshirildi',
  'Elektron pochta (E-mail)',
  'Boshqa',
];

function NewDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDocType = (searchParams.get('docType') as DocumentType) || 'INCOMING';
  const initialReplyTo = searchParams.get('replyTo') ? Number(searchParams.get('replyTo')) : undefined;

  const [docType, setDocType] = useState<DocumentType>(initialDocType);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [incomingDocs, setIncomingDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<ApproverEntry[]>([
    { approverId: 0, approverName: '', stepDeadline: '' },
  ]);
  const [executorId, setExecutorId] = useState<number | ''>('');

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Umumiy',
    priority: 'NORMAL' as Priority,
    overallDeadline: '',
    // Xat raqami (qo'lda kiritiladigan)
    docNumber: '',
    // Kiruvchi xat maydonlari
    senderOrg: '',
    senderDocNumber: '',
    senderDate: '',
    resolution: '',
    // Chiquvchi xat maydonlari
    recipientOrg: '',
    deliveryMethod: 'E-xat / Elektron tizim orqali',
    parentDocId: initialReplyTo ? String(initialReplyTo) : '',
  });

  // Fetch approvers
  useEffect(() => {
    api.get('/users/approvers')
      .then((res) => setApprovers(res.data.data))
      .catch((err) => console.error('Approvers error:', err));
  }, []);

  // Fetch incoming documents list for linking in outgoing letters
  useEffect(() => {
    api.get('/documents?docType=INCOMING&limit=50')
      .then((res) => {
        const docs = res.data.data || [];
        setIncomingDocs(docs);

        // Agar replyTo bo'lsa, avtomatik sarlavha va ma'lumotlarni qisman to'ldirish
        if (initialReplyTo) {
          const linked = docs.find((d: Document) => d.id === initialReplyTo);
          if (linked) {
            setForm((prev) => ({
              ...prev,
              parentDocId: String(linked.id),
              recipientOrg: linked.senderOrg || prev.recipientOrg,
              title: prev.title || `${linked.docNumber}-sonli xatga javob: ${linked.title}`,
            }));
          }
        }
      })
      .catch((err) => console.error('Incoming docs error:', err));
  }, [initialReplyTo]);

  const addApprover = () => {
    setSelectedApprovers([...selectedApprovers, { approverId: 0, approverName: '', stepDeadline: '' }]);
  };

  const removeApprover = (index: number) => {
    setSelectedApprovers(selectedApprovers.filter((_, i) => i !== index));
  };

  const updateApprover = (index: number, key: keyof ApproverEntry, value: string | number) => {
    setSelectedApprovers((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        if (key === 'approverId') {
          const found = approvers.find((u) => u.id === Number(value));
          return { ...a, approverId: Number(value), approverName: found?.fullName || '' };
        }
        return { ...a, [key]: value };
      })
    );
  };

  const handleAddFiles = (newFiles: FileList | File[] | null) => {
    if (!newFiles) return;
    const arrayFiles = Array.from(newFiles);
    setFiles((prev) => {
      // Bir xil nom va o'lchamdagi fayllarni takrorlamaslik
      const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const uniqueNew = arrayFiles.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
      return [...prev, ...uniqueNew];
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, submitNow = false) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Qisqacha mazmun (Sarlavha) talab etiladi');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Batafsil tavsif talab etiladi');
      return;
    }

    // Majburiy maydonlar docType bo'yicha tekshiriladi
    if (docType === 'INCOMING' && !form.senderOrg.trim()) {
      toast.error('Kiruvchi xat uchun yuboruvchi tashkilot nomi kiritilishi shart');
      return;
    }
    if (docType === 'OUTGOING' && !form.recipientOrg.trim()) {
      toast.error('Chiquvchi xat uchun qabul qiluvchi tashkilot nomi kiritilishi shart');
      return;
    }

    const validApprovers = selectedApprovers.filter((a) => a.approverId > 0);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('priority', form.priority);
      formData.append('docType', docType);

      if (form.overallDeadline) formData.append('overallDeadline', form.overallDeadline);

      // docType ga xos maydonlar
      if (docType === 'INCOMING') {
        if (form.senderOrg) formData.append('senderOrg', form.senderOrg.trim());
        if (form.senderDocNumber) formData.append('senderDocNumber', form.senderDocNumber.trim());
        if (form.senderDate) formData.append('senderDate', form.senderDate);
        if (form.resolution) formData.append('resolution', form.resolution.trim());
      } else if (docType === 'OUTGOING') {
        if (form.recipientOrg) formData.append('recipientOrg', form.recipientOrg.trim());
        if (form.deliveryMethod) formData.append('deliveryMethod', form.deliveryMethod);
        if (form.parentDocId) formData.append('parentDocId', form.parentDocId);
      }

      // Qo'lda kiritilgan xat raqami (barcha hujjat turlari uchun)
      if (form.docNumber.trim()) formData.append('docNumber', form.docNumber.trim());

      if (executorId) {
        formData.append('executorId', String(executorId));
      }

      formData.append('approvers', JSON.stringify(validApprovers.map((a) => ({
        approverId: a.approverId,
        stepDeadline: a.stepDeadline || undefined,
      }))));

      // Barcha fayllarni biriktirish (duplikat bo'lmasligi uchun faqat 'files' orqali yuboriladi)
      files.forEach((f) => {
        formData.append('files', f);
      });

      const response = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const docId = response.data.data.id;

      if (submitNow) {
        await api.patch(`/documents/${docId}/submit`);
        if (validApprovers.length === 0) {
          toast.success('Hujjat ro\'yxatga olindi va to\'g\'ridan-to\'g\'ri ijroga yo\'naltirildi! 🚀');
        } else {
          toast.success('Hujjat yaratildi va tasdiqlash zanjiriga yuborildi!');
        }
      } else {
        toast.success('Hujjat qoralama sifatida saqlandi!');
      }

      router.push(`/dashboard/documents/${docId}`);
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Past', color: 'rgb(148 163 184)' },
    { value: 'NORMAL', label: 'Oddiy', color: 'rgb(96 165 250)' },
    { value: 'HIGH', label: 'Yuqori', color: 'rgb(251 191 36)' },
    { value: 'URGENT', label: 'Shoshilinch', color: 'rgb(248 113 113)' },
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Yangi hujjatni ro&apos;yxatga olish</h1>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Hujjat turini tanlang, rekvizitlarni to&apos;ldiring va ijroga yoki tasdiqqa yo&apos;naltiring
          </p>
        </div>
      </div>

      {/* DocType Selector Tabs */}
      <div className="glass-card p-2 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setDocType('INCOMING')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
            docType === 'INCOMING'
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
              : 'border-white/[0.06] hover:bg-white/[0.03] text-[rgb(var(--text-secondary))]'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
            docType === 'INCOMING' ? 'bg-sky-500/20 text-sky-400' : 'bg-white/[0.04]'
          }`}>
            📥
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-[rgb(var(--text-primary))]">Kiruvchi xat</p>
            <p className="text-xs text-[rgb(var(--text-muted))] truncate">Tashkilotlardan kelgan xatlar</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setDocType('OUTGOING')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
            docType === 'OUTGOING'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
              : 'border-white/[0.06] hover:bg-white/[0.03] text-[rgb(var(--text-secondary))]'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
            docType === 'OUTGOING' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.04]'
          }`}>
            📤
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-[rgb(var(--text-primary))]">Chiquvchi xat</p>
            <p className="text-xs text-[rgb(var(--text-muted))] truncate">Tashkilotlarga yuboriladigan xat</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setDocType('INTERNAL')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
            docType === 'INTERNAL'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'border-white/[0.06] hover:bg-white/[0.03] text-[rgb(var(--text-secondary))]'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
            docType === 'INTERNAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04]'
          }`}>
            📄
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-[rgb(var(--text-primary))]">Ichki hujjat</p>
            <p className="text-xs text-[rgb(var(--text-muted))] truncate">Ichki buyruq va xizmat yozishmalari</p>
          </div>
        </button>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Tizim xat raqami (qo'lda kiritiladigan) */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base">🔖</span>
            <label className="text-sm font-semibold text-[rgb(var(--text-primary))] whitespace-nowrap">
              {docType === 'INCOMING' ? 'Kiruvchi xat raqami:' : docType === 'OUTGOING' ? 'Chiquvchi xat raqami:' : 'Hujjat raqami:'}
            </label>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={form.docNumber}
              onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
              className="input-field w-full font-mono"
              placeholder={docType === 'INCOMING' ? 'Masalan: KIR-2026-0042 yoki 01-14/582' : docType === 'OUTGOING' ? 'Masalan: CHIQ-2026-0015' : 'Masalan: ICH-2026-0007'}
            />
          </div>
          <p className="text-xs text-[rgb(var(--text-muted))] shrink-0">
            Bo'sh qoldirsangiz — avtomatik beriladi
          </p>
        </div>

        {/* 1. Hujjat turi bo'yicha maxsus rekvizitlar (Kiruvchi / Chiquvchi) */}
        {docType === 'INCOMING' && (
          <div className="glass-card p-6 space-y-4 border-sky-500/25 bg-sky-500/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📥</span>
              <h2 className="text-base font-semibold text-sky-400">Kiruvchi xat rekvizitlari (Jurnal ma&apos;lumotlari)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  Yuboruvchi tashkilot (Kimdan kelgan) <span className="text-rose-500">*</span>
                </label>
                <input
                  value={form.senderOrg}
                  onChange={(e) => setForm({ ...form, senderOrg: e.target.value })}
                  className="input-field"
                  placeholder="Masalan: O'ztransgaz AJ, Toshkent shahar hokimligi..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  Xat raqami (Chiquvchi №)
                </label>
                <input
                  value={form.senderDocNumber}
                  onChange={(e) => setForm({ ...form, senderDocNumber: e.target.value })}
                  className="input-field"
                  placeholder="Masalan: 01-14/582"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  Xat sanasi (Yuborilgan sana)
                </label>
                <input
                  type="date"
                  value={form.senderDate}
                  onChange={(e) => setForm({ ...form, senderDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  Mas&apos;ul ijrochi xodim
                </label>
                <select
                  value={executorId}
                  onChange={(e) => setExecutorId(Number(e.target.value) || '')}
                  className="select-field w-full"
                >
                  <option value="">-- Ijrochi tanlang (Ixtiyoriy) --</option>
                  {approvers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">
                      {u.fullName} {u.department ? `(${u.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                Rahbar rezolyutsiyasi / Ko&apos;rsatma
              </label>
              <textarea
                value={form.resolution}
                onChange={(e) => setForm({ ...form, resolution: e.target.value })}
                className="input-field resize-none"
                rows={2}
                placeholder="Masalan: Ijro uchun qabul qilinsin, 25-sanagacha xulosa berilsin..."
              />
            </div>
          </div>
        )}

        {docType === 'OUTGOING' && (
          <div className="glass-card p-6 space-y-4 border-amber-500/25 bg-amber-500/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📤</span>
              <h2 className="text-base font-semibold text-amber-400">Chiquvchi xat rekvizitlari (Jurnal ma&apos;lumotlari)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  Qabul qiluvchi tashkilot (Kimga yuborilmoqda) <span className="text-rose-500">*</span>
                </label>
                <input
                  value={form.recipientOrg}
                  onChange={(e) => setForm({ ...form, recipientOrg: e.target.value })}
                  className="input-field"
                  placeholder="Masalan: Qurilish vazirligi, Toshkent shahar hokimligi..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  Yetkazish usuli
                </label>
                <select
                  value={form.deliveryMethod}
                  onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
                  className="select-field w-full"
                >
                  {deliveryMethods.map((dm) => (
                    <option key={dm} value={dm} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">
                      {dm}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  <LinkIcon size={14} className="inline mr-1 text-amber-400" />
                  Bog&apos;langan kiruvchi xat (Javob xati bo&apos;lsa asos xatni tanlang)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={form.parentDocId}
                    onChange={(e) => setForm({ ...form, parentDocId: e.target.value })}
                    className="select-field flex-1"
                  >
                    <option value="">-- Asos xat yo&apos;q (Yangi tashabbus xati) --</option>
                    {incomingDocs.map((doc) => (
                      <option key={doc.id} value={doc.id} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">
                        [{doc.docNumber}] {doc.senderOrg ? `${doc.senderOrg} — ` : ''}{doc.title}
                      </option>
                    ))}
                  </select>
                  {form.parentDocId && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, parentDocId: '' })}
                      className="btn-ghost p-2 text-rose-400 hover:text-rose-300"
                      title="Bog'lanishni bekor qilish"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {form.parentDocId && (
                  <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ushbu chiquvchi xat tanlangan kiruvchi xat bilan o&apos;zaro bog&apos;lanadi.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Asosiy ma'lumotlar */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-4">
            {docType === 'INCOMING' ? 'Xat mazmuni va muddat' : docType === 'OUTGOING' ? 'Xat mavzusi va muddat' : 'Asosiy ma\'lumotlar'}
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--text-secondary))]">
              Qisqacha mazmun (Sarlavha) <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder={
                docType === 'INCOMING'
                  ? "Masalan: №44-sonli shartnoma bo'yicha to'lov so'rovi"
                  : docType === 'OUTGOING'
                  ? "Masalan: №44-sonli shartnoma yuzasidan bildirishnoma"
                  : "Hujjat sarlavhasini kiriting..."
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--text-secondary))]">
              Batafsil tavsif <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none"
              rows={4}
              placeholder="Hujjat haqida batafsil ma'lumot, asosiy talab yoki sabablar..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--text-secondary))]">
                Kategoriya
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="select-field w-full"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(148 163 184)' }}>
                Ustuvorlik
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.value })}
                    className="py-2 rounded-lg text-xs font-medium transition-all border"
                    style={{
                      background: form.priority === p.value ? p.color + '20' : 'rgb(var(--bg-elevated))',
                      borderColor: form.priority === p.value ? p.color + '60' : 'rgb(var(--border))',
                      color: form.priority === p.value ? p.color : 'rgb(var(--text-secondary))',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(148 163 184)' }}>
                <Calendar size={14} className="inline mr-1.5" />
                Ijro muddati / Deadline (ixtiyoriy)
              </label>
              <input
                type="datetime-local"
                value={form.overallDeadline}
                onChange={(e) => setForm({ ...form, overallDeadline: e.target.value })}
                className="input-field"
              />
            </div>

            {docType !== 'INCOMING' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(148 163 184)' }}>
                  Mas&apos;ul ijrochi (ixtiyoriy)
                </label>
                <select
                  value={executorId}
                  onChange={(e) => setExecutorId(Number(e.target.value) || '')}
                  className="select-field w-full"
                >
                  <option value="">-- Hujjat egasi yakunlaydi --</option>
                  {approvers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">
                      {u.fullName} ({u.department || 'Bo\'limsiz'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 3. Bir nechta fayl biriktirish (Multi-File Attachment) */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">Biriktirilgan fayllar</h2>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                Xatning skaner nusxasi, ilovalari, hisob-faktura yoki boshqa asoslovchi fayllarni yuklang (bir nechta fayl mumkin)
              </p>
            </div>
            {files.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {files.length} ta fayl
              </span>
            )}
          </div>

          {/* Upload Dropzone */}
          <label
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.5)] cursor-pointer transition-all bg-[rgb(var(--bg-elevated)/0.5)] mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleAddFiles(e.dataTransfer.files);
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]">
              <Upload size={20} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                Fayllarni yuklash uchun bosing yoki sudrab olib keling
              </p>
              <p className="text-xs mt-1 text-[rgb(var(--text-muted))]">
                PDF, Word, Excel, JPG, PNG — cheklanmagan sonli biriktirmalar
              </p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleAddFiles(e.target.files)}
            />
          </label>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2.5">
              {files.map((f, idx) => {
                const meta = getFileTypeMeta(f.name);
                return (
                  <div
                    key={`${f.name}_${f.size}_${idx}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 border ${meta.badgeBg} ${meta.badgeBorder}`}
                    >
                      <FileText size={15} className={meta.iconText} />
                      <span className={`text-[8px] font-extrabold leading-none mt-0.5 ${meta.badgeText}`}>{meta.ext}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate" title={f.name}>
                        {f.name}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {formatFileSize(f.size)} • {idx === 0 ? 'Asosiy fayl' : `Ilova #${idx}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                      title="O'chirish"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Tasdiqlash zanjiri (Approval Chain) */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">Tasdiqlash zanjiri (Marshrut)</h2>
              <p className="text-xs mt-0.5 text-[rgb(var(--text-muted))]">
                Ketma-ket tartibda tasdiqlovchi rahbarlarni belgilang (ixtiyoriy)
              </p>
            </div>
            <button type="button" onClick={addApprover} className="btn-ghost text-sm py-2 px-3">
              <Plus size={14} />
              Bosqich qo&apos;shish
            </button>
          </div>

          <div className="space-y-3">
            {selectedApprovers.map((ap, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.3)]">
                  {index + 1}
                </div>
                <select
                  value={ap.approverId}
                  onChange={(e) => updateApprover(index, 'approverId', e.target.value)}
                  className="select-field text-sm py-2 flex-1"
                  style={{ minWidth: 0 }}
                >
                  <option value={0}>Tasdiqlovchini tanlang...</option>
                  {approvers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))]">
                      {u.fullName} {u.department ? `— ${u.department}` : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={ap.stepDeadline}
                  onChange={(e) => updateApprover(index, 'stepDeadline', e.target.value)}
                  className="input-field text-sm py-2 flex-none"
                  style={{ width: '220px' }}
                  placeholder="Bosqich muddati"
                />
                <button
                  type="button"
                  onClick={() => removeApprover(index)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                  title="Bosqichni o'chirish"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {selectedApprovers.filter((a) => a.approverId > 0).length === 0 && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl mt-3 bg-amber-500/[0.08] border border-amber-500/30 text-amber-400">
              <Zap size={16} className="shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-[rgb(var(--text-primary))]">
                  Tasdiqlovchi belgilanmagan (To&apos;g&apos;ridan-to&apos;g&apos;ri ijro)
                </p>
                <p className="text-[rgb(var(--text-muted))] mt-0.5">
                  Hujjat tasdiqlash bosqichisiz to&apos;g&apos;ridan-to&apos;g&apos;ri ijroga yoki yakunlashga yo&apos;naltiriladi.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
            disabled={loading}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="btn-ghost"
            disabled={loading}
          >
            Qoralama saqla
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner w-4 h-4" /> Yuborilmoqda...</>
            ) : selectedApprovers.filter((a) => a.approverId > 0).length === 0 ? (
              <>
                <Zap size={15} />
                <span>To&apos;g&apos;ridan-to&apos;g&apos;ri ijroga yuborish ⚡</span>
              </>
            ) : (
              <span>Tasdiqlashga yuborish →</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Yuklanmoqda...</div>}>
      <NewDocumentContent />
    </Suspense>
  );
}
