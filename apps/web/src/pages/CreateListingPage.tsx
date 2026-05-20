import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Tabs from '@radix-ui/react-tabs';
import { z } from 'zod';
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
} from '@promptmarket/shared';
import { Loader2 } from 'lucide-react';
import { useCreateListing } from '../lib/queries';
import MarkdownView from '../components/MarkdownView';
import ModelPicker from '../components/ModelPicker';
import ListingCard from '../components/ListingCard';
import { cn } from '../lib/cn';
import type { ListingCard as ListingCardType } from '../lib/types';

const QUICK_EMOJIS = ['✨', '🤖', '🧠', '🎨', '📝', '🚀', '⚡', '🛠️', '🧩', '🔌'];
const TYPES = ListingTypeEnum.options;
const TECHNIQUES = PromptTechniqueEnum.options;
const DIFFICULTIES: Difficulty[] = DifficultyEnum.options;
const LICENSES: License[] = LicenseEnum.options;

// Form-only schema: omits priceCents (we accept a dollar string from the user
// and convert it inside onSubmit) and replaces `models` with an array we
// manage with the ModelPicker.
const FormSchema = CreateListingSchema.omit({
  priceCents: true,
  models: true,
}).extend({
  priceDollars: z
    .string()
    .refine((v) => Number.isFinite(Number.parseFloat(v)), 'Enter a valid price'),
  modelsArr: z.array(z.string()).min(1, 'Select at least one model'),
});
type FormShape = z.infer<typeof FormSchema>;

