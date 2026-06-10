import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ArrowLeft } from 'lucide-react';

/**
 * Shared layout for legal pages — masthead, back button, serif body, last-
 * updated stamp. Keeps Privacy / Terms / Refund / Contact visually consistent.
 */
export function LegalLayout({
  title,
  kicker,
  lastUpdated,
  children,
}: {
  title: string;
  kicker: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  const { setCurrentPage } = useResumeStore();

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12">
      <button
        onClick={() => setCurrentPage('home')}
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
      >
        <ArrowLeft size={12} /> Back to Home
      </button>

      <div className="border-b border-zinc-300 dark:border-zinc-700 pb-6 mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500 mb-3">
          {kicker}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          {title}
        </h1>
        <p className="font-serif italic text-sm text-zinc-500 dark:text-zinc-400 mt-4">
          Last updated · {lastUpdated}
        </p>
      </div>

      <div className="font-serif text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2]:dark:text-zinc-50 [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-zinc-900 [&_h3]:dark:text-zinc-50 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:text-[15px] [&_a]:text-zinc-900 [&_a]:dark:text-zinc-100 [&_a]:underline [&_strong]:text-zinc-900 [&_strong]:dark:text-zinc-50">
        {children}
      </div>
    </div>
  );
}
