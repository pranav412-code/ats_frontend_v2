import React from 'react';
import { motion } from 'motion/react';
import { verdictFromDelta, formatDuration } from '../../lib/scoreNarrative';

interface Props {
  delta: number;
  strengthsCount: number;
  durationMs: number;
  targetRole?: string;
}

const TONE_MAP = {
  gold:    { kicker: 'text-amber-700 dark:text-amber-400',    chip: 'border-amber-700/40 text-amber-800 dark:text-amber-300' },
  emerald: { kicker: 'text-emerald-700 dark:text-emerald-400', chip: 'border-emerald-700/40 text-emerald-800 dark:text-emerald-300' },
  cyan:    { kicker: 'text-cyan-700 dark:text-cyan-400',       chip: 'border-cyan-700/40 text-cyan-800 dark:text-cyan-300' },
  amber:   { kicker: 'text-amber-700 dark:text-amber-400',     chip: 'border-amber-700/40 text-amber-800 dark:text-amber-300' },
  gray:    { kicker: 'text-zinc-600 dark:text-zinc-400',       chip: 'border-zinc-500/40 text-zinc-700 dark:text-zinc-300' },
} as const;

export function VerdictBanner({ delta, strengthsCount, durationMs, targetRole }: Props) {
  const v = verdictFromDelta(delta);
  const tone = TONE_MAP[v.tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pb-8 mb-10 border-b border-zinc-300 dark:border-zinc-700"
    >
      <p className={`text-[10px] font-mono uppercase tracking-[0.3em] mb-3 ${tone.kicker}`}>
        ⟶ Optimization Complete
      </p>
      <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[0.95]">
        {v.headline.split('.')[0]}
        {v.headline.includes('.') && (
          <span className="italic font-normal text-zinc-700 dark:text-zinc-300">
            {' '}{v.headline.split('.').slice(1).join('.').trim()}
          </span>
        )}
      </h1>
      <p className="font-serif italic text-lg text-zinc-600 dark:text-zinc-400 mt-3 max-w-2xl">
        {v.subhead}
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 border ${tone.chip} font-mono uppercase tracking-widest text-[10px] font-bold`}>
          {strengthsCount} strength{strengthsCount === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-zinc-400 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 font-mono uppercase tracking-widest text-[10px]">
          {formatDuration(durationMs)}
        </span>
        {targetRole && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-zinc-400 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 font-mono uppercase tracking-widest text-[10px] max-w-xs truncate">
            For: {targetRole}
          </span>
        )}
      </div>
    </motion.div>
  );
}
