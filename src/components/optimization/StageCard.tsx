import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { PrepareCard } from './stages/PrepareCard';
import { StrengthenCard } from './stages/StrengthenCard';
import { PolishCard } from './stages/PolishCard';
import type { UserPhase } from '../../lib/optimizationPhase';

interface Props {
  phase: UserPhase;
}

/**
 * AnimatePresence host that swaps stage visuals on phase change.
 * Shared layoutId="resume-outline" carries continuity across stages.
 */
export function StageCard({ phase }: Props) {
  const reduced = useReducedMotion();

  return (
    <div className="relative min-h-[280px] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {phase === 'prepare' && <PrepareCard />}
          {phase === 'strengthen' && <StrengthenCard />}
          {phase === 'polish' && <PolishCard />}
          {phase === 'complete' && <CompleteFlash />}
          {phase === 'error' && null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CompleteFlash() {
  const reduced = useReducedMotion();
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        initial={reduced ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl scale-150" />
          <CheckCircle2 className="relative w-16 h-16 text-emerald-500" strokeWidth={1.6} />
        </div>
        <span className="font-serif italic text-zinc-700 dark:text-zinc-300 text-sm">All set</span>
      </motion.div>
    </div>
  );
}
