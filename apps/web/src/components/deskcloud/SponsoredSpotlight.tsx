/**
 * SponsoredSpotlight — NATIVE AdDesk rail (PromptMarket / apps/web).
 * ──────────────────────────────────────────────────────────────────────────
 * A mobile-first, swipeable "추천 / Sponsored" carousel backed by the live
 * AdDesk via the PUBLISHED SDK (`createAdClient`, `pk_`). It serves one creative
 * per configured slot (see `adHomeSlots`), renders the ones that return an
 * active creative with the app's OWN OKLCH tokens + Embla for touch-drag, and
 * tracks a real impression (once a card is ≥50% on screen) and clicks.
 *
 * Fully env-gated + reversible: renders NOTHING when `VITE_ADDESK_URL` is unset
 * (no client) or when no slot returns a creative — so it never leaves an empty
 * box on the home page. One section, low complexity, swipe-native on mobile.
 *
 * a11y: each card is a labelled link · honest "AD" disclosure (rel="sponsored")
 * · Embla dots are real buttons with aria-current · motion-safe transitions ·
 * decorative layers aria-hidden.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { type ServeResult } from '@heejun/deskcloud'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowUpRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { adHomeSlots, getAdClient } from './config'

/** A served creative we actually render (image + link guaranteed present). */
type Creative = ServeResult & { creativeId: string; imageUrl: string }

