'use client';

import { motion } from 'framer-motion';
import { Server, Users, MessageSquare, Shield, Activity, Bot, Loader2, Clock, Cpu } from 'lucide-react';
import { cn, getDiscordAvatarUrl } from '@/lib/utils';
import { formatNumber, formatUptime } from '@discord-saas/shared';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/providers/LanguageProvider';

const anim = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Odświeżaj co 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setData(res.data);
    } catch (err) {
      toast.error(t.common.error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const stats = [
    { label: t.sidebar.roles, value: data?.users || 0, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: t.sidebar.servers, value: data?.guilds || 0, icon: Server, color: 'text-accent', bg: 'bg-accent/10' },
    { label: t.sidebar.tickets, value: data?.tickets || 0, icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: t.sidebar.moderation, value: 0, icon: Shield, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  const bot = data?.bot || { online: false };

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="space-y-8 pb-12">
      <motion.div variants={anim} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-foreground-secondary mt-1">{t.dashboard.recentActivity}</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-background-elevated rounded-xl border border-border transition-colors">
          <Activity className="w-5 h-5 text-foreground-subtle" />
        </button>
      </motion.div>

      {/* Bot Status */}
      <motion.div variants={anim} className="glass-card p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl -mr-20 -mt-20 rounded-full" />
        
        <div className="flex items-center justify-between flex-wrap gap-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg',
              bot.online ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-500 shadow-rose-500/10'
            )}>
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{bot.online ? 'Bot Online' : 'Bot Offline'}</h2>
                <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', bot.online ? 'bg-emerald-500' : 'bg-rose-500')} />
              </div>
              <div className="flex items-center gap-4 mt-1">
                 <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                   <Clock className="w-3.5 h-3.5" />
                   Uptime: <span className="text-foreground font-medium">{bot.online ? formatUptime(bot.uptime) : '0s'}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                   <Cpu className="w-3.5 h-3.5" />
                   {t.sidebar.settings}: <span className="text-foreground font-medium">{bot.online ? `${(bot.memoryUsage / 1024 / 1024).toFixed(1)} MB` : '0 MB'}</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider mb-1">Opóźnienie</p>
              <p className={cn('text-xl font-bold', bot.ping < 100 ? 'text-emerald-400' : 'text-amber-400')}>
                {bot.online ? `${bot.ping}ms` : '---'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider mb-1">Wersja</p>
              <p className="text-xl font-bold text-foreground">{bot.version || '1.0.0'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={anim} className="glass-card-hover p-6 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-foreground-subtle uppercase tracking-wider">{s.label}</span>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
            </div>
            <p className="text-3xl font-bold">{formatNumber(s.value)}</p>
            <div className="mt-3 h-1 w-full bg-background-tertiary rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className={cn('h-full', s.bg.replace('/10', ''))} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity + Recent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div variants={anim} className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Aktywność Globalna</h3>
            <div className="flex items-center gap-4 text-xs">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent" /> Tickety</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/10" /> Komendy</div>
            </div>
          </div>
          <div className="flex items-end gap-3 h-56">
            {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative h-full flex flex-col justify-end">
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: `${h}%` }} 
                    transition={{ delay: i * 0.05, duration: 0.8 }}
                    className="w-full bg-gradient-to-t from-accent/20 to-accent/40 rounded-t-lg group-hover:from-accent/30 group-hover:to-accent/60 transition-all cursor-pointer relative"
                  >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background-elevated px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity border border-border shadow-xl">
                       {Math.round(h * 1.5)}
                     </div>
                  </motion.div>
                </div>
                <span className="text-[10px] font-bold text-foreground-subtle uppercase">{['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'][i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={anim} className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold mb-6">Ostatnie Akcje</h3>
          <div className="space-y-4">
            {data?.recentActions?.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-border">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400')}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    <span className="text-blue-400">Nowy Ticket</span> od {a.user}
                  </p>
                  <p className="text-[10px] text-foreground-subtle uppercase font-bold mt-0.5">Otwarto przez {a.mod}</p>
                </div>
                <span className="text-[10px] font-bold text-foreground-subtle whitespace-nowrap">
                   {new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {!data?.recentActions?.length && (
              <div className="text-center py-12 opacity-30">
                <Activity className="w-10 h-10 mx-auto mb-2" />
                <p className="text-xs">{t.dashboard.recentActivity}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
