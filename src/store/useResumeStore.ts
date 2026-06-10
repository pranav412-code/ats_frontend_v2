import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fetchApi } from '../lib/api';
import { supabase } from '../lib/supabase';

// Pages safe to restore after reload. Transient flows (payment_*, landing,
// payment_failed) are excluded — restoring them would reopen a flow the user
// has already moved past.
const PERSISTABLE_PAGES = new Set<Page>([
  'home', 'editor', 'resumes', 'history', 'profile',
  'security', 'subscription', 'pricing', 'transactions',
  'privacy', 'terms', 'refund', 'contact',
]);

export type Page = 'landing' | 'home' | 'editor' | 'resumes' | 'history' | 'profile' | 'security' | 'subscription' | 'pricing' | 'payment_waiting' | 'payment_success' | 'payment_failed' | 'transactions' | 'privacy' | 'terms' | 'refund' | 'contact';
export type AppState = 'idle' | 'processing' | 'results';

export interface CustomSection {
  id: string;
  title: string;
  layout?: 'cards' | 'pills';
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    date: string;
    bullets: string[];
  }>;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    links?: string[];
  };
  summary: string;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    date: string;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    school: string;
    date: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  projects?: Array<{
    id: string;
    title: string;
    date: string;
    bullets: string[];
    description?: string;
    technologies?: string[];
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer?: string;
    date?: string;
  }>;
  languages?: Array<{
    id: string;
    name: string;
    proficiency?: string;
  }>;
  awards?: Array<{
    id: string;
    title: string;
    issuer?: string;
    date?: string;
  }>;
  hobbies?: string[];
  interests?: string[];
  volunteer?: string[];
  customSections?: CustomSection[];
  sectionOrder?: string[];
  [key: string]: any; // Allow custom sections
}

export interface Resume {
  id: string;
  title: string;
  data: ResumeData;
  latestScore: number | null;
  lastUpdated: number;
  targetRole?: string;
  /** Read-only lock: over plan slot limit after a subscription lapse. */
  locked?: boolean;
  /**
   * Most recent backend-shape payload (from optimizer best_resume or DB
   * `optimized_data`). Used by `convertToBackend(data, snapshot)` to carry
   * engine-only fields (experience.technologies, experience.location,
   * education.gpa) across the frontend round-trip. Without this, live
   * scoring drops below post-optimization score because the scorer sees
   * empty technologies arrays.
   */
  backendSnapshot?: any;
}

export interface OptimizationRun {
  id: string;
  resumeId: string;
  resumeTitle: string;
  beforeScore: number;
  afterScore: number;
  timestamp: number;
}

export interface OptimizationResult {
  initialScore: number;
  finalScore: number;
  breakdown: any;
  beforeBreakdown?: any;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  startedAt?: number;
  completedAt?: number;
  category?: string;
  suggestions?: string[];
  targetRole?: string;
}

export interface IterationStep {
  iteration: number;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
}

export interface Toast {
  id: string;
  kind: 'success' | 'error' | 'info' | 'refund';
  title: string;
  message?: string;
  /** ms before auto-dismiss; 0 = manual */
  duration?: number;
}

interface ResumeStore {
  currentPage: Page;
  appState: AppState;
  resumes: Resume[];
  resumesLoading: boolean;
  currentResumeId: string | null;
  resumeData: ResumeData | null;
  history: OptimizationRun[];
  optimizationResult: OptimizationResult | null;
  preOptimizationSnapshot: ResumeData | null;
  iterationTrail: IterationStep[];
  jdText: string;
  optimizationMode: string;
  liveScore: number | null;
  liveScoring: boolean;
  /** Current credit balance from /profile/credits. null = unknown (not yet fetched). */
  credits: number | null;
  /** True while a /profile/credits request is in flight (avoids UI flicker). */
  creditsLoading: boolean;

  setCurrentPage: (page: Page) => void;
  setAppState: (state: AppState) => void;
  createResume: () => void;
  goToUpload: () => void;
  uploadResume: (
    data: ResumeData,
    filename?: string,
    source?: { sessionId?: string; ext?: 'pdf' | 'docx' },
  ) => void;
  openResume: (id: string) => void;
  deleteResume: (id: string) => void;
  setLiveScore: (score: number | null) => void;
  setLiveScoring: (busy: boolean) => void;
  clearOptimizationContext: () => void;
  updateResumeField: (path: (string | number)[], value: any) => void;
  addBullet: (sectionType: string, sectionIndex: number, customItemIndex?: number) => void;
  deleteBullet: (sectionType: string, sectionIndex: number, bulletIndex: number, customItemIndex?: number) => void;
  addSection: (type: string) => void;
  removeSection: (sectionId: string) => void;
  removeItem: (sectionType: string, itemIndex: number, customSectionIndex?: number) => void;
  addItem: (sectionType: string, customSectionIndex?: number) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  startOptimization: () => void;
  completeOptimization: (optimizedData: ResumeData, resultPayload: any) => void;
  recordIterationStep: (step: IterationStep) => void;
  refreshFinalScore: () => Promise<void>;
  setJdText: (text: string) => void;
  saveJdText: (text: string) => Promise<void>;
  setOptimizationMode: (mode: string) => void;
  fetchResumes: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  exportToPdf: () => Promise<void>;
  /** Fetch current credit balance from backend. */
  fetchCredits: () => Promise<void>;
  /** Apply a credit balance update (used by SSE `credits_update` event). */
  setCredits: (balance: number | null) => void;
  /**
   * Demo-mode pack catalog + purchase. Real payment provider integration
   * (Razorpay/Stripe) will hook into the same `purchasePack` action with
   * extra payload (payment_id, signature). Backend toggles `demo_mode`
   * via PAYMENTS_DEMO_MODE setting.
   */
  creditPacks: CreditPack[] | null;
  creditPackCurrency: string;
  paymentsDemoMode: boolean;
  fetchCreditPacks: () => Promise<void>;
  purchasePack: (packId: string) => Promise<{ added: number; balance: number } | null>;

  /** Slot entitlement (limit/used) from /credits/entitlement. */
  entitlement: Entitlement | null;
  fetchEntitlement: () => Promise<void>;
  /** Last slot-limit error (e.g. create blocked). Shown then cleared by UI. */
  slotError: string | null;
  clearSlotError: () => void;

  /** Current subscription from /credits/subscription. */
  subscription: Subscription | null;
  fetchSubscription: () => Promise<void>;
  cancelSubscription: (cancel: boolean) => Promise<void>;

