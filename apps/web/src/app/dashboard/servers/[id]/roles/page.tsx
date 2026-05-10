'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Loader2, Shield, Search, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function RolesPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (serverId) {
      api.get(`/guilds/${serverId}/roles`)
        .then(res => {
          setRoles(res.data.data || []);
          setIsLoading(false);
        })
        .catch(() => {
          toast.error('Błąd ładowania ról');
          setIsLoading(false);
        });
    }
  }, [serverId]);

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" /> Ładowanie ról...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-accent" /> Role Serwera
          </h1>
          <p className="text-foreground-secondary mt-1">Podgląd wszystkich ról dostępnych na tym serwerze.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
        <input 
          className="w-full bg-background-secondary border border-border rounded-xl pl-12 pr-4 py-3 outline-none focus:border-accent/50" 
          placeholder="Szukaj roli..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map(role => (
          <div key={role.id} className="p-4 bg-background-secondary border border-border rounded-xl flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                <span className="font-medium">{role.name}</span>
             </div>
             <span className="text-[10px] text-foreground-subtle font-mono">{role.id}</span>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="p-20 text-center text-foreground-subtle bg-background-secondary rounded-2xl border border-dashed border-border">
          Nie znaleziono ról spełniających kryteria.
        </div>
      )}
    </motion.div>
  );
}
