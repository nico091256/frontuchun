'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { DocumentTemplate, DocumentType, Priority } from '@/types';
import {
  FileText, Plus, Search, Edit3, Trash2, X, Check,
  Sparkles, ArrowRight, Tag, Info, Layers, Bookmark, CheckCircle2,
} from 'lucide-react';
import { docTypeConfig, priorityConfig } from '@/lib/utils';
import toast from 'react-hot-toast';

const TEMPLATE_VARIABLES = [
  { tag: '{XODIM_ISMI}', label: 'Xodim ismi', example: 'Aziz Rahimov' },
  { tag: '{BO\'LIM}', label: 'Bo\'lim', example: 'IT Boshqarmasi' },
  { tag: '{LAVOZIM}', label: 'Lavozim', example: 'Bosh mutaxassis' },
  { tag: '{SANA}', label: 'Bugungi sana', example: '22.09.2026' },
  { tag: '{TASHKILOT}', label: 'Tashkilot nomi', example: 'Discover BPM' },
  { tag: '{QABUL_QILUVCHI}', label: 'Qabul qiluvchi', example: 'Bosh direktorga' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdminOrInitiator = user?.role === 'ADMIN' || user?.role === 'INITIATOR';

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('ARIZA');
  const [formDocType, setFormDocType] = useState<DocumentType>('INTERNAL');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('NORMAL');
  const [formDescription, setFormDescription] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error('Fetch templates error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormCategory('ARIZA');
    setFormDocType('INTERNAL');
    setFormContent('A R I Z A\n\nMenga {SANA} dan boshlab mehnat ta\'tili berishingizni so\'rayman.\n\nAriza beruvchi: {XODIM_ISMI}\nBo\'lim: {BO\'LIM}');
    setFormPriority('NORMAL');
    setFormDescription('Kadrlar bo\'limi uchun mehnat ta\'tili arizasi shabloni');
    setIsModalOpen(true);
  };

  const openEditModal = (t: DocumentTemplate) => {
    setEditingTemplate(t);
    setFormTitle(t.title);
    setFormCategory(t.category);
    setFormDocType(t.docType);
    setFormContent(t.content);
    setFormPriority(t.defaultPriority || 'NORMAL');
    setFormDescription(t.description || '');
    setIsModalOpen(true);
  };

  const insertVariable = (tag: string) => {
    if (!textareaRef.current) {
      setFormContent((prev) => prev + ' ' + tag);
      return;
    }

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = formContent;
    const newText = text.substring(0, start) + tag + text.substring(end);

    setFormContent(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + tag.length;
        textareaRef.current.selectionEnd = start + tag.length;
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Shablon nomi va mazmuni kiritilishi shart');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        category: formCategory,
        docType: formDocType,
        content: formContent,
        defaultPriority: formPriority,
        description: formDescription,
      };

      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, payload);
        toast.success('Shablon yangilandi');
      } else {
        await api.post('/templates', payload);
        toast.success('Yangi shablon yaratildi');
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Ushbu shablonni o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/templates/${id}`);
      toast.success('Shablon o\'chirildi');
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !selectedCategory || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bookmark size={24} className="text-amber-500 shrink-0" />
            Hujjat Shablonlari Kutubxonasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tayyor rasmiy shablonlar va dinamik teglar orqali hujjatlarni 1 soniyada shakllantirish
          </p>
        </div>

        {isAdminOrInitiator && (
          <button
            onClick={openCreateModal}
            className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 font-semibold shadow-lg shadow-amber-500/25 shrink-0"
          >
            <Plus size={16} />
            Yangi Shablon Yaratish
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shablon nomi, kategoriya yoki mazmun bo'yicha qidiruv..."
            className="input-field !pl-10 !py-2.5 text-xs sm:text-sm w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                selectedCategory === ''
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 dark:text-amber-400'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Barchasi ({templates.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 dark:text-amber-400'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bookmark size={42} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold text-base mb-1">
            Hali shablonlar yaratilmagan
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mb-4">
            Arizalar, buyruqlar va xizmat xatlari uchun tayyor shablon yaratib qo'ying.
          </p>
          {isAdminOrInitiator && (
            <button onClick={openCreateModal} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
              <Plus size={14} /> Shablon yaratish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((t) => {
            const dtc = docTypeConfig[t.docType as keyof typeof docTypeConfig] || docTypeConfig.INTERNAL;
            const pc = priorityConfig[t.defaultPriority as keyof typeof priorityConfig] || priorityConfig.NORMAL;

            return (
              <div
                key={t.id}
                className="glass-card p-5 flex flex-col justify-between group hover:border-amber-500/40 transition-all duration-300 relative"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {t.category}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${dtc.bg} ${dtc.color} ${dtc.border}`}>
                      <span>{dtc.icon}</span>
                      <span>{dtc.shortLabel}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors mb-1.5 leading-snug">
                    {t.title}
                  </h3>

                  {t.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  {/* Content Preview */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] font-mono text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed whitespace-pre-wrap">
                    {t.content}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1.5">
                    {isAdminOrInitiator && (
                      <>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/documents/new?templateId=${t.id}`)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-semibold"
                  >
                    <span>Ishlatish</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                {editingTemplate ? 'Shablonni Tahrirlash' : 'Yangi Hujjat Shablonini Yaratish'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Shablon Nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Masalan: Mehnat ta'tili arizasi"
                    className="input-field text-xs sm:text-sm py-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kategoriya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value.toUpperCase())}
                    placeholder="ARIZA, BUYRUQ, BILDIRISHNOMA..."
                    className="input-field text-xs sm:text-sm py-2 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hujjat Turi
                  </label>
                  <select
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value as DocumentType)}
                    className="select-field text-xs sm:text-sm py-2"
                  >
                    <option value="INTERNAL">Ichki hujjat (Servis xati / Ariza)</option>
                    <option value="INCOMING">Kiruvchi xat</option>
                    <option value="OUTGOING">Chiquvchi xat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sukut Ustuvorligi
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as Priority)}
                    className="select-field text-xs sm:text-sm py-2"
                  >
                    <option value="LOW">Past</option>
                    <option value="NORMAL">Oddiy</option>
                    <option value="HIGH">Yuqori</option>
                    <option value="URGENT">Shoshilinch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Qisqacha Izoh / Tavsif
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Shablon maqsadi haqida qisqacha ma'lumot..."
                  className="input-field text-xs sm:text-sm py-2"
                />
              </div>

              {/* Dynamic Variables Chips Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Tag size={13} className="text-amber-500" />
                    Dinamik Teglar (Ustiga bosing):
                  </label>
                  <span className="text-[11px] text-slate-400">Avtomatik o&apos;rin almashadi</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1"
                      title={`${v.label} (Masalan: ${v.example})`}
                    >
                      <span>{v.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Shablon Matni <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  required
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Shablon matnini shu yerga yozing..."
                  className="input-field font-mono text-xs sm:text-sm p-3 leading-relaxed resize-y w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 font-semibold"
                >
                  {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
