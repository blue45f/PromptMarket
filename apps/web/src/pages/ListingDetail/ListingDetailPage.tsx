import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Tabs from '@radix-ui/react-tabs'
import {
  CreateReviewSchema,
  typeGradient,
  type CreateReviewInput,
  type Difficulty,
  type License,
  type ListingType,
  type PromptTechnique,
} from '@promptmarket/shared'
import {
  BookOpen,
  Check,
  Copy,
  Download,
  Loader2,
  PanelRight,
  Share2,
  ShoppingCart,
} from 'lucide-react'
import { useListing, usePurchase, useCreateReview } from '@features/marketplace/queries'
import { getErrorMessage } from '@services/api'
import { formatDate, formatPrice, formatRelative } from '@utils/format'
import toast from 'react-hot-toast'
import TypeBadge from '@components/TypeBadge'
import ModelBadge from '@components/ModelBadge'
import TechniqueBadge from '@components/TechniqueBadge'
import DifficultyBadge from '@components/DifficultyBadge'
import LicenseBadge from '@components/LicenseBadge'
import StarRating from '@components/StarRating'
import MarkdownView from '@components/MarkdownView'
import SkeletonDetail from '@components/SkeletonDetail'
import RelatedListings from '@components/RelatedListings'
import RecentlyViewed from '@components/RecentlyViewed'
import WishlistButton from '@components/WishlistButton'
import MarkdownToc from '@components/MarkdownToc'
import InstallPanel from '@components/InstallPanel'
import AudienceMatch from '@components/AudienceMatch'
import ArtifactSignals from '@components/ArtifactSignals'
import ArtifactReadiness from '@components/ArtifactReadiness'
import { useRecentlyViewed } from '@hooks/useRecentlyViewed'
import { usePageMeta } from '@hooks/usePageMeta'
import { useStructuredData } from '@hooks/useStructuredData'
import { useWishlist } from '@hooks/useWishlist'
import { useAuthStore } from '@store/auth'
import { cn } from '@utils/cn'

interface ListingViewModel {
  id: string
  slug: string
  title: string
  type: ListingType
  description: string
  category: string
  tags?: string[]
  models?: string[]
  technique?: PromptTechnique | null
  difficulty?: Difficulty
  license?: License
  version?: string
  priceCents: number
  coverEmoji?: string | null
  downloads?: number
  author: { id: string; username: string }
  avgRating?: number
  reviewCount?: number
  createdAt: string
  updatedAt?: string
  body?: string | null
  previewBody?: string
}

