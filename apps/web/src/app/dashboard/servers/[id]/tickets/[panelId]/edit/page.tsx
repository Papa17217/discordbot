'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ArrowLeft, Plus, Trash2, Send, Layout, MousePointer2, Type, Palette, Hash, UserPlus, MessageCircle, ShieldAlert, Check, ChevronDown, BellRing, Image as ImageIcon, AlignLeft, Search, X, Loader2, User, Eye, EyeOff, Megaphone, Save } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

type TicketAction = 'OPEN_TICKET' | 'ADD_ROLE' | 'SEND_MESSAGE';

interface ButtonConfig {
  id: string;
  label: string;
  emoji: string;
  style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER';
  actions: TicketAction[];
  pingRoleIds: string[];
  staffRoleIds: string[];
  addRoleIds: string[];
  message: string;
  ticketTitle: string;
  ticketFooter: string;
  ticketColor: string;
  showWelcomeMessage: boolean;
  showCloseButton: boolean;
  showStaffButton: boolean;
  closeButtonLabel: string;
  staffButtonLabel: string;
  staffMessage: string;
  categoryId: string;
  customId?: string; // Zachowanie customId przy edycji
}

// Custom Multi-Select Component
const RoleSelector = ({ allRoles, selectedIds, onChange, label, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredRoles = useMemo(() => 
    allRoles.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase())),
    [allRoles, search]
  );

  const selectedRoles = useMemo(() => 
    allRoles.filter((r: any) => (selectedIds || []).includes(r.id)),
    [allRoles, selectedIds]
  );

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <div className="relative">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[44px] w-full bg-background-tertiary border border-border rounded-xl px-3 py-2 flex flex-wrap gap-1.5 cursor-pointer hover:border-border-light transition-all"
        >
          {selectedRoles.length === 0 && <span className="text-sm text-foreground-subtle py-1">Wybierz role...</span>}
          {selectedRoles.map((role: any) => (
            <span 
              key={role.id} 
              className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-lg border border-accent/20"
              style={{ borderColor: role.color !== '#000000' ? `${role.color}40` : undefined }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color !== '#000000' ? role.color : '#6366f1' }} />
              {role.name}
              <X className="w-3 h-3 hover:text-white" onClick={(e) => { e.stopPropagation(); onChange((selectedIds || []).filter((id: string) => id !== role.id)); }} />
            </span>
          ))}
        </div>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-background-elevated border border-border rounded-xl shadow-2xl z-20 max-h-64 overflow-hidden flex flex-col"
              >
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-subtle" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Szukaj roli..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-background-tertiary border border-border rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto p-1 custom-scrollbar">
                  {filteredRoles.map((role: any) => {
                    const isSelected = (selectedIds || []).includes(role.id);
                    return (
                      <div 
                        key={role.id}
                        onClick={() => {
                          if (isSelected) onChange((selectedIds || []).filter((id: string) => id !== role.id));
                          else onChange([...(selectedIds || []), role.id]);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-accent/10 text-accent' : 'hover:bg-background-tertiary text-foreground-secondary'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color !== '#000000' ? role.color : '#6366f1' }} />
                          <span className="text-xs font-medium">{role.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    );
                  })}
                  {filteredRoles.length === 0 && <div className="p-4 text-center text-xs text-foreground-subtle">Nie znaleziono ról</div>}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function EditTicketPanelPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.id as string;
  const panelId = params?.panelId as string;

  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'PANEL' | 'TICKET'>('PANEL');
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);

  // Form State (Panel)
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [footer, setFooter] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [image, setImage] = useState('');
  const [style, setStyle] = useState<'BUTTON' | 'SELECT'>('BUTTON');
  const [placeholder, setPlaceholder] = useState('Wybierz kategorię...');
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);

  useEffect(() => {
    if (!serverId || !panelId) return;
    loadData();
  }, [serverId, panelId]);

  const loadData = async () => {
    try {
      const [chanRes, roleRes, panelRes] = await Promise.all([
        api.get(`/guilds/${serverId}/channels`),
        api.get(`/guilds/${serverId}/roles`),
        api.get(`/guilds/${serverId}/tickets/panels/${panelId}`)
      ]);
      
      const allChannels = chanRes.data.data || [];
      setChannels(allChannels.filter((c: any) => c.type === 0 || c.type === 5));
      setCategories(allChannels.filter((c: any) => c.type === 4));
      setRoles(roleRes.data.data || []);

      const p = panelRes.data.data;
      setChannelId(p.channelId);
      setTitle(p.title);
      setDescription(p.description || '');
      setColor(p.color || '#6366f1');
      setFooter(p.footer || '');
      setThumbnail(p.thumbnail || '');
      setImage(p.image || '');
      setStyle(p.style || 'BUTTON');
      setPlaceholder(p.placeholder || 'Wybierz kategorię...');
      setButtons(p.buttons.map((b: any) => ({
        ...b,
        id: b.id || Math.random().toString(36).substr(2, 9),
      })));


    } catch (err) {
      toast.error('Błąd ładowania danych');
      router.push(`/dashboard/servers/${serverId}/tickets`);
    } finally {
      setIsLoading(false);
    }
  };

  const addButton = () => {
    if (buttons.length >= 5) {
      toast.error('Maksymalnie 5 przycisków');
      return;
    }
    setButtons([...buttons, {
      id: Math.random().toString(36).substr(2, 9),
      label: 'Nowy Przycisk',
      emoji: '❓',
      style: 'SECONDARY',
      actions: ['SEND_MESSAGE'],
      pingRoleIds: [],
      staffRoleIds: [],
      addRoleIds: [],
      message: 'Przykładowa wiadomość',
      ticketTitle: 'Informacja',
      ticketFooter: '',
      ticketColor: '#6366f1',
      showWelcomeMessage: true,
      showCloseButton: true,
      showStaffButton: true,
      closeButtonLabel: 'Zamknij Ticket',
      staffButtonLabel: 'Wezwij Administrację',
      staffMessage: 'Administracja potrzebna natychmiast!',
      categoryId: ''
    }]);
  };

  const updateButton = (id: string, updates: Partial<ButtonConfig>) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const toggleAction = (btnId: string, action: TicketAction) => {
    const btn = buttons.find(b => b.id === btnId);
    if (!btn) return;
    let newActions = (btn.actions || []).includes(action) ? btn.actions.filter(a => a !== action) : [...(btn.actions || []), action];
    if (newActions.length === 0) {
      toast.error('Minimum jedna akcja');
      return;
    }
    updateButton(btnId, { actions: newActions });
  };

  const handleSubmit = async () => {
    if (!channelId) {
      toast.error('Wybierz kanał');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/guilds/${serverId}/tickets/panels/${panelId}`, { channelId, title, description, color, footer, thumbnail, image, buttons, style, placeholder });
      toast.success('Panel zaktualizowany!');

      router.push(`/dashboard/servers/${serverId}/tickets`);
    } catch (err) {
      toast.error('Błąd aktualizacji panelu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  const currentBtn = buttons[activeButtonIndex] || buttons[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/servers/${serverId}/tickets`} className="p-2 hover:bg-background-elevated rounded-xl border border-border">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edycja Panelu</h1>
            <p className="text-foreground-secondary text-sm">Modyfikujesz istniejący system ticketów. Zmiany zostaną od razu naniesione na Discordzie.</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex items-center gap-2 px-8">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Zapisz Zmiany
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Editor Column */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Main Panel Styling */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Layout className="w-4 h-4" /> Stylistyka Wiadomości Głównej (Panelu)
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-subtle uppercase">Tytuł Panelu</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-subtle uppercase">Opis / Instrukcja</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:border-accent" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-subtle uppercase">Kanał Docelowy</label>
                <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer">
                  {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-subtle uppercase">Kolor Embedu</label>
                <div className="flex gap-2">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 bg-background-tertiary border border-border rounded-xl p-1 cursor-pointer" />
                  <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-subtle uppercase">Styl Komponentów</label>
                <div className="flex bg-background-tertiary p-1 rounded-xl border border-border">
                   <button onClick={() => setStyle('BUTTON')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${style === 'BUTTON' ? 'bg-accent text-white shadow-lg' : 'text-foreground-secondary hover:text-foreground'}`}>PRZYCISKI</button>
                   <button onClick={() => setStyle('SELECT')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${style === 'SELECT' ? 'bg-accent text-white shadow-lg' : 'text-foreground-secondary hover:text-foreground'}`}>LISTA</button>
                </div>
              </div>
            </div>

            {style === 'SELECT' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-400 uppercase">Tekst na liście (Placeholder)</label>
                <input type="text" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Np. Wybierz powód zgłoszenia..." className="w-full bg-background-tertiary border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
              </motion.div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-foreground-subtle uppercase">Stopka</label>
                 <input type="text" value={footer} onChange={(e) => setFooter(e.target.value)} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-foreground-subtle uppercase">Miniaturka (URL)</label>
                 <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none font-mono" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-foreground-subtle uppercase">Obraz (URL)</label>
                 <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none font-mono" />
               </div>
            </div>
          </div>

          {/* Buttons & Action Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <MousePointer2 className="w-4 h-4" /> Przyciski i Logika
              </div>
              <button onClick={addButton} className="text-[10px] font-bold px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all">+ DODAJ PRZYCISK</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
               {buttons.map((btn, idx) => (
                 <button 
                  key={btn.id}
                  onClick={() => { setActiveButtonIndex(idx); setPreviewMode('PANEL'); }}
                  className={`p-4 rounded-2xl border transition-all text-center space-y-2 ${activeButtonIndex === idx ? 'bg-accent/10 border-accent shadow-lg shadow-accent/5' : 'bg-background-tertiary border-border hover:border-border-light'}`}
                 >
                   <div className="text-xl">{btn.emoji || '🔘'}</div>
                   <div className="text-[10px] font-bold truncate">{btn.label || 'Bez nazwy'}</div>
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {currentBtn && (
                <motion.div 
                  key={currentBtn.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-card p-8 border-t-4 border-t-accent"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-bold">#{activeButtonIndex + 1}</div>
                      <h3 className="text-lg font-bold">Konfiguracja Przycisku: {currentBtn.label}</h3>
                    </div>
                    <button onClick={() => { setButtons(buttons.filter(b => b.id !== currentBtn.id)); setActiveButtonIndex(0); }} className="p-2.5 hover:bg-rose-500/10 text-rose-400 rounded-xl transition-colors border border-border">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-foreground-subtle uppercase">Etykieta</label>
                      <input type="text" value={currentBtn.label} onChange={(e) => updateButton(currentBtn.id, { label: e.target.value })} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none" />
                    </div>
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-bold text-foreground-subtle uppercase">Emoji</label>
                      <input type="text" value={currentBtn.emoji} onChange={(e) => updateButton(currentBtn.id, { emoji: e.target.value })} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none text-center" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-foreground-subtle uppercase">Kolor Przycisku</label>
                      <select value={currentBtn.style} onChange={(e) => updateButton(currentBtn.id, { style: e.target.value as any })} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none text-foreground cursor-pointer">
                        <option value="PRIMARY">Niebieski</option>
                        <option value="SECONDARY">Szary</option>
                        <option value="SUCCESS">Zielony</option>
                        <option value="DANGER">Czerwony</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2"><Send className="w-3 h-3" /> Akcje po kliknięciu</label>
                      <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: 'OPEN_TICKET', label: 'Stwórz Ticket', icon: Ticket, color: 'text-blue-400' },
                            { id: 'ADD_ROLE', label: 'Nadaj Role', icon: UserPlus, color: 'text-emerald-400' },
                            { id: 'SEND_MESSAGE', label: 'Wyślij Wiadomość', icon: MessageCircle, color: 'text-amber-400' },
                          ].map(act => {
                            const active = (currentBtn.actions || []).includes(act.id as TicketAction);
                            return (
                              <button key={act.id} onClick={() => toggleAction(currentBtn.id, act.id as TicketAction)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${active ? 'bg-accent/10 border-accent ring-4 ring-accent/5' : 'bg-background-tertiary border-border text-foreground-secondary'}`}>
                                <act.icon className={`w-6 h-6 ${active ? act.color : ''}`} />
                                <span className="text-[10px] font-bold uppercase">{act.label}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Action Details */}
                    <div className="grid grid-cols-1 gap-6">
                        {(currentBtn.actions || []).includes('OPEN_TICKET') && (
                          <div className="space-y-6 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase"><Ticket className="w-4 h-4" /> Konfiguracja Nowego Ticketu</div>
                                <button onClick={() => setPreviewMode('TICKET')} className="text-[10px] font-bold px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all">PODGLĄD TICKETU</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-foreground-subtle uppercase">Kategoria na Discordzie</label>
                                    <select value={currentBtn.categoryId} onChange={(e) => updateButton(currentBtn.id, { categoryId: e.target.value })} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer">
                                      <option value="">Wybierz kategorię...</option>
                                      {categories.map(cat => <option key={cat.id} value={cat.id}>📁 {cat.name}</option>)}
                                    </select>
                                  </div>
                                  <RoleSelector label="Personel (Dostęp do kanału)" icon={ShieldAlert} allRoles={roles} selectedIds={currentBtn.staffRoleIds} onChange={(ids: any) => updateButton(currentBtn.id, { staffRoleIds: ids })} />
                                  <RoleSelector label="Role do powiadomienia (Ping)" icon={BellRing} allRoles={roles} selectedIds={currentBtn.pingRoleIds} onChange={(ids: any) => updateButton(currentBtn.id, { pingRoleIds: ids })} />
                                  
                                  {currentBtn.showStaffButton && (
                                    <div className="space-y-2 p-4 bg-background-tertiary/50 rounded-2xl border border-border/50">
                                        <label className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-2">
                                          <Megaphone className="w-3.5 h-3.5" /> Wiadomość przy wezwaniu (Staff Call)
                                        </label>
                                        <textarea 
                                          value={currentBtn.staffMessage} 
                                          onChange={(e) => updateButton(currentBtn.id, { staffMessage: e.target.value })}
                                          placeholder="Np. Potrzebna pomoc przy płatnościach!"
                                          rows={2}
                                          className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-400 resize-none"
                                        />
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-4 bg-background-tertiary/50 p-6 rounded-2xl border border-border/50">
                                  <label className="text-[10px] font-bold text-foreground-subtle uppercase block mb-4 text-center">Wiadomość Powitalna (Wewnątrz Ticketu)</label>
                                  <div className="space-y-4">
                                      <div className="flex items-center justify-between p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-400" />
                                            <span className="text-[10px] font-bold uppercase text-blue-400">Oznacz użytkownika (@użytkownik)</span>
                                        </div>
                                        <button onClick={() => updateButton(currentBtn.id, { showWelcomeMessage: !currentBtn.showWelcomeMessage })} className={`p-1.5 rounded-lg transition-all ${currentBtn.showWelcomeMessage ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-background-elevated text-foreground-subtle'}`}>
                                            {currentBtn.showWelcomeMessage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                      </div>

                                      <input type="text" value={currentBtn.ticketTitle} onChange={(e) => updateButton(currentBtn.id, { ticketTitle: e.target.value })} placeholder="Tytuł wiadomości..." className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400" />
                                      <textarea value={currentBtn.message} onChange={(e) => updateButton(currentBtn.id, { message: e.target.value })} placeholder="Opis / Wiadomość..." rows={3} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-xs outline-none resize-none focus:border-blue-400" />
                                      <input type="text" value={currentBtn.ticketFooter} onChange={(e) => updateButton(currentBtn.id, { ticketFooter: e.target.value })} placeholder="Stopka..." className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400" />
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] text-foreground-subtle uppercase font-bold text-center block">Przycisk 1 (Zamknij)</label>
                                            <div className="space-y-1.5">
                                              <button onClick={() => updateButton(currentBtn.id, { showCloseButton: !currentBtn.showCloseButton })} className={`w-full py-1.5 rounded-lg border transition-all text-[9px] font-bold ${currentBtn.showCloseButton ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-background-tertiary border-border text-foreground-secondary'}`}>
                                                {currentBtn.showCloseButton ? 'WŁĄCZONY 🔒' : 'WYŁĄCZONY'}
                                              </button>
                                              {currentBtn.showCloseButton && (
                                                  <input type="text" value={currentBtn.closeButtonLabel} onChange={(e) => updateButton(currentBtn.id, { closeButtonLabel: e.target.value })} placeholder="Etykieta..." className="w-full bg-background-tertiary border border-border rounded-lg px-2 py-1.5 text-[9px] outline-none" />
                                              )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] text-foreground-subtle uppercase font-bold text-center block">Przycisk 2 (Staff)</label>
                                            <div className="space-y-1.5">
                                              <button onClick={() => updateButton(currentBtn.id, { showStaffButton: !currentBtn.showStaffButton })} className={`w-full py-1.5 rounded-lg border transition-all text-[9px] font-bold ${currentBtn.showStaffButton ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-background-tertiary border-border text-foreground-secondary'}`}>
                                                {currentBtn.showStaffButton ? 'WŁĄCZONY 🔔' : 'WYŁĄCZONY'}
                                              </button>
                                              {currentBtn.showStaffButton && (
                                                  <input type="text" value={currentBtn.staffButtonLabel} onChange={(e) => updateButton(currentBtn.id, { staffButtonLabel: e.target.value })} placeholder="Etykieta..." className="w-full bg-background-tertiary border border-border rounded-lg px-2 py-1.5 text-[9px] outline-none" />
                                              )}
                                            </div>
                                        </div>
                                      </div>
                                  </div>
                                </div>
                            </div>
                          </div>
                        )}

                        {(currentBtn.actions || []).includes('ADD_ROLE') && (
                          <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                            <RoleSelector label="Rangi nadawane po kliknięciu" icon={UserPlus} allRoles={roles} selectedIds={currentBtn.addRoleIds} onChange={(ids: any) => updateButton(currentBtn.id, { addRoleIds: ids })} />
                          </div>
                        )}

                        {(currentBtn.actions || []).includes('SEND_MESSAGE') && !(currentBtn.actions || []).includes('OPEN_TICKET') && (
                          <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10 space-y-2">
                              <label className="text-[10px] font-bold text-amber-400 uppercase">Wiadomość Prywatna</label>
                              <textarea value={currentBtn.message} onChange={(e) => updateButton(currentBtn.id, { message: e.target.value })} className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-3 text-sm outline-none resize-none h-24" />
                          </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Preview Column */}
        <div className="xl:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="flex bg-background-tertiary p-1.5 rounded-2xl border border-border">
               <button onClick={() => setPreviewMode('PANEL')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${previewMode === 'PANEL' ? 'bg-accent text-white shadow-lg' : 'text-foreground-secondary hover:text-white'}`}>
                 <Layout className="w-4 h-4" /> PANEL
               </button>
               <button onClick={() => setPreviewMode('TICKET')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${previewMode === 'TICKET' ? 'bg-blue-500 text-white shadow-lg' : 'text-foreground-secondary hover:text-white'}`}>
                 <Ticket className="w-4 h-4" /> TICKET
               </button>
            </div>

            <div className="bg-[#313338] rounded-2xl overflow-hidden shadow-2xl border border-black/30">
              <div className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${previewMode === 'PANEL' ? 'bg-[#5865F2]' : 'bg-[#248046]'}`}>
                   {previewMode === 'PANEL' ? <Ticket className="text-white w-6 h-6" /> : <MessageCircle className="text-white w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-white text-[14px]">System Antigravity</span>
                    <span className="bg-[#5865F2] text-white text-[9px] px-1.5 rounded-[3px] font-bold">BOT</span>
                    <span className="text-[11px] text-[#949ba4]">Edytowano dzisiaj</span>
                  </div>
                  
                  {previewMode === 'PANEL' ? (
                    <div className="space-y-3">
                       <div className="border-l-[4px] rounded-[4px] bg-[#2b2d31] overflow-hidden" style={{ borderColor: color }}>
                          <div className="p-3.5 pr-4 flex justify-between gap-4">
                             <div className="flex-1">
                                <div className="text-white font-bold text-[16px] mb-1.5">{title}</div>
                                <div className="text-[#dbdee1] text-[14px] whitespace-pre-wrap leading-relaxed">{description}</div>
                             </div>
                             {thumbnail && <div className="w-20 h-20 shrink-0"><img src={thumbnail} alt="" className="w-full h-full object-cover rounded-[4px]" /></div>}
                          </div>
                          {image && <div className="px-3.5 pb-3.5"><img src={image} alt="" className="rounded-[4px] w-full" /></div>}
                          {footer && <div className="px-3.5 pb-3.5 text-[11px] text-[#dbdee1] font-medium">{footer}</div>}
                       </div>
                       <div className="flex flex-wrap gap-2.5 w-full">
                          {style === 'BUTTON' ? (
                            buttons.map(btn => (
                              <div key={btn.id} className={`px-3.5 py-2 rounded-[3px] text-white text-[14px] font-medium flex items-center gap-2 cursor-pointer ${btn.style === 'PRIMARY' ? 'bg-[#5865f2]' : btn.style === 'SUCCESS' ? 'bg-[#248046]' : btn.style === 'DANGER' ? 'bg-[#da373c]' : 'bg-[#4e5058]'}`}>
                                {btn.emoji} {btn.label}
                              </div>
                            ))
                          ) : (
                            <div className="w-full bg-[#1e1f22] border border-black/20 rounded-[4px] p-2 flex items-center justify-between text-[#949ba4] text-[14px] cursor-pointer hover:bg-[#35373c] transition-colors group">
                               <div className="flex items-center gap-2">
                                  <span className="group-hover:text-[#dbdee1]">{placeholder || 'Wybierz kategorię...'}</span>
                               </div>
                               <ChevronDown className="w-4 h-4" />
                            </div>
                          )}
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {currentBtn?.showWelcomeMessage && (
                          <div className="text-[#dbdee1] text-[14px]">Witaj <span className="text-blue-400 font-medium">@użytkownik</span>!</div>
                       )}
                       <div className="border-l-[4px] rounded-[4px] bg-[#2b2d31] p-3.5" style={{ borderColor: currentBtn?.ticketColor || '#6366f1' }}>
                          <div className="text-white font-bold text-[16px] mb-1.5">{currentBtn?.ticketTitle || `Ticket: ${currentBtn?.label}`}</div>
                          <div className="text-[#dbdee1] text-[14px] whitespace-pre-wrap leading-relaxed">{currentBtn?.message || '...'}</div>
                          {currentBtn?.ticketFooter && <div className="mt-3 text-[11px] text-[#949ba4] border-t border-[#3f4147] pt-2">{currentBtn.ticketFooter}</div>}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
