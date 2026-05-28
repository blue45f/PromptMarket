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
import { useCreateListing } from '@features/marketplace/queries';
import { usePageMeta } from '@hooks/usePageMeta';
import MarkdownView from '@components/MarkdownView';
import ModelPicker from '@components/ModelPicker';
import ListingCard from '@components/ListingCard';
import { cn } from '@utils/cn';
import type { ListingCard as ListingCardType } from '@/types';

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

  usePageMeta({
    title: '리스팅 게시 · PromptMarket',
    description: '프롬프트, 스킬, MCP 서버, 서브에이전트, 룰 파일을 카탈로그에 게시하세요.',
  });

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
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="mb-9 space-y-2">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          새 리스팅
        </p>
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          드롭 게시하기
        </h1>
        <p className="text-ink-soft dark:text-bone-soft max-w-[58ch]">
          프롬프트, 스킬, MCP 서버, 서브에이전트, 룰 파일을 카탈로그에 올리세요. 입력하는 동안 오른쪽 미리보기가 함께 갱신됩니다.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-7"
      >
        <div className="rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 space-y-5">
          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <Tabs.List className="flex gap-1 mb-5 border-b border-line dark:border-night-line">
              {(
                [
                  ['basics', '기본'],
                  ['content', '본문'],
                  ['metadata', '메타데이터'],
                ] as const
              ).map(([key, label]) => (
                <Tabs.Trigger
                  key={key}
                  value={key}
                  className={cn(
                    'px-4 py-2 -mb-px text-sm font-medium border-b-2 motion-safe:transition focus-volt',
                    'border-transparent text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                    'data-[state=active]:border-volt-500 data-[state=active]:text-ink',
                    'dark:data-[state=active]:border-volt-400 dark:data-[state=active]:text-bone',
                  )}
                >
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="basics" className="space-y-4 focus-visible:outline-none">
              <Field
                label="제목"
                error={errors.title?.message as string | undefined}
              >
                <input
                  type="text"
                  {...register('title')}
                  className={inputClass}
                  placeholder="SaaS 랜딩 페이지를 위한 살벌한 프롬프트"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="타입">
                  <select {...register('type')} className={inputClass}>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {LISTING_TYPE_META[t].emoji} {LISTING_TYPE_META[t].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="카테고리">
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
                label="설명"
                error={errors.description?.message as string | undefined}
              >
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="카드에 보여줄 짧은 한 줄 소개."
                  className={inputClass}
                />
              </Field>

              <Field label="커버 이모지">
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
                            : 'border-line dark:border-night-line hover:bg-canvas-deep dark:hover:bg-night-deep',
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
                label="본문 (Markdown)"
                error={errors.body?.message as string | undefined}
              >
                <textarea
                  rows={16}
                  {...register('body')}
                  placeholder={'# 내 프롬프트\n\nYou are a helpful assistant…'}
                  className={cn(inputClass, 'font-mono text-xs leading-relaxed')}
                />
              </Field>

              <Field label="가격 (USD)">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('priceDollars')}
                  className={inputClass}
                />
                <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                  무료로 공개하려면 0을 입력하세요.
                </p>
              </Field>
            </Tabs.Content>

            <Tabs.Content value="metadata" className="space-y-4 focus-visible:outline-none">
              <Field label="태그">
                <input
                  type="text"
                  {...register('tags')}
                  placeholder="saas, copywriting, gpt"
                  className={inputClass}
                />
                <p className="mt-1 text-[0.78rem] text-ink-mute dark:text-bone-mute">
                  쉼표로 구분합니다.
                </p>
              </Field>

              <Field
                label="모델"
                error={errors.modelsArr?.message as string | undefined}
              >
                <ModelPicker
                  value={v.modelsArr ?? []}
                  onChange={(next) => setValue('modelsArr', next, { shouldDirty: true })}
                />
              </Field>

              {v.type === 'PROMPT' && (
                <Field label="프롬프트 기법">
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
                    <option value="">— 기법 선택 (선택사항) —</option>
                    {TECHNIQUES.map((t) => (
                      <option key={t} value={t}>
                        {TECHNIQUE_META[t].label}
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

              <Field label="난이도">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-canvas-deep dark:bg-night-deep">
                  {DIFFICULTIES.map((d) => {
                    const active = v.difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setValue('difficulty', d, { shouldDirty: true })}
                        className={cn(
                          'text-[0.78rem] font-medium px-2 py-1.5 rounded-lg capitalize motion-safe:transition focus-volt',
                          active
                            ? 'bg-canvas dark:bg-night text-ink dark:text-bone shadow-[0_8px_24px_-12px_oklch(0.16_0.03_290_/_0.4)]'
                            : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="라이선스">
                  <select {...register('license')} className={inputClass}>
                    {LICENSES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="버전 (semver)"
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
                {busy ? '게시 중…' : '리스팅 게시'}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
            <span aria-hidden className="w-5 h-px bg-volt-500" />
            라이브 미리보기
          </p>
          <ListingCard listing={previewListing} />
          <div className="rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute mb-3">
              본문
            </p>
            <div className="rounded-xl border border-line dark:border-night-line bg-canvas/60 dark:bg-night/60 p-4">
              <MarkdownView source={v.body || '*입력하면 여기에 본문 미리보기가 보여요…*'} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500',
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
      <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">{error}</p>}
    </div>
  );
}
