'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Trash2, Shield, AlertTriangle, MessageSquare, Link as LinkIcon, Hash, Users, Bell, Check, X, Search, Loader2, Info, ArrowLeft, Settings2, ShieldCheck, ShieldAlert, MoreVertical, Sliders, ChevronRight, Lock, VolumeX, Ban, UserCheck } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AutoModType = 'WORD_FILTER' | 'SPAM_FILTER' | 'LINK_FILTER' | 'CAPS_FILTER' | 'EMOJI_FILTER' | 'MENTION_FILTER' | 'INVITE_FILTER';
type AutoModAction = 'DELETE' | 'WARN' | 'MUTE' | 'KICK';

interface AutoModRule {
  id: string;
  type: AutoModType;
  enabled: boolean;
  action: AutoModAction;
  threshold: number;
  duration?: number;
  words: string[];
  exemptRoles: string[];
  exemptChannels: string[];
  alertChannelId?: string;
  customResponse?: string;
}

const RULE_METADATA: Record<AutoModType, { name: string, desc: string, icon: any, color: string, bg: string }> = {
  WORD_FILTER: { name: 'Filtr Słów', desc: 'Blokuje wulgaryzmy i zakazane frazy', icon: MessageSquare, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  SPAM_FILTER: { name: 'Anty-Spam', desc: 'Wykrywa szybkie wysyłanie wiadomości', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  LINK_FILTER: { name: 'Blokada Linków', desc: 'Zabraniam wysyłania odnośników URL', icon: LinkIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  CAPS_FILTER: { name: 'Filtr Caps-Lock', desc: 'Ogranicza nadużywanie wielkich liter', icon: Type, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  EMOJI_FILTER: { name: 'Limit Emoji', desc: 'Zapobiega spamowaniu ikonkami', icon: Star, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  MENTION_FILTER: { name: 'Limit Wzmianek', desc: 'Blokuje masowe oznaczanie osób', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  INVITE_FILTER: { name: 'Anty-Invite', desc: 'Blokuje zaproszenia na inne serwery', icon: ShieldAlert, color: 'text-orange-400', bg: 'bg-orange-400/10' },
};

import { Type } from 'lucide-react';
import { Star } from 'lucide-react';

// Re-using RoleSelector from tickets or simple version here
const MultiSelect = ({ options, selectedIds, onChange, label, icon: Icon, placeholder = "Wybierz..." }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase()));
  const selected = options.filter((o: any) => (selectedIds || []).includes(o.id));

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <div className="relative">
        <div onClick={() => setIsOpen(!isOpen)} className="min-h-[44px] w-full bg-background-tertiary border border-border rounded-xl px-3 py-2 flex flex-wrap gap-1.5 cursor-pointer">
          {selected.length === 0 && <span className="text-sm text-foreground-subtle py-1">{placeholder}</span>}
          {selected.map((opt: any) => (
            <span key={opt.id} className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-[11px] font-medium rounded-lg border border-accent/20">
              {opt.name} <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); onChange(selectedIds.filter((id: string) => id !== opt.id)); }} />
            </span>
          ))}
        </div>
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-background-elevated border border-border rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto p-1 custom-scrollbar">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj..." className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-xs outline-none mb-1" autoFocus />
            {filtered.map((opt: any) => {
              const isSelected = (selectedIds || []).includes(opt.id);
              return (
                <div key={opt.id} onClick={() => isSelected ? onChange(selectedIds.filter((id: string) => id !== opt.id)) : onChange([...(selectedIds || []), opt.id])} className={`px-3 py-2 rounded-lg cursor-pointer text-xs ${isSelected ? 'bg-accent/10 text-accent' : 'hover:bg-background-tertiary'}`}>
                  {opt.name}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function AutoModPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [rules, setRules] = useState<AutoModRule[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<Partial<AutoModRule> | null>(null);

  useEffect(() => {
    if (serverId) loadData();
  }, [serverId]);

  const loadData = async () => {
    try {
      const [rulesRes, rolesRes, chanRes] = await Promise.all([
        api.get(`/guilds/${serverId}/config/automod`),
        api.get(`/guilds/${serverId}/roles`),
        api.get(`/guilds/${serverId}/channels`)
      ]);
      setRules(rulesRes.data.data);
      setRoles(rolesRes.data.data || []);
      setChannels((chanRes.data.data || []).filter((c: any) => c.type === 0));
    } catch (err) {
      toast.error('Błąd ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      await api.patch(`/guilds/${serverId}/config/automod/${ruleId}`, { enabled });
      setRules(rules.map(r => r.id === ruleId ? { ...r, enabled } : r));
      toast.success(enabled ? 'Reguła włączona' : 'Reguła wyłączona');
    } catch (err) {
      toast.error('Błąd aktualizacji');
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę regułę?')) return;
    try {
      await api.delete(`/guilds/${serverId}/config/automod/${id}`);
      setRules(rules.filter(r => r.id !== id));
      toast.success('Reguła usunięta');
    } catch (err) {
      toast.error('Błąd usuwania');
    }
  };

  const saveRule = async () => {
    if (!editingRule) return;
    
    try {
      if (editingRule.id) {
        await api.patch(`/guilds/${serverId}/config/automod/${editingRule.id}`, editingRule);
      } else {
        await api.post(`/guilds/${serverId}/config/automod`, editingRule);
      }
      loadData();
      setEditingRule(null);
      toast.success('Zapisano zmiany!');
    } catch (err) {
      toast.error('Błąd zapisu');
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-amber-400" /> System AutoMod Premium
          </h1>
          <p className="text-foreground-secondary mt-1">Inteligentna ochrona serwera działająca 24/7.</p>
        </div>
        <button 
          onClick={() => setEditingRule({ type: 'WORD_FILTER', enabled: true, action: 'DELETE', threshold: 5, words: [], exemptRoles: [], exemptChannels: [] })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Dodaj Regułę
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rules.map((rule) => {
          const meta = RULE_METADATA[rule.type];
          return (
            <motion.div 
              layoutId={rule.id}
              key={rule.id} 
              className={cn(
                "glass-card group hover:border-amber-500/50 transition-all overflow-hidden",
                !rule.enabled && "opacity-60 grayscale-[0.5]"
              )}
            >
               <div className="p-6">
                 <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", meta.bg)}>
                       <meta.icon className={cn("w-6 h-6", meta.color)} />
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setEditingRule(rule)} className="p-2 hover:bg-background-elevated rounded-xl transition-colors border border-border">
                          <Sliders className="w-4 h-4 text-foreground-secondary" />
                       </button>
                       <button onClick={() => deleteRule(rule.id)} className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors border border-border">
                          <Trash2 className="w-4 h-4 text-rose-400" />
                       </button>
                    </div>
                 </div>

                 <div className="space-y-1 mb-6">
                    <h3 className="font-bold text-lg">{meta.name}</h3>
                    <p className="text-xs text-foreground-secondary">{meta.desc}</p>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                         rule.action === 'DELETE' ? 'bg-blue-500/10 text-blue-400' : 
                         rule.action === 'WARN' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                       )}>
                         AKCJA: {rule.action}
                       </div>
                    </div>
                    <div 
                      onClick={() => handleToggle(rule.id, !rule.enabled)}
                      className={cn(
                        'w-10 h-5 rounded-full relative transition-all cursor-pointer',
                        rule.enabled ? 'bg-amber-400 shadow-lg shadow-amber-400/20' : 'bg-background-tertiary border border-border'
                      )}
                    >
                      <motion.div animate={{ x: rule.enabled ? 20 : 2 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm" />
                    </div>
                 </div>
               </div>
            </motion.div>
          );
        })}

        {rules.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center flex flex-col items-center gap-4">
             <Shield className="w-16 h-16 opacity-10" />
             <p className="text-foreground-secondary max-w-sm">Nie masz jeszcze żadnych reguł AutoModa. Chroń swój serwer przed spamem i toksycznością!</p>
             <button onClick={() => setEditingRule({ type: 'WORD_FILTER', enabled: true, action: 'DELETE', threshold: 5, words: [] })} className="text-sm font-bold text-amber-400 hover:underline">+ Stwórz pierwszą regułę</button>
          </div>
        )}
      </div>

      {/* Editor Modal Overlay */}
      <AnimatePresence>
        {editingRule && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingRule(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div 
              initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-background-elevated border-l border-border shadow-2xl z-50 overflow-y-auto custom-scrollbar"
            >
               <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-400/10 rounded-xl"><Settings2 className="w-5 h-5 text-amber-400" /></div>
                        <h2 className="text-xl font-bold">Konfiguracja Reguły</h2>
                     </div>
                     <button onClick={() => setEditingRule(null)} className="p-2 hover:bg-background-tertiary rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-subtle uppercase">Typ Ochrony</label>
                        <div className="grid grid-cols-2 gap-2">
                           {Object.entries(RULE_METADATA).map(([key, meta]) => (
                             <button 
                              key={key} 
                              onClick={() => setEditingRule({ ...editingRule, type: key as AutoModType })}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                                editingRule.type === key ? "bg-amber-400/10 border-amber-400 text-amber-400" : "bg-background-tertiary border-border hover:border-border-light text-foreground-secondary"
                              )}
                             >
                               <meta.icon className="w-4 h-4" />
                               <span className="text-xs font-bold">{meta.name}</span>
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-foreground-subtle uppercase">Akcja bota</label>
                           <select 
                            value={editingRule.action} 
                            onChange={(e) => setEditingRule({ ...editingRule, action: e.target.value as AutoModAction })}
                            className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                           >
                              <option value="DELETE">Usuń wiadomość</option>
                              <option value="WARN">Daj ostrzeżenie (Warn)</option>
                              <option value="MUTE">Wycisz (Mute)</option>
                              <option value="KICK">Wyrzuć (Kick)</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-foreground-subtle uppercase">Czułość / Próg</label>
                           <input 
                            type="number" 
                            value={editingRule.threshold} 
                            onChange={(e) => setEditingRule({ ...editingRule, threshold: parseInt(e.target.value) })}
                            className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none" 
                           />
                        </div>
                     </div>

                     {editingRule.type === 'WORD_FILTER' && (
                        <div className="space-y-4">
                           <label className="text-[10px] font-bold text-rose-400 uppercase">Zakazane słowa (Tagi)</label>
                           <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-background-tertiary border border-border rounded-2xl focus-within:border-rose-400 transition-all">
                              {editingRule.words?.map((word, idx) => (
                                <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 group">
                                   {word}
                                   <X 
                                    className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors" 
                                    onClick={() => setEditingRule({ ...editingRule, words: editingRule.words?.filter((_, i) => i !== idx) })} 
                                   />
                                </span>
                              ))}
                              <input 
                                type="text"
                                placeholder="Wpisz słowo i daj Enter..."
                                className="flex-1 bg-transparent border-none outline-none text-sm min-w-[150px]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val && !editingRule.words?.includes(val)) {
                                      setEditingRule({ ...editingRule, words: [...(editingRule.words || []), val] });
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                           </div>
                           <p className="text-[10px] text-foreground-subtle italic flex items-center gap-1.5">
                             <Info className="w-3 h-3" /> Każde słowo to osobny filtr. Kliknij krzyżyk, aby usunąć.
                           </p>
                        </div>
                     )}

                     {editingRule.action === 'MUTE' && (
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-foreground-subtle uppercase">Czas wyciszenia (sekundy)</label>
                           <input 
                            type="number" 
                            value={editingRule.duration || 3600} 
                            onChange={(e) => setEditingRule({ ...editingRule, duration: parseInt(e.target.value) })}
                            className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none" 
                           />
                        </div>
                     )}

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-subtle uppercase">Wiadomość zwrotna do użytkownika</label>
                        <input 
                          type="text" 
                          value={editingRule.customResponse || ''} 
                          onChange={(e) => setEditingRule({ ...editingRule, customResponse: e.target.value })}
                          placeholder="Hej, nie rób tak!"
                          className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none" 
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-subtle uppercase">Kanał Logów AutoMod</label>
                        <select 
                          value={editingRule.alertChannelId || ''} 
                          onChange={(e) => setEditingRule({ ...editingRule, alertChannelId: e.target.value })}
                          className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                        >
                          <option value="">Użyj domyślnego...</option>
                          {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                        </select>
                     </div>

                     <div className="grid grid-cols-1 gap-6 pt-4 border-t border-border">
                        <MultiSelect 
                          label="Kanały objęte ochroną (Puste = WSZYSTKIE)" 
                          icon={ShieldCheck} 
                          options={channels} 
                          selectedIds={editingRule.targetChannels || []} 
                          onChange={(ids: string[]) => setEditingRule({ ...editingRule, targetChannels: ids })} 
                        />
                        <MultiSelect 
                          label="Zignoruj role (Biała lista)" 
                          icon={UserCheck} 
                          options={roles} 
                          selectedIds={editingRule.exemptRoles} 
                          onChange={(ids: string[]) => setEditingRule({ ...editingRule, exemptRoles: ids })} 
                        />
                        <MultiSelect 
                          label="Zignoruj kanały" 
                          icon={Hash} 
                          options={channels} 
                          selectedIds={editingRule.exemptChannels} 
                          onChange={(ids: string[]) => setEditingRule({ ...editingRule, exemptChannels: ids })} 
                        />
                     </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                     <button onClick={() => setEditingRule(null)} className="flex-1 py-3 bg-background-tertiary hover:bg-background-elevated border border-border rounded-xl text-sm font-bold transition-all">Anuluj</button>
                     <button onClick={saveRule} className="flex-1 py-3 bg-amber-400 text-black rounded-xl text-sm font-bold hover:bg-amber-300 transition-all flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Zapisz Regułę
                     </button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
