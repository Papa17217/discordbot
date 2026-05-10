'use client';
import { motion } from 'framer-motion';
import { Coins, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function EconomyPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) return;
    api.get(`/guilds/${serverId}/config/economy`)
      .then(res => {
        setConfig(res.data.data);
        setIsLoading(false);
      })
      .catch(err => {
        setError('Nie udało się pobrać konfiguracji Ekonomii');
        setIsLoading(false);
      });
  }, [serverId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Coins className="w-7 h-7 text-emerald-400" /> Ekonomia
          </h1>
          <p className="text-foreground-secondary mt-1">Zarządzaj wirtualną walutą na swoim serwerze.</p>
        </div>
        <button className="btn-primary bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
          Zapisz Zmiany
        </button>
      </div>

      {error ? (
        <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5">
          <p className="text-rose-500">{error}</p>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="p-8 text-center text-foreground-secondary">
            Moduł w trakcie tworzenia. (Waluta: {config?.currencyName || 'Nie ustawiono'})
          </div>
        </div>
      )}
    </motion.div>
  );
}
