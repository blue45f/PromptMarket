import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, CheckCircle2, Loader2, LifeBuoy } from 'lucide-react'
import {
  INQUIRY_BODY_MAX,
  INQUIRY_CATEGORIES,
  INQUIRY_TITLE_MAX,
  inquiryFormSchema,
  useSubmitInquiry,
  type InquiryFormInput,
  type InquiryReceipt,
} from '@features/inquiry'
import { TERMSDESK_SUPPORT_URL } from '@features/policies'
import { usePageMeta } from '@hooks/usePageMeta'
import { formatDate } from '@utils/format'
import { cn } from '@utils/cn'
import { zodFormResolver } from '@utils/zodFormResolver'

const fieldClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition ease-expo',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500'
)

export default function SupportPage() {
  const { t } = useTranslation('inquiry')
  const submitMut = useSubmitInquiry()
  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null)

  usePageMeta({ title: t('meta.title'), description: t('meta.description') })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormInput>({
    resolver: zodFormResolver(inquiryFormSchema),
    defaultValues: { category: 'question', title: '', body: '', contactEmail: '', website: '' },
  })

  const busy = isSubmitting || submitMut.isPending
  const bodyLength = (useWatch({ control, name: 'body' }) ?? '').length

  const onSubmit = handleSubmit(async (values) => {
    try {
      const parsed = inquiryFormSchema.parse(values)
      const result = await submitMut.mutateAsync(parsed)
      setReceipt(result)
      reset()
      window.scrollTo({ top: 0 })
    } catch {
      /* error state rendered below */
    }
  })

  if (receipt) {
    return <SupportReceipt receipt={receipt} onReset={() => setReceipt(null)} />
  }

  return (
    <div className="mx-auto max-w-2xl px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="mb-7">
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.98] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('header.title')}
        </h1>
        <p className="mt-2 max-w-[52ch] text-ink-soft dark:text-bone-soft">
          {t('header.subtitle')}
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-line bg-canvas-sub p-6 dark:border-night-line dark:bg-night-sub sm:p-8"
      >
        <fieldset>
          <legend className="mb-2 block text-[0.82rem] font-medium text-ink dark:text-bone">
            {t('form.categoryLabel')}
          </legend>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label={t('form.categoryLabel')}
                className="flex flex-wrap gap-2"
              >
                {INQUIRY_CATEGORIES.map((value) => {
                  const active = field.value === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium tracking-tight motion-safe:transition ease-expo focus-volt',
                        active
                          ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                          : 'border border-line text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone'
                      )}
                    >
                      {t(`categories.${value}`)}
                    </button>
                  )
                })}
              </div>
            )}
          />
          <p className="mt-1.5 text-[0.72rem] text-ink-mute dark:text-bone-mute">
            {t('form.categoryHint')}
          </p>
        </fieldset>

        <div>
          <label
            htmlFor="inquiry-title"
            className="mb-1.5 block text-[0.82rem] font-medium text-ink dark:text-bone"
          >
            {t('form.titleLabel')}
          </label>
          <input
            id="inquiry-title"
            type="text"
            maxLength={INQUIRY_TITLE_MAX}
            placeholder={t('form.titlePlaceholder')}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'inquiry-title-error' : undefined}
            {...register('title')}
            className={fieldClass}
          />
          {errors.title && (
            <p
              id="inquiry-title-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t('form.validation.title')}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="inquiry-body"
            className="mb-1.5 block text-[0.82rem] font-medium text-ink dark:text-bone"
          >
            {t('form.bodyLabel')}
          </label>
          <textarea
            id="inquiry-body"
            rows={7}
            maxLength={INQUIRY_BODY_MAX}
            placeholder={t('form.bodyPlaceholder')}
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={errors.body ? 'inquiry-body-error' : 'inquiry-body-hint'}
            {...register('body')}
            className={cn(fieldClass, 'resize-y leading-relaxed')}
          />
          {errors.body ? (
            <p
              id="inquiry-body-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t('form.validation.body')}
            </p>
          ) : (
            <p
              id="inquiry-body-hint"
              className="mt-1 text-[0.72rem] tabular-nums text-ink-mute dark:text-bone-mute"
            >
              {t('form.bodyHint', { count: bodyLength, max: INQUIRY_BODY_MAX })}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="inquiry-email"
            className="mb-1.5 block text-[0.82rem] font-medium text-ink dark:text-bone"
          >
            {t('form.emailLabel')}
            <span className="ml-1.5 font-normal text-ink-mute dark:text-bone-mute">
              {t('form.emailOptional')}
            </span>
          </label>
          <input
            id="inquiry-email"
            type="email"
            autoComplete="email"
            placeholder={t('form.emailPlaceholder')}
            aria-invalid={errors.contactEmail ? true : undefined}
            aria-describedby={errors.contactEmail ? 'inquiry-email-error' : 'inquiry-email-hint'}
            {...register('contactEmail')}
            className={fieldClass}
          />
          {errors.contactEmail ? (
            <p
              id="inquiry-email-error"
              role="alert"
              className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
            >
              {t('form.validation.email')}
            </p>
          ) : (
            <p
              id="inquiry-email-hint"
              className="mt-1 text-[0.72rem] text-ink-mute dark:text-bone-mute"
            >
              {t('form.emailHint')}
            </p>
          )}
        </div>

        {/* Honeypot — invisible to humans, irresistible to naive bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="inquiry-website">website</label>
          <input
            id="inquiry-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('website')}
          />
        </div>

        {submitMut.isError && (
          <div
            role="alert"
            className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral-deep dark:border-coral/45 dark:bg-coral/15 dark:text-coral"
          >
            <p>{t('form.submitError')}</p>
            <a
              href={TERMSDESK_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-medium underline focus-volt"
            >
              {t('form.fallbackLink')}
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line/70 pt-5 dark:border-night-line/70 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={TERMSDESK_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[0.78rem] text-ink-mute hover:text-ink dark:text-bone-mute dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
          >
            <LifeBuoy aria-hidden="true" className="h-3.5 w-3.5" />
            {t('form.externalFallback')}
            <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
          </a>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-bone disabled:cursor-not-allowed disabled:opacity-60 dark:bg-bone dark:text-ink motion-safe:transition ease-expo lift-on-hover focus-volt"
          >
            {busy && <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />}
            {busy ? t('form.submitting') : t('form.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}

function SupportReceipt({ receipt, onReset }: { receipt: InquiryReceipt; onReset: () => void }) {
  const { t } = useTranslation('inquiry')

  return (
    <div className="mx-auto max-w-2xl px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <div className="rounded-2xl border border-line bg-canvas-sub p-8 text-center dark:border-night-line dark:bg-night-sub sm:p-10">
        <span
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-volt-300 text-ink"
        >
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-[1.6rem] font-bold tracking-tight text-ink dark:text-bone">
          {t('receipt.title')}
        </h1>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-ink-soft dark:text-bone-soft">
          {receipt.contactEmail
            ? t('receipt.subtitleWithEmail', { email: receipt.contactEmail })
            : t('receipt.subtitle')}
        </p>

        <dl className="mx-auto mt-7 max-w-md space-y-3 rounded-2xl border border-line bg-canvas p-5 text-left text-sm dark:border-night-line dark:bg-night">
          <ReceiptRow label={t('receipt.fields.category')}>
            {t(`categories.${receipt.category}`)}
          </ReceiptRow>
          <ReceiptRow label={t('receipt.fields.title')}>{receipt.title}</ReceiptRow>
          <ReceiptRow label={t('receipt.fields.submittedAt')}>
            {formatDate(receipt.submittedAt)}
          </ReceiptRow>
          {receipt.referenceId && (
            <ReceiptRow label={t('receipt.fields.reference')}>
              <span className="font-mono text-xs">{receipt.referenceId}</span>
            </ReceiptRow>
          )}
        </dl>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-bone dark:bg-bone dark:text-ink motion-safe:transition ease-expo lift-on-hover focus-volt"
          >
            {t('receipt.again')}
          </button>
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-1 rounded-full border border-line px-5 py-2 text-sm font-medium text-ink-soft hover:border-volt-400 hover:text-ink dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
          >
            {t('receipt.home')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function ReceiptRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-xs font-medium text-ink-mute dark:text-bone-mute">{label}</dt>
      <dd className="min-w-0 break-words text-right text-ink dark:text-bone">{children}</dd>
    </div>
  )
}
