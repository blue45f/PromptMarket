import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReviewSchema, type CreateReviewInput } from '@promptmarket/shared';
import { Copy, Download, Loader2, ShoppingCart } from 'lucide-react';
import { useListing, usePurchase, useCreateReview } from '../lib/queries';
import { getErrorMessage } from '../lib/api';
import { formatDate, formatPrice } from '../lib/format';
import TypeBadge from '../components/TypeBadge';
import StarRating from '../components/StarRating';
import MarkdownView from '../components/MarkdownView';
import Spinner from '../components/Spinner';
import { useAuthStore } from '../store/auth';

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
  const listing = (raw?.listing ?? raw) as
    | (Record<string, unknown> & {
        id: string;
        slug: string;
        title: string;
        type: 'PROMPT' | 'CLAUDE_MD' | 'AGENT_MD';
        description: string;
        category: string;
        tags?: string[];
        model?: string | null;
        priceCents: number;
        coverEmoji?: string | null;
        downloads?: number;
        author: { id: string; username: string };
        avgRating?: number;
        reviewCount?: number;
        createdAt: string;
        body?: string | null;
        previewBody?: string;
      })
    | undefined;

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
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <Spinner label="Loading listing…" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-red-600">{error ? getErrorMessage(error) : 'Listing not found.'}</p>
        <Link to="/browse" className="mt-4 inline-block text-brand-700 underline">
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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-56 bg-gradient-to-br from-brand-50 to-white flex items-center justify-center text-7xl p-8">
            {listing.coverEmoji || '✨'}
          </div>
          <div className="flex-1 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <TypeBadge type={listing.type} />
              <span className="text-xs text-gray-500">in {listing.category}</span>
              {listing.model && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {listing.model}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{listing.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              by{' '}
              <Link
                to={`/users/${listing.author.username}`}
                className="text-brand-700 hover:underline"
              >
                @{listing.author.username}
              </Link>{' '}
              · {formatDate(listing.createdAt)}
            </p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <StarRating value={listing.avgRating ?? 0} count={listing.reviewCount} showLabel />
              <span className="inline-flex items-center gap-1 text-gray-500">
                <Download className="w-3.5 h-3.5" /> {listing.downloads ?? 0} downloads
              </span>
            </div>

            {listing.tags && listing.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {listing.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="text-2xl font-bold text-gray-900">{formatPrice(listing.priceCents)}</div>
              {isOwner ? (
                <span className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700">
                  You own this listing
                </span>
              ) : isPurchased ? (
                <span className="px-3 py-1.5 text-sm rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                  ✓ Purchased
                </span>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={buying}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition disabled:opacity-60"
                >
                  {buying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {buying ? 'Processing…' : free ? 'Get for free' : `Buy for ${formatPrice(listing.priceCents)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-gray-900">Description</h2>
        <p className="mt-2 text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </section>

      <section className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            {canViewBody ? 'Content' : 'Preview'}
          </h2>
          {canViewBody && listing.body && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-sm hover:bg-gray-50 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-sm hover:bg-gray-50 transition"
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
            <>
              <MarkdownView source={listing.previewBody || '*No preview available.*'} />
              <div className="mt-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-6 text-center">
                <p className="text-sm text-brand-900 font-medium">
                  🔒 Unlock the full content
                </p>
                <p className="mt-1 text-xs text-brand-700">
                  {free ? 'Get this listing for free to view the full content.' : `Purchase for ${formatPrice(listing.priceCents)} to view the full content.`}
                </p>
                <button
                  onClick={handlePurchase}
                  disabled={buying}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-60"
                >
                  {buying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {buying ? 'Processing…' : free ? 'Get free' : 'Buy to unlock'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Reviews{' '}
          <span className="text-sm font-normal text-gray-500">({reviews.length})</span>
        </h2>

        {isPurchased && !ownReview && (
          <form
            onSubmit={onSubmitReview}
            className="mb-6 rounded-xl border border-gray-100 p-4 bg-gray-50/50"
          >
            <p className="text-sm font-medium text-gray-900 mb-2">Leave a review</p>
            <StarRating
              value={rating}
              onChange={(v) => setValue('rating', v, { shouldDirty: true })}
              size="lg"
            />
            {errors.rating && (
              <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>
            )}
            <textarea
              {...register('comment')}
              placeholder="What did you think? (optional)"
              rows={3}
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.comment && (
              <p className="mt-1 text-xs text-red-600">{errors.comment.message}</p>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-60"
              >
                {reviewSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {reviewSubmitting ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => {
              const author = r.user ?? r.author;
              return (
                <li key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} />
                      <span className="text-sm font-medium text-gray-900">
                        @{author?.username ?? 'anonymous'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
