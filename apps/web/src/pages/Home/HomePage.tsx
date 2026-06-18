import CategoryChips from '@components/CategoryChips'
import SponsoredSpotlight from '@components/deskcloud/SponsoredSpotlight'
import EmptyState from '@components/EmptyState'
import FeaturedCarousel from '@components/FeaturedCarousel'
import Hero from '@components/Hero'
import ListingCard from '@components/ListingCard'
import ModelTabs from '@components/ModelTabs'
import RecentlyViewed from '@components/RecentlyViewed'
import SkeletonCard, { SkeletonGrid } from '@components/SkeletonCard'
import { useListings, useStats } from '@domains/marketplace/queries'
import { usePageMeta } from '@hooks/usePageMeta'
import { useReveal } from '@hooks/useReveal'
import { useSpotlight } from '@hooks/useSpotlight'
import { useStructuredData } from '@hooks/useStructuredData'
import { getErrorMessage } from '@infrastructure/api'
import { LISTING_TYPE_META, MODELS } from '@promptmarket/shared'
import { cn } from '@utils/cn'
import { typeGradient, formatCompact } from '@utils/format'
import {
  AlertCircle,
  ArrowUpRight,
  Download,
  Layers,
  RefreshCw,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const { t, i18n } = useTranslation('home')
  const featuredQ = useListings({ sort: 'top', pageSize: 6 })
  const trendingQ = useListings({ sort: 'trending', pageSize: 8 })
  // pageSize: 10 matches Hero's DropsMarquee consumption; Hero receives items as a prop
  // so React Query dedupes the request (same cache key) — no separate fetch in Hero.
  const recentQ = useListings({ sort: 'newest', pageSize: 10 })

  const featured = featuredQ.data?.items ?? []
  const trending = trendingQ.data?.items ?? []
  // Carousel shows up to 8; Hero drops marquee uses up to 10 — slice at use-site
  const recent = recentQ.data?.items ?? []
  const error = trendingQ.error ?? recentQ.error ?? featuredQ.error

  usePageMeta({
    title: t('meta.title'),
    description: t('meta.description'),
  })

  // WebSite + SearchAction so Google can render a sitelinks search box.
  // Memoised on [origin] so the effect only re-injects the JSON-LD when the
  // origin changes (never in practice), not on every render.
  const origin = useMemo(
    () => (typeof window !== 'undefined' ? globalThis.location.origin : ''),
    []
  )
  const structuredData = useMemo(
    () =>
      origin
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'PromptMarket',
            ...(i18n.resolvedLanguage === 'ko' ? { alternateName: '프롬프트마켓' } : {}),
            url: origin,
            inLanguage: i18n.resolvedLanguage ?? 'ko',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${origin}/browse?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          }
        : null,
    [origin, i18n.resolvedLanguage]
  )
  useStructuredData(structuredData)

  return (
    <div className="animate-fade-in">
      <ScrollProgress />
      <Hero recentItems={recent} recentPending={recentQ.isPending} />

      {/* Marquee strip — horizontal infinite-scrolling section anchor */}
      <MarqueeStrip />

      {/* Trust band — honest social proof derived from already-fetched data */}
      <TrustSignals pools={[featured, trending, recent]} />

      <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(3rem,6vw,5rem)] space-y-[clamp(3.5rem,7vw,7rem)]">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral-deep dark:border-coral/45 dark:bg-coral/15 dark:text-coral"
          >
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-mono">{getErrorMessage(error)}</span>
          </div>
        )}

        {/* FEATURED — bento grid */}
        <section aria-labelledby="home-featured-heading">
          <SectionHeader
            id="home-featured-heading"
            chapter={t('sections.featured.chapter')}
            title={t('sections.featured.title')}
            kicker={t('sections.featured.kicker')}
            href="/browse?sort=top"
          />
          {featuredQ.isPending ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 auto-rows-[1fr]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}>
                  <SkeletonCard seed={i} />
                </div>
              ))}
            </div>
          ) : featuredQ.isError ? (
            <SectionError
              message={getErrorMessage(featuredQ.error)}
              onRetry={() => featuredQ.refetch()}
              retryLabel={t('featured.errorRetry')}
            />
          ) : featured.length ? (
            <BentoFeatured items={featured} />
          ) : (
            <EmptyState
              variant="discover"
              emoji="✨"
              title={t('featured.emptyTitle')}
              description={t('featured.emptyDescription')}
            />
          )}
        </section>

        {/* SPONSORED SPOTLIGHT — native AdDesk rail; renders only when served */}
        <SponsoredSpotlight />

        {/* CATEGORIES */}
        <section aria-labelledby="home-categories-heading">
          <SectionHeader
            id="home-categories-heading"
            chapter={t('sections.categories.chapter')}
            title={t('sections.categories.title')}
            kicker={t('sections.categories.kicker')}
          />
          <CategoryChips />
        </section>

        {/* TRENDING — large left + carousel right on desktop */}
        <section aria-labelledby="home-trending-heading">
          <SectionHeader
            id="home-trending-heading"
            chapter={t('sections.trending.chapter')}
            title={t('sections.trending.title')}
            kicker={t('sections.trending.kicker')}
            href="/browse?sort=trending"
          />
          {trendingQ.isPending ? (
            <SkeletonGrid count={8} label={t('common:actions.loading')} />
          ) : trendingQ.isError ? (
            <SectionError
              message={getErrorMessage(trendingQ.error)}
              onRetry={() => trendingQ.refetch()}
              retryLabel={t('trending.errorRetry')}
            />
          ) : trending.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-gap-lg)]">
              {/* Lead: oversized — keeps presence on wide viewports, full-width on narrow */}
              <div className="lg:col-span-5 min-w-0">
                <ListingCard listing={trending[0]} variant="featured" />
              </div>
              {/* Grid of 6 — auto-fit so it reflows fluidly between 2 and 3 columns */}
              <div className="lg:col-span-7 min-w-0 cards-fluid">
                {trending.slice(1, 7).map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              variant="discover"
              emoji="🔥"
              title={t('trending.emptyTitle')}
              description={t('trending.emptyDescription')}
            />
          )}
        </section>

        {/* RECENT — featured carousel keeps horizontal momentum */}
        <section aria-labelledby="home-recent-heading">
          <SectionHeader
            id="home-recent-heading"
            chapter={t('sections.recent.chapter')}
            title={t('sections.recent.title')}
            kicker={t('sections.recent.kicker')}
            href="/browse?sort=newest"
          />
          {recentQ.isError ? (
            <SectionError
              message={getErrorMessage(recentQ.error)}
              onRetry={() => recentQ.refetch()}
              retryLabel={t('recent.errorRetry')}
            />
          ) : (
            <FeaturedCarousel items={recent.slice(0, 8)} loading={recentQ.isPending} />
          )}
        </section>

        {/* RECENTLY VIEWED — only renders when localStorage has entries */}
        <RecentlyViewed />

        {/* MAKER SPOTLIGHT */}
        <MakerSpotlight items={featured} />

        {/* MODEL TABS */}
        <section aria-label={t('sections.models')}>
          <ModelTabs />
        </section>

        {/* CTA */}
        <SellerCallToAction />
      </div>
    </div>
  )
}

