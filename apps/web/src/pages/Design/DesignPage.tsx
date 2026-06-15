import Spinner from '@components/Spinner'
import StarRating from '@components/StarRating'
import ThemeToggle from '@components/ThemeToggle'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Label,
  Skeleton,
  Textarea,
  type BadgeTone,
  type ButtonSize,
  type ButtonVariant,
} from '@components/ui'
import { usePageMeta } from '@hooks/usePageMeta'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@utils/cn'
import { Compass, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

/* ===========================================================================
 * /design — PromptMarket living design system.
 *
 * An in-app style guide that renders THIS project's real OKLCH tokens and the
 * actual Radix/shadcn-style component kit, resolving every colour value at
 * runtime via getComputedStyle so the swatches never drift from index.css.
 *
 * Deliberately language-agnostic (literal English) — it's an internal design
 * surface, not a localized product page, so it stays out of the i18n bundles.
 * ======================================================================== */

const SECTIONS = [
  { id: 'foundations-color', label: 'Color' },
  { id: 'foundations-type', label: 'Typography' },
  { id: 'foundations-space', label: 'Spacing' },
  { id: 'foundations-radii', label: 'Radii' },
  { id: 'foundations-elevation', label: 'Elevation' },
  { id: 'foundations-motion', label: 'Motion' },
  { id: 'components-buttons', label: 'Buttons' },
  { id: 'components-forms', label: 'Forms' },
  { id: 'components-feedback', label: 'Feedback' },
  { id: 'components-overlays', label: 'Overlays' },
  { id: 'components-signature', label: 'Signature' },
] as const

export default function DesignPage() {
  usePageMeta({
    title: 'Design System — PromptMarket',
    description:
      'The living style guide for PromptMarket: electric-editorial OKLCH tokens, fluid type, and the real component kit.',
  })

  const activeId = useScrollSpy(SECTIONS.map((s) => s.id))

  return (
    <div className="animate-fade-in">
      <DesignHeader />

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-x-10 px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[14rem_minmax(0,1fr)]">
        <SectionNav activeId={activeId} />

        <main className="min-w-0 space-y-[clamp(3.5rem,7vw,6rem)]">
          <ColorSection />
          <TypographySection />
          <SpacingSection />
          <RadiiSection />
          <ElevationSection />
          <MotionSection />
          <ButtonsSection />
          <FormsSection />
          <FeedbackSection />
          <OverlaysSection />
          <SignatureSection />
        </main>
      </div>
    </div>
  )
}

/* ---------- Header ----------------------------------------------------- */

function DesignHeader() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line dark:border-night-line">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(at 12% 10%, oklch(0.92 0.18 122 / 0.45) 0, transparent 52%), radial-gradient(at 88% 6%, oklch(0.66 0.24 305 / 0.22) 0, transparent 50%)',
        }}
      />
      <div className="grain-layer" aria-hidden />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-[clamp(1.25rem,4vw,3rem)] pb-[clamp(2.5rem,5vw,4rem)] pt-[clamp(2.5rem,5vw,4rem)] sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[60ch]">
          <p className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
            <span aria-hidden className="h-px w-6 bg-volt-500" />
            PromptMarket
          </p>
          <h1
            className="mt-3 font-display font-bold leading-[0.9] tracking-[-0.04em] text-ink display-condense dark:text-bone"
            style={{ fontSize: 'var(--text-display-lg)', textWrap: 'balance' }}
          >
            Design System
          </h1>
          <p
            className="mt-5 max-w-[58ch] leading-[1.55] text-ink-soft dark:text-bone-soft"
            style={{ fontSize: 'var(--text-lead)', textWrap: 'pretty' }}
          >
            A living reference for the electric-editorial surface — OKLCH tokens, fluid type, motion
            and the real Radix-backed component kit, rendered straight from the running app.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
            Theme
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

/* ---------- Sticky in-page nav ----------------------------------------- */

