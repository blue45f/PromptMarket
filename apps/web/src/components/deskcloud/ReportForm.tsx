/**
 * ReportForm — NATIVE ModerationDesk report (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * Submits an abuse/content report via the PUBLISHED SDK (`createModerationClient`,
 * `pk_`) using the app's own UI primitives + tokens. Active only when
 * VITE_MODERATIONDESK_URL is set. Generic safety affordance — does not replace
 * the app's first-party admin moderation tooling.
 *
 * a11y: labelled fieldset/legend + textarea · required reason · contrast ≥4.5:1.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { Textarea } from '@components/ui'
import { type ModerationClient } from '@heejun/deskcloud'
import { cn } from '@utils/cn'
import { CheckCircle2, Flag, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DESKCLOUD_APP_ID } from './config'

type Phase = 'idle' | 'submitting' | 'done'

const REASONS = ['spam', 'abuse', 'illegal', 'other'] as const
type Reason = (typeof REASONS)[number]

interface ReportFormProps {
  client: ModerationClient
  /** Subject being reported; defaults to the whole page. */
  subjectType?: string
  subjectId?: string
}

export default function ReportForm({
  client,
  subjectType = 'page',
  subjectId = DESKCLOUD_APP_ID,
}: ReportFormProps) {
  const { t } = useTranslation('common')
  const [phase, setPhase] = useState<Phase>('idle')
  const [reason, setReason] = useState<Reason>('spam')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setPhase('submitting')
      const reasonLabel = t(`report.reasons.${reason}`, { defaultValue: reason })
      client
        .report({
          subjectType,
          subjectId,
          reason: details.trim() ? `${reasonLabel}: ${details.trim()}` : reasonLabel,
        })
        .then(() => setPhase('done'))
        .catch(() => {
          setError(t('report.submitError', { defaultValue: "Couldn't send the report." }))
          setPhase('idle')
        })
    },
    [client, reason, details, subjectType, subjectId, t]
  )

  if (phase === 'done') {
    return (
      <div className="py-12 text-center">
        <span
          aria-hidden
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-volt-300 text-ink"
        >
          <CheckCircle2 className="w-6 h-6" />
        </span>
        <p className="text-[0.95rem] font-semibold text-ink dark:text-bone">
          {t('report.thanksTitle', { defaultValue: 'Report received' })}
        </p>
        <p className="mx-auto mt-1 max-w-[40ch] text-[0.82rem] text-ink-soft dark:text-bone-soft">
          {t('report.thanksBody', { defaultValue: 'Thanks — our team will take a look.' })}
        </p>
      </div>
    )
  }

  const busy = phase === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="max-w-[58ch] text-[0.85rem] leading-relaxed text-ink-soft dark:text-bone-soft text-pretty">
        {t('report.intro', {
          defaultValue: 'Spotted something that breaks the rules? Let us know.',
        })}
      </p>

      <fieldset>
        <legend className="mb-2 block text-[0.85rem] font-medium text-ink dark:text-bone">
          {t('report.reasonLabel', { defaultValue: 'Reason' })}
        </legend>
        <div
          role="radiogroup"
          aria-label={t('report.reasonLabel', { defaultValue: 'Reason' })}
          className="flex flex-wrap gap-2"
        >
          {REASONS.map((value) => {
            const active = reason === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setReason(value)}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium motion-safe:transition ease-expo focus-volt',
                  active
                    ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                    : 'border border-line text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:text-bone'
                )}
              >
                {t(`report.reasons.${value}`, { defaultValue: value })}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="report-details"
          className="mb-2 block text-[0.85rem] font-medium text-ink dark:text-bone"
        >
          {t('report.detailsLabel', { defaultValue: 'Details' })}
          <span className="ml-1.5 font-normal text-ink-mute dark:text-bone-mute">
            {t('report.optional', { defaultValue: '(optional)' })}
          </span>
        </label>
        <Textarea
          id="report-details"
          value={details}
          rows={4}
          maxLength={2000}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t('report.detailsPlaceholder', { defaultValue: 'Add any context…' })}
        />
      </div>

      {error && (
        <p role="alert" className="text-[0.8rem] text-coral-deep dark:text-coral">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-bone disabled:cursor-not-allowed disabled:opacity-60 dark:bg-bone dark:text-ink motion-safe:transition ease-expo lift-on-hover focus-volt"
      >
        {busy ? (
          <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />
        ) : (
          <Flag aria-hidden className="h-4 w-4" />
        )}
        {busy
          ? t('report.submitting', { defaultValue: 'Sending…' })
          : t('report.submit', { defaultValue: 'Submit report' })}
      </button>
    </form>
  )
}
