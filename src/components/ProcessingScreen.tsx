import React, { useEffect, useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const steps = [
  "Analyzing resume structure...",
  "Evaluating keyword density...",
  "Enhancing impact verbs...",
  "Quantifying achievements...",
  "Finalizing formatting..."
];

export function ProcessingScreen() {
  const { resumeData, completeOptimization, resumes, currentResumeId } = useResumeStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (!resumeData) return;
    
    // Animate through steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    
    // Complete optimization after all steps
    const completionTimer = setTimeout(() => {
      // Create a slightly modified optimized resume
      const optimizedResume = JSON.parse(JSON.stringify(resumeData));
      
      // Simulate optimizations
      if (optimizedResume.experience && optimizedResume.experience.length > 0) {
        if (!optimizedResume.experience[0].bullets) optimizedResume.experience[0].bullets = [];
        if (optimizedResume.experience[0].bullets.length > 0) {
           optimizedResume.experience[0].bullets[0] = "Spearheaded the redesign of the core product dashboard, driving a 15% increase in user retention through intuitive UX and streamlined navigation.";
        }
        if (optimizedResume.experience[0].bullets.length > 1) {
           optimizedResume.experience[0].bullets[1] = "Orchestrated cross-functional collaboration with engineering and product partners to launch 4 major feature updates ahead of tight deadlines, generating $2M in projected ARR.";
        }
      }
      
      const currentResume = resumes.find(r => r.id === currentResumeId);
      const beforeScore = currentResume?.latestScore || 60;
      const newScore = Math.max(80, Math.min(99, beforeScore + Math.floor(Math.random() * 15) + 10));
      
      completeOptimization(optimizedResume, newScore);
    }, 4500);
    
    return () => {
      clearInterval(stepInterval);
      clearTimeout(completionTimer);
    };
  }, [resumeData, completeOptimization, resumes, currentResumeId]);

  return (
    <div className="w-full flex items-center justify-center min-h-[60vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 max-w-md mx-auto shadow-sm text-center mt-12">
      <div className="flex flex-col items-center w-full">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse-slow"></div>
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center relative shadow-inner">
            <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Optimizing your resume
        </h2>
        
        <div className="w-full space-y-3">
          {steps.map((step, index) => {
             const isActive = index === currentStep;
             const isComplete = index < currentStep;
             
             return (
               <div 
                 key={index} 
                 className={`flex items-center text-sm transition-all duration-300 ${
                   isActive ? 'text-blue-600 dark:text-blue-400 font-medium scale-105 transform origin-left' : 
                   isComplete ? 'text-zinc-500 dark:text-zinc-400' : 
                   'text-zinc-300 dark:text-zinc-700'
                 }`}
               >
                 {isComplete ? (
                   <CheckCircle2 size={16} className="mr-3 text-green-500 shrink-0" />
                 ) : isActive ? (
                   <Loader2 size={16} className="mr-3 animate-spin shrink-0" />
                 ) : (
                   <div className="w-4 h-4 rounded-full border-2 border-inherit mr-3 opacity-50 shrink-0"></div>
                 )}
                 {step}
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
}
