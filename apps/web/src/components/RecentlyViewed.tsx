import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye, X } from 'lucide-react'
import { api } from '@services/api'
import { listingKey } from '@features/marketplace/queryKeys'
import type { ListingDetailResponse } from '@/types'
import { useRecentlyViewed } from '@hooks/useRecentlyViewed'
import ListingCard from './ListingCard'
import SkeletonCard from './SkeletonCard'
import { cn } from '@utils/cn'

interface RecentlyViewedProps {
  /** Slug to exclude from the rail (e.g. when shown on a detail page). */
  excludeSlug?: string
  className?: string
  /** Max items to render. Defaults to 8. */
  limit?: number
}

/* ---------------------------------------------------------------------------
 * RecentlyViewed — a horizontal rail of the listings the visitor has opened
 * recently. localStorage-only (no server-side tracking) so it works for
 * signed-out visitors and adds zero API contract surface.
 * ------------------------------------------------------------------------- */

export default function RecentlyViewed({ excludeSlug, className, limit = 8 }: RecentlyViewedProps) {
  const { t } = useTranslation('home')
  const { slugs, clear } = useRecentlyViewed()

  const visible = useMemo(() => {
    return slugs.filter((s) => s !== excludeSlug).slice(0, limit)
  }, [slugs, excludeSlug, limit])

  const results = useQueries({
    queries: visible.map((slug) => ({
      queryKey: listingKey(slug),
      queryFn: () => api.get<ListingDetailResponse, ListingDetailResponse>(`/listings/${slug}`),
      // 10 minutes — recently viewed is inherently fuzzy, no need to refetch eagerly
      staleTime: 10 * 60_000,
    })),
  })

  // Quietly drop any that failed (could be deleted listings) so the rail never
  // shows a broken row.
  const items = results.map((r) => r.data).filter((l): l is NonNullable<typeof l> => !!l)

  const isPending = results.some((r) => r.isPending)

  if (visible.length === 0 || (items.length === 0 && !isPending)) {
    return null
  }

  return (
    <section className={cn('relative', className)}>
      <div className="flex items-end justify-between gap-3 mb-5 lg:mb-7">
        <div className="space-y-1.5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
            <Eye className="w-3 h-3" aria-hidden />
            {t('recentlyViewed.kicker')}
          </p>
          <h2
            className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.03em] display-tight"
            style={{ fontSize: 'var(--text-display-sm)' }}
          >
            {t('recentlyViewed.title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone hover:bg-canvas-deep/60 dark:hover:bg-night-sub/60 motion-safe:transition focus-volt"
        >
          <X className="w-3.5 h-3.5" aria-hidden />
          {t('recentlyViewed.clear')}
        </button>
      </div>

      <div className="relative -mx-[clamp(1.25rem,4vw,3rem)] px-[clamp(1.25rem,4vw,3rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-canvas dark:from-night to-transparent z-10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-canvas dark:from-night to-transparent z-10"
        />
        <div
          className="flex gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory pb-5 scrollbar-hide"
          role="region"
          aria-label={t('recentlyViewed.aria')}
        >
          {isPending && items.length === 0
            ? visible.map((_, i) => (
                <SkeletonCard
                  key={i}
                  seed={i}
                  className="w-[280px] sm:w-[300px] shrink-0 snap-start"
                />
              ))
            : items.map((l) => <ListingCard key={l.id} listing={l} fixedWidth />)}
        </div>
      </div>
    </section>
  )
}
