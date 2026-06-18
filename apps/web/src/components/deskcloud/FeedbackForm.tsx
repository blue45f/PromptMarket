/**
 * FeedbackForm — NATIVE SurveyDesk feedback (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * Fetches the app's active survey via the PUBLISHED SDK (`createSurveyClient`,
 * `pk_`) and renders its questions (rating / nps / single / multi / text) with
 * THIS APP'S UI primitives + tokens, then submits the response. No widget
 * bundle, no foreign CSS. Active only when VITE_SURVEYDESK_URL is set; this is
 * generic product feedback, distinct from the first-party /support inquiry form
 * (which posts to TermsDesk and remains untouched).
 *
 * a11y: labelled controls (fieldset/legend, radiogroup) · StarRating for the
 * rating type · required hints · contrast ≥4.5:1 · prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────────────────
 */
import StarRating from '@components/StarRating'
import { Textarea } from '@components/ui'
import {
  type SubmitSurveyResponseInput,
  type Survey,
  type SurveyAnswerValue,
  type SurveyClient,
  type SurveyQuestion,
} from '@heejun/deskcloud'
import { cn } from '@utils/cn'
import { CheckCircle2, Loader2, MessageSquareHeart, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DESKCLOUD_APP_ID } from './config'

type Phase = 'loading' | 'ready' | 'empty' | 'error' | 'submitting' | 'done'
type Answers = Record<string, SurveyAnswerValue>

interface FeedbackFormProps {
  client: SurveyClient
}

export default function FeedbackForm({ client }: FeedbackFormProps) {
  const { t } = useTranslation('common')
  const [phase, setPhase] = useState<Phase>('loading')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .getActive(DESKCLOUD_APP_ID)
      .then((s) => {
        if (cancelled) return
        setSurvey(s)
        setPhase('ready')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        // A 404 means no active survey — show a calm empty state, not an error.
        if (
          e &&
          typeof e === 'object' &&
          'status' in e &&
          (e as { status: number }).status === 404
        ) {
          setPhase('empty')
        } else {
          setPhase('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [client])

  const setAnswer = useCallback((id: string, value: SurveyAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!survey) return
      setError(null)
      setPhase('submitting')
      const input: SubmitSurveyResponseInput = {
        answers,
        meta: { pageUrl: typeof location !== 'undefined' ? location.href : undefined },
      }
      client
        .submit(DESKCLOUD_APP_ID, input)
        .then(() => setPhase('done'))
        .catch(() => {
          setError(t('feedback.submitError', { defaultValue: "Couldn't send feedback." }))
          setPhase('ready')
        })
    },
    [survey, answers, client, t]
  )

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-[0.82rem] text-ink-soft dark:text-bone-soft">
        <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden />
        {t('feedback.loading', { defaultValue: 'Loading…' })}
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
          {t('feedback.errorTitle', { defaultValue: "Couldn't load feedback form" })}
        </p>
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <div className="py-12 text-center">
        <span
          aria-hidden
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-canvas-sub text-ink-mute dark:bg-night-deep dark:text-bone-mute"
        >
          <MessageSquareHeart className="w-5 h-5" />
        </span>
        <p className="text-[0.88rem] font-medium text-ink dark:text-bone">
          {t('feedback.empty', { defaultValue: 'No survey is active right now.' })}
        </p>
      </div>
    )
  }

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
          {t('feedback.thanksTitle', { defaultValue: 'Thanks for the feedback!' })}
        </p>
        <p className="mx-auto mt-1 max-w-[40ch] text-[0.82rem] text-ink-soft dark:text-bone-soft">
          {t('feedback.thanksBody', { defaultValue: 'Your response helps shape the marketplace.' })}
        </p>
      </div>
    )
  }

  const busy = phase === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {survey?.intro && (
        <p className="max-w-[58ch] text-[0.85rem] leading-relaxed text-ink-soft dark:text-bone-soft text-pretty">
          {survey.intro}
        </p>
      )}

      {survey?.questions.map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={setAnswer} />
      ))}

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
        {busy && <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />}
        {busy
          ? t('feedback.submitting', { defaultValue: 'Sending…' })
          : t('feedback.submit', { defaultValue: 'Send feedback' })}
      </button>
    </form>
  )
}

function QuestionField({
  q,
  value,
  onChange,
}: {
  q: SurveyQuestion
  value: SurveyAnswerValue | undefined
  onChange: (id: string, value: SurveyAnswerValue) => void
}) {
  const { t } = useTranslation('common')
  const requiredMark = q.required ? (
    <span className="ml-1 text-coral-deep dark:text-coral" aria-hidden>
      *
    </span>
  ) : null

  if (q.type === 'rating') {
    return (
      <fieldset>
        <legend className="mb-2 block text-[0.85rem] font-medium text-ink dark:text-bone">
          {q.label}
          {requiredMark}
        </legend>
        <StarRating
          value={typeof value === 'number' ? value : 0}
          size="lg"
          onChange={(n) => onChange(q.id, n)}
        />
      </fieldset>
    )
  }

  if (q.type === 'nps') {
    const scores = Array.from({ length: 11 }, (_, i) => i)
    return (
      <fieldset>
        <legend className="mb-2 block text-[0.85rem] font-medium text-ink dark:text-bone">
          {q.label}
          {requiredMark}
        </legend>
        <div role="radiogroup" aria-label={q.label} className="flex flex-wrap gap-1.5">
          {scores.map((n) => {
            const active = value === n
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(q.id, n)}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-lg text-[0.8rem] font-mono font-medium motion-safe:transition ease-expo focus-volt',
                  active
                    ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                    : 'border border-line text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:text-bone'
                )}
              >
                {n}
              </button>
            )
          })}
        </div>
      </fieldset>
    )
  }

  if (q.type === 'single_choice' || q.type === 'multi_choice') {
    const multi = q.type === 'multi_choice'
    const selected = multi
      ? Array.isArray(value)
        ? value
        : []
      : typeof value === 'string'
        ? [value]
        : []
    return (
      <fieldset>
        <legend className="mb-2 block text-[0.85rem] font-medium text-ink dark:text-bone">
          {q.label}
          {requiredMark}
        </legend>
        <div
          role={multi ? 'group' : 'radiogroup'}
          aria-label={q.label}
          className="flex flex-wrap gap-2"
        >
          {q.options?.map((opt) => {
            const active = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                role={multi ? 'checkbox' : 'radio'}
                aria-checked={active}
                onClick={() => {
                  if (multi) {
                    const next = active
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value]
                    onChange(q.id, next)
                  } else {
                    onChange(q.id, opt.value)
                  }
                }}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium motion-safe:transition ease-expo focus-volt',
                  active
                    ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                    : 'border border-line text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:text-bone'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </fieldset>
    )
  }

  // text
  const textValue = typeof value === 'string' ? value : ''
  const fieldId = `feedback-q-${q.id}`
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[0.85rem] font-medium text-ink dark:text-bone"
      >
        {q.label}
        {requiredMark}
      </label>
      <Textarea
        id={fieldId}
        value={textValue}
        rows={q.variant === 'long' ? 5 : 2}
        onChange={(e) => onChange(q.id, e.target.value)}
        placeholder={t('feedback.textPlaceholder', { defaultValue: 'Type your answer…' })}
      />
    </div>
  )
}
