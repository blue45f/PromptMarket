import { useTranslation } from 'react-i18next'

import ListingCard from './ListingCard'
import SkeletonCard from './SkeletonCard'

import type { ListingCard as ListingCardType } from '@/types'

interface FeaturedCarouselProps {
  items: ListingCardType[]
  loading?: boolean
}

export default function FeaturedCarousel({ items, loading }: FeaturedCarouselProps) {
  const { t } = useTranslation('home')
  // Nothing to scroll through yet: skip the region entirely rather than
  // rendering an empty strip with only the edge-fade overlays. The parent
  // surface owns any empty-state copy for this slot.
  if (!loading && items.length === 0) return null
  return (
    <div className="relative -mx-[clamp(1.25rem,4vw,3rem)] px-[clamp(1.25rem,4vw,3rem)]">
      {/* Edge fades for momentum cue */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-canvas dark:from-night to-transparent z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-canvas dark:from-night to-transparent z-10"
      />
      <div
        // Scrollable region is deliberately focusable so keyboard users can
        // scroll the horizontal carousel with arrow keys (WAI scroll-region
        // pattern); tabIndex on a labelled region is correct here.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focusable scroll region for keyboard scrolling
        tabIndex={0}
        className="flex gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory pb-5 scrollbar-hide focus-volt rounded-[1.4rem] motion-safe:scroll-smooth"
        role="region"
        aria-label={t('carousel.aria')}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[280px] sm:w-[300px] shrink-0 snap-start">
                <SkeletonCard seed={i} />
              </div>
            ))
          : items.map((l) => <ListingCard key={l.id} listing={l} fixedWidth />)}
      </div>
    </div>
  )
}
