import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Strengthen stage visual: same resume outline carried over via layoutId,
 * pulsing aura surrounds it. Conveys "active rewriting".
 */
export function StrengthenCard() {
  const reduced = useReducedMotion();

  return (
    <div className="relative w-full h-full flex items-center justify-center px-4 py-6">
      {/* Aura behind */}
      <motion.div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={reduced ? {} : { scale: [1, 1.05, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-56 h-56 sm:w-64 sm:h-64 rounded-full blur-2xl opacity-60"
          style={{
            background:
              'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(6,182,212,0.25) 45%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* Resume outline (shared layoutId continues from Prepare) */}
      <motion.svg
        viewBox="0 0 160 200"
        className="relative w-32 sm:w-40 h-auto text-indigo-600 dark:text-indigo-300"
        layoutId="resume-outline"
        animate={reduced ? {} : { y: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="6" y="6" width="148" height="188" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="110" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="32" x2="80" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="44" x2="130" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {[64, 76, 88, 108, 120, 132, 152, 164].map((y) => (
          <line
            key={y}
            x1="20"
            x2={120}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
        ))}
        {/* Highlight one bullet getting rewritten — animated underline */}
        <motion.rect
          x="18"
          y="106"
          width="100"
          height="18"
          rx="2"
          fill="rgba(99,102,241,0.18)"
          initial={reduced ? false : { opacity: 0 }}
          animate={reduced ? {} : { opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  );
}
