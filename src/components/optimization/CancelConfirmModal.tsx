import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function CancelConfirmModal({ open, onConfirm, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Stop optimization?
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Your original resume stays untouched. Any progress so far will be discarded.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-md transition-colors"
              >
                Stop
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
