import React, {
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
import * as Tabs from '@radix-ui/react-tabs'
import toast from 'react-hot-toast'
import { z } from 'zod'
import {
  CATEGORIES,
  CreateListingSchema,
  Difficulty as DifficultyEnum,
  License as LicenseEnum,
  LISTING_TYPE_META,
  ListingType as ListingTypeEnum,
  PromptTechnique as PromptTechniqueEnum,
  TECHNIQUE_META,
  type CreateListingInput,
  type Difficulty,
  type License,
  type ListingType,
  type PromptTechnique,
} from '@promptmarket/shared'
import { Loader2 } from 'lucide-react'
import { useCreateListing, useListings } from '@features/marketplace/queries'
import { usePageMeta } from '@hooks/usePageMeta'
import MarkdownView from '@components/MarkdownView'
import ModelPicker from '@components/ModelPicker'
import ListingCard from '@components/ListingCard'
import ListingQualityChecklist from '@components/ListingQualityChecklist'
import { evaluateListingQuality } from '@components/listingQualityUtils'
import { cn } from '@utils/cn'
import { formatPrice, modelLabel } from '@utils/format'
import { zodFormResolver } from '@utils/zodFormResolver'
import type { ListingCard as ListingCardType } from '@/types'

const QUICK_EMOJIS = ['✨', '🤖', '🧠', '🎨', '📝', '🚀', '⚡', '🛠️', '🧩', '🔌']
const TYPES = ListingTypeEnum.options
const TECHNIQUES = PromptTechniqueEnum.options
const DIFFICULTIES: Difficulty[] = DifficultyEnum.options
const LICENSES: License[] = LicenseEnum.options

// Maps each form field to the tab that renders it, so an off-tab validation
// failure can switch to (and remount) the tab holding the first errored field.
const FIELD_TAB: Record<string, 'basics' | 'content' | 'metadata'> = {
  title: 'basics',
  description: 'basics',
  coverEmoji: 'basics',
  type: 'basics',
  category: 'basics',
  body: 'content',
  priceDollars: 'content',
  modelsArr: 'metadata',
  version: 'metadata',
  tags: 'metadata',
  technique: 'metadata',
  difficulty: 'metadata',
  license: 'metadata',
}

// Form-only schema: omits priceCents (we accept a dollar string from the user
// and convert it inside onSubmit) and replaces `models` with an array we
// manage with the ModelPicker. Validation copy is injected at runtime so it
// can be localized; the inferred shape is unaffected by the message strings.
function buildFormSchema(messages: { price: string; models: string }) {
  return CreateListingSchema.omit({
    priceCents: true,
    models: true,
  }).extend({
    priceDollars: z.string().refine((v) => Number.isFinite(Number.parseFloat(v)), messages.price),
    modelsArr: z.array(z.string()).min(1, messages.models),
  })
}
type FormSchema = ReturnType<typeof buildFormSchema>
type FormInput = z.input<FormSchema>
type FormShape = z.output<FormSchema>

const DRAFT_KEY = 'pm.sellDraft'

const DEFAULTS: FormShape = {
  title: '',
  type: 'PROMPT',
  description: '',
  body: '',
  category: CATEGORIES[0],
  tags: '',
  modelsArr: ['claude-sonnet-4-6'],
  technique: null,
  difficulty: 'intermediate',
  license: 'MIT',
  version: '1.0.0',
  coverEmoji: '✨',
  priceDollars: '0',
}

export default function CreateListingPage() {
  const { t } = useTranslation('create')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const createMut = useCreateListing({ showSuccessToast: false })
  const [tab, setTab] = useState<'basics' | 'content' | 'metadata'>('basics')
  const [previewLayout, setPreviewLayout] = useState<'sidebar' | 'full'>('sidebar')
  const isSidebarPreview = previewLayout === 'sidebar'

  usePageMeta({
    title: t('meta.title'),
    description: t('meta.description'),
  })

  const FormSchema = useMemo(
    () =>
      buildFormSchema({
        price: t('validation.price'),
        models: t('validation.models'),
      }),
    [t]
  )

  // Draft is read once at mount and used as the form's defaultValues so
  // each input hydrates with the saved value. After mount the watch()
  // serialiser keeps localStorage in sync (debounced, see effect below).
  const [initialDraft] = useState<FormShape>(() => {
    if (typeof window === 'undefined') return DEFAULTS
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return DEFAULTS
      const parsed = buildFormSchema({ price: '', models: '' }).safeParse({
        ...DEFAULTS,
        ...JSON.parse(raw),
      })
      return parsed.success ? parsed.data : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })
  const [draftHydrated] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!window.localStorage.getItem(DRAFT_KEY)
  })
  const [draftDismissed, setDraftDismissed] = useState(false)
  const [draftDiscardPending, setDraftDiscardPending] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormShape>({
    resolver: zodFormResolver(FormSchema),
    defaultValues: initialDraft,
  })

  const watchedValues = useWatch({ control }) as Partial<FormShape>
  const v = useMemo<FormShape>(() => ({ ...DEFAULTS, ...watchedValues }), [watchedValues])
  const draftJson = useMemo(() => JSON.stringify(v), [v])

  // Debounced autosave — write the watched form snapshot after typing settles.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const timerId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, draftJson)
      } catch {
        /* quota — silently drop */
      }
    }, 600)
    return () => {
      window.clearTimeout(timerId)
    }
  }, [draftJson])

  function discardDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    reset(DEFAULTS)
    setDraftDismissed(true)
  }

  const handleCategoryPick = useCallback(
    (c: string) => setValue('category', c as FormShape['category'], { shouldDirty: true }),
    [setValue]
  )

  // Auto-clear technique field whenever type leaves PROMPT.
  useEffect(() => {
    if (v.type !== 'PROMPT' && v.technique) {
      setValue('technique', null)
    }
  }, [v.type, v.technique, setValue])

  const onSubmit = handleSubmit(
    async (values) => {
      const parsed = Number.parseFloat(values.priceDollars)
      const priceCents = Number.isFinite(parsed) ? Math.round(Math.max(0, parsed) * 100) : 0

      const payload: CreateListingInput = {
        title: values.title.trim(),
        type: values.type,
        description: values.description.trim(),
        body: values.body,
        category: values.category,
        tags: (values.tags ?? '')
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean)
          .join(','),
        models: values.modelsArr,
        technique: values.type === 'PROMPT' ? (values.technique ?? null) : null,
        difficulty: values.difficulty,
        license: values.license,
        version: values.version,
        priceCents,
        coverEmoji: values.coverEmoji || '✨',
      }

      const result = CreateListingSchema.safeParse(payload)
      if (!result.success) {
        toast.error(t('validation.canonicalFailed'))
        return
      }

      try {
        const res = await createMut.mutateAsync(result.data)
        const meta = LISTING_TYPE_META[res.type]
        toast.custom(() => (
          <PublishListingPreviewToast
            listing={res}
            heading={t('toast.title')}
            actionLabel={t('toast.viewListing')}
            priceLabel={
              res.priceCents === 0 ? tCommon('labels.free') : formatPrice(res.priceCents ?? 0)
            }
            typeLabel={`${meta.emoji} ${meta.label}`}
          />
        ))
        try {
          window.localStorage.removeItem(DRAFT_KEY)
        } catch {
          /* ignore */
        }
        navigate(`/listings/${res.slug}`)
      } catch {
        /* toast handled in hook */
      }
    },
    (formErrors) => {
      // Validation can fail on an inactive tab whose panel is unmounted, so the
      // inline error is invisible and RHF can't focus it. Switch to the first
      // errored field's tab to surface its message and always toast for feedback.
      const first = Object.keys(formErrors)[0]
      const target = first ? FIELD_TAB[first] : undefined
      if (target) setTab(target)
      toast.error(t('validation.fixFields', { count: Object.keys(formErrors).length }))
    }
  )

  const busy = isSubmitting || createMut.isPending

  const qualityResult = useMemo(
    () =>
      evaluateListingQuality({
        title: v.title,
        description: v.description,
        body: v.body,
        type: v.type as ListingType,
        tags: v.tags,
        models: v.modelsArr,
        version: v.version,
      }),
    [v.title, v.description, v.body, v.type, v.tags, v.modelsArr, v.version]
  )

  const jumpToSection = useCallback(
    (section: 'basics' | 'content' | 'metadata') => {
      setTab(section)
      const selectorBySection = {
        basics: '[name="title"]',
        content: '[name="body"]',
        metadata: '[name="tags"]',
      } satisfies Record<'basics' | 'content' | 'metadata', string>
      window.requestAnimationFrame(() => {
        const target = document.querySelector(selectorBySection[section]) as HTMLElement | null
        target?.focus()
      })
    },
    [setTab]
  )

  // Build a preview-shaped listing object reused in the live card.
  const previewListing = useMemo<ListingCardType>(
    () => ({
      id: 'preview',
      slug: 'preview',
      title: v.title?.trim() || t('preview.titlePlaceholder'),
      type: v.type as ListingType,
      description: v.description?.trim() || t('preview.descriptionPlaceholder'),
      category: v.category,
      tags: (v.tags ?? '')
        .split(',')
        .map((tag: string) => tag.trim())
        .filter(Boolean),
      models: v.modelsArr ?? [],
      technique: (v.technique ?? null) as PromptTechnique | null,
      difficulty: v.difficulty as Difficulty,
      license: v.license as License,
      version: v.version,
      priceCents: Math.round(Math.max(0, Number.parseFloat(v.priceDollars ?? '0') || 0) * 100),
      coverEmoji: v.coverEmoji || '✨',
      downloads: 0,
      author: { id: 'you', username: t('preview.authorYou', { defaultValue: 'you' }) },
      avgRating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    }),
    [
      v.title,
      v.type,
      v.description,
      v.category,
      v.tags,
      v.modelsArr,
      v.technique,
      v.difficulty,
      v.license,
      v.version,
      v.priceDollars,
      v.coverEmoji,
      t,
    ]
  )

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="mb-9 space-y-2">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          {t('header.eyebrow')}
        </p>
        <h1
          id="create-listing-heading"
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('header.title')}
        </h1>
        <p className="text-ink-soft dark:text-bone-soft max-w-[58ch]">{t('header.subtitle')}</p>
      </header>

      <div className="mb-5 flex items-center justify-end gap-2">
        <span className="sr-only">{t('preview.layoutLabel')}</span>
        <div
          role="group"
          aria-label={t('preview.layoutLabel')}
          className="inline-flex gap-1 p-1 rounded-full bg-canvas-sub border border-line dark:border-night-line"
        >
          <button
            type="button"
            onClick={() => setPreviewLayout('sidebar')}
            aria-pressed={isSidebarPreview}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs sm:text-[0.75rem] font-medium motion-safe:transition ease-expo',
              isSidebarPreview
                ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                : 'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone'
            )}
          >
            {t('preview.layout.sidebar')}
          </button>
          <button
            type="button"
            onClick={() => setPreviewLayout('full')}
            aria-pressed={!isSidebarPreview}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs sm:text-[0.75rem] font-medium motion-safe:transition ease-expo',
              !isSidebarPreview
                ? 'bg-ink text-bone dark:bg-bone dark:text-ink'
                : 'text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone'
            )}
          >
            {t('preview.layout.full')}
          </button>
        </div>
      </div>

      {draftHydrated && !draftDismissed && (
        <div
          role="status"
          className="mb-7 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-volt-400/40 dark:border-volt-500/30 bg-volt-100/60 dark:bg-volt-900/30"
        >
          <p className="text-[0.84rem] text-ink dark:text-bone">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 mr-2">
              {t('draft.badge')}
            </span>
            {t('draft.restored')}
          </p>
          {draftDiscardPending ? (
            <div className="inline-flex items-center gap-2">
              <span className="text-[0.78rem] text-ink-soft dark:text-bone-soft">
                {t('draft.discardConfirm')}
              </span>
              <button
                type="button"
                onClick={() => {
                  discardDraft()
                  setDraftDiscardPending(false)
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-red-400/40 dark:border-red-500/30 text-red-600 dark:text-red-400 text-[0.78rem] font-medium hover:border-red-500 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 motion-safe:transition ease-expo focus-volt"
              >
                {t('draft.discardConfirmYes')}
              </button>
              <button
                type="button"
                onClick={() => setDraftDiscardPending(false)}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone text-[0.78rem] font-medium hover:border-ink dark:hover:border-bone hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition ease-expo focus-volt"
              >
                {t('draft.discardCancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDraftDiscardPending(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone text-[0.78rem] font-medium hover:border-ink dark:hover:border-bone hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition ease-expo focus-volt"
            >
              {t('draft.restart')}
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        aria-labelledby="create-listing-heading"
        data-preview-layout={previewLayout}
        className={cn(
          'grid grid-cols-1 gap-6',
          isSidebarPreview ? 'lg:grid-cols-2 lg:gap-7' : 'lg:gap-6'
        )}
      >
        <div className="rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 space-y-5">
          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <Tabs.List
              aria-label={t('sectionTabs.aria', { defaultValue: 'Section tabs' })}
              className="flex gap-1 mb-5 border-b border-line dark:border-night-line"
            >
              {(['basics', 'content', 'metadata'] as const).map((key) => (
                <Tabs.Trigger
                  key={key}
                  value={key}
                  className={cn(
                    'px-4 py-2 -mb-px text-sm font-medium border-b-2 motion-safe:transition ease-expo focus-volt',
                    'border-transparent text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                    'data-[state=active]:border-volt-500 data-[state=active]:text-ink',
                    'dark:data-[state=active]:border-volt-400 dark:data-[state=active]:text-bone'
                  )}
                >
                  {t(`sectionTabs.${key}`)}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="basics" className="space-y-4 focus-visible:outline-none">
              <Field label={t('fields.title')} error={errors.title?.message as string | undefined}>
                <input
                  type="text"
                  {...register('title')}
                  className={inputClass}
                  placeholder={t('fields.titlePlaceholder')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t('fields.type')}>
                  <select {...register('type')} className={inputClass}>
                    {TYPES.map((opt) => (
                      <option key={opt} value={opt}>
                        {LISTING_TYPE_META[opt].emoji}{' '}
                        {t('common:types.' + opt, { defaultValue: LISTING_TYPE_META[opt].label })}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('fields.category')}>
                  <select {...register('category')} className={inputClass}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t('home:categories.labels.' + c, { defaultValue: c })}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <TrendingCategoryHint current={v.category} onPick={handleCategoryPick} />

              <Field
                label={t('fields.description')}
                error={errors.description?.message as string | undefined}
              >
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder={t('fields.descriptionPlaceholder')}
                  className={inputClass}
                />
              </Field>

              <Field label={t('fields.coverEmoji')}>
                <div role="group" className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    maxLength={4}
                    aria-label={t('fields.coverEmojiInput', { defaultValue: 'Emoji character' })}
                    {...register('coverEmoji')}
                    className="w-16 text-center rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-2 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500 motion-safe:transition ease-expo"
                  />
                  <div className="flex flex-wrap gap-1">
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        aria-label={e}
                        aria-pressed={v.coverEmoji === e}
                        onClick={() => setValue('coverEmoji', e, { shouldDirty: true })}
                        className={cn(
                          'w-8 h-8 rounded-lg border text-lg motion-safe:transition ease-expo focus-volt',
                          v.coverEmoji === e
                            ? 'border-volt-500 bg-volt-100 dark:bg-volt-900/40 dark:border-volt-400'
                            : 'border-line dark:border-night-line hover:bg-canvas-deep dark:hover:bg-night-deep'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
            </Tabs.Content>

            <Tabs.Content value="content" className="space-y-4 focus-visible:outline-none">
              <Field label={t('fields.body')} error={errors.body?.message as string | undefined}>
                <textarea
                  rows={16}
                  {...register('body')}
                  placeholder={t('fields.bodyPlaceholder')}
                  className={cn(inputClass, 'font-mono text-xs leading-relaxed')}
                />
              </Field>

              <Field label={t('fields.price')}>
                <div role="group">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    aria-label={t('fields.price', { defaultValue: 'Price (USD)' })}
                    {...register('priceDollars')}
                    className={inputClass}
                  />
                  <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                    {t('fields.priceHint')}
                  </p>
                </div>
              </Field>
            </Tabs.Content>

            <Tabs.Content value="metadata" className="space-y-4 focus-visible:outline-none">
              <Field label={t('fields.tags')}>
                <div role="group">
                  <input
                    type="text"
                    aria-label={t('fields.tags', { defaultValue: 'Tags' })}
                    {...register('tags')}
                    placeholder={t('fields.tagsPlaceholder')}
                    className={inputClass}
                  />
                  <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                    {t('fields.tagsHint')}
                  </p>
                </div>
              </Field>

              <Field
                label={t('fields.models')}
                error={errors.modelsArr?.message as string | undefined}
              >
                <div role="group">
                  <ModelPicker
                    value={v.modelsArr ?? []}
                    onChange={(next) => setValue('modelsArr', next, { shouldDirty: true })}
                  />
                </div>
              </Field>

              {v.type === 'PROMPT' && (
                <Field label={t('fields.technique')}>
                  <div role="group">
                    <select
                      aria-label={t('fields.technique', { defaultValue: 'Prompt technique' })}
                      value={v.technique ?? ''}
                      onChange={(e) =>
                        setValue('technique', (e.target.value || null) as PromptTechnique | null, {
                          shouldDirty: true,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="">{t('fields.techniqueNone')}</option>
                      {TECHNIQUES.map((opt) => (
                        <option key={opt} value={opt}>
                          {t('common:technique.' + opt + '.label', {
                            defaultValue: TECHNIQUE_META[opt].label,
                          })}
                        </option>
                      ))}
                    </select>
                    {v.technique && (
                      <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                        {t(`audience.technique.${v.technique}`, {
                          ns: 'common',
                          defaultValue: TECHNIQUE_META[v.technique].hint,
                        })}
                      </p>
                    )}
                  </div>
                </Field>
              )}

              <Field label={t('fields.difficulty')}>
                <div
                  role="radiogroup"
                  className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-canvas-deep dark:bg-night-deep"
                  onKeyDown={(e) => {
                    const idx = DIFFICULTIES.indexOf(v.difficulty)
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      setValue('difficulty', DIFFICULTIES[(idx + 1) % DIFFICULTIES.length], {
                        shouldDirty: true,
                      })
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault()
                      setValue(
                        'difficulty',
                        DIFFICULTIES[(idx - 1 + DIFFICULTIES.length) % DIFFICULTIES.length],
                        { shouldDirty: true }
                      )
                    }
                  }}
                >
                  {DIFFICULTIES.map((d) => {
                    const active = v.difficulty === d
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => setValue('difficulty', d, { shouldDirty: true })}
                        className={cn(
                          'text-[0.78rem] font-medium px-2 py-1.5 rounded-lg capitalize motion-safe:transition ease-expo focus-volt',
                          active
                            ? 'bg-canvas dark:bg-night text-ink dark:text-bone shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.4)]'
                            : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone'
                        )}
                      >
                        {t('common:difficulty.' + d)}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t('fields.license')}>
                  <select {...register('license')} className={inputClass}>
                    {LICENSES.map((l) => (
                      <option key={l} value={l}>
                        {t('common:license.' + l, { defaultValue: l })}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t('fields.version')}
                  error={errors.version?.message as string | undefined}
                >
                  <input
                    type="text"
                    {...register('version')}
                    className={cn(inputClass, 'font-mono')}
                    placeholder="1.0.0"
                  />
                </Field>
              </div>
            </Tabs.Content>
          </Tabs.Root>

          <div className="flex justify-end items-center pt-2 border-t border-line dark:border-night-line">
            {qualityResult.complete < qualityResult.total && (
              <p className="mr-auto text-[0.76rem] text-coral-800 dark:text-coral-100">
                {t('quality.publishHint', {
                  remain: qualityResult.total - qualityResult.complete,
                  ready: qualityResult.complete,
                  total: qualityResult.total,
                })}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight overflow-hidden motion-safe:transition ease-expo focus-volt disabled:opacity-60"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform ease-expo motion-safe:duration-500 group-hover:translate-y-0"
              />
              <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors ease-expo">
                {busy && <Loader2 aria-hidden className="w-4 h-4 motion-safe:animate-spin" />}
                {busy ? t('submit.publishing') : t('submit.publish')}
              </span>
            </button>
          </div>
        </div>

        <div
          className={cn('h-fit space-y-4', isSidebarPreview ? 'lg:sticky lg:top-24' : 'lg:mt-0')}
        >
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
            <span aria-hidden className="w-5 h-px bg-volt-500" />
            {t('preview.eyebrow')}
          </p>
          <ListingQualityChecklist
            title={v.title}
            description={v.description}
            body={v.body}
            type={v.type as ListingType}
            tags={v.tags}
            models={v.modelsArr}
            version={v.version}
            onJumpToSection={jumpToSection}
          />
          <ListingCard listing={previewListing} />
          <div className="rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute mb-3">
              {t('preview.body')}
            </p>
            <div className="rounded-xl border border-line dark:border-night-line bg-canvas/60 dark:bg-night/60 p-4">
              <MarkdownView source={v.body || t('preview.bodyPlaceholder')} />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

const inputClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition ease-expo',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500'
)

function Field({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  // React 19 useId gives a stable, collision-free id pair so the visible label
  // is programmatically associated with its control. Native single controls
  // (input/select/textarea) get htmlFor -> id. Composite group controls (the
  // emoji/difficulty/technique wrappers and the ModelPicker wrapper) carry a
  // `role`, so they instead get aria-labelledby pointing at the label id.
  const fieldId = useId()
  const labelId = `${fieldId}-label`
  const errorId = `${fieldId}-error`
  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: (children.props as { id?: string }).id ?? fieldId,
        ...((children.props as { role?: string }).role ? { 'aria-labelledby': labelId } : {}),
        ...(error
          ? {
              'aria-invalid': true,
              'aria-describedby': errorId,
            }
          : {}),
      })
    : children
  return (
    <div>
      <label
        id={labelId}
        htmlFor={fieldId}
        className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5"
      >
        {label}
      </label>
      {child}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral"
        >
          {error}
        </p>
      )}
    </div>
  )
}

const TrendingCategoryHint = memo(function TrendingCategoryHint({
  current,
  onPick,
}: {
  current: string | undefined
  onPick: (c: string) => void
}) {
  const { t } = useTranslation('create')
  const { data } = useListings({ sort: 'trending', pageSize: 12 })
  const items = useMemo(() => data?.items ?? [], [data?.items])
  const top = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of items) {
      const c = l.category
      if (!c) continue
      counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([c]) => c)
  }, [items])
  if (top.length === 0) return null
  return (
    <div className="-mt-2 flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-volt-700 dark:text-volt-300 mr-1">
        {t('trending.label')}
      </span>
      {top.map((c) => {
        const active = current === c
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-[0.74rem] motion-safe:transition ease-expo focus-volt border',
              active
                ? 'bg-ink text-bone dark:bg-bone dark:text-ink border-ink dark:border-bone'
                : 'bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft border-line dark:border-night-line hover:border-volt-400 dark:hover:border-volt-500/60'
            )}
          >
            {t('home:categories.labels.' + c, { defaultValue: c })}
          </button>
        )
      })}
    </div>
  )
})

function PublishListingPreviewToast({
  listing,
  heading,
  actionLabel,
  priceLabel,
  typeLabel,
}: {
  listing: ListingCardType
  heading: string
  actionLabel: string
  priceLabel: string
  typeLabel: string
}) {
  const previewModels = listing.models ?? []
  const previewLabel =
    previewModels.length > 0
      ? `${previewModels
          .slice(0, 2)
          .map((m) => modelLabel(m))
          .join(', ')}${previewModels.length > 2 ? ` +${previewModels.length - 2}` : ''}`
      : listing.category

  return (
    <article className="w-[min(92vw,24rem)] max-h-[20rem] overflow-hidden rounded-xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub shadow-[0_16px_40px_-24px_oklch(0.16_0.03_290_/_0.45)]">
      <header className="px-3.5 py-2 border-b border-line dark:border-night-line flex items-center justify-between gap-2 text-[0.72rem]">
        <span className="font-medium text-ink dark:text-bone">{heading}</span>
        <span className="font-mono text-[0.66rem] text-ink-mute dark:text-bone-mute">
          {typeLabel}
        </span>
      </header>
      <div className="px-3.5 py-3 space-y-2">
        <p className="text-[0.94rem] leading-tight font-semibold text-ink dark:text-bone line-clamp-2">
          {listing.title}
        </p>
        <p className="text-[0.76rem] leading-relaxed text-ink-soft dark:text-bone-soft line-clamp-2">
          {listing.description}
        </p>
        <p className="text-[0.7rem] font-mono text-ink-mute dark:text-bone-mute">{previewLabel}</p>
      </div>
      <footer className="px-3.5 pb-3 pt-2 flex items-center justify-between gap-2 text-[0.74rem]">
        <span className="font-mono font-medium text-volt-700 dark:text-volt-300">{priceLabel}</span>
        <a
          href={`/listings/${listing.slug}`}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-volt-500 text-ink text-[0.72rem] font-medium motion-safe:transition ease-expo hover:bg-volt-400"
        >
          {actionLabel}
        </a>
      </footer>
    </article>
  )
}
