'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Mail, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Zap,
  TrendingUp,
  FileCheck,
  Building2
} from 'lucide-react';
import DiscoverLogo from '@/components/common/DiscoverLogo';
import DiscoverSplash from '@/components/common/DiscoverSplash';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, _hasHydrated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('di_login_intro_shown');
      if (!alreadyShown) {
        const timer = setTimeout(() => setShowSplash(true), 0);
        return () => clearTimeout(timer);
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
    if (!email.trim() || !password) {
      toast.error('Iltimos, email va parolni kiriting');
      return;
    }
    try {
      await login(email.trim(), password);
      toast.success('Xush kelibsiz! Tizimga muvaffaqiyatli kirdingiz.');
      const currentRole = useAuthStore.getState().user?.role;
      router.push(getRoleHomePath(currentRole));
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } });
      toast.error(errorData?.response?.data?.message || 'Email yoki parol noto\'g\'ri kiritildi');
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden transition-colors selection:bg-amber-500/20 selection:text-amber-500" style={{ background: 'rgb(var(--bg-base))' }}>
      {showSplash && <DiscoverSplash onFinish={handleSplashDone} minDuration={1300} />}

      {/* Dynamic Animated Ambient Lights */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Glow Orb 1 (Amber Gold) */}
        <div 
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-40 dark:opacity-30 animate-pulse transition-all duration-1000"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.15) 50%, transparent 70%)',
            animationDuration: '8s'
          }}
        />
        {/* Glow Orb 2 (Discover Crimson) */}
        <div 
          className="absolute top-1/2 -right-40 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] opacity-30 dark:opacity-20 animate-pulse transition-all duration-1000"
          style={{
            background: 'radial-gradient(circle, rgba(227, 30, 36, 0.3) 0%, rgba(245, 158, 11, 0.1) 60%, transparent 70%)',
            animationDuration: '10s'
          }}
        />
        {/* Glow Orb 3 (Bottom Slate/Gold) */}
        <div 
          className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full blur-[130px] opacity-25 dark:opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.35) 0%, transparent 70%)',
          }}
        />

        {/* Futuristic Subtle Architectural Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* Top right theme switch */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-colors"
          style={{
            background: 'rgba(var(--bg-surface), 0.7)',
            borderColor: 'rgb(var(--border))',
            color: 'rgb(var(--text-secondary))'
          }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block -ml-3.5" />
          <span>BPM Server faol</span>
        </div>
        <ThemeToggle showLabel />
      </div>

      {/* ── Left Side: Login Form Portal ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 relative z-10">
        <div className="w-full max-w-[440px] animate-fade-in">
          
          {/* Brand Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-5 border backdrop-blur-md shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(227, 30, 36, 0.06))',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                color: '#D97706',
              }}>
              <Sparkles size={13} className="text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Discover Invest • BPM Enterprise</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <DiscoverLogo height={44} />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Tizimga xush kelibsiz
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
              Hujjatlar aylanishi va ijro intizomini nazorat qilishning yagona korporativ boshqaruv tizimi
            </p>
          </div>

          {/* Luxury Frosted Card Form */}
          <div 
            className="p-8 sm:p-9 rounded-3xl border relative backdrop-blur-xl shadow-2xl transition-all duration-300"
            style={{
              background: 'rgba(var(--bg-surface), 0.75)',
              borderColor: 'rgb(var(--border))',
              boxShadow: 'var(--card-shadow), 0 20px 40px -15px rgba(0,0,0,0.07)'
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                  Korporativ Email
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11 pr-4 py-3 text-sm rounded-xl transition-all duration-200 focus:ring-2 focus:ring-amber-500/30"
                    placeholder="xodim@bpm.uz"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Maxfiy Parol
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11 pr-12 py-3 text-sm rounded-xl transition-all duration-200 focus:ring-2 focus:ring-amber-500/30"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                    title={showPassword ? 'Parolni yashirish' : 'Parolni ko\u2018rsatish'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember & Support */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: 'rgb(var(--text-secondary))' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>Meni eslab qolish</span>
                </label>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                  IT Helpdesk: ichki 104
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-xl py-3.5 px-6 font-semibold text-white shadow-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #E31E24 100%)',
                  boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.4), 0 8px 10px -6px rgba(217, 119, 6, 0.2)'
                }}
              >
                {/* Shimmer light effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                <div className="relative flex items-center justify-center gap-2.5">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Tekshirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>Tizimga kirish</span>
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 duration-200" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Security Guarantee Badge */}
            <div className="mt-7 pt-5 border-t flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500" style={{ borderColor: 'rgb(var(--border))' }}>
              <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
              <span>256-bit SSL shifrlash va xavfsiz JWT sessiya</span>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Discover Invest. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>

      {/* ── Right Side: Futuristic Showcase Visuals ────────────── */}
      <div 
        className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16 relative overflow-hidden transition-colors border-l"
        style={{
          background: 'linear-gradient(145deg, rgba(var(--bg-elevated), 0.7) 0%, rgba(var(--bg-surface), 0.85) 100%)',
          borderColor: 'rgb(var(--border))',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Ambient Top Glow */}
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[110px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)'
          }}
        />

        {/* Top Header Information */}
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
            <Building2 size={16} />
            <span>Discover Invest Holding</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
            Aqlli korporativ boshqaruv va tezkor ijro intizomi
          </h2>
          <p className="text-sm xl:text-base leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
            {"Hujjatlarni loyihalashdan boshlab, raqamli imzolash, ko'p bosqichli tasdiqlash va yakuniy ijrogacha bo'lgan to'liq tsiklli avtomatlashtirish."}
          </p>
        </div>

        {/* Centerpiece: Interactive 3D Simulated Live Workflow Card */}
        <div className="relative z-10 my-8">
          <div 
            className="p-6 xl:p-7 rounded-3xl border relative backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:scale-[1.01]"
            style={{
              background: 'rgba(var(--bg-surface), 0.85)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Mock Document Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                  <FileCheck size={20} />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-amber-500">#BPM-2025-084</div>
                  <div className="text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                    {"Yangi obyekt qurilishi texnik buyrug'i"}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Faol jarayonda
              </span>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4">
              {[
                { step: '1', title: 'Tashabbuskor', name: 'Loyiha muhandisi', status: 'done', time: '10:00' },
                { step: '2', title: 'Yuridik ekspertiza', name: 'Bosh yurist', status: 'done', time: '11:30' },
                { step: '3', title: 'Bosh direktor', name: 'Rahbariyat tasdiqlashi', status: 'active', time: 'Jarayonda...' },
                { step: '4', title: 'Texnik ijro', name: "Qurilish bo'linmasi", status: 'pending', time: 'Kutilmoqda' },
              ].map((item) => (
                <div key={item.step} className="flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-transform ${
                        item.status === 'done' 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : item.status === 'active'
                          ? 'bg-amber-500 text-white animate-bounce shadow-md'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status === 'done' ? <CheckCircle2 size={14} /> : item.step}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                        {item.title}
                      </div>
                      <div className="text-[11px]" style={{ color: 'rgb(var(--text-muted))' }}>
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-medium ${
                        item.status === 'done'
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : item.status === 'active'
                          ? 'text-amber-500 bg-amber-500/10 font-bold'
                          : 'text-slate-400 bg-slate-100 dark:bg-slate-800/50'
                      }`}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Glowing progress line at the bottom */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-6 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" 
                style={{ width: '70%' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Feature Metrics */}
        <div className="grid grid-cols-3 gap-4 relative z-10 pt-4 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="p-4 rounded-2xl border transition-all hover:border-amber-500/40" style={{ background: 'rgba(var(--bg-surface), 0.5)', borderColor: 'rgb(var(--border))' }}>
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs font-semibold">Tezkorlik</span>
            </div>
            <div className="text-xl font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>99.8%</div>
            <div className="text-[11px]" style={{ color: 'rgb(var(--text-muted))' }}>{"O'z vaqtida ijro"}</div>
          </div>

          <div className="p-4 rounded-2xl border transition-all hover:border-amber-500/40" style={{ background: 'rgba(var(--bg-surface), 0.5)', borderColor: 'rgb(var(--border))' }}>
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <Zap size={16} />
              <span className="text-xs font-semibold">Real-time</span>
            </div>
            <div className="text-xl font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>0.3s</div>
            <div className="text-[11px]" style={{ color: 'rgb(var(--text-muted))' }}>Sinxron bildirish</div>
          </div>

          <div className="p-4 rounded-2xl border transition-all hover:border-amber-500/40" style={{ background: 'rgba(var(--bg-surface), 0.5)', borderColor: 'rgb(var(--border))' }}>
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <ShieldCheck size={16} />
              <span className="text-xs font-semibold">Ishonchli</span>
            </div>
            <div className="text-xl font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>100%</div>
            <div className="text-[11px]" style={{ color: 'rgb(var(--text-muted))' }}>Shifrlangan audit</div>
          </div>
        </div>

      </div>
    </div>
  );
}
