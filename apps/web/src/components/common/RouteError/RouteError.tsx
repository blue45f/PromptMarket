import { useTranslation } from 'react-i18next'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

export default function RouteError() {
  const { t } = useTranslation('errors')
  const error = useRouteError()
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : t('route.title')
  const message = error instanceof Error ? error.message : t('route.fallbackMessage')

  return (
    <main className="min-h-screen text-ink dark:text-bone flex items-center justify-center px-[clamp(1.25rem,4vw,3rem)]">
      <section className="w-full max-w-lg rounded-3xl border border-line dark:border-night-line surface-card p-8 shadow-xl shadow-ink/5 dark:shadow-black/30">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-coral-deep dark:text-coral inline-flex items-center gap-2">
          <span aria-hidden className="w-5 h-px bg-coral" />
          {t('route.eyebrow')}
        </p>
        <h1 className="mt-3 font-display text-[1.8rem] font-bold tracking-[-0.03em] leading-tight">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft dark:text-bone-soft">{message}</p>
        <Link
          to="/"
          className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink px-5 py-2.5 text-sm font-semibold focus-volt lift-on-hover"
        >
          {t('route.home')}
          <span aria-hidden>→</span>
        </Link>
      </section>
    </main>
  )
}
