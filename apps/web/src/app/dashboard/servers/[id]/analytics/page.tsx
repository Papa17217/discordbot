'use client';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const topCommands = [
  { name: '/balance', count: 234, pct: 100 },
  { name: '/daily', count: 189, pct: 81 },
  { name: '/rank', count: 156, pct: 67 },
  { name: '/help', count: 98, pct: 42 },
  { name: '/leaderboard', count: 67, pct: 29 },
  { name: '/ping', count: 45, pct: 19 },
  { name: '/serverinfo', count: 34, pct: 15 },
];

const memberGrowth = [
  { date: 'Pon', joins: 12, leaves: 3 },
  { date: 'Wt', joins: 8, leaves: 5 },
  { date: 'Śr', joins: 15, leaves: 2 },
  { date: 'Czw', joins: 6, leaves: 4 },
  { date: 'Pt', joins: 20, leaves: 6 },
  { date: 'Sob', joins: 25, leaves: 3 },
  { date: 'Nd', joins: 18, leaves: 7 },
];

export default function AnalyticsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3"><BarChart3 className="w-7 h-7 text-accent" /> Analityka</h1>
        <p className="text-foreground-secondary mt-1">Statystyki i wykresy serwera.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top commands */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Najpopularniejsze komendy</h3>
          <div className="space-y-3">
            {topCommands.map((cmd, i) => (
              <div key={cmd.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-foreground-secondary">{cmd.name}</span>
                  <span className="text-foreground-subtle">{cmd.count}</span>
                </div>
                <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cmd.pct}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member growth */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Wzrost członków (7 dni)</h3>
          <div className="flex items-end gap-2 h-48 mt-4">
            {memberGrowth.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(d.joins / 25) * 100}%` }}
                    transition={{ delay: i * 0.1 }} className="flex-1 bg-emerald-400/40 rounded-t" />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(d.leaves / 25) * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.05 }} className="flex-1 bg-rose-400/40 rounded-t" />
                </div>
                <span className="text-[10px] text-foreground-subtle">{d.date}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-foreground-secondary">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" /> Dołączyli</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400/60" /> Odeszli</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
