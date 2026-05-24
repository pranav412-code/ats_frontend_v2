import React from 'react';
import { useResumeStore, convertToBackend } from '../store/useResumeStore';
import { UploadSection } from '../components/UploadSection';
import { ResumePreview } from '../components/ResumePreview';
import { Download, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProcessingScreen } from '../components/ProcessingScreen';
import { ResultsPage } from './ResultsPage';
import { ScoreGauge } from '../components/ScoreGauge';

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
  } = useResumeStore();

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
        const res = await fetch('http://localhost:8000/api/v1/optimize/score-only', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_json: convertToBackend(resumeData),
            jd_text: jdText || '',
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
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
      <div className="flex-1 lg:w-3/4 flex flex-col min-h-0 relative min-h-[600px] lg:min-h-0 lg:h-full">
        <ResumePreview />
      </div>

      {/* Right side - Actions Panel */}
      <div className="w-full lg:w-1/4 flex flex-col gap-0 lg:h-full overflow-y-auto pr-1">
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 flex flex-col">
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
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">
              Job Description
            </p>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste target job description here to tailor your resume..."
              className="w-full h-32 px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-800 dark:text-zinc-100 placeholder:italic placeholder-zinc-400 dark:placeholder-zinc-600 resize-none transition-colors"
            />
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
            <button
              onClick={() => startOptimization()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
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
