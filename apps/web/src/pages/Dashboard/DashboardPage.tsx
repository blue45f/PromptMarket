import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Tabs from '@radix-ui/react-tabs'
import { useQueries } from '@tanstack/react-query'
import axios from 'axios'
import { ArrowUpRight, Copy, Heart, Loader2, PlusCircle, Wallet } from 'lucide-react'
import { api, getErrorMessage } from '@services/api'
import { useMyListings, useMyPurchases, useTopup, useListings } from '@features/marketplace/queries'
import { listingKey } from '@features/marketplace/queryKeys'
import type { ListingDetailResponse } from '@/types'
import { useAuthStore } from '@store/auth'
import { useWishlist } from '@hooks/useWishlist'
import { usePageMeta } from '@hooks/usePageMeta'
import ListingCard from '@components/ListingCard'
import { SkeletonGrid } from '@components/SkeletonCard'
import EmptyState from '@components/EmptyState'
import { formatDollars } from '@utils/format'
import { cn } from '@utils/cn'
import toast from 'react-hot-toast'

const TOPUP_AMOUNTS = [10, 50, 100]

const TAB_KEYS = ['listings', 'library', 'wishlist', 'wallet'] as const
type DashboardTab = (typeof TAB_KEYS)[number]

function tabFromSearchParam(value: string | null): DashboardTab {
  return TAB_KEYS.includes(value as DashboardTab) ? (value as DashboardTab) : 'listings'
}

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = tabFromSearchParam(searchParams.get('tab'))
  const [activeTab, setActiveTab] = useState<DashboardTab>(tabParam)

  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  usePageMeta({
    title: t('meta.title'),
    description: t('meta.description'),
  })

  const listingsQ = useMyListings()
  const libraryQ = useMyPurchases()
  const topupMut = useTopup()
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)

  const myListings = Array.isArray(listingsQ.data) ? listingsQ.data : []
  // Purchases come back as wrappers ({ id, pricePaidCents, createdAt, listing });
  // unwrap to the flat card the grid renders. Filter out any purchase whose
  // listing is absent (soft-deleted race) to prevent a crash on p.listing.id.
  const libraryItems = useMemo(
    () =>
      (Array.isArray(libraryQ.data) ? libraryQ.data : [])
        .filter(
          (p): p is typeof p & { listing: NonNullable<(typeof p)['listing']> } => p.listing != null
        )
        .map((p) => p.listing),
    [libraryQ.data]
  )
  const error = listingsQ.error ?? libraryQ.error

  async function handleTopup(dollars: number) {
    setPendingAmount(dollars)
    try {
      await topupMut.mutateAsync(dollars * 100)
    } catch {
      /* toast handled in hook */
    } finally {
      setPendingAmount(null)
    }
  }

  function handleTabChange(value: string) {
    const next = tabFromSearchParam(value)
    setActiveTab(next)
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        if (next === 'listings') {
          params.delete('tab')
        } else {
          params.set('tab', next)
        }
        return params
      },
      { replace: true }
    )
  }

  const { totalEarnings, totalSales } = useMemo(
    () => ({
      totalEarnings: myListings.reduce((sum, l) => sum + (l.earningsCents ?? 0), 0),
      totalSales: myListings.reduce((sum, l) => sum + (l.salesCount ?? 0), 0),
    }),
    [myListings]
  )

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="space-y-2 mb-9">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          {t('header.eyebrow')}
        </p>
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('header.title', { username: user?.username ?? t('header.fallbackName') })}
        </h1>
        <p className="text-ink-soft dark:text-bone-soft max-w-[44ch]">{t('header.subtitle')}</p>
      </header>

      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List
          aria-label={t('tabs.aria')}
          className="inline-flex gap-1 p-1.5 rounded-2xl bg-canvas-sub dark:bg-night-sub border border-line dark:border-night-line"
        >
          {TAB_KEYS.map((key) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className={cn(
                'relative px-4 py-2 rounded-xl text-[0.86rem] font-medium whitespace-nowrap motion-safe:transition ease-expo focus-volt',
                'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone',
                'data-[state=active]:text-bone dark:data-[state=active]:text-ink'
              )}
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-ink dark:bg-bone rounded-xl shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.45)] opacity-0 data-[state=active]:opacity-100 motion-safe:transition ease-expo"
              />
              <span className="relative">{t(`tabs.${key}`)}</span>
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
              title={t('listings.empty.title')}
              description={t('listings.empty.description')}
              action={
                <Link
                  to="/sell"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.86rem] font-medium tracking-tight focus-volt lift-on-hover"
                >
                  <PlusCircle aria-hidden className="w-4 h-4" />
                  {t('listings.empty.action')}
                  <ArrowUpRight
                    aria-hidden
                    className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                  />
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <StatCard
                  label={t('stats.listings')}
                  value={myListings.length.toString()}
                  accent="volt"
                />
                <StatCard
                  label={t('stats.totalSales')}
                  value={totalSales.toString()}
                  accent="violet"
                />
                <StatCard
                  label={t('stats.earnings')}
                  value={formatDollars(totalEarnings)}
                  accent="coral"
                />
              </div>
              <div className="cards-fluid">
                {myListings.map((l) => (
                  <div key={l.id} className="relative">
                    <ListingCard listing={l} />
                    <div className="mt-2 px-1 flex items-center justify-between text-[0.72rem] font-mono text-ink-mute dark:text-bone-mute">
                      <span>{t('listings.salesCount', { count: l.salesCount ?? 0 })}</span>
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
          ) : libraryItems.length === 0 ? (
            <EmptyLibraryWithRecs />
          ) : (
            <div className="cards-fluid">
              {libraryItems.map((l) => (
                <div key={l.id} className="space-y-2">
                  <ListingCard listing={l} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={t('library.copyLinkFor', { title: l.title })}
                      onClick={() => {
                        navigator.clipboard
                          .writeText(window.location.origin + `/listings/${l.slug}`)
                          .then(() => toast.success(t('library.copied')))
                          .catch(() => undefined)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-[0.78rem] hover:border-volt-400 dark:hover:border-volt-500/60 hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition ease-expo focus-volt"
                    >
                      <Copy aria-hidden className="w-3 h-3" />
                      {t('library.copyLink')}
                    </button>
                    <Link
                      to={`/listings/${l.slug}`}
                      aria-label={t('library.openListing', { title: l.title })}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.78rem] motion-safe:transition ease-expo focus-volt"
                    >
                      {t('library.open')}
                      <ArrowUpRight aria-hidden className="w-3 h-3" />
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
          <section
            aria-labelledby="wallet-heading"
            className="relative overflow-hidden rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-7 sm:p-8"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-70"
              style={{
                background:
                  'radial-gradient(at 18% 18%, oklch(0.92 0.18 122 / 0.4) 0, transparent 55%), radial-gradient(at 82% 82%, oklch(0.66 0.24 305 / 0.25) 0, transparent 55%)',
              }}
            />
            <div className="grain-layer" aria-hidden style={{ opacity: 0.06 }} />

            <h2 id="wallet-heading" className="sr-only">
              {t('wallet.title')}
            </h2>
            <p className="inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
              <Wallet className="w-3.5 h-3.5" aria-hidden />
              {t('wallet.balance')}
            </p>
            <p
              className="mt-2 font-display font-bold text-ink dark:text-bone tracking-[-0.04em] leading-none tabular-nums"
              style={{ fontSize: 'var(--text-display-md)' }}
            >
              {formatDollars(user?.balanceCents ?? 0)}
            </p>

            <div className="mt-7">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute mb-3">
                {t('wallet.topup')}
              </p>
              <span className="sr-only" role="status" aria-live="polite">
                {topupMut.isPending ? t('wallet.loadingTopup') : ''}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {TOPUP_AMOUNTS.map((amt) => {
                  const isThis = pendingAmount === amt
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleTopup(amt)}
                      disabled={topupMut.isPending}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.86rem] font-semibold tracking-tight motion-safe:transition ease-expo focus-volt disabled:opacity-60',
                        isThis
                          ? 'bg-volt-300 text-ink'
                          : 'bg-canvas dark:bg-night text-ink dark:text-bone border border-line dark:border-night-line hover:border-volt-400 dark:hover:border-volt-500/60'
                      )}
                    >
                      {isThis ? (
                        <Loader2 aria-hidden className="w-3.5 h-3.5 motion-safe:animate-spin" />
                      ) : (
                        <span aria-hidden>＋</span>
                      )}
                      {isThis ? t('wallet.processing') : formatDollars(amt * 100)}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                {t('wallet.note')}
              </p>
            </div>
          </section>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

const ACCENT_RING: Record<'volt' | 'violet' | 'coral', string> = {
  volt: 'bg-volt-500',
  violet: 'bg-violet',
  coral: 'bg-coral',
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'volt' | 'violet' | 'coral'
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
  )
}

function EmptyLibraryWithRecs() {
  const { t } = useTranslation('dashboard')
  const { data, isPending, isError } = useListings({ free: 'true', sort: 'top', pageSize: 4 })
  const items = data?.items ?? []

  return (
    <div className="space-y-7">
      <EmptyState
        emoji="📚"
        title={t('library.empty.title')}
        description={t('library.empty.description')}
        action={
          <Link
            to="/browse"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.86rem] font-medium tracking-tight focus-volt lift-on-hover"
          >
            {t('library.empty.action')}
            <ArrowUpRight
              aria-hidden
              className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
            />
          </Link>
        }
      />
      {!isError && (
        <section aria-labelledby="library-recs-heading">
          <h2
            id="library-recs-heading"
            className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mb-4"
          >
            <span aria-hidden className="w-5 h-px bg-volt-500" />
            {t('library.recs')}
          </h2>
          {isPending ? (
            <SkeletonGrid count={4} />
          ) : items.length > 0 ? (
            <div className="cards-fluid">
              {items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}

const WISHLIST_PAGE_LIMIT = 20

function WishlistTab() {
  const { t } = useTranslation('dashboard')
  const { slugs, toggle, clear } = useWishlist()
  const [clearPending, setClearPending] = useState(false)

  // Cap the visible slugs to prevent a 200-request fan-out
  const visibleSlugs = slugs.slice(0, WISHLIST_PAGE_LIMIT)
  const isCapped = slugs.length > WISHLIST_PAGE_LIMIT

  const results = useQueries({
    queries: visibleSlugs.map((slug) => ({
      queryKey: listingKey(slug),
      queryFn: () => api.get<ListingDetailResponse, ListingDetailResponse>(`/listings/${slug}`),
      staleTime: 10 * 60_000,
    })),
  })
  // Resolve each saved slug. A 404 means the listing was deleted, so it can be
  // pruned safely; transient errors (500/offline) are NOT treated as gone, to
  // avoid silently dropping saved items the user can still recover.
  const { resolved, items, deadSlugs } = useMemo(() => {
    const resolved = results.map((r, i) => ({
      slug: visibleSlugs[i],
      listing: r.data,
      gone: axios.isAxiosError(r.error) && r.error.response?.status === 404,
    }))
    return {
      resolved,
      items: resolved.map((x) => x.listing).filter((l): l is NonNullable<typeof l> => !!l),
      deadSlugs: resolved.filter((x) => x.gone).map((x) => x.slug),
    }
  }, [results, visibleSlugs])
  const pending = results.some((r) => r.isPending)

  function handleClearClick() {
    if (!clearPending) {
      setClearPending(true)
      return
    }
    clear()
    setClearPending(false)
  }

  if (slugs.length === 0) {
    return (
      <EmptyState
        emoji="💗"
        title={t('wishlist.empty.title')}
        description={t('wishlist.empty.description')}
        action={
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink text-[0.85rem] font-medium focus-volt lift-on-hover"
          >
            {t('wishlist.empty.action')}
            <ArrowUpRight aria-hidden className="w-4 h-4" />
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute inline-flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-coral" aria-hidden />
          {t('wishlist.count', { count: slugs.length })}
        </p>
        <div className="flex items-center gap-2">
          <span className="sr-only" role="status" aria-live="polite">
            {clearPending ? t('wishlist.confirmPrompt') : ''}
          </span>
          {clearPending && (
            <button
              type="button"
              onClick={() => setClearPending(false)}
              className="text-[0.78rem] font-medium text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone motion-safe:transition ease-expo focus-volt rounded"
            >
              {t('wishlist.clearConfirm.cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClearClick}
            className={cn(
              'text-[0.78rem] font-medium motion-safe:transition ease-expo focus-volt rounded',
              clearPending
                ? 'text-coral-deep dark:text-coral hover:underline'
                : 'text-ink-mute dark:text-bone-mute hover:text-coral-deep dark:hover:text-coral'
            )}
          >
            {clearPending ? t('wishlist.clearConfirm.confirm') : t('wishlist.clear')}
          </button>
        </div>
      </div>
      {deadSlugs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub px-4 py-3">
          <p className="text-[0.78rem] text-ink-soft dark:text-bone-soft">
            {t('wishlist.unavailable.note', { count: deadSlugs.length })}
          </p>
          <button
            type="button"
            onClick={() => deadSlugs.forEach(toggle)}
            className="text-[0.78rem] font-medium text-coral-deep dark:text-coral hover:underline motion-safe:transition ease-expo focus-volt rounded"
          >
            {t('wishlist.unavailable.remove')}
          </button>
        </div>
      )}
      {pending && items.length === 0 ? (
        <SkeletonGrid count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          emoji="🪹"
          title={t('wishlist.unavailable.title')}
          description={t('wishlist.unavailable.description')}
        />
      ) : (
        <>
          <div className="cards-fluid">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          {isCapped && (
            <p className="text-center text-[0.78rem] text-ink-mute dark:text-bone-mute mt-2">
              {t('wishlist.showingCapped', { total: slugs.length })}
            </p>
          )}
        </>
      )}
    </div>
  )
}
