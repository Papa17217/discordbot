// ============================================
// Providers — Query, Auth, Socket
// ============================================

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { LanguageProvider } from './LanguageProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </QueryClientProvider>
  );
}
