import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import type { IterationStep } from '../../store/useResumeStore';

interface Props {
  steps: IterationStep[];
  initialScore: number;
}

const STEP_LABELS = ['Prepare', 'Strengthen', 'Polish', 'Refine', 'Refine'] as const;

export function IterationTrail({ steps, initialScore }: Props) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  // Only show monotonic upward sequence.
  if (!steps || steps.length === 0) return null;
  const monotonic: IterationStep[] = [];
  let best = initialScore;
  for (const s of steps) {
    if (s.scoreAfter > best) {
      monotonic.push(s);
      best = s.scoreAfter;
    } else {
      // held — display as zero-delta entry
      monotonic.push({ ...s, scoreAfter: best, delta: 0 });
    }
  }
  const biggestIdx = monotonic.reduce((idx, s, i, arr) => (s.delta > (arr[idx]?.delta ?? -1) ? i : idx), 0);

  return (
    <section className="mb-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <Layers size={11} />
        {open ? 'Hide step-by-step' : 'See step-by-step progress'}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ol className="mt-4 border-l-2 border-zinc-300 dark:border-zinc-700 pl-5 space-y-3">
              <motion.li
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <span className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-zinc-400 dark:bg-zinc-600 border-2 border-[#F5F1E8] dark:border-[#1A1814]" />
                <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                  Baseline
                </div>
                <div className="font-serif text-sm text-zinc-700 dark:text-zinc-300">
                  Starting at <span className="font-bold tabular-nums">{initialScore}</span>
                </div>
              </motion.li>
              {monotonic.map((s, i) => (
                <motion.li
                  key={i}
                  initial={reduced ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative"
                >
                  <span className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full border-2 border-[#F5F1E8] dark:border-[#1A1814] ${i === biggestIdx && monotonic[biggestIdx].delta > 0 ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                  <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                    Step {s.iteration} · {STEP_LABELS[s.iteration - 1] || 'Refine'}
                  </div>
                  <div className="font-serif text-sm text-zinc-700 dark:text-zinc-300 tabular-nums">
                    {s.scoreBefore} → <span className="font-bold">{s.scoreAfter}</span>
                    {s.delta > 0 && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                        +{s.delta}
                        {i === biggestIdx && monotonic[biggestIdx].delta > 0 && (
                          <span className="ml-2 normal-case font-sans text-[11px] italic text-emerald-700 dark:text-emerald-300">
                            biggest gain
                          </span>
                        )}
                      </span>
                    )}
                    {s.delta === 0 && (
                      <span className="ml-2 text-zinc-500 dark:text-zinc-500 italic text-xs">held</span>
                    )}
                  </div>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