  /** Transient notifications (refund, success, error). */
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  /**
   * Wipe all user-scoped state back to defaults. Called on signOut and on
   * auth user-id change to prevent the previous user's credits/subscription/
   * resumes from flashing on the dashboard when a different user logs in
   * on the same browser. Also clears persisted localStorage entry.
   */
  reset: () => void;
}

export interface Subscription {
  active: boolean;
  plan?: string;
  pack_id?: string;
  label?: string;
  status?: string;
  credits_per_month?: number;
  resume_slots?: number;
  priority?: boolean;
  months_elapsed?: number;
  commitment_months?: number;
  current_period_end?: string;
  commitment_end?: string;
  cancel_at_period_end?: boolean;
  currency?: string;
  price_paid?: number;
}

export interface Entitlement {
  slot_limit: number;
  slots_used: number;
  slots_available: number;
  priority: boolean;
  plan: string;
}

export interface CreditPack {
  id: string;
  kind: string; // 'subscription' | 'one_time'
  prices: Record<string, number | null>;
  label: string;
  best_for?: string;
  // Subscription-only fields:
  billing_interval?: string;
  commitment_months?: number;
  credits_per_month?: number;
  resume_slots?: number;
  priority?: boolean;
  badge?: string | null;
  // One-time refill field:
  credits?: number;
}

