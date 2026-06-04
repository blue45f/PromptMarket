import { cn } from '@utils/cn'

interface SkeletonCardProps {
  className?: string
  /** Optional seed (the card's index in the grid). Drives a deterministic
   *  pseudo-random title / description / pill width so adjacent skeletons
   *  read as a small variety of shapes instead of an obvious 4x repeat. */
  seed?: number
}

/** Pick a class by index from a small lookup. Stable across renders for a
 *  given seed, so the skeleton never reshapes mid-pulse. */
function pick<T>(opts: readonly T[], seed: number): T {
  return opts[Math.abs(seed) % opts.length] as T
}

const TITLE_W = ['w-3/4', 'w-2/3', 'w-4/5', 'w-3/5'] as const
const LINE_W = ['w-full', 'w-11/12', 'w-10/12'] as const
const LINE2_W = ['w-5/6', 'w-2/3', 'w-3/4', 'w-7/12'] as const
const PILL_W = ['w-12', 'w-16', 'w-10', 'w-14'] as const

export default function SkeletonCard({ className, seed = 0 }: SkeletonCardProps) {
  return (
    <div
      aria-hidden
      className={cn('surface-card skeleton-shimmer rounded-[1.4rem] overflow-hidden', className)}
    >
      <div className="aspect-[4/5] bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse" />
      <div className="p-4 space-y-3">
        <div
          className={cn(
            'h-4 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse',
            pick(TITLE_W, seed)
          )}
        />
        <div
          className={cn(
            'h-3 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse',
            pick(LINE_W, seed + 1)
          )}
        />
        <div
          className={cn(
            'h-3 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse',
            pick(LINE2_W, seed + 2)
          )}
        />
        <div className="flex items-center justify-between pt-3 border-t border-line dark:border-night-line">
          <div
            className={cn(
              'h-3 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse',
              pick(PILL_W, seed)
            )}
          />
          <div
            className={cn(
              'h-3 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse',
              pick(PILL_W, seed + 3)
            )}
          />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="cards-fluid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} seed={i} />
      ))}
    </div>
  )
}
