import React, { useEffect } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function PaymentSuccessPage() {
  const { setCurrentPage, fetchCredits, fetchSubscription, fetchEntitlement } = useResumeStore();

  useEffect(() => {
    void Promise.all([fetchCredits(), fetchSubscription(), fetchEntitlement()]);
  }, [fetchCredits, fetchSubscription, fetchEntitlement]);

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-8">
        <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      
      <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
        Payment <span className="italic font-normal text-emerald-600 dark:text-emerald-400">Successful</span>
      </h1>
      
      <p className="text-zinc-600 dark:text-zinc-400 mb-12 max-w-md">
        Your credits have been added to your account. You're all set to start optimizing your resumes and landing those interviews.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentPage('home')}
          className="inline-flex items-center justify-center px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => setCurrentPage('transactions')}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors"
        >
          View Receipt <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
