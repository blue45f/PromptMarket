import { cn } from '@utils/cn'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

import { inputBaseClass } from './Input'

/**
 * Textarea — multi-line companion to Input. Shares the same surface tokens and
 * the coral `invalid` treatment so forms read consistently.
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

const ENABLED_BORDER =
  'border-line dark:border-night-line ' +
  'focus:border-volt-500 focus:ring-2 focus:ring-volt-500/50'

const INVALID_BORDER =
  'border-coral dark:border-coral focus:border-coral focus:ring-2 focus:ring-coral/40'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid = false, rows = 4, 'aria-invalid': ariaInvalid, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      className={cn(
        inputBaseClass,
        'min-h-20 py-2.5 leading-relaxed resize-y',
        invalid ? INVALID_BORDER : ENABLED_BORDER,
        className
      )}
      {...props}
    />
  )
})
