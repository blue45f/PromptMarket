import { useRelated } from '@features/marketplace/queries';
import ListingCard from './ListingCard';
import SkeletonCard from './SkeletonCard';

interface RelatedListingsProps {
  listingId: string | undefined;
}

export default function RelatedListings({ listingId }: RelatedListingsProps) {
  const { data, isPending } = useRelated(listingId);
  const items = data ?? [];

  if (isPending) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        No related listings yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
