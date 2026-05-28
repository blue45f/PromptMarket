import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { useQueries } from '@tanstack/react-query';
import { ArrowUpRight, Copy, Heart, Loader2, PlusCircle, Wallet } from 'lucide-react';
import { api, getErrorMessage } from '@services/api';
import { useMyListings, useMyPurchases, useTopup } from '@features/marketplace/queries';
import { listingKey } from '@features/marketplace/queryKeys';
import type { ListingDetailResponse } from '@/types';
import { useAuthStore } from '@store/auth';
import { useWishlist } from '@hooks/useWishlist';
import { usePageMeta } from '@hooks/usePageMeta';
import ListingCard from '@components/ListingCard';
import { SkeletonGrid } from '@components/SkeletonCard';
import EmptyState from '@components/EmptyState';
import { formatDollars } from '@utils/format';
import { cn } from '@utils/cn';
import toast from 'react-hot-toast';

const TOPUP_AMOUNTS = [10, 50, 100];

const TABS = [
  ['listings', '내 리스팅'],
  ['library', '라이브러리'],
  ['wishlist', '위시리스트'],
  ['wallet', '지갑'],
] as const;

export default function DashboardPage() {
  const { user } = useAuthStore();

  usePageMeta({
    title: '대시보드 · PromptMarket',
    description: '내 리스팅, 라이브러리, 지갑을 관리하세요.',
  });

  const listingsQ = useMyListings();
  const libraryQ = useMyPurchases();
  const topupMut = useTopup();
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const myListings = Array.isArray(listingsQ.data) ? listingsQ.data : [];
  const library = Array.isArray(libraryQ.data) ? libraryQ.data : [];
  const error = listingsQ.error ?? libraryQ.error;

  async function handleTopup(dollars: number) {
    setPendingAmount(dollars);
    try {
      await topupMut.mutateAsync(dollars * 100);
    } catch {
      /* toast handled in hook */
    } finally {
      setPendingAmount(null);
    }
  }

  const totalEarnings = myListings.reduce(
    (sum, l) => sum + (l.earningsCents ?? 0),
    0,
  );
  const totalSales = myListings.reduce((sum, l) => sum + (l.salesCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="space-y-2 mb-9">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          대시보드
        </p>
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          @{user?.username ?? '메이커'}의 작업장
        </h1>
        <p className="text-ink-soft dark:text-bone-soft max-w-[44ch]">
          내 리스팅, 구매한 라이브러리, 지갑 잔고를 한 곳에서 관리하세요.
        </p>
      </header>

      <Tabs.Root defaultValue="listings">
        <Tabs.List
          aria-label="대시보드 섹션"
          className="inline-flex gap-1 p-1.5 rounded-2xl bg-canvas-sub dark:bg-night-sub border border-line dark:border-night-line"
        >
          {TABS.map(([key, label]) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className={cn(
                'relative px-4 py-2 rounded-xl text-[0.86rem] font-medium whitespace-nowrap motion-safe:transition focus-volt',
                'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone',
                'data-[state=active]:text-bone dark:data-[state=active]:text-ink',
              )}
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-ink dark:bg-bone rounded-xl shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.45)] opacity-0 data-[state=active]:opacity-100 motion-safe:transition"
              />
              <span className="relative">{label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {error && (
          <p className="mt-4 text-sm font-mono text-coral-deep dark:text-coral">
            {getErrorMessage(error)}
          </p>
        )}

        <Tabs.Content value="listings" className="mt-7 focus-visible:outline-none">
          {listingsQ.isPending ? (
            <SkeletonGrid count={6} />
          ) : myListings.length === 0 ? (
            <EmptyState
              emoji="🪺"
              title="아직 등록한 리스팅이 없어요"
              description="첫 리스팅을 게시하고 수익을 만들기 시작해 보세요."
              action={
                <Link
                  to="/sell"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.86rem] font-medium tracking-tight focus-volt lift-on-hover"
                >
                  <PlusCircle className="w-4 h-4" />
                  첫 리스팅 만들기
                  <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <StatCard label="리스팅" value={myListings.length.toString()} accent="volt" />
                <StatCard label="총 판매" value={totalSales.toString()} accent="violet" />
                <StatCard label="수익" value={formatDollars(totalEarnings)} accent="coral" />
              </div>
              <div className="cards-fluid">
                {myListings.map((l) => (
                  <div key={l.id} className="relative">
                    <ListingCard listing={l} />
                    <div className="mt-2 px-1 flex items-center justify-between text-[0.72rem] font-mono text-ink-mute dark:text-bone-mute">
                      <span>
                        판매 {l.salesCount ?? 0}건
                      </span>
                      <span className="font-semibold text-volt-700 dark:text-volt-300">
                        {formatDollars(l.earningsCents ?? 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Tabs.Content>

        <Tabs.Content value="library" className="mt-7 focus-visible:outline-none">
          {libraryQ.isPending ? (
            <SkeletonGrid count={6} />
          ) : library.length === 0 ? (
            <EmptyState
              emoji="📚"
              title="라이브러리가 비어 있어요"
              description="구매한 리스팅이 여기에 보여요."
              action={
                <Link
                  to="/browse"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.86rem] font-medium tracking-tight focus-volt lift-on-hover"
                >
                  카탈로그 둘러보기
                  <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
                </Link>
              }
            />
          ) : (
            <div className="cards-fluid">
              {library.map((l) => (
                <div key={l.id} className="space-y-2">
                  <ListingCard listing={l} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(`/listings/${l.slug}`)
                          .then(() => toast.success('링크 복사됨'))
                          .catch(() => undefined);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-[0.78rem] hover:border-volt-400 dark:hover:border-volt-500/60 hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition focus-volt"
                    >
                      <Copy className="w-3 h-3" />
                      링크 복사
                    </button>
                    <Link
                      to={`/listings/${l.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.78rem] motion-safe:transition focus-volt"
                    >
                      열기
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="wishlist" className="mt-7 focus-visible:outline-none">
          <WishlistTab />
        </Tabs.Content>

        <Tabs.Content value="wallet" className="mt-7 focus-visible:outline-none max-w-xl">
          <section className="relative overflow-hidden rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-7 sm:p-8">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-70"
              style={{
                background:
                  'radial-gradient(at 18% 18%, oklch(0.92 0.18 122 / 0.4) 0, transparent 55%), radial-gradient(at 82% 82%, oklch(0.66 0.24 305 / 0.25) 0, transparent 55%)',
              }}
            />
            <div className="grain-layer" aria-hidden style={{ opacity: 0.06 }} />

            <div className="inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
              <Wallet className="w-3.5 h-3.5" aria-hidden />
              현재 잔액
            </div>
            <p
              className="mt-2 font-display font-bold text-ink dark:text-bone tracking-[-0.04em] leading-none tabular-nums"
              style={{ fontSize: 'var(--text-display-md)' }}
            >
              {formatDollars(user?.balanceCents ?? 0)}
            </p>

            <div className="mt-7">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute mb-3">
                충전
              </p>
              <div className="flex flex-wrap gap-2.5">
                {TOPUP_AMOUNTS.map((amt) => {
                  const isThis = pendingAmount === amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => handleTopup(amt)}
                      disabled={topupMut.isPending}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.86rem] font-semibold tracking-tight motion-safe:transition focus-volt disabled:opacity-60',
                        isThis
                          ? 'bg-volt-300 text-ink'
                          : 'bg-canvas dark:bg-night text-ink dark:text-bone border border-line dark:border-night-line hover:border-volt-400 dark:hover:border-volt-500/60',
                      )}
                    >
                      {isThis ? (
                        <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" />
                      ) : (
                        <span aria-hidden>＋</span>
                      )}
                      {isThis ? '처리 중…' : `$${amt}`}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                데모 지갑이라 충전은 즉시 시뮬레이션 처리돼요.
              </p>
            </div>
          </section>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

const ACCENT_RING: Record<'volt' | 'violet' | 'coral', string> = {
  volt: 'bg-volt-500',
  violet: 'bg-violet',
  coral: 'bg-coral',
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'volt' | 'violet' | 'coral';
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5">
      <div className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
        <span aria-hidden className={cn('w-1.5 h-1.5 rounded-full', ACCENT_RING[accent])} />
        {label}
      </div>
      <p
        className="mt-2 font-mono font-bold text-ink dark:text-bone tracking-[-0.03em] tabular-nums leading-none"
        style={{ fontSize: 'clamp(1.5rem, 2vw + 0.875rem, 2.25rem)' }}
      >
        {value}
      </p>
    </div>
  );
}

function WishlistTab() {
  const { slugs, clear } = useWishlist();

  const results = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: listingKey(slug),
      queryFn: () =>
        api.get<ListingDetailResponse, ListingDetailResponse>(`/listings/${slug}`),
      staleTime: 10 * 60_000,
    })),
  });
  const items = results
    .map((r) => r.data?.listing)
    .filter((l): l is NonNullable<typeof l> => !!l);
  const pending = results.some((r) => r.isPending);

  if (slugs.length === 0) {
    return (
      <EmptyState
        emoji="💗"
        title="아직 담은 항목이 없어요"
        description="마음에 드는 리스팅의 카드 우하단 ♡ 버튼을 눌러 위시리스트에 담아 보세요."
        action={
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.85rem] font-medium focus-volt lift-on-hover"
          >
            카탈로그 둘러보기
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute inline-flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-coral" aria-hidden />
          담은 항목 {slugs.length}건
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-[0.78rem] font-medium text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral motion-safe:transition focus-volt rounded"
        >
          전부 지우기
        </button>
      </div>
      {pending && items.length === 0 ? (
        <SkeletonGrid count={4} />
      ) : (
        <div className="cards-fluid">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
