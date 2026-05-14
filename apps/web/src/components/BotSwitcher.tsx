// ============================================
// Bot Switcher — Przełącznik między botami
// ============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronDown, Lock, Unlock, Circle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const BOT_CONFIG = {
  PRIVATE: {
    name: 'Prywatny Bot',
    description: 'Twój osobisty bot',
    gradient: 'from-violet-500 to-indigo-600',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
  PUBLIC: {
    name: 'Główny Bot',
    description: 'Bot publiczny',
    gradient: 'from-emerald-500 to-cyan-600',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
} as const;

type BotType = 'PRIVATE' | 'PUBLIC';

export function BotSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { user, activeBotType, setActiveBotType } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [botStatuses, setBotStatuses] = useState<Record<string, boolean>>({
    private: false,
    public: false,
  });

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data?.bots) {
          setBotStatuses({
            private: res.data.bots.private?.online || false,
            public: res.data.bots.public?.online || false,
          });
        }
      } catch {}
    };
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOwner = user?.role === 'OWNER';
  const activeConfig = BOT_CONFIG[activeBotType];
  const hasAccess = (botType: BotType) => {
    if (isOwner || user?.role === 'ADMIN') return true;
    return user?.whitelist?.includes(botType) || false;
  };

  const handleSwitch = (botType: BotType) => {
    if (!hasAccess(botType)) return;
    setActiveBotType(botType);
    setIsOpen(false);
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
          `bg-gradient-to-br ${activeConfig.gradient}`,
        )}
        title={activeConfig.name}
      >
        <Bot className="w-4 h-4 text-white" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border',
          activeConfig.bgColor,
          activeConfig.borderColor,
          'hover:brightness-110',
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0',
            activeConfig.gradient,
          )}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className={cn('text-xs font-bold', activeConfig.color)}>{activeConfig.name}</p>
          <p className="text-[10px] text-foreground-subtle truncate">{activeConfig.description}</p>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-foreground-subtle transition-transform flex-shrink-0',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-background-secondary border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {(Object.keys(BOT_CONFIG) as BotType[]).map((botType) => {
              const config = BOT_CONFIG[botType];
              const canAccess = hasAccess(botType);
              const isActive = activeBotType === botType;
              const statusKey = botType.toLowerCase();
              const isOnline = botStatuses[statusKey];

              return (
                <button
                  key={botType}
                  onClick={() => handleSwitch(botType)}
                  disabled={!canAccess}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 transition-all text-left',
                    isActive && config.bgColor,
                    canAccess
                      ? 'hover:bg-glass-light cursor-pointer'
                      : 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      isActive
                        ? `bg-gradient-to-br ${config.gradient}`
                        : 'bg-background-elevated border border-border',
                    )}
                  >
                    <Bot className={cn('w-4 h-4', isActive ? 'text-white' : 'text-foreground-subtle')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-xs font-bold', isActive ? config.color : 'text-foreground')}>
                        {config.name}
                      </p>
                      <Circle
                        className={cn(
                          'w-2 h-2 flex-shrink-0',
                          isOnline ? 'text-green-400 fill-green-400' : 'text-red-400 fill-red-400',
                        )}
                      />
                    </div>
                    <p className="text-[10px] text-foreground-subtle">{config.description}</p>
                  </div>
                  {canAccess ? (
                    <Unlock className="w-3 h-3 text-foreground-subtle flex-shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-foreground-subtle flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
