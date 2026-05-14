'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * True after zustand/persist finished rehydrating from localStorage (client only).
 * During SSR / prerender persist API is absent — we never touch it until useEffect.
 */
export function useAuthPersistHydrated(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const api = useAuthStore.persist;
    if (!api) {
      setReady(true);
      return;
    }
    const markReady = () => setReady(true);
    const unsub = api.onFinishHydration(markReady);
    if (api.hasHydrated()) markReady();
    return unsub;
  }, []);

  return ready;
}
