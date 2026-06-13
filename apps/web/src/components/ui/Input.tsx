import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@utils/cn'

/**
 * Input — single-line text control on the brand surface. `invalid` paints the
 * coral error border + ring; Field wires this to `aria-invalid` automatically.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const inputBaseClass =
  'w-full rounded-xl px-3.5 text-sm motion-safe:transition ease-expo ' +
  'border bg-canvas dark:bg-night-sub text-ink dark:text-bone ' +
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute ' +
  'focus:outline-none focus-visible:outline-none ' +
  'disabled:opacity-50 disabled:pointer-events-none'

const ENABLED_BORDER =
  'border-line dark:border-night-line ' +
  'focus:border-volt-500 focus:ring-2 focus:ring-volt-500/50'

const INVALID_BORDER =
  'border-coral dark:border-coral focus:border-coral focus:ring-2 focus:ring-coral/40'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, type = 'text', 'aria-invalid': ariaInvalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      className={cn(inputBaseClass, 'h-10', invalid ? INVALID_BORDER : ENABLED_BORDER, className)}
      {...props}
    />
  )
})
