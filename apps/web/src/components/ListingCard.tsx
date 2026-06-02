import { useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Download, Layers3 } from 'lucide-react'
import type { ListingCard as ListingCardType, ListingDetailResponse } from '@/types'
import { formatPrice, typeGradient } from '@utils/format'
import { LISTING_TYPE_META } from '@promptmarket/shared'
import { useTilt } from '@hooks/useTilt'
import { api } from '@services/api'
import { listingKey, relatedKey } from '@features/marketplace/queryKeys'
import ModelBadge from './ModelBadge'
import StarRating from './StarRating'
import Highlight from './Highlight'
import WishlistButton from './WishlistButton'
import ArtifactSignals from './ArtifactSignals'
import { cn } from '@utils/cn'

interface ListingCardProps {
  listing: ListingCardType
  className?: string
  /** Featured cards in a bento grid render taller with bigger typography. */
  variant?: 'default' | 'featured' | 'wide'
  /** Used by the featured carousel so cards keep a consistent width when the
   *  parent is a horizontally-scrollable snap container. */
  fixedWidth?: boolean
  /** Search query to underline inside title/description. */
  highlight?: string
  compare?: {
    selected: boolean
    disabled?: boolean
    onToggle: (listing: ListingCardType) => void
  }
}

const ListingCard = memo(function ListingCard({
  listing,
  className,
  variant = 'default',
  fixedWidth = false,
  highlight,
  compare,
}: ListingCardProps) {
  const { t } = useTranslation('common')
  const free = (listing.priceCents ?? 0) === 0
  const meta = LISTING_TYPE_META[listing.type]
  const models = listing.models ?? []
  const visibleModels = models.slice(0, 2)
  const extraModels = Math.max(0, models.length - visibleModels.length)
  const tiltRef = useTilt<HTMLDivElement>({ max: 6, depth: 14 })
  const qc = useQueryClient()

  // On hover / focus, warm the listing detail + related caches so navigating
  // into the card hydrates instantly. Bail if either cache already has data
  // so we don't waste a request on revisits.
  const prefetch = useCallback(() => {
    const slug = listing.slug
    const id = listing.id
    if (!slug) return
    if (qc.getQueryData(listingKey(slug)) == null) {
      qc.prefetchQuery({
        queryKey: listingKey(slug),
        queryFn: () => api.get<ListingDetailResponse, ListingDetailResponse>(`/listings/${slug}`),
        staleTime: 60_000,
      })
    }
    if (id && qc.getQueryData(relatedKey(id)) == null) {
      qc.prefetchQuery({
        queryKey: relatedKey(id),
        queryFn: () => api.get<ListingCardType[], ListingCardType[]>(`/listings/related/${id}`),
        staleTime: 5 * 60_000,
      })
    }
  }, [listing.slug, listing.id, qc])

  const isFeatured = variant === 'featured'
  const isWide = variant === 'wide'

  return (
    <div
      ref={tiltRef}
      className={cn(
        'tilt-host card-perf relative',
        fixedWidth && 'w-[280px] sm:w-[300px] shrink-0 snap-start',
        isFeatured && 'lg:row-span-2',
        className
      )}
    >
      <Link
        to={`/listings/${listing.slug}`}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        className={cn(
          'tilt-inner group relative isolate block overflow-hidden rounded-[1.4rem] focus-volt',
          'surface-card lift-on-hover',
          // Wide lead: cover beside body once the card is wide enough to earn it.
          isWide &&
            'cq @lg:grid @lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] @lg:items-stretch',
          'hover:border-volt-400/70 dark:hover:border-volt-500/40',
          'focus-visible:border-volt-400/70 dark:focus-visible:border-volt-500/40',
          'hover:shadow-[0_28px_60px_-32px_oklch(0.65_0.18_125/0.45)]',
          'focus-visible:shadow-[0_28px_60px_-32px_oklch(0.65_0.18_125/0.45)]',
          'dark:hover:shadow-[0_28px_60px_-32px_oklch(0.55_0.22_125/0.6)]',
          'dark:focus-visible:shadow-[0_28px_60px_-32px_oklch(0.55_0.22_125/0.6)]'
        )}
      >
        {/* Cover — a mesh-gradient panel with the emoji as monolith. */}
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br',
            typeGradient(listing.type),
            isFeatured
              ? 'aspect-[5/6] lg:aspect-[4/5]'
              : isWide
                ? 'aspect-[16/9] @lg:aspect-auto @lg:h-full @lg:min-h-[15rem]'
                : 'aspect-[4/5]'
          )}
        >
          {/* Soft mesh wash */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-overlay opacity-70"
            style={{
              background:
                'radial-gradient(at 22% 28%, oklch(0.985 0.012 95 / 0.35) 0, transparent 55%), radial-gradient(at 78% 82%, oklch(0.16 0.03 290 / 0.25) 0, transparent 60%)',
            }}
          />
          <div className="grain-layer" aria-hidden style={{ opacity: 0.16 }} />
          <div className="cursor-sheen" aria-hidden />

          <span
            aria-hidden
            className={cn(
              'tilt-parallax absolute inset-0 flex items-center justify-center drop-shadow-[0_8px_24px_oklch(0.16_0.03_290/0.18)]',
              'motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 motion-safe:group-focus-visible:scale-110 motion-safe:group-focus-visible:-rotate-3 motion-safe:transition-transform ease-expo motion-safe:duration-700',
              isFeatured
                ? 'text-[7rem] lg:text-[10rem]'
                : isWide
                  ? 'text-[5.5rem] @lg:text-[8rem]'
                  : 'text-[5.5rem]'
            )}
          >
            {listing.coverEmoji || meta.emoji}
          </span>

          {/* Top labels */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2">
            <span className="tilt-parallax inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-mono uppercase tracking-[0.16em] bg-ink/85 text-bone">
              <span aria-hidden>{meta.emoji}</span>
              {t('types.' + listing.type, { defaultValue: meta.label })}
            </span>
            <span
              className={cn(
                'tilt-parallax relative overflow-hidden inline-flex items-center text-[0.72rem] font-mono px-2.5 py-1 rounded-full',
                free
                  ? 'bg-volt-300 text-ink sheen-overlay'
                  : 'bg-bone/90 text-ink dark:bg-night/85 dark:text-bone'
              )}
            >
              {free ? t('labels.free') : formatPrice(listing.priceCents ?? 0)}
            </span>
          </div>

          {compare && (
            <div className="absolute bottom-3.5 left-3.5">
              <button
                type="button"
                aria-pressed={compare.selected}
                aria-label={t(compare.selected ? 'compare.remove' : 'compare.add', {
                  title: listing.title,
                })}
                disabled={compare.disabled && !compare.selected}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  compare.onToggle(listing)
                }}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-[0.76rem] font-semibold backdrop-blur-sm motion-safe:transition ease-expo focus-volt',
                  compare.selected
                    ? 'border-volt-300 bg-volt-300 text-ink'
                    : 'border-bone/50 bg-ink/65 text-bone hover:border-volt-300 hover:bg-ink/85',
                  compare.disabled &&
                    !compare.selected &&
                    'cursor-not-allowed opacity-50 hover:border-bone/50 hover:bg-ink/65'
                )}
              >
                <Layers3 className="h-3.5 w-3.5" aria-hidden />
                {compare.selected ? t('compare.selectedShort') : t('compare.addShort')}
              </button>
            </div>
          )}

          {/* Bottom-right wishlist + arrow stack */}
          <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
            <span className="motion-safe:transition-all ease-expo motion-safe:duration-500 opacity-0 motion-safe:group-hover:opacity-100 motion-safe:group-focus-within:opacity-100">
              <WishlistButton slug={listing.slug} />
            </span>
            <span
              aria-hidden
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center',
                'bg-ink text-bone dark:bg-bone dark:text-ink',
                'opacity-0 translate-y-2 motion-safe:transition-all ease-expo motion-safe:duration-500',
                'motion-safe:group-hover:opacity-100 motion-safe:group-hover:translate-y-0',
                'motion-safe:group-focus-within:opacity-100 motion-safe:group-focus-within:translate-y-0'
              )}
            >
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Body */}
        <div
          className={cn(
            'px-4 pt-3.5 pb-4 flex flex-col gap-2.5',
            isFeatured && 'px-5 pt-4 pb-5 gap-3',
            isWide && '@lg:justify-center @lg:px-7 @lg:py-7 @lg:gap-3.5'
          )}
        >
          {visibleModels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleModels.map((m) => (
                <ModelBadge key={m} slug={m} />
              ))}
              {extraModels > 0 && (
                <span className="text-[0.65rem] font-mono font-medium text-ink-mute dark:text-bone-mute">
                  +{extraModels}
                </span>
              )}
            </div>
          )}
          <h3
            className={cn(
              'font-display font-semibold text-ink dark:text-bone tracking-tight leading-[1.15]',
              'motion-safe:transition-colors ease-expo group-hover:text-volt-800 dark:group-hover:text-volt-200 group-focus-within:text-volt-800 dark:group-focus-within:text-volt-200',
              isFeatured
                ? 'text-[1.45rem] lg:text-[1.7rem] line-clamp-3'
                : isWide
                  ? 'text-base @lg:text-[1.5rem] line-clamp-2'
                  : 'text-base line-clamp-2'
            )}
          >
            {highlight ? <Highlight text={listing.title} query={highlight} /> : listing.title}
          </h3>
          <p
            className={cn(
              'text-ink-mute dark:text-bone-mute leading-[1.55]',
              isFeatured
                ? 'text-sm lg:text-[0.95rem] line-clamp-3'
                : isWide
                  ? 'text-[0.83rem] @lg:text-[0.95rem] line-clamp-2 @lg:line-clamp-2'
                  : 'text-[0.83rem] line-clamp-1 sm:line-clamp-2 sm:min-h-[2.5rem]'
            )}
          >
            {highlight ? (
              <Highlight text={listing.description} query={highlight} />
            ) : (
              listing.description
            )}
          </p>
          <ArtifactSignals listing={listing} limit={2} />

          <div className="mt-1 flex items-center justify-between pt-3 border-t border-line/70 dark:border-night-line/70">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                aria-hidden
                className="w-6 h-6 rounded-full flex items-center justify-center text-[0.66rem] font-mono font-bold bg-ink text-bone dark:bg-bone dark:text-ink shrink-0 ring-1 ring-line dark:ring-night-line"
              >
                {listing.author?.username?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="text-[0.78rem] text-ink-soft dark:text-bone-soft truncate">
                @{listing.author?.username ?? t('labels.unknownAuthor')}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[0.72rem] font-mono text-ink-mute dark:text-bone-mute">
              {(listing.reviewCount ?? 0) > 0 ? (
                <StarRating value={listing.avgRating || 0} count={listing.reviewCount} />
              ) : (
                <span className="text-volt-700 dark:text-volt-300">{t('listing.unrated')}</span>
              )}
              <span aria-hidden className="text-line-strong dark:text-night-line-strong">
                ·
              </span>
              <span
                className="inline-flex items-center gap-0.5"
                aria-label={t('listing.downloadsLabel', {
                  count: listing.downloads ?? 0,
                })}
              >
                <Download className="w-3.5 h-3.5" aria-hidden />
                <span aria-hidden>{listing.downloads ?? 0}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
})

export default ListingCard
