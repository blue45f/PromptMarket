import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserProfile } from '@features/marketplace/queries'
import { getErrorMessage } from '@services/api'
import { usePageMeta } from '@hooks/usePageMeta'
import { useSpotlight } from '@hooks/useSpotlight'
import { useAuthStore } from '@store/auth'
import ListingCard from '@components/ListingCard'
import { SkeletonGrid } from '@components/SkeletonCard'
import EmptyState from '@components/EmptyState'

export default function ProfilePage() {
  const { t } = useTranslation('profile')
  const { username } = useParams<{ username: string }>()
  const { data, isPending, isFetching, error, refetch } = useUserProfile(username)
  const { user: currentUser } = useAuthStore()
  const spotlightRef = useSpotlight<HTMLElement>()

  // The API may return the profile flat or under a `user` key; normalise.
  type ProfileLike = {
    user?: { id: string; username: string; bio?: string | null }
    listings?: Array<Record<string, unknown>>
    username?: string
    bio?: string | null
  }
  const raw = data as unknown as ProfileLike | undefined
  const user = (raw?.user ?? raw) as { username?: string; bio?: string | null } | undefined
  const listings = (raw?.listings ?? []) as import('@/types').ListingCard[]

  const displayName = user?.username ?? username ?? '?'

  usePageMeta({
    title: t('meta.title', { name: displayName }),
    description: user?.bio ?? t('meta.description', { name: displayName }),
  })

  if (isPending) {
    return (
      <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
        <div className="h-48 rounded-3xl bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse mb-8" />
        <SkeletonGrid count={6} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-[clamp(1.25rem,4vw,3rem)] py-20 text-center animate-fade-in">
        <p className="text-coral-deep dark:text-coral font-mono text-sm">
          {error ? getErrorMessage(error) : t('notFound')}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line dark:border-night-line text-ink-soft dark:text-bone-soft font-mono text-xs uppercase tracking-[0.15em] hover:border-volt-500 hover:text-ink dark:hover:text-bone motion-safe:transition ease-expo focus-volt disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('error.retry')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <section
        ref={spotlightRef}
        aria-labelledby="profile-hero-title"
        className="spotlight-host relative overflow-hidden isolate"
      >
        <div className="spotlight -z-10" aria-hidden />
        <div aria-hidden className="absolute inset-0 -z-20">
          <div className="absolute top-[-22%] left-[-12%] w-[55%] h-[60%] rounded-full bg-volt-200/60 dark:bg-volt-600/25 blur-3xl orb-drift" />
          <div
            className="absolute bottom-[-22%] right-[-12%] w-[55%] h-[60%] rounded-full bg-violet/30 dark:bg-violet/35 blur-3xl orb-drift"
            style={{ animationDelay: '-5s' }}
          />
        </div>
        <div className="grain-layer" aria-hidden />

        <div className="relative mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(2.5rem,6vw,5rem)] pb-[clamp(2rem,4vw,3.5rem)]">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mb-5">
            <span aria-hidden className="w-6 h-px bg-volt-500" />
            {t('eyebrow')}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <span
              aria-hidden
              className="relative inline-flex w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-ink dark:bg-bone text-volt-300 dark:text-ink font-display font-bold text-3xl items-center justify-center -rotate-3"
            >
              {displayName[0]?.toUpperCase() ?? '?'}
              <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-volt-400 ring-2 ring-canvas-sub dark:ring-night-sub" />
            </span>
            <div className="min-w-0 flex-1">
              <h1
                id="profile-hero-title"
                className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
                style={{ fontSize: 'var(--text-display-md)' }}
              >
                @{displayName}
              </h1>
              {user?.bio && (
                <p className="mt-3 text-ink-soft dark:text-bone-soft leading-relaxed max-w-[58ch]">
                  {user.bio}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60">
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-volt-500" />
                  {t('stats.listings', { count: listings.length })}
                </span>
                {listings.some((l) => (l.priceCents ?? 0) === 0) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60">
                    {t('stats.hasFree')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="profile-collection-title"
        className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2.5rem,5vw,4rem)]"
      >
        <div className="flex items-end justify-between gap-4 mb-7">
          <div className="space-y-1.5">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
              <span aria-hidden className="w-5 h-px bg-volt-500" />
              {t('collection.eyebrow')}
            </p>
            <h2
              id="profile-collection-title"
              className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.03em] display-tight"
              style={{ fontSize: 'var(--text-display-sm)' }}
            >
              {t('collection.title', { name: displayName })}
            </h2>
          </div>
        </div>
        {listings.length === 0 ? (
          currentUser?.username === username ? (
            <EmptyState
              emoji="🪺"
              title={t('empty.ownTitle')}
              description={t('empty.ownDescription')}
              action={
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-volt-500 text-ink font-semibold text-sm hover:bg-volt-400 motion-safe:transition ease-expo focus-volt"
                >
                  {t('empty.createCta')}
                </Link>
              }
            />
          ) : (
            <EmptyState emoji="🪺" title={t('empty.title')} description={t('empty.description')} />
          )
        ) : (
          <div className="cards-fluid">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
