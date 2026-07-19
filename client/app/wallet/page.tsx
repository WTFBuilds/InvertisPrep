'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi } from '@/lib/api';
import { toast } from 'sonner';
import type { WalletTransaction, TopUpPackId, TopUpPacks, TransactionMeta, TransactionType } from '@/types';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Coins, Zap, Star, Flame, TrendingUp, TrendingDown, Gift,
  RefreshCw, ChevronDown, Wallet, ArrowUpRight, ArrowDownRight,
  Download, Sparkles, Shield, Clock,
} from 'lucide-react';

// ─── pack definitions (mirrors server PACKS) ────────────────────────────────
const PACK_META: Record<TopUpPackId, {
  coins: number; rupees: number; label: string;
  icon: React.ReactNode; badge?: string; badgeColor?: string;
  gradient: string; borderColor: string; popular?: boolean;
}> = {
  starter: {
    coins: 200, rupees: 19.99, label: 'Starter',
    icon: <Zap className="h-6 w-6" />,
    gradient: 'from-blue-500/10 to-indigo-500/10',
    borderColor: 'border-indigo-200 hover:border-indigo-400',
  },
  plus: {
    coins: 600, rupees: 49.99, label: 'Plus',
    icon: <Star className="h-6 w-6 fill-current" />,
    badge: 'Most Popular', badgeColor: 'bg-indigo-600 text-white',
    gradient: 'from-indigo-500/15 to-purple-500/15',
    borderColor: 'border-indigo-400 hover:border-indigo-600',
    popular: true,
  },
  pro: {
    coins: 1400, rupees: 99.99, label: 'Pro',
    icon: <Flame className="h-6 w-6" />,
    badge: 'Best Value', badgeColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    gradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-300 hover:border-purple-500',
  },
};

