import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CATEGORIES,
  CreateListingSchema,
  ListingType as ListingTypeEnum,
  type CreateListingInput,
  typeLabel,
} from '@promptmarket/shared';
import { Loader2 } from 'lucide-react';
import { useCreateListing } from '../lib/queries';
import MarkdownView from '../components/MarkdownView';

const QUICK_EMOJIS = ['✨', '🤖', '🧠', '🎨', '📝', '🚀'];
const TYPES = ListingTypeEnum.options;

// Form-only schema: omits priceCents (we accept a dollar string from the user
// and convert it inside onSubmit before handing off to the canonical schema).
const FormSchema = CreateListingSchema.omit({ priceCents: true }).extend({
  priceDollars: z
    .string()
    .refine((v) => Number.isFinite(Number.parseFloat(v)), 'Enter a valid price'),
});
type FormShape = z.infer<typeof FormSchema>;

export default function CreateListingPage() {
  const navigate = useNavigate();
  const createMut = useCreateListing();
  const [previewBody, setPreviewBody] = useState('');

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
      model: '',
      coverEmoji: '✨',
      priceDollars: '0',
    },
  });

  const title = watch('title');
  const description = watch('description');
  const coverEmoji = watch('coverEmoji');
  const body = watch('body');

  // Keep preview live without re-rendering every keypress at full force.
  if (body !== previewBody) setPreviewBody(body ?? '');

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
        .map((t) => t.trim())
        .filter(Boolean)
        .join(','),
      model: values.model?.trim() || null,
      priceCents,
      coverEmoji: values.coverEmoji || '✨',
    };

    // Validate the final payload against the canonical schema.
    const result = CreateListingSchema.safeParse(payload);
    if (!result.success) {
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create listing</h1>
        <p className="text-sm text-gray-500">Publish a prompt, CLAUDE.md, or agent.md file.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              {...register('title')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Killer SaaS landing page prompt"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                {...register('type')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {typeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags <span className="text-xs text-gray-400">(comma-separated)</span>
              </label>
              <input
                type="text"
                {...register('tags')}
                placeholder="saas, copywriting, gpt"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                {...register('model')}
                placeholder="claude-opus-4 / gpt-4o"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                {...register('priceDollars')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">Set 0 to publish for free.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover emoji</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  {...register('coverEmoji')}
                  className="w-16 text-center rounded-lg border border-gray-200 px-2 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex gap-1">
                  {QUICK_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setValue('coverEmoji', e, { shouldDirty: true })}
                      className={`w-8 h-8 rounded-md border text-lg transition ${
                        coverEmoji === e
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="A short pitch to show on the listing card."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body <span className="text-xs text-gray-400">(Markdown)</span>
            </label>
            <textarea
              rows={14}
              {...register('body')}
              placeholder={'# My prompt\n\nYou are a helpful assistant…'}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.body && (
              <p className="mt-1 text-xs text-red-600">{errors.body.message as string}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? 'Publishing…' : 'Publish listing'}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-20 h-fit">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-brand-50 to-white h-32 flex items-center justify-center text-5xl">
              {coverEmoji || '✨'}
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
                Live preview
              </p>
              <h3 className="font-semibold text-gray-900">{title || 'Untitled listing'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {description || 'Your description will appear here.'}
              </p>
            </div>
            <div className="px-5 pb-5">
              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <MarkdownView source={previewBody || '*Body preview will appear here…*'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
