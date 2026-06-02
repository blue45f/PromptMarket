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
  'aria-describedby'?: string
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
  'aria-describedby': ariaDescribedBy,
}: StarRatingProps) {
  const { t } = useTranslation('common')
  const interactive = typeof onChange === 'function'
  const [hover, setHover] = useState<number | null>(null)
  const displayed = hover ?? value

  return (
    <div className="inline-flex items-center gap-1">
      <div
        className="flex"
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={
          interactive
            ? t('rating.widgetLabel', { value: Math.round(value), outOf: 5 })
            : t('rating.display', { value: value.toFixed(1), outOf: 5 })
        }
        aria-describedby={interactive ? ariaDescribedBy : undefined}
        onMouseLeave={() => setHover(null)}
        onKeyDown={
          interactive
            ? (e) => {
                const current = Math.round(value ?? 0) || 1
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  onChange?.(Math.min(5, current + 1))
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  onChange?.(Math.max(1, current - 1))
                }
              }
            : undefined
        }
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
              role="radio"
              tabIndex={n === (Math.round(value ?? 0) || 1) ? 0 : -1}
              aria-checked={n <= Math.round(value ?? 0)}
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
        <span
          aria-label={t('rating.reviewCount', { count })}
          className="text-ink-mute dark:text-bone-mute text-xs font-mono"
        >
          ({count})
        </span>
      )}
    </div>
  )
}
