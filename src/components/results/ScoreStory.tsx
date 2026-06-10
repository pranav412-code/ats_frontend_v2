import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { tierFromScore } from '../../lib/scoreNarrative';

interface Props {
  before: number;
  after: number;
}

function useCountUp(target: number, durationMs = 900): number {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, durationMs]);

  return n;
}

const TONE_RING = {
  gold:    'stroke-amber-500',
  emerald: 'stroke-emerald-500',
  cyan:    'stroke-cyan-500',
  amber:   'stroke-amber-500',
  gray:    'stroke-zinc-500',
} as const;
const TONE_BADGE = {
  gold:    'text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10',
  emerald: 'text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  cyan:    'text-cyan-700 dark:text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
  amber:   'text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10',
  gray:    'text-zinc-700 dark:text-zinc-300 border-zinc-500/40 bg-zinc-500/10',
} as const;

function MiniRing({ score, size, animate, label }: { score: number; size: number; animate: boolean; label: string }) {
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;
  const display = useCountUp(animate ? score : score, animate ? 900 : 0);
  const offset = circumference * (1 - Math.max(0, Math.min(100, display)) / 100);
  const tier = tierFromScore(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth="9" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className={TONE_RING[tier.tone]}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Translate to qualitative for very low scores. */}
          {score < 40 ? (
            <span className={`text-sm font-bold font-mono ${TONE_BADGE[tier.tone].split(' ')[0]}`}>{tier.label}</span>
          ) : (
            <span className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
              {display}
            </span>
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mt-1">
            {label}
          </span>
        </div>
      </div>
      <span className={`text-[10px] font-mono uppercase tracking-widest font-bold border px-2 py-0.5 rounded-sm ${TONE_BADGE[tier.tone]}`}>
        {tier.label}
      </span>
    </div>
  );
}

export function ScoreStory({ before, after }: Props) {
  const delta = after - before;
  const tone = tierFromScore(after).tone;
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
      <MiniRing score={before} size={120} animate={false} label="Before" />
      <ArrowRight className="text-zinc-400 hidden sm:block" />
      <MiniRing score={after} size={160} animate label="After" />
      {delta > 0 && (
        <div className={`flex flex-col items-center justify-center ml-2`}>
          <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${TONE_BADGE[tone].split(' ')[0]}`}>
            Lift
          </span>
          <span className={`text-5xl font-black font-mono tabular-nums ${TONE_BADGE[tone].split(' ')[0]} ${TONE_BADGE[tone].split(' ')[1]}`}>
            +{delta}
          </span>
        </div>
      )}
    </div>
  );
}
