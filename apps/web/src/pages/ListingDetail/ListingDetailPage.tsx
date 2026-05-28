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
        <p className="text-coral-deep dark:text-coral">
          {error ? getErrorMessage(error) : 'Listing not found.'}
        </p>
        <Link
          to="/browse"
          className="mt-4 inline-block text-volt-700 dark:text-volt-300 underline"
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
              <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-canvas/80 dark:bg-night/70 backdrop-blur ring-1 ring-line/60 dark:ring-night-line/60 text-ink dark:text-bone">
                in {listing.category}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-bone">
              {listing.title}
            </h1>
            <p className="mt-2 text-sm text-ink-mute dark:text-bone-mute">
              by{' '}
              <Link
                to={`/users/${listing.author.username}`}
                className="text-volt-700 dark:text-volt-300 hover:underline font-medium"
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
              <span className="inline-flex items-center gap-1 text-ink-mute dark:text-bone-mute">
                <Download className="w-3.5 h-3.5" />
                {listing.downloads ?? 0} downloads
              </span>
            </div>
            {listing.tags && listing.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {listing.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft"
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
              className="flex gap-1 border-b border-line dark:border-night-line"
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
                    'border-transparent text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                    'data-[state=active]:border-volt-500 data-[state=active]:text-ink',
                    'dark:data-[state=active]:border-volt-400 dark:data-[state=active]:text-bone',
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
              <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6 sm:p-8">
                <p className="text-base text-ink-soft dark:text-bone-soft whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight text-ink dark:text-bone">
                    {canViewBody ? 'Content' : 'Preview'}
                  </h2>
                  {canViewBody && listing.body && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-volt-700 dark:text-volt-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className={copied ? 'text-volt-700 dark:text-volt-300' : ''}>
                          {copied ? 'Copied!' : 'Copy'}
                        </span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition"
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
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas-sub dark:from-night-sub to-transparent" />
                      <div className="mt-6 rounded-xl border border-dashed border-volt-400/60 dark:border-volt-500/40 bg-volt-100/60 dark:bg-volt-900/30 p-6 text-center">
                        <p className="text-sm text-ink dark:text-bone font-medium">
                          🔒 전체 본문 잠금 해제
                        </p>
                        <p className="mt-1 text-xs text-ink-soft dark:text-bone-soft">
                          {free
                            ? '무료로 받아 전체 본문을 확인하세요.'
                            : `${formatPrice(listing.priceCents)}에 구매하면 전체 본문이 보여요.`}
                        </p>
                        <button
                          onClick={handlePurchase}
                          disabled={buying}
                          className="mt-3 group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-sm font-semibold motion-safe:transition active:scale-[0.98] disabled:opacity-60 focus-volt lift-on-hover"
                        >
                          {buying ? (
                            <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
                          )}
                          {buying ? '처리 중…' : free ? '무료로 받기' : '구매해서 보기'}
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
              <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6 sm:p-8">
                {isPurchased && !ownReview && (
                  <form
                    onSubmit={onSubmitReview}
                    className="mb-6 rounded-xl border border-line dark:border-night-line p-4 bg-canvas-deep/60 dark:bg-night-deep/40"
                  >
                    <p className="text-sm font-medium text-ink dark:text-bone mb-2">
                      Leave a review
                    </p>
                    <StarRating
                      value={rating}
                      onChange={(v) => setValue('rating', v, { shouldDirty: true })}
                      size="lg"
                    />
                    {errors.rating && (
                      <p className="mt-1 text-xs text-coral-deep dark:text-coral">{errors.rating.message}</p>
                    )}
                    <textarea
                      {...register('comment')}
                      placeholder="What did you think? (optional)"
                      rows={3}
                      className="mt-3 w-full rounded-lg border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500"
                    />
                    {errors.comment && (
                      <p className="mt-1 text-xs text-coral-deep dark:text-coral">{errors.comment.message}</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-sm font-semibold motion-safe:transition active:scale-[0.98] disabled:opacity-60 focus-volt lift-on-hover"
                      >
                        {reviewSubmitting && (
                          <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                        )}
                        {reviewSubmitting ? '제출 중…' : '리뷰 등록'}
                      </button>
                    </div>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <p className="text-sm text-ink-mute dark:text-bone-mute">
                    No reviews yet. Be the first!
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {reviews.map((r) => {
                      const author = r.user ?? r.author;
                      return (
                        <li
                          key={r.id}
                          className="border-b border-line/70 dark:border-night-line/70 last:border-0 pb-4 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StarRating value={r.rating} />
                              <span className="text-sm font-medium text-ink dark:text-bone">
                                @{author?.username ?? 'anonymous'}
                              </span>
                            </div>
                            <span className="text-xs text-ink-mute dark:text-bone-mute">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                          {r.comment && (
                            <p className="mt-2 text-sm text-ink-soft dark:text-bone-soft">
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
          <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink-mute dark:text-bone-mute">
              {free ? 'Free' : 'Price'}
            </p>
            <p className="mt-1 text-3xl font-bold text-ink dark:text-bone">
              {formatPrice(listing.priceCents)}
            </p>

            <div className="mt-5 space-y-2">
              {isOwner ? (
                <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft">
                  You own this listing
                </span>
              ) : isPurchased ? (
                <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200 border border-volt-200 dark:border-volt-800 font-semibold">
                  Owned ✓
                </span>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={buying}
                  className="group w-full relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-semibold motion-safe:transition active:scale-[0.98] disabled:opacity-60 focus-volt lift-on-hover overflow-hidden"
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
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-volt-700 dark:text-volt-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className={copied ? 'text-volt-700 dark:text-volt-300' : ''}>
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-lg font-bold text-white"
                aria-hidden
              >
                {listing.author.username[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink dark:text-bone truncate">
                  @{listing.author.username}
                </p>
                <Link
                  to={`/users/${listing.author.username}`}
                  className="text-xs text-volt-700 dark:text-volt-300 hover:underline"
                >
                  View profile
                </Link>
              </div>
              <button
                type="button"
                className="text-sm font-medium px-3 py-1.5 rounded-md border border-line dark:border-night-line text-ink-soft dark:text-bone-soft hover:border-volt-400 motion-safe:transition"
                onClick={() => {
                  /* follow is a no-op for now per spec */
                }}
              >
                Follow
              </button>
            </div>
          </div>

          <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6 space-y-4 text-sm">
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
                <span className="font-mono text-xs text-ink-soft dark:text-bone-soft">
                  v{listing.version}
                </span>
              </Meta>
            )}
            <Meta label="Updated">
              <span className="text-xs text-ink-mute dark:text-bone-mute">
                {formatDate(listing.updatedAt ?? listing.createdAt)}
              </span>
            </Meta>
          </div>
        </aside>
      </div>

      {/* Bottom related */}
      <section className="mt-16">
        <h2 className="text-xl font-bold tracking-tight text-ink dark:text-bone mb-1">
          You might also like
        </h2>
        <p className="text-sm text-ink-mute dark:text-bone-mute mb-5">
          Hand-picked recommendations from the marketplace.
        </p>
        <RelatedListings listingId={listing.id} />
      </section>

      <RecentlyViewed excludeSlug={listing.slug} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 pb-24 lg:pb-0" />

      {/* Mobile sticky purchase bar — hidden on lg+ where the sticky sidebar
          already handles this. Respects the iOS bottom safe area. */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 surface-glass border-t border-line dark:border-night-line"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
              {free ? '무료' : '가격'}
            </p>
            <p className="font-display font-bold text-ink dark:text-bone leading-none tabular-nums text-[1.4rem]">
              {formatPrice(listing.priceCents)}
            </p>
          </div>
          {isOwner ? (
            <span className="inline-flex items-center text-[0.82rem] font-medium px-4 py-2.5 rounded-full bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft">
              내 리스팅
            </span>
          ) : isPurchased ? (
            <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold px-4 py-2.5 rounded-full bg-volt-300 text-ink">
              <Check className="w-3.5 h-3.5" />
              보유 중
            </span>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={buying}
              className="group relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-semibold text-[0.86rem] tracking-tight motion-safe:transition focus-volt disabled:opacity-60"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
              <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors">
                {buying ? (
                  <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                {free ? '받기' : '구매'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-wide font-semibold text-ink-mute dark:text-bone-mute pt-0.5">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  );
}
