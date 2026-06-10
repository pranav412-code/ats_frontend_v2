import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Prepare stage visual: animated resume outline draws itself,
 * keyword chips drift in from the right as if being "read".
 */
export function PrepareCard() {
  const reduced = useReducedMotion();
  const placeholderChips = ['leadership', 'python', 'analytics', 'design', 'strategy', 'communication'];

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-10 px-4 py-6">
      {/* Resume outline */}
      <motion.svg
        viewBox="0 0 160 200"
        className="w-32 sm:w-40 h-auto text-cyan-600 dark:text-cyan-400"
        layoutId="resume-outline"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.rect
          x="6"
          y="6"
          width="148"
          height="188"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Header lines */}
        {[20, 32, 44].map((y, i) => (
          <motion.line
            key={y}
            x1="20"
            x2={i === 0 ? 110 : i === 1 ? 80 : 130}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
          />
        ))}
        {/* Body lines, grouped to simulate sections */}
        {[64, 76, 88, 108, 120, 132, 152, 164].map((y, i) => (
          <motion.line
            key={y}
            x1="20"
            x2={20 + 80 + Math.random() * 30}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.7"
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
          />
        ))}
      </motion.svg>

      {/* Keyword chips drifting in */}
      <div className="flex flex-col items-start gap-2">
        {placeholderChips.map((kw, i) => (
          <motion.span
            key={kw}
            initial={reduced ? false : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
            className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-sm"
          >
            {kw}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
