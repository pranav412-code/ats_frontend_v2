import React, { useState, useRef } from 'react';
import { useResumeStore, mockResumeData } from '../store/useResumeStore';
import { UploadCloud, FileText, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export function UploadSection() {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadResume, createResume } = useResumeStore();

  const handleFileSelect = (file: File) => {
    // In a real app we'd parse the file. Here we just mock it.
    uploadResume(mockResumeData, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
          AI Resume Optimizer
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Upload your resume or start from scratch and let AI rewrite your bullet points for maximum impact.
        </p>
      </div>

      <div 
        className={cn(
          "w-full border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ease-in-out cursor-pointer flex flex-col items-center justify-center text-center mb-6",
          isHovering 
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-400" 
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
          }}
        />
        <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center mb-4 text-zinc-600 dark:text-zinc-400">
          <UploadCloud size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Click or drag & drop to upload
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          Supports PDF, DOCX (Max 5MB)
        </p>
      </div>

      <div className="flex items-center w-full gap-4 max-w-md">
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">or</span>
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => createResume()}
          className="flex items-center justify-center px-6 py-3 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all"
        >
          <Plus size={18} className="mr-2" />
          Create New Resume
        </button>
      </div>
    </div>
  );
}
