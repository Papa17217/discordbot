'use client';
import { motion } from 'framer-motion';
import { HandMetal, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/providers/LanguageProvider';

export default function WelcomePage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!serverId) return;
    api.get(`/guilds/${serverId}/config/welcome`)
      .then(res => {
        setConfig(res.data.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [serverId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-pink-400" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <HandMetal className="w-7 h-7 text-pink-400" /> {t.welcome.title}
          </h1>
          <p className="text-foreground-secondary mt-1">{t.welcome.description}</p>
        </div>
        <button className="btn-primary bg-pink-500 hover:bg-pink-600 text-white border-transparent">
          {t.common.saveChanges}
        </button>
      </div>
      <div className="glass-card p-6"><div className="p-8 text-center text-foreground-secondary">Moduł w trakcie tworzenia.</div></div>
    </motion.div>
  );
}
