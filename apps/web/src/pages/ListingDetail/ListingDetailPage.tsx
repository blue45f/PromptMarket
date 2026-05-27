import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Tabs from '@radix-ui/react-tabs';
import {
  CreateReviewSchema,
  typeGradient,
  type CreateReviewInput,
  type Difficulty,
  type License,
  type ListingType,
  type PromptTechnique,
} from '@promptmarket/shared';
import { Check, Copy, Download, Loader2, ShoppingCart } from 'lucide-react';
import { useListing, usePurchase, useCreateReview } from '@features/marketplace/queries';
import { getErrorMessage } from '@services/api';
import { formatDate, formatPrice } from '@utils/format';
import TypeBadge from '@components/TypeBadge';
import ModelBadge from '@components/ModelBadge';
import TechniqueBadge from '@components/TechniqueBadge';
import DifficultyBadge from '@components/DifficultyBadge';
import LicenseBadge from '@components/LicenseBadge';
import StarRating from '@components/StarRating';
import MarkdownView from '@components/MarkdownView';
import SkeletonDetail from '@components/SkeletonDetail';
import RelatedListings from '@components/RelatedListings';
import RecentlyViewed from '@components/RecentlyViewed';
import InstallPanel from '@components/InstallPanel';
import AudienceMatch from '@components/AudienceMatch';
import { useRecentlyViewed } from '@hooks/useRecentlyViewed';
import { usePageMeta } from '@hooks/usePageMeta';
import { useAuthStore } from '@store/auth';
import { cn } from '@utils/cn';

interface ListingViewModel {
  id: string;
  slug: string;
  title: string;
  type: ListingType;
  description: string;
  category: string;
  tags?: string[];
  models?: string[];
  technique?: PromptTechnique | null;
  difficulty?: Difficulty;
  license?: License;
  version?: string;
  priceCents: number;
  coverEmoji?: string | null;
  downloads?: number;
  author: { id: string; username: string };
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
  body?: string | null;
  previewBody?: string;
}

