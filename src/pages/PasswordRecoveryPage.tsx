import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { validatePassword, PASSWORD_MIN_LENGTH } from '../lib/password';

interface Props {
  onComplete: () => void;
}

export function PasswordRecoveryPage({ onComplete }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-8">
        <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          Set a new password
        </h2>

        {error && (
          <div className="mb-6 p-3 border border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Lock size={14} />
              </div>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 transition-colors"
              />
            </div>
            <p className="mt-1 text-[10px] font-mono text-zinc-500">
              Min {PASSWORD_MIN_LENGTH} chars, at least 1 letter + 1 digit.
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Lock size={14} />
              </div>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
