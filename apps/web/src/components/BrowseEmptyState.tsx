import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Compass, Filter, SearchX } from 'lucide-react'
import i18n from '@/i18n'
import { modelLabel } from '@utils/format'
import { cn } from '@utils/cn'

interface ActiveFilter {
  key: string
  label: string
  /** Click to remove just this filter. */
  onRemove: () => void
}

interface BrowseEmptyStateProps {
  q: string
  /** Current filters as user-facing strings. */
  activeFilters: ActiveFilter[]
  /** Clear all filters callback. */
  onClearAll: () => void
  className?: string
}

/* ---------------------------------------------------------------------------
 * BrowseEmptyState — when /browse returns zero results, show what's filtering
 * the catalog out and let the visitor unstick by removing one filter at a
 * time. Falls back to a generic empty-catalog message when no filters are
 * active.
 * ------------------------------------------------------------------------- */

export default function BrowseEmptyState({
  q,
  activeFilters,
  onClearAll,
  className,
}: BrowseEmptyStateProps) {
  const { t } = useTranslation('browse')
  const hasFilters = activeFilters.length > 0
  const hasQuery = q.length > 0

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-7 sm:p-10',
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background: 'radial-gradient(at 22% 18%, oklch(0.92 0.18 122 / 0.25) 0, transparent 55%)',
        }}
      />
      <div className="grain-layer" aria-hidden style={{ opacity: 0.05 }} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-7 lg:gap-x-10">
        <div className="lg:col-span-7">
          <span
            aria-hidden
            className="inline-flex w-10 h-10 rounded-xl bg-ink text-volt-300 dark:bg-volt-300 dark:text-ink items-center justify-center"
          >
            <SearchX className="w-4 h-4" />
          </span>
          <h3
            className="mt-4 font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.03em] display-tight"
            style={{ fontSize: 'var(--text-display-sm)' }}
          >
            {hasQuery ? (
              <>
                {t('empty.title.queryLead', { q })}{' '}
                <span className="block">{t('empty.title.queryTail', { q })}</span>
              </>
            ) : hasFilters ? (
              t('empty.title.filters')
            ) : (
              t('empty.title.blank')
            )}
          </h3>
          <p className="mt-3 text-ink-soft dark:text-bone-soft max-w-[44ch] leading-relaxed">
            {hasFilters
              ? t('empty.body.filters')
              : hasQuery
                ? t('empty.body.query')
                : t('empty.body.blank')}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link
              to="/browse"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-[0.85rem] font-medium tracking-tight focus-volt lift-on-hover"
            >
              <Compass className="w-4 h-4" />
              {t('empty.browseAll')}
              <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            </Link>
            {hasFilters && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone text-[0.85rem] font-medium tracking-tight hover:border-ink dark:hover:border-bone hover:bg-canvas-deep/60 dark:hover:bg-night-sub motion-safe:transition focus-volt"
              >
                {t('empty.clearAll')}
              </button>
            )}
          </div>
        </div>

        {hasFilters && (
          <div className="lg:col-span-5">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute inline-flex items-center gap-2 mb-3">
              <Filter className="w-3 h-3" aria-hidden />
              {t('empty.activeHeading')}
            </p>
            <ul className="flex flex-col gap-2">
              {activeFilters.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={f.onRemove}
                    className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night hover:border-volt-400 dark:hover:border-volt-500/40 hover:bg-canvas-deep/60 dark:hover:bg-night-deep/60 text-left motion-safe:transition focus-volt"
                  >
                    <span className="min-w-0 flex-1 text-[0.86rem] text-ink dark:text-bone truncate">
                      {f.label}
                    </span>
                    <span className="shrink-0 text-[0.72rem] font-mono uppercase tracking-[0.14em] text-volt-700 dark:text-volt-300 group-hover:text-volt-800 dark:group-hover:text-volt-200">
                      {t('empty.removeRow')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

/* Build user-facing labels for whatever filters BrowsePage has set. Caller
 * passes the raw filter map so the labels stay localised to this view. */
export function buildActiveFilterRows(args: {
  q: string
  types: string[]
  models: string[]
  technique: string
  difficulty: string
  category: string
  price: string
  removeType: (t: string) => void
  removeModel: (m: string) => void
  removeTechnique: () => void
  removeDifficulty: () => void
  removeCategory: () => void
  removePrice: () => void
  removeQuery: () => void
}): ActiveFilter[] {
  const out: ActiveFilter[] = []
  if (args.q)
    out.push({
      key: 'q',
      label: i18n.t('browse:activeFilter.query', { q: args.q }),
      onRemove: args.removeQuery,
    })
  for (const t of args.types) {
    out.push({
      key: `type:${t}`,
      label: i18n.t('browse:activeFilter.type', { value: t }),
      onRemove: () => args.removeType(t),
    })
  }
  for (const m of args.models) {
    out.push({
      key: `model:${m}`,
      label: i18n.t('browse:activeFilter.model', { value: modelLabel(m) }),
      onRemove: () => args.removeModel(m),
    })
  }
  if (args.technique)
    out.push({
      key: 'technique',
      label: i18n.t('browse:activeFilter.technique', { value: args.technique }),
      onRemove: args.removeTechnique,
    })
  if (args.difficulty)
    out.push({
      key: 'difficulty',
      label: i18n.t('browse:activeFilter.difficulty', { value: args.difficulty }),
      onRemove: args.removeDifficulty,
    })
  if (args.category)
    out.push({
      key: 'category',
      label: i18n.t('browse:activeFilter.category', { value: args.category }),
      onRemove: args.removeCategory,
    })
  if (args.price && args.price !== 'all')
    out.push({
      key: 'price',
      label: i18n.t('browse:activeFilter.price', { value: args.price }),
      onRemove: args.removePrice,
    })
  return out
}
