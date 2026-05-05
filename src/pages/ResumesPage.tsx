import React from 'react';
import { useResumeStore, Resume } from '../store/useResumeStore';
import { FileText, Plus, ArrowRight, Trash2, Clock, Files } from 'lucide-react';
import { cn } from '../lib/utils';
import { mockResumeData } from '../store/useResumeStore';

export function ResumesPage() {
  const { resumes, openResume, deleteResume, createResume, uploadResume, goToUpload } = useResumeStore();

  const handleCreateNew = () => {
    createResume();
  };

  const handleUploadResume = () => {
    goToUpload();
  };

  const handleUploadSample = () => {
    uploadResume(mockResumeData, 'Alex_Designer_Resume');
  };

  return (
    <div className="w-full flex flex-col pt-8 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">My Resumes</h1>
          <p className="text-zinc-500 dark:text-zinc-400">View and manage your optimized resumes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleUploadResume}
            className="hidden sm:flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all text-sm"
          >
            Upload Resume
          </button>
          <button 
            onClick={handleCreateNew}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm shadow-blue-500/20 transition-all text-sm"
          >
            <Plus size={16} className="mr-2" />
            New Resume
          </button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 bg-zinc-50 dark:bg-zinc-900/30 text-center">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center mb-6 text-zinc-400 dark:text-zinc-500">
            <Files size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-2">No resumes yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
            Create a new empty resume or upload an existing one to get started with the AI Optimizer.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={handleCreateNew}
              className="flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all"
            >
              Create New
            </button>
            <button 
              onClick={handleUploadResume}
              className="flex items-center justify-center px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200 rounded-xl font-medium transition-all"
            >
              Upload Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {resumes.map(resume => (
            <div key={resume.id} className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div 
                className="p-6 cursor-pointer flex-1"
                onClick={() => openResume(resume.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <FileText size={24} />
                  </div>
                  {resume.latestScore && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {resume.latestScore} score
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1 truncate">
                  {resume.title}
                </h3>
                <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  <Clock size={14} className="mr-1.5" />
                  Updated {new Date(resume.lastUpdated).toLocaleDateString()}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <button 
                  onClick={() => openResume(resume.id)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                >
                  Open Editor <ArrowRight size={14} className="ml-1" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteResume(resume.id);
                  }}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete Resume"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
