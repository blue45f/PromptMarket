import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Compass, Search, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '@hooks/usePageMeta'
import { useSpotlight } from '@hooks/useSpotlight'
import RecentlyViewed from '@components/RecentlyViewed'

const SUGGESTIONS: Array<{
  to: string
  key: string
  icon: typeof Compass
}> = [
  { to: '/browse', key: 'browse', icon: Compass },
  { to: '/browse?sort=trending', key: 'trending', icon: Sparkles },
  { to: '/browse?sort=newest', key: 'newest', icon: Sparkles },
  { to: '/browse?free=true', key: 'free', icon: Sparkles },
]

export default function NotFoundPage() {
  const location = useLocation()
  const spotlightRef = useSpotlight<HTMLDivElement>()
  const { t } = useTranslation('errors')

  usePageMeta({
    title: t('notFound.metaTitle'),
    description: t('notFound.metaDescription'),
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-status', '404')
    return () => document.documentElement.removeAttribute('data-status')
  }, [])

  function openPalette() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <div className="animate-fade-in">
      <section ref={spotlightRef} className="spotlight-host relative overflow-hidden isolate">
        <div className="spotlight -z-10" aria-hidden />

        <div aria-hidden className="absolute inset-0 -z-20">
          <div className="absolute top-[-22%] left-[-12%] w-[55%] h-[60%] rounded-full bg-volt-200/60 dark:bg-volt-600/25 blur-3xl orb-drift" />
          <div
            className="absolute bottom-[-22%] right-[-12%] w-[55%] h-[60%] rounded-full bg-violet/30 dark:bg-violet/35 blur-3xl orb-drift"
            style={{ animationDelay: '-5s' }}
          />
        </div>
        <div className="grain-layer" aria-hidden />

        <div className="relative mx-auto max-w-[1024px] px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(3rem,9vw,7rem)] pb-[clamp(2rem,5vw,4rem)]">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
            <span aria-hidden className="w-6 h-px bg-volt-500" />
            {t('notFound.eyebrow', { path: location.pathname })}
          </p>
          <h1
            className="mt-5 font-display font-bold text-ink dark:text-bone leading-[0.88] tracking-[-0.045em] display-condense"
            style={{ fontSize: 'var(--text-display-xl)' }}
          >
            <span className="block">{t('notFound.headlineLine1')}</span>
            <span className="block">
              {t('notFound.headlineLine2Prefix')}{' '}
              <span className="relative inline-block">
                <span className="relative z-10">{t('notFound.headlineHighlight')}</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-[0.14em] h-[0.42em] bg-volt-300 dark:bg-volt-500/80 -z-0 -skew-x-6"
                />
              </span>
              .
            </span>
          </h1>
          <p
            className="mt-7 max-w-[44ch] text-ink-soft dark:text-bone-soft leading-[1.55]"
            style={{ fontSize: 'var(--text-lead)' }}
          >
            {t('notFound.body')}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight lift-on-hover focus-volt"
            >
              {t('notFound.home')}
              <ArrowUpRight
                aria-hidden
                className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              />
            </Link>
            <button
              type="button"
              onClick={openPalette}
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone font-medium tracking-tight hover:border-ink dark:hover:border-bone hover:bg-canvas-deep/60 dark:hover:bg-night-sub motion-safe:transition ease-expo focus-volt"
            >
              <Search
                aria-hidden
                className="w-4 h-4 motion-safe:transition-transform ease-expo motion-safe:group-hover:scale-110"
              />
              {t('notFound.openPalette')}
              <kbd className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded border border-line dark:border-night-line bg-canvas-deep/60 dark:bg-night-deep/60 font-mono text-[0.66rem]">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1024px] px-[clamp(1.25rem,4vw,3rem)] pb-[clamp(3rem,7vw,6rem)] space-y-[clamp(2.5rem,5vw,4rem)]">
        <section>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mb-4">
            <span aria-hidden className="w-6 h-px bg-volt-500" />
            {t('notFound.suggestionsEyebrow')}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUGGESTIONS.map((s) => (
              <li key={s.to}>
                <Link
                  to={s.to}
                  className="group flex items-center gap-3 p-4 rounded-2xl border border-line dark:border-night-line bg-canvas-sub/60 dark:bg-night-sub/60 hover:border-volt-400 dark:hover:border-volt-500/40 hover:bg-canvas-deep/60 dark:hover:bg-night-deep/60 motion-safe:transition ease-expo focus-volt"
                >
                  <span
                    aria-hidden
                    className="shrink-0 inline-flex w-10 h-10 rounded-xl bg-ink text-volt-300 dark:bg-volt-300 dark:text-ink items-center justify-center"
                  >
                    <s.icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-semibold text-ink dark:text-bone tracking-tight">
                      {t(`notFound.suggestions.${s.key}.label`)}
                    </span>
                    <span className="block text-[0.78rem] text-ink-mute dark:text-bone-mute">
                      {t(`notFound.suggestions.${s.key}.hint`)}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="w-4 h-4 text-ink-mute dark:text-bone-mute motion-safe:transition ease-expo motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <RecentlyViewed />
      </div>
    </div>
  )
}
