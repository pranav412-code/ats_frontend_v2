import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import type { RawLogEntry } from '../../lib/optimizationPhase';

interface Props {
  logs: RawLogEntry[];
}

const LS_KEY = 'opt.detailsDrawerOpen';

/**
 * Tier-2 escape hatch. Collapsed by default. Open state persisted in
 * localStorage. Shows raw SSE log stream in terminal styling.
 */
export function DetailsDrawer({ logs }: Props) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, open ? '1' : '0');
    } catch {}
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [logs.length, open]);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Show details
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 w-full bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900 bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                    optimization-stream.log
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600 hidden sm:inline">
                    · {logs.length} events
                  </span>
                </div>
              </div>
              <div className="h-56 overflow-y-auto p-3 font-mono text-[11px] text-zinc-300">
                {logs.length === 0 && (
                  <div className="italic text-zinc-600">Waiting for first event…</div>
                )}
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-2 leading-relaxed">
                    <span className="text-zinc-700 select-none text-[10px] tabular-nums shrink-0">
                      {new Date(l.ts).toLocaleTimeString([], { hour12: false })}
                    </span>
                    <span className="text-zinc-300 whitespace-pre-wrap break-words">
                      {l.msg}
                    </span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
