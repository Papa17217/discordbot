// ============================================
// Sidebar — Premium Discord-like Navigation
// ============================================

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Server, Shield, Coins, Star, Ticket,
  BarChart3, Settings, Crown, MessageSquare, Bot,
  Users, Zap, ChevronLeft, Sparkles, HandMetal, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { getDiscordAvatarUrl } from '@/lib/utils';

const mainLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/servers', label: 'Serwery', icon: Server },
  { href: '/dashboard/premium', label: 'Premium', icon: Crown },
  { href: '/dashboard/settings', label: 'Ustawienia', icon: Settings },
];

const serverLinks = [
  { href: '', label: 'Przegląd', icon: LayoutDashboard },
  { href: '/moderation', label: 'Moderacja', icon: Shield },
  { href: '/automod', label: 'AutoMod', icon: Zap },
  { href: '/economy', label: 'Ekonomia', icon: Coins },
  { href: '/levels', label: 'Poziomy', icon: Star },
  { href: '/tickets', label: 'Tickety', icon: Ticket },
  { href: '/welcome', label: 'Powitania', icon: HandMetal },
  { href: '/reaction-roles', label: 'Reaction Roles', icon: Layers },
  { href: '/roles', label: 'Role', icon: Users },
  { href: '/analytics', label: 'Analityka', icon: BarChart3 },
  { href: '/logs', label: 'Logi', icon: MessageSquare },
  { href: '/settings', label: 'Ustawienia', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { user } = useAuthStore();

  const isServerPage = !!params?.id;
  
  const links = useMemo(() => {
    let baseLinks = isServerPage ? [...serverLinks] : [...mainLinks];
    
    // Dodaj Staff i Konsolę tylko dla OWNER/ADMIN w głównym menu
    if (!isServerPage && user && ['OWNER', 'ADMIN'].includes(user.role)) {
      baseLinks.splice(2, 0, { href: '/dashboard/admin/staff', label: 'Ekipa', icon: Shield });
      baseLinks.splice(3, 0, { href: '/dashboard/console', label: 'Konsola', icon: Terminal });
    }

    
    return baseLinks;
  }, [isServerPage, user]);

  const basePath = isServerPage ? `/dashboard/servers/${params.id}` : '';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 border-r border-border bg-background-secondary/95 backdrop-blur-xl',
        sidebarCollapsed ? 'w-[72px]' : 'w-[280px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold gradient-text whitespace-nowrap">Discord SaaS</h1>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebarCollapse}
          className="ml-auto p-1.5 rounded-lg hover:bg-glass-light transition-colors"
        >
          <ChevronLeft className={cn('w-4 h-4 text-foreground-muted transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isServerPage && !sidebarCollapsed && (
          <div className="px-3 mb-3">
            <Link href="/dashboard/servers" className="text-xs text-foreground-subtle hover:text-foreground-secondary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Powrót do serwerów
            </Link>
          </div>
        )}

        {links.map((link) => {
          const fullHref = basePath + link.href || '/dashboard';
          const isActive = pathname === fullHref || (link.href === '' && pathname === basePath);

          return (
            <Link key={link.href} href={fullHref}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground-secondary hover:bg-glass-light hover:text-foreground',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <link.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-accent')} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl bg-glass', sidebarCollapsed && 'justify-center px-0')}>
          <div className="w-8 h-8 rounded-full bg-background-elevated overflow-hidden flex-shrink-0">
            {user && (
              <img
                src={getDiscordAvatarUrl(user.discordId, user.avatar)}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && user && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-foreground-subtle">{user.subscription === 'PREMIUM' ? '⭐ Premium' : 'Free'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
