// ============================================
// Auth Callback Page
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Ustaw token i pobierz profil
      useAuthStore.getState().setAccessToken(token);

      api
        .get('/auth/me')
        .then((res) => {
          login(res.data.data, token);
          router.push('/dashboard');
        })
        .catch(() => {
          router.push('/login');
        });
    } else {
      router.push('/login');
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
        <p className="text-foreground-secondary">Logowanie...</p>
      </div>
    </div>
  );
}