export default function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { data, isPending, error } = useListing(slug);

  // The API returns the detail response with a flat shape OR nested under
  // `listing` depending on serialisation. Normalise both into a uniform view.
  type AnyShape = Record<string, unknown> & {
    listing?: Record<string, unknown>;
  };
  const raw = data as AnyShape | undefined;
  const listing = (raw?.listing ?? raw) as ListingViewModel | undefined;

  const reviews = (raw?.reviews as
    | Array<{
        id: string;
        rating: number;
        comment?: string | null;
        createdAt: string;
        author?: { id: string; username: string };
        user?: { id: string; username: string };
      }>
    | undefined) ?? [];
  const isOwner = !!raw?.isOwner;
  const isPurchased = !!raw?.isPurchased;
  const canViewBody = !!raw?.canViewBody;

  const purchaseMut = usePurchase(listing?.id, slug);
  const reviewMut = useCreateReview(listing?.id, slug);

  const [copied, setCopied] = useState(false);

  // Track this slug as recently viewed once the detail successfully loads.
  const { track } = useRecentlyViewed();
  useEffect(() => {
    if (listing?.slug) track(listing.slug);
  }, [listing?.slug, track]);

  // Reflect the listing in the document title and OG/Twitter meta so links
  // shared into Slack / iMessage / Twitter get a proper card.
  usePageMeta({
    title: listing
      ? `${listing.title} · PromptMarket`
      : 'PromptMarket',
    description: listing?.description,
    ogType: 'product',
    canonical:
      typeof window !== 'undefined' && listing?.slug
        ? `${window.location.origin}/listings/${listing.slug}`
        : undefined,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(CreateReviewSchema),
    defaultValues: { rating: 5, comment: '' },
  });
  const rating = watch('rating');

  async function handlePurchase() {
    if (!listing) return;
    if (!token) {
      navigate('/login', { state: { from: `/listings/${listing.slug}` } });
      return;
    }
    try {
      await purchaseMut.mutateAsync();
    } catch {
      /* toast handled in hook */
    }
  }

  async function handleCopy() {
    if (!listing?.body) return;
    try {
      await navigator.clipboard.writeText(listing.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function handleDownload() {
    if (!listing?.body) return;
    const blob = new Blob([listing.body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${listing.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const onSubmitReview = handleSubmit(async (values) => {
    try {
      await reviewMut.mutateAsync({
        rating: values.rating,
        comment: values.comment?.trim() || undefined,
      });
      reset({ rating: 5, comment: '' });
    } catch {
      /* toast handled in hook */
    }
  });

  if (isPending) {
    return <SkeletonDetail />;
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-rose-600 dark:text-rose-400">
          {error ? getErrorMessage(error) : 'Listing not found.'}
        </p>
        <Link
          to="/browse"
          className="mt-4 inline-block text-indigo-700 dark:text-indigo-400 underline"
        >
          Back to browse
        </Link>
      </div>
    );
  }

  const ownReview = reviews.find((r) => {
    const author = r.user ?? r.author;
    return user && author?.id === user.id;
  });
  const free = (listing.priceCents ?? 0) === 0;
  const buying = purchaseMut.isPending;
  const reviewSubmitting = isSubmitting || reviewMut.isPending;
  const models = listing.models ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 min-w-0 space-y-6">
          {/* Hero cover */}
          <div
            className={cn(
              'aspect-[16/9] rounded-2xl bg-gradient-to-br relative overflow-hidden flex items-center justify-center',
              typeGradient(listing.type),
            )}
          >
            <span className="text-8xl drop-shadow-lg" aria-hidden>
              {listing.coverEmoji || '✨'}
            </span>
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <TypeBadge type={listing.type} overlay />
              <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-white/80 dark:bg-zinc-900/70 backdrop-blur ring-1 ring-white/40 dark:ring-zinc-700/60 text-gray-900 dark:text-zinc-100">
                in {listing.category}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              {listing.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
              by{' '}
              <Link
                to={`/users/${listing.author.username}`}
                className="text-indigo-700 dark:text-indigo-400 hover:underline font-medium"
              >
                @{listing.author.username}
              </Link>{' '}
              · {formatDate(listing.createdAt)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <StarRating
                value={listing.avgRating ?? 0}
                count={listing.reviewCount}
                showLabel
              />
              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-zinc-400">
                <Download className="w-3.5 h-3.5" />
                {listing.downloads ?? 0} downloads
              </span>
            </div>
            {listing.tags && listing.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {listing.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Tabs.Root defaultValue="overview" className="w-full">
            <Tabs.List
              aria-label="Listing sections"
              className="flex gap-1 border-b border-gray-200 dark:border-zinc-800"
            >
              {(
                [
                  ['overview', 'Overview'],
                  ['reviews', `Reviews (${reviews.length})`],
                  ['related', 'Related'],
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

            <Tabs.Content
              value="overview"
              className="pt-6 focus-visible:outline-none"
            >
              <AudienceMatch
                type={listing.type}
                category={listing.category}
                difficulty={listing.difficulty}
                technique={listing.technique ?? null}
                models={listing.models}
                className="mb-6"
              />
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8">
                <p className="text-base text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                    {canViewBody ? 'Content' : 'Preview'}
                  </h2>
                  {canViewBody && listing.body && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 motion-safe:transition"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className={copied ? 'text-emerald-500' : ''}>
                          {copied ? 'Copied!' : 'Copy'}
                        </span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 motion-safe:transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download .md
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {canViewBody && listing.body ? (
                    <MarkdownView source={listing.body} />
                  ) : (
                    <div className="relative">
                      <MarkdownView
                        source={listing.previewBody || '*No preview available.*'}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
                      <div className="mt-6 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 p-6 text-center">
                        <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium">
                          🔒 Unlock the full content
                        </p>
                        <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
                          {free
                            ? 'Get this listing for free to view the full content.'
                            : `Purchase for ${formatPrice(listing.priceCents)} to view the full content.`}
                        </p>
                        <button
                          onClick={handlePurchase}
                          disabled={buying}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 motion-safe:transition active:scale-[0.98] disabled:opacity-60"
                        >
                          {buying ? (
                            <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
                          )}
                          {buying ? 'Processing…' : free ? 'Get free' : 'Buy to unlock'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content
              value="reviews"
              className="pt-6 focus-visible:outline-none"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8">
                {isPurchased && !ownReview && (
                  <form
                    onSubmit={onSubmitReview}
                    className="mb-6 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-gray-50/60 dark:bg-zinc-950/40"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">
                      Leave a review
                    </p>
                    <StarRating
                      value={rating}
                      onChange={(v) => setValue('rating', v, { shouldDirty: true })}
                      size="lg"
                    />
                    {errors.rating && (
                      <p className="mt-1 text-xs text-rose-600">{errors.rating.message}</p>
                    )}
                    <textarea
                      {...register('comment')}
                      placeholder="What did you think? (optional)"
                      rows={3}
                      className="mt-3 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.comment && (
                      <p className="mt-1 text-xs text-rose-600">{errors.comment.message}</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 motion-safe:transition active:scale-[0.98] disabled:opacity-60"
                      >
                        {reviewSubmitting && (
                          <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                        )}
                        {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                      </button>
                    </div>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    No reviews yet. Be the first!
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {reviews.map((r) => {
                      const author = r.user ?? r.author;
                      return (
                        <li
                          key={r.id}
                          className="border-b border-gray-100 dark:border-zinc-800 last:border-0 pb-4 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StarRating value={r.rating} />
                              <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                                @{author?.username ?? 'anonymous'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-zinc-400">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                          {r.comment && (
                            <p className="mt-2 text-sm text-gray-700 dark:text-zinc-300">
                              {r.comment}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content
              value="related"
              className="pt-6 focus-visible:outline-none"
            >
              <RelatedListings listingId={listing.id} />
            </Tabs.Content>
          </Tabs.Root>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-zinc-400">
              {free ? 'Free' : 'Price'}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-zinc-50">
              {formatPrice(listing.priceCents)}
            </p>

            <div className="mt-5 space-y-2">
              {isOwner ? (
                <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                  You own this listing
                </span>
              ) : isPurchased ? (
                <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800 font-semibold">
                  Owned ✓
                </span>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={buying}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 motion-safe:transition active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
                >
                  {buying ? (
                    <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {buying
                    ? 'Processing…'
                    : free
                      ? 'Get for free'
                      : `Buy for ${formatPrice(listing.priceCents)}`}
                </button>
              )}
              <InstallPanel slug={listing.slug} type={listing.type} className="mt-2" />
              {(isPurchased || isOwner) && listing.body && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 motion-safe:transition"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className={copied ? 'text-emerald-500' : ''}>
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 motion-safe:transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-lg font-bold text-white"
                aria-hidden
              >
                {listing.author.username[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                  @{listing.author.username}
                </p>
                <Link
                  to={`/users/${listing.author.username}`}
                  className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline"
                >
                  View profile
                </Link>
              </div>
              <button
                type="button"
                className="text-sm font-medium px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-indigo-300 motion-safe:transition"
                onClick={() => {
                  /* follow is a no-op for now per spec */
                }}
              >
                Follow
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4 text-sm">
            <Meta label="Type">
              <TypeBadge type={listing.type} />
            </Meta>
            {models.length > 0 && (
              <Meta label="Models">
                <div className="flex flex-wrap gap-1">
                  {models.map((m) => (
                    <ModelBadge key={m} slug={m} />
                  ))}
                </div>
              </Meta>
            )}
            {listing.type === 'PROMPT' && listing.technique && (
              <Meta label="Technique">
                <TechniqueBadge technique={listing.technique} />
              </Meta>
            )}
            {listing.difficulty && (
              <Meta label="Difficulty">
                <DifficultyBadge difficulty={listing.difficulty} />
              </Meta>
            )}
            {listing.license && (
              <Meta label="License">
                <LicenseBadge license={listing.license} />
              </Meta>
            )}
            {listing.version && (
              <Meta label="Version">
                <span className="font-mono text-xs text-gray-700 dark:text-zinc-200">
                  v{listing.version}
                </span>
              </Meta>
            )}
            <Meta label="Updated">
              <span className="text-xs text-gray-600 dark:text-zinc-400">
                {formatDate(listing.updatedAt ?? listing.createdAt)}
              </span>
            </Meta>
          </div>
        </aside>
      </div>

      {/* Bottom related */}
      <section className="mt-16">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-1">
          You might also like
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
          Hand-picked recommendations from the marketplace.
        </p>
        <RelatedListings listingId={listing.id} />
      </section>

      <RecentlyViewed excludeSlug={listing.slug} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12" />
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-zinc-400 pt-0.5">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  );
}
