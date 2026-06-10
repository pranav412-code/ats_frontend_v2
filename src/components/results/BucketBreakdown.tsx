import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { computeBuckets } from '../../lib/scoreNarrative';

interface Props {
  afterBreakdown: Record<string, number> | undefined;
  beforeBreakdown?: Record<string, number>;
}

export function BucketBreakdown({ afterBreakdown, beforeBreakdown }: Props) {
  const reduced = useReducedMotion();
  const buckets = computeBuckets(afterBreakdown, beforeBreakdown);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
      {buckets.map((b, idx) => (
        <motion.div
          key={b.key}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          className="border border-zinc-300 dark:border-zinc-700 p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
              {b.label}
            </span>
            {b.delta !== 0 && (
              <span
                className={`text-[10px] font-mono font-bold tabular-nums ${
                  b.delta > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 dark:text-zinc-500'
                }`}
              >
                {b.delta > 0 ? `▲ +${b.delta}` : '·'}
              </span>
            )}
          </div>
          <p className="font-serif italic text-xs text-zinc-500 dark:text-zinc-500 mb-2.5">
            {b.blurb}
          </p>

          {/* Stacked bar with before/after overlay */}
          <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            {/* Before track (muted) */}
            <div
              className="absolute inset-y-0 left-0 bg-zinc-400/50 dark:bg-zinc-600/50"
              style={{ width: `${b.before}%` }}
            />
            {/* After overlay */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-indigo-500"
              initial={reduced ? false : { width: `${b.before}%` }}
              animate={{ width: `${b.after}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 + idx * 0.05 }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] font-mono tabular-nums text-zinc-500 dark:text-zinc-500">
            <span>{b.before}</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{b.after}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
