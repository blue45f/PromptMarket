import { createElement, type ComponentType, type ReactNode } from 'react'
import { cn } from '@utils/cn'

/**
 * EmptyState — the kit's "nothing here" surface. Unlike the legacy emoji
 * variant, this primitive takes a lucide `icon` component so it composes with
 * the rest of the icon-driven UI. Centered card on the brand surface with a
 * soft volt glow; optional title-action pair for the next step.
 */
export interface EmptyStateProps {
  /** A lucide-react icon component (or any icon taking `className`). */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  description?: ReactNode
  action?: ReactNode
  /** Heading element for the title so the page keeps a valid outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const HeadingTag = `h${headingLevel}` as const

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-2xl surface-card text-center px-6 py-14',
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background: 'radial-gradient(at 50% 0%, oklch(0.92 0.18 122 / 0.22) 0, transparent 55%)',
        }}
      />
      {Icon && (
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-canvas-deep dark:bg-night-sub">
          <Icon className="size-6 text-ink-soft dark:text-bone-soft" aria-hidden />
        </span>
      )}
      {createElement(
        HeadingTag,
        {
          className: 'font-display text-lg font-bold tracking-tight text-ink dark:text-bone',
        },
        title
      )}
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-mute dark:text-bone-mute">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
