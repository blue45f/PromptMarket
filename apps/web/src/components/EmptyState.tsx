import { createElement, type ReactNode } from 'react'
import { cn } from '@utils/cn'

/**
 * EmptyState tunes the "nothing here" screen to the page's *register* via
 * `variant`, so every empty state across the app reads with one consistent
 * visual language instead of ad-hoc one-offs:
 *
 * - `default`  — the classic centered card. Safe fallback for any empty slice
 *   (featured/trending sections, admin tables). Existing call sites keep this
 *   look unchanged.
 * - `discover` — browse/search/library results that came back empty. Same card,
 *   quieter so it never competes with the surrounding filters or grid.
 * - `gated`    — a precondition is unmet or the visitor's own surface is empty
 *   (your library / your listings / your wishlist). Slightly warmer accent on
 *   the medallion to read as "do this next", paired with `hint`.
 *
 * `hint` adds a short, action-oriented teaching line under the description —
 * what this surface produces or the single next step — so empty states carry
 * edge-case messaging rather than dead ends. Keep the existing brand surfaces
 * (rounded card, radial volt glow), no new visual primitives.
 */
type EmptyStateVariant = 'default' | 'discover' | 'gated'

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  /**
   * Short next-step / teaching line shown beneath the description. Pass a
   * translated string. Rendered for every variant when provided.
   */
  hint?: ReactNode
  action?: ReactNode
  variant?: EmptyStateVariant
  /** Heading element for the title so the page keeps a valid outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

/* Per-variant radial glow — same volt hue everywhere; `gated` warms the accent
 * to a coral hint so an unmet precondition reads as intentional, not broken. */
const GLOW: Record<EmptyStateVariant, string> = {
  default: 'radial-gradient(at 50% 0%, oklch(0.92 0.18 122 / 0.25) 0, transparent 55%)',
  discover: 'radial-gradient(at 50% 0%, oklch(0.92 0.18 122 / 0.2) 0, transparent 55%)',
  gated: 'radial-gradient(at 50% 0%, oklch(0.78 0.16 32 / 0.22) 0, transparent 55%)',
}

export default function EmptyState({
  emoji = '📭',
  title,
  description,
  hint,
  action,
  variant = 'default',
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const HeadingTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-3xl surface-card border-line dark:border-night-line text-center py-16 px-6',
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{ background: GLOW[variant] }}
      />
      <div className="text-[3.5rem] mb-3 leading-none" aria-hidden>
        {emoji}
      </div>
      {createElement(
        HeadingTag,
        {
          className: 'font-display text-[1.25rem] font-bold text-ink dark:text-bone tracking-tight',
        },
        title
      )}
      {description && (
        <p className="mt-2 text-sm text-ink-mute dark:text-bone-mute max-w-md mx-auto leading-relaxed [word-break:keep-all]">
          {description}
        </p>
      )}
      {hint && (
        <p className="mt-3 text-[0.8rem] text-ink-soft dark:text-bone-soft max-w-md mx-auto leading-relaxed [word-break:keep-all]">
          {hint}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
