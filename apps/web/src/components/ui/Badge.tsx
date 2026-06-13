import { cn } from '@utils/cn'
import { forwardRef, type HTMLAttributes } from 'react'

/**
 * Badge — a compact status / metadata pill. Tones reuse the brand accents so
 * a badge never invents a color the rest of the surface doesn't already speak.
 */
export type BadgeTone = 'neutral' | 'volt' | 'coral' | 'violet' | 'iris'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const TONES: Record<BadgeTone, string> = {
  neutral:
    'bg-canvas-deep text-ink-soft border-line ' +
    'dark:bg-night-sub dark:text-bone-soft dark:border-night-line',
  volt:
    'bg-volt-100 text-volt-800 border-volt-200/70 ' +
    'dark:bg-volt-900/40 dark:text-volt-200 dark:border-volt-700/50',
  coral:
    'bg-coral/15 text-coral-deep border-coral/30 ' +
    'dark:bg-coral/20 dark:text-coral dark:border-coral/40',
  violet:
    'bg-violet-soft text-violet-deep border-violet/30 ' +
    'dark:bg-violet/20 dark:text-violet-soft dark:border-violet/40',
  iris:
    'bg-iris/15 text-iris-deep border-iris/30 ' +
    'dark:bg-iris/20 dark:text-iris dark:border-iris/40',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone = 'neutral', ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ' +
          'text-[0.72rem] font-medium leading-5 [&_svg]:size-3 [&_svg]:shrink-0',
        TONES[tone],
        className
      )}
      {...props}
    />
  )
})
