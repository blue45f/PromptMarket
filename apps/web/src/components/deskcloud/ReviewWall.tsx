/**
 * ReviewWall — NATIVE ReviewDesk testimonials (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * Reads the approved + featured review wall and the rating aggregate via the
 * PUBLISHED SDK (`createReviewClient`, `pk_`) and renders them with the app's
 * own StarRating + tokens. Generic social-proof surface — NOT the marketplace's
 * core listing reviews. Active only when VITE_REVIEWDESK_URL is set.
 *
 * a11y: aggregate exposed via StarRating's labelled img role · loading/error/
 * empty states · contrast ≥4.5:1 · text-pretty headings · 60ch body measure.
 * ──────────────────────────────────────────────────────────────────────────
 */
import StarRating from '@components/StarRating'
import { type PublicReview, type ReviewAggregate, type ReviewClient } from '@heejun/deskcloud'
import { formatRelative } from '@utils/format'
import { Loader2, Quote, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const WALL_LIMIT = 12

type Phase = 'loading' | 'ready' | 'error'

interface ReviewWallProps {
  client: ReviewClient
}

export default function ReviewWall({ client }: ReviewWallProps) {
  const { t } = useTranslation('common')
  const [phase, setPhase] = useState<Phase>('loading')
  const [items, setItems] = useState<PublicReview[]>([])
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null)

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    Promise.all([
      client.getWall({ limit: WALL_LIMIT, signal: ctrl.signal }),
      client.getAggregate({ subjectId: 'promptmarket', signal: ctrl.signal }).catch(() => null),
    ])
      .then(([wall, agg]) => {
        if (cancelled) return
        setItems(wall.items)
        setAggregate(agg)
        setPhase('ready')
      })
      .catch(() => {
        if (!cancelled && !ctrl.signal.aborted) setPhase('error')
      })
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [client])

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-[0.82rem] text-ink-soft dark:text-bone-soft">
        <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden />
        {t('reviews.loading', { defaultValue: 'Loading reviews…' })}
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div role="alert" className="py-12 text-center">
        <span
          aria-hidden
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-coral/12 text-coral-deep dark:text-coral"
        >
          <TriangleAlert className="w-5 h-5" />
        </span>
        <p className="text-[0.88rem] font-medium text-ink dark:text-bone">
          {t('reviews.errorTitle', { defaultValue: "Couldn't load reviews" })}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {aggregate && aggregate.count > 0 && aggregate.avgRating != null && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas-sub px-4 py-3 dark:border-night-line dark:bg-night-deep">
          <StarRating value={aggregate.avgRating} size="md" showLabel />
          <span className="text-[0.78rem] text-ink-soft dark:text-bone-soft">
            {t('reviews.aggregate', {
              defaultValue: '{{count}} reviews',
              count: aggregate.count,
            })}
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <span
            aria-hidden
            className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-canvas-sub text-ink-mute dark:bg-night-deep dark:text-bone-mute"
          >
            <Quote className="w-5 h-5" />
          </span>
          <p className="text-[0.88rem] font-medium text-ink dark:text-bone">
            {t('reviews.empty', { defaultValue: 'No reviews yet.' })}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-line bg-canvas px-4 py-3.5 dark:border-night-line dark:bg-night-sub"
            >
              <div className="flex items-center justify-between gap-2">
                <StarRating value={review.rating} size="sm" />
                <time
                  dateTime={review.createdAt}
                  className="font-mono text-[0.64rem] uppercase tracking-[0.1em] text-ink-mute dark:text-bone-mute"
                >
                  {formatRelative(review.createdAt)}
                </time>
              </div>
              {review.title && (
                <h3 className="mt-2 text-[0.9rem] font-semibold leading-snug text-ink dark:text-bone text-pretty">
                  {review.title}
                </h3>
              )}
              <p className="mt-1 max-w-[60ch] text-[0.82rem] leading-relaxed text-ink-soft dark:text-bone-soft">
                {review.body}
              </p>
              <p className="mt-2 text-[0.72rem] font-medium text-ink-mute dark:text-bone-mute">
                {review.authorName}
              </p>
              {review.reply && (
                <div className="mt-2.5 rounded-xl border border-line bg-canvas-sub px-3 py-2 dark:border-night-line dark:bg-night-deep">
                  <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-volt-700 dark:text-volt-300">
                    {t('reviews.reply', { defaultValue: 'Reply' })}
                  </p>
                  <p className="text-[0.78rem] leading-relaxed text-ink-soft dark:text-bone-soft">
                    {review.reply}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
