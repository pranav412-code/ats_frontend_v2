import React from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { UploadSection } from '../components/UploadSection';
import { ResumePreview } from '../components/ResumePreview';
import { Download, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProcessingScreen } from '../components/ProcessingScreen';

export function EditorPage() {
  const { resumeData, appState, startOptimization } = useResumeStore();

  if (appState === 'processing') {
    return <ProcessingScreen />;
  }

  if (!resumeData) {
    return <UploadSection />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)] pt-6 pb-12 lg:pb-0">
      {/* Left side - Resume Preview container */}
      <div className="flex-1 lg:w-3/4 flex flex-col min-h-0 relative min-h-[600px] lg:min-h-0 lg:h-full">
        <ResumePreview />
      </div>

      {/* Right side - Actions Panel */}
      <div className="w-full lg:w-1/4 flex flex-col gap-6 lg:h-full">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col flex-shrink-0">
          <div className="space-y-3">
            <button
              onClick={() => startOptimization()}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all"
            >
              <Sparkles size={18} className="mr-2" />
              Optimize Resume
            </button>
            
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 rounded-xl font-medium shadow-sm transition-all"
            >
              <Download size={18} className="mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
