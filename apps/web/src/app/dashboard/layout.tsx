// ============================================
// Dashboard Layout — Sidebar + Topbar
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const DASHBOARD_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN'] as const;

function canAccessDashboard(user: { role: string } | null) {
  return !!user && DASHBOARD_ROLES.includes(user.role as (typeof DASHBOARD_ROLES)[number]);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setLoading, user } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const [hasHydrated, setHasHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    setLoading(false);

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && !canAccessDashboard(user)) {
      router.replace('/');
    }
  }, [hasHydrated, isAuthenticated, user, router, setLoading]);

  if (isLoading || !hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (user && !canAccessDashboard(user))) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'pl-[72px]' : 'pl-[280px]',
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