/* ---------- Scroll progress bar --------------------------------------- */

function ScrollProgress() {
  const [state, setState] = useState({ complete: false, progress: 0 })
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const hero = document.querySelector<HTMLElement>('[data-home-hero]')
      const scrollTop = globalThis.scrollY || document.documentElement.scrollTop || 0
      const top = hero?.offsetTop ?? 0
      const height = Math.max(1, hero?.offsetHeight ?? globalThis.innerHeight)
      const raw = (scrollTop - top) / height
      const progress = Math.min(1, Math.max(0, raw))
      const complete = raw >= 1
      setState((prev) =>
        prev.progress === progress && prev.complete === complete ? prev : { complete, progress }
      )
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    globalThis.addEventListener('scroll', onScroll, { passive: true })
    tick()
    return () => {
      globalThis.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div
      aria-hidden
      className={cn('scroll-progress', state.complete && 'is-complete')}
      style={{ ['--progress' as string]: state.progress }}
    />
  )
}

/* ---------- Section error state ---------------------------------------- */

function SectionError({
  message,
  onRetry,
  retryLabel,
}: {
  message: string
  onRetry: () => void
  retryLabel: string
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm dark:border-coral/45 dark:bg-coral/15"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 font-mono text-coral-deep dark:text-coral">
        <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
        <span className="truncate">{message}</span>
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1 text-ink hover:border-ink focus-volt motion-safe:transition ease-expo dark:border-night-line dark:bg-night-sub dark:text-bone dark:hover:border-bone"
      >
        <RefreshCw aria-hidden className="h-3.5 w-3.5" />
        {retryLabel}
      </button>
    </div>
  )
}

