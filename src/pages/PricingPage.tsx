import React, { useEffect, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { fetchApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Check, Zap, Sparkles, Shield, Loader2, Clock, FolderOpen, Gauge } from 'lucide-react';
import { cn } from '../lib/utils';

const RZP_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

// Lazy-load Razorpay Checkout.js once.
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${RZP_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const s = document.createElement('script');
    s.src = RZP_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface Subscription {
  id: string;
  kind: string;
  billing_interval: string;
  commitment_months: number;
  credits_per_month: number;
  resume_slots: number;
  priority: boolean;
  prices: Record<string, number | null>;
  label: string;
  best_for: string;
  badge: string | null;
}

interface Refill {
  id: string;
  kind: string;
  credits: number;
  prices: Record<string, number | null>;
  label: string;
  best_for: string;
}

interface FreePlan {
  id: string;
  kind: string;
  credits: number;
  resume_slots: number;
  priority: boolean;
  label: string;
  best_for: string;
}

interface ModeCosts {
  quick: number;
  balanced: number;
  deep: number;
}

const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$' };

// Smallest-unit (paise/cents) → display string. null → "TBD".
function formatPrice(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return 'TBD';
  const sym = CURRENCY_SYMBOL[currency] || '';
  const major = amount / 100;
  return `${sym}${major % 1 === 0 ? major.toFixed(0) : major.toFixed(2)}`;
}

export function PricingPage() {
  const {
    setCurrentPage, fetchCredits, fetchEntitlement, fetchSubscription,
    subscription: currentSubscription,
  } = useResumeStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refills, setRefills] = useState<Refill[]>([]);
  const [freePlan, setFreePlan] = useState<FreePlan | null>(null);
  const [costs, setCosts] = useState<ModeCosts | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [allCurrencies, setAllCurrencies] = useState<string[]>(['USD']);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [packsRes, pricingRes] = await Promise.all([
          fetchApi('/credits/packs'),
          fetchApi('/credits/pricing'),
        ]);
        if (packsRes?.subscriptions) setSubscriptions(packsRes.subscriptions);
        if (packsRes?.refills) setRefills(packsRes.refills);
        if (packsRes?.free_plan) setFreePlan(packsRes.free_plan);
        if (packsRes?.currency) setCurrency(packsRes.currency);
        if (packsRes?.all_currencies) setAllCurrencies(packsRes.all_currencies);
        if (pricingRes) setCosts(pricingRes);
      } catch (err) {
        console.error('Failed to load pricing:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const switchCurrency = async (next: string) => {
    if (next === currency) return;
    setCurrency(next);
    try {
      await fetchApi('/credits/currency', {
        method: 'POST',
        body: JSON.stringify({ currency: next }),
      });
    } catch (err) {
      console.error('Failed to persist currency:', err);
    }
  };

  // Open Razorpay Checkout widget for an order, then verify on success.
  // Caller has already navigated to `payment_waiting` page — the modal floats
  // above the loader so the user sees a confirming-payment state from click
  // to terminal redirect (success/failure/dismiss).
  const openRazorpay = async (orderId: string, _packId: string) => {
    const ok = await loadRazorpay();
    if (!ok) throw new Error('Failed to load Razorpay');
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) throw new Error('Razorpay key not configured');

    const { data: { user } } = await supabase.auth.getUser();

    return new Promise<void>((resolve) => {
      const rzp = new (window as any).Razorpay({
        key: keyId,
        order_id: orderId,
        name: 'ResumeCraft',
        description: 'Plan purchase',
        prefill: { email: user?.email || '' },
        theme: { color: '#18181b' },
        handler: async (resp: any) => {
          // Payment captured — keep loader (we're on payment_waiting page)
          // while /verify confirms signature server-side. Only navigate on
          // verify result. Webhook + polling on PaymentWaitingPage are a
          // safety net if verify call itself drops.
          try {
            await fetchApi('/credits/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            });
            await Promise.all([fetchCredits(), fetchEntitlement(), fetchSubscription()]);
            setCurrentPage('payment_success');
          } catch (e) {
            console.error('Verify failed:', e);
            setCurrentPage('payment_failed');
          } finally {
            resolve();
          }
        },
        modal: {
          ondismiss: () => {
            // Modal dismissed — could mean:
            //   (a) user closed without ever entering bank flow → no payment
            //   (b) user paid on bank page then closed window before
            //       redirect back → Razorpay client never saw success but
            //       webhook will fire server-side
            // We CANNOT distinguish (a) from (b) client-side. Stay on the
            // PaymentWaitingPage — its polling will catch (b) via credit
            // balance change. For (a), polling times out at 5 min → failed
            // page. Trade-off: legit dismiss-no-pay user waits a bit before
            // seeing they're back to pricing, but no false-failure on (b).
            resolve();
          },
        },
      });
      rzp.on('payment.failed', () => {
        // Client-side failure event — bank declined or 3DS failed. BUT this
        // event also fires when user closes bank window mid-flow, when
        // payment may yet succeed server-side via async webhook. Don't
        // navigate to failed; let PaymentWaitingPage polling resolve the
        // true terminal state. False-positive failures here were the
        // primary bug: user sees "failed" while credits actually granted.
        resolve();
      });
      rzp.open();
    });
  };

  const handlePurchase = async (packId: string) => {
    setPurchasingId(packId);
    // Immediate loader — covers /checkout latency + Razorpay script load +
    // modal-open delay. Without this, user sees nothing for ~1-2s and may
    // click again.
    setCurrentPage('payment_waiting');
    try {
      // Start a checkout. Demo → instant fulfill. Razorpay → order + widget.
      const session = await fetchApi('/credits/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack_id: packId }),
      });

      if (session?.instant) {
        // Demo mode — fulfill instantly. Loader stays until balance reflects.
        await fetchApi('/credits/purchase', {
          method: 'POST',
          body: JSON.stringify({ pack_id: packId }),
        });
        await Promise.all([fetchCredits(), fetchEntitlement(), fetchSubscription()]);
        setCurrentPage('payment_success');
      } else if (session?.provider === 'razorpay' && session?.session_id) {
        await openRazorpay(session.session_id, packId);
        // openRazorpay handles all three terminal states:
        //   handler ✓     → payment_success / payment_failed
        //   ondismiss     → pricing
        //   payment.failed → payment_failed
      } else if (session?.checkout_url) {
        window.location.href = session.checkout_url;
      } else {
        throw new Error('No checkout session returned');
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      setCurrentPage('payment_failed');
    } finally {
      setPurchasingId(null);
    }
  };

  // Derived run counts for a credit bucket, given current mode costs.
  const runCounts = (credits: number) => {
    if (!costs) return null;
    return {
      quick: Math.floor(credits / costs.quick),
      balanced: Math.floor(credits / costs.balanced),
      deep: Math.floor(credits / costs.deep),
    };
  };

  const modeCards = costs
    ? [
        { key: 'quick', icon: <Zap size={18} />, label: 'Quick', cost: costs.quick, time: '~30 sec', desc: 'ATS fixes · keyword improvements', star: false },
        { key: 'balanced', icon: <Sparkles size={18} />, label: 'Balanced', cost: costs.balanced, time: '~1 min', desc: 'ATS + impact · JD alignment', star: true },
        { key: 'deep', icon: <Shield size={18} />, label: 'Deep', cost: costs.deep, time: '~2 min', desc: 'Multi-pass · strongest rewrite', star: false },
      ]
    : [];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">⟶ Plans & Pricing</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Pay for <span className="italic font-normal text-zinc-700 dark:text-zinc-300">outcomes</span>, not credits
        </h1>
        <p className="font-serif italic text-zinc-600 dark:text-zinc-400">
          Each optimization spends credits by depth. Subscribe for a monthly refill, or top up anytime.
        </p>
      </div>

      {/* Currency toggle */}
      {allCurrencies.length > 1 && (
        <div className="flex justify-center mb-12">
          <div className="inline-flex border border-zinc-300 dark:border-zinc-700">
            {allCurrencies.map((c) => (
              <button
                key={c}
                onClick={() => switchCurrency(c)}
                className={cn(
                  'px-4 py-2 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors',
                  c === currency
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                {CURRENCY_SYMBOL[c] || ''} {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      ) : (
        <>
          {/* What each run costs — modes */}
          {modeCards.length > 0 && (
            <div className="mb-16">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-5 text-center">
                What each run costs
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-zinc-300 dark:border-zinc-700">
                {modeCards.map((m) => (
                  <div
                    key={m.key}
                    className={cn(
                      'relative border-r border-b border-zinc-300 dark:border-zinc-700 p-6 bg-white/60 dark:bg-zinc-900/40',
                      m.star && 'bg-zinc-50 dark:bg-zinc-900'
                    )}
                  >
                    {m.star && (
                      <span className="absolute top-4 right-4 text-[9px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-bold">
                        ★ Recommended
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 mb-3">
                      {m.icon}
                      <span className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50">{m.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">{m.cost}</span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">credits</span>
                    </div>
                    <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400 mb-2">{m.desc}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      <Clock size={11} /> {m.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plans */}
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-5 text-center">
            Choose a plan
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-zinc-300 dark:border-zinc-700">
            {/* Free */}
            {freePlan && (
              <PlanCard
                label={freePlan.label}
                bestFor={freePlan.best_for}
                priceLine="Free"
                subLine="on signup"
                credits={freePlan.credits}
                creditsSuffix="credits, one-time"
                slots={freePlan.resume_slots}
                priority={freePlan.priority}
                runs={runCounts(freePlan.credits)}
                highlighted={false}
                cta={null}
              />
            )}

            {/* Subscriptions */}
            {subscriptions.map((plan) => {
              const highlighted = !!plan.badge;
              const price = plan.prices[currency] ?? null;
              const totalCredits = plan.credits_per_month * plan.commitment_months;
              const multi = plan.commitment_months > 1;
              const isCurrent = !!currentSubscription?.active && currentSubscription.pack_id === plan.id;
              return (
                <PlanCard
                  key={plan.id}
                  label={plan.label}
                  bestFor={plan.best_for}
                  priceLine={formatPrice(price, currency)}
                  subLine={multi ? `total · ${plan.commitment_months} months` : 'per month'}
                  credits={plan.credits_per_month}
                  creditsSuffix={
                    multi
                      ? `credits / month × ${plan.commitment_months} = ${totalCredits}`
                      : 'credits / month'
                  }
                  slots={plan.resume_slots}
                  priority={plan.priority}
                  runs={runCounts(plan.credits_per_month)}
                  highlighted={highlighted}
                  badge={isCurrent ? 'Current Plan' : (plan.badge || undefined)}
                  cta={
                    isCurrent ? (
                      <button
                        onClick={() => setCurrentPage('subscription')}
                        className="w-full py-3 flex items-center justify-center gap-2 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Manage Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(plan.id)}
                        disabled={purchasingId === plan.id}
                        className={cn(
                          'w-full py-3 flex items-center justify-center gap-2 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70',
                          highlighted
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                            : 'bg-white dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        )}
                      >
                        {purchasingId === plan.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Processing…
                          </>
                        ) : (
                          'Subscribe'
                        )}
                      </button>
                    )
                  }
                />
              );
            })}
          </div>

          {/* Refill packs */}
          {refills.length > 0 && (
            <div className="mt-16">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-2 text-center">
                Out of credits? Top up
              </p>
              <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
                One-time refills · no subscription · credits never expire
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 max-w-2xl mx-auto border-t border-l border-zinc-300 dark:border-zinc-700">
                {refills.map((pack) => {
                  const price = pack.prices[currency] ?? null;
                  const counts = runCounts(pack.credits);
                  return (
                    <div
                      key={pack.id}
                      className="border-r border-b border-zinc-300 dark:border-zinc-700 p-6 bg-white/60 dark:bg-zinc-900/40 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50">{pack.label}</h3>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{pack.best_for}</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">{pack.credits}</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">credits</span>
                      </div>
                      {counts && (
                        <p className="font-mono text-[11px] text-zinc-500 mb-4">
                          {counts.quick} Quick · {counts.balanced} Balanced · {counts.deep} Deep
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3">
                        <span className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                          {formatPrice(price, currency)}
                        </span>
                        <button
                          onClick={() => handlePurchase(pack.id)}
                          disabled={purchasingId === pack.id}
                          className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70 inline-flex items-center gap-2"
                        >
                          {purchasingId === pack.id ? <Loader2 size={13} className="animate-spin" /> : null}
                          Buy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-center text-[10px] font-mono uppercase tracking-widest text-zinc-400 mt-10">
            Credits stack across months · never expire
          </p>
        </>
      )}
    </div>
  );
}

interface PlanCardProps {
  label: string;
  bestFor: string;
  priceLine: string;
  subLine: string;
  credits: number;
  creditsSuffix: string;
  slots: number;
  priority: boolean;
  runs: { quick: number; balanced: number; deep: number } | null;
  highlighted: boolean;
  badge?: string;
  cta: React.ReactNode;
}

function PlanCard({ label, bestFor, priceLine, subLine, credits, creditsSuffix, slots, priority, runs, highlighted, badge, cta }: PlanCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col border-r border-b border-zinc-300 dark:border-zinc-700 p-8',
        highlighted ? 'bg-zinc-50 dark:bg-zinc-900' : 'bg-white/60 dark:bg-zinc-900/40'
      )}
    >
      {badge && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-[9px] font-mono uppercase tracking-widest px-3 py-1 font-bold whitespace-nowrap">
          ⭐ {badge}
        </span>
      )}

      <h3 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">{label}</h3>
      <p className="font-serif italic text-sm text-zinc-500 dark:text-zinc-400 mb-5">{bestFor}</p>

      <div className="mb-5 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-4xl font-bold text-zinc-900 dark:text-zinc-50">{priceLine}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{subLine}</span>
        </div>
      </div>

      <div className="flex-1">
        <ul className="space-y-3 mb-6 text-sm">
          <li className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
            <Check size={15} className="text-zinc-500 mt-0.5 shrink-0" />
            <span><strong>{credits}</strong> {creditsSuffix}</span>
          </li>
          {runs && (
            <li className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] leading-relaxed">
              <Check size={15} className="text-zinc-500 mt-0.5 shrink-0" />
              <span>{runs.quick} Quick · {runs.balanced} Balanced · {runs.deep} Deep / mo</span>
            </li>
          )}
          <li className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
            <FolderOpen size={15} className="text-zinc-500 mt-0.5 shrink-0" />
            <span><strong>{slots}</strong> resume slots</span>
          </li>
          <li className={cn('flex items-start gap-2', priority ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600')}>
            <Gauge size={15} className="mt-0.5 shrink-0" />
            <span>{priority ? 'Priority processing' : 'Standard processing'}</span>
          </li>
        </ul>
      </div>

      {cta}
    </div>
  );
}