function SectionNav({ activeId }: { activeId: string | null }) {
  return (
    <nav aria-label="Design system sections" className="mb-10 lg:sticky lg:top-24 lg:mb-0 lg:h-fit">
      <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
        On this page
      </p>
      <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
        {SECTIONS.map((s) => {
          const active = activeId === s.id
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1.5 text-[0.82rem] tracking-tight motion-safe:transition ease-expo focus-volt lg:rounded-lg lg:px-3',
                  active
                    ? 'bg-ink font-medium text-bone dark:bg-bone dark:text-ink'
                    : 'text-ink-soft hover:bg-canvas-sub hover:text-ink dark:text-bone-soft dark:hover:bg-night-sub dark:hover:text-bone'
                )}
              >
                {s.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ---------- Section scaffolding ---------------------------------------- */

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <header className="mb-7 border-b border-line pb-5 dark:border-night-line">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
          {eyebrow}
        </p>
        <h2
          id={`${id}-h`}
          className="mt-2 font-display font-bold leading-[0.98] tracking-[-0.03em] text-ink display-tight dark:text-bone"
          style={{ fontSize: 'var(--text-display-sm)', textWrap: 'balance' }}
        >
          {title}
        </h2>
        {intro && (
          <p className="mt-3 max-w-[68ch] leading-relaxed text-ink-soft dark:text-bone-soft">
            {intro}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}

/** A labelled specimen tile: the demo on top, a monospace caption beneath. */
function Specimen({
  caption,
  className,
  children,
}: {
  caption: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex min-h-24 flex-wrap items-center gap-4 rounded-2xl border border-line bg-canvas-sub p-5 dark:border-night-line dark:bg-night-sub">
        {children}
      </div>
      <p className="font-mono text-[0.72rem] leading-snug text-ink-mute dark:text-bone-mute">
        {caption}
      </p>
    </div>
  )
}

/* ===========================================================================
 * FOUNDATIONS — Color
 * ======================================================================== */

type Swatch = { name: string; varName: string; onLight?: 'ink' | 'bone' }

const COLOR_GROUPS: Array<{ label: string; note: string; swatches: Swatch[] }> = [
  {
    label: 'Volt — primary',
    note: 'The electric chartreuse voice. Carries focus rings, live indicators and affirmative accents.',
    swatches: [
      { name: 'volt-100', varName: '--color-volt-100', onLight: 'ink' },
      { name: 'volt-200', varName: '--color-volt-200', onLight: 'ink' },
      { name: 'volt-300', varName: '--color-volt-300', onLight: 'ink' },
      { name: 'volt-400', varName: '--color-volt-400', onLight: 'ink' },
      { name: 'volt-500', varName: '--color-volt-500', onLight: 'ink' },
      { name: 'volt-700', varName: '--color-volt-700', onLight: 'bone' },
      { name: 'volt-800', varName: '--color-volt-800', onLight: 'bone' },
      { name: 'volt-900', varName: '--color-volt-900', onLight: 'bone' },
    ],
  },
  {
    label: 'Accents — Coral · Violet · Iris',
    note: 'Purposeful chroma: coral for destructive/free, violet as secondary, iris as tertiary.',
    swatches: [
      { name: 'coral', varName: '--color-coral', onLight: 'bone' },
      { name: 'coral-deep', varName: '--color-coral-deep', onLight: 'bone' },
      { name: 'violet', varName: '--color-violet', onLight: 'bone' },
      { name: 'violet-deep', varName: '--color-violet-deep', onLight: 'bone' },
      { name: 'iris', varName: '--color-iris', onLight: 'bone' },
      { name: 'iris-deep', varName: '--color-iris-deep', onLight: 'bone' },
    ],
  },
  {
    label: 'Surfaces & Ink',
    note: 'Warm cream above cosmic ink — no pure white, no pure black. Every neutral is tinted.',
    swatches: [
      { name: 'canvas', varName: '--color-canvas', onLight: 'ink' },
      { name: 'canvas-sub', varName: '--color-canvas-sub', onLight: 'ink' },
      { name: 'canvas-deep', varName: '--color-canvas-deep', onLight: 'ink' },
      { name: 'line', varName: '--color-line', onLight: 'ink' },
      { name: 'ink', varName: '--color-ink', onLight: 'bone' },
      { name: 'ink-soft', varName: '--color-ink-soft', onLight: 'bone' },
      { name: 'ink-mute', varName: '--color-ink-mute', onLight: 'bone' },
    ],
  },
  {
    label: 'Night surfaces',
    note: 'Magenta-charcoal dark canvas — these read as brand surfaces, not zinc-black.',
    swatches: [
      { name: 'night', varName: '--color-night', onLight: 'bone' },
      { name: 'night-sub', varName: '--color-night-sub', onLight: 'bone' },
      { name: 'night-deep', varName: '--color-night-deep', onLight: 'bone' },
      { name: 'night-line', varName: '--color-night-line', onLight: 'bone' },
      { name: 'bone', varName: '--color-bone', onLight: 'ink' },
      { name: 'bone-soft', varName: '--color-bone-soft', onLight: 'ink' },
      { name: 'bone-mute', varName: '--color-bone-mute', onLight: 'ink' },
    ],
  },
]

function ColorSection() {
  const resolved = useResolvedVars(COLOR_GROUPS.flatMap((g) => g.swatches.map((s) => s.varName)))

  return (
    <Section
      id="foundations-color"
      eyebrow="Foundations"
      title="Color"
      intro="OKLCH-first, tinted toward the violet-magenta axis. Each swatch resolves its computed value at runtime, so this chart can never drift from the source tokens."
    >
      <div className="space-y-9">
        {COLOR_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-3.5">
              <h3 className="font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
                {group.label}
              </h3>
              <p className="mt-1 max-w-[64ch] text-[0.85rem] leading-relaxed text-ink-soft dark:text-bone-soft">
                {group.note}
              </p>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] gap-3">
              {group.swatches.map((s) => (
                <li
                  key={s.name}
                  className="overflow-hidden rounded-xl border border-line dark:border-night-line"
                >
                  <div
                    className="flex h-16 items-end justify-end p-2"
                    style={{ background: `var(${s.varName})` }}
                  >
                    <span
                      className={cn(
                        'font-mono text-[0.6rem] tabular-nums',
                        s.onLight === 'bone' ? 'text-bone/80' : 'text-ink/70'
                      )}
                    >
                      {s.name}
                    </span>
                  </div>
                  <div className="bg-canvas px-2.5 py-2 dark:bg-night-sub">
                    <p className="font-mono text-[0.72rem] font-medium text-ink dark:text-bone">
                      {s.name}
                    </p>
                    <p className="mt-0.5 break-all font-mono text-[0.62rem] leading-tight text-ink-mute dark:text-bone-mute">
                      {resolved[s.varName] ?? s.varName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <SemanticStates />
      </div>
    </Section>
  )
}

/** State-rich semantic vocabulary as the product register asks for. */
function SemanticStates() {
  const states: Array<{ label: string; node: ReactNode }> = [
    {
      label: 'success / volt',
      node: <Badge tone="volt">Published</Badge>,
    },
    {
      label: 'error / coral',
      node: <Badge tone="coral">Rejected</Badge>,
    },
    {
      label: 'info / iris',
      node: <Badge tone="iris">In review</Badge>,
    },
    {
      label: 'secondary / violet',
      node: <Badge tone="violet">Featured</Badge>,
    },
    {
      label: 'neutral',
      node: <Badge tone="neutral">Draft</Badge>,
    },
  ]
  return (
    <div>
      <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
        Semantic states
      </h3>
      <div className="flex flex-wrap gap-x-3 gap-y-4">
        {states.map((s) => (
          <Specimen key={s.label} caption={s.label} className="min-w-40 flex-1">
            {s.node}
          </Specimen>
        ))}
      </div>
    </div>
  )
}

/* ===========================================================================
 * FOUNDATIONS — Typography
 * ======================================================================== */

const TYPE_SCALE: Array<{ token: string; varName: string; sample: string; cls?: string }> = [
  {
    token: 'display-xl',
    varName: '--text-display-xl',
    sample: 'Electric',
    cls: 'display-condense',
  },
  { token: 'display-lg', varName: '--text-display-lg', sample: 'Deliberate', cls: 'display-tight' },
  {
    token: 'display-md',
    varName: '--text-display-md',
    sample: 'Alive market',
    cls: 'display-tight',
  },
  { token: 'display-sm', varName: '--text-display-sm', sample: 'Build & sell prompts' },
  { token: 'lead', varName: '--text-lead', sample: 'A lead paragraph sets the tone.' },
  { token: 'body', varName: '--text-body', sample: 'Body copy carries the reading load.' },
  { token: 'meta', varName: '--text-meta', sample: 'Meta — captions and secondary labels.' },
  { token: 'overline', varName: '--text-overline', sample: 'OVERLINE — SECTION KICKER' },
]

function TypographySection() {
  const resolvedScale = useResolvedVars(TYPE_SCALE.map((t) => t.varName))

  return (
    <Section
      id="foundations-type"
      eyebrow="Foundations"
      title="Typography"
      intro="Bricolage Grotesque carries display (variable width + grade), Hanken Grotesk reads body, JetBrains Mono runs numerals and code. Everything that scales uses clamp()."
    >
      <div className="space-y-9">
        {/* Families */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              role: 'Display',
              stack: 'Bricolage Grotesque',
              cls: 'font-display',
              sample: 'Aa Gg 1',
            },
            { role: 'Text', stack: 'Hanken Grotesk', cls: 'font-sans', sample: 'Aa Gg 2' },
            { role: 'Mono', stack: 'JetBrains Mono', cls: 'font-mono', sample: 'Aa Gg 3' },
          ].map((f) => (
            <div
              key={f.role}
              className="rounded-2xl border border-line bg-canvas-sub p-5 dark:border-night-line dark:bg-night-sub"
            >
              <p
                className={cn('text-ink dark:text-bone', f.cls)}
                style={{ fontSize: 'clamp(2rem,4vw,2.75rem)' }}
              >
                {f.sample}
              </p>
              <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-volt-700 dark:text-volt-300">
                {f.role}
              </p>
              <p className="mt-0.5 text-[0.82rem] text-ink-soft dark:text-bone-soft">{f.stack}</p>
            </div>
          ))}
        </div>

        {/* Scale */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Type scale
          </h3>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-canvas-sub dark:divide-night-line dark:border-night-line dark:bg-night-sub">
            {TYPE_SCALE.map((t) => {
              const isDisplay = t.token.startsWith('display')
              return (
                <li
                  key={t.token}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <div className="shrink-0 sm:w-44">
                    <p className="font-mono text-[0.78rem] font-medium text-ink dark:text-bone">
                      {t.token}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.64rem] leading-tight text-ink-mute dark:text-bone-mute">
                      {resolvedScale[t.varName] ?? t.varName}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'min-w-0 truncate text-ink dark:text-bone',
                      isDisplay ? 'font-display font-bold tracking-[-0.03em] display-tight' : '',
                      t.cls
                    )}
                    style={{ fontSize: `var(${t.varName})` }}
                  >
                    {t.sample}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Measure / readable column */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Body measure — 65–75ch
          </h3>
          <div className="rounded-2xl border border-line bg-canvas-sub p-6 dark:border-night-line dark:bg-night-sub">
            <p
              className="leading-[1.7] text-ink-soft dark:text-bone-soft"
              style={{ maxWidth: '68ch', textWrap: 'pretty' }}
            >
              PromptMarket is a marketplace for prompts, skills and MCP workflows. The reading
              column is capped near sixty-eight characters so long-form copy stays comfortable: the
              eye finds the next line without a hunting saccade, and the measure never stretches
              past the point where the reader loses their place. Korean copy keeps each word intact
              via{' '}
              <code className="font-mono text-[0.85em] text-ink dark:text-bone">
                word-break: keep-all
              </code>
              , so a tight column never splits a syllable block mid-word.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ===========================================================================
 * FOUNDATIONS — Spacing
 * ======================================================================== */

const SPACE_TOKENS: Array<{ token: string; varName: string }> = [
  { token: 'space-gap', varName: '--space-gap' },
  { token: 'space-gap-lg', varName: '--space-gap-lg' },
  { token: 'space-gutter', varName: '--space-gutter' },
  { token: 'space-section', varName: '--space-section' },
]

function SpacingSection() {
  const resolved = useResolvedVars(SPACE_TOKENS.map((t) => t.varName))
  return (
    <Section
      id="foundations-space"
      eyebrow="Foundations"
      title="Spacing"
      intro="Fluid spacing tokens give the editorial layout its breathing room. They scale with the viewport so rhythm holds from a 320px phone to a 1440px canvas."
    >
      <ul className="space-y-4">
        {SPACE_TOKENS.map((t) => (
          <li key={t.token} className="flex items-center gap-4">
            <div className="w-40 shrink-0">
              <p className="font-mono text-[0.78rem] font-medium text-ink dark:text-bone">
                {t.token}
              </p>
              <p className="mt-0.5 font-mono text-[0.64rem] text-ink-mute dark:text-bone-mute">
                {resolved[t.varName] ?? t.varName}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="h-7 rounded-md bg-volt-400 dark:bg-volt-600"
                style={{ width: `var(${t.varName})` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ===========================================================================
 * FOUNDATIONS — Radii
 * ======================================================================== */

const RADII: Array<{ token: string; cls: string }> = [
  { token: 'rounded-md', cls: 'rounded-md' },
  { token: 'rounded-xl', cls: 'rounded-xl' },
  { token: 'rounded-2xl', cls: 'rounded-2xl' },
  { token: 'rounded-3xl', cls: 'rounded-3xl' },
  { token: 'rounded-full', cls: 'rounded-full' },
]

function RadiiSection() {
  return (
    <Section
      id="foundations-radii"
      eyebrow="Foundations"
      title="Radii"
      intro="Cards round at 2xl, pills and buttons go full. Inputs sit at xl — soft enough to feel editorial, sharp enough to read as a control."
    >
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-4">
        {RADII.map((r) => (
          <li key={r.token} className="flex flex-col items-center gap-2.5">
            <div
              className={cn(
                'h-20 w-full border-2 border-volt-500 bg-volt-100 dark:border-volt-600 dark:bg-volt-900/40',
                r.cls
              )}
            />
            <p className="font-mono text-[0.72rem] text-ink-mute dark:text-bone-mute">{r.token}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ===========================================================================
 * FOUNDATIONS — Elevation
 * ======================================================================== */

function ElevationSection() {
  const shadows: Array<{ token: string; cls: string }> = [
    { token: 'surface-card (border, flat)', cls: '' },
    { token: 'shadow-sm', cls: 'shadow-sm' },
    { token: 'shadow-md', cls: 'shadow-md' },
    { token: 'shadow-xl shadow-ink/10', cls: 'shadow-xl shadow-ink/10 dark:shadow-night/40' },
  ]
  return (
    <Section
      id="foundations-elevation"
      eyebrow="Foundations"
      title="Elevation"
      intro="Depth is restrained — most surfaces lean on a 1px tinted border rather than shadow. Overlays (menus, dialogs) earn the deepest shadow as they float above content."
    >
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-5">
        {shadows.map((s) => (
          <li key={s.token} className="flex flex-col gap-3">
            <div
              className={cn(
                'flex h-24 items-center justify-center rounded-2xl border border-line bg-canvas dark:border-night-line dark:bg-night-sub',
                s.cls
              )}
            >
              <span className="font-display text-[0.9rem] font-semibold text-ink-soft dark:text-bone-soft">
                surface
              </span>
            </div>
            <p className="font-mono text-[0.72rem] text-ink-mute dark:text-bone-mute">{s.token}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ===========================================================================
 * FOUNDATIONS — Motion
 * ======================================================================== */

function MotionSection() {
  const [reduced, setReduced] = useState(false)
  const [pulse, setPulse] = useState(0)

  const easings: Array<{ token: string; value: string }> = [
    { token: '--ease-expo', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { token: '--ease-smooth', value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  ]
  const durations: Array<{ token: string; value: string }> = [
    { token: 'instant', value: '0.16s' },
    { token: 'base', value: '0.3s' },
    { token: 'reveal', value: '0.7s' },
    { token: 'overdrive', value: '0.9s' },
  ]

  return (
    <Section
      id="foundations-motion"
      eyebrow="Foundations"
      title="Motion"
      intro="Ease-out expo on hover and reveal — no bounce, no elastic. Every animation has a prefers-reduced-motion fallback baked into index.css."
    >
      <div className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-canvas-sub p-5 dark:border-night-line dark:bg-night-sub">
            <h3 className="font-display text-[0.95rem] font-bold tracking-tight text-ink dark:text-bone">
              Easing
            </h3>
            <ul className="mt-3 space-y-2">
              {easings.map((e) => (
                <li key={e.token} className="flex flex-col">
                  <span className="font-mono text-[0.74rem] font-medium text-ink dark:text-bone">
                    {e.token}
                  </span>
                  <span className="font-mono text-[0.64rem] text-ink-mute dark:text-bone-mute">
                    {e.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-canvas-sub p-5 dark:border-night-line dark:bg-night-sub">
            <h3 className="font-display text-[0.95rem] font-bold tracking-tight text-ink dark:text-bone">
              Duration
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {durations.map((d) => (
                <li key={d.token} className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[0.74rem] text-ink dark:text-bone">
                    {d.token}
                  </span>
                  <span className="font-mono text-[0.66rem] tabular-nums text-ink-mute dark:text-bone-mute">
                    {d.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Interactive demo */}
        <div className="rounded-2xl border border-line bg-canvas-sub p-6 dark:border-night-line dark:bg-night-sub">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-[0.95rem] font-bold tracking-tight text-ink dark:text-bone">
              Live demo
            </h3>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[0.8rem] text-ink-soft dark:text-bone-soft">
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
                className="size-4 accent-volt-600"
              />
              Simulate reduced-motion
            </label>
          </div>
          <p className="mt-2 max-w-[60ch] text-[0.82rem] leading-relaxed text-ink-mute dark:text-bone-mute">
            Trigger the reveal to see the expo ease-out. With reduced-motion the element simply
            appears — no transform, no transition.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button variant="soft" onClick={() => setPulse((p) => p + 1)}>
              Replay reveal
            </Button>
            <div
              key={pulse}
              className={cn(
                'flex h-16 w-44 items-center justify-center rounded-xl bg-ink font-display text-[0.85rem] font-semibold text-bone dark:bg-bone dark:text-ink',
                !reduced && 'animate-fade-up'
              )}
            >
              ease-out · expo
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ===========================================================================
 * COMPONENTS — Buttons
 * ======================================================================== */

const BTN_VARIANTS: ButtonVariant[] = ['primary', 'soft', 'outline', 'ghost', 'danger']
const BTN_SIZES: ButtonSize[] = ['sm', 'md', 'lg']

function ButtonsSection() {
  return (
    <Section
      id="components-buttons"
      eyebrow="Components"
      title="Buttons"
      intro="The canonical action primitive from @components/ui. Variants map to the palette; one primary per surface, everything else recedes."
    >
      <div className="space-y-7">
        {/* Variants × default state */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Variants
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-5">
            {BTN_VARIANTS.map((v) => (
              <Specimen key={v} caption={`variant="${v}"`} className="min-w-36 flex-1">
                <Button variant={v}>
                  {v === 'danger' ? 'Delete' : v === 'primary' ? 'Publish' : 'Action'}
                </Button>
              </Specimen>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Sizes
          </h3>
          <Specimen caption='size="sm" · "md" · "lg"'>
            {BTN_SIZES.map((s) => (
              <Button key={s} size={s} variant="primary">
                {s.toUpperCase()}
              </Button>
            ))}
          </Specimen>
        </div>

        {/* States */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            States
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-5">
            <Specimen caption="default" className="min-w-36 flex-1">
              <Button variant="primary">Publish</Button>
            </Specimen>
            <Specimen caption="with icon" className="min-w-36 flex-1">
              <Button variant="outline">
                <Sparkles aria-hidden />
                Generate
              </Button>
            </Specimen>
            <Specimen caption="loading" className="min-w-36 flex-1">
              <Button variant="primary" disabled>
                <Spinner size={16} />
                Saving…
              </Button>
            </Specimen>
            <Specimen caption="disabled" className="min-w-36 flex-1">
              <Button variant="primary" disabled>
                Publish
              </Button>
            </Specimen>
            <Specimen caption="asChild — renders an <a>" className="min-w-36 flex-1">
              <Button asChild variant="soft">
                <a href="#components-buttons">Link button</a>
              </Button>
            </Specimen>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ===========================================================================
 * COMPONENTS — Forms
 * ======================================================================== */

function FormsSection() {
  const checkboxId = useId()
  const [checked, setChecked] = useState(true)

  return (
    <Section
      id="components-forms"
      eyebrow="Components"
      title="Forms & fields"
      intro="Input, Textarea, Label and the Field wrapper share one surface and the coral invalid treatment. Field wires label, description and error to the control for assistive tech."
    >
      <div className="grid gap-x-8 gap-y-7 md:grid-cols-2">
        <Specimen caption="Input — default" className="min-w-0">
          <Input placeholder="claude-sonnet-4.6" className="max-w-xs" />
        </Specimen>
        <Specimen caption="Input — invalid" className="min-w-0">
          <Input invalid defaultValue="bad value" className="max-w-xs" />
        </Specimen>
        <Specimen caption="Input — disabled" className="min-w-0">
          <Input disabled placeholder="locked" className="max-w-xs" />
        </Specimen>
        <Specimen caption="Textarea — resizable" className="min-w-0">
          <Textarea placeholder="Describe your prompt…" className="max-w-xs" rows={3} />
        </Specimen>

        <div className="md:col-span-2">
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Field — wired states
          </h3>
          <div className="grid gap-6 rounded-2xl border border-line bg-canvas-sub p-6 dark:border-night-line dark:bg-night-sub sm:grid-cols-3">
            <Field label="Title" required description="Shown on the listing card.">
              {(control) => <Input {...control} placeholder="Senior code reviewer" />}
            </Field>
            <Field label="Slug" error="Already taken.">
              {(control) => <Input {...control} defaultValue="code-reviewer" invalid />}
            </Field>
            <Field label="Notes" description="Optional internal note.">
              {(control) => <Textarea {...control} rows={2} placeholder="…" />}
            </Field>
          </div>
        </div>

        <Specimen caption="Label + native checkbox" className="md:col-span-2">
          <span className="inline-flex items-center gap-2.5">
            <input
              id={checkboxId}
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="size-4 accent-volt-600 focus-volt"
            />
            <Label htmlFor={checkboxId}>Notify me on new sales</Label>
          </span>
        </Specimen>
      </div>
    </Section>
  )
}

/* ===========================================================================
 * COMPONENTS — Feedback (Badge, Card, Skeleton, EmptyState, Tabs)
 * ======================================================================== */

const BADGE_TONES: BadgeTone[] = ['neutral', 'volt', 'coral', 'violet', 'iris']

function FeedbackSection() {
  return (
    <Section
      id="components-feedback"
      eyebrow="Components"
      title="Surfaces & feedback"
      intro="Badges, cards, tabs and the loading / empty states the catalog actually ships. Skeletons over spinners for content; spinners only for in-flight actions."
    >
      <div className="space-y-9">
        {/* Badges */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Badge tones
          </h3>
          <Specimen caption="tone — neutral · volt · coral · violet · iris">
            {BADGE_TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Specimen>
        </div>

        {/* Cards — composed, never nested */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Card
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card padded={false}>
              <CardHeader>
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-volt-700 dark:text-volt-300">
                  Prompt
                </span>
                <h4 className="font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
                  Header · Body · Footer
                </h4>
              </CardHeader>
              <CardBody>
                <p className="text-[0.88rem] leading-relaxed text-ink-soft dark:text-bone-soft">
                  Composed from the Card subcomponents — each owns its own padding and divider so
                  the sections never nest a second card inside.
                </p>
              </CardBody>
              <CardFooter>
                <StarRating value={4.5} count={128} showLabel />
                <Button size="sm" variant="soft" className="ml-auto">
                  Open
                </Button>
              </CardFooter>
            </Card>

            <Card interactive>
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                interactive
              </p>
              <h4 className="mt-1.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
                Magnetic hover lift
              </h4>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-soft dark:text-bone-soft">
                The{' '}
                <code className="font-mono text-[0.85em] text-ink dark:text-bone">interactive</code>{' '}
                prop adds the eased translate-y lift used on clickable cards across the app. Hover
                to feel it.
              </p>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Tabs — Radix
          </h3>
          <DemoTabs />
        </div>

        {/* Loading */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Loading
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Specimen caption="Skeleton — shimmer sweep">
              <div className="w-full space-y-2.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Specimen>
            <Specimen caption="Spinner — in-flight action">
              <Spinner size={28} label="Loading…" />
            </Specimen>
          </div>
        </div>

        {/* Empty */}
        <div>
          <h3 className="mb-3.5 font-display text-[1.05rem] font-bold tracking-tight text-ink dark:text-bone">
            Empty state
          </h3>
          <EmptyState
            icon={Compass}
            title="No listings match those filters"
            description="Empty states teach the next step rather than dead-ending the user."
            action={
              <Button variant="soft" size="sm">
                Clear filters
              </Button>
            }
          />
        </div>
      </div>
    </Section>
  )
}

function DemoTabs() {
  return (
    <Tabs.Root defaultValue="overview" className="w-full">
      <Tabs.List
        aria-label="Demo tabs"
        className="inline-flex gap-1.5 rounded-2xl border border-line bg-canvas-sub p-1.5 dark:border-night-line dark:bg-night-sub"
      >
        {[
          ['overview', 'Overview'],
          ['readme', 'Readme'],
          ['reviews', 'Reviews'],
        ].map(([value, label]) => (
          <Tabs.Trigger
            key={value}
            value={value}
            className={cn(
              'rounded-xl px-4 py-2 text-[0.83rem] font-medium text-ink-soft motion-safe:transition ease-expo focus-volt dark:text-bone-soft',
              'data-[state=active]:bg-ink data-[state=active]:text-bone',
              'dark:data-[state=active]:bg-bone dark:data-[state=active]:text-ink'
            )}
          >
            {label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {[
        ['overview', 'A roving-tabindex Radix tablist with arrow-key navigation.'],
        ['readme', 'Each panel is associated with its trigger for screen readers.'],
        ['reviews', 'Active state uses the ink/bone pill, not a coloured underline.'],
      ].map(([value, copy]) => (
        <Tabs.Content
          key={value}
          value={value}
          className="mt-4 rounded-2xl border border-line bg-canvas-sub p-5 text-[0.88rem] leading-relaxed text-ink-soft focus-volt dark:border-night-line dark:bg-night-sub dark:text-bone-soft"
        >
          {copy}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}

/* ===========================================================================
 * COMPONENTS — Overlays (Dialog, Dropdown — escape overflow via portal)
 * ======================================================================== */

function OverlaysSection() {
  return (
    <Section
      id="components-overlays"
      eyebrow="Components"
      title="Overlays"
      intro="Dialogs and menus portal out of overflow and float on the deepest shadow. The theme toggle in the header is the live dropdown reference."
    >
      <div className="flex flex-wrap gap-x-4 gap-y-5">
        <Specimen caption="Dialog — Radix, focus-trapped & portalled" className="min-w-56 flex-1">
          <DemoDialog />
        </Specimen>
        <Specimen
          caption="Dropdown — see the Theme toggle in the header"
          className="min-w-56 flex-1"
        >
          <ThemeToggle />
        </Specimen>
      </div>
    </Section>
  )
}

function DemoDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="primary">Open dialog</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm motion-safe:animate-fade-in dark:bg-night/60" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2',
            'rounded-3xl border border-line bg-canvas p-6 shadow-xl shadow-ink/20 motion-safe:animate-fade-up',
            'dark:border-night-line dark:bg-night-sub dark:shadow-night/50'
          )}
        >
          <Dialog.Title className="font-display text-[1.25rem] font-bold tracking-tight text-ink dark:text-bone">
            Confirm publish
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft dark:text-bone-soft">
            Radix traps focus, restores it on close, and the panel is portalled so it never clips
            inside an overflow container.
          </Dialog.Description>
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button variant="primary">Publish</Button>
            </Dialog.Close>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-ink-mute hover:bg-canvas-sub hover:text-ink focus-volt dark:text-bone-mute dark:hover:bg-night-deep dark:hover:text-bone"
            >
              <X aria-hidden className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ===========================================================================
 * COMPONENTS — Signature (StarRating, tags, focus ring, live indicator)
 * ======================================================================== */

function SignatureSection() {
  const [rating, setRating] = useState(4)
  return (
    <Section
      id="components-signature"
      eyebrow="Components"
      title="Signature details"
      intro="The small brand-specific touches: the volt focus ring, the live indicator pulse, the lowercase mono tag, and the interactive star rating."
    >
      <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
        <Specimen caption="StarRating — read-only">
          <StarRating value={4.5} count={2310} showLabel />
        </Specimen>
        <Specimen caption="StarRating — interactive (arrow keys)">
          <span className="inline-flex items-center gap-3">
            <StarRating value={rating} size="lg" onChange={setRating} />
            <span className="font-mono text-[0.8rem] text-ink-mute dark:text-bone-mute">
              {rating}/5
            </span>
          </span>
        </Specimen>
        <Specimen caption="Tag — lowercase mono pill (.tag)">
          <span className="tag">claude</span>
          <span className="tag">mcp</span>
          <span className="tag">workflow</span>
        </Specimen>
        <Specimen caption="Focus ring — volt, Tab to it">
          <button
            type="button"
            className="focus-volt rounded-full bg-ink px-4 py-2 text-sm font-medium text-bone dark:bg-bone dark:text-ink"
          >
            Tab here
          </button>
        </Specimen>
        <Specimen caption="Live indicator — volt-pulse">
          <span className="inline-flex items-center gap-2 text-[0.85rem] text-ink-soft dark:text-bone-soft">
            <span aria-hidden className="size-2 rounded-full bg-volt-500 volt-pulse" />
            Live drops
          </span>
        </Specimen>
        <Specimen caption="Marker dot (.dot) between metadata">
          <span className="text-[0.85rem] text-ink-soft dark:text-bone-soft">
            Free
            <span className="dot" />
            12 reviews
            <span className="dot" />
            Claude
          </span>
        </Specimen>
      </div>
    </Section>
  )
}

/* ===========================================================================
 * Hooks — runtime token resolution + scrollspy
 * ======================================================================== */

/**
 * Resolve a set of CSS custom properties to their computed values. Re-reads on
 * theme flips so dark-mode tokens (e.g. night surfaces) report the right value.
 */
function useResolvedVars(varNames: string[]): Record<string, string> {
  const [resolved, setResolved] = useState<Record<string, string>>({})
  // Stable key so the effect re-runs only when the requested set changes.
  const key = varNames.join('|')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const names = key.split('|')

    const read = () => {
      const styles = getComputedStyle(document.documentElement)
      const next: Record<string, string> = {}
      for (const name of names) {
        next[name] = styles.getPropertyValue(name).trim()
      }
      setResolved(next)
    }

    read()
    // The theme store toggles `.dark` on <html>; observe it so values refresh.
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [key])

  return resolved
}

/** Highlights the section currently nearest the top of the viewport. */
function useScrollSpy(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)
  const idsKey = ids.join('|')
  const visible = useRef(new Map<string, number>())

  const recompute = useCallback(() => {
    let top: string | null = null
    let best = -Infinity
    for (const [id, ratio] of visible.current) {
      if (ratio > best) {
        best = ratio
        top = id
      }
    }
    if (top) setActive(top)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sectionIds = idsKey.split('|')
    const map = visible.current
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          if (entry.isIntersecting) map.set(id, entry.intersectionRatio)
          else map.delete(id)
        }
        recompute()
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.25, 0.5, 1] }
    )
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [idsKey, recompute])

  return active
}
