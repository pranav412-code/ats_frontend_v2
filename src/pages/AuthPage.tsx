import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Mail, Lock, AlertCircle, MailCheck, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { validatePassword, PASSWORD_MIN_LENGTH } from '../lib/password';
import { useResumeStore } from '../store/useResumeStore';

type Mode = 'login' | 'signup' | 'forgot';

interface AuthPageProps {
  onBack?: () => void;
}

export function AuthPage({ onBack }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowResend(false);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (error) throw error;
        setForgotSent(true);
        setResendCooldown(30);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/not confirmed/i.test(error.message)) {
            setShowResend(true);
          }
          throw error;
        }
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const pwError = validatePassword(password);
        if (pwError) throw new Error(pwError);

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}` },
        });
        if (error) throw error;
        setMessage('Registration successful. Check your email to verify your account.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}` },
      });
      if (error) throw error;
      setMessage('Verification email resent. Check your inbox.');
      setShowResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
    setConfirmPassword('');
    setShowResend(false);
    setForgotSent(false);
    setResendCooldown(0);
  };

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendReset = async () => {
    if (resendCooldown > 0 || !email) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend reset email');
    } finally {
      setLoading(false);
    }
  };

  const heading = isLogin
    ? 'Sign in to your account'
    : isSignup
    ? 'Create a new account'
    : 'Reset your password';

  const submitLabel = isLogin ? 'Sign In' : isSignup ? 'Create Account' : 'Send Reset Email';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 bg-zinc-50 dark:bg-zinc-950 relative">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft size={12} /> Back to Home
          </button>
        )}
        <div className="text-center mb-10">
          <img src="/logo.png" className="h-16 w-auto object-contain mx-auto mb-6" alt="Resume Optimizer Logo" />
          <h1 className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Resume Optimizer
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mt-3">
            Editorial Edition
          </p>
        </div>

        {isForgot && forgotSent ? (
          <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-5 border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <MailCheck size={26} className="text-emerald-700 dark:text-emerald-400" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400 mb-3">
              Email Sent
            </p>
            <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              Check your inbox
            </h2>
            <p className="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Reset link sent to{' '}
              <span className="font-mono text-zinc-900 dark:text-zinc-100">{email}</span>.
              Follow it to set a new password. Link expires in 60 minutes.
            </p>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Didn't receive it?
              </p>
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={handleResendReset}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Reset Email'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ArrowLeft size={12} /> Back to sign in
              </button>
            </div>

            {error && (
              <div className="mt-5 p-3 border border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-sm text-left">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-8">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            {heading}
          </h2>
          {isForgot && (
            <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Enter the email tied to your account. We'll send a secure link to reset your password.
            </p>
          )}
          {!isForgot && <div className="mb-6" />}

          {error && (
            <div className="mb-6 p-3 border border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {showResend && !isForgot && (
            <div className="mb-6 p-3 border border-amber-300 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-sm flex items-center justify-between gap-3">
              <span>Email not verified.</span>
              <button
                type="button"
                disabled={resending || !email}
                onClick={handleResendVerification}
                className="font-mono uppercase tracking-widest text-[10px] font-bold underline hover:no-underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend email'}
              </button>
            </div>
          )}

          {message && (
            <div className="mb-6 p-3 border border-emerald-300 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 placeholder:italic transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Lock size={14} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 placeholder:italic transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                {isSignup && (
                  <p className="mt-1 text-[10px] font-mono text-zinc-500">
                    Min {PASSWORD_MIN_LENGTH} chars, at least 1 letter + 1 digit.
                  </p>
                )}
              </div>
            )}

            {isSignup && (
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
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      'w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-950 border font-serif text-sm focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder:italic transition-colors',
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-400 dark:border-rose-700 focus:border-rose-500'
                        : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100'
                    )}
                    placeholder="••••••••"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 mt-6 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {submitLabel}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {!isForgot && (
            <>
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">OR</span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 mt-6 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
        )}

        <div className="mt-6 text-center">
          {isForgot ? (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode(isLogin ? 'signup' : 'login')}
              className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          )}
        </div>

        {isSignup && (
          <p className="mt-6 text-[11px] font-serif italic text-center text-zinc-500 dark:text-zinc-400 leading-relaxed">
            By creating an account you agree to our{' '}
            <button
              type="button"
              onClick={() => useResumeStore.getState().setCurrentPage('terms')}
              className="underline text-zinc-900 dark:text-zinc-100 hover:no-underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => useResumeStore.getState().setCurrentPage('privacy')}
              className="underline text-zinc-900 dark:text-zinc-100 hover:no-underline"
            >
              Privacy Policy
            </button>
            .
          </p>
        )}
      </div>
    </div>
  );
}
