import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Key } from 'lucide-react';
import type { ResumeData } from '../../store/useResumeStore';

interface Props {
  resume: ResumeData;
  missing: string[];   // from backend
  // Optional: full JD keyword set if available. If absent, we derive
  // "covered" purely from missing's absence in resume text.
  jdKeywords?: string[];
}

function flattenResumeText(r: ResumeData): string {
  const parts: string[] = [];
  parts.push(r.personalInfo?.name || '');
  parts.push(r.summary || '');
  for (const e of r.experience || []) {
    parts.push(e.role, e.company, ...(e.bullets || []));
  }
  for (const p of r.projects || []) {
    parts.push(p.title, p.description || '', ...(p.bullets || []), ...(p.technologies || []));
  }
  if (r.skills) {
    if (Array.isArray(r.skills)) {
      parts.push(...r.skills);
    } else {
      parts.push(...(r.skills.technical || []));
      parts.push(...(r.skills.soft || []));
      parts.push(...(r.skills.tools || []));
    }
  }
  return parts.join(' ').toLowerCase();
}

const MAX_MISSING_DISPLAY = 5;

export function KeywordCoverage({ resume, missing, jdKeywords }: Props) {
  const [showAllMissing, setShowAllMissing] = useState(false);

  const haystack = useMemo(() => flattenResumeText(resume), [resume]);

  const covered = useMemo(() => {
    if (!jdKeywords || jdKeywords.length === 0) return [];
    return jdKeywords.filter((k) => haystack.includes(k.toLowerCase())).slice(0, 12);
  }, [haystack, jdKeywords]);

  if (missing.length === 0 && covered.length === 0) return null;

  const missingDisplay = showAllMissing ? missing : missing.slice(0, MAX_MISSING_DISPLAY);

  return (
    <section className="border border-zinc-300 dark:border-zinc-700 p-6 sm:p-8 mb-10">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700 dark:text-zinc-300 mb-3">
        <Key size={12} />
        Keyword Coverage
      </div>
      <p className="font-serif italic text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-2xl">
        How your resume tracks against your target role.
      </p>

      {covered.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">
            <CheckCircle2 size={11} />
            Now Covered
          </div>
          <div className="flex flex-wrap gap-2">
            {covered.map((kw, i) => (
              <motion.span
                key={kw}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="px-2.5 py-1 border border-emerald-700/40 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 bg-emerald-500/[0.06] font-mono text-[11px] uppercase tracking-wider"
              >
                {kw}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Still Missing {missing.length > MAX_MISSING_DISPLAY ? `· top ${MAX_MISSING_DISPLAY} of ${missing.length}` : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingDisplay.map((kw, i) => (
              <motion.span
                key={kw}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="px-2.5 py-1 border border-amber-700/40 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/[0.06] font-mono text-[11px] uppercase tracking-wider"
              >
                {kw}
              </motion.span>
            ))}
          </div>
          {missing.length > MAX_MISSING_DISPLAY && (
            <button
              type="button"
              onClick={() => setShowAllMissing((v) => !v)}
              className="mt-3 inline-flex items-center text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors"
            >
              {showAllMissing ? 'Show fewer' : `Show all ${missing.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
