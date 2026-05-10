'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Settings2, History, Loader2, AlertCircle, Save, Info, Bell, MessageSquare, VolumeX, Ban, UserX, X, Sliders, ChevronRight, User, Hash, Palette, Type, AlignLeft, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} sek. temu`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min. temu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz. temu`;
  return `${Math.floor(diffInSeconds / 86400)} dni temu`;
};

const ACTION_COLORS: Record<string, string> = { 
  BAN: 'text-rose-400 bg-rose-400/10', 
  WARN: 'text-amber-400 bg-amber-400/10', 
  MUTE: 'text-orange-400 bg-orange-400/10', 
  KICK: 'text-red-400 bg-red-400/10', 
  UNMUTE: 'text-emerald-400 bg-emerald-400/10' 
};

type ModActionType = 'ban' | 'kick' | 'warn' | 'timeout';

const ACTION_METADATA: Record<ModActionType, { name: string, desc: string, icon: any, color: string, bg: string }> = {
  ban: { name: 'Banowanie', desc: 'Zarządzaj permanentnym blokowaniem użytkowników', icon: Ban, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  kick: { name: 'Wyrzucanie', desc: 'Konfiguruj wyrzucanie graczy z serwera', icon: UserX, color: 'text-red-400', bg: 'bg-red-400/10' },
  warn: { name: 'Ostrzeżenia', desc: 'System ostrzeżeń i powiadomień', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  timeout: { name: 'Przerwy (Timeout)', desc: 'Tymczasowe wyciszanie użytkowników', icon: VolumeX, color: 'text-orange-400', bg: 'bg-orange-400/10' },
};

export default function ModerationPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [activeTab, setActiveTab] = useState<'logs' | 'settings'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<ModActionType | null>(null);

  useEffect(() => {
    if (!serverId) return;
    const fetchData = async () => {
      try {
        const [logsRes, configRes, channelsRes] = await Promise.all([
          api.get(`/guilds/${serverId}/moderation/logs`),
          api.get(`/guilds/${serverId}/config/moderation`),
          api.get(`/guilds/${serverId}/channels`)
        ]);
        setLogs(logsRes.data.data || []);
        setConfig(configRes.data.data || getDefaultConfig());
        setChannels((channelsRes.data.data || []).filter((c: any) => c.type === 0));
        setIsLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Nie udało się pobrać danych');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [serverId]);

  const getDefaultConfig = () => ({
    banMessage: "Zostałeś zbanowany na serwerze {guild} za: {reason}", banTitle: "Użytkownik Zbanowany", banColor: "#f43f5e", banEnabled: true, banThumbnail: true,
    kickMessage: "Zostałeś wyrzucony z serwera {guild} za: {reason}", kickTitle: "Użytkownik Wyrzucony", kickColor: "#ef4444", kickEnabled: true, kickThumbnail: true,
    warnMessage: "Otrzymałeś ostrzeżenie na serwerze {guild} za: {reason}", warnTitle: "Nowe Ostrzeżenie", warnColor: "#fbbf24", warnEnabled: true, warnThumbnail: true,
    timeoutMessage: "Zostałeś wyciszony na serwerze {guild} za: {reason}. Czas trwania: {duration}", timeoutTitle: "Użytkownik Wyciszony", timeoutColor: "#f97316", timeoutEnabled: true, timeoutThumbnail: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/guilds/${serverId}/config/moderation`, config);
      toast.success('Ustawienia zapisane pomyślnie!');
    } catch (err) {
      toast.error('Błąd podczas zapisywania ustawień');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfigField = (action: ModActionType, field: string, value: any) => {
    const key = `${action}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    setConfig({ ...config, [key]: value });
  };

  const getConfigField = (action: ModActionType, field: string) => {
    const key = `${action}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    return config ? config[key] : '';
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /><p className="text-foreground-secondary">Ładowanie...</p></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center"><AlertCircle className="w-12 h-12 text-rose-500" /><p className="text-rose-500 font-medium">{error}</p></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="w-8 h-8 text-rose-400" /> Moderacja</h1>
          <p className="text-foreground-secondary mt-1">Zarządzaj bezpieczeństwem i historią kar na swoim serwerze.</p>
        </div>
        {activeTab === 'settings' && (
          <button onClick={handleSave} disabled={isSaving} className="btn-primary bg-rose-500 hover:bg-rose-600 text-white border-transparent flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Zapisz Zmiany
          </button>
        )}
      </div>

      <div className="flex gap-2 p-1 bg-background-tertiary rounded-2xl w-fit border border-border">
        <button onClick={() => setActiveTab('logs')} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'logs' ? "bg-background-elevated text-rose-400 shadow-lg border border-border" : "text-foreground-secondary hover:text-foreground hover:bg-white/5")}><History className="w-4 h-4" /> Logi Moderacyjne</button>
        <button onClick={() => setActiveTab('settings')} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'settings' ? "bg-background-elevated text-rose-400 shadow-lg border border-border" : "text-foreground-secondary hover:text-foreground hover:bg-white/5")}><Settings2 className="w-4 h-4" /> Ustawienia</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'logs' ? (
          <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Ostatnie akcje</h2><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" /><input className="input-field pl-10 w-64 bg-background-tertiary" placeholder="Szukaj użytkownika..." /></div></div>
            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-[100px_1fr_1fr_1.5fr_120px] gap-4 p-4 border-b border-border text-[10px] font-bold uppercase text-foreground-subtle tracking-wider"><span>Akcja</span><span>Użytkownik</span><span>Moderator</span><span>Powód</span><span>Czas</span></div>
              {logs.length === 0 ? <div className="p-12 text-center text-foreground-secondary flex flex-col items-center gap-3"><Shield className="w-12 h-12 opacity-5" /><p>Brak historii moderacji na tym serwerze.</p></div> : logs.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="grid grid-cols-[100px_1fr_1fr_1.5fr_120px] gap-4 p-4 border-b border-border last:border-0 items-center hover:bg-white/5 transition-colors group">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold text-center uppercase tracking-tight', ACTION_COLORS[log.action] || 'text-foreground-secondary bg-white/5')}>{log.action}</span>
                  <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-background-tertiary flex items-center justify-center text-xs font-bold border border-border group-hover:border-rose-400/30 transition-colors">{log.target?.username?.[0] || '?'}</div><span className="text-sm font-medium">{log.target?.username || 'Nieznany'}</span></div>
                  <span className="text-sm text-foreground-secondary">{log.moderator?.username || 'System'}</span>
                  <span className="text-sm text-foreground-secondary truncate pr-4">{log.reason || <span className="italic opacity-50">Brak powodu</span>}</span>
                  <span className="text-xs text-foreground-subtle whitespace-nowrap">{formatTimeAgo(log.createdAt)}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {(['ban', 'kick', 'warn', 'timeout'] as ModActionType[]).map((action) => {
                const meta = ACTION_METADATA[action];
                const isEnabled = getConfigField(action, 'enabled');
                const Icon = meta.icon;
                return (
                  <motion.div key={action} whileHover={{ y: -5 }} className={cn("glass-card group cursor-pointer border-t-4 transition-all", isEnabled ? `border-t-${meta.color.split('-')[1]}-400` : "opacity-60 grayscale-[0.5] border-t-transparent")} onClick={() => setEditingAction(action)}>
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", meta.bg)}><Icon className={cn("w-6 h-6", meta.color)} /></div>
                        <div onClick={(e) => { e.stopPropagation(); updateConfigField(action, 'enabled', !isEnabled); }} className={cn('w-10 h-5 rounded-full relative transition-all cursor-pointer border', isEnabled ? 'bg-rose-500 border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-background-tertiary border-border')}><motion.div animate={{ x: isEnabled ? 20 : 2 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm" /></div>
                      </div>
                      <div><h3 className="font-bold text-lg">{meta.name}</h3><p className="text-xs text-foreground-secondary mt-1 leading-relaxed">{meta.desc}</p></div>
                      <div className="flex items-center justify-between pt-4 border-t border-border"><span className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-1.5"><Sliders className="w-3 h-3" /> Konfiguruj</span><ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:translate-x-1 transition-transform" /></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Info Variables */}
            <div className="glass-card p-6 bg-rose-500/5 border-rose-500/20"><div className="flex items-start gap-4"><div className="p-2 bg-rose-500/10 rounded-xl"><Info className="w-5 h-5 text-rose-400" /></div><div className="space-y-1"><h3 className="font-bold text-sm">Zmienne w wiadomościach</h3><p className="text-xs text-foreground-secondary leading-relaxed">Możesz używać: <code className="text-rose-400 font-bold">{'{user}'}</code>, <code className="text-rose-400 font-bold">{'{guild}'}</code>, <code className="text-rose-400 font-bold">{'{reason}'}</code>, <code className="text-rose-400 font-bold">{'{duration}'}</code>.</p></div></div></div>

            {/* Side Panel Editor */}
            <AnimatePresence>
              {editingAction && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingAction(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                  <motion.div initial={{ opacity: 0, x: 500 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 500 }} className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-background-elevated border-l border-border shadow-2xl z-50 overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const ActionIcon = ACTION_METADATA[editingAction].icon;
                            return (
                              <div className={cn("p-2 rounded-xl", ACTION_METADATA[editingAction].bg)}>
                                <ActionIcon className={cn("w-5 h-5", ACTION_METADATA[editingAction].color)} />
                              </div>
                            );
                          })()}
                          <h2 className="text-xl font-bold">Edytuj: {ACTION_METADATA[editingAction].name}</h2>
                        </div>
                        <button onClick={() => setEditingAction(null)} className="p-2 hover:bg-background-tertiary rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                      </div>
                      
                      <div className="space-y-8">
                        <div className="space-y-6">
                          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2"><Palette className="w-4 h-4" /> Wygląd Embed</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2"><Type className="w-3 h-3" /> Tytuł Embed</label><input type="text" value={getConfigField(editingAction, 'title')} onChange={(e) => updateConfigField(editingAction, 'title', e.target.value)} className="input-field" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2"><Palette className="w-3 h-3" /> Kolor Embed</label><div className="flex gap-2"><input type="color" value={getConfigField(editingAction, 'color')} onChange={(e) => updateConfigField(editingAction, 'color', e.target.value)} className="w-10 h-10 rounded-lg bg-background-tertiary border border-border cursor-pointer" /><input type="text" value={getConfigField(editingAction, 'color')} onChange={(e) => updateConfigField(editingAction, 'color', e.target.value)} className="input-field flex-1" /></div></div>
                          </div>
                          <div className="space-y-2"><label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2"><AlignLeft className="w-3 h-3" /> Treść Wiadomości</label><textarea value={getConfigField(editingAction, 'message')} onChange={(e) => updateConfigField(editingAction, 'message', e.target.value)} className="input-field min-h-[120px] py-3" /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2"><label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Stopka (Footer)</label><input type="text" value={getConfigField(editingAction, 'footer') || ''} onChange={(e) => updateConfigField(editingAction, 'footer', e.target.value)} className="input-field" /></div>
                             <div className="space-y-2"><label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Miniatura (Thumbnail)</label><button onClick={() => updateConfigField(editingAction, 'thumbnail', !getConfigField(editingAction, 'thumbnail'))} className={cn("w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2", getConfigField(editingAction, 'thumbnail') ? "bg-rose-500/10 border-rose-500/50 text-rose-400" : "bg-background-tertiary border-border text-foreground-secondary")}>{getConfigField(editingAction, 'thumbnail') ? "Włączona" : "Wyłączona"}</button></div>
                          </div>
                        </div>

                        <div className="space-y-4">
                           <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2"><Bell className="w-4 h-4" /> Powiadomienia</h3>
                           <div className="space-y-2"><label className="text-[10px] font-bold text-foreground-subtle uppercase flex items-center gap-2"><Hash className="w-3 h-3" /> Kanał Logów</label><select value={getConfigField(editingAction, 'channelId') || ''} onChange={(e) => updateConfigField(editingAction, 'channelId', e.target.value)} className="input-field"><option value="">Użyj domyślnego...</option>{channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}</select></div>
                        </div>

                        <div className="space-y-4">
                           <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2"><Search className="w-4 h-4" /> Podgląd na żywo</h3>
                           <EmbedPreview 
                            title={getConfigField(editingAction, 'title')}
                            message={getConfigField(editingAction, 'message')}
                            color={getConfigField(editingAction, 'color')}
                            footer={getConfigField(editingAction, 'footer')}
                            showThumbnail={getConfigField(editingAction, 'thumbnail')}
                           />
                        </div>

                        <div className="flex gap-4 pt-4"><button onClick={() => setEditingAction(null)} className="flex-1 py-3 bg-background-tertiary hover:bg-background-elevated border border-border rounded-xl text-sm font-bold transition-all">Anuluj</button><button onClick={() => { handleSave(); setEditingAction(null); }} className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Zapisz i Zamknij</button></div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmbedPreview({ title, message, color, footer, showThumbnail }: any) {
  const renderedMessage = useMemo(() => {
    return (message || '')
      .replace(/{user}/g, '@Użytkownik')
      .replace(/{guild}/g, 'Przykładowy Serwer')
      .replace(/{reason}/g, 'Przykładowy powód kary')
      .replace(/{duration}/g, '30 minut');
  }, [message]);

  return (
    <div className="bg-[#313338] rounded-lg p-4 border-l-4 shadow-xl max-w-full" style={{ borderLeftColor: color }}>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
           <div className="flex items-center gap-2 mb-1"><div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white">B</div><span className="text-[13px] font-bold text-white hover:underline cursor-pointer">Antigravity Bot</span><span className="bg-[#5865F2] text-[10px] font-bold px-1.5 py-0.5 rounded text-white flex items-center gap-0.5"><Shield className="w-2 h-2" /> BOT</span></div>
           {title && <h4 className="text-[15px] font-bold text-white leading-tight">{title}</h4>}
           <p className="text-[14px] text-[#DBDEE1] whitespace-pre-wrap leading-relaxed">{renderedMessage}</p>
           {footer && <div className="pt-2 border-t border-white/5 mt-2 flex items-center gap-2"><span className="text-[11px] text-[#949BA4]">{footer} • Dzisiaj o 12:00</span></div>}
        </div>
        {showThumbnail && <div className="w-16 h-16 rounded bg-[#2B2D31] border border-white/5 flex items-center justify-center"><User className="w-8 h-8 text-[#949BA4]" /></div>}
      </div>
    </div>
  );
}
