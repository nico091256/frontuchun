'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  BarChart3,
  LogOut,
  Settings,
  ChevronRight,
  X,
  ClipboardList,
  TrendingUp,
  Trophy,
  Bookmark,
  Inbox,
} from 'lucide-react';
import { cn, roleLabels, hasPermission } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useUiStore } from '@/store/uiStore';
import DiscoverLogo from '@/components/common/DiscoverLogo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard, roles: ['ADMIN'] },
  { href: '/dashboard/incoming-emails', label: 'Kiruvchi Xatlar 📩', icon: Inbox },
  { href: '/dashboard/documents', label: 'Hujjatlar', icon: FileText },
  { href: '/dashboard/templates', label: 'Hujjat shablonlari', icon: Bookmark },
  { href: '/dashboard/approvals', label: 'Tasdiqlashlar', icon: CheckSquare },
  { href: '/dashboard/admin/users', label: 'Foydalanuvchilar', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/admin/audit-log', label: 'Faoliyat logi', icon: ClipboardList, roles: ['ADMIN'] },
  { href: '/dashboard/admin/reports', label: 'Hisobotlar', icon: BarChart3, roles: ['ADMIN'] },
  { href: '/dashboard/admin/kpi-rating', label: 'KPI Reytingi', icon: Trophy, roles: ['ADMIN'] },
  { href: '/dashboard/profile', label: 'Profil', icon: Settings },
  { href: '/dashboard/kpi', label: 'KPI va Samaradorlik', icon: TrendingUp },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUiStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Tizimdan chiqildi');
    router.push('/login');
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === '/dashboard/incoming-emails') {
      return (
        user?.role === 'ADMIN' ||
        user?.role === 'SECRETARY' ||
        hasPermission(user, 'INCOMING_MANAGE')
      );
    }
    if (item.href === '/dashboard/templates') {
      return (
        user?.role === 'ADMIN' ||
        user?.role === 'INITIATOR' ||
        user?.role === 'SECRETARY' ||
        hasPermission(user, 'TEMPLATES_MANAGE')
      );
    }
    if (item.href === '/dashboard/admin/users') {
      return user?.role === 'ADMIN' || hasPermission(user, 'USERS_MANAGE');
    }
    if (item.href === '/dashboard/admin/reports') {
      return user?.role === 'ADMIN' || hasPermission(user, 'REPORTS_VIEW');
    }
    return !item.roles || (user?.role && item.roles.includes(user.role));
  });


  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={closeSidebar} 
        />
      )}

      <aside className={cn(
        "sidebar fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Discover Invest Official Logo */}
        <div className="sidebar-logo h-16 px-5 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <DiscoverLogo height={30} className="group-hover:opacity-90 transition-opacity" />
          </Link>
          <button onClick={closeSidebar} className="md:hidden p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--text-muted))' }}>
            Menyu
          </p>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-item', active && 'active')}
                onClick={() => closeSidebar()}
              >
                <Icon size={17} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} style={{ color: 'rgb(var(--primary))' }} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
        {/* User info - Links to Profile */}
        <Link
          href="/dashboard/profile"
          onClick={closeSidebar}
          className="flex items-center gap-3 p-3 rounded-xl mb-3 border transition-all duration-200 hover:border-amber-500/40 hover:bg-amber-500/5 group cursor-pointer"
          style={{
            background: 'rgb(var(--bg-elevated))',
            borderColor: 'rgb(var(--border))',
          }}
          title="Profil bo'limiga o'tish"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.12))',
              color: '#D97706',
              border: '1px solid rgba(217, 119, 6, 0.3)',
            }}
          >
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" style={{ color: 'rgb(var(--text-primary))' }}>
              {user?.fullName}
            </div>
            <div className="text-xs truncate" style={{ color: 'rgb(var(--text-muted))' }}>
              {roleLabels[user?.role || ''] || user?.role}
            </div>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="nav-item w-full text-left"
          style={{ color: 'rgb(var(--error))' }}
        >
          <LogOut size={16} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
    </>
  );
}
