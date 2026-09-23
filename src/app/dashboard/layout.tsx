'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import DiscoverSplash from '@/components/common/DiscoverSplash';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, fetchMe } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('di_dashboard_intro_shown');
      if (alreadyShown) {
        setShowSplash(false);
      }
    }
  }, []);

  const isStoreReady = mounted && (_hasHydrated || (typeof useAuthStore.persist?.hasHydrated === 'function' && useAuthStore.persist.hasHydrated()));

  useEffect(() => {
    if (!isStoreReady) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!isAuthenticated && !token) {
      router.replace('/login');
      return;
    }

    fetchMe();
  }, [isStoreReady, isAuthenticated, router, fetchMe]);

  const handleSplashDone = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('di_dashboard_intro_shown', 'true');
    }
    setShowSplash(false);
  };

  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false;

  if (!isStoreReady || (!isAuthenticated && !hasToken)) {
    return <DiscoverSplash minDuration={700} />;
  }

  return (
    <div className="flex min-h-screen max-w-full overflow-x-hidden">
      {showSplash && <DiscoverSplash onFinish={handleSplashDone} minDuration={1300} />}
      <Sidebar />
      <div className="main-content flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 page-content min-w-0">{children}</main>
      </div>
    </div>
  );
}
