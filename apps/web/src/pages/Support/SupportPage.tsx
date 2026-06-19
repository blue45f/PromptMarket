import { Badge, EmptyState, Field, Input, Skeleton, Textarea } from '@components/ui'
import {
  inquiryKeys,
  INQUIRY_BODY_MAX,
  INQUIRY_CATEGORIES,
  INQUIRY_NAME_MAX,
  INQUIRY_TITLE_MAX,
  inquiryFormSchema,
  useInquiries,
  useSubmitInquiry,
  type Inquiry,
  type InquiryFormInput,
  type InquiryReceipt,
  type InquiryStatus,
} from '@domains/inquiry'
import { usePageMeta } from '@hooks/usePageMeta'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@utils/cn'
import { formatDate, formatRelative } from '@utils/format'
import { zodFormResolver } from '@utils/zodFormResolver'
import { CheckCircle2, Inbox, Loader2, MessageSquarePlus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function SupportPage() {
  const { t } = useTranslation('inquiry')
  const queryClient = useQueryClient()
  const submitMut = useSubmitInquiry()
  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null)
  // Route-enter focus target: screen-reader context + a keyboard starting point.
  const headingRef = useRef<HTMLHeadingElement>(null)

  usePageMeta({ title: t('meta.title'), description: t('meta.description') })

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormInput>({
    resolver: zodFormResolver(inquiryFormSchema),
    defaultValues: {
      category: 'usage',
      title: '',
      body: '',
      authorName: '',
      contactEmail: '',
      website: '',
    },
  })

  const busy = isSubmitting || submitMut.isPending
  const bodyLength = (useWatch({ control, name: 'body' }) ?? '').length

  const onSubmit = handleSubmit(async (values) => {
    try {
      const parsed = inquiryFormSchema.parse(values)
      const result = await submitMut.mutateAsync(parsed)
      setReceipt(result)
      reset()
      // Pull the freshly-created inquiry into the public board.
      await queryClient.invalidateQueries({ queryKey: inquiryKeys.all })
      globalThis.scrollTo({ top: 0 })
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
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300">
          {t('meta.title')} · /support
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1.5 font-display font-bold text-ink dark:text-bone leading-[0.98] tracking-[-0.035em] display-tight outline-none"
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
                      title={t(`categoryHints.${value}`)}
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

        <Field
          id="inquiry-title"
          label={t('form.titleLabel')}
          error={errors.title ? t('form.validation.title') : undefined}
        >
          {(control) => (
            <Input
              {...control}
              {...register('title')}
              type="text"
              maxLength={INQUIRY_TITLE_MAX}
              placeholder={t('form.titlePlaceholder')}
              invalid={Boolean(errors.title)}
            />
          )}
        </Field>

        <Field
          id="inquiry-body"
          label={t('form.bodyLabel')}
          description={t('form.bodyHint', { count: bodyLength, max: INQUIRY_BODY_MAX })}
          error={errors.body ? t('form.validation.body') : undefined}
        >
          {(control) => (
            <Textarea
              {...control}
              {...register('body')}
              rows={7}
              maxLength={INQUIRY_BODY_MAX}
              placeholder={t('form.bodyPlaceholder')}
              invalid={Boolean(errors.body)}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="inquiry-name"
            label={
              <>
                {t('form.nameLabel')}
                <span className="ml-1.5 font-normal text-ink-mute dark:text-bone-mute">
                  {t('form.nameOptional')}
                </span>
              </>
            }
            error={errors.authorName ? t('form.validation.name') : undefined}
          >
            {(control) => (
              <Input
                {...control}
                {...register('authorName')}
                type="text"
                autoComplete="name"
                maxLength={INQUIRY_NAME_MAX}
                placeholder={t('form.namePlaceholder')}
                invalid={Boolean(errors.authorName)}
              />
            )}
          </Field>

          <Field
            id="inquiry-email"
            label={
              <>
                {t('form.emailLabel')}
                <span className="ml-1.5 font-normal text-ink-mute dark:text-bone-mute">
                  {t('form.emailOptional')}
                </span>
              </>
            }
            error={errors.contactEmail ? t('form.validation.email') : undefined}
          >
            {(control) => (
              <Input
                {...control}
                {...register('contactEmail')}
                type="email"
                autoComplete="email"
                placeholder={t('form.emailPlaceholder')}
                invalid={Boolean(errors.contactEmail)}
              />
            )}
          </Field>
        </div>
        <p className="-mt-2 text-[0.72rem] text-ink-mute dark:text-bone-mute">
          {t('form.emailHint')}
        </p>

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

        {/* Submit error — announced assertively for assistive tech. */}
        {submitMut.isError && (
          <div
            role="alert"
            className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral-deep dark:border-coral/45 dark:bg-coral/15 dark:text-coral"
          >
            <p>
              {submitMut.error instanceof Error ? submitMut.error.message : t('form.submitError')}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end border-t border-line/70 pt-5 dark:border-night-line/70">
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

      <InquiryBoard />
    </div>
  )
}

const STATUS_TONE: Record<InquiryStatus, 'neutral' | 'volt' | 'violet' | 'iris'> = {
  new: 'volt',
  in_progress: 'iris',
  resolved: 'violet',
  closed: 'neutral',
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  const { t } = useTranslation('inquiry')
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{t(`board.status.${status}`)}</Badge>
}

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const { t } = useTranslation('inquiry')
  return (
    <article className="rounded-2xl border border-line bg-canvas-sub p-4 dark:border-night-line dark:bg-night-sub">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{t(`categories.${inquiry.category}`)}</Badge>
        <StatusBadge status={inquiry.status} />
        <time
          dateTime={inquiry.createdAt}
          className="ml-auto text-[0.72rem] text-ink-mute dark:text-bone-mute"
        >
          {formatRelative(inquiry.createdAt)}
        </time>
      </div>
      <h3 className="mt-2.5 font-display text-[0.95rem] font-semibold tracking-tight text-ink dark:text-bone">
        {inquiry.title}
      </h3>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-soft dark:text-bone-soft">
        {inquiry.body}
      </p>
      <p className="mt-2.5 text-[0.72rem] text-ink-mute dark:text-bone-mute">
        {inquiry.authorName?.trim() || t('board.anonymous')}
      </p>
    </article>
  )
}

function InquiryBoard() {
  const { t } = useTranslation('inquiry')
  const { data, isPending, isError, error, refetch, isFetching } = useInquiries(20, 0)
  const items = data?.items ?? []

  return (
    <section className="mt-10" aria-labelledby="inquiry-board-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <Inbox aria-hidden className="h-4 w-4 text-ink-soft dark:text-bone-soft" />
          <div>
            <h2
              id="inquiry-board-heading"
              className="font-display text-lg font-bold tracking-tight text-ink dark:text-bone"
            >
              {t('board.title')}
            </h2>
            <p className="text-[0.72rem] text-ink-mute dark:text-bone-mute">
              {t('board.subtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.78rem] font-medium text-ink-soft hover:border-volt-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 dark:border-night-line dark:text-bone-soft dark:hover:border-volt-500/60 dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
        >
          <RotateCcw
            aria-hidden
            className={cn('h-3.5 w-3.5', isFetching && 'motion-safe:animate-spin')}
          />
          {t('board.refresh')}
        </button>
      </div>

      <div aria-live="polite" aria-busy={isFetching}>
        {isPending ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <li key={key}>
                <Skeleton className="h-36 rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-4 text-sm text-coral-deep dark:border-coral/45 dark:bg-coral/15 dark:text-coral"
          >
            <p className="font-medium">
              {error instanceof Error ? error.message : t('board.error')}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-coral/40 px-3 py-1.5 text-[0.78rem] font-medium motion-safe:transition ease-expo focus-volt"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              {t('board.retry')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title={t('board.empty')}
            description={t('board.emptyDescription')}
            headingLevel={3}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((inquiry) => (
              <li key={inquiry.id}>
                <InquiryCard inquiry={inquiry} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function SupportReceipt({ receipt, onReset }: { receipt: InquiryReceipt; onReset: () => void }) {
  const { t } = useTranslation('inquiry')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <div className="rounded-2xl border border-line bg-canvas-sub p-8 text-center dark:border-night-line dark:bg-night-sub sm:p-10">
        <span
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-volt-300 text-ink"
        >
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 font-display text-[1.6rem] font-bold tracking-tight text-ink dark:text-bone outline-none"
        >
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
