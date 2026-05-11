'use client';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Terminal, Shield, Trash2, Loader2, Circle, AlertCircle, Info, Settings, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

export default function AdminConsolePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Automatyczne wykrywanie adresu: pierwszeństwo ma zmienna, potem aktualny host na porcie 4000
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    if (!socketUrl && typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Jeśli jesteśmy na porcie 3000, API prawdopodobnie jest na 4000
      socketUrl = `${window.location.protocol}//${window.location.hostname}:4000/ws`;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;


    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('admin:join');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('admin:log', (log: LogEntry) => {
      setLogs(prev => [...prev.slice(-499), log]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    const level = log.level?.toLowerCase() || '';
    return level.includes(filter.toLowerCase());
  });

  // Pozwalamy OWNER i ADMIN
  if (user?.role !== 'OWNER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-rose-500 opacity-20" />
        <h2 className="text-xl font-bold">Brak uprawnień dostępu</h2>
        <p className="text-foreground-secondary">Tylko administratorzy mogą przeglądać konsolę systemową.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Terminal className="w-7 h-7 text-accent" /> Konsola Systemowa
          </h1>
          <p className="text-foreground-secondary mt-1 flex items-center gap-2">
            Podgląd logów bota w czasie rzeczywistym
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
              isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              <Circle className={cn("w-2 h-2 fill-current", isConnected && "animate-pulse")} />
              {isConnected ? "Połączono" : "Rozłączono"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-background-secondary p-1 rounded-lg border border-border mr-2">
             {['all', 'info', 'warn', 'error'].map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={cn(
                   "px-3 py-1 rounded-md text-xs font-medium transition-all uppercase tracking-wider",
                   filter === f ? "bg-accent text-white shadow-lg" : "text-foreground-secondary hover:text-foreground"
                 )}
               >
                 {f === 'all' ? 'Wszystkie' : f}
               </button>
             ))}
          </div>
          <button onClick={clearLogs} className="p-2 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors border border-border">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="glass-card border-accent/20 overflow-hidden flex flex-col shadow-2xl shadow-accent/5">
        <div className="bg-background-elevated/50 px-4 py-2 border-b border-border flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <div className="text-[10px] text-foreground-subtle font-mono uppercase tracking-widest">
            expo-bot@system ~ log-stream
          </div>
          <div className="w-12" />
        </div>

        <div 
          ref={scrollRef}
          className="h-[60vh] bg-[#0c0c0e] p-4 font-mono text-sm overflow-y-auto selection:bg-accent/30 scrollbar-thin scrollbar-thumb-accent/20"
        >
          <AnimatePresence initial={false}>
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-foreground-subtle gap-3 opacity-50">
                {!isConnected ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCcw className="w-6 h-6" />}
                <p>{!isConnected ? 'Oczekiwanie na połączenie z serwerem...' : 'Cisza w logach. Bot nie wysłał jeszcze nowych komunikatów.'}</p>
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 mb-1.5 hover:bg-white/[0.02] -mx-2 px-2 py-0.5 rounded transition-colors group"
                >
                  <span className="text-foreground-subtle whitespace-nowrap opacity-50 text-[12px]">
                    {log.timestamp?.split(' ')[1] || log.timestamp}
                  </span>
                  <span className={cn(
                    "font-bold uppercase text-[12px] min-w-[60px]",
                    log.level?.includes('error') && "text-rose-400",
                    log.level?.includes('warn') && "text-amber-400",
                    log.level?.includes('info') && "text-emerald-400",
                  )}>
                    [{log.level?.replace(/\u001b\[[0-9;]*m/g, '') || 'LOG'}]
                  </span>
                  <span className="text-foreground-secondary break-all group-hover:text-foreground transition-colors">
                    {log.message}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-3 bg-background-elevated/50 border-t border-border flex items-center gap-3">
          <div className="text-accent text-lg font-bold select-none">&gt;</div>
          <input 
            type="text" 
            placeholder="Wpisz komendę (np. restart, status)... (wkrótce)" 
            disabled
            className="bg-transparent border-none outline-none text-sm w-full text-foreground-subtle placeholder:opacity-30"
          />
        </div>
      </div>
    </motion.div>
  );
}