// ─── animated coin counter ────────────────────────────────────────────────────
function CoinCounter({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff  = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <>{display.toLocaleString('en-IN')}</>;
}

// ─── transaction row ─────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === 'credit';
  const date = new Date(tx.createdAt);

  const categoryIcon: Record<string, React.ReactNode> = {
    topup:           <ArrowUpRight className="h-4 w-4" />,
    resume_download: <Download className="h-4 w-4" />,
    bonus:           <Gift className="h-4 w-4" />,
    refund:          <RefreshCw className="h-4 w-4" />,
  };

  const categoryColor: Record<string, string> = {
    topup:           'bg-emerald-100 text-emerald-700',
    resume_download: 'bg-blue-100 text-blue-700',
    bonus:           'bg-amber-100 text-amber-700',
    refund:          'bg-purple-100 text-purple-700',
  };

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${categoryColor[tx.category] ?? 'bg-slate-100 text-slate-600'}`}>
        {categoryIcon[tx.category] ?? <Coins className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{tx.description}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isCredit ? '+' : '−'}{tx.coins > 0 ? tx.coins.toLocaleString('en-IN') : '0'} QC
        </span>
        <p className="text-xs text-slate-400 mt-0.5">
          Balance: {tx.balanceAfter.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
}

function TxSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="space-y-1.5 text-right">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();

  const [qcoins, setQcoins]           = useState(0);
  const [freeLeft, setFreeLeft]       = useState(2);
  const [balanceLoaded, setBalanceLoaded] = useState(false);

  const [txs, setTxs]                   = useState<WalletTransaction[]>([]);
  const [txMeta, setTxMeta]             = useState<TransactionMeta | null>(null);
  const [txLoading, setTxLoading]       = useState(true);
  const [txPage, setTxPage]             = useState(1);
  const [txTab, setTxTab]               = useState<'all' | TransactionType>('all');
  const [loadingMore, setLoadingMore]   = useState(false);

  const [buyingPack, setBuyingPack] = useState<TopUpPackId | null>(null);

  // ── redirect if not authed ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // ── load balance ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    walletApi.getBalance().then((res) => {
      if (res.success && res.data) {
        setQcoins(res.data.qcoins);
        setFreeLeft(res.data.freeDownloadsLeft);
        setBalanceLoaded(true);
      }
    }).catch(() => {
      // fallback to context values
      setQcoins(user.qcoins ?? 0);
      setFreeLeft(user.freeDownloadsLeft ?? 2);
      setBalanceLoaded(true);
    });
  }, [user]);

  // ── load transactions ─────────────────────────────────────────────────────
  const loadTxs = useCallback(async (page: number, tab: 'all' | TransactionType, append = false) => {
    if (page === 1) setTxLoading(true);
    else setLoadingMore(true);
    try {
      const res = await walletApi.getTransactions(page, 15, tab);
      if (res.success && res.data) {
        setTxs((prev) => append ? [...prev, ...res.data!] : res.data!);
        setTxMeta(res.meta ?? null);
      }
    } catch {
      toast.error('Could not load transactions');
    } finally {
      setTxLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setTxPage(1);
    setTxs([]);
    void loadTxs(1, txTab);
  }, [user, txTab, loadTxs]);

  const handleLoadMore = () => {
    const next = txPage + 1;
    setTxPage(next);
    void loadTxs(next, txTab, true);
  };

  // ── buy a pack ────────────────────────────────────────────────────────────
  const handleBuy = async (packId: TopUpPackId) => {
    if (!user) return;
    setBuyingPack(packId);
    try {
      const res = await walletApi.topup(packId);
      if (res.success && res.data) {
        const { qcoins: newCoins, freeDownloadsLeft: newFree } = res.data;
        setQcoins(newCoins);
        setFreeLeft(newFree);
        updateUser({ ...user, qcoins: newCoins, freeDownloadsLeft: newFree });
        toast.success(`${PACK_META[packId].coins} QCoins added to your wallet!`);
        // refresh transaction list
        setTxPage(1);
        void loadTxs(1, txTab);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Purchase failed';
      toast.error(msg);
    } finally {
      setBuyingPack(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Skeleton className="mb-8 h-48 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0,1,2].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const hasMore = txMeta ? txPage < txMeta.pages : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* ── page header ── */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Platform Economy</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            QC Wallet
          </h1>
          <p className="mt-2 text-slate-500">Buy QCoins, spend them on premium features, track every transaction.</p>
        </div>

        {/* ── balance hero ── */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-[1px] shadow-xl">
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6 py-8 sm:px-10 sm:py-10">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-white/70">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">Your QCoins balance</span>
                </div>
                <div className="mt-2 flex items-end gap-3">
                  <span className="text-5xl font-black tabular-nums text-white sm:text-6xl">
                    {balanceLoaded ? <CoinCounter target={qcoins} /> : '—'}
                  </span>
                  <span className="mb-1.5 text-xl font-bold text-white/60">QC</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <Shield className="h-3 w-3" />
                    {freeLeft} free PDF download{freeLeft !== 1 ? 's' : ''} remaining
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" />
                    200 QC = 1 watermark-free PDF
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <div className="rounded-xl bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Rate</p>
                  <p className="mt-0.5 text-lg font-black text-white">₹19.99 = 200 QC</p>                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── top-up packs ── */}
        <h2 className="mb-4 text-lg font-bold text-slate-900">Top up QCoins</h2>
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {(Object.entries(PACK_META) as [TopUpPackId, typeof PACK_META[TopUpPackId]][]).map(([packId, meta]) => (
            <div
              key={packId}
              className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${meta.gradient} ${meta.borderColor} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${meta.popular ? 'shadow-md' : ''}`}
            >
              {meta.badge && (
                <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.badgeColor}`}>
                  {meta.badge}
                </span>
              )}
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-indigo-600 shadow-sm">
                  {meta.icon}
                </span>
                <div>
                  <p className="font-bold text-slate-900">{meta.label}</p>
                  <p className="text-xs text-slate-500">Pack</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-3xl font-black text-slate-900">
                  {meta.coins.toLocaleString('en-IN')}
                  <span className="ml-1 text-base font-bold text-indigo-600">QC</span>
                </p>
                {packId === 'plus' && (
                  <p className="mt-1 text-xs text-emerald-600 font-semibold">+200 bonus vs Starter!</p>
                )}
                {packId === 'pro' && (
                  <p className="mt-1 text-xs text-purple-600 font-semibold">+800 bonus vs Starter!</p>
                )}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900">₹{meta.rupees}</span>
                <Button
                  size="sm"
                  className={`rounded-lg font-bold ${meta.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                  disabled={buyingPack !== null}
                  onClick={() => handleBuy(packId)}
                >
                  {buyingPack === packId ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Adding…
                    </span>
                  ) : 'Buy Now'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* ── transaction history ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Transaction History</h2>
              {txMeta && (
                <p className="mt-0.5 text-xs text-slate-400">{txMeta.total} transaction{txMeta.total !== 1 ? 's' : ''} total</p>
              )}
            </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(['all', 'credit', 'debit'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTxTab(t)}
                  className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    txTab === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'credit' && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                  {t === 'debit'  && <TrendingDown className="h-3 w-3 text-rose-500" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 px-5">
            {txLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TxSkeleton key={i} />)
            ) : txs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-400">
                  <Clock className="h-8 w-8" />
                </div>
                <p className="mt-4 font-semibold text-slate-700">No transactions yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  {txTab === 'all' ? 'Buy a pack above to get started.' :
                   txTab === 'credit' ? 'No credits recorded yet.' : 'No debits recorded yet.'}
                </p>
              </div>
            ) : (
              txs.map((tx) => <TxRow key={tx._id} tx={tx} />)
            )}
          </div>

          {hasMore && (
            <div className="border-t border-slate-100 p-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold"
                disabled={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? (
                  <><RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading…</>
                ) : (
                  <><ChevronDown className="mr-2 h-3.5 w-3.5" /> Load more</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* ── footer note ── */}
        <p className="mt-6 text-center text-xs text-slate-400">
          QCoins are non-refundable. Razorpay payment integration coming soon.
        </p>
      </div>
    </div>
  );
}
