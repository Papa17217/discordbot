// ============================================
// Topbar — Breadcrumbs, Search, Status
// ============================================

'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, Menu, Command } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function Topbar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, toggleCommandPalette } = useUIStore();

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    isLast: i === segments.length - 1,
  }));

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-xl transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-[280px]',
      )}
    >
      {/* Left — Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-glass-light">
          <Menu className="w-5 h-5" />
        </button>
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-foreground-subtle">/</span>}
              <span className={cn(crumb.isLast ? 'text-foreground font-medium' : 'text-foreground-muted')}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right — Search, Notifications */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-tertiary border border-border text-foreground-subtle hover:border-border-light transition-all text-sm"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Szukaj...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-background-elevated rounded border border-border">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <button className="relative p-2.5 rounded-xl hover:bg-glass-light transition-colors">
          <Bell className="w-5 h-5 text-foreground-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>
      </div>
    </header>
  );
}
