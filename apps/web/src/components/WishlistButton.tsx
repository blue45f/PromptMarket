import { useIsWishlisted, useWishlistStore } from '@store/wishlist'
import { cn } from '@utils/cn'
import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface WishlistButtonProps {
  slug: string
  variant?: 'card' | 'inline'
  className?: string
}

/* ---------------------------------------------------------------------------
 * Heart button that toggles a listing's wishlist state in localStorage.
 *
 * `card` variant: small floating chip used on cover art.
 * `inline` variant: a regular button with text label, for sidebars.
 * ------------------------------------------------------------------------- */

export default function WishlistButton({ slug, variant = 'card', className }: WishlistButtonProps) {
  const { t } = useTranslation('common')
  const active = useIsWishlisted(slug)
  const toggle = useWishlistStore((s) => s.toggle)

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle(slug)
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? t('wishlist.remove') : t('wishlist.add')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[0.78rem] font-medium motion-safe:transition ease-expo focus-volt',
          active
            ? 'bg-coral/15 text-coral-deep border-coral/40 dark:bg-coral/20 dark:text-coral dark:border-coral/40'
            : 'bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft border-line dark:border-night-line hover:text-coral-deep dark:hover:text-coral hover:border-coral/40',
          className
        )}
      >
        <Heart aria-hidden className={cn('w-3.5 h-3.5', active && 'fill-current')} />
        {active ? t('wishlist.saved') : t('wishlist.label')}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? t('wishlist.remove') : t('wishlist.add')}
      className={cn(
        'inline-flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm motion-safe:transition ease-expo focus-volt',
        active
          ? 'bg-coral text-bone'
          : 'bg-ink/55 text-bone hover:bg-coral/85 dark:bg-night/65 dark:hover:bg-coral/85',
        className
      )}
    >
      <Heart aria-hidden className={cn('w-3.5 h-3.5', active && 'fill-current')} />
    </button>
  )
}
