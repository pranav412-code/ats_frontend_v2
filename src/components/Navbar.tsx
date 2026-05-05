import React from 'react';
import { useResumeStore, Page } from '../store/useResumeStore';
import { FileText, Files, History, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

export function Navbar() {
  const { currentPage, setCurrentPage } = useResumeStore();

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'editor', label: 'Editor', icon: <FileText size={18} /> },
    { id: 'resumes', label: 'Resumes', icon: <Files size={18} /> },
    { id: 'history', label: 'History', icon: <History size={18} /> },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('resumes')}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">R</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xl tracking-tight hidden sm:block">Optimizer</span>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  currentPage === item.id
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
