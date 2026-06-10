/**
 * Narrative + qualitative helpers for the Results page.
 * Translates raw deltas and 12-dim breakdown into user-friendly text.
 */

export interface Verdict {
  headline: string;
  subhead: string;
  tone: 'gold' | 'emerald' | 'cyan' | 'amber' | 'gray';
}

export function verdictFromDelta(delta: number): Verdict {
  if (delta >= 15) return {
    headline: 'Strong rewrite. Recruiter-ready.',
    subhead: "Every section pulled its weight. You're set to apply.",
    tone: 'gold',
  };
  if (delta >= 8) return {
    headline: 'Material improvements.',
    subhead: 'A few small tweaks could lift this further.',
    tone: 'emerald',
  };
  if (delta >= 3) return {
    headline: 'Sharper than before.',
    subhead: 'Polish landed where it mattered.',
    tone: 'cyan',
  };
  if (delta >= 1) return {
    headline: 'Refined.',
    subhead: 'Smaller gains — most of the value was already here.',
    tone: 'amber',
  };
  return {
    headline: 'Already strong.',
    subhead: 'We checked everything; nothing material to add.',
    tone: 'gray',
  };
}

export type Tier = 'foundation' | 'developing' | 'solid' | 'strong' | 'excellent';

export interface TierInfo {
  tier: Tier;
  label: string;
  tone: 'gray' | 'amber' | 'cyan' | 'emerald' | 'gold';
}

export function tierFromScore(score: number): TierInfo {
  if (score >= 90) return { tier: 'excellent', label: 'Excellent', tone: 'gold' };
  if (score >= 75) return { tier: 'strong', label: 'Strong', tone: 'emerald' };
  if (score >= 60) return { tier: 'solid', label: 'Solid', tone: 'cyan' };
  if (score >= 40) return { tier: 'developing', label: 'Developing', tone: 'amber' };
  return { tier: 'foundation', label: 'Foundation', tone: 'gray' };
}

// ── 12 dimensions → 4 user-facing buckets ───────────────────────────────────
export const BUCKET_DEFS: Array<{
  key: 'substance' | 'presentation' | 'role_alignment' | 'storytelling';
  label: string;
  dimensions: string[];
  blurb: string;
}> = [
  {
    key: 'substance',
    label: 'Substance',
    dimensions: ['experience', 'projects', 'skills', 'education', 'certifications'],
    blurb: 'What you bring to the table.',
  },
  {
    key: 'presentation',
    label: 'Presentation',
    dimensions: ['sections', 'formatting'],
    blurb: 'How readable it is for ATS and humans.',
  },
  {
    key: 'role_alignment',
    label: 'Role Alignment',
    dimensions: ['keywords', 'narrative'],
    blurb: 'How well it matches the target role.',
  },
  {
    key: 'storytelling',
    label: 'Storytelling',
    dimensions: ['impact', 'intensity', 'consistency'],
    blurb: 'How clearly you convey scope and ownership.',
  },
];

export interface BucketScore {
  key: BucketDef['key'];
  label: string;
  blurb: string;
  before: number;
  after: number;
  delta: number;
}

type BucketDef = (typeof BUCKET_DEFS)[number];

function avgOf(breakdown: Record<string, number> | undefined, keys: string[]): number {
  if (!breakdown) return 0;
  const vals = keys.map((k) => breakdown[k]).filter((v) => typeof v === 'number');
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/**
 * Compute per-bucket before/after scores. `beforeBreakdown` may be absent;
 * in that case use overall scaled value or 0 (UI hides bar).
 */
export function computeBuckets(
  afterBreakdown: Record<string, number> | undefined,
  beforeBreakdown?: Record<string, number>,
): BucketScore[] {
  return BUCKET_DEFS.map((b) => {
    const after = avgOf(afterBreakdown, b.dimensions);
    const before = beforeBreakdown ? avgOf(beforeBreakdown, b.dimensions) : after; // no Δ if before unknown
    return {
      key: b.key,
      label: b.label,
      blurb: b.blurb,
      before,
      after,
      delta: after - before,
    };
  });
}

/**
 * Sorted dimension delta list for the advanced "full breakdown" panel.
 */
export interface DimensionDelta {
  name: string;
  label: string;
  before: number;
  after: number;
  delta: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  sections: 'Section coverage',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  certifications: 'Certifications',
  impact: 'Impact metrics',
  keywords: 'Keyword alignment',
  formatting: 'Formatting',
  consistency: 'Internal consistency',
  intensity: 'Action verb density',
  narrative: 'Summary narrative',
  education: 'Education',
};

export function computeDimensionDeltas(
  afterBreakdown: Record<string, number> | undefined,
  beforeBreakdown?: Record<string, number>,
): DimensionDelta[] {
  if (!afterBreakdown) return [];
  const keys = Object.keys(afterBreakdown);
  const out = keys.map((k) => {
    const after = Math.round(afterBreakdown[k] ?? 0);
    const before = Math.round(beforeBreakdown?.[k] ?? after);
    return {
      name: k,
      label: DIMENSION_LABELS[k] || k,
      before,
      after,
      delta: after - before,
    };
  });
  out.sort((a, b) => b.delta - a.delta);
  return out;
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  return `${m}m ${r}s`;
}
