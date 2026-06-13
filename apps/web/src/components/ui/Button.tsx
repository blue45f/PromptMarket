import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@utils/cn'

/**
 * Button — the canonical action primitive for the PromptMarket kit.
 *
 * Variants map to the editorial palette rather than ad-hoc colors:
 * - `primary` — ink-on-bone solid; the single dominant action on a surface.
 * - `soft`    — volt-tinted fill for affirmative-but-secondary actions.
 * - `outline` — line-bordered, transparent fill; pairs beside `primary`.
 * - `ghost`   — text-only until hovered; for low-emphasis / toolbar actions.
 * - `danger`  — coral fill for destructive confirmation.
 *
 * `asChild` renders the styling onto the child element (via Radix `Slot`) so a
 * router `<Link>` or `<a>` can adopt the button look without a nested control.
 */
export type ButtonVariant = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Render styles onto the single child element instead of a `<button>`. */
  asChild?: boolean
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'select-none whitespace-nowrap motion-safe:transition ease-expo focus-volt ' +
  'disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-bone hover:bg-ink-soft dark:bg-bone dark:text-ink dark:hover:bg-bone-soft',
  soft:
    'bg-volt-100 text-volt-800 hover:bg-volt-200 ' +
    'dark:bg-volt-900/40 dark:text-volt-200 dark:hover:bg-volt-900/60',
  outline:
    'border border-line-strong text-ink hover:bg-canvas-sub ' +
    'dark:border-night-line-strong dark:text-bone dark:hover:bg-night-sub',
  ghost:
    'text-ink-soft hover:bg-canvas-sub hover:text-ink ' +
    'dark:text-bone-soft dark:hover:bg-night-sub dark:hover:text-bone',
  danger: 'bg-coral text-bone hover:bg-coral-deep',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.78rem] [&_svg]:size-3.5',
  md: 'h-10 px-4 text-sm [&_svg]:size-4',
  lg: 'h-12 px-6 text-[0.95rem] [&_svg]:size-[1.125rem]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', asChild = false, className, type, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      // Slot forwards onto the child, which carries its own element type; only
      // a real <button> gets a default type so it never submits a form by accident.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  )
})
