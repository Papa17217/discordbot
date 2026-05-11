'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { Terminal, Shield, Trash2, Loader2, Circle, AlertCircle, RefreshCcw, Layout, Monitor, ChevronLeft } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

// XTerm imports
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'terminal'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Automatyczne wykrywanie adresu
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!socketUrl && typeof window !== 'undefined') {
      socketUrl = `${window.location.protocol}//${window.location.hostname}:4000/ws`;
    }

    const authStorage = typeof window !== 'undefined' ? localStorage.getItem('discord-saas-auth') : null;
    let token = null;
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.accessToken;
      } catch (e) {
        console.error('Błąd parsowania auth storage', e);
      }
    }

    const socket = io(socketUrl || '', {
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

    socket.on('terminal:output', (data: string) => {
      console.log('📥 Terminal output received');
      if (xtermRef.current) {
        xtermRef.current.write(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Re-join terminal on tab change or reconnect
  useEffect(() => {
    if (activeTab === 'terminal' && isConnected && socketRef.current) {
      console.log('🚀 Emitting terminal:join');
      socketRef.current.emit('terminal:join');
    }
  }, [activeTab, isConnected]);

  const restartTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    setActiveTab('logs');
    setTimeout(() => setActiveTab('terminal'), 100);
  };

  // Inicjalizacja XTerm
  useEffect(() => {
    let resizeTimer: any;
    
    if (activeTab === 'terminal' && terminalRef.current && !xtermRef.current) {
      console.log('🛠 Initializing XTerm...');
      
      const term = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
        theme: {
          background: '#0c0c0e',
          foreground: '#e4e4e7',
          cursor: '#6366f1',
          selectionBackground: 'rgba(99, 102, 241, 0.3)',
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      
      // Mały delay na wyrenderowanie DOM
      setTimeout(() => {
        fitAddon.fit();
        socketRef.current?.emit('terminal:resize', {
          cols: term.cols,
          rows: term.rows,
        });
      }, 200);

      term.onData((data) => {
        socketRef.current?.emit('terminal:input', data);
      });

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
            socketRef.current?.emit('terminal:resize', {
              cols: term.cols,
              rows: term.rows,
            });
          }
        }, 200);
      };

      window.addEventListener('resize', handleResize);

      socketRef.current?.emit('terminal:join');

      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimer);
      };
    }
    return () => {};
  }, [activeTab]);



  useEffect(() => {
    if (activeTab === 'logs' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  const clearLogs = () => setLogs([]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    const level = log.level?.toLowerCase() || '';
    return level.includes(filter.toLowerCase());
  });

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
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/servers" className="text-xs text-foreground-subtle hover:text-accent transition-colors flex items-center gap-1 group">
              <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Powrót do serwerów
            </Link>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Terminal className="w-7 h-7 text-accent" /> Konsola Systemowa
          </h1>
          <p className="text-foreground-secondary mt-1 flex items-center gap-2">
            Zarządzanie botem i systemem Ubuntu
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
              isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              <Circle className={cn("w-2 h-2 fill-current", isConnected && "animate-pulse")} />
              {isConnected ? "Połączono" : "Rozłączono"}
            </span>
          </p>
        </div>


        <div className="flex items-center gap-2 bg-background-secondary p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'logs' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-foreground-secondary hover:text-foreground"
            )}
          >
            <Layout className="w-4 h-4" /> Logi Bota
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'terminal' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-foreground-secondary hover:text-foreground"
            )}
          >
            <Monitor className="w-4 h-4" /> Terminal SSH
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
          <div className="text-[10px] text-foreground-subtle font-mono uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-3 h-3" /> 
            {activeTab === 'logs' ? 'expo-bot@system ~ log-stream' : 'ubuntu@oracle-cloud ~ /bin/bash'}
          </div>
          <div className="w-12" />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'logs' ? (
            <motion.div
              key="logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <div className="p-3 bg-background-secondary/50 border-b border-border flex items-center justify-between">
                <div className="flex gap-2">
                  {['all', 'info', 'warn', 'error'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all tracking-wider border",
                        filter === f ? "bg-accent border-accent text-white" : "border-border text-foreground-secondary hover:text-foreground"
                      )}
                    >
                      {f === 'all' ? 'Wszystkie' : f}
                    </button>
                  ))}
                </div>
                <button onClick={clearLogs} className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div 
                ref={scrollRef}
                className="h-[60vh] bg-[#0c0c0e] p-4 font-mono text-sm overflow-y-auto selection:bg-accent/30 scrollbar-thin scrollbar-thumb-accent/20"
              >
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-foreground-subtle gap-3 opacity-50">
                    {!isConnected ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCcw className="w-6 h-6" />}
                    <p>{!isConnected ? 'Oczekiwanie na połączenie...' : 'Cisza w logach.'}</p>
                  </div>
                ) : (
                  filteredLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 mb-1 hover:bg-white/[0.02] px-2 py-0.5 rounded transition-colors group">
                      <span className="text-foreground-subtle opacity-50 text-[12px] min-w-[70px]">
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
                      <span className="text-foreground-secondary break-all group-hover:text-foreground">
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="terminal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-[65.5vh] bg-[#0c0c0e] p-2"
            >
              <div ref={terminalRef} className="h-full" />
              <button 
                onClick={restartTerminal}
                className="absolute bottom-4 right-6 p-2 bg-background-elevated/80 hover:bg-accent text-foreground-secondary hover:text-white rounded-full transition-all border border-border shadow-xl backdrop-blur-md z-10 group"
                title="Zrestartuj terminal"
              >
                <RefreshCcw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
              </button>
            </motion.div>

          )}
        </AnimatePresence>

        <div className="p-3 bg-background-elevated/50 border-t border-border flex items-center justify-between text-[10px] text-foreground-subtle">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> API: Online</span>
            <span className="flex items-center gap-1"><Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> DB: Connected</span>
          </div>
          <div className="font-mono">IP: {typeof window !== 'undefined' ? window.location.hostname : '...'}</div>
        </div>
      </div>
    </motion.div>
  );
}
