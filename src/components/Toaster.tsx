import React from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { Coins, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Lightweight top-right toast stack. No external lib — reads from
 * `useResumeStore().toasts` and dismisses via store action.
 *
 * Auto-dismiss is handled in the store (setTimeout on push).
 */
export function Toaster() {
  const toasts = useResumeStore((s) => s.toasts);
  const dismiss = useResumeStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => {
        const palette = {
          refund: 'border-amber-500/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100',
          success: 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
          error: 'border-red-500/60 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100',
          info: 'border-zinc-500/60 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
        }[t.kind];

        const Icon = {
          refund: Coins,
          success: CheckCircle2,
          error: AlertCircle,
          info: Info,
        }[t.kind];

        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'flex items-start gap-3 p-3 border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-200',
              palette
            )}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">{t.title}</div>
              {t.message && (
                <div className="text-xs mt-1 opacity-80 leading-snug">{t.message}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-60 hover:opacity-100 transition"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
