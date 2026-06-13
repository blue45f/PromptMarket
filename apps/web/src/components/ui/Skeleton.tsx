import { cn } from '@utils/cn'
import { type HTMLAttributes } from 'react'

/**
 * Skeleton — a loading placeholder block. Uses the repo's `skeleton-shimmer`
 * sweep over a tinted fill (both respect `prefers-reduced-motion`). Defaults to
 * a rounded bar; override `className` for circles/blocks. Decorative by default.
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Set false on a host that already announces its own loading status. */
  decorative?: boolean
}

export function Skeleton({ className, decorative = true, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden={decorative || undefined}
      className={cn(
        'skeleton-shimmer motion-safe:animate-pulse rounded-md',
        'bg-canvas-deep dark:bg-night-sub',
        className
      )}
      {...props}
    />
  )
}
