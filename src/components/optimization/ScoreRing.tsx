import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

interface ScoreRingProps {
  score: number | null;       // best so far
  initial: number | null;     // baseline for delta
  burstAt: number | null;     // timestamp; triggers confetti when changes
}

/**
 * Animated circular score with count-up, ring fill, monotonic delta badge,
 * and confetti burst on large gains.
 */
export function ScoreRing({ score, initial, burstAt }: ScoreRingProps) {
  const reduced = useReducedMotion();
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  // Displayed score animates from 0 → target via interval ticker.
  const [displayScore, setDisplayScore] = useState(0);
  const target = score ?? 0;

  useEffect(() => {
    if (reduced) {
      setDisplayScore(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = displayScore;
    const duration = 800;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplayScore(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduced]);

  const offset = circumference * (1 - Math.max(0, Math.min(100, displayScore)) / 100);
  const delta = score !== null && initial !== null ? score - initial : 0;

  return (
    <div className="relative w-36 h-36 sm:w-40 sm:h-40">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-zinc-200/70 dark:stroke-zinc-800"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className="stroke-cyan-500 dark:stroke-cyan-400"
          style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.45))' }}
          // Define the start so motion never animates strokeDashoffset from
          // `undefined` (empty ring → fills to `offset`).
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
          Match Score
        </span>
        <span className="text-4xl font-black font-mono text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
          {displayScore}
        </span>
        <AnimatePresence mode="wait">
          {delta >= 3 && (
            <motion.span
              key={delta}
              initial={{ y: 8, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-[11px] font-mono mt-1 tabular-nums text-emerald-600 dark:text-emerald-400 font-bold"
            >
              ▲ +{delta}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Confetti burst — triggered each time burstAt changes */}
      <ConfettiBurst trigger={burstAt} />
    </div>
  );
}

function ConfettiBurst({ trigger }: { trigger: number | null }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (trigger && !reduced) {
      setActive((n) => n + 1);
      const id = setTimeout(() => setActive(0), 900);
      return () => clearTimeout(id);
    }
  }, [trigger, reduced]);
  if (!active || reduced) return null;
  const particles = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 60 + Math.random() * 20;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const tones = ['bg-emerald-400', 'bg-cyan-400', 'bg-indigo-400', 'bg-amber-400'];
        const tone = tones[i % tones.length];
        return (
          <motion.span
            key={`${active}-${i}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className={`absolute w-1.5 h-1.5 rounded-full ${tone}`}
          />
        );
      })}
    </div>
  );
}
