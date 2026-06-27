import React, { useEffect, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { ArrowRight, ArrowLeft, Download, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react';

import { VerdictBanner } from '../components/results/VerdictBanner';
import { ScoreStory } from '../components/results/ScoreStory';
import { BucketBreakdown } from '../components/results/BucketBreakdown';
import { FullBreakdownPanel } from '../components/results/FullBreakdownPanel';
import { BulletDiffViewer } from '../components/results/BulletDiffViewer';
import { StrengthCard } from '../components/results/StrengthCard';
import { WeaknessCard } from '../components/results/WeaknessCard';
import { KeywordCoverage } from '../components/results/KeywordCoverage';
import { IterationTrail } from '../components/results/IterationTrail';

export function ResultsPage() {
  const {
    optimizationResult,
    resumeData,
    preOptimizationSnapshot,
    iterationTrail,
    setAppState,
    setCurrentPage,
    exportToPdf,
    refreshFinalScore,
  } = useResumeStore();

  // Re-score on mount + when resume content changes (debounced) so the
  // results-page number stays in sync with edits made in the editor.
  useEffect(() => {
    refreshFinalScore();
  }, [refreshFinalScore]);

  useEffect(() => {
    if (!resumeData) return;
    const t = setTimeout(() => refreshFinalScore(), 800);
    return () => clearTimeout(t);
  }, [resumeData, refreshFinalScore]);

  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);

  if (!optimizationResult || !resumeData) return null;

  const {
    initialScore,
    finalScore,
    breakdown,
    beforeBreakdown,
    missingKeywords,
    strengths,
    weaknesses,
    startedAt,
    completedAt,
    targetRole,
  } = optimizationResult;

  const delta = finalScore - initialScore;
  const durationMs = (completedAt && startedAt) ? completedAt - startedAt : 0;
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });

  const strengthsToShow = showAllStrengths ? strengths : strengths.slice(0, 3);
  const weaknessesToShow = showAllWeaknesses ? weaknesses : weaknesses.slice(0, 3);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-sm:overflow-x-hidden">
      {/* Masthead */}
      <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3 mb-8 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 max-sm:tracking-[0.2em]">
        <span>Issue 01 · ResumeCraft</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Section · Report</span>
      </div>

      {/* Verdict */}
      <VerdictBanner
        delta={delta}
        strengthsCount={strengths.length}
        durationMs={durationMs}
        targetRole={targetRole}
      />

      {/* Score Story + Bucket Breakdown */}
      <section className="border border-zinc-300 dark:border-zinc-700 p-4 sm:p-8 mb-10">
        <ScoreStory before={initialScore} after={finalScore} />

        {/* Mobile: download right after score — no need to scroll to page bottom */}
        <button
          type="button"
          onClick={() => exportToPdf()}
          className="sm:hidden w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-100 font-mono uppercase tracking-widest text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Download size={14} strokeWidth={2.5} />
          Download PDF
        </button>

        <BucketBreakdown afterBreakdown={breakdown} beforeBreakdown={beforeBreakdown} />
        <FullBreakdownPanel afterBreakdown={breakdown} beforeBreakdown={beforeBreakdown} />
      </section>

      {/* What changed — bullet diff */}
      <BulletDiffViewer before={preOptimizationSnapshot} after={resumeData} />

      {/* Strengths + Next steps */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400 mb-4">
            <CheckCircle2 size={12} />
            What's Working
          </div>
          {strengthsToShow.length === 0 ? (
            <p className="font-serif italic text-sm text-zinc-500">No major strengths flagged.</p>
          ) : (
            <div className="space-y-3">
              {strengthsToShow.map((s, i) => (
                <StrengthCard key={i} raw={s} index={i} />
              ))}
            </div>
          )}
          {strengths.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllStrengths((v) => !v)}
              className="mt-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors"
            >
              {showAllStrengths ? 'Show fewer' : `Show all ${strengths.length}`}
            </button>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400 mb-4">
            <XCircle size={12} />
            Next Steps
          </div>
          {weaknessesToShow.length === 0 ? (
            <p className="font-serif italic text-sm text-emerald-700 dark:text-emerald-400">
              Looking great — nothing major.
            </p>
          ) : (
            <div className="space-y-3">
              {weaknessesToShow.map((w, i) => (
                <WeaknessCard key={i} raw={w} index={i} />
              ))}
            </div>
          )}
          {weaknesses.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllWeaknesses((v) => !v)}
              className="mt-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors"
            >
              {showAllWeaknesses ? 'Show fewer' : `Show all ${weaknesses.length}`}
            </button>
          )}
        </div>
      </section>

      {/* Keyword coverage */}
      <KeywordCoverage resume={resumeData} missing={missingKeywords} />

      {/* Iteration trail (toggle) */}
      <IterationTrail steps={iterationTrail} initialScore={initialScore} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-12">
        <button
          onClick={() => setAppState('idle')}
          className="max-sm:w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-xs font-bold transition-colors"
        >
          Review & Edit
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => exportToPdf()}
          className="max-sm:w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-100 font-mono uppercase tracking-widest text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Download size={14} />
          Download PDF
        </button>
        <button
          onClick={() => {
            setAppState('idle');
            setCurrentPage('resumes');
          }}
          className="max-sm:w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors"
        >
          <LayoutGrid size={12} />
          All Resumes
        </button>
      </div>
    </div>
  );
}
