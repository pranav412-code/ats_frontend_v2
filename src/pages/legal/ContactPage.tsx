import React, { useState } from 'react';
import { LegalLayout } from './LegalLayout';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

const CATEGORIES: { value: string; label: string; note: string }[] = [
  { value: 'general',  label: 'General',  note: 'Product help, how-to, anything else' },
  { value: 'billing',  label: 'Billing',  note: 'Payments, refunds, invoices' },
  { value: 'privacy',  label: 'Privacy',  note: 'Data export, deletion, DPDPA grievance' },
  { value: 'security', label: 'Security', note: 'Vulnerability disclosure, account compromise' },
  { value: 'bug',      label: 'Bug',      note: 'Something broken or behaving wrong' },
  { value: 'feature',  label: 'Feature',  note: 'Suggest an improvement' },
];

export function ContactPage() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState('general');
  const [name, setName]         = useState(user?.user_metadata?.name || '');
  const [email, setEmail]       = useState(user?.email || '');
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const canSubmit = message.trim().length >= 10 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchApi('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          category,
          subject: subject.trim() || null,
          message: message.trim(),
        }),
      });
      setTicketId(res?.ticket_id || 'submitted');
      setMessage('');
      setSubject('');
    } catch (err: any) {
      setError(err?.message || 'Could not submit. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LegalLayout
      kicker="Legal · Contact"
      title="Feedback & Support"
      lastUpdated="June 03, 2026"
    >
      <p>
        Use this form for any support request, billing query, privacy request, security report,
        bug, or feature idea. Submissions are stored and triaged by category. You receive a
        ticket id for follow-up.
      </p>

      {ticketId ? (
        <div className="not-prose mt-8 border border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/30 p-6">
          <div className="flex items-center gap-3 mb-3 text-emerald-900 dark:text-emerald-100">
            <CheckCircle2 size={20} />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] font-bold">Submitted</span>
          </div>
          <p className="font-serif text-zinc-900 dark:text-zinc-50 mb-2">
            Thanks — your message is in our queue.
          </p>
          <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 mb-4">
            Ticket id: <span className="text-zinc-900 dark:text-zinc-50">{ticketId}</span>
          </p>
          <button
            type="button"
            onClick={() => setTicketId(null)}
            className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700 dark:text-zinc-300 underline hover:no-underline"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="not-prose mt-8 space-y-5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-2">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={
                    'px-3 py-2 text-left border text-xs transition-colors ' +
                    (category === c.value
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-500')
                  }
                  title={c.note}
                >
                  <div className="font-bold uppercase tracking-wider text-[10px]">{c.label}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{c.note}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name (optional)">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className={inputClass}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email (for reply)">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>
          </div>

          <Field label="Subject (optional)">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className={inputClass}
              placeholder="Short summary"
            />
          </Field>

          <Field label={`Message · ${message.trim().length} / 5000`} required>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              required
              rows={7}
              className={inputClass + ' resize-none'}
              placeholder="Describe the issue, request, or idea. Minimum 10 characters."
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 p-3 border border-red-500/60 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-mono uppercase tracking-widest text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (<><Loader2 size={14} className="animate-spin" /> Submitting</>) : 'Submit feedback'}
          </button>

          <p className="text-[11px] font-serif italic text-zinc-500 dark:text-zinc-400">
            We read every submission. Response time: typically within 2 business days. For
            DPDPA privacy grievances, statutory timelines apply (acknowledgement within 7 days,
            resolution within 30 days).
          </p>
        </form>
      )}
    </LegalLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-2">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-serif text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 text-zinc-800 dark:text-zinc-100 placeholder:italic placeholder-zinc-400 dark:placeholder-zinc-600 transition-colors';
