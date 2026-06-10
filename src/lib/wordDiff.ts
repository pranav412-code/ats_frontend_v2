/**
 * Simple word-level diff via LCS (Longest Common Subsequence).
 * Bullets are short, O(n*m) DP is fine.
 *
 * Output preserves whitespace approximately by re-joining segments with spaces.
 */

export type DiffKind = 'same' | 'removed' | 'added';

export interface DiffSegment {
  type: DiffKind;
  text: string;
}

function tokenize(s: string): string[] {
  // Split on whitespace, keep punctuation attached to words.
  return s.split(/\s+/).filter(Boolean);
}

function lcsTable(a: string[], b: string[]): number[][] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

export function diffWords(before: string, after: string): DiffSegment[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const dp = lcsTable(a, b);

  const segments: DiffSegment[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      segments.unshift({ type: 'same', text: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      segments.unshift({ type: 'removed', text: a[i - 1] });
      i--;
    } else {
      segments.unshift({ type: 'added', text: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    segments.unshift({ type: 'removed', text: a[i - 1] });
    i--;
  }
  while (j > 0) {
    segments.unshift({ type: 'added', text: b[j - 1] });
    j--;
  }

  // Coalesce consecutive segments of the same type.
  const out: DiffSegment[] = [];
  for (const seg of segments) {
    const prev = out[out.length - 1];
    if (prev && prev.type === seg.type) prev.text += ' ' + seg.text;
    else out.push({ ...seg });
  }
  return out;
}

/**
 * Detect new keywords added (heuristic): words in `after` but not in `before`,
 * filtered to non-stopword tokens of length >= 3.
 */
const STOPWORDS = new Set([
  'and','the','for','with','was','were','are','from','into','that','this',
  'have','has','had','will','would','their','they','them','our','your','its',
  'who','what','when','where','how','than','then','also','some','any','all',
  'one','two','out','off','put','his','her','him','she',
]);

export function newTokens(before: string, after: string, max = 6): string[] {
  const beforeSet = new Set(tokenize(before).map((t) => t.toLowerCase().replace(/[^\w]/g, '')));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tok of tokenize(after)) {
    const norm = tok.toLowerCase().replace(/[^\w]/g, '');
    if (!norm || norm.length < 3) continue;
    if (STOPWORDS.has(norm)) continue;
    if (beforeSet.has(norm)) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push(tok.replace(/[.,;:]+$/g, ''));
    if (result.length >= max) break;
  }
  return result;
}

/**
 * Pair bullets from before/after by max token-overlap so reorders don't
 * mis-diff. Returns array of [beforeBullet | null, afterBullet | null].
 */
export function pairBullets(
  before: string[],
  after: string[],
): Array<[string | null, string | null]> {
  const beforeRemaining = new Set(before.map((_, i) => i));
  const afterRemaining = new Set(after.map((_, i) => i));
  const pairs: Array<[string | null, string | null]> = [];

  // Score every (b, a) pair, pick highest, repeat.
  const candidates: Array<{ b: number; a: number; score: number }> = [];
  for (const bi of beforeRemaining) {
    const bTok = new Set(tokenize(before[bi]).map((t) => t.toLowerCase()));
    for (const ai of afterRemaining) {
      const aTok = new Set(tokenize(after[ai]).map((t) => t.toLowerCase()));
      let overlap = 0;
      for (const t of bTok) if (aTok.has(t)) overlap++;
      const denom = Math.max(bTok.size, aTok.size) || 1;
      candidates.push({ b: bi, a: ai, score: overlap / denom });
    }
  }
  candidates.sort((x, y) => y.score - x.score);
  for (const c of candidates) {
    if (!beforeRemaining.has(c.b) || !afterRemaining.has(c.a)) continue;
    if (c.score < 0.2) continue; // too dissimilar, treat as separate
    pairs.push([before[c.b], after[c.a]]);
    beforeRemaining.delete(c.b);
    afterRemaining.delete(c.a);
  }
  // Unmatched remainders.
  for (const bi of beforeRemaining) pairs.push([before[bi], null]);
  for (const ai of afterRemaining) pairs.push([null, after[ai]]);

  return pairs;
}
