import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { REASSURANCE_BY_PHASE, type UserPhase } from '../../lib/optimizationPhase';

interface Props {
  phase: UserPhase;
}

/**
 * Rotates through phase-appropriate reassurance phrases every 4s.
 * Resets timer on phase change with 1.5s pause for emphasis.
 */
export function ReassurancePhrase({ phase }: Props) {
  const reduced = useReducedMotion();
  const phrases = REASSURANCE_BY_PHASE[phase] || REASSURANCE_BY_PHASE.prepare;
  const [idx, setIdx] = useState(0);

  // Reset on phase change.
  useEffect(() => {
    setIdx(0);
  }, [phase]);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const pauseMs = 1500;
    const cycleMs = 4000;
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      setIdx((p) => (p + 1) % phrases.length);
      intervalId = setInterval(() => setIdx((p) => (p + 1) % phrases.length), cycleMs);
    }, pauseMs);
    
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [phase, phrases.length]);

  const text = phrases[idx] ?? phrases[0];

  return (
    <div className="h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={`${phase}-${idx}`}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="font-serif italic text-[15px] text-zinc-600 dark:text-zinc-400 text-center"
        >
          {text}…
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
