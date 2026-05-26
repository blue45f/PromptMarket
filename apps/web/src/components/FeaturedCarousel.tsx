import type { ListingCard as ListingCardType } from '@/types';
import ListingCard from './ListingCard';
import SkeletonCard from './SkeletonCard';

interface FeaturedCarouselProps {
  items: ListingCardType[];
  loading?: boolean;
}

export default function FeaturedCarousel({ items, loading }: FeaturedCarouselProps) {
  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
        role="region"
        aria-label="Featured listings"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start"
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
