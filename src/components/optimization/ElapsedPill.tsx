import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { elapsedLabel } from '../../lib/optimizationPhase';

interface Props {
  startedAt: number;
}

/**
 * Coarse "Working… / Almost there…" pill driven by elapsed time.
 * No seconds counter — avoids anxiety, sets expectation.
 */
export function ElapsedPill({ startedAt }: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  const label = elapsedLabel(seconds);

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
      <Clock size={11} className="opacity-70" />
      {label}
    </span>
  );
}
