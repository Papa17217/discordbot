'use client';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getDiscordAvatarUrl } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3"><Settings className="w-7 h-7" /> Ustawienia</h1>
        <p className="text-foreground-secondary mt-1">Zarządzaj swoim kontem.</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-accent" /> Profil</h3>
        <div className="flex items-center gap-4">
          {user && (
            <img src={getDiscordAvatarUrl(user.discordId, user.avatar, 256)} alt={user.username}
              className="w-16 h-16 rounded-2xl" />
          )}
          <div>
            <p className="text-lg font-semibold">{user?.username}</p>
            <p className="text-sm text-foreground-secondary">{user?.role} • {user?.subscription}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-400" /> Powiadomienia</h3>
        <div className="space-y-3">
          {[
            { label: 'Akcje moderacyjne', desc: 'Powiadomienia o banach, kickach itp.', on: true },
            { label: 'Nowe tickety', desc: 'Gdy użytkownik utworzy ticket', on: true },
            { label: 'Statystyki tygodniowe', desc: 'Raport aktywności co tydzień', on: false },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-foreground-subtle">{n.desc}</p></div>
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${n.on ? 'bg-accent' : 'bg-background-elevated'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${n.on ? 'translate-x-5' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-6 border-status-error/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-status-error" /> Strefa niebezpieczna</h3>
        <button onClick={() => { logout(); window.location.href = '/'; }} className="btn-danger">
          Wyloguj się
        </button>
      </div>
    </motion.div>
  );
}
