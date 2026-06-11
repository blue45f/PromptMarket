import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ImageIcon, MessageCircle, PenLine } from 'lucide-react'
import { CATEGORIES } from '@promptmarket/shared'
import { useThreads } from '@features/community'
import { usePageMeta } from '@hooks/usePageMeta'
import EmptyState from '@components/EmptyState'
import { getErrorMessage } from '@services/api'
import { formatRelative } from '@utils/format'
import { cn } from '@utils/cn'

export default function CommunityPage() {
  const { t } = useTranslation('community')
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const { data, isPending, error } = useThreads({ category: category || undefined, page })

  usePageMeta({ title: t('meta.title'), description: t('meta.description') })

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const counts = data?.categoryCounts ?? {}
  const totalThreads = Object.values(counts).reduce((sum, n) => sum + n, 0)

  function categoryLabel(value: string) {
    return t(`home:categories.labels.${value}`, { defaultValue: value })
  }

  function selectCategory(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next) params.set('category', next)
    else params.delete('category')
    params.delete('page')
    setSearchParams(params, { preventScrollReset: false })
  }

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams)
    if (next > 1) params.set('page', String(next))
    else params.delete('page')
    setSearchParams(params)
  }

  return (
    <div className="mx-auto max-w-7xl px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1
            className="font-display font-bold text-ink dark:text-bone leading-[0.98] tracking-[-0.035em] display-tight"
            style={{ fontSize: 'var(--text-display-md)' }}
          >
            {t('header.title')}
          </h1>
          <p className="mt-2 max-w-[56ch] text-ink-soft dark:text-bone-soft">
            {t('header.subtitle')}
          </p>
        </div>
        <Link
          to="/community/new"
          className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ink px-5 py-2.5 text-sm font-semibold tracking-tight text-bone dark:bg-bone dark:text-ink motion-safe:transition ease-expo lift-on-hover focus-volt sm:self-auto"
        >
          <PenLine aria-hidden="true" className="h-4 w-4" />
          {t('header.newThread')}
        </Link>
      </header>

      {error && (
        <p role="status" className="mb-6 font-mono text-sm text-coral-deep dark:text-coral">
          {getErrorMessage(error)}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Category rail — a vertical index, not a card grid. */}
        <nav aria-label={t('categories.label')} className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
            <li className="shrink-0">
              <CategoryRailButton
                label={t('categories.all')}
                count={totalThreads}
                active={!category}
                onClick={() => selectCategory('')}
              />
            </li>
            {CATEGORIES.map((value) => (
              <li key={value} className="shrink-0">
                <CategoryRailButton
                  label={categoryLabel(value)}
                  count={counts[value] ?? 0}
                  active={category === value}
                  onClick={() => selectCategory(value)}
                />
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label={t('list.label')} className="min-w-0">
          {isPending ? (
            <div className="space-y-3" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              emoji="💬"
              variant="gated"
              title={category ? t('empty.categoryTitle') : t('empty.title')}
              description={
                category
                  ? t('empty.categoryDescription', { category: categoryLabel(category) })
                  : t('empty.description')
              }
              hint={t('empty.hint')}
              action={
                <Link
                  to="/community/new"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone dark:bg-bone dark:text-ink motion-safe:transition ease-expo lift-on-hover focus-volt"
                >
                  <PenLine aria-hidden="true" className="h-4 w-4" />
                  {t('empty.cta')}
                </Link>
              }
            />
          ) : (
            <>
              <ul className="divide-y divide-line/70 rounded-2xl border border-line bg-canvas-sub dark:divide-night-line/70 dark:border-night-line dark:bg-night-sub">
                {items.map((thread) => (
                  <li key={thread.id}>
                    <Link
                      to={`/community/${thread.id}`}
                      className="group block px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl hover:bg-canvas-deep/60 dark:hover:bg-night-deep/60 motion-safe:transition ease-expo focus-volt"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-[0.95rem] font-semibold text-ink dark:text-bone group-hover:text-volt-800 dark:group-hover:text-volt-200">
                            {thread.title}
                          </p>
                          <p className="mt-1 line-clamp-2 max-w-[78ch] text-sm leading-relaxed text-ink-mute dark:text-bone-mute">
                            {thread.excerpt}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-xs text-ink-mute dark:text-bone-mute"
                          title={thread.lastActivityAt}
                        >
                          {formatRelative(thread.lastActivityAt)}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft dark:text-bone-soft">
                        <span className="inline-flex items-center rounded-full bg-canvas-deep px-2 py-0.5 font-medium dark:bg-night-deep">
                          {categoryLabel(thread.category)}
                        </span>
                        <span>@{thread.author?.username ?? t('list.unknownAuthor')}</span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle aria-hidden="true" className="h-3 w-3" />
                          {t('list.comments', { count: thread.commentCount })}
                        </span>
                        {thread.attachmentCount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <ImageIcon aria-hidden="true" className="h-3 w-3" />
                            {t('list.attachments', { count: thread.attachmentCount })}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label={t('pagination.label')}
                  className="mt-5 flex items-center justify-center gap-3 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line px-3.5 py-1.5 font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                  >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    {t('pagination.prev')}
                  </button>
                  <span className="font-mono text-xs tabular-nums text-ink-mute dark:text-bone-mute">
                    {t('pagination.status', { page, totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line px-3.5 py-1.5 font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                  >
                    {t('pagination.next')}
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function CategoryRailButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'inline-flex w-auto min-h-9 items-center justify-between gap-3 rounded-full px-3.5 py-1.5 text-[0.84rem] tracking-tight lg:w-full lg:rounded-xl motion-safe:transition ease-expo focus-volt',
        active
          ? 'bg-ink font-semibold text-bone dark:bg-bone dark:text-ink'
          : 'font-medium text-ink-soft hover:bg-canvas-sub hover:text-ink dark:text-bone-soft dark:hover:bg-night-sub dark:hover:text-bone'
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          'font-mono text-[0.68rem] tabular-nums',
          active ? 'opacity-80' : 'text-ink-mute dark:text-bone-mute'
        )}
      >
        {count}
      </span>
    </button>
  )
}
