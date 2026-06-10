import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { expandWeakness } from '../../lib/strengthTemplates';

interface Props {
  raw: string;
  index: number;
}

export function WeaknessCard({ raw, index }: Props) {
  const { headline, body, suggest } = expandWeakness(raw);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="border border-amber-700/30 dark:border-amber-500/30 bg-amber-500/[0.04] p-4 rounded-sm"
    >
      <div className="flex items-start gap-2 mb-1.5">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <h4 className="font-serif text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
          {headline}
        </h4>
      </div>
      <p className="font-serif text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug pl-6 mb-2">
        {body}
      </p>
      <p className="pl-6 inline-flex items-start gap-1.5 text-[12px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400">
        <ArrowRight size={11} className="mt-[3px] shrink-0" />
        <span className="normal-case font-sans text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">
          {suggest}
        </span>
      </p>
    </motion.div>
  );
}