const emptyResumeData: ResumeData = {
  personalInfo: { name: "", email: "", phone: "", location: "" },
  summary: "",
  experience: [],
  education: [],
  skills: { technical: [], soft: [], tools: [] },
  projects: []
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Backend POST /resumes returns the inserted row. Shape can be either:
 *   - list[dict]  (current `execute_non_query(returning=True)` output)
 *   - dict        (if backend later normalises)
 * Pull `id` from either form defensively to survive shape changes.
 */
function extractRealId(response: any): string | null {
  if (!response) return null;
  if (Array.isArray(response)) return response[0]?.id ?? null;
  if (typeof response === 'object') return response.id ?? null;
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isRealResumeId(id: string | null | undefined): boolean {
  return !!id && UUID_RE.test(id);
}

/**
 * Defensive shape adaptor. DB rows can arrive in either frontend shape
 * (`personalInfo`) or backend/engine shape (`basics`). Returning the right
 * shape to the editor is critical — without this, post-optimization fetch
 * overwrites the local resume with a backend-shaped object and the editor
 * renders empty name/email/phone/location fields.
 */
function normalizeToFrontend(data: any): ResumeData {
  if (!data || typeof data !== 'object') return JSON.parse(JSON.stringify(emptyResumeData));
  // Frontend shape — pass through.
  if (data.personalInfo) return data as ResumeData;
  // Backend shape — convertToFrontend reads `basics` etc.
  return convertToFrontend(data);
}

const HISTORY_CAP = 100;

/**
 * Deduplicate optimization runs and cap the list length.
 * - Key on (resumeId, timestamp) — server rows + locally optimistic rows for
 *   the same run share a resume/time pair within a few ms, so this collapses
 *   them. Later entries (later in arr) override earlier ones.
 * - Cap protects against unbounded growth across many optimization runs.
 */
function dedupHistory(arr: OptimizationRun[]): OptimizationRun[] {
  const byKey = new Map<string, OptimizationRun>();
  for (const r of arr) {
    const key = `${r.resumeId}:${Math.floor(r.timestamp / 1000)}`;
    byKey.set(key, r);
  }
  return Array.from(byKey.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, HISTORY_CAP);
}

/**
 * Debounced autosave for inline editor edits.
 * Previously `updateResumeField` only mutated Zustand — refresh discarded edits.
 *
 * Strategy:
 *  - Single window timer; resets on every keystroke.
 *  - Only PATCHes when `currentResumeId` is a real UUID (skips optimistic IDs
 *    still awaiting POST /resumes/ response — see Phase 1.1).
 *  - Writes `optimized_data` because editor flow treats live state as the
 *    "current" view; `original_data` stays as the upload baseline.
 *  - Errors logged, not thrown — autosave is best-effort UX, not a blocking
 *    operation.
 */
let _autosaveTimer: number | null = null;
const AUTOSAVE_DEBOUNCE_MS = 1500;

function scheduleAutosave(
  getState: () => { currentResumeId: string | null; resumeData: ResumeData | null; resumes: Resume[] }
) {
  if (typeof window === 'undefined') return;
  if (_autosaveTimer !== null) window.clearTimeout(_autosaveTimer);
  _autosaveTimer = window.setTimeout(async () => {
    _autosaveTimer = null;
    const { currentResumeId, resumeData, resumes } = getState();
    if (!currentResumeId || !resumeData) return;
    if (!isRealResumeId(currentResumeId)) return; // still optimistic
    const snapshot = resumes.find(r => r.id === currentResumeId)?.backendSnapshot;
    try {
      await fetchApi(`/resumes/${currentResumeId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          optimized_data: convertToBackend(resumeData, snapshot),
        }),
      });
    } catch (e) {
      console.error('Autosave failed', e);
    }
  }, AUTOSAVE_DEBOUNCE_MS);
}

/**
 * Backend may ship `skills` as either `string[]` (after convertToFrontend)
 * or `{technical, soft, tools}` object (raw optimizer output). Mutation
 * actions assume array — flatten defensively before mutating.
 */
function ensureSkillsCategorized(data: any): void {
  if (!data) return;
  if (Array.isArray(data.skills)) {
    data.skills = {
      technical: data.skills,
      soft: [],
      tools: [],
    };
  } else if (!data.skills) {
    data.skills = { technical: [], soft: [], tools: [] };
  } else {
    data.skills.technical = data.skills.technical || [];
    data.skills.soft = data.skills.soft || [];
    data.skills.tools = data.skills.tools || [];
  }
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
  currentPage: 'home',
  appState: 'idle',
  resumes: [],
  resumesLoading: false,
  currentResumeId: null,
  resumeData: null,
  history: [],
  optimizationResult: null,
  preOptimizationSnapshot: null,
  iterationTrail: [],
  jdText: '',
  optimizationMode: 'balanced',
  liveScore: null,
  liveScoring: false,
  credits: null,
  creditsLoading: false,
  creditPacks: null,
  creditPackCurrency: 'USD',
  entitlement: null,
  slotError: null,
  toasts: [],
  subscription: null,
  paymentsDemoMode: true,

  setLiveScore: (score) => set({ liveScore: score }),
  setLiveScoring: (busy) => set({ liveScoring: busy }),
  clearOptimizationContext: () => set({
    optimizationResult: null,
    liveScore: null,
    liveScoring: false,
    // Release the diff-viewer snapshot; otherwise a large resume stays
    // referenced for the lifetime of the session.
    preOptimizationSnapshot: null,
    iterationTrail: [],
  }),

  setCurrentPage: (page) => set({ currentPage: page }),
  
  setAppState: (state) => set({ appState: state }),

  setJdText: (text) => set({ jdText: text }),
  setOptimizationMode: (mode) => set({ optimizationMode: mode }),
  
  fetchResumes: async () => {
    set({ resumesLoading: true });
    try {
      const data = await fetchApi('/resumes');
      // Map backend format to frontend format.
      // backend returns array of { id, title, original_data, ats_score, updated_at }
      //
      // DB row shape is mixed:
      //   - `original_data` was written by uploadResume/createResume as
      //     frontend shape (personalInfo / experience[].role / ...).
      //   - `optimized_data` is written by the optimize stream + the editor
      //     autosave as backend shape (basics / experience[].job_title / ...).
      // `convertToFrontend` only knows backend shape — running it over an
      // already-frontend payload would yield empty `personalInfo` etc.
      // Detect by presence of `personalInfo` to decide.
      const parsedResumes: Resume[] = data.map((r: any) => {
        const rawForSnapshot = r.optimized_data || r.original_data;
        // Snapshot only meaningful when payload is backend shape — frontend
        // shape (original_data from uploadResume) has no `basics` etc., so
        // skip and let live scoring fall back to defaults until next optimize.
        const snapshot = rawForSnapshot && typeof rawForSnapshot === 'object' && rawForSnapshot.basics
          ? rawForSnapshot
          : undefined;
        return {
          id: r.id,
          title: r.title,
          data: normalizeToFrontend(rawForSnapshot),
          backendSnapshot: snapshot,
          latestScore: r.ats_score,
          lastUpdated: new Date(r.updated_at).getTime(),
          targetRole: r.target_role,
          locked: !!r.locked,
        };
      });
      set({ resumes: parsedResumes });

      // Rehydrate editor session after page reload. persist() restored
      // currentResumeId + currentPage='editor' from localStorage, but
      // resumeData is not persisted (large + diverges from server). Now that
      // the resume list is fetched, populate resumeData from the matching
      // entry so EditorPage has content. If the persisted id no longer
      // exists (deleted on another device), fall back to resumes page.
      const st = get();
      if (st.currentResumeId && !st.resumeData) {
        const match = parsedResumes.find(r => r.id === st.currentResumeId);
        if (match) {
          set({
            resumeData: JSON.parse(JSON.stringify(match.data)),
            jdText: st.jdText || match.targetRole || '',
          });
        } else {
          set({ currentResumeId: null, currentPage: 'resumes' });
        }
      }
    } catch (e) {
      console.error("Failed to fetch resumes", e);
    } finally {
      set({ resumesLoading: false });
    }
  },

  fetchHistory: async () => {
    try {
      const data = await fetchApi('/optimize/history');
      const parsedHistory: OptimizationRun[] = data.map((r: any) => ({
        id: r.version_id ?? r.id,
        resumeId: r.resume_id,
        resumeTitle: r.title ?? r.resumes?.title ?? 'Unknown',
        // Backend now returns explicit score_before (with LAG fallback for legacy rows).
        beforeScore: r.score_before ?? r.ats_score,
        afterScore: r.ats_score,
        timestamp: new Date(r.version_created_at ?? r.created_at).getTime(),
      }));
      // Merge with optimistic local entries so a run completed mid-fetch
      // isn't lost, then dedupe by (resumeId, ~second) — see dedupHistory.
      set((s) => ({ history: dedupHistory([...parsedHistory, ...s.history]) }));
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  },

  fetchCredits: async () => {
    // Backend endpoint: GET /api/v1/profile/credits → { credits: number }
    // Safe to call repeatedly; lightweight read.
    set({ creditsLoading: true });
    try {
      const data = await fetchApi('/profile/credits');
      const balance = typeof data?.credits === 'number' ? data.credits : null;
      set({ credits: balance, creditsLoading: false });
    } catch (e) {
      console.error('Failed to fetch credits', e);
      set({ creditsLoading: false });
    }
  },

  setCredits: (balance) => set({ credits: balance }),

  fetchCreditPacks: async () => {
    try {
      const data = await fetchApi('/credits/packs');
      set({
        creditPacks: Array.isArray(data?.packs) ? data.packs : [],
        creditPackCurrency: data?.currency || 'USD',
        paymentsDemoMode: !!data?.demo_mode,
      });
    } catch (e) {
      console.error('Failed to fetch credit packs', e);
    }
  },

  purchasePack: async (packId: string) => {
    // Backend handles demo vs real fulfilment internally. Returns the new
    // balance — we cache it locally to avoid a follow-up /credits fetch.
    try {
      const data = await fetchApi('/credits/purchase', {
        method: 'POST',
        body: JSON.stringify({ pack_id: packId }),
      });
      if (typeof data?.credits === 'number') {
        set({ credits: data.credits });
      }
      return { added: data?.added ?? 0, balance: data?.credits ?? 0 };
    } catch (e) {
      console.error('Purchase failed', e);
      return null;
    }
  },

  fetchEntitlement: async () => {
    try {
      const data = await fetchApi('/credits/entitlement');
      set({ entitlement: data });
    } catch (e) {
      console.error('Failed to fetch entitlement', e);
    }
  },

  clearSlotError: () => set({ slotError: null }),

  pushToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const full: Toast = { id, duration: 6000, ...toast };
    set((s) => ({ toasts: [...s.toasts, full] }));
    if (full.duration && full.duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
      }, full.duration);
    }
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  reset: () => {
    // Cancel any pending autosave that would PATCH the previous user's
    // resume with stale state under the new user's session.
    if (_autosaveTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(_autosaveTimer);
      _autosaveTimer = null;
    }
    try {
      localStorage.removeItem('resume-store');
    } catch {
      // best-effort
    }
    set({
      currentPage: 'home',
      appState: 'idle',
      resumes: [],
      resumesLoading: false,
      currentResumeId: null,
      resumeData: null,
      history: [],
      optimizationResult: null,
      preOptimizationSnapshot: null,
      iterationTrail: [],
      jdText: '',
      optimizationMode: 'balanced',
      liveScore: null,
      liveScoring: false,
      credits: null,
      creditsLoading: false,
      creditPacks: null,
      creditPackCurrency: 'USD',
      entitlement: null,
      slotError: null,
      subscription: null,
      toasts: [],
    });
  },

  fetchSubscription: async () => {
    try {
      const data = await fetchApi('/credits/subscription');
      set({ subscription: data });
    } catch (e) {
      console.error('Failed to fetch subscription', e);
    }
  },

  cancelSubscription: async (cancel: boolean) => {
    const data = await fetchApi('/credits/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ cancel }),
    });
    set({ subscription: data });
  },

  exportToPdf: async () => {
    const state = get();
    if (!state.resumeData) return;
    try {
      const snapshot = state.resumes.find(r => r.id === state.currentResumeId)?.backendSnapshot;
      const backendData = convertToBackend(state.resumeData, snapshot);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const response = await fetch('http://localhost:8001/api/v1/export', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resume_json: backendData,
          format: 'pdf'
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMsg = 'Export failed';
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
             errorMsg = errorData.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ');
          } else if (typeof errorData.detail === 'string') {
             errorMsg = errorData.detail;
          }
        }
        throw new Error(errorMsg);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = state.resumeData.personalInfo?.name || 'resume';
      a.download = `${name.replace(/ /g, '_')}_optimized.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export PDF", e);
      alert("Failed to export PDF: " + (e as Error).message);
    }
  },

  goToUpload: () => {
    set({
      currentResumeId: null,
      resumeData: null,
      currentPage: 'editor',
      appState: 'idle',
      optimizationResult: null,
      liveScore: null,
      liveScoring: false,
      jdText: ''
    });
  },

  createResume: async () => {
    const newId = generateId();
    const newData = JSON.parse(JSON.stringify(emptyResumeData));
    
    set((state) => ({
      resumes: [...state.resumes, {
        id: newId,
        title: 'Untitled Resume',
        data: newData,
        latestScore: null,
        lastUpdated: Date.now()
      }],
      currentResumeId: newId,
      resumeData: newData,
      currentPage: 'editor',
      appState: 'idle',
      optimizationResult: null,
      liveScore: null,
      liveScoring: false,
      jdText: ''
    }));

    try {
      const response = await fetchApi('/resumes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Untitled Resume',
          original_data: newData
        })
      });
      const realId = extractRealId(response);
      if (realId) {
        set((state) => ({
          resumes: state.resumes.map(r => r.id === newId ? { ...r, id: realId } : r),
          currentResumeId: state.currentResumeId === newId ? realId : state.currentResumeId
        }));
      } else {
        console.error("Create resume returned no usable id", response);
      }
      get().fetchEntitlement();
    } catch (e: any) {
      // Roll back the optimistic add — it never persisted. Surface slot-limit
      // (or any create) failure and bounce back to the library.
      console.error("Failed to create resume on backend", e);
      set((state) => ({
        resumes: state.resumes.filter(r => r.id !== newId),
        currentResumeId: state.currentResumeId === newId ? null : state.currentResumeId,
        resumeData: state.currentResumeId === newId ? null : state.resumeData,
        currentPage: 'resumes',
        slotError: e?.message || 'Could not create resume.',
      }));
      get().fetchEntitlement();
    }
  },

  uploadResume: async (data, filename = 'Uploaded Resume', source) => {
    // Strip extension + trailing "(N)" only. Removing `_optimized` previously
    // caused collisions where "resume_optimized.pdf" silently overwrote
    // "resume.pdf" via the old same-title branch below.
    let rawTitle = filename.replace(/\.[^/.]+$/, "");
    rawTitle = rawTitle.replace(/\s*\(\d+\)$/, "");
    const baseTitle = rawTitle.replace(/_/g, " ").trim() || 'Uploaded Resume';

    // Auto-suffix on collision rather than overwrite — preserves the prior
    // resume's `original_data` + version history.
    const existingTitles = new Set(get().resumes.map(r => r.title.toLowerCase()));
    let title = baseTitle;
    let n = 2;
    while (existingTitles.has(title.toLowerCase())) {
      title = `${baseTitle} (${n++})`;
    }

    const newId = generateId();
    
    set((state) => ({
      resumes: [...state.resumes, {
        id: newId,
        title,
        data,
        latestScore: null,
        lastUpdated: Date.now()
      }],
      currentResumeId: newId,
      resumeData: data,
      currentPage: 'editor',
      appState: 'idle',
      optimizationResult: null,
      liveScore: null,
      liveScoring: false,
      jdText: ''
    }));

    try {
      const response = await fetchApi('/resumes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          original_data: data,
          // Provenance — links this resume row back to the upload that
          // produced it. Backend re-validates ownership of session_id.
          source_session_id: source?.sessionId,
          source_filename:   filename,
          source_ext:        source?.ext,
        })
      });
      const realId = extractRealId(response);
      if (realId) {
        set((state) => ({
          resumes: state.resumes.map(r => r.id === newId ? { ...r, id: realId } : r),
          currentResumeId: state.currentResumeId === newId ? realId : state.currentResumeId
        }));
      } else {
        console.error("Upload resume returned no usable id", response);
      }
      get().fetchEntitlement();
    } catch (e: any) {
      console.error("Failed to upload resume to backend", e);
      set((state) => ({
        resumes: state.resumes.filter(r => r.id !== newId),
        currentResumeId: state.currentResumeId === newId ? null : state.currentResumeId,
        resumeData: state.currentResumeId === newId ? null : state.resumeData,
        currentPage: 'resumes',
        slotError: e?.message || 'Could not upload resume.',
      }));
      get().fetchEntitlement();
    }
  },

  openResume: (id) => {
    const resume = get().resumes.find(r => r.id === id);
    if (resume) {
      set({
        currentResumeId: id,
        resumeData: JSON.parse(JSON.stringify(resume.data)),
        currentPage: 'editor',
        appState: 'idle',
        optimizationResult: null,
        liveScore: null,
        liveScoring: false,
        jdText: resume.targetRole || ''
      });
    }
  },
  
  deleteResume: async (id) => {
    set((state) => {
      const newResumes = state.resumes.filter(r => r.id !== id);
      const isCurrent = state.currentResumeId === id;
      return {
        resumes: newResumes,
        ...(isCurrent ? { currentResumeId: null, resumeData: null } : {})
      };
    });
    
    try {
      await fetchApi(`/resumes/${id}`, { method: 'DELETE' });
      // Refresh slot counter — a freed slot may re-enable create/upload.
      get().fetchEntitlement();
    } catch (e) {
      console.error("Failed to delete resume on backend", e);
      // We could add the resume back to state on failure, but for simplicity we ignore.
    }
  },
  
  updateResumeField: (path, value) => {
    set((state) => {
      if (!state.resumeData) return state;

      const newData = JSON.parse(JSON.stringify(state.resumeData));

      // If touching skills, ensure flat-array shape before mutation.
      if (path[0] === 'skills') ensureSkillsCategorized(newData);

      // Defensive traversal: auto-create missing intermediates so freshly-added
      // sections can be edited before any data exists. Infer array vs object
      // from the next path segment's type.
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] == null) {
          const nextKey = path[i + 1];
          current[key] = typeof nextKey === 'number' ? [] : {};
        }
        current = current[key];
      }
      if (current && typeof current === 'object') {
        current[path[path.length - 1]] = value;
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now(), title: newData.personalInfo?.name || r.title }
              : r
          )
        : state.resumes;

      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  addBullet: (sectionType, sectionIndex, customItemIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      if (sectionType === 'customSections' && typeof customItemIndex === 'number') {
        if (newData.customSections?.[sectionIndex]?.items?.[customItemIndex]) {
          if (!newData.customSections[sectionIndex].items[customItemIndex].bullets) {
            newData.customSections[sectionIndex].items[customItemIndex].bullets = [];
          }
          newData.customSections[sectionIndex].items[customItemIndex].bullets.push("");
        } else {
          console.warn(`addBullet: Custom section at index ${sectionIndex} or item at index ${customItemIndex} not found.`);
        }
      } else {
        if (newData[sectionType] && newData[sectionType][sectionIndex]) {
          if (!newData[sectionType][sectionIndex].bullets) {
             newData[sectionType][sectionIndex].bullets = [];
          }
          newData[sectionType][sectionIndex].bullets.push("");
        } else {
          console.warn(`addBullet: Section ${sectionType} or item at index ${sectionIndex} not found.`);
        }
      }
      
      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;
      
      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  deleteBullet: (sectionType, sectionIndex, bulletIndex, customItemIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      
      if (sectionType === 'customSections' && typeof customItemIndex === 'number') {
        if (newData.customSections?.[sectionIndex]?.items?.[customItemIndex]?.bullets) {
          newData.customSections[sectionIndex].items[customItemIndex].bullets.splice(bulletIndex, 1);
        }
      } else {
        if (newData[sectionType] && newData[sectionType][sectionIndex] && newData[sectionType][sectionIndex].bullets) {
          newData[sectionType][sectionIndex].bullets.splice(bulletIndex, 1);
        }
      }
      
      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;
      
      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  addSection: (type) => {
    set((state) => {
      if (!state.resumeData) return state;

      const newData = JSON.parse(JSON.stringify(state.resumeData));
      ensureSkillsCategorized(newData);

      if (!newData.sectionOrder) {
        newData.sectionOrder = ['summary', 'experience', 'education'];
        if (newData.projects?.length) newData.sectionOrder.push('projects');
        if (newData.customSections) newData.sectionOrder.push(...newData.customSections.map((s: any) => s.id));
        newData.sectionOrder.push('skills');
      }

      // Generic config: key -> {ensureField, defaultItem, insertBefore?}
      const SIMPLE_SECTIONS: Record<string, {
        field: keyof ResumeData | 'skills';
        defaultItem: any;
        insertBefore?: string;
      }> = {
        experience:     { field: 'experience',     defaultItem: () => ({ id: generateId(), role: "New Role", company: "Company", date: "Date", bullets: [""] }) },
        education:      { field: 'education',      defaultItem: () => ({ id: generateId(), degree: "Degree", school: "School", date: "Date" }) },
        projects:       { field: 'projects',       defaultItem: () => ({ id: generateId(), title: "New Project", date: "Date", bullets: [""] }), insertBefore: 'skills' },

        certifications: { field: 'certifications', defaultItem: () => ({ id: generateId(), name: "Certification Name", issuer: "Issuer", date: "" }), insertBefore: 'skills' },
        languages:      { field: 'languages',      defaultItem: () => ({ id: generateId(), name: "English", proficiency: "Fluent" }), insertBefore: 'skills' },
        awards:         { field: 'awards',         defaultItem: () => ({ id: generateId(), title: "Award Name", issuer: "", date: "" }), insertBefore: 'skills' },
        hobbies:        { field: 'hobbies',        defaultItem: () => "New Hobby" },
        interests:      { field: 'interests',      defaultItem: () => "New Interest" },
        volunteer:      { field: 'volunteer',      defaultItem: () => "Volunteer Activity" },
      };

      if (type === 'summary') {
        if (!newData.sectionOrder.includes('summary')) newData.sectionOrder.unshift('summary');
      } else if (type in SIMPLE_SECTIONS) {
        const cfg = SIMPLE_SECTIONS[type];
        const fieldKey = cfg.field as string;
        // Ensure section in order (insert before anchor if specified).
        if (!newData.sectionOrder.includes(type)) {
          if (cfg.insertBefore) {
            const idx = newData.sectionOrder.indexOf(cfg.insertBefore);
            newData.sectionOrder.splice(idx >= 0 ? idx : newData.sectionOrder.length, 0, type);
          } else {
            newData.sectionOrder.push(type);
          }
        }
        // Ensure array exists.
        if (!Array.isArray(newData[fieldKey])) newData[fieldKey] = [];
        // Append placeholder only if section is empty (first-time add).
        if (newData[fieldKey].length === 0) {
          newData[fieldKey].push(cfg.defaultItem());
        }
      } else if (type === 'custom') {
        if (!newData.customSections) newData.customSections = [];
        const customId = generateId();
        newData.customSections.push({
          id: customId,
          title: "Custom Section",
          items: [{
            id: generateId(),
            title: "Project / Role",
            subtitle: "Organization",
            date: "Date",
            bullets: [""]
          }]
        });
        const skillsIdx = newData.sectionOrder.indexOf('skills');
        if (skillsIdx >= 0) {
          newData.sectionOrder.splice(skillsIdx, 0, customId);
        } else {
          newData.sectionOrder.push(customId);
        }
      }
      
      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;
      
      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  removeSection: (sectionId) => {
    set((state) => {
      if (!state.resumeData) return state;
      const newData = JSON.parse(JSON.stringify(state.resumeData));

      // Materialize sectionOrder if absent so the filter has something to act on.
      // Without this, fallback in ResumePreview keeps rendering built-in
      // sections (summary/experience/education) even after delete.
      if (!Array.isArray(newData.sectionOrder)) {
        newData.sectionOrder = ['summary', 'experience', 'education'];
        if (Array.isArray(newData.projects) && newData.projects.length > 0) newData.sectionOrder.push('projects');
        if (Array.isArray(newData.certifications) && newData.certifications.length > 0) newData.sectionOrder.push('certifications');
        if (Array.isArray(newData.awards) && newData.awards.length > 0) newData.sectionOrder.push('awards');
        if (Array.isArray(newData.languages) && newData.languages.length > 0) newData.sectionOrder.push('languages');
        if (Array.isArray(newData.volunteer) && newData.volunteer.length > 0) newData.sectionOrder.push('volunteer');
        if (Array.isArray(newData.customSections)) {
          newData.sectionOrder.push(...newData.customSections.map((s: any) => s.id));
        }
        newData.sectionOrder.push('skills');
        if (Array.isArray(newData.hobbies) && newData.hobbies.length > 0) newData.sectionOrder.push('hobbies');
        if (Array.isArray(newData.interests) && newData.interests.length > 0) newData.sectionOrder.push('interests');
      }

      // Drop from order.
      newData.sectionOrder = newData.sectionOrder.filter((id: string) => id !== sectionId);

      // Clear backing data so re-adding the section doesn't surface old items.
      const ARRAY_SECTIONS = new Set([
        'experience', 'education', 'projects', 'skills',
        'certifications', 'languages', 'awards',
        'hobbies', 'interests', 'volunteer',
      ]);
      if (sectionId === 'summary') {
        newData.summary = '';
      } else if (ARRAY_SECTIONS.has(sectionId)) {
        (newData as any)[sectionId] = [];
      } else if (Array.isArray(newData.customSections)) {
        // Custom section — drop matching entry.
        newData.customSections = newData.customSections.filter((s: any) => s.id !== sectionId);
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId ? { ...r, data: newData, lastUpdated: Date.now() } : r
          )
        : state.resumes;
      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  removeItem: (sectionType, itemIndex, customSectionIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      if (sectionType === 'skills') ensureSkillsCategorized(newData);

      if (sectionType === 'customSections' && typeof customSectionIndex === 'number') {
        if (newData.customSections?.[customSectionIndex]?.items) {
          newData.customSections[customSectionIndex].items.splice(itemIndex, 1);
        }
      } else if (newData[sectionType] && Array.isArray(newData[sectionType])) {
        newData[sectionType].splice(itemIndex, 1);
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId ? { ...r, data: newData, lastUpdated: Date.now() } : r
          )
        : state.resumes;
      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  addItem: (sectionType, customSectionIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      if (sectionType === 'skills') ensureSkillsCategorized(newData);

      const SIMPLE_SECTIONS: Record<string, () => any> = {
        experience:     () => ({ id: generateId(), role: "New Role", company: "Company", date: "Date", bullets: [""] }),
        education:      () => ({ id: generateId(), degree: "Degree", school: "School", date: "Date" }),
        projects:       () => ({ id: generateId(), title: "New Project", date: "Date", bullets: [""] }),
        certifications: () => ({ id: generateId(), name: "Certification Name", issuer: "Issuer", date: "" }),
        languages:      () => ({ id: generateId(), name: "English", proficiency: "Fluent" }),
        awards:         () => ({ id: generateId(), title: "Award Name", issuer: "", date: "" }),

        hobbies:        () => "New Hobby",
        interests:      () => "New Interest",
        volunteer:      () => "Volunteer Activity",
      };

      if (sectionType === 'customSections' && typeof customSectionIndex === 'number') {
        if (Array.isArray(newData.customSections) && newData.customSections[customSectionIndex]) {
          const sec = newData.customSections[customSectionIndex];
          if (!sec.items) sec.items = [];
          sec.items.push({
            id: generateId(),
            title: "Project / Role",
            subtitle: "Organization",
            date: "Date",
            bullets: [""]
          });
        }
      } else if (sectionType in SIMPLE_SECTIONS) {
        if (!Array.isArray(newData[sectionType])) {
          newData[sectionType] = [];
        }
        newData[sectionType].push(SIMPLE_SECTIONS[sectionType]());
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId ? { ...r, data: newData, lastUpdated: Date.now() } : r
          )
        : state.resumes;
      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  reorderSections: (startIndex, endIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      
      let order = newData.sectionOrder;
      if (!order) {
        order = ['summary', 'experience', 'education'];
        if (newData.projects) {
          order.push('projects');
        }
        if (newData.customSections) {
          order.push(...newData.customSections.map((s: any) => s.id));
        }
        order.push('skills');
      }
      
      const result = Array.from(order);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      newData.sectionOrder = result;

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;

      return { resumeData: newData, resumes: updatedResumes };
    });
    scheduleAutosave(get);
  },

  startOptimization: () => set((state) => ({
    appState: 'processing',
    // Snapshot current resume before optimizer mutates it (for diff viewer).
    preOptimizationSnapshot: state.resumeData ? JSON.parse(JSON.stringify(state.resumeData)) : null,
    iterationTrail: [],
  })),

  recordIterationStep: (step) => set((state) => ({
    iterationTrail: [...state.iterationTrail.filter((s) => s.iteration !== step.iteration), step]
      .sort((a, b) => a.iteration - b.iteration),
  })),
  
  completeOptimization: (optimizedData, resultPayload) => {
    // After the SSE stream wrote the new version + updated `optimized_data` on
    // the resumes row, re-fetch lists so the local cache reflects DB truth
    // (titles, scores, history deltas, version id mappings).
    // Fire-and-forget — UI still updates immediately from the set() below.
    setTimeout(() => {
      get().fetchResumes().catch(() => {});
      get().fetchHistory().catch(() => {});
    }, 50);

    set((state) => {
      if (!state.currentResumeId) return state;

      const currentResume = state.resumes.find(r => r.id === state.currentResumeId);
    // `??` — treat 0 as a valid score. No random fallback: synthetic data poisoned history before.
    const beforeScore: number =
      resultPayload.initial_score ?? currentResume?.latestScore ?? 0;
    
    const newRun: OptimizationRun = {
      id: generateId(),
      resumeId: state.currentResumeId,
      resumeTitle: currentResume?.title || 'Unknown',
      beforeScore,
      afterScore: resultPayload.final_score,
      timestamp: Date.now()
    };
    
    // resultPayload.optimized_resume is the raw backend best_resume with
    // engine-only fields (technologies, location, gpa). Stash so live score
    // matches the recorded best_score until user edits diverge from snapshot.
    const newSnapshot = resultPayload.optimized_resume || undefined;

    const updatedResumes = state.resumes.map(r =>
      r.id === state.currentResumeId
        ? {
            ...r,
            data: optimizedData,
            backendSnapshot: newSnapshot ?? r.backendSnapshot,
            latestScore: resultPayload.final_score,
            lastUpdated: Date.now(),
          }
        : r
    );
    
    return {
      appState: 'results',
      resumeData: optimizedData,
      resumes: updatedResumes,
      history: dedupHistory([newRun, ...state.history]),
      optimizationResult: {
        initialScore: beforeScore,
        finalScore: resultPayload.final_score,
        breakdown: resultPayload.breakdown || {},
        beforeBreakdown: resultPayload.before_breakdown || resultPayload.initial_breakdown || undefined,
        missingKeywords: resultPayload.missing_keywords || [],
        strengths: resultPayload.strengths || [],
        weaknesses: resultPayload.weaknesses || [],
        startedAt: resultPayload._startedAt,
        completedAt: Date.now(),
        category: resultPayload.category,
        suggestions: resultPayload.suggestions || [],
        targetRole: state.jdText ? state.jdText : undefined,
      }
    };
    });
  },

  saveJdText: async (jdText: string) => {
    const state = get();
    if (!state.currentResumeId) return;
    try {
      await fetchApi(`/resumes/${state.currentResumeId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          target_role: jdText
        })
      });
      set((s) => ({
        resumes: s.resumes.map(r => r.id === s.currentResumeId ? { ...r, targetRole: jdText } : r)
      }));
    } catch (e) {
      console.error("Failed to save JD text", e);
    }
  },

  refreshFinalScore: async () => {
    const state = get();
    if (!state.resumeData || !state.optimizationResult) return;
    try {
      const snapshot = state.resumes.find(r => r.id === state.currentResumeId)?.backendSnapshot;
      const data = await fetchApi('/optimize/score-only', {
        method: 'POST',
        body: JSON.stringify({
          resume_json: convertToBackend(state.resumeData, snapshot),
          jd_text: state.jdText || '',
        }),
      });
      const score = typeof data?.score === 'number' ? Math.round(data.score) : null;
      if (score === null) return;
      set((s) => {
        if (!s.optimizationResult) return s;
        return {
          optimizationResult: {
            ...s.optimizationResult,
            finalScore: score,
            breakdown: data.breakdown || s.optimizationResult.breakdown,
          },
        };
      });
    } catch {
      // Silent — snapshot stays visible on failure.
    }
  },
    }),
    {
      name: 'resume-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only routing + selection + edit-time UI state. resumeData
      // itself is re-derived from `resumes[].data` after fetchResumes()
      // resolves — see rehydrate hook in fetchResumes.
      partialize: (state) => ({
        currentPage: PERSISTABLE_PAGES.has(state.currentPage) ? state.currentPage : 'home',
        currentResumeId: state.currentResumeId,
        jdText: state.jdText,
        optimizationMode: state.optimizationMode,
      }),
    }
  )
);

export const mockResumeData: ResumeData = {
  personalInfo: {
    name: "Alex Designer",
    email: "alex@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
  },
  summary: "Creative and detail-oriented product designer with 5+ years of experience building delightful user experiences.",
  experience: [
    {
      id: "exp1",
      role: "Senior Product Designer",
      company: "Tech Corp",
      date: "2021 - Present",
      bullets: [
        "Led the redesign of the core product dashboard.",
        "Collaborated with engineering to deliver features.",
      ]
    }
  ],
  education: [
    {
      id: "edu1",
      degree: "B.S. Interaction Design",
      school: "Design University",
      date: "2014 - 2018"
    }
  ],
  projects: [
    {
      id: "proj1",
      title: "Portfolio Website",
      date: "2023",
      bullets: [
        "Designed and developed a responsive portfolio website using React and TailwindCSS.",
        "Optimized page load speed and implemented modern animations."
      ]
    }
  ],
  skills: {
    technical: ["React", "Figma"],
    soft: ["User Research"],
    tools: []
  }
};

/**
 * Snapshot-aware conversion.
 *
 * Frontend `ResumeData` intentionally omits engine-only fields the editor
 * doesn't render (experience.technologies, experience.location, education.gpa
 * etc.). Without a snapshot, these defaulted to `""` / `[]` on every
 * round-trip — silently stripping keyword-density signal the scorer rewards.
 * Result: live score dropped below the score recorded at end of optimization
 * (e.g. 88 → 85).
 *
 * `snapshot` is the most recent backend-shape payload we saw (from optimizer
 * complete event, or DB `optimized_data`). For each index, if the corresponding
 * frontend item still matches its snapshot anchor (company+job_title for
 * experience, school+degree for education), copy the hidden fields. If the
 * user reordered/renamed, anchor mismatches and hidden fields revert to
 * defaults — correct, because we no longer know they apply.
 */
function _expAnchorMatch(snap: any, fe: any): boolean {
  return (
    (snap?.company || '').trim().toLowerCase() === (fe?.company || '').trim().toLowerCase() &&
    (snap?.job_title || '').trim().toLowerCase() === (fe?.role || '').trim().toLowerCase()
  );
}
function _eduAnchorMatch(snap: any, fe: any): boolean {
  return (
    (snap?.institution || '').trim().toLowerCase() === (fe?.school || '').trim().toLowerCase() &&
    (snap?.degree || '').trim().toLowerCase() === (fe?.degree || '').trim().toLowerCase()
  );
}

export function convertToBackend(frontendData: ResumeData, snapshot?: any): any {
  const personalInfo = frontendData.personalInfo || { name: "", email: "", phone: "", location: "", links: [] };
  const links = personalInfo.links || [];

  const snapExp: any[] = Array.isArray(snapshot?.experience) ? snapshot.experience : [];
  const snapEdu: any[] = Array.isArray(snapshot?.education) ? snapshot.education : [];

  return {
    basics: {
      name: personalInfo.name || "",
      email: personalInfo.email || "",
      phone: personalInfo.phone || "",
      location: personalInfo.location || "",
      // Derived legacy fields (engine + LLM prompts still read these).
      linkedin: links.find(l => l.includes("linkedin")) || "",
      github: links.find(l => l.includes("github")) || "",
      // Full link list — preserves arbitrary URLs (portfolio, Behance, Twitter, etc.)
      links,
    },
    summary: frontendData.summary || "",
    experience: (frontendData.experience || []).map((exp: any, i: number) => {
      const [startDate = "", endDate = ""] = (exp.date || "").split("-").map((s: string) => s.trim());
      const snap = snapExp[i];
      const matched = snap && _expAnchorMatch(snap, exp);
      return {
        company: exp.company || "",
        job_title: exp.role || "",
        start_date: startDate,
        end_date: endDate,
        location: matched ? (snap.location || "") : "",
        bullets: exp.bullets || [],
        technologies: matched && Array.isArray(snap.technologies) ? snap.technologies : []
      };
    }),
    education: (frontendData.education || []).map((edu: any, i: number) => {
      const [startDate = "", endDate = ""] = (edu.date || "").split("-").map((s: string) => s.trim());
      const snap = snapEdu[i];
      const matched = snap && _eduAnchorMatch(snap, edu);
      return {
        institution: edu.school || "",
        degree: edu.degree || "",
        start_date: startDate,
        end_date: endDate,
        gpa: matched ? (snap.gpa || "") : "",
        location: matched ? (snap.location || "") : ""
      };
    }),
    projects: (frontendData.projects || []).map((proj: any) => {
      return {
        title: proj.title || "",
        date: proj.date || "",
        description: proj.description || "",
        bullets: proj.bullets || [],
        technologies: proj.technologies || []
      };
    }),
    certifications: (frontendData.certifications || []).map(c =>
      [c.name, c.issuer, c.date].filter(Boolean).join(" | ")
    ).filter(Boolean),
    languages: (frontendData.languages || []).map(l =>
      [l.name, l.proficiency].filter(Boolean).join(" | ")
    ).filter(Boolean),
    awards: (frontendData.awards || []).map(a =>
      [a.title, a.issuer, a.date].filter(Boolean).join(" | ")
    ).filter(Boolean),
    hobbies: frontendData.hobbies || [],
    interests: frontendData.interests || [],
    volunteer: frontendData.volunteer || [],
    skills: {
      technical: frontendData.skills?.technical || [],
      soft: frontendData.skills?.soft || [],
      tools: frontendData.skills?.tools || []
    },
    custom_sections: frontendData.customSections || [],
    section_order: frontendData.sectionOrder || [],
    other: ""
  };
}

export function convertToFrontend(backendData: any): ResumeData {
  const basics = backendData?.basics || {};
  // Prefer full `links` array when backend ships it. Fall back to
  // legacy linkedin/github fields for older payloads.
  const rawLinks: string[] = Array.isArray(basics.links) && basics.links.length > 0
    ? basics.links.filter((l: any) => typeof l === 'string' && l.trim())
    : [basics.linkedin, basics.github].filter((l: any) => typeof l === 'string' && l.trim());
  // Dedupe while preserving order.
  const seen = new Set<string>();
  const links: string[] = [];
  for (const l of rawLinks) {
    if (!seen.has(l)) {
      seen.add(l);
      links.push(l);
    }
  }

  return {
    personalInfo: {
      name: basics.name || "",
      email: basics.email || "",
      phone: basics.phone || "",
      location: basics.location || "",
      links
    },
    summary: backendData?.summary || "",
    experience: (backendData?.experience || []).map((exp: any, idx: number) => ({
      id: exp.id || `exp_${idx}_${Date.now()}`,
      role: exp.job_title || "",
      company: exp.company || "",
      date: exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : (exp.start_date || exp.end_date || ""),
      bullets: exp.bullets || []
    })),
    education: (backendData?.education || []).map((edu: any, idx: number) => ({
      id: edu.id || `edu_${idx}_${Date.now()}`,
      degree: edu.degree || "",
      school: edu.institution || "",
      date: edu.start_date && edu.end_date ? `${edu.start_date} - ${edu.end_date}` : (edu.start_date || edu.end_date || "")
    })),
    projects: (backendData?.projects || []).map((proj: any, idx: number) => ({
      id: proj.id || `proj_${idx}_${Date.now()}`,
      title: proj.title || "",
      date: proj.date || "",
      bullets: proj.bullets || [],
      description: proj.description || "",
      technologies: proj.technologies || []
    })),
    skills: {
      technical: backendData?.skills?.technical || [],
      soft: backendData?.skills?.soft || [],
      tools: backendData?.skills?.tools || []
    },
    certifications: (backendData?.certifications || []).map((c: any, idx: number) => {
      if (typeof c === 'string') {
        const parts = c.split('|').map((s: string) => s.trim());
        return { id: `cert_${idx}_${Date.now()}`, name: parts[0] || '', issuer: parts[1] || '', date: parts[2] || '' };
      }
      return { id: c.id || `cert_${idx}_${Date.now()}`, name: c.name || '', issuer: c.issuer || '', date: c.date || '' };
    }),
    languages: (backendData?.languages || []).map((l: any, idx: number) => {
      if (typeof l === 'string') {
        const parts = l.split('|').map((s: string) => s.trim());
        return { id: `lang_${idx}_${Date.now()}`, name: parts[0] || '', proficiency: parts[1] || '' };
      }
      return { id: l.id || `lang_${idx}_${Date.now()}`, name: l.name || '', proficiency: l.proficiency || '' };
    }),
    awards: (backendData?.awards || []).map((a: any, idx: number) => {
      if (typeof a === 'string') {
        const parts = a.split('|').map((s: string) => s.trim());
        return { id: `award_${idx}_${Date.now()}`, title: parts[0] || '', issuer: parts[1] || '', date: parts[2] || '' };
      }
      return { id: a.id || `award_${idx}_${Date.now()}`, title: a.title || '', issuer: a.issuer || '', date: a.date || '' };
    }),
    hobbies: backendData?.hobbies || [],
    interests: backendData?.interests || [],
    volunteer: backendData?.volunteer || [],
    customSections: backendData?.custom_sections || []
  };
}
