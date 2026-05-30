import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { cn } from '@utils/cn'

interface StarRatingProps {
  value: number
  count?: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const starSize: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
}

export default function StarRating({
  value,
  count,
  onChange,
  size = 'sm',
  showLabel = false,
}: StarRatingProps) {
  const { t } = useTranslation('common')
  const interactive = typeof onChange === 'function'
  const [hover, setHover] = useState<number | null>(null)
  const displayed = hover ?? value

  return (
    <div className="inline-flex items-center gap-1">
      <div
        className="flex"
        role={interactive ? 'group' : 'img'}
        aria-label={
          interactive
            ? t('rating.widgetLabel', { value: Math.round(value), outOf: 5 })
            : t('rating.display', { value: value.toFixed(1), outOf: 5 })
        }
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= Math.round(displayed)
          if (!interactive) {
            return (
              <span key={n} aria-hidden="true" className="leading-none">
                <Star
                  className={cn(
                    starSize[size],
                    filled
                      ? 'text-volt-600 fill-volt-400'
                      : 'text-line-strong dark:text-night-line-strong'
                  )}
                />
              </span>
            )
          }
          return (
            <button
              key={n}
              type="button"
              aria-pressed={n <= Math.round(value)}
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange?.(n)}
              className="leading-none cursor-pointer focus-volt rounded"
              aria-label={t('rating.starLabel', { count: n })}
            >
              <Star
                className={cn(
                  starSize[size],
                  filled
                    ? 'text-volt-600 fill-volt-400'
                    : 'text-line-strong dark:text-night-line-strong'
                )}
              />
            </button>
          )
        })}
      </div>
      {showLabel && (
        <span className="text-ink-mute dark:text-bone-mute text-xs font-mono">
          {value.toFixed(1)}
          {typeof count === 'number' && ` (${count})`}
        </span>
      )}
      {!showLabel && typeof count === 'number' && (
        <span className="text-ink-mute dark:text-bone-mute text-xs font-mono">({count})</span>
      )}
    </div>
  )
}
