import React, { useEffect, useRef } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { Loader2 } from 'lucide-react';

/**
 * Shown after returning from a real payment provider redirect, while the
 * webhook fulfills server-side. Polls subscription + credits until the balance
 * or plan changes, then routes to success. Times out to failed after 60s.
 *
 * Demo mode never lands here — PricingPage fulfills instantly and routes
 * straight to payment_success.
 */
// Polling interval for balance-change detection (webhook safety net).
const POLL_MS = 2000;
// Generous timeout — covers slow networks + 3DS OTP flow + customer typing.
// Razorpay modal can legitimately stay open 3–5 min before user submits OTP.
const TIMEOUT_MS = 300000;  // 5 min

export function PaymentWaitingPage() {
  const { setCurrentPage, fetchCredits, fetchSubscription, fetchEntitlement, credits } = useResumeStore();
  const startBalance = useRef<number | null>(credits);
  const elapsed = useRef(0);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      if (!active) return;
      await Promise.all([fetchCredits(), fetchSubscription(), fetchEntitlement()]);
      if (!active) return;

      const now = useResumeStore.getState().credits;
      // Fulfillment detected: balance increased from when we started waiting.
      if (startBalance.current !== null && now !== null && now > startBalance.current) {
        setCurrentPage('payment_success');
        return;
      }

      elapsed.current += POLL_MS;
      if (elapsed.current >= TIMEOUT_MS) {
        setCurrentPage('payment_failed');
        return;
      }
      timer = window.setTimeout(poll, POLL_MS);
    };

    let timer = window.setTimeout(poll, POLL_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [fetchCredits, fetchSubscription, fetchEntitlement, setCurrentPage]);

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mb-8">
        <Loader2 size={40} className="text-zinc-500 animate-spin" />
      </div>

      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">
        Awaiting Confirmation
      </p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
        Confirming <span className="italic font-normal text-zinc-700 dark:text-zinc-300">payment</span>
      </h1>

      <p className="font-serif italic text-zinc-600 dark:text-zinc-400 max-w-md">
        Please don't close this window. We're waiting for secure confirmation from the payment provider.
      </p>

      <p className="mt-6 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        Razorpay · OTP · Signature verify
      </p>

      <button
        onClick={() => setCurrentPage('pricing')}
        className="mt-10 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors border border-zinc-300 dark:border-zinc-700 px-4 py-2"
      >
        Cancel and return
      </button>
      <p className="mt-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-600 max-w-xs">
        If you paid, credits land in your balance within ~30s — safe to cancel here.
      </p>
    </div>
  );
}
