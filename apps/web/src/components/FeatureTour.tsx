// ============================================
// FeatureTour - 3D Onboarding Carousel
// ============================================

'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Coins,
  MousePointer2,
  Shield,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

type StepKind = 'welcome' | 'tickets' | 'moderation' | 'economy' | 'analytics';

interface TourStep {
  id: StepKind;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind text color class
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Witaj w panelu',
    subtitle: 'Zarządzaj swoim botem Discord z jednego, eleganckiego miejsca.',
    icon: Sparkles,
    accent: 'text-fuchsia-400',
  },
  {
    id: 'tickets',
    title: 'System Ticketów',
    subtitle: 'Przeciągaj zgłoszenia między kolumnami w czasie rzeczywistym.',
    icon: Ticket,
    accent: 'text-violet-400',
  },
  {
    id: 'moderation',
    title: 'Moderacja & AutoMod',
    subtitle: 'Filtry spamu, linków i zaproszeń – konfiguracja w sekundę.',
    icon: Shield,
    accent: 'text-sky-400',
  },
  {
    id: 'economy',
    title: 'Ekonomia & Poziomy',
    subtitle: 'Waluta serwera, ranking XP, sklep i codzienne nagrody.',
    icon: Coins,
    accent: 'text-amber-300',
  },
  {
    id: 'analytics',
    title: 'Analityka na żywo',
    subtitle: 'Wykresy aktywności, komend i obciążenia w czasie rzeczywistym.',
    icon: BarChart3,
    accent: 'text-emerald-300',
  },
];

// ---------------------------------------------------------------------------
// GlassCard – uniwersalna szklana karta z neonowym obrysem
// ---------------------------------------------------------------------------

interface GlassCardProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

