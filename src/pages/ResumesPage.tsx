import React, { useState, useMemo, useEffect } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { FileText, Plus, ArrowRight, Trash2, Files, ChevronLeft, ChevronRight, Loader2, Lock, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function ResumesPage() {
  const { resumes, resumesLoading, openResume, deleteResume, createResume, goToUpload, entitlement, slotError, clearSlotError } = useResumeStore();
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const slotsFull = entitlement ? entitlement.slots_available <= 0 : false;

  const handleCreateNew = () => createResume();
  const handleUploadResume = () => goToUpload();

  useEffect(() => {
    // Reset page if resumes length changes drastically (e.g. all deleted)
    const maxPage = Math.max(1, Math.ceil(resumes.length / itemsPerPage));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [resumes.length, page, itemsPerPage]);

  const paginatedResumes = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return resumes.slice(start, start + itemsPerPage);
  }, [resumes, page, itemsPerPage]);

  const totalPages = Math.ceil(resumes.length / itemsPerPage);

  const scoredResumes = resumes.filter(r => typeof r.latestScore === 'number' && r.latestScore !== null);
  const totalResumes = resumes.length;
  const averageScore = scoredResumes.length > 0
    ? Math.round(scoredResumes.reduce((sum, r) => sum + (r.latestScore || 0), 0) / scoredResumes.length)
    : 0;
  const highestScore = scoredResumes.length > 0
    ? Math.max(...scoredResumes.map(r => r.latestScore || 0))
    : 0;
  const optimizedCount = scoredResumes.length;

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });

  return (
    <div className="w-full px-6 lg:px-10 pt-6 pb-16">
      {/* Masthead */}
      <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3 mb-8 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
        <span>Issue 01 · ResumeCraft</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Section · Library</span>
      </div>

      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 mb-8 border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">⟶ The Library</p>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[0.95]">
            My
            <span className="italic font-normal text-zinc-700 dark:text-zinc-300"> Resumes</span>
          </h1>
          <p className="font-serif italic text-base text-zinc-600 dark:text-zinc-400 mt-3 max-w-xl">
            Your collected drafts — view, optimize, and refine.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {entitlement && (
            <span className={cn(
              'text-[10px] font-mono uppercase tracking-widest',
              slotsFull ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'
            )}>
              {entitlement.slots_used} / {entitlement.slot_limit} slots used
            </span>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUploadResume}
              disabled={slotsFull}
              title={slotsFull ? 'Slot limit reached — delete a resume or upgrade' : undefined}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-100 font-mono uppercase tracking-widest text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Upload Resume
            </button>
            <button
              onClick={handleCreateNew}
              disabled={slotsFull}
              title={slotsFull ? 'Slot limit reached — delete a resume or upgrade' : undefined}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={13} strokeWidth={2.5} />
              New Resume
            </button>
          </div>
        </div>
      </div>

      {/* Slot-limit error banner */}
      {slotError && (
        <div className="mb-6 p-3 border border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{slotError}</span>
          <button onClick={clearSlotError} aria-label="Dismiss" className="shrink-0 hover:opacity-70">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Over-limit hint */}
      {slotsFull && !slotError && (
        <div className="mb-6 p-3 border border-amber-300 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-2 text-amber-800 dark:text-amber-400 text-sm">
          <Lock size={15} className="shrink-0 mt-0.5" />
          <span>Slot limit reached ({entitlement?.slot_limit}). Delete a resume or upgrade your plan to add more.</span>
        </div>
      )}

      {/* Stats strip */}


      {resumesLoading && resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] border border-dashed border-zinc-400 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/30 px-8 py-16 text-center">
          <Loader2 size={32} strokeWidth={1.5} className="text-zinc-700 dark:text-zinc-300 animate-spin mb-5" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-2">
            Loading Library
          </p>
          <h3 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Fetching your <span className="italic font-normal text-zinc-700 dark:text-zinc-300">resumes</span>
          </h3>
          <p className="font-serif italic text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            One moment while we pull your drafts.
          </p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] border border-dashed border-zinc-400 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/30 px-8 py-16 text-center">
          <Files size={32} strokeWidth={1.5} className="text-zinc-700 dark:text-zinc-300 mb-4" />
          <h3 className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            No resumes <span className="italic font-normal text-zinc-700 dark:text-zinc-300">yet</span>
          </h3>
          <p className="font-serif italic text-base text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
            Begin by uploading a draft or creating a blank canvas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} />
              Create New
            </button>
            <button
              onClick={handleUploadResume}
              className="inline-flex items-center px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-100 font-mono uppercase tracking-widest text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Upload Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 border-t border-l border-zinc-300 dark:border-zinc-700">
            {paginatedResumes.map(resume => {
              return (
                <div
                  key={resume.id}
                  className={cn(
                    'group relative flex flex-col border-r border-b border-zinc-300 dark:border-zinc-700 transition-colors',
                    resume.locked
                      ? 'bg-zinc-100/60 dark:bg-zinc-950/40'
                      : 'bg-white/60 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  )}
                >
                  <div
                    className="p-6 cursor-pointer flex-1"
                    onClick={() => openResume(resume.id)}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                        <FileText size={12} />
                        <span>Draft</span>
                      </div>
                      {resume.locked && (
                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400">
                          <Lock size={11} /> Locked
                        </div>
                      )}
                    </div>

                    <h3 className={cn(
                      'font-serif text-2xl font-bold mb-2 leading-tight line-clamp-2 transition-all',
                      resume.locked ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-50 group-hover:italic'
                    )}>
                      {resume.title}
                    </h3>
                    <p className="font-serif italic text-sm text-zinc-500 dark:text-zinc-500">
                      {resume.locked
                        ? 'Read-only · over plan limit'
                        : `Updated ${new Date(resume.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>

                  <div className="px-6 py-3 border-t border-zinc-300 dark:border-zinc-700 flex items-center justify-between">
                    <button
                      onClick={() => openResume(resume.id)}
                      className="text-[11px] font-mono uppercase tracking-widest font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 hover:gap-2.5 transition-all"
                    >
                      {resume.locked ? 'View' : 'Open Editor'}
                      <ArrowRight size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResume(resume.id);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-600 transition-colors"
                      title="Delete Resume"
                      aria-label="Delete Resume"
                    >
                      <Trash2 size={14} />
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
