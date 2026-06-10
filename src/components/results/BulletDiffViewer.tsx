import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, FileText, Briefcase, Code } from 'lucide-react';
import type { ResumeData } from '../../store/useResumeStore';
import { diffWords, newTokens, pairBullets, type DiffSegment } from '../../lib/wordDiff';

interface Props {
  before: ResumeData | null;
  after: ResumeData;
}

interface DiffGroup {
  id: string;
  section: 'Summary' | 'Experience' | 'Projects';
  title: string;
  subtitle?: string;
  date?: string;
  pairs: Array<[string | null, string | null]>;
}

function buildDiffGroups(before: ResumeData | null, after: ResumeData): DiffGroup[] {
  if (!before) return [];
  const groups: DiffGroup[] = [];

  // 1. Summary
  if (before.summary !== after.summary && (before.summary || after.summary)) {
    groups.push({
      id: 'summary',
      section: 'Summary',
      title: 'Professional Summary',
      pairs: [[before.summary || null, after.summary || null]],
    });
  }

  // 2. Experience
  const beforeExpByKey = new Map<string, string[]>();
  for (const exp of before.experience ?? []) {
    const key = `${(exp.company || '').toLowerCase().trim()}|${(exp.role || '').toLowerCase().trim()}`;
    beforeExpByKey.set(key, exp.bullets || []);
  }

  for (const exp of after.experience ?? []) {
    const key = `${(exp.company || '').toLowerCase().trim()}|${(exp.role || '').toLowerCase().trim()}`;
    const bBullets = beforeExpByKey.get(key) || [];
    const aBullets = exp.bullets || [];
    const pairs = pairBullets(bBullets, aBullets);
    
    // Only add if there are actual changes
    if (pairs.some(p => bulletHasChange(p))) {
      groups.push({
        id: `exp-${key}`,
        section: 'Experience',
        title: exp.company || 'Company',
        subtitle: exp.role || 'Role',
        date: exp.date || '',
        pairs: pairs,
      });
    }
  }

  // 3. Projects
  const beforeProjByKey = new Map<string, string[]>();
  for (const proj of before.projects ?? []) {
    const key = (proj.title || '').toLowerCase().trim();
    beforeProjByKey.set(key, proj.bullets || []);
  }

  for (const proj of after.projects ?? []) {
    const key = (proj.title || '').toLowerCase().trim();
    const bBullets = beforeProjByKey.get(key) || [];
    const aBullets = proj.bullets || [];
    const pairs = pairBullets(bBullets, aBullets);
    
    if (pairs.some(p => bulletHasChange(p))) {
      groups.push({
        id: `proj-${key}`,
        section: 'Projects',
        title: proj.title || 'Project',
        date: proj.date || '',
        pairs: pairs,
      });
    }
  }

  return groups;
}

function bulletHasChange(pair: [string | null, string | null]): boolean {
  const [b, a] = pair;
  if (b == null || a == null) return true;
  return b.trim() !== a.trim();
}

function renderDiffLine(segments: DiffSegment[], side: 'before' | 'after'): React.ReactNode {
  return segments
    .filter((s) => (side === 'before' ? s.type !== 'added' : s.type !== 'removed'))
    .map((s, i) => {
      if (s.type === 'same') {
        return (
          <span key={i} className="text-zinc-700 dark:text-zinc-300">
            {s.text}{' '}
          </span>
        );
      }
      if (s.type === 'removed' && side === 'before') {
        return (
          <span key={i} className="text-zinc-500 dark:text-zinc-500 opacity-60 line-through decoration-zinc-400">
            {s.text}{' '}
          </span>
        );
      }
      if (s.type === 'added' && side === 'after') {
        return (
          <span
            key={i}
            className="text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 px-0.5 rounded-sm"
          >
            {s.text}{' '}
          </span>
        );
      }
      return null;
    });
}

function SectionIcon({ section }: { section: string }) {
  if (section === 'Summary') return <FileText size={14} className="text-indigo-500" />;
  if (section === 'Projects') return <Code size={14} className="text-indigo-500" />;
  return <Briefcase size={14} className="text-indigo-500" />;
}

export function BulletDiffViewer({ before, after }: Props) {
  const [showAll, setShowAll] = useState(false);
  const groups = useMemo(() => buildDiffGroups(before, after), [before, after]);

  if (!before || groups.length === 0) {
    return null;
  }

  const visible = showAll ? groups : groups.slice(0, 3);

  return (
    <section className="border border-zinc-300 dark:border-zinc-700 p-6 sm:p-8 mb-10 rounded-xl bg-white dark:bg-zinc-900/50 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700 dark:text-zinc-300 mb-1">
        <Sparkles size={12} className="text-indigo-500" />
        What Changed
      </div>
      <p className="font-sans text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-2xl">
        Review the exact edits made to your resume content to improve ATS alignment.
      </p>

      <div className="space-y-10">
        {visible.map((group, i) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <SectionIcon section={group.section} />
              <div>
                <h3 className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-baseline gap-2">
                  {group.title}
                  {group.date && (
                    <span className="font-mono text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      {group.date}
                    </span>
                  )}
                </h3>
                {group.subtitle && (
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    {group.subtitle}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
            {group.pairs.map((pair, pi) => {
              const [bf, af] = pair;
              if (!bulletHasChange(pair)) {
                return (
                  <div key={pi} className="text-[11px] font-mono italic text-zinc-400 dark:text-zinc-600 my-1.5 px-3 border-l-2 border-transparent">
                    · Unchanged
                  </div>
                );
              }
              if (bf == null && af != null) {
                return (
                  <div key={pi} className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-3 rounded-md bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                    <div className="text-[11px] font-mono italic text-zinc-400 dark:text-zinc-600 self-center">
                      (new addition)
                    </div>
                    <p className="text-sm font-serif text-zinc-900 dark:text-zinc-100 leading-relaxed">
                      <span className="bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 px-1 rounded-sm">{af}</span>
                    </p>
                  </div>
                );
              }
              if (bf != null && af == null) {
                return (
                  <div key={pi} className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-3 rounded-md bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                    <p className="text-sm font-serif text-zinc-500 dark:text-zinc-500 leading-relaxed opacity-70 line-through">
                      {bf}
                    </p>
                    <div className="text-[11px] font-mono italic text-zinc-400 dark:text-zinc-600 self-center">
                      (removed)
                    </div>
                  </div>
                );
              }
              const segs = diffWords(bf!, af!);
              const added = newTokens(bf!, af!, 5);
              return (
                <div key={pi} className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                  <div className="pr-2 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800/50 pb-2 md:pb-0">
                    <p className="text-sm font-serif leading-relaxed">
                      {renderDiffLine(segs, 'before')}
                    </p>
                  </div>
                  <div className="pl-0 md:pl-2 pt-2 md:pt-0">
                    <p className="text-sm font-serif leading-relaxed">
                      {renderDiffLine(segs, 'after')}
                    </p>
                    {added.length > 0 && (
                      <p className="mt-2.5 text-[10px] font-mono tracking-wide text-indigo-600 dark:text-indigo-400">
                        ✦ Keys added: {added.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </motion.div>
        ))}
      </div>

      {groups.length > 3 && (
        <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          >
            {showAll ? 'Show less' : `View all ${groups.length} edits`}
          </button>
        </div>
      )}
    </section>
  );
}
