import React, { useState, useMemo, useEffect } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { History, ArrowRight, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

export function HistoryPage() {
  const { history, openResume } = useResumeStore();
  const [sortBy, setSortBy] = useState<'date' | 'improvement'>('date');
  const [filterResumeId, setFilterResumeId] = useState<string>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setPage(1);
  }, [sortBy, filterResumeId]);

  const filteredAndSortedHistory = useMemo(() => {
    let result = [...history];
    if (filterResumeId !== 'all') {
      result = result.filter(r => r.resumeId === filterResumeId);
    }
    result.sort((a, b) => {
      if (sortBy === 'date') return b.timestamp - a.timestamp;
      return (b.afterScore - b.beforeScore) - (a.afterScore - a.beforeScore);
    });
    return result;
  }, [history, sortBy, filterResumeId]);

  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAndSortedHistory.slice(start, start + itemsPerPage);
  }, [filteredAndSortedHistory, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);

  const uniqueResumes = useMemo(() => {
    const map = new Map<string, string>();
    history.forEach(h => map.set(h.resumeId, h.resumeTitle));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [history]);

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });

  return (
    <div className="w-full px-6 lg:px-10 pt-6 pb-16">
      {/* Masthead */}
      <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3 mb-8 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
        <span>Issue 01 · ResumeCraft</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Section · Archive</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 mb-8 border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">⟶ The Archive</p>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[0.95]">
            Optimization
            <span className="italic font-normal text-zinc-700 dark:text-zinc-300"> History</span>
          </h1>
          <p className="font-serif italic text-base text-zinc-600 dark:text-zinc-400 mt-3 max-w-xl">
            A chronicle of every score lifted and bullet rewritten.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <SelectField
              label="Resume"
              value={filterResumeId}
              onChange={(v) => setFilterResumeId(v)}
              options={[
                { value: 'all', label: 'All Resumes' },
                ...uniqueResumes.map((r) => ({ value: r.id, label: r.title })),
              ]}
            />
            <SelectField
              label="Sort"
              value={sortBy}
              onChange={(v) => setSortBy(v as 'date' | 'improvement')}
              options={[
                { value: 'date', label: 'Most Recent' },
                { value: 'improvement', label: 'Highest Lift' },
              ]}
            />
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed border-zinc-400 dark:border-zinc-700 px-8 py-16 text-center bg-white/40 dark:bg-zinc-900/30">
          <History size={28} className="text-zinc-700 dark:text-zinc-300 mb-4" />
          <h3 className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Nothing in the <span className="italic font-normal">archive</span>
          </h3>
          <p className="font-serif italic text-base text-zinc-500 dark:text-zinc-500 max-w-md">
            Run an optimization in the Editor to populate your archive.
          </p>
        </div>
      ) : filteredAndSortedHistory.length === 0 ? (
        <div className="py-16 text-center font-serif italic text-zinc-500 dark:text-zinc-500">
          No optimization logs match your current filters.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="border border-zinc-300 dark:border-zinc-700 divide-y divide-zinc-300 dark:divide-zinc-700">
            {paginatedHistory.map((run) => {
              const scoreDiff = run.afterScore - run.beforeScore;

              return (
                <div
                  key={run.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 py-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-2">
                      <Calendar size={11} />
                      {new Date(run.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <h4
                      className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 truncate cursor-pointer group-hover:italic transition-all"
                      onClick={() => openResume(run.resumeId)}
                    >
                      {run.resumeTitle}
                    </h4>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                    <div className="flex items-baseline gap-3">
                      <div className="text-right">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Before</p>
                        <p className="font-serif text-3xl font-bold text-zinc-500 dark:text-zinc-500 tabular-nums leading-none mt-1">
                          {run.beforeScore}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-zinc-400 mt-3" />
                      <div className="text-left">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">After</p>
                        <p className="font-serif text-4xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums leading-none mt-1">
                          {run.afterScore}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-center pl-6 border-l border-zinc-300 dark:border-zinc-700">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Lift</p>
                      <p className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums leading-none mt-1">
                        +{scoreDiff}
                      </p>
                    </div>

                    <button
                      onClick={() => openResume(run.resumeId)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest font-bold text-zinc-900 dark:text-zinc-100 hover:gap-2.5 transition-all"
                    >
                      Open
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 0 && (
            <div className="flex items-center justify-between border-t border-zinc-300 dark:border-zinc-700 pt-6">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center w-8 h-8 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center justify-center w-8 h-8 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 border border-zinc-300 dark:border-zinc-700 px-3 py-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-xs font-mono uppercase tracking-wider text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer font-bold border-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white dark:bg-zinc-900">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
