import AttachmentInput from '@components/AttachmentInput'
import { Field, Input, Textarea } from '@components/ui'
import { useCreateThread } from '@domains/community'
import { usePageMeta } from '@hooks/usePageMeta'
import {
  CATEGORIES,
  CreateDiscussionThreadSchema,
  type AttachmentInput as AttachmentDraft,
} from '@promptmarket/shared'
import { cn } from '@utils/cn'
import { zodFormResolver } from '@utils/zodFormResolver'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

// Attachments are managed outside react-hook-form (the picker resizes files
// asynchronously), so the form itself validates only the text fields.
const threadFormSchema = CreateDiscussionThreadSchema.omit({ attachments: true })
type ThreadFormValues = z.infer<typeof threadFormSchema>

const fieldClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition ease-expo',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500'
)

export default function CommunityNewPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('community')
  const [searchParams] = useSearchParams()
  const presetCategory = searchParams.get('category') ?? ''
  const createMut = useCreateThread()
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([])

  usePageMeta({ title: t('new.meta.title'), description: t('new.meta.description') })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ThreadFormValues>({
    resolver: zodFormResolver(threadFormSchema),
    defaultValues: {
      title: '',
      body: '',
      category: (CATEGORIES as readonly string[]).includes(presetCategory)
        ? (presetCategory as ThreadFormValues['category'])
        : 'Coding',
    },
  })

  const busy = isSubmitting || createMut.isPending

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMut.mutateAsync({ ...values, attachments })
      navigate(`/community/${created.id}`, { replace: true })
    } catch {
      /* toast handled in hook */
    }
  })

  return (
    <div className="mx-auto max-w-3xl px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('detail.backToBoard')}
      </Link>

      <header className="mt-5 mb-7">
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.98] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-sm, 2rem)' }}
        >
          {t('new.title')}
        </h1>
        <p className="mt-2 max-w-[56ch] text-ink-soft dark:text-bone-soft">{t('new.subtitle')}</p>
      </header>

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-line bg-canvas-sub p-6 dark:border-night-line dark:bg-night-sub sm:p-8"
      >
        <div>
          <label
            htmlFor="thread-category"
            className="mb-1.5 block text-[0.82rem] font-medium text-ink dark:text-bone"
          >
            {t('new.categoryLabel')}
          </label>
          <select id="thread-category" {...register('category')} className={fieldClass}>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(`home:categories.labels.${value}`, { defaultValue: value })}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[0.72rem] text-ink-mute dark:text-bone-mute">
            {t('new.categoryHint')}
          </p>
        </div>

        <Field
          id="thread-title"
          label={t('new.titleLabel')}
          error={errors.title ? t('new.validation.title') : undefined}
        >
          {(control) => (
            <Input
              {...control}
              {...register('title')}
              type="text"
              maxLength={140}
              placeholder={t('new.titlePlaceholder')}
              invalid={Boolean(errors.title)}
            />
          )}
        </Field>

        <Field
          id="thread-body"
          label={t('new.bodyLabel')}
          description={t('new.bodyHint')}
          error={errors.body ? t('new.validation.body') : undefined}
        >
          {(control) => (
            <Textarea
              {...control}
              {...register('body')}
              rows={8}
              maxLength={8000}
              placeholder={t('new.bodyPlaceholder')}
              invalid={Boolean(errors.body)}
            />
          )}
        </Field>

        <div>
          <span className="mb-1.5 block text-[0.82rem] font-medium text-ink dark:text-bone">
            {t('new.attachmentsLabel')}
          </span>
          <AttachmentInput value={attachments} onChange={setAttachments} disabled={busy} />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-5 dark:border-night-line/70">
          <Link
            to="/community"
            className="inline-flex min-h-9 items-center rounded-full px-4 py-1.5 text-sm font-medium text-ink-soft hover:text-ink dark:text-bone-soft dark:hover:text-bone focus-volt"
          >
            {t('new.cancel')}
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-bone disabled:cursor-not-allowed disabled:opacity-60 dark:bg-bone dark:text-ink motion-safe:transition ease-expo lift-on-hover focus-volt"
          >
            {busy && <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />}
            {busy ? t('new.submitting') : t('new.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
