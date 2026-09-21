'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Role, Permission } from '@/types';
import {
  Plus, Users, Shield, CheckSquare, Clock,
  Edit2, ToggleLeft, ToggleRight, X, Eye, EyeOff, Check, ShieldCheck,
  User as UserIcon, Key, Lock, Search, Filter, Trash2,
} from 'lucide-react';
import { formatDate, roleLabels, PERMISSION_ITEMS, DEFAULT_ROLE_PERMISSIONS } from '@/lib/utils';
import toast from 'react-hot-toast';
import Portal from '@/components/common/Portal';

const roleColors: Record<Role, { bg: string; color: string; border: string }> = {
  ADMIN:    { bg: 'bg-violet-500/10', color: 'text-violet-400', border: 'border-violet-500/20' },
  INITIATOR:{ bg: 'bg-blue-500/10',   color: 'text-blue-400',   border: 'border-blue-500/20' },
  APPROVER: { bg: 'bg-emerald-500/10',color: 'text-emerald-400',border: 'border-emerald-500/20' },
  EXECUTOR: { bg: 'bg-amber-500/10',  color: 'text-amber-400',  border: 'border-amber-500/20' },
};

interface CreateUserForm {
  fullName: string; email: string; password: string;
  role: Role; department: string; position: string; phone: string;
  telegramChatId: string;
  permissions: Permission[];
}

interface EditUserForm {
  fullName: string; email: string; department: string; position: string;
  phone: string; telegramChatId: string; role: Role; isActive: boolean;
}

