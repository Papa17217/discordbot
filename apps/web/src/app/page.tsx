// ============================================
// Landing Page
// ============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Shield, Coins, BarChart3, Zap, Star, ArrowRight, Sparkles } from 'lucide-react';
import FeatureTour from '@/components/FeatureTour';

const features = [
  { icon: Shield, title: 'Moderacja', desc: 'Zaawansowany automod, ostrzeżenia, bany, mute i purge.' },
  { icon: Coins, title: 'Ekonomia', desc: 'System walut, codzienna nagroda, sklep, ranking.' },
  { icon: Star, title: 'Poziomy XP', desc: 'Zdobywaj doświadczenie, awansuj, odblokowuj role.' },
  { icon: BarChart3, title: 'Analityka', desc: 'Wykresy w czasie rzeczywistym, statystyki komend.' },
  { icon: Zap, title: 'AutoMod', desc: 'Filtry spamu, linków, zaproszeń, słów, capslocka.' },
  { icon: Sparkles, title: 'Panel Web', desc: 'Premium dashboard do zarządzania wszystkim.' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-secondary/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Discord SaaS</span>
        </div>
        <Link href={`${API_URL}/api/auth/discord`} className="btn-primary flex items-center gap-2">
          <span>Zaloguj się</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 mb-8">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent">Darmowy hosting • Open Source</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Zarządzaj botem
            <br />
            <span className="gradient-text">Discord jak pro</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground-secondary max-w-2xl mx-auto mb-10">
            Nowoczesny panel administracyjny z moderacją, ekonomią, ticketami,
            analityką i wieloma modułami. Wszystko w jednym miejscu.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href={`${API_URL}/api/auth/discord`} className="btn-primary text-lg px-8 py-4 flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              Zaloguj przez Discord
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-4">
              Dowiedz się więcej
            </Link>
          </div>
        </motion.div>

        {/* Onboarding / Feature Tour */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="mt-32"
          aria-label="Interaktywny tour po funkcjach"
        >
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent">Zobacz panel w akcji</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Interaktywny <span className="gradient-text">tour 3D</span>
            </h2>
            <p className="mt-3 text-foreground-secondary max-w-xl mx-auto">
              Przejdź przez kluczowe funkcje, zobacz jak działa drag &amp; drop ticketów
              i poczuj dynamikę panelu zanim zaczniesz.
            </p>
          </div>
          <FeatureTour />
        </motion.section>

        {/* Features */}
        <motion.div
          id="features"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-32"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item} className="glass-card-hover p-8 group">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-foreground-secondary text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <div className="glass-card p-12 glow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent-secondary/5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Gotowy na start?</h2>
              <p className="text-foreground-secondary mb-8 max-w-lg mx-auto">
                Dołącz i zacznij zarządzać swoim botem Discord w nowoczesny sposób.
                Hosting za darmo, konfiguracja w minuty.
              </p>
              <Link href={`${API_URL}/api/auth/discord`} className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-3">
                Rozpocznij za darmo <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-6 text-center text-foreground-subtle text-sm">
        <p>© 2026 Discord SaaS. Zbudowane z ❤️ na darmowych hostingach.</p>
      </footer>
    </div>
  );
}
