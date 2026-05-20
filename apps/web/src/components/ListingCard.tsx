import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import type { ListingCard as ListingCardType } from '../lib/types';
import { formatPrice, typeGradient } from '../lib/format';
import TypeBadge from './TypeBadge';
import ModelBadge from './ModelBadge';
import StarRating from './StarRating';
import { cn } from '../lib/cn';

interface ListingCardProps {
  listing: ListingCardType;
  className?: string;
  /** Used by the featured carousel so cards keep a consistent width when the
   *  parent is a horizontally-scrollable snap container. */
  fixedWidth?: boolean;
}

export default function ListingCard({
  listing,
  className,
  fixedWidth = false,
}: ListingCardProps) {
  const free = (listing.priceCents ?? 0) === 0;
  const models = listing.models ?? [];
  const visibleModels = models.slice(0, 2);
  const extraModels = Math.max(0, models.length - visibleModels.length);

  return (
    <Link
      to={`/listings/${listing.slug}`}
      className={cn(
        'group relative block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden',
        'motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out',
        'motion-safe:hover:-translate-y-1 hover:shadow-xl',
        'hover:border-indigo-200 dark:hover:border-indigo-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        fixedWidth && 'w-[260px] sm:w-[280px] shrink-0 snap-start',
        className,
      )}
    >
      <div
        className={cn(
          'aspect-[4/5] relative bg-gradient-to-br flex items-center justify-center text-6xl',
          typeGradient(listing.type),
        )}
      >
        <span
          className="drop-shadow-lg motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
          aria-hidden
        >
          {listing.coverEmoji || '✨'}
        </span>
        <div className="absolute top-3 left-3">
          <TypeBadge type={listing.type} overlay />
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-full ring-1',
              free
                ? 'bg-emerald-500 text-white ring-emerald-400/40'
                : 'bg-zinc-900/90 text-white ring-white/10',
            )}
          >
            {formatPrice(listing.priceCents)}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {visibleModels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {visibleModels.map((m) => (
              <ModelBadge key={m} slug={m} />
            ))}
            {extraModels > 0 && (
              <span className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                +{extraModels}
              </span>
            )}
          </div>
        )}
        <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 leading-snug">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {listing.description}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              aria-hidden
            >
              {listing.author?.username?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span className="text-xs text-gray-600 dark:text-zinc-400 truncate">
              @{listing.author?.username ?? 'unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500 dark:text-zinc-400">
            <StarRating value={listing.avgRating || 0} count={listing.reviewCount} />
            <span aria-hidden className="text-gray-300 dark:text-zinc-700">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Download className="w-3.5 h-3.5" />
              {listing.downloads ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
