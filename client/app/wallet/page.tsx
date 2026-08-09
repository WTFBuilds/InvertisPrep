'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi } from '@/lib/api';
import { toast } from 'sonner';
import type { WalletTransaction, TopUpPackId, TransactionMeta, TransactionType } from '@/types';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { ShinyButton } from '@/components/ui/shiny-button';
import {
  Coins, Zap, Star, Flame, TrendingUp, TrendingDown, Gift,
  RefreshCw, ChevronDown, Wallet, ArrowUpRight,
  Download, Shield, Clock, Check,
} from 'lucide-react';

// ─── pack definitions (mirrors server PACKS) ────────────────────────────────
const PACK_META: Record<TopUpPackId, {
  coins: number; rupees: number; label: string; tagline: string;
  icon: React.ReactNode; badge?: string; badgeVariant?: 'default' | 'secondary' | 'indigo';
  features: string[]; popular?: boolean;
}> = {
  starter: {
    coins: 200, rupees: 19.99, label: 'Starter',
    tagline: 'Try out the QC wallet',
    icon: <Zap className="h-6 w-6" />,
    features: [
      '200 QC balance',
      '1 watermark-free PDF download',
      'Standard email support',
    ],
  },
  plus: {
    coins: 600, rupees: 49.99, label: 'Plus',
    tagline: 'The sweet spot for regular users',
    icon: <Star className="h-6 w-6 fill-current" />,
    badge: 'Most Popular', badgeVariant: 'indigo', popular: true,
    features: [
      '600 QC balance',
      '3 watermark-free PDF downloads',
      'Priority email support',
    ],
  },
  pro: {
    coins: 1400, rupees: 99.99, label: 'Pro',
    tagline: 'Maximum value for heavy users',
    icon: <Flame className="h-6 w-6" />,
    badge: 'Best Value', badgeVariant: 'default',
    features: [
      '1400 QC balance',
      '7 watermark-free PDF downloads',
      'Priority email support',
      'Early access to new features',
    ],
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
    if (!user || buyingPack !== null) return;
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
      <div className="min-h-screen bg-slate-50">
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
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* ── page header ── */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Platform Economy</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            QC Wallet
          </h1>
          <p className="mt-2 text-slate-500">Buy QCoins, spend them on premium features, track every transaction.</p>
        </div>

        {/* ── balance hero ── */}
        <GlowCard className="mb-8 overflow-hidden rounded-3xl border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_30px_-12px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-slate-900" />
          <div className="flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Your QCoins balance</span>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-black tabular-nums text-slate-900 sm:text-6xl">
                  {balanceLoaded ? <CoinCounter target={qcoins} /> : '—'}
                </span>
                <span className="mb-1.5 text-xl font-bold text-slate-400">QC</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <Shield className="h-3 w-3" />
                  {freeLeft} free PDF download{freeLeft !== 1 ? 's' : ''} remaining
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <Coins className="h-3 w-3" />
                  200 QC = 1 watermark-free PDF
                </span>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Rate</p>
              <p className="mt-0.5 text-lg font-black text-slate-900">₹19.99 = 200 QC</p>
            </div>
          </div>
        </GlowCard>

        {/* ── pricing section ── */}
        <div className="mb-12">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <Badge variant="indigo" className="mb-3">Pricing</Badge>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Top up QCoins
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              One-time top-ups, no subscriptions. 200 QC unlocks one watermark-free PDF download.
            </p>
          </div>

          <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(PACK_META) as [TopUpPackId, typeof PACK_META[TopUpPackId]][]).map(([packId, meta]) => (
              <GlowCard
                key={packId}
                glowColor={meta.popular ? 'rgba(99, 102, 241, 0.22)' : undefined}
                contentClassName="flex flex-1 flex-col"
                className={`relative flex flex-col rounded-2xl border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  meta.popular
                    ? 'border-indigo-200 shadow-[0_16px_40px_-20px_rgba(79,70,229,0.4)] ring-1 ring-indigo-100 lg:scale-[1.02]'
                    : ''
                }`}
              >
                {meta.badge && (
                  <div className="absolute right-5 top-5">
                    <Badge variant={meta.badgeVariant}>{meta.badge}</Badge>
                  </div>
                )}

                <div className="mb-5 flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      meta.popular ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {meta.icon}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{meta.label}</p>
                      <p className="text-xs text-slate-500">{meta.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-slate-900">₹{meta.rupees}</span>
                    <span className="text-sm font-medium text-slate-400">one-time</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-600">
                    {meta.coins.toLocaleString('en-IN')} <span className="font-medium text-slate-400">QC</span>
                  </p>

                  <Separator className="my-5" />

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {meta.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <ShinyButton
                    isActive
                    className="w-full"
                    onClick={() => handleBuy(packId)}
                  >
                    {buyingPack === packId ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Adding…
                      </span>
                    ) : (
                      `Buy ${meta.label}`
                    )}
                  </ShinyButton>
              </GlowCard>
            ))}
          </div>
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
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
