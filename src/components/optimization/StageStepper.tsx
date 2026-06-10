import React from 'react';
import { motion } from 'motion/react';
import { STAGE_LABELS, type UserPhase, type ViewState, stageIndex, visibleStages } from '../../lib/optimizationPhase';

interface Props {
  phase: UserPhase;
  mode: ViewState['mode'];
}

export function StageStepper({ phase, mode }: Props) {
  const stages = visibleStages(mode);
  const current = stageIndex(phase, mode); // 1-indexed, 0 if not started
  const totalCount = stages.length;

  return (
    <div className="space-y-2" aria-label={`Step ${current} of ${totalCount}`}>
      <div className="flex items-center gap-2">
        {stages.map((s, i) => {
          const idx = i + 1;
          const state = idx < current ? 'done' : idx === current ? 'active' : 'pending';
          return (
            <motion.div
              key={s}
              className={
                state === 'done'
                  ? 'flex-1 h-1.5 rounded-full bg-emerald-500'
                  : state === 'active'
                  ? 'flex-1 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500'
                  : 'flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800'
              }
              animate={state === 'active' ? { opacity: [0.85, 1, 0.85] } : { opacity: 1 }}
              transition={{ duration: 1.6, repeat: state === 'active' ? Infinity : 0 }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-widest">
        {stages.map((s, i) => {
          const idx = i + 1;
          const state = idx < current ? 'done' : idx === current ? 'active' : 'pending';
          return (
            <span
              key={s}
              className={
                state === 'done'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : state === 'active'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-zinc-400 dark:text-zinc-600'
              }
            >
              {STAGE_LABELS[s]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
