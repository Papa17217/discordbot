// ============================================
// Root Layout
// ============================================

import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Providers } from '@/providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Discord SaaS — Panel zarządzania botem',
  description: 'Nowoczesny panel administracyjny do zarządzania botem Discord. Moderacja, ekonomia, tickety, analityka i więcej.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a1d',
                border: '1px solid #27272a',
                color: '#fafafa',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
