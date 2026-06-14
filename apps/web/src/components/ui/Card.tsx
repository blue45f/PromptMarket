import { cn } from '@utils/cn'
import { forwardRef, type HTMLAttributes } from 'react'

/**
 * Card — the standard bordered surface, built on the repo's `surface-card`
 * utility so it tracks the canvas/night tokens automatically.
 *
 * - `interactive` adds the magnetic hover lift used elsewhere on clickable cards.
 * - `padded` (default) applies a comfortable inset; turn it off when composing
 *   with the Header/Body/Footer subcomponents, which own their own padding.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padded?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, padded = true, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'surface-card rounded-2xl',
        padded && 'p-5',
        interactive && 'lift-on-hover hover:border-line-strong dark:hover:border-night-line-strong',
        className
      )}
      {...props}
    />
  )
})

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-1 px-5 pt-5 pb-3 border-b border-line dark:border-night-line',
          className
        )}
        {...props}
      />
    )
  }
)

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...props }, ref) {
    return <div ref={ref} className={cn('px-5 py-4', className)} {...props} />
  }
)

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 px-5 pt-3 pb-5 border-t border-line dark:border-night-line',
          className
        )}
        {...props}
      />
    )
  }
)
