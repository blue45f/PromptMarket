import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import type { ListingCard as ListingCardType } from '../lib/types';
import { formatPrice } from '../lib/format';
import TypeBadge from './TypeBadge';
import StarRating from './StarRating';

interface ListingCardProps {
  listing: ListingCardType;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link
      to={`/listings/${listing.slug}`}
      className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
    >
      <div className="bg-gradient-to-br from-brand-50 to-white h-32 flex items-center justify-center text-5xl">
        {listing.coverEmoji || '✨'}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <TypeBadge type={listing.type} />
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(listing.priceCents)}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-700">
          {listing.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
          {listing.description}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">@{listing.author?.username ?? 'unknown'}</span>
          <div className="flex items-center gap-2 shrink-0">
            <StarRating value={listing.avgRating || 0} count={listing.reviewCount} />
            <span className="inline-flex items-center gap-0.5">
              <Download className="w-3 h-3" />
              {listing.downloads ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
