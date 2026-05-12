'use client';

import { motion } from 'framer-motion';
import { Shield, Coins, Star, Ticket, Zap, HandMetal, Users, BarChart3, MessageSquare, Loader2, AlertCircle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/providers/LanguageProvider';

const anim = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function ServerOverviewPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const MODULES_MAP = [
    { id: 'moderation', key: 'moderationEnabled', name: t.sidebar.moderation, desc: t.moderation.description, icon: Shield, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { id: 'automod', key: 'automodEnabled', name: t.sidebar.automod, desc: t.automod.description, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'economy', key: 'economyEnabled', name: t.sidebar.economy, desc: 'Waluta, sklep, daily, ranking', icon: Coins, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'levels', key: 'levelsEnabled', name: t.sidebar.levels, desc: 'Doświadczenie, rangi, nagrody', icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'tickets', key: 'ticketsEnabled', name: t.sidebar.tickets, desc: t.tickets.description, icon: Ticket, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'welcome', key: 'welcomeEnabled', name: t.sidebar.welcome, desc: 'Wiadomości powitalne i pożegnalne', icon: HandMetal, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { id: 'reaction-roles', key: 'reactionRolesEnabled', name: t.sidebar.reactionRoles, desc: 'Nadawanie ról przez reakcje', icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 'analytics', key: null, name: t.sidebar.analytics, desc: 'Wykresy, statystyki, raporty', icon: BarChart3, color: 'text-accent', bg: 'bg-accent/10' },
    { id: 'logs', key: 'loggingEnabled', name: t.sidebar.logs, desc: 'Historia akcji i zdarzeń', icon: MessageSquare, color: 'text-foreground-secondary', bg: 'bg-glass' },
  ];

  useEffect(() => {
    if (!serverId) return;
    
    api.get(`/guilds/${serverId}/config`)
      .then(res => {
        setConfig(res.data.data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Nie udało się pobrać konfiguracji');
        setIsLoading(false);
      });
  }, [serverId]);

  const handleToggle = async (e: React.MouseEvent, key: string | null, currentVal: boolean) => {
    e.preventDefault(); // Zapobiegamy nawigacji przy kliknięciu w przełącznik
    if (!key || !serverId) return;

    try {
      const newVal = !currentVal;
      await api.patch(`/guilds/${serverId}/config`, { [key]: newVal });
      setConfig((prev: any) => ({ ...prev, [key]: newVal }));
      toast.success(`Moduł ${newVal ? 'włączony' : 'wyłączony'}`);
    } catch (err) {
      toast.error('Błąd podczas aktualizacji modułu');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-foreground-secondary">{t.common.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-rose-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.05 }} className="space-y-8">
      <motion.div variants={anim} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.sidebar.overview}</h1>
          <p className="text-foreground-secondary mt-1">{t.dashboard.selectServer}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-status-success">
          <span className="status-dot-online" /> Bot aktywny
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES_MAP.map((mod) => {
          const isEnabled = mod.key ? config?.[mod.key] === true : true;

          return (
            <motion.div key={mod.id} variants={anim}>
              <Link href={`/dashboard/servers/${serverId}/${mod.id}`}>
                <div className="module-card group relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', mod.bg)}>
                      <mod.icon className={cn('w-5 h-5', mod.color)} />
                    </div>
                    
                    {mod.key ? (
                       <div 
                        onClick={(e) => handleToggle(e, mod.key, isEnabled)}
                        className={cn(
                          'w-10 h-5 rounded-full relative transition-all cursor-pointer',
                          isEnabled ? 'bg-accent shadow-lg shadow-accent/20' : 'bg-background-tertiary border border-border'
                        )}
                       >
                         <motion.div 
                          animate={{ x: isEnabled ? 20 : 2 }}
                          initial={false}
                          className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm"
                         />
                       </div>
                    ) : (
                      <div className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded uppercase">Systemowy</div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">{mod.name}</h3>
                  <p className="text-sm text-foreground-secondary line-clamp-2">{mod.desc}</p>
                  
                  {/* Subtle Gradient Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
