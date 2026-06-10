import React, { useState } from 'react';
import { Loader2, Lock, KeyRound, ShieldCheck, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useResumeStore } from '../store/useResumeStore';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { validatePassword, PASSWORD_MIN_LENGTH } from '../lib/password';
import { cn } from '../lib/utils';

export function SecurityPage() {
  const { user } = useAuthStore();
  const { setCurrentPage } = useResumeStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [sendingReset, setSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const email = user?.email || '';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    const pwError = validatePassword(newPassword);
    if (pwError) { setPwMessage({ text: pwError, type: 'error' }); return; }
    if (newPassword !== confirmPassword) { setPwMessage({ text: 'New password and confirmation do not match.', type: 'error' }); return; }
    if (newPassword === currentPassword) { setPwMessage({ text: 'New password must differ from current password.', type: 'error' }); return; }
    if (!email) { setPwMessage({ text: 'Email unavailable; cannot verify current password.', type: 'error' }); return; }

    setChangingPw(true);
    try {
      const verifyClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );
      const { error: signInError } = await verifyClient.auth.signInWithPassword({ email, password: currentPassword });
      await verifyClient.auth.signOut().catch(() => {});
      if (signInError) {
        setPwMessage({ text: 'Current password is incorrect.', type: 'error' });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPwMessage({ text: updateError.message || 'Failed to update password.', type: 'error' });
        return;
      }

      setPwMessage({ text: 'Password updated successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMessage({ text: err?.message || 'Unexpected error updating password.', type: 'error' });
    } finally {
      setChangingPw(false);
    }
  };

  const handleForgotFlow = async () => {
    if (!email) return;
    setResetMessage(null);
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      setResetMessage({ text: `Reset link sent to ${email}. Check your inbox.`, type: 'success' });
    } catch (err: any) {
      setResetMessage({ text: err?.message || 'Failed to send reset email.', type: 'error' });
    } finally {
      setSendingReset(false);
    }
  };

  const pwMatch = confirmPassword && newPassword === confirmPassword;
  const pwMismatch = confirmPassword && newPassword !== confirmPassword;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12">
      <button
        onClick={() => setCurrentPage('profile')}
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
      >
        <ArrowLeft size={12} /> Back to Profile
      </button>

      <div className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mb-3">
          Account Settings
        </p>
        <h1 className="font-serif text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-3">
          <ShieldCheck size={32} className="text-zinc-700 dark:text-zinc-300" />
          Security
        </h1>
        <p className="font-serif italic text-zinc-600 dark:text-zinc-400 mt-2">
          Update your password or recover access via email.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-8">
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-6 sm:p-8">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-bold mb-6 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <Lock size={14} /> Change Password
          </h2>

          {pwMessage && (
            <div
              className={cn(
                'mb-6 p-3 border text-sm flex items-start gap-2',
                pwMessage.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'border-rose-300 bg-rose-50/50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400'
              )}
            >
              {pwMessage.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span>{pwMessage.text}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <KeyRound size={14} />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-[10px] font-mono text-zinc-500">
                  Min {PASSWORD_MIN_LENGTH} chars, at least 1 letter + 1 digit.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Lock size={14} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      'w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border font-serif text-sm focus:outline-none text-zinc-900 dark:text-zinc-100 transition-colors',
                      pwMismatch
                        ? 'border-rose-400 dark:border-rose-700 focus:border-rose-500'
                        : pwMatch
                        ? 'border-emerald-400 dark:border-emerald-700 focus:border-emerald-500'
                        : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100'
                    )}
                    placeholder="••••••••"
                  />
                </div>
                {pwMismatch && (
                  <p className="mt-1 text-[10px] font-mono text-rose-600 dark:text-rose-400">Passwords do not match</p>
                )}
                {pwMatch && (
                  <p className="mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Passwords match</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {changingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Update Password
          </button>
        </div>
      </form>

      <div className="mt-12 border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-6 sm:p-8">
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-bold mb-6 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <Mail size={14} /> Forgot Current Password?
        </h2>

        <p className="font-serif text-sm text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
          Don't remember your current password? Send a reset link to{' '}
          <span className="font-mono text-zinc-900 dark:text-zinc-100">{email}</span>. Follow the link in your inbox to choose a new password without entering the current one.
        </p>

        {resetMessage && (
          <div
            className={cn(
              'mb-5 p-3 border text-sm flex items-start gap-2',
              resetMessage.type === 'success'
                ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400'
                : 'border-rose-300 bg-rose-50/50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400'
            )}
          >
            {resetMessage.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <span>{resetMessage.text}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleForgotFlow}
          disabled={sendingReset || !email}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70"
        >
          {sendingReset ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Send Reset Link
        </button>
      </div>
    </div>
  );
}
