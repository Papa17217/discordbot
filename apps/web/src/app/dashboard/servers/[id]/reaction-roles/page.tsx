'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Settings2, Save, X, Send, 
  Layers, MousePointer2, Hash, ArrowRight,
  Palette, Search, Loader2, Sliders, ShieldCheck, 
  User, Image as ImageIcon, AlignLeft, Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface ReactionButton {
  label: string;
  roleId: string;
  style: string;
  emoji?: string;
}

interface ReactionPanel {
  id?: string;
  title: string;
  description: string | null;
  color: string;
  footer: string | null;
  thumbnail: string | null;
  image: string | null;
  channelId: string | null;
  messageId: string | null;
  buttons: ReactionButton[];
}

export default function ReactionRolesPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const activeBotType = useAuthStore((state) => state.activeBotType);

  const [panels, setPanels] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<Partial<ReactionPanel>>({});

  useEffect(() => {
    if (serverId) loadData();
  }, [serverId, activeBotType]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Staggering requests slightly to avoid 429 even with higher limits
      const panelsRes = await api.get(`/guilds/${serverId}/config/reaction-roles`);
      const [chanRes, rolesRes] = await Promise.all([
        api.get(`/guilds/${serverId}/channels`),
        api.get(`/guilds/${serverId}/roles`)
      ]);
      
      setPanels(panelsRes.data.data || []);
      setChannels((chanRes.data.data || []).filter((c: any) => c.type === 0));
      setRoles(rolesRes.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error('Zbyt wiele żądań. Poczekaj chwilę.');
      } else {
        toast.error('Błąd ładowania danych');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (panel?: any) => {
    if (panel) {
      setCurrentPanel({ ...panel });
    } else {
      setCurrentPanel({
        title: 'Odbierz swoje role',
        description: 'Kliknij w przyciski poniżej, aby otrzymać lub zdjąć przypisane role.',
        color: '#6366f1',
        buttons: [
          { label: 'Użytkownik', roleId: '', style: 'PRIMARY' }
        ]
      });
    }
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!currentPanel.title) {
      toast.error('Tytuł jest wymagany');
      return;
    }
    if (!currentPanel.buttons || currentPanel.buttons.length === 0) {
      toast.error('Dodaj przynajmniej jeden przycisk');
      return;
    }

    setIsSaving(true);
    try {
      if (currentPanel.id) {
        await api.patch(`/guilds/${serverId}/config/reaction-roles/${currentPanel.id}`, currentPanel);
        toast.success('Panel zaktualizowany');
      } else {
        await api.post(`/guilds/${serverId}/config/reaction-roles`, currentPanel);
        toast.success('Panel utworzony');
      }
      setIsEditorOpen(false);
      loadData();
    } catch (err) {
      toast.error('Błąd podczas zapisywania');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async (panelId: string) => {
    try {
      toast.loading('Wysyłanie na Discord...', { id: 'deploy' });
      await api.post(`/guilds/${serverId}/config/reaction-roles/${panelId}/deploy`);
      toast.success('Panel wysłany pomyślnie!', { id: 'deploy' });
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Błąd podczas wysyłania';
      toast.error(msg, { id: 'deploy' });
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-foreground-secondary animate-pulse">Synchronizacja z serwerem...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Layers className="w-8 h-8 text-accent" /> Reaction Roles
          </h1>
          <p className="text-foreground-secondary mt-1">Twórz estetyczne panele do samodzielnego wybierania ról przez użytkowników.</p>
        </div>
        <button onClick={() => openEditor()} className="btn-primary flex items-center justify-center gap-2 px-8">
          <Plus className="w-5 h-5" /> Nowy Panel
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {panels.map((panel) => (
          <motion.div 
            key={panel.id} 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card group overflow-hidden border-t-4 transition-all hover:shadow-2xl hover:shadow-accent/5" 
            style={{ borderTopColor: panel.color }}
          >
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold group-hover:text-accent transition-colors">{panel.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-foreground-subtle">
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {channels.find(c => c.id === panel.channelId)?.name || 'Brak kanału'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> {panel.buttons?.length || 0} przycisków</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditor(panel)} className="p-2.5 hover:bg-background-tertiary rounded-xl transition-colors text-foreground-secondary hover:text-foreground"><Settings2 className="w-4.5 h-4.5" /></button>
                  <button onClick={async () => { if(confirm('Usunąć ten panel?')) { await api.delete(`/guilds/${serverId}/config/reaction-roles/${panel.id}`); loadData(); } }} className="p-2.5 hover:bg-rose-500/10 rounded-xl transition-colors text-foreground-secondary hover:text-rose-400"><Trash2 className="w-4.5 h-4.5" /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {panel.buttons?.map((btn: any, i: number) => (
                  <div key={i} className="px-3 py-1.5 bg-background-tertiary border border-border rounded-lg text-[10px] font-bold flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", {
                      'bg-discord-blurple': btn.style === 'PRIMARY',
                      'bg-foreground-subtle': btn.style === 'SECONDARY',
                      'bg-discord-green': btn.style === 'SUCCESS',
                      'bg-discord-red': btn.style === 'DANGER'
                    })} />
                    {btn.label}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleDeploy(panel.id)} 
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border shadow-sm",
                  panel.messageId 
                    ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10" 
                    : "bg-accent text-white border-transparent hover:opacity-90 shadow-accent/20"
                )}
              >
                <Send className="w-4 h-4" /> {panel.messageId ? 'Zaktualizuj na Discordzie' : 'Wyślij na serwer'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {panels.length === 0 && (
        <div className="glass-card py-24 text-center flex flex-col items-center gap-6 border-dashed opacity-60">
          <div className="w-20 h-20 rounded-full bg-background-tertiary flex items-center justify-center border border-border">
            <Layers className="w-10 h-10 text-foreground-subtle" />
          </div>
          <div className="max-w-sm space-y-2">
            <h3 className="text-xl font-bold text-foreground">Brak paneli ról</h3>
            <p className="text-sm text-foreground-secondary text-balance">Stwórz swój pierwszy panel, aby użytkownicy mogli sami wybierać swoje role na serwerze.</p>
          </div>
          <button onClick={() => openEditor()} className="btn-secondary">Rozpocznij konfigurację</button>
        </div>
      )}

      {/* Slide-over Editor */}
      <AnimatePresence>
        {isEditorOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-4xl bg-background-elevated border-l border-border shadow-2xl z-[101] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border bg-background-secondary/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-accent/10 rounded-2xl"><Sliders className="w-6 h-6 text-accent" /></div>
                  <div>
                    <h2 className="text-xl font-bold">Konfiguracja Panelu</h2>
                    <p className="text-xs text-foreground-secondary">Dostosuj wygląd i przyciski ról</p>
                  </div>
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-background-tertiary rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   {/* Left Side: Inputs */}
                   <div className="space-y-8">
                      <section className="space-y-5">
                         <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2"><Palette className="w-4 h-4" /> Wygląd Embed</h4>
                         <div className="space-y-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider ml-1">Tytuł</label>
                               <input className="input-field" placeholder="Np. Wybierz swoje role" value={currentPanel.title || ''} onChange={e => setCurrentPanel({...currentPanel, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider ml-1">Opis wiadomości</label>
                               <textarea className="input-field min-h-[120px] py-4 text-sm" placeholder="Opisz jakie role można zdobyć..." value={currentPanel.description || ''} onChange={e => setCurrentPanel({...currentPanel, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider ml-1">Kolor</label>
                                  <div className="flex gap-3 items-center">
                                     <input type="color" className="w-12 h-12 bg-transparent border-none rounded-xl cursor-pointer" value={currentPanel.color || '#6366f1'} onChange={e => setCurrentPanel({...currentPanel, color: e.target.value})} />
                                     <span className="text-xs font-mono text-foreground-subtle uppercase">{currentPanel.color}</span>
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider ml-1">Kanał docelowy</label>
                                  <select className="input-field" value={currentPanel.channelId || ''} onChange={e => setCurrentPanel({...currentPanel, channelId: e.target.value})}>
                                     <option value="">Wybierz kanał...</option>
                                     {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                                  </select>
                               </div>
                            </div>
                         </div>
                      </section>

                      <section className="space-y-5">
                         <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> Przyciski ról</h4>
                            <button onClick={() => setCurrentPanel({...currentPanel, buttons: [...(currentPanel.buttons || []), { label: 'Nowa Rola', roleId: '', style: 'PRIMARY' }]})} className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg hover:bg-accent hover:text-white transition-all">+ Dodaj przycisk</button>
                         </div>
                         <div className="space-y-4">
                            {currentPanel.buttons?.map((btn, i) => (
                              <div key={i} className="p-5 bg-background-tertiary border border-border rounded-2xl space-y-4 relative group hover:border-accent/30 transition-all">
                                 <button onClick={() => { const nb = [...currentPanel.buttons!]; nb.splice(i, 1); setCurrentPanel({...currentPanel, buttons: nb}); }} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                 <input className="input-field bg-background-elevated h-11 text-sm" placeholder="Etykieta przycisku" value={btn.label} onChange={e => { const nb = [...currentPanel.buttons!]; nb[i].label = e.target.value; setCurrentPanel({...currentPanel, buttons: nb}); }} />
                                 <div className="grid grid-cols-2 gap-3">
                                    <select className="input-field bg-background-elevated h-11 text-xs" value={btn.roleId} onChange={e => { const nb = [...currentPanel.buttons!]; nb[i].roleId = e.target.value; setCurrentPanel({...currentPanel, buttons: nb}); }}>
                                       <option value="">Wybierz rolę...</option>
                                       {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <select className="input-field bg-background-elevated h-11 text-xs" value={btn.style} onChange={e => { const nb = [...currentPanel.buttons!]; nb[i].style = e.target.value; setCurrentPanel({...currentPanel, buttons: nb}); }}>
                                       <option value="PRIMARY">Blurple (Primary)</option>
                                       <option value="SECONDARY">Grey (Secondary)</option>
                                       <option value="SUCCESS">Green (Success)</option>
                                       <option value="DANGER">Red (Danger)</option>
                                    </select>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </section>
                   </div>

                   {/* Right Side: Live Preview */}
                   <div className="space-y-6">
                      <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2"><Search className="w-4 h-4" /> Podgląd na żywo</h4>
                      <div className="sticky top-0 space-y-6">
                         <div className="bg-[#313338] rounded-xl p-5 border-l-4 shadow-2xl" style={{ borderLeftColor: currentPanel.color }}>
                            <div className="flex gap-4">
                               <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-white"><div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">B</div> Antigravity <span className="bg-[#5865F2] px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> BOT</span> <span className="text-[#949BA4] font-normal ml-1 italic">Dzisiaj o 14:00</span></div>
                                  <h5 className="text-[16px] font-bold text-white leading-tight">{currentPanel.title || 'Twój Tytuł'}</h5>
                                  <p className="text-[14px] text-[#DBDEE1] whitespace-pre-wrap leading-relaxed">{currentPanel.description || 'Twoja wiadomość tutaj...'}</p>
                                  {currentPanel.footer && <p className="text-[11px] text-[#949BA4] pt-2 border-t border-white/5">{currentPanel.footer}</p>}
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-wrap gap-2.5">
                            {currentPanel.buttons?.map((btn, i) => (
                              <div key={i} className={cn("px-4 py-2 rounded text-[14px] font-bold shadow-sm cursor-default transition-all", {
                                'bg-discord-blurple text-white hover:bg-[#4752C4]': btn.style === 'PRIMARY',
                                'bg-[#4E5058] text-white hover:bg-[#6D6F78]': btn.style === 'SECONDARY',
                                'bg-discord-green text-white hover:bg-[#1E6638]': btn.style === 'SUCCESS',
                                'bg-discord-red text-white hover:bg-[#952B2E]': btn.style === 'DANGER'
                              })}>{btn.label || 'Przycisk'}</div>
                            ))}
                         </div>
                         
                         <div className="p-6 bg-accent/5 rounded-2xl border border-accent/10 flex items-start gap-4">
                            <Info className="w-5 h-5 text-accent mt-0.5" />
                            <div className="space-y-1">
                               <p className="text-xs font-bold text-accent uppercase tracking-wider">Wskazówka</p>
                               <p className="text-xs text-foreground-secondary leading-relaxed">Pamiętaj, aby bot posiadał rolę wyższą niż nadawane role oraz uprawnienie "Zarządzanie Rolami".</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 bg-background-secondary border-t border-border flex gap-4">
                <button onClick={() => setIsEditorOpen(false)} className="flex-1 py-4 bg-background-tertiary hover:bg-background-elevated rounded-2xl font-bold transition-all border border-border">Anuluj</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-accent text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/30 disabled:opacity-50">
                   {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Zapisz konfigurację
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