/* ---------- Section primitives ----------------------------------------- */

function SectionHeader({
  id,
  chapter,
  title,
  kicker,
  href,
}: {
  id?: string
  chapter: string
  title: string
  kicker?: string
  href?: string
}) {
  const { t } = useTranslation('home')
  const { ref, revealed } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className="reveal flex flex-col lg:flex-row lg:items-end justify-between gap-3 lg:gap-6 mb-7 lg:mb-9"
    >
      <div className="space-y-2">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span
            aria-hidden
            data-bar
            className="w-6 h-px bg-volt-500 origin-left scale-x-0 motion-safe:transition-transform ease-expo motion-safe:duration-700"
          />
          {chapter}
        </p>
        <h2
          id={id}
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.03em] display-tight"
          style={{ fontSize: 'var(--text-display-sm)' }}
        >
          {title}
        </h2>
        {kicker && (
          <p className="text-ink-mute dark:text-bone-mute text-[0.95rem] max-w-prose">{kicker}</p>
        )}
      </div>
      {href && (
        <Link
          to={href}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line dark:border-night-line bg-canvas/60 dark:bg-night-sub/40 hover:border-ink dark:hover:border-bone text-ink dark:text-bone text-[0.83rem] font-medium motion-safe:transition ease-expo focus-volt shrink-0"
        >
          {t('common.viewAll')}
          <ArrowUpRight
            aria-hidden
            className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          />
        </Link>
      )}
    </div>
  )
}

/* ---------- Maker Spotlight ------------------------------------------- */