export default function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('detail')
  const { token, user } = useAuthStore()
  const { data, isPending, error } = useListing(slug)

  // The API returns the detail response with a flat shape OR nested under
  // `listing` depending on serialisation. Normalise both into a uniform view.
  type AnyShape = Record<string, unknown> & {
    listing?: Record<string, unknown>
  }
  const raw = data as AnyShape | undefined
  const listing = (raw?.listing ?? raw) as ListingViewModel | undefined

  const reviews =
    (raw?.reviews as
      | Array<{
          id: string
          rating: number
          comment?: string | null
          createdAt: string
          author?: { id: string; username: string }
          user?: { id: string; username: string }
        }>
      | undefined) ?? []
  const isOwner = !!raw?.isOwner
  const isPurchased = !!raw?.isPurchased
  const canViewBody = !!raw?.canViewBody

  const purchaseMut = usePurchase(listing?.id, slug)
  const reviewMut = useCreateReview(listing?.id, slug)

  const [copied, setCopied] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied'>('idle')
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
    }
  }, [])
  const [readingMode, setReadingMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('pm.readingMode') === '1'
  })

  // Persist + ESC exits.
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('pm.readingMode', readingMode ? '1' : '0')
    if (!readingMode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setReadingMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [readingMode])

  // Track this slug as recently viewed once the detail successfully loads.
  const { track } = useRecentlyViewed()
  useEffect(() => {
    if (listing?.slug) track(listing.slug)
  }, [listing?.slug, track])

  // Reflect the listing in the document title and OG/Twitter meta so links
  // shared into Slack / iMessage / Twitter get a proper card.
  usePageMeta({
    title: listing ? t('meta.titleSuffix', { title: listing.title }) : t('meta.titleFallback'),
    description: listing?.description,
    ogType: 'product',
    canonical:
      typeof window !== 'undefined' && listing?.slug
        ? `${window.location.origin}/listings/${listing.slug}`
        : undefined,
  })

  // JSON-LD structured data — pairs with the OG meta so Google / Bing /
  // Naver can render rich product cards (price + rating + author).
  //
  // Memoised on the primitive fields it reads. Without this, the object
  // literal is a fresh reference on *every* render, which makes
  // useStructuredData's effect (keyed on the object identity) tear down and
  // re-inject the <script> on every commit — an unstable-dependency loop that
  // surfaces as "Maximum update depth exceeded" once another subscriber
  // (recently-viewed / wishlist) re-renders the tree. Stabilising the value
  // collapses it back to one effect run per actual data change.
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const structuredData = useMemo(
    () =>
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
                : t('jsonLd.makerType', { defaultValue: 'PromptMarket maker' }),
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
        : null,
    [
      origin,
      listing?.title,
      listing?.description,
      listing?.slug,
      listing?.category,
      listing?.author?.username,
      listing?.updatedAt,
      listing?.createdAt,
      listing?.priceCents,
      listing?.reviewCount,
      listing?.avgRating,
    ]
  )
  useStructuredData(structuredData)

  // ⌘D / Ctrl+D toggles the current listing's wishlist state. Skips when a
  // typing target is focused so the browser's "bookmark page" shortcut still
  // works inside inputs. preventDefault overrides the browser bookmark for
  // power users who explicitly want the listing in the in-app wishlist.
  const { toggle: toggleWishlist } = useWishlist()
  useEffect(() => {
    if (!listing?.slug) return
    const slug = listing.slug
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() !== 'd') return
      const t = e.target
      if (t instanceof HTMLElement) {
        const tag = t.tagName
        if (t.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          return
        }
      }
      e.preventDefault()
      toggleWishlist(slug)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [listing?.slug, toggleWishlist])

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
  })
  const rating = watch('rating')

  async function handlePurchase() {
    if (!listing) return
    if (!token) {
      navigate('/login', { state: { from: `/listings/${listing.slug}` } })
      return
    }
    // Pre-empt a guaranteed-to-fail request: if the wallet can't cover the
    // price, show a localized, actionable message instead of letting the
    // server reject it with an English error.
    const price = listing.priceCents ?? 0
    if (price > 0 && typeof user?.balanceCents === 'number' && user.balanceCents < price) {
      toast.error(t('purchase.insufficient', { amount: formatPrice(price - user.balanceCents) }))
      return
    }
    try {
      await purchaseMut.mutateAsync()
    } catch {
      /* toast handled in hook */
    }
  }

  async function handleCopy() {
    if (!listing?.body) return
    try {
      await navigator.clipboard.writeText(listing.body)
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  async function handleShare() {
    if (!listing) return
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/listings/${listing.slug}` : ''
    const payload = {
      title: listing.title,
      text: listing.description,
      url,
    }
    // Web Share API on mobile and macOS Safari.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(payload)
        setShareState('shared')
        if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
        shareTimerRef.current = setTimeout(() => setShareState('idle'), 1500)
        return
      } catch {
        /* user cancelled or browser refused — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareState('copied')
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
      shareTimerRef.current = setTimeout(() => setShareState('idle'), 1500)
    } catch {
      /* clipboard denied — silently ignore */
    }
  }

  function handleDownload() {
    if (!listing?.body) return
    const blob = new Blob([listing.body], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${listing.slug}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const onSubmitReview = handleSubmit(async (values) => {
    try {
      await reviewMut.mutateAsync({
        rating: values.rating,
        comment: values.comment?.trim() || undefined,
      })
      reset({ rating: 5, comment: '' })
    } catch {
      /* toast handled in hook */
    }
  })

  if (isPending) {
    return <SkeletonDetail />
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-coral-deep dark:text-coral">
          {error ? getErrorMessage(error) : t('notFound.message')}
        </p>
        <Link to="/browse" className="mt-4 inline-block text-volt-700 dark:text-volt-300 underline">
          {t('notFound.backToBrowse')}
        </Link>
      </div>
    )
  }

  const ownReview = reviews.find((r) => {
    const author = r.user ?? r.author
    return user && author?.id === user.id
  })
  const free = (listing.priceCents ?? 0) === 0
  const cannotAfford =
    !!token &&
    !free &&
    !isOwner &&
    !isPurchased &&
    typeof user?.balanceCents === 'number' &&
    user.balanceCents < (listing.priceCents ?? 0)
  const shortfallCents = cannotAfford ? (listing.priceCents ?? 0) - (user?.balanceCents ?? 0) : 0
  const buying = purchaseMut.isPending
  const reviewSubmitting = isSubmitting || reviewMut.isPending
  const models = listing.models ?? []

  return (
    <div
      className={cn(
        'mx-auto px-[clamp(1.25rem,4vw,3rem)] py-8 animate-fade-in',
        readingMode ? 'max-w-[820px]' : 'max-w-7xl'
      )}
    >
      {readingMode && (
        <button
          type="button"
          onClick={() => setReadingMode(false)}
          className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 text-[0.78rem] font-medium text-ink-soft dark:text-bone-soft hover:border-volt-400 dark:hover:border-volt-500/60 motion-safe:transition ease-expo focus-volt"
        >
          <PanelRight aria-hidden="true" className="w-3.5 h-3.5" />
          {t('reopenSidebar')}
          <kbd className="font-mono text-[0.62rem] px-1 py-0.5 rounded border border-line dark:border-night-line">
            {t('keyboard.esc', { defaultValue: 'esc' })}
          </kbd>
        </button>
      )}
      <div className={cn('grid gap-8', !readingMode && 'grid-cols-1 lg:grid-cols-12')}>
        <div className={cn('min-w-0 space-y-6', !readingMode && 'lg:col-span-8')}>
          {/* Hero cover */}
          <div
            className={cn(
              'aspect-[16/9] rounded-2xl bg-gradient-to-br relative overflow-hidden flex items-center justify-center',
              typeGradient(listing.type)
            )}
          >
            <span className="text-8xl drop-shadow-lg" aria-hidden>
              {listing.coverEmoji || '✨'}
            </span>
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <TypeBadge type={listing.type} overlay />
              <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-canvas dark:bg-night ring-1 ring-line dark:ring-night-line text-ink dark:text-bone">
                {t('cover.categoryBadge', {
                  category: t('home:categories.labels.' + listing.category, {
                    defaultValue: listing.category,
                  }),
                })}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-bone">
              {listing.title}
            </h1>
            <p className="mt-2 text-sm text-ink-mute dark:text-bone-mute">
              <Link
                to={`/users/${listing.author?.username ?? 'unknown'}`}
                className="text-volt-700 dark:text-volt-300 hover:underline font-medium"
              >
                @{listing.author?.username ?? 'unknown'}
              </Link>{' '}
              ·{' '}
              <span title={formatDate(listing.createdAt)}>{formatRelative(listing.createdAt)}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <StarRating value={listing.avgRating ?? 0} count={listing.reviewCount} showLabel />
              <span className="inline-flex items-center gap-1 text-ink-mute dark:text-bone-mute">
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                {t('hero.downloads', { count: listing.downloads ?? 0 })}
              </span>
            </div>
            {listing.tags && listing.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {listing.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/browse?q=${encodeURIComponent(tag)}`}
                    className="text-xs px-2 py-0.5 rounded-full bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft hover:bg-volt-300/40 hover:text-ink dark:hover:bg-volt-300/30 dark:hover:text-bone motion-safe:transition-colors ease-expo focus-volt"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Tabs.Root defaultValue="overview" className="w-full">
            <Tabs.List
              aria-label={t('tabs.aria')}
              className="flex gap-1 border-b border-line dark:border-night-line overflow-x-auto scrollbar-hide -mx-[clamp(1.25rem,4vw,3rem)] sm:mx-0 px-[clamp(1.25rem,4vw,3rem)] sm:px-0"
            >
              {(
                [
                  ['overview', t('tabs.overview')],
                  ['reviews', t('tabs.reviews', { count: reviews.length })],
                  ['related', t('tabs.related')],
                ] as const
              ).map(([key, label]) => (
                <Tabs.Trigger
                  key={key}
                  value={key}
                  className={cn(
                    'shrink-0 whitespace-nowrap px-4 py-2 -mb-px text-sm font-medium border-b-2 motion-safe:transition ease-expo focus-volt',
                    'border-transparent text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone',
                    'data-[state=active]:border-volt-500 data-[state=active]:text-ink',
                    'dark:data-[state=active]:border-volt-400 dark:data-[state=active]:text-bone'
                  )}
                >
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="overview" className="pt-6 focus-visible:outline-none">
              <AudienceMatch
                type={listing.type}
                category={listing.category}
                difficulty={listing.difficulty}
                technique={listing.technique ?? null}
                models={listing.models}
                className="mb-6"
              />
              <ArtifactReadiness
                type={listing.type}
                body={listing.body}
                previewBody={listing.previewBody}
                canViewBody={canViewBody}
                models={listing.models}
                className="mb-6"
              />
              <section aria-labelledby="listing-body-heading">
                <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6 sm:p-8">
                  <p className="text-base text-ink-soft dark:text-bone-soft whitespace-pre-wrap leading-relaxed max-w-[72ch]">
                    {listing.description}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <h2
                      id="listing-body-heading"
                      className="text-lg font-bold tracking-tight text-ink dark:text-bone"
                    >
                      {canViewBody ? t('body.headingFull') : t('body.headingPreview')}
                    </h2>
                    {canViewBody && listing.body && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition ease-expo focus-volt"
                        >
                          {copied ? (
                            <Check
                              aria-hidden="true"
                              className="w-3.5 h-3.5 text-volt-700 dark:text-volt-300"
                            />
                          ) : (
                            <Copy aria-hidden="true" className="w-3.5 h-3.5" />
                          )}
                          <span className={copied ? 'text-volt-700 dark:text-volt-300' : ''}>
                            {copied ? t('body.copied') : t('body.copy')}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition ease-expo focus-volt"
                        >
                          <Download aria-hidden="true" className="w-3.5 h-3.5" />
                          {t('body.downloadMd')}
                        </button>
                        <span className="sr-only" role="status" aria-live="polite">
                          {copied ? t('body.copied') : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    {readingMode && canViewBody && listing.body && (
                      <MarkdownToc source={listing.body} className="mb-6" />
                    )}
                    {canViewBody && listing.body ? (
                      <MarkdownView source={listing.body} />
                    ) : canViewBody && !listing.body ? (
                      <p className="text-sm text-ink-mute dark:text-bone-mute italic">
                        {t('body.noBody')}
                      </p>
                    ) : (
                      <div className="relative">
                        <MarkdownView source={listing.previewBody || t('body.noPreview')} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas-sub dark:from-night-sub to-transparent" />
                        <div className="mt-6 rounded-xl border border-dashed border-volt-400/60 dark:border-volt-500/40 bg-volt-100/60 dark:bg-volt-900/30 p-6 text-center">
                          <p className="text-sm text-ink dark:text-bone font-medium">
                            {t('paywall.unlock')}
                          </p>
                          <p className="mt-1 text-xs text-ink-soft dark:text-bone-soft">
                            {free
                              ? t('paywall.free')
                              : t('paywall.paid', { price: formatPrice(listing.priceCents) })}
                          </p>
                          <button
                            type="button"
                            onClick={handlePurchase}
                            disabled={buying}
                            className="mt-3 group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-sm font-semibold motion-safe:transition ease-expo active:scale-[0.98] disabled:opacity-60 focus-volt lift-on-hover"
                          >
                            {buying ? (
                              <Loader2
                                aria-hidden="true"
                                className="w-4 h-4 motion-safe:animate-spin"
                              />
                            ) : (
                              <ShoppingCart aria-hidden="true" className="w-4 h-4" />
                            )}
                            {buying
                              ? t('paywall.processing')
                              : free
                                ? t('paywall.getFree')
                                : t('paywall.buyToView')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </Tabs.Content>

            <Tabs.Content value="reviews" className="pt-6 focus-visible:outline-none">
              <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6 sm:p-8">
                <h2 className="sr-only">{t('tabs.reviews', { count: reviews?.length ?? 0 })}</h2>
                {isPurchased && !ownReview && (
                  <form
                    onSubmit={onSubmitReview}
                    noValidate
                    aria-labelledby="review-form-label"
                    className="mb-6 rounded-xl border border-line dark:border-night-line p-4 bg-canvas-deep/60 dark:bg-night-deep/40"
                  >
                    <h3
                      id="review-form-label"
                      className="text-sm font-medium text-ink dark:text-bone mb-2"
                    >
                      {t('reviews.writePrompt')}
                    </h3>
                    <StarRating
                      value={rating}
                      onChange={(v) => setValue('rating', v, { shouldDirty: true })}
                      size="lg"
                      aria-describedby={errors.rating ? 'review-rating-error' : undefined}
                    />
                    {errors.rating && (
                      <p
                        id="review-rating-error"
                        role="alert"
                        className="mt-1 text-xs text-coral-deep dark:text-coral"
                      >
                        {t('reviews.validation.rating')}
                      </p>
                    )}
                    <textarea
                      {...register('comment')}
                      placeholder={t('reviews.commentPlaceholder')}
                      aria-label={t('reviews.commentLabel')}
                      rows={3}
                      aria-invalid={errors.comment ? true : undefined}
                      aria-describedby={errors.comment ? 'review-comment-error' : undefined}
                      className="mt-3 w-full rounded-lg border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500"
                    />
                    {errors.comment && (
                      <p
                        id="review-comment-error"
                        role="alert"
                        className="mt-1 text-xs text-coral-deep dark:text-coral"
                      >
                        {t('reviews.validation.comment')}
                      </p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink text-sm font-semibold motion-safe:transition ease-expo active:scale-[0.98] disabled:opacity-60 focus-volt lift-on-hover"
                      >
                        {reviewSubmitting && (
                          <Loader2
                            aria-hidden="true"
                            className="w-4 h-4 motion-safe:animate-spin"
                          />
                        )}
                        {reviewSubmitting ? t('reviews.submitting') : t('reviews.submit')}
                      </button>
                    </div>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <p className="text-sm text-ink-mute dark:text-bone-mute">{t('reviews.empty')}</p>
                ) : (
                  <ul className="space-y-4">
                    {reviews.map((r) => {
                      const author = r.user ?? r.author
                      return (
                        <li
                          key={r.id}
                          className="border-b border-line/70 dark:border-night-line/70 last:border-0 pb-4 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StarRating value={r.rating} />
                              <span className="text-sm font-medium text-ink dark:text-bone">
                                @{author?.username ?? t('reviews.anonymous')}
                              </span>
                            </div>
                            <span
                              className="text-xs text-ink-mute dark:text-bone-mute"
                              title={formatDate(r.createdAt)}
                            >
                              {formatRelative(r.createdAt)}
                            </span>
                          </div>
                          {r.comment && (
                            <p className="mt-2 text-sm text-ink-soft dark:text-bone-soft max-w-[72ch]">
                              {r.comment}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="related" className="pt-6 focus-visible:outline-none">
              <RelatedListings listingId={listing.id} />
            </Tabs.Content>
          </Tabs.Root>
        </div>

        {/* Sticky sidebar */}
        {!readingMode && (
          <aside
            aria-label={t('sidebar.ariaLabel')}
            className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                    {free ? t('sidebar.free') : t('sidebar.price')}
                  </p>
                  <p className="mt-1 font-display text-[2rem] font-bold text-ink dark:text-bone tracking-[-0.02em] tabular-nums">
                    {free ? t('common:labels.free') : formatPrice(listing.priceCents)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setReadingMode((v) => !v)}
                    aria-label={t('sidebar.readingModeToggle')}
                    aria-pressed={readingMode}
                    title={t('sidebar.readingModeTitle')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-line dark:border-night-line bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:border-volt-400 dark:hover:border-volt-500/50 motion-safe:transition ease-expo focus-volt"
                  >
                    <BookOpen aria-hidden className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label={t('sidebar.share')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-night-line bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft hover:text-ink dark:hover:text-bone hover:border-volt-400 dark:hover:border-volt-500/50 motion-safe:transition ease-expo focus-volt text-[0.78rem] font-medium"
                  >
                    {shareState === 'idle' ? (
                      <Share2 aria-hidden className="w-3.5 h-3.5" />
                    ) : (
                      <Check aria-hidden className="w-3.5 h-3.5 text-volt-700 dark:text-volt-300" />
                    )}
                    <span
                      className={shareState === 'idle' ? '' : 'text-volt-700 dark:text-volt-300'}
                    >
                      {shareState === 'shared'
                        ? t('sidebar.shared')
                        : shareState === 'copied'
                          ? t('sidebar.linkCopied')
                          : t('sidebar.shareLabel')}
                    </span>
                  </button>
                  <span className="sr-only" role="status" aria-live="polite">
                    {shareState !== 'idle' ? t('sidebar.shared') : ''}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {isOwner ? (
                  <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft">
                    {t('sidebar.ownListing')}
                  </span>
                ) : isPurchased ? (
                  <span className="block w-full text-center px-3 py-2.5 text-sm rounded-lg bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200 border border-volt-200 dark:border-volt-800 font-semibold">
                    {t('sidebar.owned')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handlePurchase}
                    disabled={buying}
                    className="group w-full relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-semibold motion-safe:transition ease-expo active:scale-[0.98] disabled:opacity-60 focus-volt lift-on-hover overflow-hidden"
                  >
                    {buying ? (
                      <Loader2 aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin" />
                    ) : (
                      <ShoppingCart aria-hidden="true" className="w-4 h-4" />
                    )}
                    {buying
                      ? t('sidebar.processing')
                      : free
                        ? t('sidebar.getFree')
                        : t('sidebar.buy', { price: formatPrice(listing.priceCents) })}
                  </button>
                )}
                {cannotAfford && (
                  <p
                    role="alert"
                    className="text-[0.78rem] text-coral-deep dark:text-coral text-center"
                  >
                    {t('purchase.shortBy', { amount: formatPrice(shortfallCents) })}{' '}
                    <Link to="/dashboard" className="underline font-medium focus-volt">
                      {t('purchase.topUp')}
                    </Link>
                  </p>
                )}
                <div className="flex items-center justify-center">
                  <WishlistButton slug={listing.slug} variant="inline" />
                </div>
                <InstallPanel slug={listing.slug} type={listing.type} className="mt-2" />
                {(isPurchased || isOwner) && listing.body && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition ease-expo focus-volt"
                    >
                      {copied ? (
                        <Check
                          aria-hidden="true"
                          className="w-3.5 h-3.5 text-volt-700 dark:text-volt-300"
                        />
                      ) : (
                        <Copy aria-hidden="true" className="w-3.5 h-3.5" />
                      )}
                      <span className={copied ? 'text-volt-700 dark:text-volt-300' : ''}>
                        {copied ? t('sidebar.copied') : t('sidebar.copy')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-line dark:border-night-line text-sm hover:bg-canvas-deep dark:hover:bg-night-deep motion-safe:transition ease-expo focus-volt"
                    >
                      <Download aria-hidden="true" className="w-3.5 h-3.5" />
                      {t('sidebar.download')}
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
                  {listing.author?.username?.[0]?.toUpperCase() ?? '?'}
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-volt-400 ring-2 ring-canvas-sub dark:ring-night-sub" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[0.95rem] font-semibold text-ink dark:text-bone truncate tracking-tight">
                    @{listing.author?.username ?? 'unknown'}
                  </p>
                  <p className="text-[0.7rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                    {t('sidebar.maker')}
                  </p>
                </div>
                <Link
                  to={`/users/${listing.author?.username ?? 'unknown'}`}
                  className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full border border-line dark:border-night-line text-ink dark:text-bone hover:border-volt-400 dark:hover:border-volt-500/50 motion-safe:transition ease-expo focus-volt"
                >
                  {t('sidebar.profile')}
                </Link>
              </div>
            </div>

            <ArtifactSignals listing={listing} variant="panel" />

            <div className="bg-canvas-sub dark:bg-night-sub rounded-2xl border border-line dark:border-night-line p-6 space-y-4 text-sm">
              <Meta label={t('meta_rows.type')}>
                <TypeBadge type={listing.type} />
              </Meta>
              {models.length > 0 && (
                <Meta label={t('meta_rows.models')}>
                  <div className="flex flex-wrap gap-1">
                    {models.map((m) => (
                      <ModelBadge key={m} slug={m} />
                    ))}
                  </div>
                </Meta>
              )}
              {listing.type === 'PROMPT' && listing.technique && (
                <Meta label={t('meta_rows.technique')}>
                  <TechniqueBadge technique={listing.technique} />
                </Meta>
              )}
              {listing.difficulty && (
                <Meta label={t('meta_rows.difficulty')}>
                  <DifficultyBadge difficulty={listing.difficulty} />
                </Meta>
              )}
              {listing.category && (
                <Meta label={t('meta_rows.category')}>
                  <span className="text-xs text-ink dark:text-bone">
                    {t('home:categories.labels.' + listing.category, {
                      defaultValue: listing.category,
                    })}
                  </span>
                </Meta>
              )}
              {listing.license && (
                <Meta label={t('meta_rows.license')}>
                  <LicenseBadge license={listing.license} />
                </Meta>
              )}
              {listing.version && (
                <Meta label={t('meta_rows.version')}>
                  <span className="font-mono text-xs text-ink-soft dark:text-bone-soft">
                    {t('meta_rows.versionValue', { version: listing.version })}
                  </span>
                </Meta>
              )}
              <Meta label={t('meta_rows.updated')}>
                <span className="text-xs text-ink-mute dark:text-bone-mute font-mono">
                  {formatDate(listing.updatedAt ?? listing.createdAt)}
                </span>
              </Meta>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom related */}
      <section className="mt-16" aria-labelledby="related-section-heading">
        <h2
          id="related-section-heading"
          className="text-xl font-bold tracking-tight text-ink dark:text-bone mb-1"
        >
          {t('bottomRelated.title')}
        </h2>
        <p className="text-sm text-ink-mute dark:text-bone-mute mb-5">
          {t('bottomRelated.subtitle')}
        </p>
        <RelatedListings listingId={listing.id} />
      </section>

      <RecentlyViewed
        excludeSlug={listing.slug}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 pb-24 lg:pb-0"
      />

      {/* Mobile sticky purchase bar — hidden on lg+ where the sticky sidebar
          already handles this. Respects the iOS bottom safe area. */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-canvas dark:bg-night border-t border-line dark:border-night-line"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                {free ? t('mobileBar.free') : t('mobileBar.price')}
              </p>
              <p className="font-display font-bold text-ink dark:text-bone leading-none tabular-nums text-[1.4rem]">
                {free ? t('common:labels.free') : formatPrice(listing.priceCents)}
              </p>
            </div>
            {isOwner ? (
              <span className="inline-flex items-center text-[0.82rem] font-medium px-4 py-2.5 rounded-full bg-canvas-deep dark:bg-night-deep text-ink-soft dark:text-bone-soft">
                {t('mobileBar.ownListing')}
              </span>
            ) : isPurchased ? (
              <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold px-4 py-2.5 rounded-full bg-volt-300 text-ink">
                <Check aria-hidden="true" className="w-3.5 h-3.5" />
                {t('mobileBar.owned')}
              </span>
            ) : (
              <button
                type="button"
                onClick={handlePurchase}
                disabled={buying}
                className="group relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-semibold text-[0.86rem] tracking-tight motion-safe:transition ease-expo focus-volt disabled:opacity-60"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 ease-expo group-hover:translate-y-0"
                />
                <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors ease-expo">
                  {buying ? (
                    <Loader2 aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin" />
                  ) : (
                    <ShoppingCart aria-hidden="true" className="w-4 h-4" />
                  )}
                  {free ? t('mobileBar.getFree') : t('mobileBar.buy')}
                </span>
              </button>
            )}
          </div>
          {cannotAfford && (
            <p role="alert" className="text-[0.74rem] text-coral-deep dark:text-coral text-center">
              {t('purchase.shortBy', { amount: formatPrice(shortfallCents) })}{' '}
              <Link to="/dashboard" className="underline">
                {t('purchase.topUp')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute pt-1">
        {label}
      </span>
      <div className="text-right min-w-0">{children}</div>
    </div>
  )
}
