import AdminAttachmentsPanel from '@components/AdminAttachmentsPanel'
import AdminNav from '@components/AdminNav'
import ConfirmActionButton from '@components/ConfirmActionButton'
import EmptyState from '@components/EmptyState'
import StarRating from '@components/StarRating'
import { useAdminDeleteReview, useAdminReviews, useSetReviewVisibility } from '@domains/admin'
import { usePageMeta } from '@hooks/usePageMeta'
import { getErrorMessage } from '@infrastructure/api'
import { cn } from '@utils/cn'
import { formatDate } from '@utils/format'
import { Eye, EyeOff, ImageIcon, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/** Review moderation: hide from listings + rating math, delete, strip images. */
export default function AdminReviewsPage() {
  const { t } = useTranslation('admin')
  const reviewsQ = useAdminReviews()
  const visibilityMut = useSetReviewVisibility()
  const deleteMut = useAdminDeleteReview()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  usePageMeta({ title: t('reviews.meta.title'), description: t('reviews.meta.description') })

  const reviews = reviewsQ.data ?? []

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] pb-20 animate-fade-in">
      <header className="mb-6 space-y-2">
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('reviews.title')}
        </h1>
        <p className="max-w-[58ch] text-ink-soft dark:text-bone-soft">{t('reviews.subtitle')}</p>
      </header>

      <AdminNav />

      {reviewsQ.error && (
        <p role="status" className="mb-6 font-mono text-sm text-coral-deep dark:text-coral">
          {getErrorMessage(reviewsQ.error)}
        </p>
      )}

      {reviewsQ.isPending ? (
        <div className="h-64 rounded-2xl bg-canvas-sub dark:bg-night-sub motion-safe:animate-pulse" />
      ) : reviews.length === 0 ? (
        <EmptyState
          emoji="⭐"
          title={t('reviews.emptyTitle')}
          description={t('reviews.emptyDescription')}
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const hidden = !!review.hiddenAt
            const expanded = expandedId === review.id
            return (
              <li
                key={review.id}
                className={cn(
                  'rounded-2xl border border-line bg-canvas-sub p-4 dark:border-night-line dark:bg-night-sub sm:p-5',
                  hidden && 'opacity-75'
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating value={review.rating} />
                      <span className="text-sm font-semibold text-ink dark:text-bone">
                        @{review.user.username}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[0.66rem] font-semibold',
                          hidden
                            ? 'bg-coral/15 text-coral-deep dark:text-coral'
                            : 'bg-volt-100 text-volt-900 dark:bg-volt-900/40 dark:text-volt-200'
                        )}
                      >
                        {hidden ? t('moderation.status.hidden') : t('moderation.status.visible')}
                      </span>
                      <span className="text-xs text-ink-mute dark:text-bone-mute">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-mute dark:text-bone-mute">
                      {t('reviews.onListing')}{' '}
                      <Link
                        to={`/listings/${review.listing.slug}`}
                        className="font-medium text-volt-700 hover:underline dark:text-volt-300 focus-volt"
                      >
                        {review.listing.title}
                      </Link>
                    </p>
                    {review.comment && (
                      <p className="mt-2 max-w-[78ch] whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-soft dark:text-bone-soft">
                        {review.comment}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => visibilityMut.mutate({ id: review.id, hidden: !hidden })}
                      disabled={visibilityMut.isPending}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                    >
                      {hidden ? (
                        <Eye aria-hidden="true" className="h-3 w-3" />
                      ) : (
                        <EyeOff aria-hidden="true" className="h-3 w-3" />
                      )}
                      {hidden ? t('moderation.actions.show') : t('moderation.actions.hide')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : review.id)}
                      disabled={review.attachmentCount === 0}
                      aria-expanded={expanded}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
                    >
                      <ImageIcon aria-hidden="true" className="h-3 w-3" />
                      {t('moderation.actions.attachments', { count: review.attachmentCount })}
                    </button>
                    <ConfirmActionButton
                      label={t('moderation.actions.delete')}
                      confirmLabel={t('moderation.actions.deleteConfirm')}
                      pending={deleteMut.isPending}
                      onConfirm={() => deleteMut.mutateAsync(review.id).catch(() => undefined)}
                      icon={<Trash2 aria-hidden="true" className="h-3 w-3" />}
                    />
                  </div>
                </div>
                {expanded && (
                  <div className="mt-3 border-t border-line/60 pt-2 dark:border-night-line/60">
                    <AdminAttachmentsPanel target={{ reviewId: review.id }} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
