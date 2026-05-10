'use client';

import { motion } from 'framer-motion';
import { Shield, Search, UserCheck, ShieldAlert, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getDiscordAvatarUrl } from '@/lib/utils';

export default function StaffPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Błąd pobierania użytkowników');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    setIsUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      toast.success(`Zaktualizowano rolę użytkownika`);
    } catch (err) {
      toast.error('Nie udało się zmienić roli');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.discordId.includes(search)
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="w-7 h-7 text-accent" /> Zarządzanie Ekipą
          </h1>
          <p className="text-foreground-secondary mt-1">Zarządzaj uprawnieniami administratorów i moderatorów platformy.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
        <input 
          type="text" 
          placeholder="Szukaj po nazwie lub ID Discord..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-background-secondary border border-border rounded-xl pl-11 pr-4 py-3 outline-none focus:border-accent transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="glass-card p-4 flex items-center justify-between group hover:border-accent/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-background-elevated border border-border">
                <img src={getDiscordAvatarUrl(user.discordId, user.avatar)} alt={user.username} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{user.username}</h3>
                  {user.role === 'OWNER' && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-lg uppercase border border-rose-500/20">Właściciel</span>}
                  {user.role === 'ADMIN' && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-lg uppercase border border-amber-500/20">Admin</span>}
                </div>
                <p className="text-xs text-foreground-subtle font-mono">{user.discordId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isUpdating === user.id ? (
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              ) : user.role !== 'OWNER' ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      user.role === 'ADMIN' 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' 
                      : 'bg-accent/10 border-accent/20 text-accent hover:bg-accent/20'
                    }`}
                  >
                    {user.role === 'ADMIN' ? 'Zabierz Admina' : 'Daj Admina'}
                  </button>
                  <button 
                    onClick={() => updateRole(user.id, user.role === 'MOD' ? 'USER' : 'MOD')}
                    className="px-4 py-2 bg-background-elevated border border-border rounded-xl text-xs font-bold hover:bg-glass-light transition-all"
                  >
                    {user.role === 'MOD' ? 'Zabierz Moda' : 'Daj Moda'}
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-foreground-subtle uppercase px-4">Brak akcji</span>
              )}
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 glass-card space-y-4">
            <ShieldAlert className="w-12 h-12 mx-auto text-foreground-subtle opacity-20" />
            <p className="text-foreground-secondary">Nie znaleziono użytkowników spełniających kryteria.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
