import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import Navbar from './Navbar'
import CommandPalette from '@components/CommandPalette'
import ShortcutsOverlay from '@components/ShortcutsOverlay'
import ScrollToTop from '@components/ScrollToTop'
import { useMe, useStats } from '@features/marketplace/queries'
import { useNavShortcuts } from '@hooks/useNavShortcuts'
import { useSpotlight } from '@hooks/useSpotlight'
import { useReveal } from '@hooks/useReveal'
import { useCountUp } from '@hooks/useCountUp'
import { formatCompact } from '@utils/format'

export default function Layout() {
  // Triggers the /auth/me query when a token is present and syncs the user
  // into the zustand store via the queryFn's side-effect.
  useMe()
  // Two-key navigation sequences (g h, g b, g d, g s, g l)
  useNavShortcuts()
  const { t } = useTranslation('nav')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link — first focusable element; lets keyboard users jump past
          the nav straight to the page content. Hidden until focused. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:inline-flex focus:items-center focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-ink focus:text-bone focus:dark:bg-bone focus:dark:text-ink focus:font-medium focus:text-sm focus:shadow-xl focus-volt"
      >
        {t('skipToContent')}
      </a>
      <Navbar />
      <CommandPalette />
      <ShortcutsOverlay />
      <ScrollToTop />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

function SiteFooter() {
  const { t } = useTranslation('nav')
  const spotlightRef = useSpotlight<HTMLElement>()
  const { ref: wordmarkRef, revealed } = useReveal<HTMLDivElement>()
  return (
    <footer
      ref={spotlightRef}
      className="spotlight-host relative isolate mt-[clamp(4rem,8vw,8rem)] bg-ink text-bone overflow-hidden"
    >
      <div
        className="spotlight"
        aria-hidden
        style={{ ['--spot-color' as string]: 'oklch(0.83 0.23 124 / 0.18)' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(at 10% 0%, oklch(0.5 0.18 130 / 0.3) 0, transparent 55%), radial-gradient(at 90% 0%, oklch(0.55 0.22 305 / 0.25) 0, transparent 55%)',
        }}
      />
      <div className="grain-layer" aria-hidden style={{ opacity: 0.18, mixBlendMode: 'overlay' }} />

      <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pt-16 pb-8">
        <FooterLiveStats />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-10">
          {/* Left: link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10 text-sm">
            <FooterCol
              chapter="01"
              title={t('footer.col.marketplace')}
              links={[
                { to: '/browse', label: t('footer.links.browseAll') },
                { to: '/browse?sort=trending', label: t('footer.links.trending') },
                { to: '/browse?sort=newest', label: t('footer.links.newest') },
                { to: '/browse?free=true', label: t('footer.links.free') },
              ]}
            />
            <FooterCol
              chapter="02"
              title={t('footer.col.sell')}
              links={[
                { to: '/sell', label: t('footer.links.registerPrompt') },
                { to: '/sell', label: t('footer.links.registerSkill') },
                { to: '/sell', label: t('footer.links.registerMcp') },
                { to: '/dashboard', label: t('footer.links.dashboard') },
              ]}
            />
            <FooterCol
              chapter="03"
              title={t('footer.col.account')}
              links={[
                { to: '/login', label: t('footer.links.login') },
                { to: '/register', label: t('footer.links.register') },
                { to: '/dashboard', label: t('footer.links.library') },
              ]}
            />
            <FooterCol
              chapter="04"
              title={t('footer.col.models')}
              links={[
                { to: '/browse?vendor=Anthropic', label: 'Anthropic' },
                { to: '/browse?vendor=OpenAI', label: 'OpenAI' },
                { to: '/browse?vendor=Google', label: 'Google' },
                { to: '/browse?vendor=Meta', label: 'Meta' },
              ]}
            />
          </div>

          {/* Right: subscribe / about */}
          <div className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-bone/15 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-volt-300">
              <span className="w-1.5 h-1.5 rounded-full bg-volt-500 volt-pulse" />
              {t('footer.anthology')}
            </div>
            <p className="text-bone-soft text-[1.05rem] leading-relaxed max-w-[44ch]">
              {t('footer.about')}
            </p>
            <Link
              to="/sell"
              className="self-start group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-volt-300 text-ink font-medium tracking-tight lift-on-hover focus-volt"
            >
              {t('footer.registerCta')}
              <ArrowUpRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* Mega wordmark — solid bone, with a lime hairline drawn beneath. */}
        <div
          ref={wordmarkRef}
          data-revealed={revealed}
          className="reveal relative mt-14 lg:mt-20 -mb-2 lg:-mb-4 overflow-hidden"
        >
          <p
            aria-hidden
            className="font-display font-bold leading-none tracking-[-0.06em] display-condense whitespace-nowrap select-none text-bone"
            style={{ fontSize: 'clamp(4rem, 18vw, 18rem)' }}
          >
            PromptMarket
          </p>
          <span
            aria-hidden
            className="absolute left-0 right-0 bottom-[6%] h-[clamp(0.4rem,1vw,1rem)] bg-volt-400 origin-left scale-x-0 motion-safe:[transition:transform_1.2s_cubic-bezier(0.16,1,0.3,1)]"
            data-bar
          />
        </div>

        {/* Bottom strip */}
        <div className="mt-8 pt-6 border-t border-bone/15 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-[0.78rem] font-mono uppercase tracking-[0.14em] text-bone-mute">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-volt-300 text-ink font-display font-bold -rotate-3 text-xs"
            >
              P
            </span>
            <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          </div>
          <p className="text-bone-mute">{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterLiveStats() {
  const { t } = useTranslation('nav')
  const { data } = useStats()
  const totalListings = data?.totalListings ?? 0
  const totalDownloads = data?.totalDownloads ?? 0
  const totalCreators = data?.totalCreators ?? 0
  const a = useCountUp(totalListings)
  const b = useCountUp(totalDownloads)
  const c = useCountUp(totalCreators)
  return (
    <div className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <FooterStat refEl={a.ref} value={a.value} label={t('stats.listings')} dot="bg-volt-400" />
      <FooterStat refEl={b.ref} value={b.value} label={t('stats.downloads')} dot="bg-violet" />
      <FooterStat refEl={c.ref} value={c.value} label={t('stats.makers')} dot="bg-coral" />
    </div>
  )
}

function FooterStat({
  refEl,
  value,
  label,
  dot,
}: {
  refEl: React.RefObject<HTMLElement | null>
  value: number
  label: string
  dot: string
}) {
  return (
    <div
      ref={refEl as React.RefObject<HTMLDivElement>}
      className="rounded-2xl border border-bone/10 bg-bone/[0.04] px-5 py-4 flex items-baseline gap-4"
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${dot} volt-pulse shrink-0 translate-y-[-2px]`}
      />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bone-mute">
          {label}
        </p>
        <p
          className="font-mono font-bold text-bone tabular-nums tracking-[-0.02em] leading-none mt-1"
          style={{ fontSize: 'clamp(1.4rem, 1.5vw + 0.9rem, 1.85rem)' }}
        >
          {formatCompact(value)}
        </p>
      </div>
    </div>
  )
}

function FooterCol({
  chapter,
  title,
  links,
}: {
  chapter: string
  title: string
  links: Array<{ to: string; label: string }>
}) {
  return (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-volt-300/80">
          {chapter}
        </p>
        <p className="font-display font-bold text-bone tracking-tight">{title}</p>
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              className="group inline-flex items-center gap-1 text-bone-soft hover:text-volt-300 motion-safe:transition"
            >
              {l.label}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 motion-safe:transition motion-safe:group-hover:opacity-100 motion-safe:group-hover:translate-x-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
