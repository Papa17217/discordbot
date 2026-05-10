'use client';
import { motion } from 'framer-motion';
import { Crown, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free', price: '0 zł', period: '/miesiąc', current: true,
    features: ['3 serwery', 'Moderacja', 'Tickety', 'Podstawowa analityka', 'Wsparcie community'],
  },
  {
    name: 'Premium', price: '19 zł', period: '/miesiąc', popular: true,
    features: ['10 serwerów', 'Wszystkie moduły', 'AI moderacja', 'Zaawansowana analityka', 'Priorytetowe wsparcie', 'Custom embed builder', 'Temp voice channels'],
  },
  {
    name: 'Enterprise', price: '49 zł', period: '/miesiąc',
    features: ['Nielimitowane serwery', 'Wszystko z Premium', 'Dedykowane wsparcie', 'API access', 'Custom branding', 'SLA gwarancja'],
  },
];

export default function PremiumPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3"><Crown className="w-8 h-8 text-amber-400" /> Premium</h1>
        <p className="text-foreground-secondary mt-2">Odblokuj pełny potencjał swojego bota.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={cn('glass-card p-8 relative', plan.popular && 'border-accent/50 glow')}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Popularne
              </div>
            )}
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-foreground-subtle text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <Check className="w-4 h-4 text-status-success flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button className={cn(plan.current ? 'btn-secondary w-full' : plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full')}>
              {plan.current ? 'Aktualny plan' : 'Wybierz plan'}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