export default function CreateListingPage() {
  const navigate = useNavigate();
  const createMut = useCreateListing();
  const [tab, setTab] = useState<'basics' | 'content' | 'metadata'>('basics');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
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
    },
  });

  const v = watch();

  // Auto-clear technique field whenever type leaves PROMPT.
  useEffect(() => {
    if (v.type !== 'PROMPT' && v.technique) {
      setValue('technique', null);
    }
  }, [v.type, v.technique, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = Number.parseFloat(values.priceDollars);
    const priceCents = Number.isFinite(parsed)
      ? Math.round(Math.max(0, parsed) * 100)
      : 0;

    const payload: CreateListingInput = {
      title: values.title.trim(),
      type: values.type,
      description: values.description.trim(),
      body: values.body,
      category: values.category,
      tags: (values.tags ?? '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
        .join(','),
      models: values.modelsArr,
      technique: values.type === 'PROMPT' ? values.technique ?? null : null,
      difficulty: values.difficulty,
      license: values.license,
      version: values.version,
      priceCents,
      coverEmoji: values.coverEmoji || '✨',
    };

    const result = CreateListingSchema.safeParse(payload);
    if (!result.success) {
      // Should rarely happen since the form schema mirrors the canonical one.
      return;
    }

    try {
      const res = await createMut.mutateAsync(result.data);
      navigate(`/listings/${res.listing.slug}`);
    } catch {
      /* toast handled in hook */
    }
  });

  const busy = isSubmitting || createMut.isPending;

  // Build a preview-shaped listing object reused in the live card.
  const previewListing = useMemo<ListingCardType>(
    () => ({
      id: 'preview',
      slug: 'preview',
      title: v.title?.trim() || 'Your listing title',
      type: v.type as ListingType,
      description: v.description?.trim() || 'Your description will appear here.',
      category: v.category,
      tags: (v.tags ?? '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean),
      models: v.modelsArr ?? [],
      technique: (v.technique ?? null) as PromptTechnique | null,
      difficulty: v.difficulty as Difficulty,
      license: v.license as License,
      version: v.version,
      priceCents: Math.round(
        Math.max(0, Number.parseFloat(v.priceDollars ?? '0') || 0) * 100,
      ),
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
    ],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          Create listing
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Publish a prompt, skill, MCP server, sub-agent, or rules file.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-5">
          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <Tabs.List className="flex gap-1 mb-5 border-b border-gray-200 dark:border-zinc-800">
              {(
                [
                  ['basics', 'Basics'],
                  ['content', 'Content'],
                  ['metadata', 'Metadata'],
                ] as const
              ).map(([key, label]) => (
                <Tabs.Trigger
                  key={key}
                  value={key}
                  className={cn(
                    'px-4 py-2 -mb-px text-sm font-medium border-b-2 motion-safe:transition',
                    'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200',
                    'data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700',
                    'dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-300',
                  )}
                >
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="basics" className="space-y-4 focus-visible:outline-none">
              <Field
                label="Title"
                error={errors.title?.message as string | undefined}
              >
                <input
                  type="text"
                  {...register('title')}
                  className={inputClass}
                  placeholder="Killer SaaS landing-page prompt"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <select {...register('type')} className={inputClass}>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {LISTING_TYPE_META[t].emoji} {LISTING_TYPE_META[t].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Category">
                  <select {...register('category')} className={inputClass}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="Description"
                error={errors.description?.message as string | undefined}
              >
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="A short pitch to show on the listing card."
                  className={inputClass}
                />
              </Field>

              <Field label="Cover emoji">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    maxLength={4}
                    {...register('coverEmoji')}
                    className="w-16 text-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1">
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setValue('coverEmoji', e, { shouldDirty: true })}
                        className={cn(
                          'w-8 h-8 rounded-md border text-lg motion-safe:transition',
                          v.coverEmoji === e
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-400'
                            : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800',
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
              <Field
                label="Body (Markdown)"
                error={errors.body?.message as string | undefined}
              >
                <textarea
                  rows={16}
                  {...register('body')}
                  placeholder={'# My prompt\n\nYou are a helpful assistant…'}
                  className={cn(inputClass, 'font-mono text-xs leading-relaxed')}
                />
              </Field>

              <Field label="Price (USD)">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('priceDollars')}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                  Set 0 to publish for free.
                </p>
              </Field>
            </Tabs.Content>

            <Tabs.Content value="metadata" className="space-y-4 focus-visible:outline-none">
              <Field label="Tags">
                <input
                  type="text"
                  {...register('tags')}
                  placeholder="saas, copywriting, gpt"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                  Comma-separated.
                </p>
              </Field>

              <Field
                label="Models"
                error={errors.modelsArr?.message as string | undefined}
              >
                <ModelPicker
                  value={v.modelsArr ?? []}
                  onChange={(next) => setValue('modelsArr', next, { shouldDirty: true })}
                />
              </Field>

              {v.type === 'PROMPT' && (
                <Field label="Prompt technique">
                  <select
                    value={v.technique ?? ''}
                    onChange={(e) =>
                      setValue(
                        'technique',
                        (e.target.value || null) as PromptTechnique | null,
                        { shouldDirty: true },
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">— Choose technique (optional) —</option>
                    {TECHNIQUES.map((t) => (
                      <option key={t} value={t}>
                        {TECHNIQUE_META[t].label}
                      </option>
                    ))}
                  </select>
                  {v.technique && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                      {TECHNIQUE_META[v.technique].hint}
                    </p>
                  )}
                </Field>
              )}

              <Field label="Difficulty">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800">
                  {DIFFICULTIES.map((d) => {
                    const active = v.difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setValue('difficulty', d, { shouldDirty: true })}
                        className={cn(
                          'text-xs font-medium px-2 py-1.5 rounded-md capitalize motion-safe:transition',
                          active
                            ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'text-gray-600 dark:text-zinc-400',
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="License">
                  <select {...register('license')} className={inputClass}>
                    {LICENSES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Version (semver)"
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

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 motion-safe:transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 motion-safe:animate-spin" />}
              {busy ? 'Publishing…' : 'Publish listing'}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold">
            Live preview
          </p>
          <ListingCard listing={previewListing} />
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold mb-2">
              Body
            </p>
            <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 p-4">
              <MarkdownView source={v.body || '*Body preview will appear here…*'} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputClass = cn(
  'w-full rounded-lg px-3 py-2 text-sm',
  'border border-gray-200 dark:border-zinc-700',
  'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100',
  'placeholder:text-gray-400 dark:placeholder:text-zinc-500',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
);

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
