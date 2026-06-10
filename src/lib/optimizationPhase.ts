/**
 * Optimization view-state reducer.
 *
 * Translates raw SSE events from /api/v1/optimize/stream into a
 * sanitized, user-friendly view. Strips all internal jargon,
 * regression noise, and provider chatter. Tier-2 details drawer
 * can still surface rawLogs unchanged.
 */

export type UserPhase = 'prepare' | 'strengthen' | 'polish' | 'complete' | 'error';

export type SseEvent =
  | { type: 'init'; message?: string; score?: number; initial_score?: number; breakdown?: any; category?: string }
  | { type: 'log'; message: string; score?: number; iteration?: number }
  | { type: 'complete'; message?: string; final_score?: number; initial_score?: number; optimized_resume?: any; breakdown?: any; missing_keywords?: string[]; strengths?: string[]; weaknesses?: string[]; category?: string }
  | { type: 'credits_update'; balance?: number }
  | { type: 'error'; message: string };

export interface RawLogEntry {
  ts: number;
  msg: string;
  raw: SseEvent;
}

export interface ViewState {
  phase: UserPhase;
  bestScore: number | null;
  initialScore: number | null;
  scoreDelta: number;       // best - initial
  lastBurstDelta: number;   // last gain that triggered burst (>=8)
  burstAt: number | null;   // timestamp of last burst (for confetti trigger)
  errorMessage: string | null;
  startedAt: number;
  mode: 'quick' | 'balanced' | 'deep';
  rawLogs: RawLogEntry[];   // for tier-2 drawer
  iterationCount: number;   // private, for stage detection
}

export function initialViewState(mode: 'quick' | 'balanced' | 'deep'): ViewState {
  return {
    phase: 'prepare',
    bestScore: null,
    initialScore: null,
    scoreDelta: 0,
    lastBurstDelta: 0,
    burstAt: null,
    errorMessage: null,
    startedAt: Date.now(),
    mode,
    rawLogs: [],
    iterationCount: 0,
  };
}

const BURST_THRESHOLD = 8;

function detectStage(msg: string, currentPhase: UserPhase, iterCount: number, mode: ViewState['mode']): UserPhase {
  const m = msg.toLowerCase();
  // JD / initial eval → still Prepare
  if (m.includes('extracting') || m.includes('initial ats') || m.includes('preparing')) {
    return 'prepare';
  }
  // First "sending prompt" → enter Strengthen
  if (m.includes('sending prompt') || m.includes('thinking')) {
    // Quick mode: only 2 visible steps (Prepare → Strengthen). Stay Strengthen.
    if (mode === 'quick') return 'strengthen';
    // Balanced (2 iters): final iter = Polish
    if (mode === 'balanced' && iterCount >= 2) return 'polish';
    // Deep (3 iters): final iter = Polish
    if (mode === 'deep' && iterCount >= 3) return 'polish';
    return 'strengthen';
  }
  if (m.includes('post-processor') || m.includes('weaving') || m.includes('aligning')) {
    return currentPhase === 'polish' ? 'polish' : 'strengthen';
  }
  if (m.includes('🎯') || m.includes('target') && m.includes('reach')) {
    return 'polish';
  }
  return currentPhase;
}

// Extract iteration number from log like "─── Iteration 2/3: ..."
function parseIterationNumber(msg: string): number | null {
  const m = msg.match(/iteration\s+(\d+)\s*\/\s*\d+/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function reduceView(state: ViewState, event: SseEvent): ViewState {
  // Always record raw event for tier-2 drawer
  const rawLogs = [
    ...state.rawLogs,
    { ts: Date.now(), msg: 'message' in event ? (event as any).message || event.type : event.type, raw: event },
  ];

  switch (event.type) {
    case 'init': {
      const s = event.score ?? event.initial_score ?? null;
      return {
        ...state,
        rawLogs,
        phase: 'prepare',
        initialScore: state.initialScore ?? s,
        bestScore: state.bestScore !== null ? Math.max(state.bestScore, s ?? 0) : s,
        scoreDelta: state.bestScore !== null && state.initialScore !== null ? state.bestScore - state.initialScore : 0,
      };
    }

    case 'log': {
      const msg = event.message || '';
      const iterN = parseIterationNumber(msg);
      const iterationCount = iterN !== null ? Math.max(state.iterationCount, iterN) : state.iterationCount;
      const newPhase = detectStage(msg, state.phase, iterationCount, state.mode);

      // Score updates from log events — only accept upward moves.
      let bestScore = state.bestScore;
      let lastBurstDelta = state.lastBurstDelta;
      let burstAt = state.burstAt;

      if (event.score !== undefined && event.score !== null) {
        const prev = bestScore ?? 0;
        if (event.score > prev) {
          const gain = event.score - prev;
          bestScore = event.score;
          if (gain >= BURST_THRESHOLD) {
            lastBurstDelta = gain;
            burstAt = Date.now();
          }
        }
      }

      const scoreDelta = bestScore !== null && state.initialScore !== null ? bestScore - state.initialScore : 0;

      return {
        ...state,
        rawLogs,
        phase: newPhase,
        bestScore,
        iterationCount,
        scoreDelta,
        lastBurstDelta,
        burstAt,
      };
    }

    case 'complete': {
      const s = event.final_score ?? state.bestScore ?? 0;
      const init = event.initial_score ?? state.initialScore ?? s;
      return {
        ...state,
        rawLogs,
        phase: 'complete',
        bestScore: s,
        initialScore: init,
        scoreDelta: s - init,
      };
    }

    case 'error': {
      return {
        ...state,
        rawLogs,
        phase: 'error',
        errorMessage: event.message,
      };
    }

    case 'credits_update':
    default:
      return { ...state, rawLogs };
  }
}

// ── Reassurance phrases (rotated by ReassurancePhrase component) ───────────────
export const REASSURANCE_BY_PHASE: Record<UserPhase, string[]> = {
  prepare: [
    'Reading your target role',
    'Mapping your strengths',
    'Scanning for opportunities',
  ],
  strengthen: [
    'Tightening every bullet',
    'Aligning to recruiter expectations',
    'Highlighting measurable impact',
    'Weaving in key skills',
  ],
  polish: [
    'Sharpening your story',
    'Final review',
    'Polishing the details',
  ],
  complete: ['All done — preparing your results'],
  error: ['Something went wrong'],
};

// ── Elapsed pill copy ────────────────────────────────────────────────────────
export function elapsedLabel(seconds: number): string {
  if (seconds < 15) return 'Working…';
  if (seconds < 45) return 'Almost there…';
  if (seconds < 75) return 'Final touches…';
  return 'Just a moment more…';
}

// ── User-facing stage labels ─────────────────────────────────────────────────
export const STAGE_LABELS = {
  prepare: 'Prepare',
  strengthen: 'Strengthen',
  polish: 'Polish',
} as const;

export function visibleStages(mode: ViewState['mode']): Array<keyof typeof STAGE_LABELS> {
  return mode === 'quick' ? ['prepare', 'strengthen'] : ['prepare', 'strengthen', 'polish'];
}

export function stageIndex(phase: UserPhase, mode: ViewState['mode']): number {
  // Returns 1-indexed position; 0 if not in visible set.
  const stages = visibleStages(mode);
  if (phase === 'complete') return stages.length + 1; // all done
  const idx = stages.indexOf(phase as any);
  return idx >= 0 ? idx + 1 : 0;
}