function GlassCard({ children, active = false, className = '' }: GlassCardProps) {
  return (
    <div
      className={[
        'relative h-full w-full overflow-hidden rounded-3xl border',
        'bg-white/[0.04] backdrop-blur-2xl',
        active
          ? 'border-white/15 shadow-[0_0_60px_-10px_rgba(139,92,246,0.55),0_0_120px_-30px_rgba(56,189,248,0.45)]'
          : 'border-white/[0.06] shadow-[0_0_40px_-20px_rgba(139,92,246,0.4)]',
        className,
      ].join(' ')}
    >
      {/* neon edge gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.18), transparent 35%, transparent 65%, rgba(56,189,248,0.18))',
          mask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
          WebkitMask:
            'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: 1,
        }}
      />
      {/* subtle inner highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,255,255,0.06), transparent 70%)',
        }}
      />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TicketMockup – minimalistyczny panel z trzema kolumnami i animacją kursora
// ---------------------------------------------------------------------------

interface TicketItem {
  id: string;
  title: string;
  user: string;
  priority: 'low' | 'mid' | 'high';
}

const COLUMNS: { key: 'open' | 'progress' | 'closed'; label: string; tint: string }[] = [
  { key: 'open', label: 'Otwarte', tint: 'from-violet-500/20 to-violet-500/0' },
  { key: 'progress', label: 'W toku', tint: 'from-sky-500/20 to-sky-500/0' },
  { key: 'closed', label: 'Zamknięte', tint: 'from-emerald-500/20 to-emerald-500/0' },
];

const INITIAL_TICKETS: Record<string, TicketItem[]> = {
  open: [
    { id: 't1', title: 'Bug w sklepie XP', user: 'kacper#1337', priority: 'high' },
    { id: 't2', title: 'Prośba o rolę VIP', user: 'lena#0042', priority: 'low' },
  ],
  progress: [
    { id: 't3', title: 'Reset ekonomii', user: 'admin#0001', priority: 'mid' },
  ],
  closed: [
    { id: 't4', title: 'Spam w #general', user: 'mod#9912', priority: 'mid' },
  ],
};

const PRIORITY_DOT: Record<TicketItem['priority'], string> = {
  low: 'bg-emerald-400',
  mid: 'bg-amber-400',
  high: 'bg-rose-400',
};

function TicketCard({
  ticket,
  ghost = false,
  highlight = false,
}: {
  ticket: TicketItem;
  ghost?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-xl border px-3 py-2.5 text-left transition-colors',
        'bg-white/[0.04] border-white/10 backdrop-blur-md',
        ghost ? 'opacity-30' : 'opacity-100',
        highlight ? 'border-violet-400/50 shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[ticket.priority]}`} />
        <p className="truncate text-xs font-medium text-white/90">{ticket.title}</p>
      </div>
      <p className="mt-1 truncate text-[10px] text-white/40">{ticket.user}</p>
    </div>
  );
}

function TicketMockup({ playing }: { playing: boolean }) {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [phase, setPhase] = useState<'idle' | 'hover' | 'grab' | 'drop' | 'done'>(
    'idle',
  );

  // virtual cursor coords (relative to mockup container, in %)
  const cx = useMotionValue(20);
  const cy = useMotionValue(80);
  const sx = useSpring(cx, { stiffness: 120, damping: 22, mass: 0.6 });
  const sy = useSpring(cy, { stiffness: 120, damping: 22, mass: 0.6 });
  const leftPct = useTransform(sx, (v) => `${v}%`);
  const topPct = useTransform(sy, (v) => `${v}%`);

  // run scripted demo while playing
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const t = setTimeout(() => res(), ms);
        timeouts.push(t);
      });

    const run = async () => {
      while (!cancelled) {
        // reset
        setTickets(INITIAL_TICKETS);
        setPhase('idle');
        cx.set(8);
        cy.set(90);
        await wait(600);
        if (cancelled) return;

        // hover ticket t1 (open column, first card ~ top-left)
        setPhase('hover');
        cx.set(20);
        cy.set(38);
        await wait(900);
        if (cancelled) return;

        // grab
        setPhase('grab');
        await wait(450);
        if (cancelled) return;

        // drag across to "W toku"
        cx.set(52);
        cy.set(48);
        await wait(900);
        if (cancelled) return;

        // drop
        setPhase('drop');
        setTickets((prev) => {
          const moving = prev.open.find((t) => t.id === 't1');
          if (!moving) return prev;
          return {
            ...prev,
            open: prev.open.filter((t) => t.id !== 't1'),
            progress: [moving, ...prev.progress],
          };
        });
        await wait(700);
        if (cancelled) return;

        setPhase('done');
        cx.set(78);
        cy.set(20);
        await wait(1500);
        if (cancelled) return;
      }
    };

    run();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [playing, cx, cy]);

  const dragging = phase === 'grab' || phase === 'drop';
  const movingTicket = INITIAL_TICKETS.open.find((t) => t.id === 't1')!;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-violet-300" />
          <span className="text-sm font-semibold text-white/90">Tickets</span>
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
            #support
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-300/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </div>
      </div>

      {/* columns */}
      <div className="grid h-[calc(100%-3rem)] grid-cols-3 gap-3 p-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={[
              'flex flex-col gap-2 rounded-2xl border border-white/[0.06] p-2.5',
              'bg-gradient-to-b',
              col.tint,
            ].join(' ')}
          >
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                {col.label}
              </span>
              <span className="rounded-md bg-white/5 px-1.5 text-[10px] text-white/50">
                {tickets[col.key].length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {tickets[col.key].map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  highlight={t.id === 't1' && phase === 'hover'}
                  ghost={t.id === 't1' && dragging}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* dragged ghost ticket follows cursor */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            key="drag-ghost"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            style={{
              left: leftPct,
              top: topPct,
              position: 'absolute',
              translateX: '-30%',
              translateY: '-30%',
            }}
            className="pointer-events-none w-44"
          >
            <div className="rotate-[-3deg] rounded-xl border border-violet-400/50 bg-violet-500/10 px-3 py-2.5 shadow-[0_0_30px_-5px_rgba(139,92,246,0.7)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[movingTicket.priority]}`} />
                <p className="truncate text-xs font-medium text-white">{movingTicket.title}</p>
              </div>
              <p className="mt-1 truncate text-[10px] text-white/60">{movingTicket.user}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* virtual cursor */}
      <motion.div
        aria-hidden
        style={{
          left: leftPct,
          top: topPct,
          position: 'absolute',
        }}
        className="pointer-events-none z-20"
      >
        <motion.div
          animate={{
            scale: dragging ? 0.85 : 1,
            rotate: dragging ? -8 : 0,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative"
        >
          <div className="absolute -inset-3 rounded-full bg-violet-500/30 blur-xl" />
          <MousePointer2
            className="relative h-5 w-5 fill-white text-white drop-shadow-[0_0_6px_rgba(139,92,246,0.9)]"
            strokeWidth={1.5}
          />
          {/* tooltip */}
          <motion.div
            initial={false}
            animate={{
              opacity: phase === 'idle' ? 0 : 1,
              y: phase === 'idle' ? 6 : 0,
            }}
            transition={{ duration: 0.25 }}
            className="absolute left-5 top-5 whitespace-nowrap rounded-lg border border-violet-400/40 bg-black/70 px-2.5 py-1 text-[10px] font-medium text-violet-100 shadow-[0_0_20px_-2px_rgba(139,92,246,0.7)] backdrop-blur-md"
          >
            Konfiguracja online w czasie rzeczywistym
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inne mockupy zawartości kart
// ---------------------------------------------------------------------------

function GenericMockup({ step }: { step: TourStep }) {
  const Icon = step.icon;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-8 py-10 text-center">
      <div
        className={[
          'flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]',
          'shadow-[0_0_40px_-8px_rgba(139,92,246,0.6)]',
        ].join(' ')}
      >
        <Icon className={`h-8 w-8 ${step.accent}`} />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
          {step.subtitle}
        </p>
      </div>
      {/* dekoracyjne paski */}
      <div className="grid w-full max-w-sm grid-cols-3 gap-2 pt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent"
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card body picker
// ---------------------------------------------------------------------------

function CardContent({ step, isActive }: { step: TourStep; isActive: boolean }) {
  if (step.id === 'tickets') {
    return <TicketMockup playing={isActive} />;
  }
  return <GenericMockup step={step} />;
}

// ---------------------------------------------------------------------------
// Carousel layer – wyświetla 3 sąsiednie karty w 3D
// ---------------------------------------------------------------------------

function CarouselCard({
  step,
  offset,
  total,
  onClick,
}: {
  step: TourStep;
  offset: -1 | 0 | 1;
  total: number;
  onClick?: () => void;
}) {
  const isActive = offset === 0;

  // Przesunięcie / rotacja w zależności od pozycji
  const x = offset === 0 ? 0 : offset * 320;
  const rotateY = offset === 0 ? 0 : offset * -28;
  const scale = offset === 0 ? 1 : 0.82;
  const z = offset === 0 ? 0 : -120;
  const opacity = offset === 0 ? 1 : 0.55;

  return (
    <motion.div
      layoutId={`tour-card-${step.id}`}
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{
        x,
        rotateY,
        scale,
        z,
        opacity,
        filter: isActive ? 'blur(0px)' : 'blur(8px)',
      }}
      transition={{ type: 'spring', stiffness: 140, damping: 22, mass: 0.9 }}
      style={{
        transformStyle: 'preserve-3d',
        zIndex: isActive ? 30 : 10,
      }}
      className={[
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        'h-[420px] w-[680px] max-w-[92vw]',
        isActive ? 'cursor-default' : 'cursor-pointer',
      ].join(' ')}
    >
      <GlassCard active={isActive} className="h-full w-full">
        <CardContent step={step} isActive={isActive} />
        {/* numer kroku w rogu */}
        <div className="absolute bottom-3 right-4 text-[10px] font-mono uppercase tracking-widest text-white/30">
          {STEPS.findIndex((s) => s.id === step.id) + 1} / {total}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface FeatureTourProps {
  onFinish?: () => void;
  onSkip?: () => void;
  className?: string;
}

export default function FeatureTour({ onFinish, onSkip, className = '' }: FeatureTourProps) {
  const [index, setIndex] = useState(0);
  const total = STEPS.length;

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) {
        onFinish?.();
        return i;
      }
      return i + 1;
    });
  }, [total, onFinish]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // klawiatura: ←/→ do nawigacji
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const visible = useMemo(() => {
    const left = index > 0 ? STEPS[index - 1] : null;
    const center = STEPS[index];
    const right = index < total - 1 ? STEPS[index + 1] : null;
    return { left, center, right };
  }, [index, total]);

  const progress = ((index + 1) / total) * 100;
  const current = STEPS[index];

  return (
    <div
      className={[
        'relative w-full select-none',
        'mx-auto max-w-6xl',
        className,
      ].join(' ')}
    >
      {/* tło (neonowe plamy) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2.5rem]">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-sky-500/20 blur-[120px]" />
      </div>

      {/* Top bar – progress + sterowanie */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-2xl">
        <div className="flex items-center gap-3 pl-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] ${current.accent}`}>
            <current.icon className="h-4 w-4" />
          </span>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-[10px] uppercase tracking-widest text-white/40">
              Krok {index + 1} z {total}
            </span>
            <span className="text-sm font-semibold text-white/90">{current.title}</span>
          </div>
        </div>

        <div className="relative mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400 shadow-[0_0_18px_rgba(139,92,246,0.7)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Wstecz</span>
          </button>

          <button
            type="button"
            onClick={() => onSkip?.()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm text-white/50 transition hover:text-white/80"
          >
            <X className="h-3.5 w-3.5" />
            Pomiń
          </button>

          <button
            type="button"
            onClick={next}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-4 text-sm font-medium text-white shadow-[0_0_24px_-4px_rgba(139,92,246,0.8)] transition hover:from-violet-400 hover:to-sky-400"
          >
            <span>{index === total - 1 ? 'Zakończ' : 'Dalej'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Carousel stage */}
      <div
        className="relative h-[460px] w-full"
        style={{ perspective: 1600 }}
      >
        <div
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <AnimatePresence mode="popLayout">
            {visible.left && (
              <CarouselCard
                key={visible.left.id}
                step={visible.left}
                offset={-1}
                total={total}
                onClick={prev}
              />
            )}
            {visible.center && (
              <CarouselCard
                key={visible.center.id}
                step={visible.center}
                offset={0}
                total={total}
              />
            )}
            {visible.right && (
              <CarouselCard
                key={visible.right.id}
                step={visible.right}
                offset={1}
                total={total}
                onClick={next}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Przejdź do kroku ${i + 1}`}
            className={[
              'h-1.5 rounded-full transition-all',
              i === index
                ? 'w-8 bg-gradient-to-r from-violet-400 to-sky-400 shadow-[0_0_10px_rgba(139,92,246,0.7)]'
                : 'w-1.5 bg-white/20 hover:bg-white/40',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
