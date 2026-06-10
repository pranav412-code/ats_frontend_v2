import React, { useState, useRef } from 'react';
import { useResumeStore, convertToFrontend, mockResumeData } from '../store/useResumeStore';
import { UploadCloud, Plus, Loader2, AlertCircle, FileText, Zap, Shield, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchApi } from '../lib/api';

export function UploadSection() {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadResume, createResume } = useResumeStore();

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setErrorText(null);
    setStatusText('Uploading resume to server...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // fetchApi attaches Supabase Bearer token + base URL. Upload + parse
      // both require auth now. `/upload` returns a `file_token` (basename
      // only) — passing this instead of an absolute path closes the
      // path-traversal hole previously open on /parse.
      const uploadData = await fetchApi('/upload', {
        method: 'POST',
        body: formData,
      });
      const fileToken = uploadData.file_token ?? uploadData.file_path; // fallback during rollout
      const sessionId: string | undefined = uploadData.session_id;

      setStatusText('Parsing resume layout...');
      const parsedSchema = await fetchApi('/parse', {
        method: 'POST',
        body: JSON.stringify({ file_token: fileToken }),
      });
      setStatusText('Normalizing resume data...');
      const frontendData = convertToFrontend(parsedSchema);
      // Forward source metadata so the resume row gets its provenance
      // (source_session_id / filename / ext) on insert.
      uploadResume(frontendData, file.name, {
        sessionId,
        ext: file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
      });
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'An error occurred while uploading or parsing the resume.');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

  return (
    <div className="w-full px-6 lg:px-10 py-8">
      {/* Masthead */}
      <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3 mb-10 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
        <span>Issue 01 · ResumeCraft</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Section · Editor</span>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: title + copy */}
        <div className="lg:col-span-7">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-500 mb-4">
            ⟶ Begin a New Brief
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-zinc-50 leading-[0.95] tracking-tight">
            Craft a resume that
            <span className="italic font-normal text-zinc-700 dark:text-zinc-300"> reads itself in.</span>
          </h1>
          <div className="mt-5 max-w-xl">
            <p className="font-serif italic text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-2 border-zinc-300 dark:border-zinc-700 pl-4">
              Drop a PDF or start blank. We&rsquo;ll score, sharpen, and rewrite your bullets to land
              with weight — every edit, scored live.
            </p>
          </div>

          {/* Feature row */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
            <FeatureChip icon={<Zap size={12} />} label="Live ATS" />
            <FeatureChip icon={<Shield size={12} />} label="Private" />
            <FeatureChip icon={<Sparkles size={12} />} label="AI Rewrite" />
          </div>
        </div>

        {/* Right: actions */}
        <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-zinc-300 dark:lg:border-zinc-700">
          {errorText && (
            <div className="mb-4 p-3 border border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold font-mono uppercase text-[10px] tracking-widest block mb-1">
                  Parse Failed
                </span>
                {errorText}
                <button
                  onClick={() => {
                    setErrorText(null);
                    handleFileSelect(fileInputRef.current?.files?.[0] || (mockResumeData as any));
                  }}
                  className="block mt-2 underline font-medium hover:text-rose-800 dark:hover:text-rose-300"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-500 mb-3">
            01 · Upload Existing
          </p>

          <div
            className={cn(
              'border border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center px-6 py-10 min-h-[220px] relative',
              isUploading
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed pointer-events-none'
                : isHovering
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100/70 dark:bg-zinc-800/50'
                : 'border-zinc-400 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 bg-white/40 dark:bg-zinc-900/30 cursor-pointer'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isUploading) setIsHovering(true);
            }}
            onDragLeave={() => setIsHovering(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUploading) fileInputRef.current?.click();
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx"
              disabled={isUploading}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />

            {isUploading ? (
              <>
                <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-zinc-700 dark:text-zinc-300 mb-3" />
                <h3 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {statusText}
                </h3>
                <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                  do not close this window
                </p>
              </>
            ) : (
              <>
                <UploadCloud
                  size={28}
                  strokeWidth={1.5}
                  className="text-zinc-700 dark:text-zinc-300 mb-3"
                />
                <h3 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Drop your resume here
                </h3>
                <p className="font-serif italic text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  or click to browse
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                  <FileText size={11} />
                  <span>PDF · DOCX · max 5 MB</span>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          {!isUploading && (
            <>
              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                  or
                </span>
                <span className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
              </div>

              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-500 mb-3">
                02 · Start Blank
              </p>

              <button
                onClick={() => createResume()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-xs font-bold transition-colors"
              >
                <Plus size={14} strokeWidth={2.5} />
                Create New Resume
              </button>

              <p className="font-serif italic text-xs text-zinc-500 dark:text-zinc-500 text-center mt-3">
                A blank canvas with live scoring from the first keystroke.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer rule */}
      <div className="mt-16 pt-4 border-t border-zinc-300 dark:border-zinc-700 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-500">
        <span>— end of brief —</span>
        <span className="hidden sm:inline">Resume Optimizer · Editorial Edition</span>
      </div>
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
      <span className="text-zinc-900 dark:text-zinc-100">{icon}</span>
      <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}
