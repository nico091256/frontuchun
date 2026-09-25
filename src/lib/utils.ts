import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DocumentStatus, Priority, StepStatus, Permission, Role, User, DocumentType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Document Type configuration (Kiruvchi, Chiquvchi, Ichki)
export const docTypeConfig: Record<DocumentType, { label: string; shortLabel: string; color: string; bg: string; border: string; icon: string }> = {
  INCOMING: {
    label: 'Kiruvchi hujjat',
    shortLabel: 'Kiruvchi',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-300 dark:border-sky-800',
    icon: '📥',
  },
  OUTGOING: {
    label: 'Chiquvchi hujjat',
    shortLabel: 'Chiquvchi',
    color: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-800',
    icon: '📤',
  },
  INTERNAL: {
    label: 'Ichki hujjat',
    shortLabel: 'Ichki',
    color: 'text-emerald-800 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    icon: '📄',
  },
};

// Status badge colors - high contrast WCAG compliant for both Light and Dark themes
export const statusConfig: Record<DocumentStatus, { label: string; color: string; bg: string; icon: string }> = {
  DRAFT: { label: 'Qoralama', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700', icon: '📝' },
  IN_APPROVAL: { label: 'Tasdiqlashda', color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800', icon: '⏳' },
  APPROVED: { label: 'Tasdiqlandi', color: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800', icon: '✅' },
  IN_EXECUTION: { label: 'Ijroda', color: 'text-blue-800 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800', icon: '⚙️' },
  COMPLETED: { label: 'Yakunlandi', color: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800', icon: '✅' },
  REJECTED: { label: 'Rad etildi', color: 'text-red-800 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800', icon: '❌' },
  EXPIRED: { label: 'Muddati o\'tdi', color: 'text-orange-800 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800', icon: '⚠️' },
};

export const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW: { label: 'Past', color: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
  NORMAL: { label: 'Oddiy', color: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  HIGH: { label: 'Yuqori', color: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  URGENT: { label: 'Shoshilinch', color: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

export const stepStatusConfig: Record<StepStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Kutmoqda', color: 'text-amber-700 dark:text-amber-300', icon: '⏳' },
  APPROVED: { label: 'Tasdiqlandi', color: 'text-emerald-700 dark:text-emerald-300', icon: '✅' },
  REJECTED: { label: 'Rad etildi', color: 'text-red-700 dark:text-red-300', icon: '❌' },
  EXPIRED: { label: 'Muddati o\'tdi', color: 'text-orange-700 dark:text-orange-300', icon: '⚠️' },
  SKIPPED: { label: 'O\'tkazib yuborildi', color: 'text-slate-600 dark:text-slate-400', icon: '⏭️' },
};

const UZ_MONTHS_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

// Format date in clean Uzbek format (e.g. "16-sen, 2026")
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const month = UZ_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}, ${year}`;
};

// Format date and time in clean Uzbek format (e.g. "16-sen, 2026 14:30")
export const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const month = UZ_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}, ${year} ${hours}:${minutes}`;
};

// Deadline relative
export const getDeadlineStatus = (
  deadline?: string,
  status?: string
): { label: string; color: string; urgent: boolean } => {
  if (!deadline) return { label: 'Belgilanmagan', color: 'text-slate-400', urgent: false };

  // Agar hujjat allaqachon yakunlangan / bajarilgan bo'lsa (COMPLETED, EXECUTED, APPROVED, REJECTED, CANCELLED)
  const isFinished = status && ['COMPLETED', 'EXECUTED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status);
  if (isFinished) {
    return { label: 'Yakunlangan', color: 'text-emerald-400', urgent: false };
  }

  const now = new Date();
  const due = new Date(deadline);
  const diff = due.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (diff < 0) return { label: 'Muddati o\'tgan', color: 'text-red-400', urgent: true };
  if (days <= 1) return { label: `${days} kun qoldi`, color: 'text-red-400', urgent: true };
  if (days <= 3) return { label: `${days} kun qoldi`, color: 'text-amber-400', urgent: true };
  if (days <= 7) return { label: `${days} kun qoldi`, color: 'text-amber-400', urgent: false };
  return { label: `${days} kun qoldi`, color: 'text-emerald-400', urgent: false };
};

// File size format
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Role labels
export const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  INITIATOR: 'Tashabbuskor',
  APPROVER: 'Tasdiqlovchi',
  EXECUTOR: 'Ijrochi',
  SECRETARY: 'Kanselyariya (KOTIB)',
};

// Action history labels
export const actionLabels: Record<string, string> = {
  CREATED: 'Yaratildi',
  SUBMITTED: 'Tasdiqlashga yuborildi',
  ALL_APPROVED: 'Barcha bosqich tasdiqlandi',
  COMPLETED: 'Yakunlandi',
  OVERALL_EXPIRED: 'Muddat tugadi',
};

// UTF-8 Mojibake / Latin-1 encoding corrector & control character sanitizer
export const fixEncoding = (str?: string): string => {
  if (!str) return '';
  let result = str;
  try {
    if (/[\u00C0-\u00FF]/.test(str)) {
      result = decodeURIComponent(escape(str));
    }
  } catch {
    try {
      if (typeof window !== 'undefined' && 'TextDecoder' in window) {
        const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
        result = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      }
    } catch {}
  }
  return result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '').trim();
};

export interface FileTypeMeta {
  ext: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconText: string;
  type: 'word' | 'excel' | 'pdf' | 'image' | 'archive' | 'other';
}

export const getFileTypeMeta = (filename?: string): FileTypeMeta => {
  if (!filename) {
    return {
      ext: 'FAYL',
      badgeBg: 'bg-indigo-500/10',
      badgeText: 'text-indigo-400',
      badgeBorder: 'border-indigo-500/25',
      iconBg: 'bg-indigo-500/15',
      iconText: 'text-indigo-400',
      type: 'other',
    };
  }

  const cleanName = fixEncoding(filename);
  const parts = cleanName.split('.');
  const rawExt = parts.length > 1 ? parts.pop()!.toUpperCase() : 'FAYL';
  // Keep extension short (max 5 chars)
  const ext = rawExt.length <= 5 ? rawExt : 'FAYL';

  if (['DOC', 'DOCX', 'RTF', 'ODT'].includes(ext)) {
    return {
      ext,
      badgeBg: 'bg-blue-50 dark:bg-blue-500/10',
      badgeText: 'text-blue-700 dark:text-blue-400',
      badgeBorder: 'border-blue-200 dark:border-blue-500/25',
      iconBg: 'bg-blue-100 dark:bg-blue-500/15',
      iconText: 'text-blue-600 dark:text-blue-400',
      type: 'word',
    };
  }

  if (['XLS', 'XLSX', 'CSV', 'ODS'].includes(ext)) {
    return {
      ext,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      badgeText: 'text-emerald-700 dark:text-emerald-400',
      badgeBorder: 'border-emerald-200 dark:border-emerald-500/25',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      type: 'excel',
    };
  }

  if (ext === 'PDF') {
    return {
      ext,
      badgeBg: 'bg-rose-50 dark:bg-rose-500/10',
      badgeText: 'text-rose-700 dark:text-rose-400',
      badgeBorder: 'border-rose-200 dark:border-rose-500/25',
      iconBg: 'bg-rose-100 dark:bg-rose-500/15',
      iconText: 'text-rose-600 dark:text-rose-400',
      type: 'pdf',
    };
  }

  if (['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF'].includes(ext)) {
    return {
      ext,
      badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
      badgeText: 'text-amber-700 dark:text-amber-400',
      badgeBorder: 'border-amber-200 dark:border-amber-500/25',
      iconBg: 'bg-amber-100 dark:bg-amber-500/15',
      iconText: 'text-amber-600 dark:text-amber-400',
      type: 'image',
    };
  }

  if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) {
    return {
      ext,
      badgeBg: 'bg-slate-100 dark:bg-purple-500/10',
      badgeText: 'text-slate-700 dark:purple-400',
      badgeBorder: 'border-slate-300 dark:border-purple-500/25',
      iconBg: 'bg-slate-200 dark:bg-purple-500/15',
      iconText: 'text-slate-700 dark:text-purple-400',
      type: 'archive',
    };
  }

  return {
    ext,
    badgeBg: 'bg-slate-100 dark:bg-violet-500/10',
    badgeText: 'text-slate-700 dark:text-violet-400',
    badgeBorder: 'border-slate-300 dark:border-violet-500/25',
    iconBg: 'bg-slate-200 dark:bg-violet-500/15',
    iconText: 'text-slate-700 dark:text-violet-400',
    type: 'other',
  };
};

export interface PermissionItem {
  key: Permission;
  label: string;
  description: string;
}

export const PERMISSION_ITEMS: PermissionItem[] = [
  {
    key: 'DOC_CREATE',
    label: 'Hujjat yaratish',
    description: 'Yangi hujjat tuzish va tasdiqqa/ijroga yuborish huquqi',
  },
  {
    key: 'DOC_APPROVE',
    label: 'Hujjat tasdiqlash',
    description: 'Tasdiqlash zanjirida qatnashish va qaror qabul qilish',
  },
  {
    key: 'DOC_EXECUTE',
    label: 'Ijroni bajarish',
    description: 'Hujjatni ijro qilish va ijro hisobotini topshirish',
  },
  {
    key: 'REPORTS_VIEW',
    label: 'Hisobotlarni ko\'rish',
    description: 'Analitika, hisobotlar va monitoring bo\'limiga kirish',
  },
  {
    key: 'USERS_MANAGE',
    label: 'Xodimlarni boshqarish',
    description: 'Foydalanuvchilar ro\'yxatini ko\'rish va boshqarish',
  },
  {
    key: 'DOC_DELETE',
    label: 'Hujjatlarni o\'chirish',
    description: 'Hujjatlarni tizimdan butunlay o\'chirish huquqi',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ['DOC_CREATE', 'DOC_APPROVE', 'DOC_EXECUTE', 'REPORTS_VIEW', 'USERS_MANAGE', 'DOC_DELETE', 'INCOMING_MANAGE', 'TEMPLATES_MANAGE'],
  INITIATOR: ['DOC_CREATE', 'DOC_EXECUTE', 'TEMPLATES_MANAGE'],
  APPROVER: ['DOC_APPROVE', 'DOC_EXECUTE'],
  EXECUTOR: ['DOC_EXECUTE'],
  SECRETARY: ['DOC_CREATE', 'DOC_EXECUTE', 'INCOMING_MANAGE', 'TEMPLATES_MANAGE'],
};


export const hasPermission = (user: User | null | undefined, perm: Permission): boolean => {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(perm);
  }

  return DEFAULT_ROLE_PERMISSIONS[user.role]?.includes(perm) || false;
};
