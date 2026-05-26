import type { ListingType } from '@promptmarket/shared';
import { LISTING_TYPE_META } from '@promptmarket/shared';
import { cn } from '@utils/cn';

interface TypeBadgeProps {
  type: ListingType;
  className?: string;
  /** When true, render a translucent overlay-style chip (used on cover art). */
  overlay?: boolean;
}

export default function TypeBadge({
  type,
  className = '',
  overlay = false,
}: TypeBadgeProps) {
  const meta = LISTING_TYPE_META[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1',
        overlay
          ? 'backdrop-blur bg-white/80 text-gray-900 ring-white/40 dark:bg-zinc-900/70 dark:text-zinc-100 dark:ring-zinc-700/60'
          : `${meta.pill} dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700`,
        className,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
