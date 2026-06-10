import React from 'react';
import { useResumeStore, convertToBackend } from '../store/useResumeStore';
import { UploadSection } from '../components/UploadSection';
import { ResumePreview } from '../components/ResumePreview';
import { Download, Sparkles, Loader2, Plus, UploadCloud, LayoutDashboard, ArrowLeft, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProcessingScreen } from '../components/ProcessingScreen';
import { ResultsPage } from './ResultsPage';
import { ScoreGauge } from '../components/ScoreGauge';
import { fetchApi } from '../lib/api';

const LIVE_SCAN_DEBOUNCE_MS = 700;

function hasMeaningfulContent(data: any): boolean {
  if (!data) return false;
  const pi = data.personalInfo || {};
  if (pi.name?.trim() || pi.email?.trim()) return true;
  if (data.summary?.trim()) return true;
  if ((data.experience || []).some((e: any) => e.role || e.company || (e.bullets || []).some((b: string) => b?.trim()))) return true;
  if ((data.education || []).some((e: any) => e.degree || e.school)) return true;
  if ((data.projects || []).some((p: any) => p.title || (p.bullets || []).some((b: string) => b?.trim()))) return true;
  if ((data.skills || []).length > 0) return true;
  return false;
}

export function EditorPage() {
  const {
    resumeData,
    appState,
    startOptimization,
    jdText,
    setJdText,
    optimizationMode,
    setOptimizationMode,
    liveScore,
    liveScoring,
    setLiveScore,
    setLiveScoring,
    exportToPdf,
    saveJdText,
    createResume,
    goToUpload,
    setCurrentPage,
    resumes,
    currentResumeId,
  } = useResumeStore();
  const currentResume = resumes.find(r => r.id === currentResumeId);
  const backendSnapshot = currentResume?.backendSnapshot;
  const isLocked = !!currentResume?.locked;

  // Debounced live ATS scoring on every edit
  React.useEffect(() => {
    if (!resumeData) return;
    if (!hasMeaningfulContent(resumeData)) {
      setLiveScore(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLiveScoring(true);
      try {
        const data = await fetchApi('/optimize/score-only', {
          method: 'POST',
          body: JSON.stringify({
            resume_json: convertToBackend(resumeData, backendSnapshot),
            jd_text: jdText || '',
          }),
          signal: controller.signal,
        });
        const score =
          typeof data?.score === 'number'
            ? data.score
            : typeof data?.ats_score === 'number'
            ? data.ats_score
            : null;
        if (score !== null) setLiveScore(Math.round(score));
        
        // Save the JD text so it persists on page reload
        saveJdText(jdText);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          // Silent: live score is optional UX
        }
      } finally {
        setLiveScoring(false);
      }
    }, LIVE_SCAN_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, jdText]);

  if (appState === 'processing') return <ProcessingScreen />;
  if (appState === 'results') return <ResultsPage />;
  if (!resumeData) return <UploadSection />;

  const displayScore = liveScore ?? 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-6rem)] pt-4 pb-2 lg:pb-0">
      {/* Left side - Resume Preview */}
      <div className="flex-1 lg:w-3/4 flex flex-col min-h-0 relative min-h-[600px] lg:min-h-0 lg:h-full gap-3">
        <button
          onClick={() => goToUpload()}
          className="self-start inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-mono uppercase tracking-widest text-[10px] font-bold transition-colors pl-1"
        >
          <ArrowLeft size={12} strokeWidth={2.5} />
          Back to Upload
        </button>
        <div className="flex-1 min-h-0 relative">
          <ResumePreview />
        </div>
      </div>

      {/* Right side - Actions Panel */}
      <div className="w-full lg:w-1/4 flex flex-col gap-0 lg:h-full overflow-y-auto pr-1">
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 flex flex-col">
          {/* Navigation & File Actions */}
          <div className="p-5 border-b border-zinc-300 dark:border-zinc-700 space-y-2">
            <button
              onClick={() => setCurrentPage('resumes')}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-mono uppercase tracking-widest text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LayoutDashboard size={12} strokeWidth={2.5} />
              Resume Dashboard
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => createResume()}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-mono uppercase tracking-widest text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus size={12} strokeWidth={2.5} />
                New
              </button>
              <button
                onClick={() => goToUpload()}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-mono uppercase tracking-widest text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <UploadCloud size={12} strokeWidth={2.5} />
                Upload
              </button>
            </div>
          </div>

          {/* Live ATS Score */}
          <div className="p-5 border-b border-zinc-300 dark:border-zinc-700 flex flex-col items-center">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3 self-start">
              Live ATS Score
            </p>
            <ScoreGauge score={displayScore} size="sm" />
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {liveScoring ? (
                <>
                  <Loader2 size={10} className="animate-spin" />
                  <span>Scoring…</span>
                </>
              ) : liveScore === null ? (
                <span className="font-serif italic normal-case tracking-normal text-sm text-zinc-500">
                  Add content to score
                </span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                  <span>Live · updates as you type</span>
                </>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="p-5 border-b border-zinc-300 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                Job Description
              </p>
              {jdText.trim().length > 0 ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono uppercase tracking-[0.2em] font-bold"
                  title="JD mode active — optimization will tailor to this job description"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  JD Mode
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                  Generic Mode
                </span>
              )}
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste target job description here to tailor your resume..."
              className={cn(
                'w-full h-32 px-3 py-2.5 bg-white dark:bg-zinc-950 border font-serif text-sm focus:outline-none text-zinc-800 dark:text-zinc-100 placeholder:italic placeholder-zinc-400 dark:placeholder-zinc-600 resize-none transition-colors',
                jdText.trim().length > 0
                  ? 'border-emerald-500/50 focus:border-emerald-600 dark:focus:border-emerald-400'
                  : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100'
              )}
            />
            {jdText.trim().length > 0 && (
              <p className="mt-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                {jdText.trim().split(/\s+/).length} words · keywords will be extracted on optimize
              </p>
            )}
          </div>

          {/* Optimization Mode */}
          <div className="p-5 border-b border-zinc-300 dark:border-zinc-700">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">
              Optimization Mode
            </p>
            <div className="grid grid-cols-3 border border-zinc-300 dark:border-zinc-700">
              {(['quick', 'balanced', 'deep'] as const).map((mode, idx) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setOptimizationMode(mode)}
                  className={cn(
                    'py-2.5 text-[11px] font-mono uppercase tracking-widest font-bold transition-colors',
                    idx > 0 && 'border-l border-zinc-300 dark:border-zinc-700',
                    optimizationMode === mode
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 space-y-2">
            {isLocked && (
              <div className="mb-1 p-3 border border-amber-300 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-[11px] font-mono leading-relaxed flex items-start gap-2">
                <Lock size={13} className="shrink-0 mt-0.5" />
                <span>Read-only — over plan limit. Resubscribe or delete other resumes to edit.</span>
              </div>
            )}
            <button
              onClick={() => startOptimization()}
              disabled={isLocked}
              title={isLocked ? 'Resume locked — over plan limit' : undefined}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={13} strokeWidth={2.5} />
              Optimize Resume
            </button>

            <button
              onClick={() => exportToPdf()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-100 font-mono uppercase tracking-widest text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download size={13} strokeWidth={2.5} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
