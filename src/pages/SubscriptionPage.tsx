import React, { useEffect, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { fetchApi } from '../lib/api';
import {
  Loader2, ArrowLeft, CreditCard, FolderOpen, Gauge, Calendar,
  AlertCircle, CheckCircle2, XCircle, RotateCcw, Sparkles, Clock,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SubHistoryRow {
  id: string;
  label: string;
  status: string;
  currency: string;
  price_paid: number;
  commitment_months: number;
  months_elapsed: number;
  commitment_end: string;
  created_at: string;
}

const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$' };

function fmtPrice(amount?: number, currency?: string): string {
  if (amount === undefined || amount === null) return '—';
  const sym = CURRENCY_SYMBOL[currency || ''] || '';
  const major = amount / 100;
  return `${sym}${major % 1 === 0 ? major.toFixed(0) : major.toFixed(2)}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function SubscriptionPage() {
  const { subscription, fetchSubscription, cancelSubscription, setCurrentPage } = useResumeStore();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [history, setHistory] = useState<SubHistoryRow[]>([]);

  useEffect(() => {
    fetchSubscription();
    fetchApi('/credits/subscriptions')
      .then((d) => setHistory(d?.subscriptions || []))
      .catch((e) => console.error('Failed to load subscription history', e));
  }, [fetchSubscription]);

  const sub = subscription;
  const hasPlan = !!sub && sub.active;
  const willCancel = !!sub?.cancel_at_period_end;

  const handleCancel = async (cancel: boolean) => {
    setBusy(true);
    setMessage(null);
    try {
      await cancelSubscription(cancel);
      setMessage({
        text: cancel
          ? 'Auto-renewal turned off. Access continues until your contract ends.'
          : 'Subscription resumed. Auto-renewal is back on.',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err?.message || 'Action failed.', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12">
      <button
        onClick={() => setCurrentPage('home')}
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
      >
        <ArrowLeft size={12} /> Back to Dashboard
      </button>

      <div className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mb-3">
          Account Settings
        </p>
        <h1 className="font-serif text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-3">
          <CreditCard size={30} className="text-zinc-700 dark:text-zinc-300" />
          Subscription
        </h1>
        <p className="font-serif italic text-zinc-600 dark:text-zinc-400 mt-2">
          Manage your plan, renewal, and credits.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            'mb-8 p-3 border text-sm flex items-start gap-2',
            message.type === 'success'
              ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'border-rose-300 bg-rose-50/50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400'
          )}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {!sub ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-zinc-400" size={28} />
        </div>
      ) : !hasPlan ? (
        // Free / no active plan
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-8 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Current Plan</p>
          <h2 className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Free <span className="italic font-normal text-zinc-600 dark:text-zinc-400">plan</span>
          </h2>
          <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            {sub.status === 'expired' ? 'Your previous plan has ended.' : 'No active subscription.'} Upgrade for more credits and resume slots.
          </p>
          <button
            onClick={() => setCurrentPage('pricing')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
          >
            <Sparkles size={14} /> View Plans
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Plan card */}
          <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Current Plan</p>
                <h2 className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50">{sub.label}</h2>
                <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {fmtPrice(sub.price_paid, sub.currency)} · {sub.commitment_months}-month commitment
                </p>
              </div>
              <span className={cn(
                'text-[10px] font-mono uppercase tracking-widest font-bold px-3 py-1 border',
                willCancel
                  ? 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                  : 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
              )}>
                {willCancel ? 'Ending' : 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <Stat icon={<CreditCard size={14} />} label="Credits / month" value={`${sub.credits_per_month}`} />
              <Stat icon={<FolderOpen size={14} />} label="Resume slots" value={`${sub.resume_slots}`} />
              <Stat icon={<Gauge size={14} />} label="Processing" value={sub.priority ? 'Priority' : 'Standard'} />
              <Stat icon={<Calendar size={14} />} label="Next credit drop" value={fmtDate(sub.current_period_end)} />
              <Stat icon={<Calendar size={14} />} label="Contract ends" value={fmtDate(sub.commitment_end)} />
              <Stat icon={<RotateCcw size={14} />} label="Months" value={`${sub.months_elapsed} / ${sub.commitment_months}`} />
            </div>
          </div>

          {/* Cancel / resume */}
          <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-6 sm:p-8">
            {willCancel ? (
              <>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-bold mb-3 flex items-center gap-2">
                  <RotateCcw size={14} /> Renewal Off
                </h3>
                <p className="font-serif text-sm text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                  Auto-renewal is off. You keep full access and credits until{' '}
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">{fmtDate(sub.commitment_end)}</span>, then revert to Free.
                </p>
                <button
                  onClick={() => handleCancel(false)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  Resume Subscription
                </button>
              </>
            ) : (
              <>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-bold mb-3 flex items-center gap-2">
                  <XCircle size={14} /> Cancel Subscription
                </h3>
                <p className="font-serif text-sm text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                  Turn off auto-renewal. You keep credits and slots until your contract ends — nothing is lost immediately.
                </p>
                <button
                  onClick={() => handleCancel(true)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Cancel Auto-Renewal
                </button>
              </>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrentPage('pricing')}
              className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Change plan →
            </button>
          </div>
        </div>
      )}

      {/* Subscription history */}
      {history.length > 0 && (
        <div className="mt-12">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-5 flex items-center gap-2">
            <Clock size={13} /> Subscription History
          </h3>
          <div className="border border-zinc-300 dark:border-zinc-700 divide-y divide-zinc-300 dark:divide-zinc-700">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-50">{h.label}</span>
                    <span className={cn(
                      'text-[9px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 border',
                      h.status === 'active'
                        ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                        : 'border-zinc-300 text-zinc-500 dark:border-zinc-700'
                    )}>
                      {h.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1">
                    {fmtDate(h.created_at)} · month {h.months_elapsed}/{h.commitment_months}
                  </p>
                </div>
                <span className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-50 tabular-nums shrink-0">
                  {fmtPrice(h.price_paid, h.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