export default function SponsoredSpotlight() {
  const { i18n } = useTranslation()
  const ko = i18n.resolvedLanguage === 'ko'
  const copy = ko
    ? {
        chapter: '추천',
        title: '스폰서 스포트라이트',
        ad: 'AD',
        cta: '보러가기',
        region: '스폰서 추천',
      }
    : {
        chapter: 'Sponsored',
        title: 'Spotlight',
        ad: 'AD',
        cta: 'Learn more',
        region: 'Sponsored spotlight',
      }

  const [creatives, setCreatives] = useState<Creative[]>([])
  const tracked = useRef<Set<string>>(new Set())

  // Serve every configured slot once; keep only those with an active creative,
  // de-duped by creativeId. A client only exists when VITE_ADDESK_URL is set.
  useEffect(() => {
    const client = getAdClient()
    if (!client || adHomeSlots.length === 0) return
    const ctrl = new AbortController()
    let cancelled = false
    Promise.allSettled(adHomeSlots.map((slot) => client.serve({ slot, signal: ctrl.signal }))).then(
      (settled) => {
        if (cancelled) return
        const seen = new Set<string>()
        const next: Creative[] = []
        for (const r of settled) {
          if (r.status !== 'fulfilled') continue
          const ad = r.value
          if (ad.served && ad.creativeId && ad.imageUrl && !seen.has(ad.creativeId)) {
            seen.add(ad.creativeId)
            next.push(ad as Creative)
          }
        }
        setCreatives(next)
      }
    )
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [])

  const trackImpression = useCallback((creativeId: string) => {
    if (tracked.current.has(creativeId)) return
    tracked.current.add(creativeId)
    const client = getAdClient()
    void client?.trackImpression(creativeId).catch(() => {})
  }, [])

  const onClick = useCallback((creativeId: string) => {
    const client = getAdClient()
    void client?.trackClick(creativeId).catch(() => {})
  }, [])

  // Nothing to show — stay out of the way (dormant or no fill).
  if (creatives.length === 0) return null

  return (
    <section aria-label={copy.region} className="reveal" data-revealed="true">
      <div className="mb-7 flex items-end justify-between gap-3 lg:mb-9">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
            <span aria-hidden className="h-px w-6 bg-volt-500" />
            {copy.chapter}
          </p>
          <h2
            className="font-display font-bold leading-[0.95] tracking-[-0.03em] text-ink display-tight dark:text-bone"
            style={{ fontSize: 'var(--text-display-sm)' }}
          >
            {copy.title}
          </h2>
        </div>
      </div>

      <SpotlightCarousel
        creatives={creatives}
        copy={copy}
        onImpression={trackImpression}
        onClick={onClick}
      />
    </section>
  )
}

function SpotlightCarousel({
  creatives,
  copy,
  onImpression,
  onClick,
}: {
  creatives: Creative[]
  copy: { ad: string; cta: string }
  onImpression: (creativeId: string) => void
  onClick: (creativeId: string) => void
}) {
  const many = creatives.length > 1
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    active: many, // a single creative needs no drag/scroll
  })
  const [selected, setSelected] = useState(0)
  const [snaps, setSnaps] = useState<number[]>([])

  useEffect(() => {
    if (!emblaApi) return
    const update = () => {
      setSnaps(emblaApi.scrollSnapList())
      setSelected(emblaApi.selectedScrollSnap())
    }
    emblaApi.on('select', update).on('reInit', update)
    // Defer the initial sync out of the effect body (rule: no sync setState in effect).
    const raf = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(raf)
      emblaApi.off('select', update).off('reInit', update)
    }
  }, [emblaApi])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <ul className="flex gap-4 lg:gap-5">
          {creatives.map((c) => (
            <li
              key={c.creativeId}
              className="min-w-0 flex-[0_0_86%] sm:flex-[0_0_58%] lg:flex-[0_0_calc(33.333%-0.834rem)]"
            >
              <SpotlightCard
                creative={c}
                copy={copy}
                onImpression={onImpression}
                onClick={onClick}
              />
            </li>
          ))}
        </ul>
      </div>

      {many && snaps.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="spotlight">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selected}
              aria-current={i === selected ? 'true' : undefined}
              aria-label={`${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cnDot(i === selected)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function cnDot(active: boolean): string {
  return [
    'h-1.5 rounded-full motion-safe:transition-all ease-expo focus-volt',
    active
      ? 'w-5 bg-ink dark:bg-bone'
      : 'w-1.5 bg-ink/25 hover:bg-ink/40 dark:bg-bone/25 dark:hover:bg-bone/40',
  ].join(' ')
}

function SpotlightCard({
  creative,
  copy,
  onImpression,
  onClick,
}: {
  creative: Creative
  copy: { ad: string; cta: string }
  onImpression: (creativeId: string) => void
  onClick: (creativeId: string) => void
}) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  const { creativeId } = creative

  // Real impression: fire once the card is at least half on screen.
  useEffect(() => {
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      onImpression(creativeId)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            onImpression(creativeId)
            io.disconnect()
          }
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [el, creativeId, onImpression])

  const cardClass =
    'group relative block overflow-hidden rounded-[1.4rem] border border-line bg-canvas-sub focus-volt motion-safe:transition ease-expo dark:border-night-line dark:bg-night-sub lift-on-hover'

  const inner = (
    <>
      <div className="aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
        <img
          src={creative.imageUrl}
          alt={creative.alt ?? ''}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover motion-safe:transition-transform ease-expo motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
        />
      </div>

      {/* AD disclosure — honest, unobtrusive */}
      <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-bone backdrop-blur-sm dark:bg-bone/70 dark:text-ink">
        {copy.ad}
      </span>

      {creative.linkUrl && (
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-canvas/90 px-2.5 py-1 text-[0.72rem] font-medium text-ink opacity-0 backdrop-blur-sm motion-safe:transition ease-expo motion-safe:translate-y-1 group-hover:opacity-100 motion-safe:group-hover:translate-y-0 dark:bg-night/90 dark:text-bone">
          {copy.cta}
          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  )

  if (creative.linkUrl) {
    return (
      <a
        ref={setEl}
        href={creative.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => onClick(creativeId)}
        className={cardClass}
      >
        {inner}
      </a>
    )
  }
  return (
    <div ref={setEl} className={cardClass}>
      {inner}
    </div>
  )
}
