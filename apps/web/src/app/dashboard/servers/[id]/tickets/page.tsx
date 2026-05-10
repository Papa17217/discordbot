'use client';
import { motion } from 'framer-motion';
import { Ticket, Plus, Trash2, ExternalLink, Loader2, Edit2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TicketsPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [panels, setPanels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!serverId) return;
    fetchPanels();
  }, [serverId]);

  const fetchPanels = async () => {
    try {
      const res = await api.get(`/guilds/${serverId}/tickets/panels`);
      setPanels(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się pobrać paneli');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePanel = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten panel? Wiadomość na Discordzie pozostanie, ale przyciski przestaną działać.')) return;
    try {
      await api.delete(`/guilds/${serverId}/tickets/panels/${id}`);
      setPanels(prev => prev.filter(p => p.id !== id));
      toast.success('Panel został usunięty');
    } catch (err) {
      toast.error('Błąd podczas usuwania panelu');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Ticket className="w-7 h-7 text-blue-400" /> Panele Ticketowe
          </h1>
          <p className="text-foreground-secondary mt-1">Zarządzaj wiadomościami pozwalającymi otwierać tickety.</p>
        </div>
        <Link href={`/dashboard/servers/${serverId}/tickets/new`} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nowy Panel
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {panels.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-foreground-secondary flex flex-col items-center gap-4">
            <Ticket className="w-12 h-12 opacity-20" />
            <p>Brak utworzonych paneli. Kliknij przycisk powyżej, aby stworzyć swój pierwszy panel.</p>
          </div>
        ) : (
          panels.map((panel) => (
            <div key={panel.id} className="glass-card p-5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg truncate pr-4">{panel.title}</h3>
                  <div className="flex gap-2">
                    <Link 
                      href={`/dashboard/servers/${serverId}/tickets/${panel.id}/edit`}
                      className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => deletePanel(panel.id)} 
                      className="p-2 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary line-clamp-2 mb-4">
                  {panel.description || 'Brak opisu'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {panel.buttons.map((btn: any) => (
                    <span key={btn.id} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-background-elevated border border-border rounded-md flex items-center gap-1">
                      {btn.emoji} {btn.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <span className="text-[10px] text-foreground-subtle font-mono">CHANNEL: {panel.channelId}</span>
                {panel.messageId ? (
                   <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 uppercase">
                     <ExternalLink className="w-3 h-3" /> Wysłano na Discord
                   </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Tylko w bazie</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
