import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Tabs from '@radix-ui/react-tabs'
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
import { cn } from '@utils/cn'
import type { ListingCard as ListingCardType } from '@/types'

const QUICK_EMOJIS = ['✨', '🤖', '🧠', '🎨', '📝', '🚀', '⚡', '🛠️', '🧩', '🔌']
const TYPES = ListingTypeEnum.options
const TECHNIQUES = PromptTechniqueEnum.options
const DIFFICULTIES: Difficulty[] = DifficultyEnum.options
const LICENSES: License[] = LicenseEnum.options

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
type FormShape = z.infer<ReturnType<typeof buildFormSchema>>

export default function CreateListingPage() {
  const { t } = useTranslation('create')
  const navigate = useNavigate()
  const createMut = useCreateListing()
  const [tab, setTab] = useState<'basics' | 'content' | 'metadata'>('basics')

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

  // Draft is read once at mount and used as the form's defaultValues so
  // each input hydrates with the saved value. After mount the watch()
  // serialiser keeps localStorage in sync (debounced, see effect below).
  const DRAFT_KEY = 'pm.sellDraft'
  const initialDraft = (() => {
    if (typeof window === 'undefined') return DEFAULTS
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return DEFAULTS
      const parsed = JSON.parse(raw)
      return { ...DEFAULTS, ...parsed } as FormShape
    } catch {
      return DEFAULTS
    }
  })()
  const [draftHydrated] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!window.localStorage.getItem(DRAFT_KEY)
  })
  const [draftDismissed, setDraftDismissed] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    // Cast: zod's narrowed enum types end up wider than FormShape's because
    // omit() doesn't fully propagate optionality through the inferred shape.
    resolver: zodResolver(FormSchema) as unknown as import('react-hook-form').Resolver<FormShape>,
    defaultValues: initialDraft,
  })

  const v = watch()

  // Debounced autosave — write the current form snapshot to localStorage
  // 600ms after the visitor stops typing.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(v))
      } catch {
        /* quota — silently drop */
      }
    }, 600)
    return () => window.clearTimeout(id)
  }, [v])

  function discardDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    reset(DEFAULTS)
    setDraftDismissed(true)
  }

  // Auto-clear technique field whenever type leaves PROMPT.
  useEffect(() => {
    if (v.type !== 'PROMPT' && v.technique) {
      setValue('technique', null)
    }
  }, [v.type, v.technique, setValue])

  const onSubmit = handleSubmit(async (values) => {
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
      // Should rarely happen since the form schema mirrors the canonical one.
      return
    }

    try {
      const res = await createMut.mutateAsync(result.data)
      try {
        window.localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* ignore */
      }
      navigate(`/listings/${res.listing.slug}`)
    } catch {
      /* toast handled in hook */
    }
  })

  const busy = isSubmitting || createMut.isPending

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
      author: { id: 'you', username: 'you' },
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
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('header.title')}
        </h1>
        <p className="text-ink-soft dark:text-bone-soft max-w-[58ch]">{t('header.subtitle')}</p>
      </header>

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
          <button
            type="button"
            onClick={discardDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone text-[0.78rem] font-medium hover:border-ink dark:hover:border-bone hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition focus-volt"
          >
            {t('draft.restart')}
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-7">
        <div className="rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 space-y-5">
          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <Tabs.List className="flex gap-1 mb-5 border-b border-line dark:border-night-line">
              {(['basics', 'content', 'metadata'] as const).map((key) => (
                <Tabs.Trigger
                  key={key}
                  value={key}
                  className={cn(
                    'px-4 py-2 -mb-px text-sm font-medium border-b-2 motion-safe:transition focus-volt',
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
                        {LISTING_TYPE_META[opt].emoji} {LISTING_TYPE_META[opt].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('fields.category')}>
                  <select {...register('category')} className={inputClass}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <TrendingCategoryHint
                current={v.category}
                onPick={(c) => setValue('category', c as typeof v.category, { shouldDirty: true })}
              />

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
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    maxLength={4}
                    {...register('coverEmoji')}
                    className="w-16 text-center rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-2 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500 motion-safe:transition"
                  />
                  <div className="flex flex-wrap gap-1">
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setValue('coverEmoji', e, { shouldDirty: true })}
                        className={cn(
                          'w-8 h-8 rounded-lg border text-lg motion-safe:transition focus-volt',
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
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('priceDollars')}
                  className={inputClass}
                />
                <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                  {t('fields.priceHint')}
                </p>
              </Field>
            </Tabs.Content>

            <Tabs.Content value="metadata" className="space-y-4 focus-visible:outline-none">
              <Field label={t('fields.tags')}>
                <input
                  type="text"
                  {...register('tags')}
                  placeholder={t('fields.tagsPlaceholder')}
                  className={inputClass}
                />
                <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                  {t('fields.tagsHint')}
                </p>
              </Field>

              <Field
                label={t('fields.models')}
                error={errors.modelsArr?.message as string | undefined}
              >
                <ModelPicker
                  value={v.modelsArr ?? []}
                  onChange={(next) => setValue('modelsArr', next, { shouldDirty: true })}
                />
              </Field>

              {v.type === 'PROMPT' && (
                <Field label={t('fields.technique')}>
                  <select
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
                        {TECHNIQUE_META[opt].label}
                      </option>
                    ))}
                  </select>
                  {v.technique && (
                    <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                      {TECHNIQUE_META[v.technique].hint}
                    </p>
                  )}
                </Field>
              )}

              <Field label={t('fields.difficulty')}>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-canvas-deep dark:bg-night-deep">
                  {DIFFICULTIES.map((d) => {
                    const active = v.difficulty === d
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setValue('difficulty', d, { shouldDirty: true })}
                        className={cn(
                          'text-[0.78rem] font-medium px-2 py-1.5 rounded-lg capitalize motion-safe:transition focus-volt',
                          active
                            ? 'bg-canvas dark:bg-night text-ink dark:text-bone shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.4)]'
                            : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone'
                        )}
                      >
                        {d}
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
                        {l}
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

          <div className="flex justify-end pt-2 border-t border-line dark:border-night-line">
            <button
              type="submit"
              disabled={busy}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight overflow-hidden motion-safe:transition focus-volt disabled:opacity-60"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
              <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors">
                {busy && <Loader2 className="w-4 h-4 motion-safe:animate-spin" />}
                {busy ? t('submit.publishing') : t('submit.publish')}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
            <span aria-hidden className="w-5 h-px bg-volt-500" />
            {t('preview.eyebrow')}
          </p>
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
  'motion-safe:transition',
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
  return (
    <div>
      <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">{error}</p>}
    </div>
  )
}

function TrendingCategoryHint({
  current,
  onPick,
}: {
  current: string | undefined
  onPick: (c: string) => void
}) {
  const { t } = useTranslation('create')
  const { data } = useListings({ sort: 'trending', pageSize: 24 })
  const items = data?.items ?? []
  const counts = new Map<string, number>()
  for (const l of items) {
    const c = l.category
    if (!c) continue
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([c]) => c)
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
              'inline-flex items-center px-2.5 py-1 rounded-full text-[0.74rem] motion-safe:transition focus-volt border',
              active
                ? 'bg-ink text-bone dark:bg-bone dark:text-ink border-ink dark:border-bone'
                : 'bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft border-line dark:border-night-line hover:border-volt-400 dark:hover:border-volt-500/60'
            )}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}
