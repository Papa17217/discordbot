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
  Users, Zap, ChevronLeft, Sparkles, HandMetal, Layers, Terminal, Globe
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { getDiscordAvatarUrl } from '@/lib/utils';
import { useTranslation } from '@/providers/LanguageProvider';

const useNavigation = () => {
  const { t } = useTranslation();
  
  const mainLinks = [
    { href: '/dashboard', label: t.sidebar.dashboard, icon: LayoutDashboard },
    { href: '/dashboard/servers', label: t.sidebar.servers, icon: Server },
    { href: '/dashboard/premium', label: t.sidebar.premium, icon: Crown },
    { href: '/dashboard/settings', label: t.sidebar.settings, icon: Settings },
  ];

  const serverLinks = [
    { href: '', label: t.sidebar.overview, icon: LayoutDashboard },
    { href: '/moderation', label: t.sidebar.moderation, icon: Shield },
    { href: '/automod', label: t.sidebar.automod, icon: Zap },
    { href: '/economy', label: t.sidebar.economy, icon: Coins },
    { href: '/levels', label: t.sidebar.levels, icon: Star },
    { href: '/tickets', label: t.sidebar.tickets, icon: Ticket },
    { href: '/welcome', label: t.sidebar.welcome, icon: HandMetal },
    { href: '/reaction-roles', label: t.sidebar.reactionRoles, icon: Layers },
    { href: '/roles', label: t.sidebar.roles, icon: Users },
    { href: '/analytics', label: t.sidebar.analytics, icon: BarChart3 },
    { href: '/logs', label: t.sidebar.logs, icon: MessageSquare },
    { href: '/settings', label: t.sidebar.settings, icon: Settings },
  ];

  const adminLinks = [
    { href: '/dashboard/admin/staff', label: t.sidebar.staff, icon: Shield, isGlobal: true },
    { href: '/dashboard/admin/settings', label: t.sidebar.global, icon: Settings, isGlobal: true },
    { href: '/dashboard/console', label: t.sidebar.console, icon: Terminal, isGlobal: true },
  ];

  return { mainLinks, serverLinks, adminLinks };
};

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { user } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();
  const { mainLinks, serverLinks, adminLinks } = useNavigation();

  const isServerPage = !!params?.id;
  
    if (user && ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      // W widoku serwera dodaj na końcu, w widoku głównym w środku
      if (isServerPage) {
        baseLinks.push(...adminLinks);
      } else {
        baseLinks.splice(2, 0, ...adminLinks);
      }
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
              <ChevronLeft className="w-3 h-3" /> {t.sidebar.backToServers}
            </Link>
          </div>
        )}

        {links.map((link: any) => {
          const fullHref = link.isGlobal ? link.href : (basePath + link.href || '/dashboard');

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

      {/* Language Switcher */}
      <div className="px-3 py-2 border-t border-border">
        <div className={cn('flex items-center gap-2', sidebarCollapsed ? 'flex-col' : 'justify-between')}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 text-foreground-subtle text-[10px] font-bold uppercase tracking-wider ml-1">
              <Globe className="w-3 h-3" /> Język
            </div>
          )}
          <div className="flex bg-background-elevated p-1 rounded-xl border border-border shrink-0">
             <button 
              onClick={() => setLanguage('pl')} 
              className={cn(
                'px-2 py-1 rounded-lg text-[9px] font-bold transition-all',
                language === 'pl' ? 'bg-accent text-white shadow-lg' : 'text-foreground-subtle hover:text-foreground'
              )}
             >
               PL
             </button>
             <button 
              onClick={() => setLanguage('en')} 
              className={cn(
                'px-2 py-1 rounded-lg text-[9px] font-bold transition-all',
                language === 'en' ? 'bg-accent text-white shadow-lg' : 'text-foreground-subtle hover:text-foreground'
              )}
             >
               EN
             </button>
          </div>
        </div>
      </div>

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
                <p className="text-xs text-foreground-subtle">{user.subscription === 'PREMIUM' ? '⭐ Premium' : t.sidebar.free}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
