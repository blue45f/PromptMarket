import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck } from 'lucide-react'
import { cn } from '@utils/cn'
import { getArtifactSignals, type ArtifactSignalListing } from './artifactSignalsUtils'

interface ArtifactSignalsProps {
  listing: ArtifactSignalListing
  variant?: 'compact' | 'panel'
  limit?: number
  className?: string
  now?: Date
}

export default function ArtifactSignals({
  listing,
  variant = 'compact',
  limit,
  className,
  now,
}: ArtifactSignalsProps) {
  const { t } = useTranslation('common')
  const titleId = useId()
  const { type, models, reviewCount, downloads, version, createdAt, updatedAt } = listing
  const signals = useMemo(
    () =>
      getArtifactSignals(
        { type, models, reviewCount, downloads, version, createdAt, updatedAt },
        now
      ),
    [type, models, reviewCount, downloads, version, createdAt, updatedAt, now]
  )
  const visible = typeof limit === 'number' ? signals.slice(0, limit) : signals

  if (visible.length === 0) return null

  if (variant === 'compact') {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-1.5', className)}
        aria-label={t('signals.compactLabel')}
      >
        {visible.map(({ key, Icon, params, tone }) => (
          <span
            key={key}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.66rem] font-mono font-medium',
              tone
            )}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {t(`signals.${key}.title`, params)}
          </span>
        ))}
      </div>
    )
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-volt-300 dark:bg-volt-300 dark:text-ink"
        >
          <BadgeCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2
            id={titleId}
            className="font-display text-[1rem] font-semibold leading-none tracking-tight text-ink dark:text-bone"
          >
            {t('signals.panel.title')}
          </h2>
          <p className="mt-1 text-[0.74rem] leading-snug text-ink-mute dark:text-bone-mute">
            {t('signals.panel.subtitle')}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {visible.map(({ key, Icon, params, tone }) => (
          <li key={key} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className={cn(
                'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                tone
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.86rem] font-semibold leading-snug text-ink dark:text-bone">
                {t(`signals.${key}.title`, params)}
              </p>
              <p className="text-[0.74rem] leading-snug text-ink-mute dark:text-bone-mute">
                {t(`signals.${key}.description`, params)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
