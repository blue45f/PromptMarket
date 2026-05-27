import type { ListingCard as ListingCardType } from '@/types';
import ListingCard from './ListingCard';
import SkeletonCard from './SkeletonCard';

interface FeaturedCarouselProps {
  items: ListingCardType[];
  loading?: boolean;
}

export default function FeaturedCarousel({ items, loading }: FeaturedCarouselProps) {
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
        className="flex gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory pb-5 scrollbar-hide"
        role="region"
        aria-label="Featured listings"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[280px] sm:w-[300px] shrink-0 snap-start"
              >
                <SkeletonCard />
              </div>
            ))
          : items.map((l) => (
              <ListingCard key={l.id} listing={l} fixedWidth />
            ))}
      </div>
    </div>
  );
}
