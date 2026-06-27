import React, { useEffect } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { useAuthStore } from '../store/useAuthStore';
import { resolvePlanDisplay } from '../lib/planDisplay';
import {
  FileText, Files, History, ArrowRight, Plus, UploadCloud,
  Coins, FolderOpen, BarChart3, Sparkles, CreditCard, Lock,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function HomePage() {
  const {
    setCurrentPage, resumes, history, credits, entitlement, subscription, creditPacks,
    createResume, goToUpload, openResume, fetchSubscription,
  } = useResumeStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const plan = resolvePlanDisplay(subscription, entitlement, creditPacks);

  const firstName =
    (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there')
      .toString()
      .split(' ')[0];

  const scored = resumes.filter((r) => typeof r.latestScore === 'number');
  const bestScore = scored.length ? Math.max(...scored.map((r) => r.latestScore || 0)) : null;
  const recent = [...resumes].sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 3);

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });

  const stats = [
    { icon: <Coins size={16} />, label: 'Credits', value: credits ?? '—' },
    {
      icon: <FolderOpen size={16} />,
      label: 'Resume Slots',
      value: entitlement ? `${entitlement.slots_used}/${entitlement.slot_limit}` : '—',
    },
    { icon: <Files size={16} />, label: 'Resumes', value: resumes.length },
    { icon: <BarChart3 size={16} />, label: 'Best Score', value: bestScore !== null ? bestScore : '—' },
    { icon: <History size={16} />, label: 'Optimizations', value: history.length },
  ];

  const actions = [
    { label: 'New Resume', icon: <Plus size={18} />, onClick: () => createResume(), primary: true },
    { label: 'Upload', icon: <UploadCloud size={18} />, onClick: () => goToUpload() },
    { label: 'Editor', icon: <FileText size={18} />, onClick: () => setCurrentPage('editor') },
    { label: 'History', icon: <History size={18} />, onClick: () => setCurrentPage('history') },
  ];

  return (
    <div className="w-full px-6 lg:px-10 pt-6 pb-16 max-w-6xl mx-auto">
      {/* Masthead */}
      <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3 mb-8 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
        <span>Issue 01 · ResumeCraft</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Section · Dashboard</span>
      </div>

      {/* Greeting */}
      <div className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500 mb-3">Welcome back</p>
        <h1 className="font-serif text-5xl sm:text-6xl font-bold text-zinc-900 dark:text-zinc-50 leading-[0.95] tracking-tight">
          Hello, <span className="italic font-normal text-zinc-700 dark:text-zinc-300">{firstName}.</span>
        </h1>
        <p className="font-serif italic text-base text-zinc-600 dark:text-zinc-400 mt-3 max-w-xl">
          Your workspace at a glance — credits, slots, and recent drafts.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-zinc-300 dark:border-zinc-700 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="border-r border-b border-zinc-300 dark:border-zinc-700 p-5 bg-white/40 dark:bg-zinc-900/30">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
              {s.icon} {s.label}
            </p>
            <p className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-4 font-mono uppercase tracking-widest text-[11px] font-bold border transition-colors',
              a.primary
                ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-zinc-900 dark:hover:border-zinc-100'
            )}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Plan banner */}
      <div className="mb-12 border border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-zinc-50 dark:text-zinc-900" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Current Plan</p>
            <h3 className={cn(
              'font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50',
              plan.loading && 'animate-pulse text-zinc-400 dark:text-zinc-600'
            )}>
              {plan.label}
            </h3>
            <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400">
              {plan.loading ? 'Loading plan…' : plan.details}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage(plan.isPaid ? 'subscription' : 'pricing')}
          disabled={plan.loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors shrink-0 disabled:opacity-50"
        >
          {plan.isPaid ? 'Manage' : <><Sparkles size={14} /> Upgrade</>}
        </button>
      </div>

      {/* Recent resumes */}
      <div>
        <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3 mb-6">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">⟶ Recent Resumes</h2>
          <button
            onClick={() => setCurrentPage('resumes')}
            className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 transition-colors"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="border border-dashed border-zinc-400 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/30 p-10 text-center">
            <Files size={28} strokeWidth={1.5} className="text-zinc-700 dark:text-zinc-300 mx-auto mb-3" />
            <p className="font-serif italic text-zinc-600 dark:text-zinc-400 mb-5">No resumes yet. Start your first draft.</p>
            <button
              onClick={() => createResume()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
            >
              <Plus size={13} /> Create New
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-zinc-300 dark:border-zinc-700">
            {recent.map((r) => (
              <button
                key={r.id}
                onClick={() => openResume(r.id)}
                className={cn(
                  'group text-left border-r border-b border-zinc-300 dark:border-zinc-700 p-6 transition-colors',
                  r.locked
                    ? 'bg-zinc-100/60 dark:bg-zinc-950/40'
                    : 'bg-white/40 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                )}
              >
                <div className="flex items-center justify-between mb-4 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                  <span className="flex items-center gap-1.5"><FileText size={11} /> Draft</span>
                  {r.locked
                    ? <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400"><Lock size={11} /> Locked</span>
                    : typeof r.latestScore === 'number' && <span className="text-zinc-900 dark:text-zinc-100 font-bold">{r.latestScore}</span>}
                </div>
                <h3 className={cn(
                  'font-serif text-xl font-bold mb-1 leading-tight line-clamp-2',
                  r.locked ? 'text-zinc-500' : 'text-zinc-900 dark:text-zinc-50 group-hover:italic'
                )}>
                  {r.title}
                </h3>
                <p className="font-serif italic text-xs text-zinc-500">
                  Updated {new Date(r.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
