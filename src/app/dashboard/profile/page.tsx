'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { Save, User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    department: '',
    position: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        fullName: form.fullName,
        department: form.department,
        position: form.position,
        phone: form.phone,
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const res = await api.patch('/auth/me', payload);
      setUser(res.data.data as User);
      toast.success('Profil muvaffaqiyatli yangilandi');
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      toast.error(errorData?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">Mening profilim</h1>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Shaxsiy ma'lumotlar va xavfsizlik sozlamalari
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-[rgb(var(--border))]">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                 style={{ background: 'rgb(var(--primary) / 0.15)', color: 'rgb(var(--primary))', border: '1px solid rgb(var(--primary) / 0.3)' }}>
              {user.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{user.fullName}</p>
              <p className="text-sm text-[rgb(var(--text-secondary))]">{user.role} — {user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">To'liq ism</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Telefon raqam</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Bo'lim</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Lavozim</label>
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="pt-6 border-t border-[rgb(var(--border))]">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Parolni o'zgartirish (ixtiyoriy)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Joriy parol</label>
                <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Yangi parol</label>
                <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <div className="spinner w-4 h-4" /> : <><Save size={15} /> Saqlash</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
