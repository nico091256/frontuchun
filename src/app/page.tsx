'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isStoreReady = mounted && (_hasHydrated || (typeof useAuthStore.persist?.hasHydrated === 'function' && useAuthStore.persist.hasHydrated()));

  useEffect(() => {
    if (!isStoreReady) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (isAuthenticated || token) {
      const role = useAuthStore.getState().user?.role;
      if (role === 'ADMIN') {
        router.replace('/dashboard');
      } else if (role === 'APPROVER') {
        router.replace('/dashboard/approvals');
      } else {
        router.replace('/dashboard/documents');
      }
    } else {
      router.replace('/login');
    }
  }, [isStoreReady, isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner" />
    </div>
  );
}
