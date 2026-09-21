'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, FileText, Shield, CheckCircle, Clock } from 'lucide-react';
import DiscoverLogo from '@/components/common/DiscoverLogo';
import DiscoverSplash from '@/components/common/DiscoverSplash';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, _hasHydrated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('di_login_intro_shown');
      if (alreadyShown) {
        setShowSplash(false);
      }
    }
  }, []);

  const handleSplashDone = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('di_login_intro_shown', 'true');
    }
    setShowSplash(false);
  };

  const getRoleHomePath = (role?: string) => {
    if (role === 'ADMIN') return '/dashboard';
    if (role === 'APPROVER') return '/dashboard/approvals';
    return '/dashboard/documents';
  };

  useEffect(() => {
    const isReady = _hasHydrated || (typeof useAuthStore.persist?.hasHydrated === 'function' && useAuthStore.persist.hasHydrated());
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (isReady && isAuthenticated && token) {
      const currentRole = user?.role || useAuthStore.getState().user?.role;
      router.replace(getRoleHomePath(currentRole));
    }
  }, [isAuthenticated, _hasHydrated, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email va parolni kiriting');
      return;
    }
    try {
      await login(email, password);
      toast.success('Muvaffaqiyatli kirdingiz!');
      const currentRole = useAuthStore.getState().user?.role;
      router.push(getRoleHomePath(currentRole));
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } });
      toast.error(errorData?.response?.data?.message || 'Email yoki parol noto\'g\'ri');
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@bpm.uz', icon: Shield },
    { role: 'Tashabbuskor', email: 'initiator@bpm.uz', icon: FileText },
    { role: 'Tasdiqlovchi', email: 'approver1@bpm.uz', icon: CheckCircle },
    { role: 'Ijrochi', email: 'executor@bpm.uz', icon: Clock },
  ];

  return (
    <div className="min-h-screen flex relative transition-colors" style={{ background: 'rgb(var(--bg-base))' }}>
      {showSplash && <DiscoverSplash onFinish={handleSplashDone} minDuration={1300} />}

      {/* Top right theme switch button */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle showLabel />
      </div>

      {/* Left: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <DiscoverLogo height={42} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Xush kelibsiz! 👋
            </h1>
            <p style={{ color: 'rgb(var(--text-secondary))' }} className="text-sm">
              Discover Invest — Hujjatlarni Tasdiqlash va Ijro Nazorati Tizimiga kiring
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                Email manzil
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="sizning@email.uz"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <><div className="spinner w-4 h-4" /> Kirish...</>
              ) : (
                <><LogIn size={18} /> Tizimga kirish</>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgb(var(--primary))' }}>
              Demo hisoblar (parol: 123456)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword('123456'); }}
                  className="p-3 rounded-xl text-left transition-all duration-150 border"
                  style={{
                    background: 'rgb(var(--bg-surface))',
                    borderColor: 'rgb(var(--border))',
                    boxShadow: 'var(--card-shadow)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(217, 119, 6, 0.45)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(217, 119, 6, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))';
                    (e.currentTarget as HTMLElement).style.background = 'rgb(var(--bg-surface))';
                  }}
                >
                  <div className="text-xs font-semibold mb-0.5" style={{ color: 'rgb(var(--text-primary))' }}>{acc.role}</div>
                  <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Features */}
      <div
        className="hidden lg:flex flex-col justify-center p-12 w-[480px] relative overflow-hidden transition-colors"
        style={{
          background: 'linear-gradient(145deg, rgb(var(--bg-elevated)) 0%, rgb(var(--bg-surface)) 100%)',
          borderLeft: '1px solid rgb(var(--border))',
        }}
      >
        {/* Ambient subtle gold glow */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
          }}
        />

        <div className="space-y-8 relative z-10">
          <div>
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-3 border"
              style={{
                background: 'rgba(217, 119, 6, 0.1)',
                borderColor: 'rgba(217, 119, 6, 0.25)',
                color: '#D97706',
              }}
            >
              Discover Invest Holding
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Ko'p bosqichli korporativ tizim
            </h2>
            <p style={{ color: 'rgb(var(--text-secondary))' }} className="text-sm leading-relaxed">
              Kompaniya hujjatlarini yaratish, ko'p bosqichli tasdiqlash zanjiriga yo'naltirish va ijro intizomini real vaqt rejimida nazorat qilish.
            </p>
          </div>

          {[
            {
              icon: '📄',
              title: 'Hujjat yaratish va tasdiqlash',
              desc: 'Fayllar biriktirish, ko\'p bosqichli tasdiqlovchilar zanjiri va avtomatlashtirilgan ijro',
              color: '#F59E0B',
            },
            {
              icon: '✅',
              title: 'Ketma-ket bosqichli nazorat',
              desc: 'Har bir bosqich uchun shaxsiy muddat va eslatmalar bilan qat\'iy zanjir',
              color: '#10B981',
            },
            {
              icon: '⏰',
              title: 'Deadline va ijro intizomi',
              desc: 'Muddati yaqinlashgan yoki o\'tgan topshiriqlar bo\'yicha avtomatik monitoring',
              color: '#F59E0B',
            },
            {
              icon: '⚡',
              title: 'Tezkor bildirishnomalar',
              desc: 'Real-time bildirishnomalar, audio signallar va qat\'iy xavfsizlik',
              color: '#E31E24',
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-4 items-start group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110"
                style={{
                  background: `${feature.color}18`,
                  border: `1px solid ${feature.color}35`,
                }}
              >
                {feature.icon}
              </div>
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
                  {feature.title}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {feature.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
