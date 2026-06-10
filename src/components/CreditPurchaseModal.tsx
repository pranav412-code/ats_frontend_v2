import React, { useEffect, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { X, Coins, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Pack purchase modal — demo mode for now.
 *
 * Flow:
 *   1. Open → fetchCreditPacks loads catalog + demo_mode flag from backend.
 *   2. User clicks a pack → purchasePack(id) → backend grants credits +
 *      writes a transactions row → returns new balance.
 *   3. Success card replaces the picker for 2s, then modal auto-closes.
 *
 * Real provider integration: replace the inline purchase call with a
 * Razorpay/Stripe Checkout sequence whose `payment_id` + `signature` are
 * passed to `purchasePack` for backend verification before the credit grant.
 */
const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$' };

function formatPrice(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return 'TBD';
  const sym = CURRENCY_SYMBOL[currency] || '';
  const major = amount / 100;
  return `${sym}${major % 1 === 0 ? major.toFixed(0) : major.toFixed(2)}`;
}

export function CreditPurchaseModal({ open, onClose }: Props) {
  const creditPacks = useResumeStore((s) => s.creditPacks);
  const currency = useResumeStore((s) => s.creditPackCurrency);
  const paymentsDemoMode = useResumeStore((s) => s.paymentsDemoMode);
  const fetchCreditPacks = useResumeStore((s) => s.fetchCreditPacks);
  const purchasePack = useResumeStore((s) => s.purchasePack);

  const [busyPackId, setBusyPackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ added: number; balance: number } | null>(null);

  useEffect(() => {
    if (open && creditPacks === null) fetchCreditPacks();
  }, [open, creditPacks, fetchCreditPacks]);

  // Auto-close on success after a short pause.
  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => {
      setSuccess(null);
      onClose();
    }, 2000);
    return () => window.clearTimeout(t);
  }, [success, onClose]);

  if (!open) return null;

  const handleBuy = async (packId: string) => {
    setError(null);
    setBusyPackId(packId);
    const res = await purchasePack(packId);
    setBusyPackId(null);
    if (!res) {
      setError('Purchase failed. Try again.');
      return;
    }
    setSuccess(res);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-300 dark:border-zinc-700 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
              {paymentsDemoMode ? 'Demo Mode · No Real Charge' : 'Top Up'}
            </p>
            <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              Buy Credits
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-6 border border-emerald-300 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-center">
              <CheckCircle2 size={32} className="mx-auto mb-3" />
              <p className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                +{success.added} credits added
              </p>
              <p className="text-sm mt-1">New balance: {success.balance} credits</p>
            </div>
          )}

          {!success && creditPacks === null && (
            <div className="py-12 flex justify-center">
              <Loader2 size={28} className="animate-spin text-zinc-400" />
            </div>
          )}

          {!success && creditPacks !== null && creditPacks.length === 0 && (
            <p className="text-center text-zinc-500 py-8 font-serif italic">
              No packs available right now.
            </p>
          )}

          {!success && creditPacks !== null && creditPacks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {creditPacks.map((pack) => {
                const busy = busyPackId === pack.id;
                const disabled = busyPackId !== null;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => handleBuy(pack.id)}
                    disabled={disabled}
                    className={cn(
                      'group relative border p-5 text-left transition-colors flex flex-col gap-3',
                      'border-zinc-300 dark:border-zinc-700',
                      disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-zinc-900 dark:hover:border-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                        {pack.label}
                      </span>
                      {busy && <Loader2 size={14} className="animate-spin" />}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <Coins size={20} className="text-zinc-700 dark:text-zinc-300" />
                      <span className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                        {pack.credits ?? pack.credits_per_month}
                      </span>
                      <span className="text-xs text-zinc-500">credits</span>
                    </div>
                    <div>
                      <p className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                        {formatPrice(pack.prices?.[currency], currency)}
                      </p>
                      {pack.best_for && (
                        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mt-1">
                          {pack.best_for}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {paymentsDemoMode && !success && (
            <p className="mt-5 text-[11px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 text-center">
              ⚠ Demo mode — credits added instantly with no payment provider
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
