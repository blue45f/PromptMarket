import { cn } from '@utils/cn'
import { useTranslation } from 'react-i18next'

import type { License } from '@promptmarket/shared'

interface LicenseBadgeProps {
  license: License
  className?: string
}

export default function LicenseBadge({ license, className }: LicenseBadgeProps) {
  const { t } = useTranslation('common')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[0.7rem] font-mono font-medium border',
        'bg-canvas-deep text-ink-soft border-line',
        'dark:bg-night-deep dark:text-bone-soft dark:border-night-line',
        className
      )}
    >
      {t('license.' + license, { defaultValue: license })}
    </span>
  )
}