type EditTab = 'info' | 'permissions' | 'password';

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);

  // ── Create modal ──
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading]   = useState(false);
  const [form, setForm] = useState<CreateUserForm>({
    fullName: '', email: '', password: '',
    role: 'INITIATOR', department: '', position: '', phone: '', telegramChatId: '',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.INITIATOR],
  });

  // ── Search & Filter ──
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState<string>('ALL');

  // ── Edit modal ──
  const [editTarget, setEditTarget]     = useState<User | null>(null);
  const [editTab, setEditTab]           = useState<EditTab>('info');
  const [editForm, setEditForm]         = useState<EditUserForm>({
    fullName: '', email: '', department: '', position: '', phone: '', telegramChatId: '', role: 'INITIATOR', isActive: true,
  });
  const [editPerms, setEditPerms]       = useState<Permission[]>([]);
  const [newPassword, setNewPassword]   = useState('');
  const [showNewPass, setShowNewPass]   = useState(false);
  const [editLoading, setEditLoading]   = useState(false);

  // ── open edit modal ──
  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditTab('info');
    setEditForm({
      fullName:       u.fullName,
      email:          u.email,
      department:     u.department      || '',
      position:       u.position        || '',
      phone:          u.phone           || '',
      telegramChatId: u.telegramChatId  || '',
      role:           u.role,
      isActive:       u.isActive,
    });
    setEditPerms(
      Array.isArray(u.permissions) && u.permissions.length > 0
        ? u.permissions
        : [...DEFAULT_ROLE_PERMISSIONS[u.role]]
    );
    setNewPassword('');
  };

  const closeEdit = () => { setEditTarget(null); setNewPassword(''); };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchUsers(); }, []);

  // ── Create handlers ──
  const handleRoleChange = (r: Role) =>
    setForm(p => ({ ...p, role: r, permissions: [...DEFAULT_ROLE_PERMISSIONS[r]] }));

  const toggleFormPerm = (p: Permission) =>
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(p)
        ? prev.permissions.filter(x => x !== p)
        : [...prev.permissions, p],
    }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error("Majburiy maydonlarni to'ldiring"); return;
    }
    setFormLoading(true);
    try {
      await api.post('/users', form);
      toast.success('Foydalanuvchi yaratildi!');
      setShowCreate(false);
      setForm({ fullName:'',email:'',password:'',role:'INITIATOR',department:'',position:'',phone:'',telegramChatId:'',permissions:[...DEFAULT_ROLE_PERMISSIONS.INITIATOR] });
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Xatolik');
    } finally { setFormLoading(false); }
  };

  // ── Edit: Info save ──
  const handleSaveInfo = async () => {
    if (!editTarget) return;
    if (!editForm.fullName.trim()) { toast.error("Ism bo'sh bo'lmasin"); return; }
    if (!editForm.email.trim()) { toast.error("Email bo'sh bo'lmasin"); return; }
    setEditLoading(true);
    try {
      await api.patch(`/users/${editTarget.id}`, editForm);
      toast.success("Ma'lumotlar saqlandi!");
      fetchUsers();
      closeEdit();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Xatolik');
    } finally { setEditLoading(false); }
  };

  // ── Edit: Permissions save ──
  const handleSavePerms = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.patch(`/users/${editTarget.id}`, { permissions: editPerms });
      toast.success('Huquqlar saqlandi!');
      fetchUsers();
      closeEdit();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Xatolik');
    } finally { setEditLoading(false); }
  };

  // ── Edit: Password reset ──
  const handleResetPassword = async () => {
    if (!editTarget) return;
    if (newPassword.length < 6) { toast.error("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setEditLoading(true);
    try {
      await api.patch(`/users/${editTarget.id}/password`, { newPassword });
      toast.success('Parol yangilandi!');
      setNewPassword('');
      closeEdit();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Xatolik');
    } finally { setEditLoading(false); }
  };

  // ── Toggle active ──
  const handleToggleActive = async (u: User) => {
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      toast.success(`${u.fullName} ${!u.isActive ? 'faollashtirildi' : 'deaktiv qilindi'}`);
      fetchUsers();
    } catch { toast.error('Xatolik'); }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'ADMIN').length,
    approvers:users.filter(u => u.role === 'APPROVER').length,
    active:   users.filter(u => u.isActive).length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );

  // ─────────── RENDER ───────────
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-1">Foydalanuvchilar</h1>
          <p className="text-sm text-[rgb(var(--text-muted))]">Jami {users.length} ta foydalanuvchi</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Yangi foydalanuvchi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Jami',        value:stats.total,    icon:Users,       color:'rgb(139 92 246)' },
          { label:'Admin',       value:stats.admins,   icon:Shield,      color:'rgb(167 139 250)' },
          { label:'Tasdiqlovchi',value:stats.approvers,icon:CheckSquare, color:'rgb(52 211 153)' },
          { label:'Faol',        value:stats.active,   icon:Clock,       color:'rgb(96 165 250)' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color+'20' }}>
                  <Icon size={15} style={{ color: s.color }} />
                </div>
                <span className="text-xs text-[rgb(var(--text-muted))]">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-[rgb(var(--text-primary))]">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Xodim ismi, email, bo'lim yoki lavozim bo'yicha qidiruv..."
            className="input-field w-full pl-9 py-2 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-[rgb(var(--text-muted))] shrink-0" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="select-field text-sm py-2 px-3 w-full sm:w-auto"
          >
            <option value="ALL">Barcha rollar</option>
            {(['INITIATOR','APPROVER','EXECUTOR','ADMIN'] as Role[]).map(r => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Rol</th>
              <th>Bo'lim / Lavozim</th>
              <th>Hujjatlar</th>
              <th>Holat</th>
              <th>Ro'yxatga olingan</th>
              <th className="text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[rgb(var(--text-muted))] text-sm">
                  Topilmadi
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                const rc = roleColors[u.role];
              return (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background:'rgb(139 92 246 / 0.15)', color:'rgb(167 139 250)', border:'1px solid rgb(139 92 246 / 0.2)' }}>
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[rgb(var(--text-primary))]">{u.fullName}</div>
                        <div className="text-xs text-[rgb(var(--text-muted))]">{u.email}</div>
                        {u.telegramChatId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 mt-1" title="Telegram Bot ulangan">
                            💬 TG: {u.telegramChatId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[rgb(var(--text-muted))] bg-white/[0.04] px-1.5 py-0.5 rounded mt-1" title="Telegram ulash uchun tahrirlang">
                            💬 TG yo'q
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`badge ${rc.bg} ${rc.color} border ${rc.border}`}>{roleLabels[u.role]}</span>
                      <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium">
                        {(u.permissions?.length || 0)} ta huquq
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-[rgb(var(--text-primary))]">{u.department || '—'}</div>
                    <div className="text-xs text-[rgb(var(--text-muted))]">{u.position || ''}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
                      <span>{u._count?.createdDocuments || 0} yaratdi</span>
                      <span>{u._count?.approvalSteps || 0} tasdiqladi</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background:   u.isActive ? 'rgb(52 211 153 / 0.1)'  : 'rgb(71 85 105 / 0.15)',
                      color:        u.isActive ? 'rgb(52 211 153)'         : 'rgb(148 163 184)',
                      borderColor:  u.isActive ? 'rgb(52 211 153 / 0.3)'  : 'rgb(71 85 105 / 0.3)',
                    }}>
                      {u.isActive ? '● Faol' : '○ Nofaol'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-[rgb(var(--text-muted))]">{formatDate(u.createdAt)}</span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit button */}
                      <button
                        onClick={() => openEdit(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)]"
                        title="Tahrirlash"
                      >
                        <Edit2 size={14} />
                      </button>
                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{
                          background: u.isActive ? 'rgb(52 211 153 / 0.1)' : 'rgb(71 85 105 / 0.1)',
                          color:      u.isActive ? 'rgb(52 211 153)'        : 'rgb(71 85 105)',
                        }}
                        title={u.isActive ? 'Deaktiv qilish' : 'Faollashtirish'}
                      >
                        {u.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* ══════════════ CREATE MODAL ══════════════ */}
      {showCreate && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-content" style={{ maxWidth:'620px', maxHeight:'min(92vh,720px)' }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[rgb(var(--border))] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.25)]">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">Yangi foydalanuvchi</h3>
                    <p className="text-xs text-[rgb(var(--text-muted))]">Ma'lumotlar va ruxsatlarni belgilang</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">To'liq ism *</label>
                      <input value={form.fullName} onChange={e => setForm({...form,fullName:e.target.value})}
                        className="input-field text-sm py-2" placeholder="Masalan: Aziz Rahimov" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Email *</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}
                        className="input-field text-sm py-2" placeholder="xodim@discover.uz" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Parol *</label>
                      <div className="relative">
                        <input type={showPassword?'text':'password'} value={form.password} onChange={e => setForm({...form,password:e.target.value})}
                          className="input-field text-sm py-2 pr-9" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
                          {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Rol *</label>
                      <select value={form.role} onChange={e => handleRoleChange(e.target.value as Role)}
                        className="select-field w-full text-sm py-2">
                        {(['INITIATOR','APPROVER','EXECUTOR','ADMIN'] as Role[]).map(r => (
                          <option key={r} value={r}>{roleLabels[r]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Bo'lim</label>
                      <input value={form.department} onChange={e => setForm({...form,department:e.target.value})}
                        className="input-field text-sm py-2" placeholder="Moliya bo'limi" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Lavozim</label>
                      <input value={form.position} onChange={e => setForm({...form,position:e.target.value})}
                        className="input-field text-sm py-2" placeholder="Bosh mutaxassis" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Telefon</label>
                      <input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}
                        className="input-field text-sm py-2" placeholder="+998 90 123 45 67" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-[rgb(var(--text-primary))]">Telegram Chat ID</label>
                        <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-500 hover:underline">
                          ID olish
                        </a>
                      </div>
                      <input value={form.telegramChatId} onChange={e => setForm({...form,telegramChatId:e.target.value})}
                        className="input-field text-sm py-2" placeholder="Masalan: 123456789" />
                    </div>

                    {/* Permissions */}
                    <div className="col-span-2 pt-3 border-t border-[rgb(var(--border))]">
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-[rgb(var(--text-primary))]">Ruxsatlar</label>
                          <p className="text-[11px] text-[rgb(var(--text-muted))]">Rol asosida standart ruxsatlar belgilandi</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.3)] font-semibold shrink-0">
                          {form.permissions.length} ta
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSION_ITEMS.map(item => {
                          const isChecked = form.permissions.includes(item.key);
                          return (
                            <div key={item.key} onClick={() => toggleFormPerm(item.key)}
                              className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-start gap-2.5 select-none ${
                                isChecked ? 'bg-[rgb(var(--primary)/0.1)] border-[rgb(var(--primary)/0.45)]'
                                          : 'bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))]'
                              }`}>
                              <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                                isChecked ? 'bg-[rgb(var(--primary))] border-[rgb(var(--primary))] text-black'
                                          : 'border-[rgb(var(--border-hover))] bg-[rgb(var(--bg-elevated))]'
                              }`}>
                                {isChecked && <Check size={11} strokeWidth={3}/>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold leading-tight text-[rgb(var(--text-primary))]">{item.label}</p>
                                <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5">{item.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3.5 sm:p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated)/0.4)] flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost text-sm py-2">Bekor</button>
                  <button type="submit" disabled={formLoading} className="btn-primary text-sm py-2">
                    {formLoading ? <div className="spinner w-4 h-4"/> : 'Yaratish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ══════════════ EDIT MODAL ══════════════ */}
      {editTarget && (
        <Portal>
          <div className="modal-overlay" onClick={closeEdit}>
            <div className="modal-content" style={{ maxWidth:'560px', maxHeight:'min(92vh,700px)' }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[rgb(var(--border))] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                    style={{ background:'rgb(var(--primary)/0.15)', color:'rgb(var(--primary))', border:'1px solid rgb(var(--primary)/0.3)' }}>
                    {editTarget.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">{editTarget.fullName}</h3>
                    <p className="text-xs text-[rgb(var(--text-muted))]">{editTarget.email}</p>
                  </div>
                </div>
                <button onClick={closeEdit}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] transition-colors">
                  <X size={18}/>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[rgb(var(--border))] shrink-0">
                {([
                  { key:'info',        label:"Ma'lumotlar",  icon: UserIcon },
                  { key:'permissions', label:'Huquqlar',     icon: ShieldCheck },
                  { key:'password',    label:'Parol',        icon: Lock },
                ] as { key: EditTab; label: string; icon: React.ElementType }[]).map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.key} onClick={() => setEditTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
                        editTab === tab.key
                          ? 'border-[rgb(var(--primary))] text-[rgb(var(--primary))]'
                          : 'border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
                      }`}>
                      <Icon size={13}/> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* ── TAB: Info ── */}
                {editTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">To'liq ism *</label>
                        <input value={editForm.fullName}
                          onChange={e => setEditForm({...editForm, fullName:e.target.value})}
                          className="input-field text-sm py-2" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Email *</label>
                        <input type="email" value={editForm.email}
                          onChange={e => setEditForm({...editForm, email:e.target.value})}
                          className="input-field text-sm py-2" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Rol</label>
                        <select value={editForm.role}
                          onChange={e => {
                            const r = e.target.value as Role;
                            setEditForm({...editForm, role:r});
                            setEditPerms([...DEFAULT_ROLE_PERMISSIONS[r]]);
                          }}
                          className="select-field w-full text-sm py-2">
                          {(['INITIATOR','APPROVER','EXECUTOR','ADMIN'] as Role[]).map(r => (
                            <option key={r} value={r}>{roleLabels[r]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Holat</label>
                        <select value={editForm.isActive ? 'true' : 'false'}
                          onChange={e => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                          className="select-field w-full text-sm py-2">
                          <option value="true">● Faol</option>
                          <option value="false">○ Nofaol</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Bo'lim</label>
                        <input value={editForm.department}
                          onChange={e => setEditForm({...editForm, department:e.target.value})}
                          className="input-field text-sm py-2" placeholder="Moliya bo'limi" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Lavozim</label>
                        <input value={editForm.position}
                          onChange={e => setEditForm({...editForm, position:e.target.value})}
                          className="input-field text-sm py-2" placeholder="Bosh mutaxassis" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Telefon</label>
                        <input value={editForm.phone}
                          onChange={e => setEditForm({...editForm, phone:e.target.value})}
                          className="input-field text-sm py-2" placeholder="+998 90 123 45 67" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-[rgb(var(--text-primary))]">Telegram Chat ID</label>
                          <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-500 hover:underline">
                            ID qanday olinadi?
                          </a>
                        </div>
                        <input value={editForm.telegramChatId}
                          onChange={e => setEditForm({...editForm, telegramChatId:e.target.value})}
                          className="input-field text-sm py-2" placeholder="Masalan: 123456789" />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button onClick={handleSaveInfo} disabled={editLoading} className="btn-primary text-sm py-2">
                        {editLoading ? <div className="spinner w-4 h-4"/> : <><Check size={14}/> Saqlash</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB: Permissions ── */}
                {editTab === 'permissions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[rgb(var(--text-muted))]">Xodimga beriladigan ruxsatlarni belgilang</p>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.3)] font-semibold">
                        {editPerms.length} ta faol
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSION_ITEMS.map(item => {
                        const isChecked = editPerms.includes(item.key);
                        return (
                          <div key={item.key}
                            onClick={() => setEditPerms(p =>
                              p.includes(item.key) ? p.filter(x=>x!==item.key) : [...p,item.key]
                            )}
                            className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-start gap-2.5 select-none ${
                              isChecked ? 'bg-[rgb(var(--primary)/0.1)] border-[rgb(var(--primary)/0.45)]'
                                        : 'bg-[rgb(var(--bg-surface))] border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))]'
                            }`}>
                            <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                              isChecked ? 'bg-[rgb(var(--primary))] border-[rgb(var(--primary))] text-black'
                                        : 'border-[rgb(var(--border-hover))] bg-[rgb(var(--bg-elevated))]'
                            }`}>
                              {isChecked && <Check size={11} strokeWidth={3}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold leading-tight text-[rgb(var(--text-primary))]">{item.label}</p>
                              <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5">{item.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-2">
                      <button onClick={handleSavePerms} disabled={editLoading} className="btn-primary text-sm py-2">
                        {editLoading ? <div className="spinner w-4 h-4"/> : <><Check size={14}/> Huquqlarni saqlash</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB: Password ── */}
                {editTab === 'password' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10">
                      <Key size={16} className="text-amber-600 dark:text-amber-400 shrink-0"/>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        <strong>{editTarget.fullName}</strong> ning parolini yangilaysiz. Xodimga yangi parolni xavfsiz yo'l bilan yetkazing.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-[rgb(var(--text-primary))]">Yangi parol *</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="input-field text-sm py-2 pr-9"
                          placeholder="Kamida 6 ta belgi"
                          autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
                          {showNewPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                      {newPassword && (
                        <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                          newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400'
                          : newPassword.length >= 6 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            newPassword.length >= 8 ? 'bg-emerald-500'
                            : newPassword.length >= 6 ? 'bg-amber-500'
                            : 'bg-red-500'
                          }`}/>
                          {newPassword.length >= 8 ? 'Kuchli parol'
                            : newPassword.length >= 6 ? "O'rtacha mustahkamlik"
                            : 'Juda qisqa'}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-2">
                      <button onClick={handleResetPassword} disabled={editLoading || newPassword.length < 6}
                        className="btn-primary text-sm py-2 disabled:opacity-50">
                        {editLoading ? <div className="spinner w-4 h-4"/> : <><Lock size={14}/> Parolni yangilash</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
