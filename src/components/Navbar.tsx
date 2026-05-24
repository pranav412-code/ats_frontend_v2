import React from 'react';
import { useResumeStore, Page } from '../store/useResumeStore';
import { FileText, Files, History } from 'lucide-react';
import { cn } from '../lib/utils';

export function Navbar() {
  const { currentPage, setCurrentPage } = useResumeStore();

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'editor', label: 'Editor', icon: <FileText size={14} /> },
    { id: 'resumes', label: 'Resumes', icon: <Files size={14} /> },
    { id: 'history', label: 'History', icon: <History size={14} /> },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-300 dark:border-zinc-700">
      {/* Top kicker rule (editorial dateline) */}
      <div className="w-full px-6 lg:px-10 border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="flex items-center justify-between py-1.5 text-[9px] font-mono uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-500">
          <span>Vol. 01</span>
          <span className="hidden md:inline">The Resume Optimizer · Editorial Edition</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </div>

      <div className="w-full px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            className="flex items-baseline gap-3 cursor-pointer select-none"
            onClick={() => setCurrentPage('resumes')}
          >
            <div className="w-9 h-9 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <span className="font-serif font-bold text-xl leading-none text-zinc-50 dark:text-zinc-900">
                R
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Optimizer
              </span>
              <span className="hidden sm:inline font-serif italic text-sm text-zinc-500 dark:text-zinc-400">
                · Resume Lab
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-stretch border border-zinc-300 dark:border-zinc-700">
            {navItems.map((item, idx) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.2em] font-bold transition-colors',
                    idx > 0 && 'border-l border-zinc-300 dark:border-zinc-700',
                    active
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={cn('shrink-0', active ? '' : 'opacity-70 group-hover:opacity-100')}>
                    {item.icon}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
