import { LISTING_TYPE_META } from '@promptmarket/shared'
import { cn } from '@utils/cn'
import { useTranslation } from 'react-i18next'

import type { ListingType } from '@promptmarket/shared'

interface TypeBadgeProps {
  type: ListingType
  className?: string
  /** When true, render a translucent overlay-style chip (used on cover art). */
  overlay?: boolean
}

export default function TypeBadge({ type, className = '', overlay = false }: TypeBadgeProps) {
  const meta = LISTING_TYPE_META[type]
  const { t } = useTranslation('common')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-medium border',
        overlay
          ? 'backdrop-blur bg-canvas/80 text-ink border-line/60 dark:bg-night/70 dark:text-bone dark:border-night-line/70'
          : 'bg-canvas-sub text-ink-soft border-line dark:bg-night-sub dark:text-bone-soft dark:border-night-line',
        className
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {t('types.' + type, { defaultValue: meta.label })}
    </span>
  )
}
