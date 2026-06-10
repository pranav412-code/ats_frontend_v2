import React from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { Coins, Loader2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export function CreditIndicator() {
  const credits = useResumeStore((s) => s.credits);
  const loading = useResumeStore((s) => s.creditsLoading);
  const fetchCredits = useResumeStore((s) => s.fetchCredits);
  const setCurrentPage = useResumeStore((s) => s.setCurrentPage);

  const tone =
    credits === null
      ? 'neutral'
      : credits <= 0
      ? 'zero'
      : credits < 2
      ? 'low'
      : 'ok';

  return (
    <>
      <div className="inline-flex items-stretch">
        <button
          type="button"
          onClick={() => fetchCredits()}
          title={
            credits === null
              ? 'Credits unknown — click to refresh'
              : `${credits} credit${credits === 1 ? '' : 's'} remaining · click to refresh`
          }
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 border text-[11px] font-mono uppercase tracking-[0.2em] font-bold transition-colors',
            tone === 'ok' && 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60',
            tone === 'low' && 'border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30',
            tone === 'zero' && 'border-rose-400 dark:border-rose-700 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30',
            tone === 'neutral' && 'border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
          )}
          aria-label={`Credit balance: ${credits ?? 'unknown'}`}
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin shrink-0" />
          ) : (
            <Coins size={12} className="shrink-0" />
          )}
          <span className="tabular-nums">
            {credits === null ? '—' : credits}
          </span>
          <span className="hidden sm:inline opacity-70">credits</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('pricing')}
          title="Buy more credits"
          aria-label="Buy more credits"
          className={cn(
            'inline-flex items-center justify-center px-2 border border-l-0 transition-colors',
            tone === 'zero'
              ? 'border-rose-400 dark:border-rose-700 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
          )}
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
