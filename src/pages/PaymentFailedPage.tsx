import React from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export function PaymentFailedPage() {
  const { setCurrentPage } = useResumeStore();

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-8">
        <AlertCircle size={40} className="text-rose-600 dark:text-rose-400" />
      </div>
      
      <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
        Payment <span className="italic font-normal text-rose-600 dark:text-rose-400">Failed</span>
      </h1>
      
      <p className="text-zinc-600 dark:text-zinc-400 mb-12 max-w-md">
        We were unable to process your payment. Your account has not been charged. Please try again or use a different payment method.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentPage('pricing')}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
        >
          <RefreshCcw size={14} /> Try Again
        </button>
        <button
          onClick={() => setCurrentPage('home')}
          className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
