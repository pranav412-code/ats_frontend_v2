import React, { useEffect, useReducer, useRef, useState } from 'react';
import { useResumeStore, convertToBackend, convertToFrontend } from '../store/useResumeStore';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  initialViewState,
  reduceView,
  type ViewState,
  type SseEvent,
  STAGE_LABELS,
  visibleStages,
} from '../lib/optimizationPhase';
import { ScoreRing } from './optimization/ScoreRing';
import { StageStepper } from './optimization/StageStepper';
import { StageCard } from './optimization/StageCard';
import { ReassurancePhrase } from './optimization/ReassurancePhrase';
import { ElapsedPill } from './optimization/ElapsedPill';
import { DetailsDrawer } from './optimization/DetailsDrawer';
import { CancelConfirmModal } from './optimization/CancelConfirmModal';

const TARGET_SCORE = 85;

function viewReducer(state: ViewState, event: SseEvent): ViewState {
  return reduceView(state, event);
}

export function ProcessingScreen() {
  const {
    resumeData,
    completeOptimization,
    currentResumeId,
    jdText,
    optimizationMode,
    setAppState,
    recordIterationStep,
    resumes,
    setCredits,
    pushToast,
  } = useResumeStore();
  const backendSnapshot = resumes.find(r => r.id === currentResumeId)?.backendSnapshot;

  const mode = (optimizationMode as 'quick' | 'balanced' | 'deep') || 'balanced';
  const [view, dispatch] = useReducer(viewReducer, mode, initialViewState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount + new currentResumeId.
  useEffect(() => {
    if (!resumeData) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || 'local';

        const payload = {
          token,
          resume_json: convertToBackend(resumeData, backendSnapshot),
          resume_id: currentResumeId,
          jd_text: jdText || '',
          target_score: TARGET_SCORE,
          max_iterations: mode === 'quick' ? 1 : mode === 'deep' ? 3 : 2,
          mode,
        };
        const res = await fetch('http://localhost:8001/api/v1/optimize/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        let completePayload: any = null;
        const startedAt = Date.now();

        // Capture per-iteration deltas from log strings as fallback when
        // the (planned) `iteration_complete` SSE event isn't emitted.
        const iterRegex = /Score improved:\s*(\d+)\s*[→\-]>?\s*(\d+)\s*\(\+(\d+)\)/i;
        let lastIterFromLog = 0;
        let lastScoreFromLog: number | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf('\n\n')) !== -1) {
            const rawEvent = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            for (const line of rawEvent.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6)) as any;
                  dispatch(parsed);
                  if (parsed.type === 'complete') {
                    parsed._startedAt = startedAt;
                    completePayload = parsed;
                  } else if (parsed.type === 'credits_update') {
                    // Backend deducts at start + may refund on no-improvement
                    // or already-at-target. Reflect every push to the store so
                    // the navbar credit indicator updates in real time.
                    if (typeof parsed.balance === 'number') setCredits(parsed.balance);
                  } else if (parsed.type === 'error' && typeof parsed.message === 'string') {
                    // Concurrency-cap / busy / per-user-limit errors → toast.
                    const msg: string = parsed.message;
                    if (
                      msg.includes('Server busy') ||
                      msg.includes('already have an optimization') ||
                      msg.includes('Insufficient credits')
                    ) {
                      pushToast({
                        kind: 'error',
                        title: 'Cannot start optimization',
                        message: msg,
                        duration: 7000,
                      });
                    }
                  } else if (parsed.type === 'refund') {
                    // Explicit refund event (no-improvements, save-fail,
                    // server-error, scoring-timeout, already-at-target,
                    // user-cancelled). Show user-visible toast so they know
                    // credits returned + why.
                    const amt = typeof parsed.amount === 'number' ? parsed.amount : 0;
                    const reason = parsed.reason || 'Optimization issue';
                    pushToast({
                      kind: 'refund',
                      title: `${amt} credit${amt === 1 ? '' : 's'} refunded`,
                      message: reason,
                      duration: 8000,
                    });
                  } else if (parsed.type === 'iteration_complete') {
                    recordIterationStep({
                      iteration: parsed.iteration,
                      scoreBefore: parsed.score_before,
                      scoreAfter: parsed.score_after,
                      delta: parsed.delta,
                    });
                  } else if (parsed.type === 'log' && typeof parsed.message === 'string') {
                    const m = parsed.message.match(iterRegex);
                    if (m) {
                      const before = parseInt(m[1], 10);
                      const after = parseInt(m[2], 10);
                      const delta = parseInt(m[3], 10);
                      lastIterFromLog += 1;
                      recordIterationStep({
                        iteration: parsed.iteration ?? lastIterFromLog,
                        scoreBefore: before,
                        scoreAfter: after,
                        delta,
                      });
                      lastScoreFromLog = after;
                    }
                  }
                } catch {
                  /* malformed */
                }
              }
            }
          }
        }

        if (completePayload) {
          // Small delay so user sees the success transition before navigation.
          setTimeout(() => {
            const frontendData = convertToFrontend(completePayload.optimized_resume);
            completeOptimization(frontendData, completePayload);
          }, 900);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        dispatch({ type: 'error', message: err.message || 'Stream error' });
      }
    };

    run();

    return () => {
      controller.abort();
      if (abortRef.current === controller) abortRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentResumeId]);

  const requestCancel = () => setConfirmOpen(true);
  const performCancel = () => {
    abortRef.current?.abort();
    setConfirmOpen(false);
    setAppState('idle');
  };

  const stages = visibleStages(mode);
  const isComplete = view.phase === 'complete';
  let effectivePhase: 'prepare' | 'strengthen' | 'polish';
  if (view.phase === 'complete') effectivePhase = 'polish';
  else if (view.phase === 'error') effectivePhase = 'prepare';
  else effectivePhase = view.phase;
  const headlineStage = STAGE_LABELS[effectivePhase] || 'Preparing';
  const currentStepIdx = Math.max(1, stages.indexOf(effectivePhase) + 1);

  return (
    <div className="w-full bg-[#F5F1E8] dark:bg-[#1A1814] border border-zinc-900/15 dark:border-zinc-100/15 px-6 lg:px-10 py-8 sm:py-10 mt-6 relative">
      {/* Masthead */}
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700 dark:text-zinc-400 pb-3 border-b border-zinc-900/30 dark:border-zinc-100/20">
        <span>Vol. 01 · Optimization in progress</span>
        <ElapsedPill startedAt={view.startedAt} />
      </div>

      <div className="relative">
        {/* Header row: title + cancel */}
        <div className="flex items-start justify-between gap-4 pt-6 pb-5 border-b border-zinc-900/20 dark:border-zinc-100/15">
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-500 mb-2">
              {isComplete ? 'Finished' : `Step ${Math.min(stages.length, currentStepIdx)} of ${stages.length}`}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-[1.05]">
              {isComplete ? (
                <>Your resume,<span className="italic font-normal text-zinc-700 dark:text-zinc-300"> ready.</span></>
              ) : (
                <>{headlineStage}<span className="italic font-normal text-zinc-700 dark:text-zinc-300"> in motion.</span></>
              )}
            </h2>
            <div className="mt-3">
              <ReassurancePhrase phase={view.phase} />
            </div>
          </div>
          <button
            onClick={requestCancel}
            aria-label="Cancel optimization"
            className="shrink-0 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 underline-offset-4 hover:underline transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Score + stage card */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center my-7">
          <div className="flex items-center justify-center md:justify-start">
            <ScoreRing
              score={view.bestScore}
              initial={view.initialScore}
              burstAt={view.burstAt}
            />
          </div>
          <div className="w-full">
            <StageCard phase={view.phase} />
          </div>
        </div>

        {/* Stage stepper */}
        <StageStepper phase={view.phase} mode={mode} />

        {/* Tier-2 drawer */}
        <DetailsDrawer logs={view.rawLogs} />

        {/* Error banner */}
        {view.phase === 'error' && (
          <div className="w-full mt-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                Something went wrong
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                {view.errorMessage || 'Optimization could not complete. Your original resume is safe.'}
              </p>
              <button
                onClick={() => setAppState('idle')}
                className="mt-3 inline-flex items-center text-xs font-semibold text-rose-800 dark:text-rose-300 hover:underline gap-1"
              >
                <ArrowLeft size={12} />
                Return to Editor
              </button>
            </div>
          </div>
        )}
      </div>

      <CancelConfirmModal
        open={confirmOpen}
        onConfirm={performCancel}
        onDismiss={() => setConfirmOpen(false)}
      />
    </div>
  );
}
