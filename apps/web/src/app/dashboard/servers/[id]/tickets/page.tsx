'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Plus, Trash2, ExternalLink, Loader2, Edit2, Archive, MessageCircle, User, Calendar, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TicketsPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [activeTab, setActiveTab] = useState<'panels' | 'archive'>('panels');
  const [panels, setPanels] = useState<any[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);

  useEffect(() => {
    if (!serverId) return;
    if (activeTab === 'panels') {
      fetchPanels();
    } else {
      fetchArchivedTickets();
    }
  }, [serverId, activeTab]);

  const fetchPanels = async () => {
    setIsLoading(true);
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

  const fetchArchivedTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/guilds/${serverId}/tickets?status=CLOSED`);
      setArchivedTickets(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się pobrać archiwum');
    } finally {
      setIsLoading(false);
    }
  };

  const openTranscript = async (ticketId: string) => {
    try {
      const res = await api.get(`/guilds/${serverId}/tickets/${ticketId}`);
      setSelectedTranscript(res.data.data);
    } catch (err) {
      toast.error('Nie udało się pobrać transkrypcji');
    }
  };

  const deletePanel = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten panel?')) return;
    try {
      await api.delete(`/guilds/${serverId}/tickets/panels/${id}`);
      setPanels(prev => prev.filter(p => p.id !== id));
      toast.success('Panel został usunięty');
    } catch (err) {
      toast.error('Błąd podczas usuwania panelu');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Ticket className="w-7 h-7 text-blue-400" /> System Ticketów
          </h1>
          <p className="text-foreground-secondary mt-1">Zarządzaj panelami i przeglądaj historię rozmów.</p>
        </div>
        <div className="flex gap-2 bg-background-secondary p-1 rounded-xl border border-border self-start">
          <button 
            onClick={() => setActiveTab('panels')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'panels' ? "bg-blue-500 text-white shadow-lg" : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
            )}
          >
            <Layers className="w-4 h-4" /> Panele
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'archive' ? "bg-blue-500 text-white shadow-lg" : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
            )}
          >
            <Archive className="w-4 h-4" /> Archiwum
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'panels' ? (
          <motion.div 
            key="panels"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <Link href={`/dashboard/servers/${serverId}/tickets/new`} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nowy Panel
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-full flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
              ) : panels.length === 0 ? (
                <div className="col-span-full glass-card p-12 text-center text-foreground-secondary flex flex-col items-center gap-4">
                  <Ticket className="w-12 h-12 opacity-20" />
                  <p>Brak utworzonych paneli. Kliknij przycisk powyżej, aby stworzyć swój pierwszy panel.</p>
                </div>
              ) : (
                panels.map((panel) => (
                  <PanelCard key={panel.id} panel={panel} serverId={serverId} onDelete={deletePanel} />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="archive"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wider font-bold text-foreground-subtle border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Użytkownik</th>
                    <th className="px-6 py-4">Temat</th>
                    <th className="px-6 py-4">Data otwarcia</th>
                    <th className="px-6 py-4">Data zamknięcia</th>
                    <th className="px-6 py-4 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" /></td></tr>
                  ) : archivedTickets.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-foreground-secondary">Brak archiwalnych ticketów.</td></tr>
                  ) : (
                    archivedTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={ticket.user.avatar ? `https://cdn.discordapp.com/avatars/${ticket.user.discordId}/${ticket.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                              className="w-8 h-8 rounded-full border border-border"
                            />
                            <span className="font-medium">{ticket.user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                            {ticket.subject}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground-secondary">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground-secondary">
                          {ticket.closedAt ? new Date(ticket.closedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => openTranscript(ticket.id)}
                            className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Transkrypcji */}
      <AnimatePresence>
        {selectedTranscript && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTranscript(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl glass-card max-h-[85vh] flex flex-col overflow-hidden border-blue-500/30"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Archive className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-lg">Archiwum: {selectedTranscript.subject}</h3>
                    <p className="text-xs text-foreground-secondary">Otwarty przez: {selectedTranscript.user.username}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTranscript(null)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background-elevated/30">
                {selectedTranscript.transcript?.messages.length > 0 ? (
                  selectedTranscript.transcript.messages.map((msg: any, i: number) => (
                    <div key={i} className="flex gap-4 group">
                      <img src={msg.avatar} className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("font-bold", msg.isBot ? "text-blue-400" : "text-white")}>
                            {msg.author}
                          </span>
                          {msg.isBot && <span className="text-[10px] bg-blue-500 px-1 rounded font-bold uppercase text-white">BOT</span>}
                          <span className="text-[10px] text-foreground-subtle">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-foreground-secondary italic">
                    Brak wiadomości w transkrypcji.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PanelCard({ panel, serverId, onDelete }: { panel: any, serverId: string, onDelete: (id: string) => void }) {
  return (
    <div className="glass-card p-5 flex flex-col justify-between group hover:border-blue-500/50 transition-all">
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
              onClick={() => onDelete(panel.id)} 
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
        <span className="text-[10px] text-foreground-subtle font-mono uppercase">ID: {panel.id.slice(-8)}</span>
        {panel.messageId ? (
           <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 uppercase">
             <ExternalLink className="w-3 h-3" /> Wysłano na Discord
           </span>
        ) : (
          <span className="text-[10px] text-amber-400 font-bold uppercase">Tylko w bazie</span>
        )}
      </div>
    </div>
  );
}

// Brakuje importów w sidebarze? Upewnij się że Sidebar.tsx ma ikony.
const Layers = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
);

