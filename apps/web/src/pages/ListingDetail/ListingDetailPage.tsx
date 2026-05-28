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
import { BookOpen, Check, Copy, Download, Loader2, PanelRight, Share2, ShoppingCart } from 'lucide-react';
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
import WishlistButton from '@components/WishlistButton';
import MarkdownToc from '@components/MarkdownToc';
import InstallPanel from '@components/InstallPanel';
import AudienceMatch from '@components/AudienceMatch';
import { useRecentlyViewed } from '@hooks/useRecentlyViewed';
import { usePageMeta } from '@hooks/usePageMeta';
import { useStructuredData } from '@hooks/useStructuredData';
import { useWishlist } from '@hooks/useWishlist';
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
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied'>('idle');
  const [readingMode, setReadingMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('pm.readingMode') === '1';
  });

  // Persist + ESC exits.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pm.readingMode', readingMode ? '1' : '0');
    if (!readingMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setReadingMode(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readingMode]);

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

  // JSON-LD structured data — pairs with the OG meta so Google / Bing /
  // Naver can render rich product cards (price + rating + author).
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const structuredData =
    listing && origin
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: listing.title,
          description: listing.description,
          url: `${origin}/listings/${listing.slug}`,
          category: listing.category,
          brand: { '@type': 'Brand', name: 'PromptMarket' },
          author: {
            '@type': 'Person',
            name: listing.author?.username
              ? `@${listing.author.username}`
              : 'PromptMarket maker',
          },
          dateModified: listing.updatedAt ?? listing.createdAt,
          offers: {
            '@type': 'Offer',
            price: ((listing.priceCents ?? 0) / 100).toFixed(2),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `${origin}/listings/${listing.slug}`,
          },
          aggregateRating:
            (listing.reviewCount ?? 0) > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: (listing.avgRating ?? 0).toFixed(1),
                  reviewCount: listing.reviewCount,
                  bestRating: '5',
                  worstRating: '1',
                }
              : undefined,
        }
      : null;
  useStructuredData(structuredData);

  // ⌘D / Ctrl+D toggles the current listing's wishlist state. Skips when a
  // typing target is focused so the browser's "bookmark page" shortcut still
  // works inside inputs. preventDefault overrides the browser bookmark for
  // power users who explicitly want the listing in the in-app wishlist.
  const { toggle: toggleWishlist } = useWishlist();
  useEffect(() => {
    if (!listing?.slug) return;
    const slug = listing.slug;
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== 'd') return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (t.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          return;
        }
      }
      e.preventDefault();
      toggleWishlist(slug);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listing?.slug, toggleWishlist]);

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

  async function handleShare() {
    if (!listing) return;
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/listings/${listing.slug}` : '';
    const payload = {
      title: `${listing.title} · PromptMarket`,
      text: listing.description,
      url,
    };
    // Web Share API on mobile and macOS Safari.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(payload);
        setShareState('shared');
        setTimeout(() => setShareState('idle'), 1500);
        return;
      } catch {
        /* user cancelled or browser refused — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 1500);
    } catch {
      /* clipboard denied — silently ignore */
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
          {error ? getErrorMessage(error) : '해당 리스팅을 찾을 수 없어요.'}
        </p>
        <Link
          to="/browse"
          className="mt-4 inline-block text-volt-700 dark:text-volt-300 underline"
        >
          탐색으로 돌아가기
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
    <div
      className={cn(
        'mx-auto px-[clamp(1.25rem,4vw,3rem)] py-8 animate-fade-in motion-safe:transition-[max-width] motion-safe:duration-500',
        readingMode ? 'max-w-[820px]' : 'max-w-7xl',
      )}
    >
      {readingMode && (
        <button
          type="button"
          onClick={() => setReadingMode(false)}
          className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-[0.78rem] font-medium text-ink-soft dark:text-bone-soft hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition focus-volt"
        >
          <PanelRight className="w-3.5 h-3.5" />
          사이드바 다시 열기
          <kbd className="font-mono text-[0.62rem] px-1 py-0.5 rounded border border-line dark:border-night-line">
            esc
          </kbd>
        </button>
      )}
      <div className={cn('grid gap-8', !readingMode && 'grid-cols-1 lg:grid-cols-12')}>
        <div
          className={cn(
            'min-w-0 space-y-6',
            !readingMode && 'lg:col-span-8',
          )}
        >
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
              aria-label="리스팅 섹션"
              className="flex gap-1 border-b border-line dark:border-night-line overflow-x-auto scrollbar-hide -mx-[clamp(1.25rem,4vw,3rem)] sm:mx-0 px-[clamp(1.25rem,4vw,3rem)] sm:px-0"
            >
              {(
                [
                  ['overview', '개요'],
                  ['reviews', `리뷰 (${reviews.length})`],
                  ['related', '관련'],
                ] as const
              ).map(([key, label]) => (
                <Tabs.Trigger
                  key={key}
                  value={key}
                  className={cn(
                    'shrink-0 whitespace-nowrap px-4 py-2 -mb-px text-sm font-medium border-b-2 motion-safe:transition focus-volt',
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
                    {canViewBody ? '본문' : '미리보기'}
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
                          {copied ? '복사됨' : '복사'}
                        </span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        .md 다운로드
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {readingMode && canViewBody && listing.body && (
                    <MarkdownToc source={listing.body} className="mb-6" />
                  )}
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
                      리뷰 남기기
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
                      placeholder="어떠셨나요? (선택)"
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
                    아직 리뷰가 없어요. 첫 번째 리뷰가 되어 보세요!
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
        {!readingMode && (
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                  {free ? '무료' : '가격'}
                </p>
                <p className="mt-1 font-display text-[2rem] font-bold text-ink dark:text-bone tracking-[-0.02em] tabular-nums">
                  {formatPrice(listing.priceCents)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setReadingMode((v) => !v)}
                aria-label="조용한 모드 토글"
                aria-pressed={readingMode}
                title="조용한 모드"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-line dark:border-night-line bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:border-volt-400 dark:hover:border-volt-500/50 motion-safe:transition focus-volt"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="이 리스팅 공유"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:border-volt-400 dark:hover:border-volt-500/50 motion-safe:transition focus-volt text-[0.78rem] font-medium"
              >
                {shareState === 'idle' ? (
                  <Share2 className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-volt-700 dark:text-volt-300" />
                )}
                <span
                  className={
                    shareState === 'idle'
                      ? ''
                      : 'text-volt-700 dark:text-volt-300'
                  }
                >
                  {shareState === 'shared'
                    ? '공유됨'
                    : shareState === 'copied'
                      ? '링크 복사됨'
                      : '공유'}
                </span>
              </button>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {isOwner ? (
                <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft">
                  내가 만든 리스팅
                </span>
              ) : isPurchased ? (
                <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200 border border-volt-200 dark:border-volt-800 font-semibold">
                  보유 중 ✓
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
                    ? '처리 중…'
                    : free
                      ? '무료로 받기'
                      : `${formatPrice(listing.priceCents)}에 구매`}
                </button>
              )}
              <div className="flex items-center justify-center">
                <WishlistButton slug={listing.slug} variant="inline" />
              </div>
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
                      {copied ? '복사됨' : '복사'}
                    </span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    다운로드
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="relative inline-flex w-12 h-12 rounded-xl bg-ink dark:bg-bone text-volt-300 dark:text-ink font-display font-bold text-lg items-center justify-center -rotate-3"
              >
                {listing.author.username[0]?.toUpperCase() ?? '?'}
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-volt-400 ring-2 ring-canvas-sub dark:ring-night-sub" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[0.95rem] font-semibold text-ink dark:text-bone truncate tracking-tight">
                  @{listing.author.username}
                </p>
                <p className="text-[0.7rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                  메이커
                </p>
              </div>
              <Link
                to={`/users/${listing.author.username}`}
                className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full border border-line dark:border-night-line text-ink dark:text-bone hover:border-volt-400 dark:hover:border-volt-500/50 motion-safe:transition focus-volt"
              >
                프로필
              </Link>
            </div>
          </div>

          <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6 space-y-4 text-sm">
            <Meta label="타입">
              <TypeBadge type={listing.type} />
            </Meta>
            {models.length > 0 && (
              <Meta label="모델">
                <div className="flex flex-wrap gap-1">
                  {models.map((m) => (
                    <ModelBadge key={m} slug={m} />
                  ))}
                </div>
              </Meta>
            )}
            {listing.type === 'PROMPT' && listing.technique && (
              <Meta label="기법">
                <TechniqueBadge technique={listing.technique} />
              </Meta>
            )}
            {listing.difficulty && (
              <Meta label="난이도">
                <DifficultyBadge difficulty={listing.difficulty} />
              </Meta>
            )}
            {listing.category && (
              <Meta label="카테고리">
                <span className="text-xs text-ink dark:text-bone">{listing.category}</span>
              </Meta>
            )}
            {listing.license && (
              <Meta label="라이선스">
                <LicenseBadge license={listing.license} />
              </Meta>
            )}
            {listing.version && (
              <Meta label="버전">
                <span className="font-mono text-xs text-ink-soft dark:text-bone-soft">
                  v{listing.version}
                </span>
              </Meta>
            )}
            <Meta label="업데이트">
              <span className="text-xs text-ink-mute dark:text-bone-mute font-mono">
                {formatDate(listing.updatedAt ?? listing.createdAt)}
              </span>
            </Meta>
          </div>
        </aside>
        )}
      </div>

      {/* Bottom related */}
      <section className="mt-16">
        <h2 className="text-xl font-bold tracking-tight text-ink dark:text-bone mb-1">
          이런 것도 좋아할 거예요
        </h2>
        <p className="text-sm text-ink-mute dark:text-bone-mute mb-5">
          마켓플레이스에서 엄선한 추천.
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
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute pt-1">
        {label}
      </span>
      <div className="text-right min-w-0">{children}</div>
    </div>
  );
}
