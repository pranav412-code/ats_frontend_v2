import React, { useEffect, useState, useMemo } from 'react';
import { fetchApi } from '../lib/api';
import { Receipt, Calendar, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, CalendarPlus, ShoppingCart, Minus, RotateCcw, Gift } from 'lucide-react';
import { cn } from '../lib/utils';

type TxFilter = 'all' | 'purchase' | 'subscription_grant' | 'consumption' | 'refund';

const FILTERS: { key: TxFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'purchase', label: 'Purchases' },
  { key: 'subscription_grant', label: 'Renewals' },
  { key: 'consumption', label: 'Usage' },
  { key: 'refund', label: 'Refunds' },
];

function typeMeta(type: string): { label: string; icon: React.ReactNode } {
  switch (type) {
    case 'purchase': return { label: 'Purchase', icon: <ShoppingCart size={11} /> };
    case 'subscription_grant': return { label: 'Renewal', icon: <CalendarPlus size={11} /> };
    case 'consumption': return { label: 'Usage', icon: <Minus size={11} /> };
    case 'refund': return { label: 'Refund', icon: <RotateCcw size={11} /> };
    case 'bonus': return { label: 'Bonus', icon: <Gift size={11} /> };
    default: return { label: type, icon: <Receipt size={11} /> };
  }
}

interface Transaction {
  id: string;
  amount_credits: number;
  type: string;
  status: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TxFilter>('all');
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await fetchApi('/credits/transactions?limit=100');
        if (data && data.transactions) {
          setTransactions(data.transactions);
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={14} className="text-emerald-500" />;
    if (status === 'pending') return <Clock size={14} className="text-amber-500" />;
    if (status === 'failed') return <XCircle size={14} className="text-rose-500" />;
    return null;
  };

  const getTypeColor = (type: string) => {
    if (type === 'purchase' || type === 'bonus' || type === 'subscription_grant') return 'text-emerald-600 dark:text-emerald-400';
    if (type === 'consumption') return 'text-zinc-600 dark:text-zinc-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  const switchFilter = (f: TxFilter) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <div className="w-full px-6 lg:px-10 pt-6 pb-16">
      {/* Masthead */}
      <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3 mb-8 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
        <span>Issue 01 · ResumeCraft</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Section · Ledger</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 mb-8 border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">⟶ The Ledger</p>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[0.95]">
            Billing &
            <span className="italic font-normal text-zinc-700 dark:text-zinc-300"> Transactions</span>
          </h1>
          <p className="font-serif italic text-base text-zinc-600 dark:text-zinc-400 mt-3 max-w-xl">
            A comprehensive record of your purchases and credit consumption.
          </p>
        </div>
      </div>

      {/* Filter pills */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => switchFilter(f.key)}
              className={cn(
                'px-3 py-1.5 font-mono uppercase tracking-widest text-[10px] font-bold border transition-colors',
                filter === f.key
                  ? 'bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                  : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-sm font-mono uppercase tracking-widest text-zinc-400 animate-pulse">
          Loading Ledger...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed border-zinc-400 dark:border-zinc-700 px-8 py-16 text-center bg-white/40 dark:bg-zinc-900/30">
          <Receipt size={28} className="text-zinc-700 dark:text-zinc-300 mb-4" />
          <h3 className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            No <span className="italic font-normal">transactions</span> found
          </h3>
          <p className="font-serif italic text-base text-zinc-500 dark:text-zinc-500 max-w-md">
            Your transaction history will appear here once you purchase or consume credits.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="border border-zinc-300 dark:border-zinc-700 divide-y divide-zinc-300 dark:divide-zinc-700">
            {paginatedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 py-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn('inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 border border-zinc-300 dark:border-zinc-700', getTypeColor(tx.type))}>
                      {typeMeta(tx.type).icon} {typeMeta(tx.type).label}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                      <Calendar size={11} />
                      {new Date(tx.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <h4 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50 truncate transition-all">
                    {tx.description || 'System Adjustment'}
                  </h4>
                  {tx.reference_id && (
                    <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">
                      Ref: {tx.reference_id}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                  <div className="flex flex-col items-end pr-6 border-r border-zinc-300 dark:border-zinc-700">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Amount</p>
                    <p className={`font-serif text-3xl font-bold tabular-nums leading-none mt-1 ${getTypeColor(tx.type)}`}>
                      {tx.type === 'consumption' ? '-' : '+'}{tx.amount_credits}
                    </p>
                  </div>

                  <div className="flex flex-col items-start min-w-[100px]">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Status</p>
                    <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest font-bold text-zinc-900 dark:text-zinc-100">
                      {getStatusIcon(tx.status)}
                      {tx.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 0 && (
            <div className="flex items-center justify-between border-t border-zinc-300 dark:border-zinc-700 pt-6">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center w-8 h-8 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center justify-center w-8 h-8 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
