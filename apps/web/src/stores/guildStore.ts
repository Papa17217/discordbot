// ============================================
// Guild Store — Zustand
// ============================================

import { create } from 'zustand';
import { api } from '@/lib/api';

interface GuildState {
  selectedGuildId: string | null;
  guilds: any[];
  isLoading: boolean;
  error: string | null;
  setSelectedGuild: (id: string) => void;
  fetchGuilds: () => Promise<void>;
}

export const useGuildStore = create<GuildState>()((set) => ({
  selectedGuildId: null,
  guilds: [],
  isLoading: true,
  error: null,
  setSelectedGuild: (id) => set({ selectedGuildId: id }),
  fetchGuilds: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/guilds');
      set({ guilds: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Nie udało się pobrać serwerów', isLoading: false });
    }
  },
}));
