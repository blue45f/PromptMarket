import { LISTING_TYPE_META } from '@promptmarket/shared'
import { cn } from '@utils/cn'
import { formatPrice, modelLabel } from '@utils/format'
import { Layers3, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { getArtifactSignals } from './artifactSignalsUtils'

import type { ListingCard as ListingCardType } from '@/types'
import type { TFunction } from 'i18next'

interface CompareTrayProps {
  items: ListingCardType[]
  onRemove: (id: string) => void
  onClear: () => void
  now?: Date
  className?: string
}

const MAX_COMPARE = 3

export default function CompareTray({
  items,
  onRemove,
  onClear,
  now,
  className,
}: CompareTrayProps) {
  const { t } = useTranslation('browse')
  const { t: tc } = useTranslation('common')

  if (items.length === 0) return null

  return (
    <section
      aria-label={t('compare.label')}
      className={cn(
        'fixed inset-x-3 bottom-3 z-40 mx-auto max-w-5xl rounded-2xl border border-line dark:border-night-line bg-canvas/95 dark:bg-night/95 p-3 shadow-[0_24px_80px_-30px_oklch(0.16_0.03_290/0.55)] backdrop-blur-md sm:inset-x-6 sm:p-4',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-volt-300 dark:bg-volt-300 dark:text-ink"
          >
            <Layers3 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1rem] font-semibold leading-tight tracking-tight text-ink dark:text-bone">
              {t('compare.heading')}
            </h2>
            <p className="text-[0.74rem] leading-snug text-ink-mute dark:text-bone-mute">
              {items.length < 2
                ? t('compare.needMore')
                : t('compare.count', { count: items.length, max: MAX_COMPARE })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-9 items-center rounded-full border border-line dark:border-night-line px-3 py-1.5 text-[0.8rem] font-medium text-ink-soft hover:border-coral/50 hover:text-coral-deep dark:text-bone-soft dark:hover:text-coral motion-safe:transition ease-expo focus-volt"
        >
          {t('compare.clear')}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub px-2 py-1 text-[0.76rem] text-ink-soft dark:text-bone-soft"
          >
            <Link
              to={`/listings/${item.slug}`}
              className="min-w-0 truncate hover:text-ink dark:hover:text-bone focus-volt rounded"
            >
              {item.title}
            </Link>
            <button
              type="button"
              aria-label={t('compare.remove', { title: item.title })}
              onClick={() => onRemove(item.id)}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-mute hover:bg-coral/10 hover:text-coral-deep dark:text-bone-mute dark:hover:text-coral motion-safe:transition ease-expo focus-volt"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      {items.length >= 2 && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-line dark:border-night-line bg-canvas-sub/80 dark:bg-night-sub/80">
          <table className="min-w-[640px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line dark:border-night-line">
                <th className="w-32 px-3 py-2.5 text-[0.68rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                  {t('compare.rows.item')}
                </th>
                {items.map((item) => (
                  <th
                    key={item.id}
                    className="min-w-40 px-3 py-2.5 text-[0.85rem] font-semibold leading-snug text-ink dark:text-bone"
                  >
                    <Link
                      to={`/listings/${item.slug}`}
                      className="line-clamp-2 hover:text-volt-800 dark:hover:text-volt-200 focus-volt rounded"
                    >
                      {item.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label={t('compare.rows.price')}
                values={items.map((item) =>
                  (item.priceCents ?? 0) === 0
                    ? t('panel.price.free')
                    : formatPrice(item.priceCents ?? 0)
                )}
              />
              <CompareRow
                label={t('compare.rows.type')}
                values={items.map((item) => LISTING_TYPE_META[item.type].label)}
              />
              <CompareRow
                label={t('compare.rows.models')}
                values={items.map((item) => formatModels(item.models ?? [], t))}
              />
              <CompareRow
                label={t('compare.rows.signals')}
                values={items.map(
                  (item) =>
                    getArtifactSignals(item, now)
                      .slice(0, 4)
                      .map((signal) =>
                        signal.key === 'models'
                          ? t('signals.options.multi-model')
                          : tc(`signals.${signal.key}.title`, signal.params)
                      )
                      .join(' · ') || t('compare.none')
                )}
              />
              <CompareRow
                label={t('compare.rows.usage')}
                values={items.map((item) => t('compare.downloads', { count: item.downloads ?? 0 }))}
              />
              <CompareRow
                label={t('compare.rows.reviews')}
                values={items.map((item) => t('compare.reviews', { count: item.reviewCount ?? 0 }))}
              />
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-line/70 last:border-b-0 dark:border-night-line/70">
      <th className="px-3 py-2.5 align-top text-[0.72rem] font-mono uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute">
        {label}
      </th>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="px-3 py-2.5 align-top text-[0.84rem] leading-snug text-ink-soft dark:text-bone-soft"
        >
          <span className="block max-w-[28ch] break-words">{value}</span>
        </td>
      ))}
    </tr>
  )
}

function formatModels(models: string[], t: TFunction<'browse'>) {
  const clean = models.filter(Boolean)
  if (clean.length === 0 || clean.includes('any')) return t('compare.anyModel')
  const visible = clean.slice(0, 2).map(modelLabel)
  const extra = clean.length - visible.length
  return extra > 0
    ? t('compare.modelsPlus', { models: visible.join(' · '), count: extra })
    : visible.join(' · ')
}
