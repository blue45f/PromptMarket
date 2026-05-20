import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/cn';

interface StarRatingProps {
  value: number;
  count?: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const starSize: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

export default function StarRating({
  value,
  count,
  onChange,
  size = 'sm',
  showLabel = false,
}: StarRatingProps) {
  const interactive = typeof onChange === 'function';
  const [hover, setHover] = useState<number | null>(null);
  const displayed = hover ?? value;

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= Math.round(displayed);
          return (
            <button
              key={n}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => interactive && setHover(n)}
              onClick={() => interactive && onChange?.(n)}
              className={cn(
                'leading-none',
                interactive
                  ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded'
                  : 'cursor-default',
              )}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  starSize[size],
                  filled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300 dark:text-zinc-600',
                )}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-gray-500 dark:text-zinc-400 text-xs">
          {value.toFixed(1)}
          {typeof count === 'number' && ` (${count})`}
        </span>
      )}
      {!showLabel && typeof count === 'number' && (
        <span className="text-gray-500 dark:text-zinc-400 text-xs">({count})</span>
      )}
    </div>
  );
}
