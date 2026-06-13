import { Root as LabelRoot } from '@radix-ui/react-label'
import { cn } from '@utils/cn'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

/**
 * Label — Radix-backed form label. Clicking it focuses its associated control
 * (incl. clicks landing on nested text), and it adds a coral `*` when `required`.
 */
export interface LabelProps extends ComponentPropsWithoutRef<typeof LabelRoot> {
  /** Show a required marker after the label text. */
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required = false, children, ...props },
  ref
) {
  return (
    <LabelRoot
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-ink dark:text-bone select-none',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-coral-deep dark:text-coral" aria-hidden>
          *
        </span>
      )}
    </LabelRoot>
  )
})
