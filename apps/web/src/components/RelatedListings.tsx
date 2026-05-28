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
      <div className="cards-fluid">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-mute dark:text-bone-mute">
        아직 관련 리스팅이 없어요.
      </p>
    );
  }

  return (
    <div className="cards-fluid">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
