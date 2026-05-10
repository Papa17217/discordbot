// ============================================
// Dashboard Layout — Sidebar + Topbar
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setLoading, user } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  useEffect(() => {
    // Sprawdź auth po załadowaniu store z localStorage
    setLoading(false);
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Ograniczenie dashboardu tylko dla OWNER / ADMIN (zgodnie z prośbą użytkownika)
    if (user && !['OWNER', 'ADMIN'].includes(user.role)) {
      router.push('/'); // Przekieruj na stronę główną jeśli nie ma uprawnień
    }
  }, [isAuthenticated, user, router, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (user && !['OWNER', 'ADMIN'].includes(user.role))) return null;

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
