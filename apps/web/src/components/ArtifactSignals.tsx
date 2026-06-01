import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BadgeCheck,
  Download,
  Layers3,
  PackageCheck,
  RefreshCw,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import type { ListingType } from '@promptmarket/shared'
import { cn } from '@utils/cn'

type SignalKey = 'verified' | 'install' | 'usage' | 'models' | 'version' | 'fresh'

interface ArtifactSignalListing {
  type: ListingType
  models?: string[] | null
  reviewCount?: number | null
  downloads?: number | null
  version?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

interface Signal {
  key: SignalKey
  Icon: LucideIcon
  params?: Record<string, string | number>
  tone: string
}

interface ArtifactSignalsProps {
  listing: ArtifactSignalListing
  variant?: 'compact' | 'panel'
  limit?: number
  className?: string
  now?: Date
}

const DAY_MS = 86_400_000
const FRESH_DAYS = 90

export function getArtifactSignals(listing: ArtifactSignalListing, now = new Date()): Signal[] {
  const signals: Signal[] = []
  const reviewCount = listing.reviewCount ?? 0
  const downloads = listing.downloads ?? 0
  const models = listing.models?.filter(Boolean) ?? []
  const updatedAt = listing.updatedAt ?? listing.createdAt
  const days = updatedAt ? daysSince(updatedAt, now) : null

  if (reviewCount > 0) {
    signals.push({
      key: 'verified',
      Icon: BadgeCheck,
      params: { count: reviewCount },
      tone: 'text-volt-800 bg-volt-100 border-volt-200 dark:text-volt-200 dark:bg-volt-900/35 dark:border-volt-800/70',
    })
  }

  signals.push({
    key: 'install',
    Icon: Terminal,
    tone: 'text-ink bg-canvas-deep border-line dark:text-bone dark:bg-night-deep dark:border-night-line',
  })

  if (downloads > 0) {
    signals.push({
      key: 'usage',
      Icon: Download,
      params: { count: downloads },
      tone: 'text-iris-deep bg-iris/10 border-iris/25 dark:text-iris dark:bg-iris/10 dark:border-iris/25',
    })
  }

  if (models.length > 1) {
    signals.push({
      key: 'models',
      Icon: Layers3,
      params: { count: models.length },
      tone: 'text-violet-deep bg-violet-soft/55 border-violet/20 dark:text-violet-soft dark:bg-violet/15 dark:border-violet/35',
    })
  }

  if (listing.version) {
    signals.push({
      key: 'version',
      Icon: PackageCheck,
      params: { version: listing.version },
      tone: 'text-ink-soft bg-canvas-deep border-line dark:text-bone-soft dark:bg-night-deep dark:border-night-line',
    })
  }

  if (days !== null && days <= FRESH_DAYS) {
    signals.push({
      key: 'fresh',
      Icon: RefreshCw,
      params: { days },
      tone: 'text-coral-deep bg-coral/10 border-coral/25 dark:text-coral dark:bg-coral/10 dark:border-coral/30',
    })
  }

  return signals
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
  const signals = useMemo(
    () => getArtifactSignals(listing, now),
    [
      listing.type,
      listing.models,
      listing.reviewCount,
      listing.downloads,
      listing.version,
      listing.createdAt,
      listing.updatedAt,
      now,
    ]
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

function daysSince(value: string, now: Date): number | null {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return null
  return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS))
}
