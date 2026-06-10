import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SimpleRadar } from './SimpleRadar';
import { computeDimensionDeltas } from '../../lib/scoreNarrative';

interface Props {
  afterBreakdown: Record<string, number> | undefined;
  beforeBreakdown?: Record<string, number>;
}

export function FullBreakdownPanel({ afterBreakdown, beforeBreakdown }: Props) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const dims = computeDimensionDeltas(afterBreakdown, beforeBreakdown);
  if (dims.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? 'Hide full breakdown' : 'Show full breakdown'}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="full"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 mt-5 pt-5 border-t border-zinc-300 dark:border-zinc-700">
              {/* Radar */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <SimpleRadar dimensions={dims.map((d) => ({ label: d.label, before: d.before, after: d.after }))} size={300} />
                  <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-mono uppercase tracking-widest">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-zinc-500/40 border border-zinc-500/60" />
                      Before
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-cyan-500/40 border border-cyan-500" />
                      After
                    </span>
                  </div>
                </div>
              </div>

              {/* Dimension delta list */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                {dims.map((d, i) => (
                  <motion.li
                    key={d.name}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {d.label}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-500">
                        {d.before} <span className="opacity-50">→</span> {d.after}
                      </span>
                    </div>
                    
                    <div
                      className={`flex items-center justify-center px-2 py-1 rounded-md font-mono text-[11px] font-bold tabular-nums min-w-[2.5rem] ${
                        d.delta > 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : d.delta < 0
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {d.delta > 0 ? `+${d.delta}` : d.delta === 0 ? '·' : `${d.delta}`}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