function MakerSpotlight({ items }: { items: import('@/types').ListingCard[] }) {
  const { t } = useTranslation('home')
  const spotlightRef = useSpotlight<HTMLDivElement>()
  const { ref, revealed } = useReveal<HTMLDivElement>()
  const [spotlightSlot] = useState(() => Math.floor(Date.now() / (3 * 60 * 60 * 1000)))

  // Rotate the featured maker across distinct authors in the featured pool,
  // pinned per ~3-hour window so the same visitor sees the same spotlight
  // within a session but the home page feels alive across the day.
  const maker = useMemo(() => {
    const seen = new Set<string>()
    const candidates = items
      .filter((l) => {
        const u = l.author?.username
        if (!u || seen.has(u)) return false
        seen.add(u)
        return true
      })
      .map((l) => l.author!.username!)
    if (candidates.length === 0) {
      return { username: 'mira', avatar: 'M', listings: [] as typeof items }
    }
    const username = candidates[spotlightSlot % candidates.length]
    const listings = items.filter((l) => l.author?.username === username).slice(0, 3)
    return {
      username,
      avatar: username[0]?.toUpperCase() ?? 'M',
      listings,
    }
  }, [items, spotlightSlot])
  return (
    <section
      ref={ref}
      data-revealed={revealed}
      className="reveal relative"
      aria-labelledby="home-maker-heading"
    >
      <div
        ref={spotlightRef}
        className="spotlight-host relative overflow-hidden rounded-[2rem] surface-card border-line dark:border-night-line"
      >
        <div
          className="spotlight"
          aria-hidden
          style={{ ['--spot-color' as string]: 'oklch(0.83 0.23 124 / 0.22)' }}
        />
        <div className="cursor-sheen" aria-hidden />
        <div className="grain-layer" aria-hidden />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-10 p-[clamp(1.75rem,4vw,3.5rem)]">
          {/* Left: maker block */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <h2
              id="home-maker-heading"
              className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2"
            >
              <span aria-hidden className="w-6 h-px bg-volt-500" />
              {t('makerSpotlight.chapter')}
            </h2>
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className="relative inline-flex w-16 h-16 rounded-2xl bg-ink dark:bg-bone text-bone dark:text-ink font-display font-bold text-[1.7rem] items-center justify-center -rotate-3"
              >
                {maker.avatar}
                <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-volt-400 ring-2 ring-canvas-sub dark:ring-night-sub" />
              </span>
              <div>
                <p className="font-display text-[1.8rem] font-bold text-ink dark:text-bone leading-none tracking-[-0.03em]">
                  @{maker.username}
                </p>
                <p className="mt-1 text-[0.78rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                  {t('makerSpotlight.role')}
                </p>
              </div>
            </div>
            <p className="text-ink-soft dark:text-bone-soft leading-relaxed max-w-[44ch]">
              {t('makerSpotlight.bio')}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['claude', 'mcp', 'workflows', 'agents'].map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[0.66rem] uppercase tracking-[0.16em] px-2.5 py-1 rounded-full bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft border border-line dark:border-night-line"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              to={`/users/${maker.username}`}
              className="self-start group inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full bg-ink text-bone dark:bg-bone dark:text-ink font-medium text-[0.85rem] tracking-tight focus-volt lift-on-hover"
            >
              <Sparkles aria-hidden className="w-4 h-4" />
              {t('makerSpotlight.viewMaker')}
              <ArrowUpRight
                aria-hidden
                className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          {/* Right: 3 drops vertically stacked */}
          <ul className="lg:col-span-7 flex flex-col gap-3">
            {maker.listings.length > 0 ? (
              maker.listings.map((l) => (
                <li key={l.id}>
                  <Link
                    to={`/listings/${l.slug}`}
                    className="group flex items-stretch gap-4 p-3 sm:p-4 rounded-2xl border border-line dark:border-night-line bg-canvas/70 dark:bg-night/40 hover:bg-canvas-deep/70 dark:hover:bg-night-deep/70 hover:border-volt-400/60 dark:hover:border-volt-500/40 motion-safe:transition ease-expo"
                  >
                    <div
                      className={cn(
                        'shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-[2.5rem] sm:text-[3rem] bg-gradient-to-br',
                        typeGradient(l.type)
                      )}
                    >
                      {l.coverEmoji || LISTING_TYPE_META[l.type].emoji}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                      <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                        {t('common:types.' + l.type, {
                          defaultValue: LISTING_TYPE_META[l.type]?.label ?? l.type,
                        })}
                      </span>
                      <h3 className="font-display font-semibold text-ink dark:text-bone text-[1.05rem] leading-tight line-clamp-2 group-hover:text-volt-800 dark:group-hover:text-volt-200 motion-safe:transition-colors ease-expo">
                        {l.title}
                      </h3>
                      <p className="text-[0.83rem] text-ink-mute dark:text-bone-mute line-clamp-1">
                        {l.description}
                      </p>
                    </div>
                    <ArrowUpRight
                      aria-hidden
                      className="self-center w-5 h-5 text-ink-mute dark:text-bone-mute opacity-0 -translate-x-2 motion-safe:transition ease-expo motion-safe:group-hover:opacity-100 motion-safe:group-hover:translate-x-0"
                    />
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <div className="p-8 rounded-2xl border border-dashed border-line dark:border-night-line text-center text-ink-mute dark:text-bone-mute">
                  {t('makerSpotlight.empty')}
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- Bento featured grid ---------------------------------------- */

function BentoFeatured({ items }: { items: import('@/types').ListingCard[] }) {
  const [lead, ...rest] = items
  if (!lead) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-gap-lg)] auto-rows-[minmax(0,1fr)]">
      <div className="sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2 min-w-0">
        <ListingCard listing={lead} variant="featured" />
      </div>
      {rest.slice(0, 4).map((l) => (
        <ListingCard key={l.id} listing={l} className="min-w-0" />
      ))}
    </div>
  )
}

/* ---------- Marquee strip ---------------------------------------------- */

function MarqueeStrip() {
  const { t } = useTranslation('home')
  const items = useMemo(() => {
    const w = t('marquee.words', { returnObjects: true }) as string[]
    return [...w, ...w]
  }, [t])
  return (
    <div
      aria-hidden="true"
      className="border-y border-line dark:border-night-line bg-ink text-bone dark:bg-bone dark:text-ink overflow-hidden"
    >
      <div className="flex items-center gap-12 py-4 marquee-track whitespace-nowrap">
        {items.map((w, i) => (
          <span
            key={i}
            className="font-display font-bold tracking-[-0.04em] text-[clamp(1.5rem,2.4vw,2.4rem)] inline-flex items-center gap-12"
          >
            {w}
            <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-volt-500" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- Trust signals band ----------------------------------------- */

type TrustListing = {
  priceCents: number
  avgRating: number
  reviewCount: number
  downloads: number
}

/**
 * Honest social-proof band sitting between the hero and the catalog. Every
 * number is derived from data the page already fetched (the featured /
 * trending / recent pools) plus the public stats aggregate — no extra
 * requests, no fabricated testimonials. Renders nothing until there is at
 * least one rated listing to summarise, so empty / loading states stay clean.
 */
function TrustSignals({ pools }: { pools: Array<ReadonlyArray<TrustListing>> }) {
  const { t } = useTranslation('home')
  const { data: stats } = useStats()
  const { ref, revealed } = useReveal<HTMLDivElement>()

  const agg = useMemo(() => {
    // De-dupe across pools by identity so an item appearing in two pools is
    // only counted once in the rating average.
    const seen = new Set<TrustListing>()
    let ratingSum = 0
    let ratedCount = 0
    let reviewTotal = 0
    let freeCount = 0
    for (const pool of pools) {
      for (const l of pool) {
        if (seen.has(l)) continue
        seen.add(l)
        if (l.reviewCount > 0 && l.avgRating > 0) {
          ratingSum += l.avgRating
          ratedCount += 1
          reviewTotal += l.reviewCount
        }
        if ((l.priceCents ?? 0) === 0) freeCount += 1
      }
    }
    return {
      avgRating: ratedCount ? ratingSum / ratedCount : 0,
      reviewTotal,
      ratedCount,
      freeCount,
    }
  }, [pools])

  // Nothing trustworthy to show yet — stay out of the way.
  if (agg.ratedCount === 0) return null

  const downloads = stats?.totalDownloads ?? 0

  const signals: Array<{
    key: string
    icon: typeof Star
    value: string
    caption: string
    accent: string
  }> = [
    {
      key: 'rating',
      icon: Star,
      value: t('trust.rating.value', { value: agg.avgRating.toFixed(1) }),
      caption: t('trust.rating.caption', { count: agg.reviewTotal }),
      accent: 'text-volt-700 dark:text-volt-300',
    },
    ...(downloads > 0
      ? [
          {
            key: 'downloads',
            icon: Download,
            value: t('trust.downloads.value', { value: formatCompact(downloads) }),
            caption: t('trust.downloads.caption'),
            accent: 'text-violet-deep dark:text-violet-soft',
          },
        ]
      : []),
    ...(agg.freeCount > 0
      ? [
          {
            key: 'free',
            icon: Tag,
            value: t('trust.free.value', { count: agg.freeCount }),
            caption: t('trust.free.caption'),
            accent: 'text-coral-deep dark:text-coral',
          },
        ]
      : []),
    {
      key: 'models',
      icon: Layers,
      value: t('trust.models.value', { count: MODELS.length }),
      caption: t('trust.models.caption'),
      accent: 'text-ink dark:text-bone',
    },
  ]

  return (
    <section
      aria-labelledby="home-trust-heading"
      className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(2rem,4vw,3rem)]"
    >
      <div
        ref={ref}
        data-revealed={revealed}
        className="reveal surface-card border border-line dark:border-night-line rounded-3xl overflow-hidden"
      >
        <h2
          id="home-trust-heading"
          className="flex items-center gap-2 px-6 sm:px-8 pt-5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute"
        >
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          {t('trust.label')}
        </h2>
        <dl className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-line dark:divide-night-line">
          {signals.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.key} className="flex flex-col gap-1.5 px-6 sm:px-8 py-5 sm:py-6 min-w-0">
                <dt
                  className={cn(
                    'inline-flex items-center gap-2 font-display font-bold leading-none tracking-[-0.03em] tabular-nums',
                    s.accent
                  )}
                  style={{ fontSize: 'var(--text-display-sm)' }}
                >
                  <Icon aria-hidden className="w-[0.7em] h-[0.7em] shrink-0" />
                  {s.value}
                </dt>
                <dd className="text-[0.8rem] text-ink-mute dark:text-bone-mute leading-snug max-w-[22ch] m-0">
                  {s.caption}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}

/* ---------- Seller CTA ------------------------------------------------- */

function SellerCallToAction() {
  const { t } = useTranslation('home')
  const stats: Array<[string, string]> = [
    [t('cta.stats.payoutValue'), t('cta.stats.payoutLabel')],
    [t('cta.stats.timeValue'), t('cta.stats.timeLabel')],
    [t('cta.stats.costValue'), t('cta.stats.costLabel')],
  ]
  return (
    <section
      className="relative isolate overflow-hidden rounded-[2rem] surface-card border-line-strong dark:border-night-line-strong"
      aria-labelledby="home-cta-heading"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(at 18% 18%, oklch(0.92 0.18 122 / 0.6) 0, transparent 55%), radial-gradient(at 82% 82%, oklch(0.66 0.24 305 / 0.35) 0, transparent 55%)',
        }}
      />
      <div className="grain-layer" aria-hidden />
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-10 px-7 sm:px-10 lg:px-14 py-12 sm:py-16">
        <div className="lg:col-span-7">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink-soft mb-3">
            {t('cta.kicker')}
          </p>
          <h2
            id="home-cta-heading"
            className="font-display font-bold leading-[0.92] tracking-[-0.035em] text-ink display-tight"
            style={{ fontSize: 'var(--text-display-md)' }}
          >
            {t('cta.titleLine1')} <span className="block">{t('cta.titleLine2')}</span>
          </h2>
          <p className="mt-5 text-ink-soft text-[1.05rem] leading-relaxed max-w-[44ch]">
            {t('cta.body')}
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-8 lg:bg-ink/[0.04] dark:lg:bg-bone/[0.04] lg:rounded-2xl lg:p-6 flex flex-col justify-center gap-5">
          <ul className="space-y-2.5 text-ink text-[0.95rem]">
            {stats.map(([n, l]) => (
              <li key={l} className="flex items-baseline gap-3">
                <span className="font-mono text-volt-800 font-semibold w-20 shrink-0">{n}</span>
                <span className="text-ink-soft">{l}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2.5 pt-3">
            <Link
              to="/sell"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-bone font-medium tracking-tight focus-volt lift-on-hover"
            >
              {t('cta.startListing')}
              <ArrowUpRight
                aria-hidden
                className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-5 py-3 rounded-full border border-ink/20 text-ink font-medium tracking-tight hover:bg-ink/5 focus-volt motion-safe:transition ease-expo"
            >
              {t('cta.openDashboard')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
