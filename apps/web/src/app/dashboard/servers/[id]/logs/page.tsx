'use client';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from '@/providers/LanguageProvider';

export default function LogsPage() {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-foreground-secondary" /> {t.sidebar.logs}
          </h1>
          <p className="text-foreground-secondary mt-1">Historia wszystkich istotnych akcji na serwerze.</p>
        </div>
      </div>
      <div className="glass-card p-6"><div className="p-8 text-center text-foreground-secondary">Moduł w trakcie tworzenia.</div></div>
    </motion.div>
  );
}
