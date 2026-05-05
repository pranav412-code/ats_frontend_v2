import React from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { History, TrendingUp, Presentation, ArrowRight } from 'lucide-react';

export function HistoryPage() {
  const { history, openResume } = useResumeStore();

  return (
    <div className="w-full flex flex-col pt-8 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Optimization History</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track how your resumes have improved over time.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 bg-white dark:bg-zinc-900/30 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
            <History size={32} />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No history yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400">
            Optimize a resume to see its performance improvements here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((run) => (
            <div key={run.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:mb-0 mb-4">
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                  <Presentation size={18} className="mr-2 text-blue-500" />
                  {run.resumeTitle}
                </h4>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center">
                  {new Date(run.timestamp).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between sm:gap-8">
                <div className="flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                  <div className="text-center">
                    <span className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Before</span>
                    <span className="text-lg font-medium text-zinc-600 dark:text-zinc-400">{run.beforeScore}</span>
                  </div>
                  <ArrowRight size={16} className="text-zinc-300 dark:text-zinc-600" />
                  <div className="text-center">
                    <span className="block text-xs text-green-600 dark:text-green-500 uppercase tracking-widest font-semibold mb-0.5">After</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{run.afterScore}</span>
                  </div>
                  <div className="ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center">
                    <TrendingUp size={16} className="text-green-500 mb-0.5" />
                    <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 rounded">
                      +{run.afterScore - run.beforeScore}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openResume(run.resumeId)}
                  className="hidden sm:block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
