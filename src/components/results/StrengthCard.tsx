import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { expandStrength } from '../../lib/strengthTemplates';

interface Props {
  raw: string;
  index: number;
}

export function StrengthCard({ raw, index }: Props) {
  const { headline, body } = expandStrength(raw);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="border border-emerald-700/30 dark:border-emerald-500/30 bg-emerald-500/[0.04] p-4 rounded-sm"
    >
      <div className="flex items-start gap-2 mb-1.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <h4 className="font-serif text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
          {headline}
        </h4>
      </div>
      <p className="font-serif text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug pl-6">
        {body}
      </p>
    </motion.div>
  );
}
