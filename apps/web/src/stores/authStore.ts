// ============================================
// Auth Store — Zustand
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  role: string;
  subscription: string;
  whitelist?: string[]; // ['PRIVATE', 'PUBLIC']
}

type BotType = 'PRIVATE' | 'PUBLIC';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeBotType: BotType;
  setUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setActiveBotType: (botType: BotType) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      activeBotType: 'PRIVATE' as BotType,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),

      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),

      setLoading: (isLoading) => set({ isLoading }),
      setActiveBotType: (activeBotType) => set({ activeBotType }),
    }),
    {
      name: 'discord-saas-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        activeBotType: state.activeBotType,
      }),
    },
  ),
);
