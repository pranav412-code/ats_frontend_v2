import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';

/**
 * Polish stage visual: resume outline saturated, sparkles drift up
 * across it. Conveys "final touches".
 */
export function PolishCard() {
  const reduced = useReducedMotion();
  const sparkles = Array.from({ length: 12 });

  return (
    <div className="relative w-full h-full flex items-center justify-center px-4 py-6">
      {/* Resume outline */}
      <motion.svg
        viewBox="0 0 160 200"
        className="relative w-32 sm:w-40 h-auto text-amber-600 dark:text-amber-400"
        layoutId="resume-outline"
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
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
        ))}
      </motion.svg>

      {/* Sparkles drifting */}
      {!reduced &&
        sparkles.map((_, i) => {
          const left = 20 + Math.random() * 60;   // percent of card width
          const startTop = 50 + Math.random() * 40;
          const delay = (i / sparkles.length) * 2.5;
          return (
            <motion.span
              key={i}
              className="absolute text-amber-400"
              style={{ left: `${left}%`, top: `${startTop}%` }}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 0], y: -80, scale: 1 }}
              transition={{ duration: 2.2, delay, repeat: Infinity, ease: 'easeOut' }}
            >
              <Sparkles size={10} />
            </motion.span>
          );
        })}
    </div>
  );
}
