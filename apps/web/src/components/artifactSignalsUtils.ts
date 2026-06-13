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

export type SignalKey = 'verified' | 'install' | 'usage' | 'models' | 'version' | 'fresh'

export interface ArtifactSignalListing {
  type: ListingType
  models?: string[] | null
  reviewCount?: number | null
  downloads?: number | null
  version?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface Signal {
  key: SignalKey
  Icon: LucideIcon
  params?: Record<string, string | number>
  tone: string
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
      params: { count: days },
      tone: 'text-coral-deep bg-coral/10 border-coral/25 dark:text-coral dark:bg-coral/10 dark:border-coral/30',
    })
  }

  return signals
}

function daysSince(value: string, now: Date): number | null {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return null
  return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS))
}
