import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ArrowRight, Compass } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { listingKey } from '@features/marketplace/queryKeys'
import { api } from '@services/api'
import type { ListingDetailResponse } from '@/types'
import { LISTING_TYPE_META } from '@promptmarket/shared'
import { formatPrice } from '@utils/format'
import { cn } from '@utils/cn'
import { useSpotlight } from '@hooks/useSpotlight'
import StatsStrip from './StatsStrip'

/* ---------------------------------------------------------------------------
 * Hero — editorial asymmetric layout with kinetic typography, cursor-followed
 * spotlight, and a live "drops" marquee. The headline reveals letter-by-letter
 * via the .letter-in animation in index.css.
 * ------------------------------------------------------------------------- */

const HEADLINE_TOKENS: Array<{
  textKey: string
  size: 'condense' | 'tight' | 'wide'
  highlight?: boolean
}> = [
  { textKey: 'hero.headline.verified', size: 'condense' },
  { textKey: 'hero.headline.prompts', size: 'tight' },
  { textKey: 'hero.headline.skills', size: 'tight', highlight: true },
  { textKey: 'hero.headline.and', size: 'wide' },
  { textKey: 'hero.headline.agents', size: 'wide' },
]

interface HeroProps {
  recentItems?: Array<{
    id: string
    slug: string
    title: string
    type: keyof typeof LISTING_TYPE_META
    priceCents: number | null | undefined
    coverEmoji?: string | null
    author?: { username?: string | null } | null
  }>
  recentPending?: boolean
}

