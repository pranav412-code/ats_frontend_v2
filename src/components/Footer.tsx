import React from 'react';
import { useResumeStore, Page } from '../store/useResumeStore';

export function Footer() {
  const { setCurrentPage } = useResumeStore();
  const year = new Date().getFullYear();

  const cols: { heading: string; links: { label: string; page?: Page }[] }[] = [
    {
      heading: 'Product',
      links: [
        { label: 'Dashboard', page: 'home' },
        { label: 'Editor', page: 'editor' },
        { label: 'My Resumes', page: 'resumes' },
        { label: 'History', page: 'history' },
      ],
    },
    {
      heading: 'Account',
      links: [
        { label: 'Profile', page: 'profile' },
        { label: 'Security', page: 'security' },
        { label: 'Subscription', page: 'subscription' },
        { label: 'Transactions', page: 'transactions' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Terms of Service', page: 'terms' },
        { label: 'Privacy Policy', page: 'privacy' },
        { label: 'Refund Policy', page: 'refund' },
        { label: 'Feedback', page: 'contact' },
      ],
    },
  ];

  return (
    <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-300 dark:border-zinc-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" className="h-10 w-auto object-contain" alt="ResumeCraft Logo" />
              <span className="font-serif text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                ResumeCraft
              </span>
            </div>
            <p className="font-serif italic text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              ATS-grade resume optimization. Tailored, scored, and refined for every application.
            </p>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400 mt-4">
              Beta · v0.1
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-900 dark:text-zinc-100 font-bold mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => link.page && setCurrentPage(link.page)}
                      className="font-serif text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:italic transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom rule */}
        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
            © {year} ResumeCraft · All rights reserved
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
            Built for job seekers
          </span>
        </div>
      </div>
    </footer>
  );
}
