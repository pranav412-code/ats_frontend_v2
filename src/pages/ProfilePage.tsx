import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { Loader2, Save, User, Briefcase, Phone, Mail, Building, ShieldCheck, ChevronRight, CreditCard } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useResumeStore } from '../store/useResumeStore';

interface ProfileData {
  full_name: string;
  phone_number: string;
  target_role: string;
  industry: string;
  email: string;
}

export function ProfilePage() {
  const { user } = useAuthStore();
  const { setCurrentPage, subscription } = useResumeStore();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone_number: '',
    target_role: '',
    industry: '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchApi('/profile');
        setProfile({
          full_name: data.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          phone_number: data.phone_number || '',
          target_role: data.target_role || '',
          industry: data.industry || '',
          email: user?.email || data.email || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await fetchApi('/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
      setMessage({ text: 'Profile updated successfully.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mb-3">
          Account Settings
        </p>
        <h1 className="font-serif text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Your Profile
        </h1>
        <p className="font-serif italic text-zinc-600 dark:text-zinc-400 mt-2">
          Manage your personal details and career targets.
        </p>
      </div>

      {message && (
        <div
          className={`mb-8 p-4 border text-sm ${
            message.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-6 sm:p-8">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-bold mb-6 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <User size={14} /> Personal Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-transparent border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Phone size={12} />
                </div>
                <input
                  type="tel"
                  value={profile.phone_number}
                  onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-transparent border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 transition-colors"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail size={12} />
                </div>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 font-serif text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 p-6 sm:p-8">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-bold mb-6 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <Briefcase size={14} /> Career Targets
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                Target Role
              </label>
              <input
                type="text"
                value={profile.target_role}
                onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3 py-2 bg-transparent border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 placeholder:italic transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                Industry
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Building size={12} />
                </div>
                <input
                  type="text"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  placeholder="e.g. Fintech, SaaS"
                  className="w-full pl-8 pr-3 py-2 bg-transparent border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-900 dark:text-zinc-100 placeholder:italic transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-70"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Profile
          </button>
        </div>
      </form>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => setCurrentPage('security')}
          className="w-full text-left border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900/70 p-6 sm:p-8 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-zinc-50 dark:text-zinc-900" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                  Security
                </p>
                <h2 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  Password & Recovery
                </h2>
                <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400">
                  Change your password or send a reset link to your email.
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors shrink-0" />
          </div>
        </button>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setCurrentPage('subscription')}
          className="w-full text-left border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900/70 p-6 sm:p-8 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-zinc-50 dark:text-zinc-900" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                  Billing
                </p>
                <h2 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  {subscription?.active ? subscription.label : 'Subscription'}
                </h2>
                <p className="font-serif italic text-sm text-zinc-600 dark:text-zinc-400">
                  {subscription?.active
                    ? `${subscription.credits_per_month} credits/mo · ${subscription.resume_slots} slots · manage plan`
                    : 'Free plan — view plans and upgrade.'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors shrink-0" />
          </div>
        </button>
      </div>

    </div>
  );
}