export default function Hero({ recentItems, recentPending }: HeroProps) {
  const { t } = useTranslation('home')
  const drops = recentItems ?? []
  const spotlightRef = useSpotlight<HTMLDivElement>()

  return (
    <section ref={spotlightRef} className="spotlight-host relative overflow-hidden isolate">
      {/* Cursor-following lime spotlight, behind everything else */}
      <div className="spotlight -z-10" aria-hidden />

      {/* Ambient mesh — lime, violet, coral orbs */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <div className="absolute top-[-22%] left-[-12%] w-[55%] h-[60%] rounded-full bg-volt-200/60 dark:bg-volt-600/25 blur-3xl orb-drift" />
        <div
          className="absolute top-[8%] right-[-18%] w-[55%] h-[58%] rounded-full bg-violet/30 dark:bg-violet/35 blur-3xl orb-drift"
          style={{ animationDelay: '-5s' }}
        />
        <div
          className="absolute bottom-[-30%] left-[28%] w-[55%] h-[55%] rounded-full bg-coral/25 dark:bg-coral/30 blur-3xl orb-drift"
          style={{ animationDelay: '-9s' }}
        />
      </div>
      <div className="grain-layer" aria-hidden />

      <div className="relative mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(2.5rem,7vw,6rem)] pb-[clamp(3rem,8vw,7rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-[clamp(2rem,5vw,3.5rem)] lg:gap-x-[clamp(1.5rem,3vw,3rem)]">
          {/* Headline column */}
          <div className="lg:col-span-8 xl:col-span-8 min-w-0">
            <div className="flex items-center gap-3 mb-5 animate-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[0.7rem] font-mono uppercase tracking-[0.16em] surface-glass border border-line-strong dark:border-night-line text-ink-soft dark:text-bone-soft">
                <span className="relative inline-flex w-2 h-2 rounded-full bg-volt-500 volt-pulse" />
                {t('hero.badge')}
              </span>
              <RotatingPhrase phrases={timeOfDayPhrases(t)} />
            </div>

            <KineticHeadline t={t} />

            <p
              className="mt-7 max-w-[40ch] text-ink-soft dark:text-bone-soft leading-[1.55] animate-fade-up stagger-3"
              style={{ fontSize: 'var(--text-lead)' }}
            >
              {t('hero.lead')}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up stagger-4">
              <Link
                to="/browse"
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight lift-on-hover focus-volt overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
                />
                <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors motion-safe:duration-300">
                  {t('hero.browseCta')}
                  <ArrowRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link
                to="/sell"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-ink/15 dark:border-bone/20 text-ink dark:text-bone font-medium tracking-tight hover:border-ink dark:hover:border-bone hover:bg-canvas-deep/60 dark:hover:bg-night-sub focus-volt motion-safe:transition"
              >
                <Compass className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:-rotate-12" />
                {t('hero.sellCta')}
              </Link>
              <span className="hidden sm:inline-flex items-center gap-2 ml-2 text-meta text-ink-mute dark:text-bone-mute font-mono">
                <span aria-hidden>↓</span> {t('hero.modelCount')}
              </span>
            </div>

            {/* Tagline strip — mini-marquee that tilts in the brand's tech voice */}
            <div className="mt-12 -mx-[clamp(1.25rem,4vw,3rem)] overflow-hidden animate-fade-up stagger-5">
              <div className="flex items-center gap-10 marquee-track whitespace-nowrap py-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
                {(() => {
                  const words = t('marquee.tagline', { returnObjects: true }) as string[]
                  return [...words, ...words]
                })().map((word, i) => (
                  <span key={i} className="inline-flex items-center gap-10">
                    {word}
                    <span aria-hidden className="w-1 h-1 rounded-full bg-volt-500/60" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Live drops marquee — right column */}
          <aside className="lg:col-span-4 xl:col-span-4 relative min-w-0 animate-fade-up stagger-3">
            <DropsMarquee items={drops} loading={recentPending} t={t} />
          </aside>
        </div>

        {/* StatsStrip — kept, but visually realigned to support the headline */}
        <div className="mt-[clamp(3rem,7vw,5rem)] animate-fade-up stagger-5">
          <StatsStrip />
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
 * Kinetic headline — each word animates in via .letter-in with staggered
 * indices. The "스킬" word gets a lime highlight that draws after the word
 * itself lands.
 * ------------------------------------------------------------------------- */

function KineticHeadline({ t }: { t: TFunction }) {
  return (
    <h1
      className="font-display text-ink dark:text-bone leading-[0.88] tracking-[-0.045em]"
      style={{ fontSize: 'var(--text-display-xl)' }}
    >
      {HEADLINE_TOKENS.map((tok, i) => {
        const text = t(tok.textKey)
        const sizeClass =
          tok.size === 'condense'
            ? 'display-condense'
            : tok.size === 'tight'
              ? 'display-tight'
              : 'display-wide'
        const isFirstInLine =
          i === 0 ||
          i === 1 ||
          i === 3 ||
          (i === 4 && tok.size === 'wide' && HEADLINE_TOKENS[3]?.size !== 'wide')
        // Place "스킬" inline after "프롬프트,"; "그리고" + "에이전트." on their own lines.
        return (
          <span
            key={tok.textKey + i}
            className={cn(
              sizeClass,
              tok.highlight && 'relative inline-block',
              isFirstInLine && 'block',
              !isFirstInLine && i === 2 && 'inline-block ml-[0.25em]',
              !isFirstInLine && i !== 2 && 'inline-block'
            )}
            style={
              {
                animationDelay: `${i * 90}ms`,
              } as React.CSSProperties
            }
          >
            {tok.highlight ? (
              <>
                <span
                  className="relative z-10 letter-in"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  {text}
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-[0.14em] h-[0.42em] bg-volt-300 dark:bg-volt-500/80 -z-0 -skew-x-6 origin-left motion-safe:[animation:letterIn_0.9s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${(i + 1) * 90}ms` } as React.CSSProperties}
                />
              </>
            ) : (
              <span className="letter-in inline-block" style={{ '--i': i } as React.CSSProperties}>
                {text}
              </span>
            )}
          </span>
        )
      })}
    </h1>
  )
}

/* ---------------------------------------------------------------------------
 * Rotating phrase — a small kicker beside the live badge that cycles through
 * a few brand phrases. Subtle but adds a sense of life to the kicker.
 * ------------------------------------------------------------------------- */

/**
 * Pick a kicker rotation based on the visitor's local hour so the same hero
 * feels like it's tracking the day. Morning highlights newness, afternoon
 * leans on momentum, evening surfaces curated picks, late night goes quiet.
 */
function timeOfDayPhrases(t: TFunction): string[] {
  const hour = new Date().getHours()
  let slot: 'morning' | 'afternoon' | 'evening' | 'night'
  if (hour >= 5 && hour < 11) {
    slot = 'morning'
  } else if (hour >= 11 && hour < 17) {
    slot = 'afternoon'
  } else if (hour >= 17 && hour < 22) {
    slot = 'evening'
  } else {
    slot = 'night'
  }
  return t(`hero.phrases.${slot}`, { returnObjects: true }) as string[]
}

function RotatingPhrase({ phrases }: { phrases: string[] }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 2600)
    return () => clearInterval(id)
  }, [phrases.length])
  return (
    <span
      aria-live="polite"
      className="hidden md:inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute"
    >
      <span aria-hidden className="w-3 h-px bg-ink-mute dark:bg-bone-mute" />
      <span
        key={idx}
        className="inline-block motion-safe:[animation:fadeUp_0.6s_cubic-bezier(0.22,1,0.36,1)_both]"
      >
        {phrases[idx]}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------------- */

interface DropsMarqueeProps {
  items: Array<{
    id: string
    slug: string
    title: string
    type: keyof typeof LISTING_TYPE_META
    priceCents: number | null | undefined
    coverEmoji?: string | null
    author?: { username?: string | null } | null
  }>
  loading?: boolean
  t: TFunction
}

function DropsMarquee({ items, loading, t }: DropsMarqueeProps) {
  const seedTitles = [
    t('hero.seed.codeReviewer'),
    t('hero.seed.dataSubagent'),
    t('hero.seed.mcpFilesystem'),
    t('hero.seed.monorepoClaudeMd'),
    t('hero.seed.artDirector'),
    t('hero.seed.cursorSwift'),
  ]
  const seed: DropsMarqueeProps['items'] = items.length
    ? items
    : Array.from({ length: 6 }).map((_, i) => ({
        id: `seed-${i}`,
        slug: `seed-${i}`,
        title: seedTitles[i],
        type: ['SUBAGENT', 'AGENT_MD', 'MCP_SERVER', 'CLAUDE_MD', 'PROMPT', 'CURSOR_RULES'][
          i
        ] as keyof typeof LISTING_TYPE_META,
        priceCents: [499, 0, 0, 299, 1299, 0][i],
        coverEmoji: ['🧑‍⚖️', '📊', '🗂️', '📘', '🎨', '🦅'][i],
        author: { username: ['alex', 'mira', 'kenji', 'lou', 'pia', 'rin'][i] },
      }))

  return (
    <div
      className="relative rounded-3xl overflow-hidden surface-card lift-on-hover spotlight-host"
      style={{ height: 'clamp(22rem, 56vh, 34rem)' }}
    >
      {/* Inner spotlight (different hue) */}
      <div
        className="spotlight"
        aria-hidden
        style={{ ['--spot-color' as string]: 'oklch(0.66 0.24 305 / 0.25)' }}
      />

      {/* Top + bottom fade */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-canvas-sub dark:from-night-sub to-transparent z-10 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-canvas-sub dark:from-night-sub to-transparent z-10 pointer-events-none"
      />

      {/* Header label */}
      <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between text-[0.66rem] font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-volt-500 volt-pulse" />
          {t('hero.drops.title')}
        </span>
        <span>{loading ? t('hero.drops.syncing') : t('hero.drops.live')}</span>
      </div>

      {/* Vertical marquee */}
      <div className="absolute inset-0 pt-12 pb-6">
        <ul className="v-marquee-track flex flex-col gap-2.5">
          {seed.map((drop, idx) => (
            <DropRow key={`${drop.id}-${idx}`} drop={drop} />
          ))}
          {/* Decorative duplicate for seamless scroll — hidden from a11y tree */}
          <div aria-hidden="true">
            {seed.map((drop, idx) => (
              <DropRow key={`dup-${drop.id}-${idx}`} drop={drop} tabIndex={-1} />
            ))}
          </div>
        </ul>
      </div>
    </div>
  )
}

function DropRow({
  drop,
  tabIndex,
}: {
  drop: DropsMarqueeProps['items'][number]
  tabIndex?: number
}) {
  const meta = LISTING_TYPE_META[drop.type]
  const free = (drop.priceCents ?? 0) === 0
  const qc = useQueryClient()
  // Seed entries (no real id, fake slug) shouldn't trigger prefetches —
  // they'd just 404 against the API and waste a request.
  const realSlug = drop.id.startsWith('seed-') ? null : drop.slug
  const prefetch = () => {
    if (!realSlug) return
    if (qc.getQueryData(listingKey(realSlug)) != null) return
    qc.prefetchQuery({
      queryKey: listingKey(realSlug),
      queryFn: () => api.get<ListingDetailResponse, ListingDetailResponse>(`/listings/${realSlug}`),
      staleTime: 60_000,
    })
  }
  return (
    <li className="mx-3.5">
      <Link
        to={`/listings/${drop.slug}`}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        tabIndex={tabIndex}
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-line/60 dark:border-night-line/60 bg-canvas/70 dark:bg-night/40 hover:bg-canvas-deep/80 dark:hover:bg-night-deep/80 hover:border-volt-300 dark:hover:border-volt-500/50 motion-safe:transition-colors"
      >
        <span
          aria-hidden
          className={cn(
            'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br motion-safe:transition-transform motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6',
            meta.gradient
          )}
        >
          {drop.coverEmoji || meta.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink dark:text-bone truncate leading-tight">
            {drop.title}
          </p>
          <p className="mt-0.5 text-[0.66rem] font-mono uppercase tracking-[0.14em] text-ink-mute dark:text-bone-mute truncate">
            {meta.label.toLowerCase()}
            {drop.author?.username && ` · @${drop.author.username}`}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-[0.68rem] font-mono px-2 py-0.5 rounded-full',
            free ? 'bg-volt-300 text-ink' : 'bg-ink text-bone dark:bg-bone dark:text-ink'
          )}
        >
          {formatPrice(drop.priceCents ?? 0)}
        </span>
      </Link>
    </li>
  )
}
