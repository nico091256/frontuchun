'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Search, X, CheckCheck, Menu } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import DiscoverLogo from '@/components/common/DiscoverLogo';
import ThemeToggle from '@/components/common/ThemeToggle';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function Navbar() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, clearAllNotifications, addNotification } = useNotificationStore();
  const { toggleSidebar } = useUiStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        router.push(`/dashboard/documents?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push('/dashboard/documents');
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket.io
  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      socket.emit('join', user.id);
    });
    socket.on('notification', (notification) => {
      addNotification(notification);
      toast(notification.title, {
        icon: '🔔',
        duration: 4000,
      });
    });
    return () => { socket.disconnect(); };
  }, [user, addNotification]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notificationTypeIcons: Record<string, string> = {
    APPROVAL_REQUEST: '📋',
    APPROVED: '✅',
    REJECTED: '❌',
    DEADLINE_WARNING: '⏰',
    DEADLINE_EXPIRED: '⚠️',
    OVERALL_DEADLINE_EXPIRED: '🚨',
    DEFAULT: '🔔',
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3.5 transition-colors"
      style={{
        background: 'rgb(var(--bg-surface) / 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgb(var(--border))',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button onClick={toggleSidebar} className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
          <Menu size={20} />
        </button>
        <div className="md:hidden">
          <DiscoverLogo height={24} />
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgb(var(--text-muted))' }}
          />
          <input
            type="text"
            placeholder="Hujjat qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgb(var(--bg-elevated))',
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-primary))',
              width: '240px',
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Theme Toggle (Yorug' / Qorong'i) */}
        <ThemeToggle />

        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => {
              const next = !showNotifications;
              setShowNotifications(next);
              if (next) fetchNotifications();
            }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150"
            style={{
              background: showNotifications ? 'rgba(217, 119, 6, 0.15)' : 'rgb(var(--bg-elevated))',
              border: `1px solid ${showNotifications ? 'rgba(217, 119, 6, 0.4)' : 'rgb(var(--border))'}`,
            }}
          >
            <Bell size={16} style={{ color: showNotifications ? '#D97706' : 'rgb(var(--text-secondary))' }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: 'rgb(227 30 36)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div
              className="notification-panel absolute right-0 top-full mt-2 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in"
              style={{
                background: 'rgb(var(--bg-surface))',
                border: '1px solid rgb(var(--border))',
                boxShadow: 'var(--card-shadow-hover)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4"
                style={{ borderBottom: '1px solid rgb(var(--border))' }}
              >
                <div>
                  <span className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>Bildirishnomalar</span>
                  {unreadCount > 0 && (
                    <span
                      className="ml-2 badge"
                      style={{
                        background: 'rgba(217, 119, 6, 0.12)',
                        color: '#D97706',
                        border: '1px solid rgba(217, 119, 6, 0.25)',
                      }}
                    >
                      {unreadCount} yangi
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs flex items-center gap-1 font-medium hover:underline text-[rgb(var(--primary))]"
                    >
                      <CheckCheck size={13} />
                      Barchasini o'qi
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs font-medium text-[rgb(var(--text-muted))] hover:text-rose-500 transition-colors"
                      title="Barcha bildirishnomalarni tozalash"
                    >
                      Tozalash
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="p-1 rounded hover:bg-[rgb(var(--bg-elevated))] transition-colors">
                    <X size={16} className="text-[rgb(var(--text-muted))]" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-10" style={{ color: 'rgb(var(--text-muted))' }}>
                    <Bell size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Bildirishnomalar yo'q</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => {
                        if (!n.isRead) markAsRead(n.id);
                        setShowNotifications(false);
                        if (n.link) {
                          const safeLink = n.link.startsWith('/dashboard') ? n.link : `/dashboard${n.link.startsWith('/') ? '' : '/'}${n.link}`;
                          router.push(safeLink);
                        }
                      }}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="text-lg flex-shrink-0 mt-0.5">
                          {notificationTypeIcons[n.type] || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight" style={{ color: 'rgb(var(--text-primary))' }}>{n.title}</p>
                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#D97706' }} />
                            )}
                          </div>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                            {n.message}
                          </p>
                          <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-muted))' }}>
                            {formatDateTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar with Discover Invest golden aura - Links to Profile */}
        <Link
          href="/dashboard/profile"
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.12))',
            color: '#D97706',
            border: '1px solid rgba(217, 119, 6, 0.3)',
          }}
          title="Profil bo'limiga o'tish"
        >
          {user?.fullName?.charAt(0).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
