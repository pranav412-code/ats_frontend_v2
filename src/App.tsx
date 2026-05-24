import React, { useEffect } from 'react';
import { useResumeStore } from './store/useResumeStore';
import { Navbar } from './components/Navbar';
import { EditorPage } from './pages/EditorPage';
import { ResumesPage } from './pages/ResumesPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  const { currentPage, fetchResumes, fetchHistory } = useResumeStore();

  useEffect(() => {
    fetchResumes();
    fetchHistory();
  }, [fetchResumes, fetchHistory]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8">
        {currentPage === 'editor' && <EditorPage />}
        {currentPage === 'resumes' && <ResumesPage />}
        {currentPage === 'history' && <HistoryPage />}
      </main>
    </div>
  );
}
