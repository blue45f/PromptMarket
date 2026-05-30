import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useSpotlight } from '@hooks/useSpotlight'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  kicker: string
  title: ReactNode
  highlight: ReactNode
  description: ReactNode
  /** The form column. */
  children: ReactNode
  /** Footer line, e.g. the switch-to-login / switch-to-register prompt. */
  altPrompt: ReactNode
}

/* ---------------------------------------------------------------------------
 * AuthLayout — split layout shared by Login and Register. Left column holds
 * the form on a clean canvas; right column is the brand surface with ambient
 * mesh + value props.
 * ------------------------------------------------------------------------- */

export default function AuthLayout({
  kicker,
  title,
  highlight,
  description,
  children,
  altPrompt,
}: AuthLayoutProps) {
  const { t } = useTranslation('auth')
  const spotlightRef = useSpotlight<HTMLDivElement>()

  return (
    <div className="animate-fade-in min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-[1280px] grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-14 px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,5vw,4rem)]">
        {/* Form column */}
        <section aria-labelledby="auth-page-heading" className="flex flex-col justify-center gap-7">
          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start text-[0.78rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone motion-safe:transition ease-expo focus-volt"
          >
            <span aria-hidden>←</span> {t('common.backToCatalog')}
          </Link>
          <header className="space-y-3">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
              <span aria-hidden className="w-6 h-px bg-volt-500" />
              {kicker}
            </p>
            <h1
              id="auth-page-heading"
              className="font-display font-bold text-ink dark:text-bone leading-[0.92] tracking-[-0.035em] display-tight"
              style={{ fontSize: 'var(--text-display-md)' }}
            >
              {title}
            </h1>
            <p className="text-ink-soft dark:text-bone-soft leading-relaxed max-w-[44ch]">
              {description}
            </p>
          </header>
          <div className="rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 sm:p-7">
            {children}
          </div>
          <p className="text-[0.92rem] text-ink-mute dark:text-bone-mute">{altPrompt}</p>
        </section>

        {/* Brand column */}
        <aside
          ref={spotlightRef}
          aria-label={t('authLayout.previewLabel', { defaultValue: '미리보기' })}
          className="spotlight-host relative overflow-hidden rounded-[2rem] surface-card border-line dark:border-night-line min-h-[24rem]"
        >
          <div
            className="spotlight"
            aria-hidden
            style={{ ['--spot-color' as string]: 'oklch(0.83 0.23 124 / 0.22)' }}
          />
          <div aria-hidden className="absolute inset-0 -z-0">
            <div className="absolute top-[-20%] left-[-12%] w-[60%] h-[60%] rounded-full bg-volt-200/60 dark:bg-volt-600/25 blur-3xl orb-drift" />
            <div
              className="absolute bottom-[-22%] right-[-14%] w-[55%] h-[55%] rounded-full bg-violet/30 dark:bg-violet/35 blur-3xl orb-drift"
              style={{ animationDelay: '-5s' }}
            />
          </div>
          <div className="grain-layer" aria-hidden />
          <div className="relative h-full flex flex-col justify-between gap-8 p-7 sm:p-10">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-volt-500 volt-pulse" />
                {t('panel.badge')}
              </p>
              <p
                className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
                style={{ fontSize: 'var(--text-display-md)' }}
              >
                {highlight}
              </p>
            </div>
            <ul className="space-y-3 text-[0.95rem]">
              {[
                [t('panel.stats.payoutValue'), t('panel.stats.payoutLabel')],
                [t('panel.stats.artifactsValue'), t('panel.stats.artifactsLabel')],
                [t('panel.stats.modelsValue'), t('panel.stats.modelsLabel')],
              ].map(([n, l]) => (
                <li key={l} className="flex items-baseline gap-3 text-ink-soft dark:text-bone-soft">
                  <span className="font-mono font-semibold text-volt-700 dark:text-volt-300 w-12 shrink-0">
                    {n}
                  </span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
            <div className="inline-flex items-center gap-2 text-[0.78rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              {t('panel.browsePrefix')}
              <Link
                to="/browse"
                className="text-ink dark:text-bone hover:underline inline-flex items-center gap-0.5"
              >
                {t('panel.browseLink')}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              {t('panel.browseSuffix')}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
