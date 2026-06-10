import React, { useState, useRef, useEffect } from 'react';
import { useResumeStore, Page } from '../store/useResumeStore';
import { useAuthStore } from '../store/useAuthStore';
import { FileText, Files, History, Home, User, LogOut, CreditCard, Receipt, ChevronDown, Sparkles, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { CreditIndicator } from './CreditIndicator';

export function Navbar() {
  const { currentPage, setCurrentPage, subscription } = useResumeStore();
  const { signOut } = useAuthStore();
  const [billingOpen, setBillingOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const billingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (billingRef.current && !billingRef.current.contains(e.target as Node)) setBillingOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (p: Page) => {
    setCurrentPage(p);
    setBillingOpen(false);
    setMobileOpen(false);
  };

  const mainNav: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={14} /> },
    { id: 'editor', label: 'Editor', icon: <FileText size={14} /> },
    { id: 'resumes', label: 'Resumes', icon: <Files size={14} /> },
    { id: 'history', label: 'History', icon: <History size={14} /> },
  ];

  const billingActive = currentPage === 'subscription' || currentPage === 'transactions' || currentPage === 'pricing';
  const planLabel = subscription?.active ? subscription.label : 'Free plan';

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-300 dark:border-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand — wordmark placeholder until logo finalized.
              When logo lands, swap the <div className="w-9 h-9..."> below
              with <img src="/logo.svg" className="w-9 h-9" alt="ResumeCraft" />
              Everything else stays. */}
          <button className="flex items-center gap-3 group" onClick={() => go('home')}>
            <img src="/logo.png" className="h-10 w-auto object-contain" alt="ResumeCraft Logo" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-serif text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                ResumeCraft
              </span>
              <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-500 mt-0.5">
                Beta · v0.1
              </span>
            </div>
          </button>

          {/* Center nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNav.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 font-mono uppercase tracking-widest text-[11px] font-bold border-b-2 transition-colors',
                    active
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                  )}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <CreditIndicator />

            {/* Billing dropdown */}
            <div className="relative hidden sm:block" ref={billingRef}>
              <button
                onClick={() => setBillingOpen((o) => !o)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 font-mono uppercase tracking-widest text-[11px] font-bold border transition-colors',
                  billingActive
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100'
                )}
              >
                <CreditCard size={14} />
                <span className="hidden md:inline">Billing</span>
                <ChevronDown size={12} className={cn('transition-transform', billingOpen && 'rotate-180')} />
              </button>

              {billingOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-1">Current Plan</p>
                    <p className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-50">{planLabel}</p>
                    {subscription?.active && (
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {subscription.credits_per_month} cr/mo · {subscription.resume_slots} slots
                      </p>
                    )}
                  </div>
                  {[
                    { p: 'subscription' as Page, icon: <CreditCard size={14} />, label: 'Manage Subscription' },
                    { p: 'transactions' as Page, icon: <Receipt size={14} />, label: 'Transaction History' },
                    { p: 'pricing' as Page, icon: <Sparkles size={14} />, label: 'View Plans' },
                  ].map((it, i) => (
                    <button
                      key={it.p}
                      onClick={() => go(it.p)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 font-mono uppercase tracking-widest text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors',
                        i === 2 && 'border-t border-zinc-200 dark:border-zinc-800'
                      )}
                    >
                      {it.icon} {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <button
              onClick={() => go('profile')}
              className={cn(
                'hidden sm:flex items-center justify-center w-9 h-9 border transition-colors',
                currentPage === 'profile'
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100'
              )}
              title="Profile"
            >
              <User size={15} />
            </button>

            {/* Sign out */}
            <button
              onClick={() => signOut()}
              className="hidden sm:flex items-center justify-center w-9 h-9 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden flex items-center justify-center w-9 h-9 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            {[...mainNav,
              { id: 'profile' as Page, label: 'Profile', icon: <User size={14} /> },
              { id: 'subscription' as Page, label: 'Subscription', icon: <CreditCard size={14} /> },
              { id: 'transactions' as Page, label: 'Transactions', icon: <Receipt size={14} /> },
              { id: 'pricing' as Page, label: 'Plans', icon: <Sparkles size={14} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 font-mono uppercase tracking-widest text-[11px] font-bold border transition-colors',
                  currentPage === item.id
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                )}
              >
                {item.icon} {item.label}
              </button>
            ))}
            <button
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 font-mono uppercase tracking-widest text-[11px] font-bold border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
